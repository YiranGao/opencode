// src/config.ts
var DEFAULTS = {
  url: "",
  token: "",
  jwtApiUrl: "",
  jwtApiAuth: "",
  logSource: 7,
  retries: 3,
  timeoutMs: 5000,
  enabled: true
};
var ENV = {
  url: "OPENCODE_DIFF_DETAIL_URL",
  token: "OPENCODE_DIFF_DETAIL_TOKEN",
  jwtApiUrl: "OPENCODE_USER_ID_ENDPOINT",
  jwtApiAuth: "OPENCODE_USER_ID_X-Blackbox-Auth",
  logSource: "OPENCODE_DIFF_DETAIL_LOG_SOURCE",
  retries: "OPENCODE_DIFF_DETAIL_RETRIES",
  timeoutMs: "OPENCODE_DIFF_DETAIL_TIMEOUT_MS",
  enabled: "OPENCODE_DIFF_DETAIL_ENABLED"
};
function pickString(env, option, fallback) {
  if (typeof env === "string" && env.length > 0)
    return env;
  if (typeof option === "string" && option.length > 0)
    return option;
  return fallback;
}
function pickNumber(env, option, fallback) {
  if (typeof env === "string" && env.length > 0) {
    const parsed = Number(env);
    if (Number.isFinite(parsed))
      return parsed;
  }
  if (typeof option === "number" && Number.isFinite(option))
    return option;
  return fallback;
}
function pickBoolean(env, option, fallback) {
  if (typeof env === "string" && env.length > 0)
    return env !== "0" && env.toLowerCase() !== "false";
  if (typeof option === "boolean")
    return option;
  return fallback;
}
function resolveConfig(options = {}) {
  const env = process.env;
  return {
    url: pickString(env[ENV.url], options["url"], DEFAULTS.url),
    token: pickString(env[ENV.token], options["token"], DEFAULTS.token),
    jwtApiUrl: pickString(env[ENV.jwtApiUrl], options["jwtApiUrl"], DEFAULTS.jwtApiUrl),
    jwtApiAuth: pickString(env[ENV.jwtApiAuth], options["jwtApiAuth"], DEFAULTS.jwtApiAuth),
    logSource: pickNumber(env[ENV.logSource], options["logSource"], DEFAULTS.logSource),
    retries: Math.max(0, pickNumber(env[ENV.retries], options["retries"], DEFAULTS.retries)),
    timeoutMs: Math.max(1, pickNumber(env[ENV.timeoutMs], options["timeoutMs"], DEFAULTS.timeoutMs)),
    enabled: pickBoolean(env[ENV.enabled], options["enabled"], DEFAULTS.enabled)
  };
}

// src/diff.ts
import path from "node:path";
// node_modules/diff/libesm/diff/base.js
class Diff {
  diff(oldStr, newStr, options = {}) {
    let callback;
    if (typeof options === "function") {
      callback = options;
      options = {};
    } else if ("callback" in options) {
      callback = options.callback;
    }
    const oldString = this.castInput(oldStr, options);
    const newString = this.castInput(newStr, options);
    const oldTokens = this.removeEmpty(this.tokenize(oldString, options));
    const newTokens = this.removeEmpty(this.tokenize(newString, options));
    return this.diffWithOptionsObj(oldTokens, newTokens, options, callback);
  }
  diffWithOptionsObj(oldTokens, newTokens, options, callback) {
    var _a;
    const done = (value) => {
      value = this.postProcess(value, options);
      if (callback) {
        setTimeout(function() {
          callback(value);
        }, 0);
        return;
      } else {
        return value;
      }
    };
    const newLen = newTokens.length, oldLen = oldTokens.length;
    let editLength = 1;
    let maxEditLength = newLen + oldLen;
    if (options.maxEditLength != null) {
      maxEditLength = Math.min(maxEditLength, options.maxEditLength);
    }
    const maxExecutionTime = (_a = options.timeout) !== null && _a !== undefined ? _a : Infinity;
    const abortAfterTimestamp = Date.now() + maxExecutionTime;
    const bestPath = [{ oldPos: -1, lastComponent: undefined }];
    let newPos = this.extractCommon(bestPath[0], newTokens, oldTokens, 0, options);
    if (bestPath[0].oldPos + 1 >= oldLen && newPos + 1 >= newLen) {
      return done(this.buildValues(bestPath[0].lastComponent, newTokens, oldTokens));
    }
    let minDiagonalToConsider = -Infinity, maxDiagonalToConsider = Infinity;
    const execEditLength = () => {
      for (let diagonalPath = Math.max(minDiagonalToConsider, -editLength);diagonalPath <= Math.min(maxDiagonalToConsider, editLength); diagonalPath += 2) {
        let basePath;
        const removePath = bestPath[diagonalPath - 1], addPath = bestPath[diagonalPath + 1];
        if (removePath) {
          bestPath[diagonalPath - 1] = undefined;
        }
        let canAdd = false;
        if (addPath) {
          const addPathNewPos = addPath.oldPos - diagonalPath;
          canAdd = addPath && 0 <= addPathNewPos && addPathNewPos < newLen;
        }
        const canRemove = removePath && removePath.oldPos + 1 < oldLen;
        if (!canAdd && !canRemove) {
          bestPath[diagonalPath] = undefined;
          continue;
        }
        if (!canRemove || canAdd && removePath.oldPos < addPath.oldPos) {
          basePath = this.addToPath(addPath, true, false, 0, options);
        } else {
          basePath = this.addToPath(removePath, false, true, 1, options);
        }
        newPos = this.extractCommon(basePath, newTokens, oldTokens, diagonalPath, options);
        if (basePath.oldPos + 1 >= oldLen && newPos + 1 >= newLen) {
          return done(this.buildValues(basePath.lastComponent, newTokens, oldTokens)) || true;
        } else {
          bestPath[diagonalPath] = basePath;
          if (basePath.oldPos + 1 >= oldLen) {
            maxDiagonalToConsider = Math.min(maxDiagonalToConsider, diagonalPath - 1);
          }
          if (newPos + 1 >= newLen) {
            minDiagonalToConsider = Math.max(minDiagonalToConsider, diagonalPath + 1);
          }
        }
      }
      editLength++;
    };
    if (callback) {
      (function exec() {
        setTimeout(function() {
          if (editLength > maxEditLength || Date.now() > abortAfterTimestamp) {
            return callback(undefined);
          }
          if (!execEditLength()) {
            exec();
          }
        }, 0);
      })();
    } else {
      while (editLength <= maxEditLength && Date.now() <= abortAfterTimestamp) {
        const ret = execEditLength();
        if (ret) {
          return ret;
        }
      }
    }
  }
  addToPath(path, added, removed, oldPosInc, options) {
    const last = path.lastComponent;
    if (last && !options.oneChangePerToken && last.added === added && last.removed === removed) {
      return {
        oldPos: path.oldPos + oldPosInc,
        lastComponent: { count: last.count + 1, added, removed, previousComponent: last.previousComponent }
      };
    } else {
      return {
        oldPos: path.oldPos + oldPosInc,
        lastComponent: { count: 1, added, removed, previousComponent: last }
      };
    }
  }
  extractCommon(basePath, newTokens, oldTokens, diagonalPath, options) {
    const newLen = newTokens.length, oldLen = oldTokens.length;
    let oldPos = basePath.oldPos, newPos = oldPos - diagonalPath, commonCount = 0;
    while (newPos + 1 < newLen && oldPos + 1 < oldLen && this.equals(oldTokens[oldPos + 1], newTokens[newPos + 1], options)) {
      newPos++;
      oldPos++;
      commonCount++;
      if (options.oneChangePerToken) {
        basePath.lastComponent = { count: 1, previousComponent: basePath.lastComponent, added: false, removed: false };
      }
    }
    if (commonCount && !options.oneChangePerToken) {
      basePath.lastComponent = { count: commonCount, previousComponent: basePath.lastComponent, added: false, removed: false };
    }
    basePath.oldPos = oldPos;
    return newPos;
  }
  equals(left, right, options) {
    if (options.comparator) {
      return options.comparator(left, right);
    } else {
      return left === right || !!options.ignoreCase && left.toLowerCase() === right.toLowerCase();
    }
  }
  removeEmpty(array) {
    const ret = [];
    for (let i = 0;i < array.length; i++) {
      if (array[i]) {
        ret.push(array[i]);
      }
    }
    return ret;
  }
  castInput(value, options) {
    return value;
  }
  tokenize(value, options) {
    return Array.from(value);
  }
  join(chars) {
    return chars.join("");
  }
  postProcess(changeObjects, options) {
    return changeObjects;
  }
  get useLongestToken() {
    return false;
  }
  buildValues(lastComponent, newTokens, oldTokens) {
    const components = [];
    let nextComponent;
    while (lastComponent) {
      components.push(lastComponent);
      nextComponent = lastComponent.previousComponent;
      delete lastComponent.previousComponent;
      lastComponent = nextComponent;
    }
    components.reverse();
    const componentLen = components.length;
    let componentPos = 0, newPos = 0, oldPos = 0;
    for (;componentPos < componentLen; componentPos++) {
      const component = components[componentPos];
      if (!component.removed) {
        if (!component.added && this.useLongestToken) {
          let value = newTokens.slice(newPos, newPos + component.count);
          value = value.map(function(value2, i) {
            const oldValue = oldTokens[oldPos + i];
            return oldValue.length > value2.length ? oldValue : value2;
          });
          component.value = this.join(value);
        } else {
          component.value = this.join(newTokens.slice(newPos, newPos + component.count));
        }
        newPos += component.count;
        if (!component.added) {
          oldPos += component.count;
        }
      } else {
        component.value = this.join(oldTokens.slice(oldPos, oldPos + component.count));
        oldPos += component.count;
      }
    }
    return components;
  }
}

// node_modules/diff/libesm/diff/line.js
class LineDiff extends Diff {
  constructor() {
    super(...arguments);
    this.tokenize = tokenize;
  }
  equals(left, right, options) {
    if (options.ignoreWhitespace) {
      if (!options.newlineIsToken || !left.includes(`
`)) {
        left = left.trim();
      }
      if (!options.newlineIsToken || !right.includes(`
`)) {
        right = right.trim();
      }
    } else if (options.ignoreNewlineAtEof && !options.newlineIsToken) {
      if (left.endsWith(`
`)) {
        left = left.slice(0, -1);
      }
      if (right.endsWith(`
`)) {
        right = right.slice(0, -1);
      }
    }
    return super.equals(left, right, options);
  }
}
var lineDiff = new LineDiff;
function diffLines(oldStr, newStr, options) {
  return lineDiff.diff(oldStr, newStr, options);
}
function tokenize(value, options) {
  if (options.stripTrailingCr) {
    value = value.replace(/\r\n/g, `
`);
  }
  const retLines = [], linesAndNewlines = value.split(/(\n|\r\n)/);
  if (!linesAndNewlines[linesAndNewlines.length - 1]) {
    linesAndNewlines.pop();
  }
  for (let i = 0;i < linesAndNewlines.length; i++) {
    const line = linesAndNewlines[i];
    if (i % 2 && !options.newlineIsToken) {
      retLines[retLines.length - 1] += line;
    } else {
      retLines.push(line);
    }
  }
  return retLines;
}

// node_modules/diff/libesm/patch/create.js
function structuredPatch(oldFileName, newFileName, oldStr, newStr, oldHeader, newHeader, options) {
  let optionsObj;
  if (!options) {
    optionsObj = {};
  } else if (typeof options === "function") {
    optionsObj = { callback: options };
  } else {
    optionsObj = options;
  }
  if (typeof optionsObj.context === "undefined") {
    optionsObj.context = 4;
  }
  const context = optionsObj.context;
  if (optionsObj.newlineIsToken) {
    throw new Error("newlineIsToken may not be used with patch-generation functions, only with diffing functions");
  }
  if (!optionsObj.callback) {
    return diffLinesResultToPatch(diffLines(oldStr, newStr, optionsObj));
  } else {
    const { callback } = optionsObj;
    diffLines(oldStr, newStr, Object.assign(Object.assign({}, optionsObj), { callback: (diff) => {
      const patch = diffLinesResultToPatch(diff);
      callback(patch);
    } }));
  }
  function diffLinesResultToPatch(diff) {
    if (!diff) {
      return;
    }
    diff.push({ value: "", lines: [] });
    function contextLines(lines) {
      return lines.map(function(entry) {
        return " " + entry;
      });
    }
    const hunks = [];
    let oldRangeStart = 0, newRangeStart = 0, curRange = [], oldLine = 1, newLine = 1;
    for (let i = 0;i < diff.length; i++) {
      const current = diff[i], lines = current.lines || splitLines(current.value);
      current.lines = lines;
      if (current.added || current.removed) {
        if (!oldRangeStart) {
          const prev = diff[i - 1];
          oldRangeStart = oldLine;
          newRangeStart = newLine;
          if (prev) {
            curRange = context > 0 ? contextLines(prev.lines.slice(-context)) : [];
            oldRangeStart -= curRange.length;
            newRangeStart -= curRange.length;
          }
        }
        for (const line of lines) {
          curRange.push((current.added ? "+" : "-") + line);
        }
        if (current.added) {
          newLine += lines.length;
        } else {
          oldLine += lines.length;
        }
      } else {
        if (oldRangeStart) {
          if (lines.length <= context * 2 && i < diff.length - 2) {
            for (const line of contextLines(lines)) {
              curRange.push(line);
            }
          } else {
            const contextSize = Math.min(lines.length, context);
            for (const line of contextLines(lines.slice(0, contextSize))) {
              curRange.push(line);
            }
            const hunk = {
              oldStart: oldRangeStart,
              oldLines: oldLine - oldRangeStart + contextSize,
              newStart: newRangeStart,
              newLines: newLine - newRangeStart + contextSize,
              lines: curRange
            };
            hunks.push(hunk);
            oldRangeStart = 0;
            newRangeStart = 0;
            curRange = [];
          }
        }
        oldLine += lines.length;
        newLine += lines.length;
      }
    }
    for (const hunk of hunks) {
      for (let i = 0;i < hunk.lines.length; i++) {
        if (hunk.lines[i].endsWith(`
`)) {
          hunk.lines[i] = hunk.lines[i].slice(0, -1);
        } else {
          hunk.lines.splice(i + 1, 0, "\\ No newline at end of file");
          i++;
        }
      }
    }
    return {
      oldFileName,
      newFileName,
      oldHeader,
      newHeader,
      hunks
    };
  }
}
function splitLines(text) {
  const hasTrailingNl = text.endsWith(`
`);
  const result = text.split(`
`).map((line) => line + `
`);
  if (hasTrailingNl) {
    result.pop();
  } else {
    result.push(result.pop().slice(0, -1));
  }
  return result;
}
// src/diff.ts
function asString(value) {
  return typeof value === "string" ? value : undefined;
}
function extractHunks(patch) {
  const lines = patch.split(`
`);
  const start = lines.findIndex((line) => line.startsWith("@@"));
  if (start < 0)
    return;
  return lines.slice(start).join(`
`).replace(/\n+$/, "");
}
function collectLines(hunks, prefix) {
  return hunks.split(`
`).filter((line) => line.startsWith(prefix) && !line.startsWith(prefix + prefix + prefix)).map((line) => line.slice(1)).join(`
`);
}
function wrapGitPatch(file, role, hunks) {
  const oldMarker = role === "added" ? "/dev/null" : `a/${file}`;
  return [`diff --git a/${file} b/${file}`, `--- ${oldMarker}`, `+++ b/${file}`, hunks, ""].join(`
`);
}
function fromBeforeAfter(file, before, after) {
  const sp = structuredPatch(file, file, before, after, "", "", { context: 3 });
  if (sp.hunks.length === 0)
    return;
  const hunks = sp.hunks.map((h) => `@@ -${h.oldStart},${h.oldLines} +${h.newStart},${h.newLines} @@
${h.lines.join(`
`)}`).join(`
`);
  const role = before === "" ? "added" : after === "" ? "deleted" : "modified";
  return { gitPatch: wrapGitPatch(file, role, hunks), hunks };
}
function normalize(raw) {
  const file = asString(raw.file);
  if (!file)
    return;
  const patch = asString(raw.patch);
  const before = asString(raw.before);
  const after = asString(raw.after);
  const status = asString(raw.status);
  let role;
  if (status === "added" || status === "deleted" || status === "modified") {
    role = status;
  } else if (before === "" && after !== undefined) {
    role = "added";
  } else if (after === "" && before !== undefined) {
    role = "deleted";
  } else {
    role = "modified";
  }
  let hunks;
  let gitPatch;
  if (patch && patch.length > 0) {
    hunks = extractHunks(patch);
    if (hunks !== undefined)
      gitPatch = wrapGitPatch(file, role, hunks);
  } else if (before !== undefined && after !== undefined) {
    const generated = fromBeforeAfter(file, before, after);
    if (generated) {
      hunks = generated.hunks;
      gitPatch = generated.gitPatch;
    }
  }
  if (hunks === undefined)
    return;
  const contentKey = role === "deleted" ? collectLines(hunks, "-") : collectLines(hunks, "+");
  return {
    file,
    role,
    gitPatch: role === "deleted" ? undefined : gitPatch,
    contentKey
  };
}
function transformDiffs(raw, worktree) {
  if (!Array.isArray(raw))
    return [];
  const items = raw.map((item) => typeof item === "object" && item !== null ? normalize(item) : undefined).filter((item) => item !== undefined);
  const deletedKeys = new Set(items.filter((i) => i.role === "deleted").map((i) => i.contentKey));
  const changes = [];
  for (const item of items) {
    if (item.role === "deleted")
      continue;
    if (!item.gitPatch)
      continue;
    if (item.role === "added" && deletedKeys.has(item.contentKey))
      continue;
    changes.push({
      filePath: path.join(worktree, item.file),
      status: item.role === "added" ? "added" : "modified",
      patch: item.gitPatch
    });
  }
  return changes;
}

// src/git.ts
import { execFile } from "node:child_process";
import { promisify } from "node:util";
var execFileAsync = promisify(execFile);
var MAX_BUFFER = 64 * 1024 * 1024;
async function git(args, cwd) {
  try {
    const { stdout, stderr } = await execFileAsync("git", args, {
      cwd,
      maxBuffer: MAX_BUFFER,
      encoding: "utf8"
    });
    return { ok: true, stdout, stderr };
  } catch (error) {
    const stdout = typeof error.stdout === "string" ? error.stdout : "";
    const stderr = typeof error.stderr === "string" ? error.stderr : "";
    return { ok: false, stdout, stderr };
  }
}
async function branchName(worktree) {
  const result = await git(["symbolic-ref", "--short", "HEAD"], worktree);
  if (!result.ok)
    return "";
  return result.stdout.trim();
}
var remoteInfoCache = new Map;
async function remoteInfo(worktree) {
  const cached = remoteInfoCache.get(worktree);
  if (cached)
    return cached;
  const result = { projectName: "", repoName: "" };
  const gitResult = await git(["remote", "get-url", "origin"], worktree);
  if (gitResult.ok) {
    const url = gitResult.stdout.trim();
    if (url) {
      const withoutTrailingSlash = url.replace(/\/+$/, "");
      const lastSegment = withoutTrailingSlash.split(/[/:]/).pop() ?? "";
      result.projectName = lastSegment.replace(/\.git$/, "");
      let path2 = url;
      path2 = path2.replace(/^[a-z]+:\/\//, "");
      path2 = path2.replace(/^[^@/]+@/, "");
      const sshMatch = path2.match(/^[^:]+:\d+\/(.+)$/);
      if (sshMatch) {
        result.repoName = sshMatch[1].replace(/\.git$/, "").replace(/\/+$/, "");
      } else {
        const httpsMatch = path2.match(/^[^/]+\/(.+)$/);
        if (httpsMatch) {
          result.repoName = httpsMatch[1].replace(/\.git$/, "").replace(/\/+$/, "");
        } else {
          const scpMatch = path2.match(/^[^:]+:(.+)$/);
          if (scpMatch) {
            result.repoName = scpMatch[1].replace(/\.git$/, "").replace(/\/+$/, "");
          } else {
            result.repoName = path2.replace(/\.git$/, "").replace(/\/+$/, "");
          }
        }
      }
    }
  }
  remoteInfoCache.set(worktree, result);
  return result;
}

// src/reporter.ts
var BACKOFF_MS = [200, 500, 1000, 2000, 5000];
function sleep(ms) {
  return new Promise((resolve) => setTimeout(resolve, ms));
}

class Reporter {
  config;
  log;
  onFailure;
  queue = Promise.resolve();
  circuitOpen = false;
  circuitOpenUntil = 0;
  CIRCUIT_FAILURE_THRESHOLD = 10;
  CIRCUIT_COOLDOWN_MS = 60000;
  consecutiveFailures = 0;
  consecutiveSuccesses = 0;
  totalDroppedFiles = 0;
  RECOVERY_SUCCESS_THRESHOLD = 3;
  turnNotificationSent = false;
  constructor(config, log, onFailure) {
    this.config = config;
    this.log = log;
    this.onFailure = onFailure;
  }
  enqueue(payloads) {
    if (!this.config.enabled) {
      return this.queue;
    }
    if (!this.config.url || !this.config.token) {
      this.log("error", "上报配置缺失（url/token 为空），跳过", { files: payloads.length });
      return this.queue;
    }
    this.turnNotificationSent = false;
    this.queue = this.queue.then(async () => {
      for (const payload of payloads) {
        await this.sendWithRetry(payload);
      }
    });
    return this.queue;
  }
  async drain() {
    await this.queue;
  }
  async sendWithRetry(payload) {
    if (this.circuitOpen) {
      if (Date.now() < this.circuitOpenUntil) {
        this.totalDroppedFiles++;
        return;
      }
      this.circuitOpen = false;
      this.log("info", "失败保护已解除，尝试恢复上报", { file: payload.file_path });
    }
    const attempts = this.config.retries + 1;
    for (let attempt = 0;attempt < attempts; attempt++) {
      if (attempt > 0) {
        const delay = BACKOFF_MS[Math.min(attempt - 1, BACKOFF_MS.length - 1)] ?? 1000;
        await sleep(delay);
      }
      const error = await this.send(payload);
      if (!error) {
        this.handleSuccess();
        return;
      }
    }
    this.log("error", "重试后仍失败，丢弃", { retries: this.config.retries, file: payload.file_path });
    this.handleFailure();
  }
  handleSuccess() {
    this.consecutiveSuccesses++;
    if (this.consecutiveFailures > 0 && this.consecutiveSuccesses >= this.RECOVERY_SUCCESS_THRESHOLD) {
      const dropped = this.totalDroppedFiles;
      this.consecutiveFailures = 0;
      this.totalDroppedFiles = 0;
      this.consecutiveSuccesses = 0;
      this.circuitOpen = false;
      this.log("info", "ES 上报已恢复", { previouslyDropped: dropped });
    }
  }
  handleFailure() {
    this.consecutiveFailures++;
    this.consecutiveSuccesses = 0;
    this.totalDroppedFiles++;
    if (this.consecutiveFailures >= this.CIRCUIT_FAILURE_THRESHOLD && !this.circuitOpen) {
      this.circuitOpen = true;
      this.circuitOpenUntil = Date.now() + this.CIRCUIT_COOLDOWN_MS;
      this.log("error", "连续失败保护已启用，后续文件将直接跳过", {
        failures: this.consecutiveFailures,
        cooldownMs: this.CIRCUIT_COOLDOWN_MS
      });
    }
    if (this.onFailure && !this.turnNotificationSent) {
      this.turnNotificationSent = true;
      const message = this.consecutiveFailures === 1 ? `ES 上报失败，数据已重试 ${this.config.retries} 次仍未成功，详见 opencode 日志` : `ES 连续失败 ${this.consecutiveFailures} 次，请检查网络（详见 opencode 日志）`;
      this.onFailure(message);
    }
  }
  async send(payload) {
    const controller = new AbortController;
    const timer = setTimeout(() => controller.abort(), this.config.timeoutMs);
    try {
      const response = await fetch(this.config.url, {
        method: "POST",
        headers: {
          "content-type": "application/json",
          token: this.config.token
        },
        body: JSON.stringify(payload),
        signal: controller.signal
      });
      if (!response.ok)
        return `HTTP ${response.status}`;
      return;
    } catch (error) {
      if (error instanceof Error && error.name === "AbortError")
        return `超时 ${this.config.timeoutMs}ms`;
      return error instanceof Error ? error.message : String(error);
    } finally {
      clearTimeout(timer);
    }
  }
}

// src/jwt.ts
var REQUEST_TIMEOUT_MS = 5000;
var RETRY_DELAYS = [500, 1000, 2000];
async function resolveUser(apiKey, jwtApiUrl, jwtApiAuth, log) {
  const failed = { userId: "", userName: "", resolved: false };
  if (!apiKey) {
    log("warn", "apiKey 为空，跳过 /jwt/queryUserByToken 调用");
    return failed;
  }
  if (!jwtApiUrl || !jwtApiAuth) {
    log("error", "/jwt/queryUserByToken 接口地址或鉴权值未配置，跳过用户解析", {
      hasUrl: !!jwtApiUrl,
      hasAuth: !!jwtApiAuth
    });
    return failed;
  }
  for (let attempt = 0;attempt <= RETRY_DELAYS.length; attempt++) {
    const controller = new AbortController;
    const timer = setTimeout(() => controller.abort(), REQUEST_TIMEOUT_MS);
    try {
      const response = await fetch(jwtApiUrl, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          "X-Blackbox-Auth": jwtApiAuth
        },
        body: JSON.stringify({ token: apiKey }),
        signal: controller.signal
      });
      if (!response.ok) {
        if (response.status >= 400 && response.status < 500) {
          return failed;
        }
        throw new Error(`HTTP ${response.status}`);
      }
      const data = await response.json();
      if (data.code !== 0 || !data.result) {
        log("error", "/jwt/queryUserByToken 返回业务错误，不可重试", { code: data.code, msg: data.msg });
        return failed;
      }
      const ssicNo = data.result.ssicNo;
      const fullName = data.result.fullName;
      if (typeof ssicNo !== "string" || ssicNo.length === 0 || typeof fullName !== "string" || fullName.length === 0) {
        return failed;
      }
      log("info", "/jwt/queryUserByToken 解析用户成功", {
        userId: ssicNo,
        userName: fullName
      });
      return {
        userId: ssicNo,
        userName: fullName,
        resolved: true
      };
    } catch (error) {
      if (error instanceof SyntaxError) {
        return failed;
      }
      const isTimeout = error instanceof Error && error.name === "AbortError";
      const reason = isTimeout ? `超时 ${REQUEST_TIMEOUT_MS}ms` : error instanceof Error ? error.message : String(error);
      if (attempt < RETRY_DELAYS.length) {
        const delay = RETRY_DELAYS[attempt];
        await new Promise((resolve) => setTimeout(resolve, delay));
      } else {
        log("error", "/jwt/queryUserByToken 调用最终失败，将静默不上报", { reason });
        return failed;
      }
    } finally {
      clearTimeout(timer);
    }
  }
  return failed;
}

// src/server.ts
function isRecord(value) {
  return typeof value === "object" && value !== null && !Array.isArray(value);
}
function asString2(value) {
  return typeof value === "string" && value.length > 0 ? value : undefined;
}
var server_default = {
  id: "opencode.diff-detail",
  server: async (input, options) => {
    const config = resolveConfig(options ?? {});
    const log = (level, message, extra) => {
      input.client.app.log({ body: { service: "diff-detail", level, message, extra }, query: { directory: input.directory } }).catch(() => {});
    };
    const reporter = new Reporter(config, log, (message) => {
      input.client.tui.showToast({
        body: {
          variant: "error",
          title: "代码统计",
          message,
          duration: 5000
        }
      }).catch(() => {});
    });
    const reportingReady = !!config.url && !!config.token;
    if (!reportingReady) {
      log("error", "ES 上报配置缺失（url/token），插件将不上报", {
        hasUrl: !!config.url,
        hasToken: !!config.token,
        hint: "请通过环境变量 OPENCODE_DIFF_DETAIL_URL / OPENCODE_DIFF_DETAIL_TOKEN 配置"
      });
    }
    const backgroundSessions = new Set;
    let snapshotEnabled = true;
    const userInfo = {
      userId: "",
      userName: ""
    };
    let jwtInProgress = false;
    let jwtFirstFailureNotified = false;
    let resolvedApiKey = "";
    function triggerJwtResolution() {
      if (jwtInProgress)
        return;
      if (!resolvedApiKey)
        return;
      jwtInProgress = true;
      resolveUser(resolvedApiKey, config.jwtApiUrl, config.jwtApiAuth, log).then((result) => {
        jwtInProgress = false;
        if (result.resolved) {
          userInfo.userId = result.userId;
          userInfo.userName = result.userName;
          jwtFirstFailureNotified = false;
          log("info", "JWT 用户信息已更新，缓存到内存", { userId: result.userId, userName: result.userName });
        } else {
          if (!jwtFirstFailureNotified) {
            jwtFirstFailureNotified = true;
            input.client.tui.showToast({
              body: {
                variant: "warning",
                title: "代码统计",
                message: "JWT 用户信息获取失败，代码统计将暂停，服务恢复后将自动重试（详见 opencode 日志）",
                duration: 8000
              }
            }).catch(() => {});
          }
          log("error", "JWT 用户解析失败，下次 turn 将自动重试", {});
        }
      }).catch((error) => {
        jwtInProgress = false;
        log("error", "JWT 用户解析意外异常", { reason: String(error) });
      });
    }
    async function shouldReport(sessionID) {
      if (backgroundSessions.delete(sessionID))
        return true;
      try {
        const response = await input.client.session.get({
          path: { id: sessionID },
          query: { directory: input.directory }
        });
        const parentID = isRecord(response.data) ? asString2(response.data["parentID"]) : undefined;
        return parentID === undefined;
      } catch (error) {
        log("warn", "读取 session 失败，按根 session 处理", { sessionID, reason: String(error) });
        return true;
      }
    }
    async function lastUserMessageID(sessionID) {
      const response = await input.client.session.messages({
        path: { id: sessionID },
        query: { directory: input.directory }
      });
      const list = Array.isArray(response.data) ? response.data : [];
      for (let i = list.length - 1;i >= 0; i--) {
        const info = isRecord(list[i]) ? list[i]["info"] : undefined;
        if (isRecord(info) && info["role"] === "user")
          return asString2(info["id"]);
      }
      return;
    }
    async function handleTurnEnd(sessionID) {
      try {
        if (!snapshotEnabled)
          return;
        if (!userInfo.userId) {
          triggerJwtResolution();
          log("debug", "JWT 用户信息未就绪，跳过本 turn 上报", { sessionID });
          return;
        }
        if (!reportingReady)
          return;
        if (!await shouldReport(sessionID))
          return;
        const messageID = await lastUserMessageID(sessionID);
        if (!messageID)
          return;
        const response = await input.client.session.diff({
          path: { id: sessionID },
          query: { directory: input.directory, messageID }
        });
        const changes = transformDiffs(response.data, input.worktree);
        if (changes.length === 0)
          return;
        const [branch, remote] = await Promise.all([branchName(input.worktree), remoteInfo(input.worktree)]);
        const timestamp = Date.now();
        const payloads = changes.map((change) => ({
          user_id: userInfo.userId,
          file_path: change.filePath,
          branch_name: branch,
          project_name: remote.projectName,
          user_name: userInfo.userName,
          diff_info: change.patch,
          timestamp,
          log_source: config.logSource,
          repo: remote.repoName
        }));
        log("info", "turn 结束上报", { sessionID, files: payloads.length });
        reporter.enqueue(payloads);
      } catch (error) {
        log("error", "处理 turn 结束失败", { sessionID, reason: String(error) });
      }
    }
    return {
      config: async (loaded) => {
        snapshotEnabled = loaded.snapshot !== false;
        if (!snapshotEnabled)
          log("warn", "opencode snapshot 已关闭，无法统计代码量");
        resolvedApiKey = extractApiKey(loaded);
        if (!resolvedApiKey) {
          log("warn", "未从 provider 配置中找到 apiKey，跳过 JWT 用户解析", {});
          return;
        }
        triggerJwtResolution();
      },
      event: async ({ event }) => {
        if (event.type === "session.deleted") {
          const info = isRecord(event.properties.info) ? event.properties.info : undefined;
          const deletedID = info ? asString2(info["id"]) : undefined;
          if (deletedID)
            backgroundSessions.delete(deletedID);
          return;
        }
        if (event.type !== "session.idle")
          return;
        const sessionID = asString2(event.properties.sessionID);
        if (!sessionID)
          return;
        handleTurnEnd(sessionID);
      },
      "tool.execute.after": async (toolInput, output) => {
        if (toolInput.tool !== "task")
          return;
        const metadata = output.metadata;
        if (!isRecord(metadata))
          return;
        if (metadata["background"] !== true)
          return;
        const childSessionID = asString2(metadata["sessionId"]);
        if (!childSessionID)
          return;
        backgroundSessions.add(childSessionID);
      },
      dispose: async () => {
        await reporter.drain();
      }
    };
  }
};
var PREFERRED_PROVIDER_NAMES = ["enterprise-llm"];
function extractApiKey(loaded) {
  if (!isRecord(loaded))
    return "";
  const provider = loaded["provider"];
  if (!isRecord(provider))
    return "";
  for (const name of PREFERRED_PROVIDER_NAMES) {
    const value = provider[name];
    if (!isRecord(value))
      continue;
    const options = value["options"];
    if (!isRecord(options))
      continue;
    const apiKey = asString2(options["apiKey"]);
    if (apiKey)
      return apiKey;
  }
  for (const value of Object.values(provider)) {
    if (!isRecord(value))
      continue;
    const options = value["options"];
    if (!isRecord(options))
      continue;
    const apiKey = asString2(options["apiKey"]);
    if (apiKey)
      return apiKey;
  }
  return "";
}
export {
  server_default as default
};
