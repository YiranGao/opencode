// src/config.ts
var DEFAULTS = {
  url: "",
  token: "",
  jwtApiUrl: "",
  jwtApiAuth: "",
  logSource: 7,
  retries: 3,
  timeoutMs: 5000,
  enabled: true,
  circuitFailureThreshold: 10,
  circuitCooldownMs: 60000,
  walEnabled: true,
  walDir: "",
  walMaxBytes: 52428800,
  walReplayBatch: 20,
  walAuthTtlMs: 604800000,
  nestedReposEnabled: true,
  shadowDir: "",
  gitTimeoutMs: 30000,
  nestedInitBudgetMs: 1e4,
  nestedTurnBudgetMs: 20000,
  nestedRepoConcurrency: 2,
  nestedFileConcurrency: 4,
  maxNestedRepos: 64,
  maxDiscoveryEntries: 200000,
  maxNestedFilesPerRepoPerTurn: 200,
  maxNestedFilesPerTurn: 500,
  maxNestedFileBytes: 2097152,
  maxNestedPatchBytesPerFile: 1048576,
  maxNestedPatchBytesPerTurn: 8388608,
  maxQueueBytes: 67108864,
  maxQueueFiles: 1e4,
  shutdownBudgetMs: 5000,
  walReadChunkBytes: 1048576
};
var ENV = {
  url: "OPENCODE_DIFF_DETAIL_URL",
  token: "OPENCODE_DIFF_DETAIL_TOKEN",
  jwtApiUrl: "OPENCODE_USER_ID_ENDPOINT",
  jwtApiAuth: "OPENCODE_USER_ID_X-Blackbox-Auth",
  logSource: "OPENCODE_DIFF_DETAIL_LOG_SOURCE",
  retries: "OPENCODE_DIFF_DETAIL_RETRIES",
  timeoutMs: "OPENCODE_DIFF_DETAIL_TIMEOUT_MS",
  enabled: "OPENCODE_DIFF_DETAIL_ENABLED",
  circuitFailureThreshold: "OPENCODE_DIFF_DETAIL_CIRCUIT_THRESHOLD",
  circuitCooldownMs: "OPENCODE_DIFF_DETAIL_CIRCUIT_COOLDOWN_MS",
  walEnabled: "OPENCODE_DIFF_DETAIL_WAL_ENABLED",
  walDir: "OPENCODE_DIFF_DETAIL_WAL_DIR",
  walMaxBytes: "OPENCODE_DIFF_DETAIL_WAL_MAX_BYTES",
  walReplayBatch: "OPENCODE_DIFF_DETAIL_WAL_REPLAY_BATCH",
  walAuthTtlMs: "OPENCODE_DIFF_DETAIL_WAL_AUTH_TTL_MS",
  nestedReposEnabled: "OPENCODE_DIFF_DETAIL_NESTED_REPOS_ENABLED",
  shadowDir: "OPENCODE_DIFF_DETAIL_SHADOW_DIR",
  gitTimeoutMs: "OPENCODE_DIFF_DETAIL_GIT_TIMEOUT_MS",
  nestedInitBudgetMs: "OPENCODE_DIFF_DETAIL_NESTED_INIT_BUDGET_MS",
  nestedTurnBudgetMs: "OPENCODE_DIFF_DETAIL_NESTED_TURN_BUDGET_MS",
  nestedRepoConcurrency: "OPENCODE_DIFF_DETAIL_NESTED_REPO_CONCURRENCY",
  nestedFileConcurrency: "OPENCODE_DIFF_DETAIL_NESTED_FILE_CONCURRENCY",
  maxNestedRepos: "OPENCODE_DIFF_DETAIL_MAX_NESTED_REPOS",
  maxDiscoveryEntries: "OPENCODE_DIFF_DETAIL_MAX_DISCOVERY_ENTRIES",
  maxNestedFilesPerRepoPerTurn: "OPENCODE_DIFF_DETAIL_MAX_NESTED_FILES_PER_REPO",
  maxNestedFilesPerTurn: "OPENCODE_DIFF_DETAIL_MAX_NESTED_FILES_PER_TURN",
  maxNestedFileBytes: "OPENCODE_DIFF_DETAIL_MAX_NESTED_FILE_BYTES",
  maxNestedPatchBytesPerFile: "OPENCODE_DIFF_DETAIL_MAX_NESTED_PATCH_BYTES_PER_FILE",
  maxNestedPatchBytesPerTurn: "OPENCODE_DIFF_DETAIL_MAX_NESTED_PATCH_BYTES_PER_TURN",
  maxQueueBytes: "OPENCODE_DIFF_DETAIL_MAX_QUEUE_BYTES",
  maxQueueFiles: "OPENCODE_DIFF_DETAIL_MAX_QUEUE_FILES",
  shutdownBudgetMs: "OPENCODE_DIFF_DETAIL_SHUTDOWN_BUDGET_MS",
  walReadChunkBytes: "OPENCODE_DIFF_DETAIL_WAL_READ_CHUNK_BYTES"
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
    enabled: pickBoolean(env[ENV.enabled], options["enabled"], DEFAULTS.enabled),
    circuitFailureThreshold: Math.max(1, Math.trunc(pickNumber(env[ENV.circuitFailureThreshold], options["circuitFailureThreshold"], DEFAULTS.circuitFailureThreshold))),
    circuitCooldownMs: Math.max(1000, pickNumber(env[ENV.circuitCooldownMs], options["circuitCooldownMs"], DEFAULTS.circuitCooldownMs)),
    walEnabled: pickBoolean(env[ENV.walEnabled], options["walEnabled"], DEFAULTS.walEnabled),
    walDir: pickString(env[ENV.walDir], options["walDir"], DEFAULTS.walDir),
    walMaxBytes: Math.max(1048576, pickNumber(env[ENV.walMaxBytes], options["walMaxBytes"], DEFAULTS.walMaxBytes)),
    walReplayBatch: Math.min(200, Math.max(1, Math.trunc(pickNumber(env[ENV.walReplayBatch], options["walReplayBatch"], DEFAULTS.walReplayBatch)))),
    walAuthTtlMs: Math.max(3600000, pickNumber(env[ENV.walAuthTtlMs], options["walAuthTtlMs"], DEFAULTS.walAuthTtlMs)),
    nestedReposEnabled: pickBoolean(env[ENV.nestedReposEnabled], options["nestedReposEnabled"], DEFAULTS.nestedReposEnabled),
    shadowDir: pickString(env[ENV.shadowDir], options["shadowDir"], DEFAULTS.shadowDir),
    gitTimeoutMs: Math.max(1, pickNumber(env[ENV.gitTimeoutMs], options["gitTimeoutMs"], DEFAULTS.gitTimeoutMs)),
    nestedInitBudgetMs: Math.max(1, pickNumber(env[ENV.nestedInitBudgetMs], options["nestedInitBudgetMs"], DEFAULTS.nestedInitBudgetMs)),
    nestedTurnBudgetMs: Math.max(1, pickNumber(env[ENV.nestedTurnBudgetMs], options["nestedTurnBudgetMs"], DEFAULTS.nestedTurnBudgetMs)),
    nestedRepoConcurrency: Math.max(1, Math.trunc(pickNumber(env[ENV.nestedRepoConcurrency], options["nestedRepoConcurrency"], DEFAULTS.nestedRepoConcurrency))),
    nestedFileConcurrency: Math.max(1, Math.trunc(pickNumber(env[ENV.nestedFileConcurrency], options["nestedFileConcurrency"], DEFAULTS.nestedFileConcurrency))),
    maxNestedRepos: Math.max(1, Math.trunc(pickNumber(env[ENV.maxNestedRepos], options["maxNestedRepos"], DEFAULTS.maxNestedRepos))),
    maxDiscoveryEntries: Math.max(1, Math.trunc(pickNumber(env[ENV.maxDiscoveryEntries], options["maxDiscoveryEntries"], DEFAULTS.maxDiscoveryEntries))),
    maxNestedFilesPerRepoPerTurn: Math.max(1, Math.trunc(pickNumber(env[ENV.maxNestedFilesPerRepoPerTurn], options["maxNestedFilesPerRepoPerTurn"], DEFAULTS.maxNestedFilesPerRepoPerTurn))),
    maxNestedFilesPerTurn: Math.max(1, Math.trunc(pickNumber(env[ENV.maxNestedFilesPerTurn], options["maxNestedFilesPerTurn"], DEFAULTS.maxNestedFilesPerTurn))),
    maxNestedFileBytes: Math.max(1, pickNumber(env[ENV.maxNestedFileBytes], options["maxNestedFileBytes"], DEFAULTS.maxNestedFileBytes)),
    maxNestedPatchBytesPerFile: Math.max(1, pickNumber(env[ENV.maxNestedPatchBytesPerFile], options["maxNestedPatchBytesPerFile"], DEFAULTS.maxNestedPatchBytesPerFile)),
    maxNestedPatchBytesPerTurn: Math.max(1, pickNumber(env[ENV.maxNestedPatchBytesPerTurn], options["maxNestedPatchBytesPerTurn"], DEFAULTS.maxNestedPatchBytesPerTurn)),
    maxQueueBytes: Math.max(1, pickNumber(env[ENV.maxQueueBytes], options["maxQueueBytes"], DEFAULTS.maxQueueBytes)),
    maxQueueFiles: Math.max(1, Math.trunc(pickNumber(env[ENV.maxQueueFiles], options["maxQueueFiles"], DEFAULTS.maxQueueFiles))),
    shutdownBudgetMs: Math.max(1, pickNumber(env[ENV.shutdownBudgetMs], options["shutdownBudgetMs"], DEFAULTS.shutdownBudgetMs)),
    walReadChunkBytes: Math.max(1, pickNumber(env[ENV.walReadChunkBytes], options["walReadChunkBytes"], DEFAULTS.walReadChunkBytes))
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
          value = value.map(function(value, i) {
            const oldValue = oldTokens[oldPos + i];
            return oldValue.length > value.length ? oldValue : value;
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
function quoteGitPath(value) {
  return /[\n\r"\\]/.test(value) ? JSON.stringify(value) : value;
}
function wrapGitPatch(file, role, hunks) {
  const oldMarker = role === "added" ? "/dev/null" : quoteGitPath(`a/${file}`);
  const newMarker = role === "deleted" ? "/dev/null" : quoteGitPath(`b/${file}`);
  return [
    `diff --git ${quoteGitPath(`a/${file}`)} ${quoteGitPath(`b/${file}`)}`,
    `--- ${oldMarker}`,
    `+++ ${newMarker}`,
    hunks,
    ""
  ].join(`
`);
}
function createStructuredPatch(file, role, before, after) {
  const sp = structuredPatch(file, file, before, after, "", "", { context: 3 });
  if (sp.hunks.length === 0)
    return;
  const hunks = sp.hunks.map((h) => `@@ -${h.oldStart},${h.oldLines} +${h.newStart},${h.newLines} @@
${h.lines.join(`
`)}`).join(`
`);
  let additions = 0;
  let deletions = 0;
  for (const hunk of sp.hunks) {
    for (const line of hunk.lines) {
      if (line.startsWith("+") && !line.startsWith("+++"))
        additions++;
      if (line.startsWith("-") && !line.startsWith("---"))
        deletions++;
    }
  }
  return { gitPatch: wrapGitPatch(file, role, hunks), hunks, additions, deletions };
}
function fromBeforeAfter(file, role, before, after) {
  return createStructuredPatch(file, role, before, after);
}
function buildGitPatch(repoFilePath, status, before, after) {
  const result = createStructuredPatch(repoFilePath, status, before, after);
  if (!result)
    return;
  return { patch: result.gitPatch, additions: result.additions, deletions: result.deletions };
}
function normalize(raw, onAmbiguousEmpty) {
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
  } else if (patch && /^--- \/dev\/null$/m.test(patch)) {
    role = "added";
  } else if (patch && /^\+\+\+ \/dev\/null$/m.test(patch)) {
    role = "deleted";
  } else if (patch) {
    role = "modified";
  } else {
    if (before === "" || after === "")
      onAmbiguousEmpty?.(file);
    if (before === "" && after !== undefined)
      role = "added";
    else if (after === "" && before !== undefined)
      role = "deleted";
    else
      role = "modified";
  }
  let hunks;
  let gitPatch;
  if (patch && patch.length > 0) {
    hunks = extractHunks(patch);
    if (hunks !== undefined)
      gitPatch = wrapGitPatch(file, role, hunks);
  } else if (before !== undefined && after !== undefined) {
    const generated = fromBeforeAfter(file, role, before, after);
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
function transformDiffs(raw, worktree, onAmbiguousEmpty) {
  if (!Array.isArray(raw))
    return [];
  const items = raw.map((item) => typeof item === "object" && item !== null ? normalize(item, onAmbiguousEmpty) : undefined).filter((item) => item !== undefined);
  const deleted = items.filter((item) => item.role === "deleted");
  const changes = [];
  for (const item of items) {
    if (item.role === "deleted")
      continue;
    if (!item.gitPatch)
      continue;
    const pureRename = item.role === "added" && deleted.some((candidate) => candidate.contentKey === item.contentKey && candidate.file !== item.file);
    if (pureRename)
      continue;
    const filePath = path.resolve(worktree, item.file);
    const repoFilePath = path.relative(worktree, filePath).replaceAll("\\", "/");
    if (repoFilePath === ".." || repoFilePath.startsWith("../") || path.isAbsolute(repoFilePath))
      continue;
    changes.push({
      filePath,
      repoFilePath,
      status: item.role === "added" ? "added" : "modified",
      patch: item.gitPatch
    });
  }
  return changes;
}

// src/git.ts
import { execFile } from "node:child_process";
var MAX_BUFFER = 64 * 1024 * 1024;
var DEFAULT_TIMEOUT_MS = 30000;
function isRecord(value) {
  return typeof value === "object" && value !== null;
}
function text(value) {
  return typeof value === "string" ? value : value.toString("utf8");
}
async function git(args, options) {
  const startedAt = Date.now();
  const encoding = options.encoding === undefined ? "utf8" : options.encoding;
  return new Promise((resolve) => {
    const finish = (error, stdout, stderr) => {
      const aborted = options.signal?.aborted === true || isRecord(error) && error["name"] === "AbortError";
      const timedOut = !aborted && isRecord(error) && (error["killed"] === true || error["code"] === "ETIMEDOUT");
      resolve({
        ok: error === null,
        stdout,
        stderr,
        timedOut,
        aborted,
        durationMs: Date.now() - startedAt
      });
    };
    let stdinError;
    try {
      const child = execFile("git", args, {
        cwd: options.cwd,
        timeout: options.timeoutMs ?? DEFAULT_TIMEOUT_MS,
        signal: options.signal,
        maxBuffer: options.maxBuffer ?? MAX_BUFFER,
        encoding
      }, (error, stdout, stderr) => {
        let diagnostic = stderr;
        if (text(diagnostic).length === 0 && stdinError instanceof Error)
          diagnostic = stdinError.message;
        else if (text(diagnostic).length === 0 && stdinError !== undefined)
          diagnostic = String(stdinError);
        finish(error ?? (stdinError ?? null), stdout, diagnostic);
      });
      if (options.stdin !== undefined) {
        child.stdin?.on("error", (error) => {
          stdinError ??= error;
        });
        child.stdin?.end(options.stdin);
      }
    } catch (error) {
      const empty = encoding === null ? Buffer.alloc(0) : "";
      finish(error instanceof Error ? error : new Error(String(error)), empty, empty);
    }
  });
}
async function branchName(worktree, signal) {
  const result = await git(["symbolic-ref", "--short", "HEAD"], { cwd: worktree, signal });
  if (!result.ok)
    return "";
  return text(result.stdout).trim();
}
var remoteInfoCache = new Map;
async function remoteInfo(worktree, signal) {
  const cached = remoteInfoCache.get(worktree);
  if (cached)
    return cached;
  const result = { projectName: "", repoName: "" };
  const gitResult = await git(["remote", "get-url", "origin"], { cwd: worktree, signal });
  if (gitResult.ok) {
    const url = text(gitResult.stdout).trim();
    if (url) {
      const withoutTrailingSlash = url.replace(/\/+$/, "");
      const lastSegment = withoutTrailingSlash.split(/[/:]/).pop() ?? "";
      result.projectName = lastSegment.replace(/\.git$/, "");
      let path = url;
      path = path.replace(/^[a-z]+:\/\//, "");
      path = path.replace(/^[^@/]+@/, "");
      const sshMatch = path.match(/^[^:]+:\d+\/(.+)$/);
      const scpMatch = path.match(/^[^:]+:(.+)$/);
      const httpsMatch = path.match(/^[^/]+\/(.+)$/);
      if (sshMatch) {
        result.repoName = sshMatch[1].replace(/\.git$/, "").replace(/\/+$/, "");
      } else if (scpMatch) {
        result.repoName = scpMatch[1].replace(/\.git$/, "").replace(/\/+$/, "");
      } else if (httpsMatch) {
        result.repoName = httpsMatch[1].replace(/\.git$/, "").replace(/\/+$/, "");
      } else {
        result.repoName = path.replace(/\.git$/, "").replace(/\/+$/, "");
      }
    }
  }
  remoteInfoCache.set(worktree, result);
  return result;
}

// src/reporter-queue.ts
class ReporterQueue {
  maxFiles;
  maxBytes;
  tail = Promise.resolve();
  queuedFiles = 0;
  queuedBytes = 0;
  queueRejects = 0;
  queueSpills = 0;
  accepting = true;
  pendingAccepts = new Set;
  constructor(maxFiles, maxBytes) {
    this.maxFiles = maxFiles;
    this.maxBytes = maxBytes;
  }
  tryEnqueue(payloads, tasks, options = {}) {
    const signal = options.signal;
    if (!this.accepting || signal?.aborted) {
      this.queueRejects++;
      return Promise.resolve("rejected");
    }
    if (payloads.length === 0)
      return Promise.resolve("queued");
    const bytes = payloads.reduce((total, payload) => total + Buffer.byteLength(JSON.stringify(payload)), 0);
    if (this.queuedFiles + payloads.length <= this.maxFiles && this.queuedBytes + bytes <= this.maxBytes) {
      this.queuedFiles += payloads.length;
      this.queuedBytes += bytes;
      this.tail = this.tail.then(tasks.sendBatch).finally(() => {
        this.queuedFiles -= payloads.length;
        this.queuedBytes -= bytes;
      });
      return Promise.resolve("queued");
    }
    return this.spill(payloads, tasks.spillOne, signal);
  }
  schedule(operation) {
    this.tail = this.tail.then(operation);
  }
  async wait() {
    await this.tail;
  }
  async drain(compact) {
    this.schedule(async () => {
      compact();
    });
    await this.tail;
  }
  shutdown() {
    this.accepting = false;
    for (const pending of this.pendingAccepts)
      pending.reject();
    this.pendingAccepts.clear();
  }
  status() {
    return {
      queuedFiles: this.queuedFiles,
      queuedBytes: this.queuedBytes,
      queueRejects: this.queueRejects,
      queueSpills: this.queueSpills
    };
  }
  spill(payloads, spillOne, signal) {
    let started = false;
    let cancelled = false;
    let settled = false;
    let resolveTask;
    const completed = new Promise((resolve) => {
      resolveTask = resolve;
    });
    const pending = {
      reject: () => {
        if (settled)
          return;
        cancelled = true;
        settled = true;
        this.queueRejects++;
        resolveTask?.("rejected");
      }
    };
    this.pendingAccepts.add(pending);
    const finish = (outcome) => {
      if (settled)
        return;
      settled = true;
      if (outcome === "spilled")
        this.queueSpills++;
      else
        this.queueRejects++;
      resolveTask?.(outcome);
    };
    const onAbort = () => pending.reject();
    signal?.addEventListener("abort", onAbort, { once: true });
    this.tail = this.tail.then(async () => {
      if (cancelled || signal?.aborted) {
        pending.reject();
        return;
      }
      started = true;
      for (const payload of payloads) {
        if (cancelled || signal?.aborted) {
          pending.reject();
          break;
        }
        if (!spillOne(payload)) {
          finish("rejected");
          break;
        }
      }
      if (!settled)
        finish("spilled");
    }).finally(() => {
      if (!started && !settled)
        pending.reject();
      signal?.removeEventListener("abort", onAbort);
      this.pendingAccepts.delete(pending);
      if (!settled)
        finish(cancelled ? "rejected" : "spilled");
    });
    return completed;
  }
}

// src/wal.ts
import {
  appendFileSync,
  closeSync,
  existsSync,
  mkdirSync,
  openSync,
  readFileSync,
  readSync,
  renameSync,
  statSync,
  unlinkSync,
  writeFileSync
} from "node:fs";
import { open } from "node:fs/promises";
import os from "node:os";
import path2 from "node:path";

// src/wal-payload.ts
function isRecord2(value) {
  return typeof value === "object" && value !== null && !Array.isArray(value);
}
function text2(record, key) {
  const value = record[key];
  return typeof value === "string" ? value : "";
}
function number(record, key) {
  const value = record[key];
  return typeof value === "number" && Number.isFinite(value) ? value : 0;
}
function parseWalPayload(value) {
  if (!isRecord2(value))
    return;
  const filePath = text2(value, "file_path");
  if (!filePath)
    return;
  return {
    user_id: text2(value, "user_id"),
    file_path: filePath,
    repo_file_path: text2(value, "repo_file_path") || filePath,
    branch_name: text2(value, "branch_name"),
    project_name: text2(value, "project_name"),
    user_name: text2(value, "user_name"),
    diff_info: text2(value, "diff_info"),
    timestamp: number(value, "timestamp"),
    log_source: number(value, "log_source"),
    repo: text2(value, "repo")
  };
}

// src/wal-stream.ts
class WalReadBuffer {
  buffer = Buffer.alloc(0);
  readPosition = 0;
  cursor = 0;
  readBytes = 0;
  reset(cursor) {
    this.buffer = Buffer.alloc(0);
    this.cursor = cursor;
    this.readPosition = cursor;
  }
  get position() {
    return this.cursor;
  }
  get readBytesTotal() {
    return this.readBytes;
  }
  async readLine(handle, fileSize, chunkBytes) {
    for (;; ) {
      const newline = this.buffer.indexOf(10);
      if (newline >= 0) {
        return {
          text: this.buffer.subarray(0, newline).toString("utf8"),
          bytes: newline + 1
        };
      }
      if (this.readPosition >= fileSize) {
        if (this.buffer.length === 0)
          return;
        return { text: this.buffer.toString("utf8"), bytes: this.buffer.length };
      }
      const length = Math.min(chunkBytes, fileSize - this.readPosition);
      const chunk = Buffer.alloc(length);
      const { bytesRead } = await handle.read(chunk, 0, length, this.readPosition);
      if (bytesRead === 0) {
        if (this.buffer.length === 0)
          return;
        return { text: this.buffer.toString("utf8"), bytes: this.buffer.length };
      }
      this.readPosition += bytesRead;
      this.readBytes += bytesRead;
      this.buffer = Buffer.concat([this.buffer, chunk.subarray(0, bytesRead)]);
    }
  }
  consume(line) {
    this.buffer = this.buffer.subarray(line.bytes);
    this.cursor += line.bytes;
  }
}

// src/wal.ts
function defaultDir() {
  return path2.join(os.homedir(), ".local", "share", "opencode", "diff-detail");
}

class WalStore {
  opts;
  log;
  onRotate;
  filePath;
  backupPath;
  offsetPath;
  pendingPath;
  readBuffer = new WalReadBuffer;
  pendingKnown = false;
  lostOnRotate = 0;
  rotations = 0;
  available = false;
  offset = 0;
  fileSize = 0;
  pendingCached = 0;
  fallbackTs = Date.now();
  constructor(opts, log, onRotate) {
    this.opts = opts;
    this.log = log;
    this.onRotate = onRotate;
    const dir = opts.dir || defaultDir();
    this.filePath = path2.join(dir, "wal.ndjson");
    this.backupPath = `${this.filePath}.1`;
    this.offsetPath = path2.join(dir, "wal.offset");
    this.pendingPath = path2.join(dir, "wal.pending");
    if (opts.enabled)
      this.init(dir);
  }
  init(dir) {
    try {
      mkdirSync(dir, { recursive: true });
      this.fileSize = existsSync(this.filePath) ? statSync(this.filePath).size : 0;
      this.fallbackTs = existsSync(this.filePath) ? statSync(this.filePath).mtimeMs : Date.now();
      this.offset = this.readOffset();
      if (this.offset > this.fileSize) {
        this.offset = this.fileSize;
        writeFileSync(this.offsetPath, String(this.offset));
      }
      this.pendingCached = this.readPendingSidecar(this.fallbackTs) ?? this.countPending();
      this.pendingKnown = true;
      this.readBuffer.reset(this.offset);
      this.available = true;
      if (this.pendingCached > 0)
        this.log("info", "本地缓存存在待补传条目", { pending: this.pendingCached });
    } catch (error) {
      this.available = false;
      this.log("warn", "本地缓存目录不可用，失败数据将直接丢弃", { dir, reason: error instanceof Error ? error.message : String(error) });
    }
  }
  readOffset() {
    try {
      const value = Number(readFileSync(this.offsetPath, "utf8").trim());
      return Number.isFinite(value) && value >= 0 ? value : 0;
    } catch {
      return 0;
    }
  }
  readPendingSidecar(fileMtime) {
    if (this.fileSize === 0)
      return 0;
    try {
      if (!existsSync(this.pendingPath))
        return;
      if (statSync(this.pendingPath).mtimeMs + 1 < fileMtime)
        return;
      const value = Number(readFileSync(this.pendingPath, "utf8").trim());
      return Number.isSafeInteger(value) && value >= 0 ? value : undefined;
    } catch {
      return;
    }
  }
  countPending() {
    if (this.offset >= this.fileSize)
      return 0;
    let descriptor;
    try {
      descriptor = openSync(this.filePath, "r");
      const chunkBytes = this.opts.readChunkBytes ?? 1048576;
      const buffer = Buffer.alloc(chunkBytes);
      let position = this.offset;
      let carry = "";
      let count = 0;
      while (position < this.fileSize) {
        const bytesRead = readSync(descriptor, buffer, 0, Math.min(chunkBytes, this.fileSize - position), position);
        if (bytesRead === 0)
          break;
        position += bytesRead;
        carry += buffer.subarray(0, bytesRead).toString("utf8");
        const lines = carry.split(`
`);
        carry = lines.pop() ?? "";
        for (const line of lines)
          if (line.trim().length > 0)
            count++;
      }
      if (carry.trim().length > 0)
        count++;
      return count;
    } catch {
      return 0;
    } finally {
      if (descriptor !== undefined)
        closeSync(descriptor);
    }
  }
  parseLine(text) {
    try {
      const parsed = JSON.parse(text);
      if (typeof parsed !== "object" || parsed === null)
        return;
      const record = parsed;
      if (record["v"] === 1) {
        const payload = parseWalPayload(record["payload"]);
        if (!payload)
          return;
        return {
          v: 1,
          kind: record["kind"] === "auth" ? "auth" : "retryable",
          ts: typeof record["ts"] === "number" ? record["ts"] : this.fallbackTs,
          payload
        };
      }
      const legacy = parseWalPayload(record);
      if (legacy)
        return { v: 1, kind: "retryable", ts: this.fallbackTs, payload: legacy };
      return;
    } catch {
      return;
    }
  }
  append(kind, payload) {
    if (!this.available)
      return false;
    try {
      const entry = { v: 1, kind, ts: Date.now(), payload };
      const line = JSON.stringify(entry) + `
`;
      const bytes = Buffer.byteLength(line, "utf8");
      if (bytes > this.opts.maxBytes / 10) {
        this.log("error", "单条变更过大，不入缓存", { file: payload.file_path, bytes });
        return false;
      }
      if (this.fileSize + bytes > this.opts.maxBytes && !this.rotate())
        return false;
      appendFileSync(this.filePath, line, "utf8");
      this.fileSize += bytes;
      this.pendingCached++;
      this.readBuffer.reset(this.offset);
      this.persistState();
      return true;
    } catch (error) {
      this.available = false;
      this.log("warn", "本地缓存写入失败，降级为直接丢弃", { reason: error instanceof Error ? error.message : String(error) });
      return false;
    }
  }
  rotate() {
    try {
      if (existsSync(this.backupPath))
        unlinkSync(this.backupPath);
      if (existsSync(this.filePath))
        renameSync(this.filePath, this.backupPath);
      this.lostOnRotate += this.pendingCached;
      this.rotations++;
      this.offset = 0;
      this.fileSize = 0;
      this.pendingCached = 0;
      this.readBuffer.reset(0);
      this.persistState();
      this.log("warn", "本地缓存轮转，最旧缓存已被覆盖", { lost: this.lostOnRotate });
      this.onRotate?.();
      return true;
    } catch (error) {
      this.log("warn", "本地缓存轮转失败", { reason: error instanceof Error ? error.message : String(error) });
      return false;
    }
  }
  async replay(batchSize, sendOne) {
    const result = { sent: 0, expired: 0, skipped: 0, stopped: false };
    if (!this.available || this.offset >= this.fileSize)
      return result;
    if (this.readBuffer.position !== this.offset)
      this.readBuffer.reset(this.offset);
    try {
      const handle = await open(this.filePath, "r");
      try {
        let processed = 0;
        while (processed < batchSize) {
          const line = await this.readBuffer.readLine(handle, this.fileSize, this.opts.readChunkBytes ?? 1048576);
          if (!line)
            break;
          const text = line.text.trim();
          if (text.length === 0) {
            this.readBuffer.consume(line);
            this.offset = this.readBuffer.position;
            continue;
          }
          processed++;
          const entry = this.parseLine(text);
          if (!entry) {
            this.readBuffer.consume(line);
            this.offset = this.readBuffer.position;
            this.pendingCached = Math.max(0, this.pendingCached - 1);
            result.skipped++;
            continue;
          }
          if (entry.kind === "auth" && Date.now() - entry.ts > this.opts.authTtlMs) {
            this.readBuffer.consume(line);
            this.offset = this.readBuffer.position;
            this.pendingCached = Math.max(0, this.pendingCached - 1);
            result.expired++;
            continue;
          }
          const outcome = await sendOne(entry.payload);
          if (outcome === "fail") {
            result.stopped = true;
            break;
          }
          this.readBuffer.consume(line);
          this.offset = this.readBuffer.position;
          this.pendingCached = Math.max(0, this.pendingCached - 1);
          if (outcome === "ok")
            result.sent++;
          else
            result.skipped++;
        }
      } finally {
        await handle.close();
      }
    } catch (error) {
      this.log("warn", "读取本地缓存失败", { reason: error instanceof Error ? error.message : String(error) });
      return result;
    }
    this.persistState();
    return result;
  }
  compact() {
    if (!this.available)
      return;
    try {
      if (this.offset >= this.fileSize) {
        writeFileSync(this.filePath, "");
      } else {
        writeFileSync(this.filePath, readFileSync(this.filePath).subarray(this.offset));
      }
      this.fileSize -= this.offset;
      this.offset = 0;
      this.readBuffer.reset(0);
      this.persistState();
    } catch (error) {
      this.log("warn", "本地缓存压缩失败", { reason: error instanceof Error ? error.message : String(error) });
    }
  }
  persistState() {
    try {
      writeFileSync(this.offsetPath, String(this.offset));
      writeFileSync(this.pendingPath, String(this.pendingCached));
      this.pendingKnown = true;
    } catch (error) {
      this.pendingKnown = false;
      this.log("warn", "补传进度持久化失败", { reason: error instanceof Error ? error.message : String(error) });
    }
  }
  get isAvailable() {
    return this.available;
  }
  get pendingCount() {
    return this.pendingCached;
  }
  get pendingBytes() {
    return Math.max(0, this.fileSize - this.offset);
  }
  get walPendingKnown() {
    return this.pendingKnown;
  }
  get walReadBytesTotal() {
    return this.readBuffer.readBytesTotal;
  }
  get walLostOnRotate() {
    return this.lostOnRotate;
  }
  get walRotations() {
    return this.rotations;
  }
}

// src/reporter.ts
var BACKOFF_MS = [200, 500, 1000, 2000, 5000];
function sleep(ms, signal) {
  return new Promise((resolve) => {
    let timer;
    const done = () => {
      if (timer)
        clearTimeout(timer);
      signal?.removeEventListener("abort", done);
      resolve();
    };
    if (signal?.aborted) {
      done();
      return;
    }
    timer = setTimeout(done, ms);
    timer.unref();
    signal?.addEventListener("abort", done, { once: true });
  });
}
function parseRetryAfter(header) {
  if (!header)
    return;
  const seconds = Number(header);
  if (Number.isFinite(seconds) && seconds >= 0)
    return seconds * 1000;
  const date = Date.parse(header);
  if (!Number.isNaN(date))
    return Math.max(0, date - Date.now());
  return;
}

class Reporter {
  config;
  log;
  onFailure;
  serial;
  activeControllers = new Set;
  shutdownController = new AbortController;
  shuttingDown = false;
  circuitOpen = false;
  circuitOpenUntil = 0;
  lastFailureAuth = false;
  consecutiveFailures = 0;
  consecutiveSuccesses = 0;
  totalDroppedFiles = 0;
  totalLostFiles = 0;
  RECOVERY_SUCCESS_THRESHOLD = 3;
  startupReplayScheduled = false;
  pausedUntil = 0;
  MAX_BACKPRESSURE_WAITS = 3;
  DEFAULT_RETRY_AFTER_MS = 2000;
  MAX_RETRY_AFTER_MS = 300000;
  turnNotificationSent = false;
  turnDropNoticeSent = false;
  turnCachedFiles = 0;
  lastRotateNoticeAt = 0;
  wal;
  constructor(config, log, onFailure) {
    this.config = config;
    this.log = log;
    this.onFailure = onFailure;
    this.serial = new ReporterQueue(config.maxQueueFiles, config.maxQueueBytes);
    this.wal = new WalStore({
      dir: config.walDir,
      maxBytes: config.walMaxBytes,
      authTtlMs: config.walAuthTtlMs,
      enabled: config.enabled && config.walEnabled,
      readChunkBytes: config.walReadChunkBytes
    }, log, () => this.notifyRotate());
  }
  async enqueue(payloads) {
    await this.tryEnqueue(payloads);
    await this.serial.wait();
  }
  async tryEnqueue(payloads, options = {}) {
    if (!this.config.enabled)
      return "rejected";
    if (!this.config.url || !this.config.token) {
      this.log("error", "上报配置缺失（url/token 为空），跳过", { files: payloads.length });
      return "rejected";
    }
    this.turnNotificationSent = false;
    this.turnDropNoticeSent = false;
    this.turnCachedFiles = 0;
    return this.serial.tryEnqueue(payloads, {
      sendBatch: async () => {
        for (const payload of payloads)
          await this.sendWithRetry(payload);
      },
      spillOne: (payload) => {
        this.totalDroppedFiles++;
        this.turnCachedFiles++;
        const accepted = this.wal.append("retryable", payload);
        if (!accepted)
          this.totalLostFiles++;
        return accepted;
      }
    }, options);
  }
  async drain() {
    await this.serial.drain(() => this.wal.compact());
  }
  shutdown() {
    this.shuttingDown = true;
    this.serial.shutdown();
    this.shutdownController.abort("shutdown");
    for (const controller of this.activeControllers)
      controller.abort("shutdown");
  }
  status() {
    return {
      circuitOpen: this.circuitOpen,
      consecutiveFailures: this.consecutiveFailures,
      pausedUntil: this.pausedUntil,
      walAvailable: this.wal.isAvailable,
      walPendingCount: this.wal.pendingCount,
      walPendingBytes: this.wal.pendingBytes,
      totalDroppedFiles: this.totalDroppedFiles,
      totalLostFiles: this.totalLostFiles + this.wal.walLostOnRotate,
      walPendingKnown: this.wal.walPendingKnown,
      walReadBytesTotal: this.wal.walReadBytesTotal,
      walLostOnRotate: this.wal.walLostOnRotate,
      walRotations: this.wal.walRotations,
      ...this.serial.status()
    };
  }
  async sendWithRetry(payload) {
    if (this.shuttingDown) {
      this.cacheOrLose(payload, "retryable");
      return;
    }
    if (this.circuitOpen) {
      if (Date.now() < this.circuitOpenUntil) {
        this.cacheOrLose(payload, this.lastFailureAuth ? "auth" : "retryable");
        this.notifyCached();
        return;
      }
      this.circuitOpen = false;
      this.log("info", "失败保护已解除，尝试恢复上报", { file: payload.file_path });
    }
    const attempts = this.config.retries + 1;
    let backpressureWaits = 0;
    for (let attempt = 0;attempt < attempts; attempt++) {
      if (attempt > 0) {
        const delay = BACKOFF_MS[Math.min(attempt - 1, BACKOFF_MS.length - 1)] ?? 1000;
        await sleep(delay, this.shutdownController.signal);
      }
      await this.waitBackpressurePause();
      if (this.shuttingDown) {
        this.cacheOrLose(payload, "retryable");
        return;
      }
      const result = await this.send(payload);
      if (this.shuttingDown) {
        this.cacheOrLose(payload, "retryable");
        return;
      }
      if (result.ok) {
        this.handleSuccess();
        return;
      }
      if (result.kind === "fatal") {
        this.log("error", "请求被拒绝，不再重试", { httpStatus: result.httpStatus, file: payload.file_path });
        const auth = result.httpStatus === 401 || result.httpStatus === 403;
        if (auth) {
          this.finalizeFailure(payload, true);
        } else {
          this.totalDroppedFiles++;
          this.totalLostFiles++;
          this.log("error", "请求被拒绝且无法补传，永久丢弃", { httpStatus: result.httpStatus, file: payload.file_path });
          this.handleFailure();
        }
        return;
      }
      if (result.kind === "backpressure") {
        this.applyBackpressure(result.retryAfterMs);
        if (++backpressureWaits <= this.MAX_BACKPRESSURE_WAITS) {
          attempt--;
          continue;
        }
        break;
      }
    }
    this.finalizeFailure(payload, false);
  }
  finalizeFailure(payload, authReason) {
    if (authReason)
      this.lastFailureAuth = true;
    this.cacheOrLose(payload, authReason ? "auth" : "retryable");
    this.handleFailure();
  }
  cacheOrLose(payload, kind) {
    this.totalDroppedFiles++;
    this.turnCachedFiles++;
    if (this.wal.append(kind, payload)) {
      this.log("warn", "上报失败，已写入本地缓存待补传", { file: payload.file_path, kind });
    } else {
      this.totalLostFiles++;
      this.log("error", "上报失败且本地缓存不可用，丢弃", { file: payload.file_path });
    }
  }
  applyBackpressure(retryAfterMs) {
    const pause = Math.min(retryAfterMs ?? this.DEFAULT_RETRY_AFTER_MS, this.MAX_RETRY_AFTER_MS);
    const until = Date.now() + pause;
    if (until > this.pausedUntil) {
      this.pausedUntil = until;
      this.log("info", "服务端限流（429），暂停发送", { pauseMs: pause });
    }
  }
  async waitBackpressurePause() {
    const wait = this.pausedUntil - Date.now();
    if (wait > 0)
      await sleep(wait, this.shutdownController.signal);
  }
  handleSuccess() {
    this.consecutiveSuccesses++;
    if (!this.startupReplayScheduled) {
      this.startupReplayScheduled = true;
      this.serial.schedule(() => this.runReplay());
    }
    if (this.consecutiveFailures > 0 && this.consecutiveSuccesses >= this.RECOVERY_SUCCESS_THRESHOLD) {
      this.consecutiveFailures = 0;
      this.consecutiveSuccesses = 0;
      this.circuitOpen = false;
      this.log("info", "ES 上报已恢复", {});
      this.serial.schedule(() => this.runReplay());
    }
  }
  handleFailure() {
    this.consecutiveFailures++;
    this.consecutiveSuccesses = 0;
    if (this.consecutiveFailures >= this.config.circuitFailureThreshold && !this.circuitOpen) {
      this.circuitOpen = true;
      this.circuitOpenUntil = Date.now() + this.config.circuitCooldownMs;
      this.log("error", "连续失败保护已启用，后续文件将写入本地缓存", {
        failures: this.consecutiveFailures,
        cooldownMs: this.config.circuitCooldownMs
      });
      this.onFailure?.(`ES 连续失败 ${this.consecutiveFailures} 次，已进入失败保护；期间改动将缓存到本地，恢复后自动补传`, "error");
    }
    if (this.onFailure && !this.turnNotificationSent) {
      this.turnNotificationSent = true;
      const message = this.consecutiveFailures === 1 ? `ES 上报失败，数据已重试 ${this.config.retries} 次仍未成功，已缓存待补传（详见 opencode 日志）` : `ES 连续失败 ${this.consecutiveFailures} 次，请检查网络或 token（详见 opencode 日志）`;
      this.onFailure(message, "error");
    }
  }
  async runReplay() {
    if (!this.wal.isAvailable || this.wal.pendingCount === 0)
      return;
    this.log("info", "开始补传本地缓存", { pending: this.wal.pendingCount });
    let totalExpired = 0;
    let totalSkipped = 0;
    for (;; ) {
      const { sent, expired, skipped, stopped } = await this.wal.replay(this.config.walReplayBatch, async (payload) => {
        await this.waitBackpressurePause();
        const result = await this.send(payload);
        if (result.ok)
          return "ok";
        if (result.kind === "fatal" && result.httpStatus !== 401 && result.httpStatus !== 403)
          return "fatal";
        return "fail";
      });
      totalExpired += expired;
      totalSkipped += skipped;
      if (sent > 0)
        this.log("info", "补传进度", { sent, remaining: this.wal.pendingCount });
      if (stopped) {
        this.log("warn", "补传中断，等待下次恢复后继续", { remaining: this.wal.pendingCount });
        return;
      }
      if (this.wal.pendingCount === 0)
        break;
    }
    const lost = totalExpired + totalSkipped;
    this.totalLostFiles += lost;
    if (totalExpired > 0)
      this.log("info", "补传中清理过期认证类条目", { expired: totalExpired });
    this.wal.compact();
    this.log("info", "本地缓存补传完成", { lost });
    this.onFailure?.(lost > 0 ? `ES 上报已恢复，补传完成，其中 ${lost} 个文件已过期或无法补传` : "ES 上报已恢复，缓存补传完成", "info");
  }
  notifyCached() {
    if (this.onFailure && !this.turnDropNoticeSent && this.circuitOpen) {
      this.turnDropNoticeSent = true;
      this.onFailure(`失败保护中：本轮 ${this.turnCachedFiles} 个文件已缓存，累计待补传 ${this.wal.pendingCount} 个`, "warning");
    }
  }
  notifyRotate() {
    const now = Date.now();
    if (now - this.lastRotateNoticeAt < 3600000)
      return;
    this.lastRotateNoticeAt = now;
    this.onFailure?.("本地缓存已满，最早的缓存已被覆盖", "warning");
  }
  async send(payload) {
    const controller = new AbortController;
    this.activeControllers.add(controller);
    const timer = setTimeout(() => controller.abort("timeout"), this.config.timeoutMs);
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
      if (response.ok)
        return { ok: true };
      if (response.status === 429) {
        return { ok: false, kind: "backpressure", reason: "HTTP 429", retryAfterMs: parseRetryAfter(response.headers.get("retry-after")) };
      }
      if (response.status >= 400 && response.status < 500) {
        return { ok: false, kind: "fatal", reason: `HTTP ${response.status}`, httpStatus: response.status };
      }
      return { ok: false, kind: "retryable", reason: `HTTP ${response.status}` };
    } catch (error) {
      if (error instanceof Error && error.name === "AbortError") {
        return { ok: false, kind: "retryable", reason: controller.signal.aborted ? "请求已取消" : `超时 ${this.config.timeoutMs}ms` };
      }
      return { ok: false, kind: "retryable", reason: error instanceof Error ? error.message : String(error) };
    } finally {
      clearTimeout(timer);
      this.activeControllers.delete(controller);
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

// src/repo.ts
import { readdir, realpath as realpath2 } from "node:fs/promises";
import path6 from "node:path";

// src/async.ts
class TurnAbortedError extends Error {
  reason;
  name = "TurnAbortedError";
  constructor(reason) {
    super("operation aborted");
    this.reason = reason;
  }
}
function throwIfAborted(signal) {
  if (signal?.aborted)
    throw new TurnAbortedError(signal.reason);
}
async function withAbort(promise, signal) {
  if (!signal)
    return promise;
  throwIfAborted(signal);
  return new Promise((resolve, reject) => {
    const onAbort = () => reject(new TurnAbortedError(signal.reason));
    signal.addEventListener("abort", onAbort, { once: true });
    promise.then(resolve, reject).finally(() => signal.removeEventListener("abort", onAbort));
  });
}

class Mutex {
  locked = false;
  waiters = [];
  async runExclusive(operation, signal) {
    const release = await this.acquire(signal);
    try {
      return await operation();
    } finally {
      release();
    }
  }
  acquire(signal) {
    throwIfAborted(signal);
    if (!this.locked) {
      this.locked = true;
      return Promise.resolve(this.release);
    }
    return new Promise((resolve, reject) => {
      const waiter = {
        resolve,
        reject,
        signal,
        onAbort: () => {
          const index = this.waiters.indexOf(waiter);
          if (index >= 0)
            this.waiters.splice(index, 1);
          signal?.removeEventListener("abort", waiter.onAbort);
          reject(new TurnAbortedError(signal?.reason));
        }
      };
      this.waiters.push(waiter);
      signal?.addEventListener("abort", waiter.onAbort, { once: true });
    });
  }
  release = () => {
    const waiter = this.waiters.shift();
    if (!waiter) {
      this.locked = false;
      return;
    }
    waiter.signal?.removeEventListener("abort", waiter.onAbort);
    waiter.resolve(this.release);
  };
}
async function mapLimit(items, limit, operation) {
  const results = new Array(items.length);
  let next = 0;
  const workers = Array.from({ length: Math.min(limit, items.length) }, async () => {
    for (;; ) {
      const index = next++;
      if (index >= items.length)
        return;
      results[index] = await operation(items[index]);
    }
  });
  await Promise.all(workers);
  return results;
}

// src/nested.ts
import { createHash } from "node:crypto";
import os2 from "node:os";
import path5 from "node:path";

// src/nested-payload.ts
import path3 from "node:path";

// src/shadow-blobs.ts
class ShadowMissingObjectError extends Error {
  name = "ShadowMissingObjectError";
  constructor(message) {
    super(message);
  }
}
function parseCatFileBatch(output, oids) {
  const result = new Map;
  const ascii = new TextDecoder("ascii");
  let offset = 0;
  for (const oid of oids) {
    const headerEnd = output.indexOf(10, offset);
    if (headerEnd < 0)
      throw new ShadowMissingObjectError(`missing cat-file header for ${oid}`);
    const header = ascii.decode(output.subarray(offset, headerEnd));
    if (header === `${oid} missing`)
      throw new ShadowMissingObjectError(`missing blob ${oid}`);
    const match = header.match(/^([0-9a-f]+) blob (\d+)$/);
    if (!match || match[1] !== oid)
      throw new ShadowMissingObjectError(`invalid cat-file header for ${oid}`);
    const size = Number(match[2]);
    const contentStart = headerEnd + 1;
    const contentEnd = contentStart + size;
    if (!Number.isSafeInteger(size) || contentEnd >= output.length || output[contentEnd] !== 10) {
      throw new ShadowMissingObjectError(`truncated blob ${oid}`);
    }
    result.set(oid, output.subarray(contentStart, contentEnd));
    offset = contentEnd + 1;
  }
  if (offset !== output.length)
    throw new ShadowMissingObjectError("trailing cat-file data");
  return result;
}
function batchOids(oids, sizes, maxCount = 16, maxBytes = 4 * 1024 * 1024) {
  const batches = [];
  let current = [];
  let bytes = 0;
  for (const oid of oids) {
    const size = sizes?.get(oid);
    const nextBytes = size === undefined ? maxBytes : size;
    if (current.length > 0 && (current.length >= maxCount || bytes + nextBytes > maxBytes)) {
      batches.push(current);
      current = [];
      bytes = 0;
    }
    current.push(oid);
    bytes += nextBytes;
  }
  if (current.length > 0)
    batches.push(current);
  return batches;
}

// src/nested-payload.ts
class NestedResourceError extends Error {
  name = "NestedResourceError";
}
function decode(buffer, context, relPath) {
  if (buffer.includes(0))
    return;
  try {
    return new TextDecoder("utf-8", { fatal: true }).decode(buffer);
  } catch (error) {
    if (error instanceof TypeError) {
      context.log("info", "nested_file_skipped_encoding", { repo: context.shadow.repoRoot, path: relPath });
      return;
    }
    throw error;
  }
}
function blobSize(entry) {
  return entry?.size ?? 0;
}
async function buildNestedPayloads(context) {
  const { shadow, rows } = context;
  const beforePaths = rows.filter((row) => row.status !== "added").map((row) => row.relPath);
  const afterPaths = rows.filter((row) => row.status !== "deleted").map((row) => row.relPath);
  const [beforeEntries, afterEntries] = await Promise.all([
    shadow.lsTreeEntries(context.fromTree, beforePaths, context.signal),
    shadow.lsTreeEntries(context.toTree, afterPaths, context.signal)
  ]);
  const currentDeleted = rows.flatMap((row) => {
    if (row.status !== "deleted")
      return [];
    const entry = beforeEntries.get(row.relPath);
    return entry ? [{ oid: entry.oid, relPath: row.relPath }] : [];
  });
  const deletedCandidates = [...context.baselineDeleted, ...currentDeleted];
  const stats = { binary: 0, size: 0, patch: 0, rename: 0, patchBytes: 0 };
  const candidates = [];
  for (const row of rows) {
    if (row.status === "deleted")
      continue;
    if (row.binary) {
      stats.binary++;
      continue;
    }
    const before = row.status === "modified" ? beforeEntries.get(row.relPath) : undefined;
    const after = afterEntries.get(row.relPath);
    if (!after || row.status === "modified" && !before) {
      context.log("warn", "nested_tree_entry_missing", { repo: shadow.repoRoot, path: row.relPath });
      continue;
    }
    if (row.status === "added" && deletedCandidates.some((entry) => entry.oid === after.oid && entry.relPath !== row.relPath)) {
      stats.rename++;
      continue;
    }
    if (Math.max(blobSize(before), after.size) > context.maxFileBytes) {
      stats.size++;
      context.log("info", "nested_file_skipped_size", { repo: shadow.repoRoot, path: row.relPath });
      continue;
    }
    candidates.push({ row, before, after });
  }
  const sizes = new Map;
  const oids = new Set;
  for (const candidate of candidates) {
    if (candidate.before) {
      oids.add(candidate.before.oid);
      sizes.set(candidate.before.oid, candidate.before.size);
    }
    if (candidate.after) {
      oids.add(candidate.after.oid);
      sizes.set(candidate.after.oid, candidate.after.size);
    }
  }
  const blobs = await shadow.readBlobs([...oids], context.signal, sizes);
  const payloads = [];
  for (const candidate of candidates) {
    const { row, before, after } = candidate;
    if (!after)
      continue;
    const beforeBuffer = before ? blobs.get(before.oid) : undefined;
    const afterBuffer = blobs.get(after.oid);
    if (before && beforeBuffer === undefined || afterBuffer === undefined) {
      throw new ShadowMissingObjectError(`missing blob content for ${row.relPath}`);
    }
    const beforeText = before && beforeBuffer ? decode(beforeBuffer, context, row.relPath) : "";
    const afterText = decode(afterBuffer, context, row.relPath);
    if (beforeText === undefined || afterText === undefined) {
      stats.binary++;
      continue;
    }
    const generated = buildGitPatch(row.relPath, row.status === "added" ? "added" : "modified", beforeText, afterText);
    if (!generated)
      continue;
    const patchBytes = Buffer.byteLength(generated.patch);
    if (patchBytes > context.maxPatchFileBytes) {
      stats.patch++;
      context.log("info", "nested_file_skipped_patch", { repo: shadow.repoRoot, path: row.relPath, bytes: patchBytes });
      continue;
    }
    if (patchBytes > context.patchBudget.remaining)
      throw new NestedResourceError("nested patch budget exhausted");
    context.patchBudget.remaining -= patchBytes;
    stats.patchBytes += patchBytes;
    const filePath = path3.resolve(shadow.repoRoot, row.relPath);
    const relative = path3.relative(shadow.repoRoot, filePath);
    if (relative.startsWith("..") || path3.isAbsolute(relative)) {
      context.log("warn", "nested_path_escape", { repo: shadow.repoRoot, path: row.relPath });
      continue;
    }
    payloads.push({
      user_id: context.userId,
      file_path: filePath,
      repo_file_path: row.relPath,
      branch_name: context.branch,
      project_name: context.remote.projectName,
      user_name: context.userName,
      diff_info: generated.patch,
      timestamp: context.timestamp,
      log_source: context.logSource,
      repo: context.remote.repoName
    });
  }
  return { payloads, currentDeleted, stats };
}

// src/shadow.ts
import { existsSync as existsSync2 } from "node:fs";
import { copyFile, lstat, mkdir, readFile, realpath, rm, writeFile } from "node:fs/promises";
import path4 from "node:path";
class GitCommandError extends Error {
  command;
  result;
  name = "GitCommandError";
  constructor(command, result) {
    super(`git ${command} failed: ${text(result.stderr).slice(0, 500)}`);
    this.command = command;
    this.result = result;
  }
}
function isShadowCorruption(error) {
  if (!(error instanceof GitCommandError))
    return false;
  return /index file (smaller than expected|corrupt)|index.*corrupt|bad tree object|bad object|not a tree object|object file .* is empty/i.test(text(error.result.stderr));
}
function isPermanentShadowInitError(error) {
  if (error instanceof GitCommandError) {
    if (error.result.timedOut || error.result.aborted)
      return false;
    return /object format|not a git repository|permission denied|unsupported/i.test(text(error.result.stderr));
  }
  if (typeof error === "object" && error !== null && "code" in error) {
    return error.code === "EACCES" || error.code === "EPERM";
  }
  return false;
}
function splitNul(value) {
  return text(value).split("\x00").filter(Boolean);
}
async function readOptional(file) {
  try {
    return await readFile(file, "utf8");
  } catch (error) {
    if (typeof error === "object" && error !== null && "code" in error && error.code === "ENOENT")
      return "";
    throw error;
  }
}
function underAny(relPath, prefixes) {
  return prefixes.some((prefix) => relPath === prefix || relPath.startsWith(`${prefix}/`));
}

class ShadowRepo {
  repoRoot;
  options;
  shadowDir;
  initialized = false;
  lastGcAt = 0;
  constructor(repoRoot, options) {
    this.repoRoot = repoRoot;
    this.options = options;
    this.shadowDir = path4.join(options.dir, "repo");
  }
  async init(signal) {
    if (this.initialized)
      return;
    await mkdir(this.options.dir, { recursive: true, mode: 448 });
    const fresh = !existsSync2(path4.join(this.shadowDir, "HEAD"));
    const format = await this.runReal(["rev-parse", "--show-object-format"], signal);
    const objectFormat = text(format.stdout).trim();
    if (objectFormat !== "sha1" && objectFormat !== "sha256")
      throw new GitCommandError("object-format", format);
    await this.run([...this.args(["init", "--quiet", `--object-format=${objectFormat}`])], signal);
    for (const [key, value] of [
      ["core.autocrlf", "false"],
      ["core.longpaths", "true"],
      ["core.symlinks", "true"],
      ["core.fsmonitor", "false"],
      ["feature.manyFiles", "true"],
      ["index.version", "4"],
      ["index.threads", "true"],
      ["core.untrackedCache", "true"]
    ])
      await this.run(this.args(["config", key, value]), signal);
    if (fresh)
      await this.seed(signal);
    this.initialized = true;
  }
  async track(excludeRelPaths, signal) {
    await this.syncExclude(signal);
    const [modified, untracked] = await Promise.all([
      this.run(this.args(["diff-files", "--name-only", "-z", "--", "."]), signal),
      this.run(this.args(["ls-files", "--others", "--exclude-standard", "-z", "--", "."]), signal)
    ]);
    const candidates = new Set([...splitNul(modified.stdout), ...splitNul(untracked.stdout)]);
    const paths = [...candidates].filter((item) => {
      if (item.endsWith("/") || item === ".git" || item.startsWith(".git/"))
        return false;
      return !underAny(item, excludeRelPaths);
    });
    const allowed = (await mapLimit(paths, this.options.fileConcurrency, async (relPath) => {
      try {
        const stat = await lstat(path4.join(this.repoRoot, relPath));
        if (stat.isDirectory())
          return;
        if (stat.size > this.options.maxFileBytes) {
          this.options.log("info", "nested_file_skipped_size", { repo: this.repoRoot, path: relPath, bytes: stat.size });
          return;
        }
        return relPath;
      } catch (error) {
        if (typeof error === "object" && error !== null && "code" in error && error.code === "ENOENT")
          return relPath;
        throw error;
      }
    })).filter((item) => item !== undefined);
    if (allowed.length > 0) {
      await this.run(this.args([
        "add",
        "--all",
        "--sparse",
        "--pathspec-from-file=-",
        "--pathspec-file-nul"
      ]), signal, `${allowed.join("\x00")}\x00`);
    }
    const tree = await this.run(this.args(["write-tree"]), signal);
    return text(tree.stdout).trim();
  }
  async diffTrees(from, to, signal) {
    const [statusOutput, statOutput] = await Promise.all([
      this.run(this.args(["diff", "--no-ext-diff", "--no-renames", "--name-status", "-z", from, to, "--", "."]), signal),
      this.run(this.args(["diff", "--no-ext-diff", "--no-renames", "--numstat", "-z", from, to, "--", "."]), signal)
    ]);
    const status = new Map;
    const statusParts = splitNul(statusOutput.stdout);
    for (let index = 0;index + 1 < statusParts.length; index += 2) {
      const code = statusParts[index] ?? "";
      const relPath = statusParts[index + 1] ?? "";
      status.set(relPath, code.startsWith("A") ? "added" : code.startsWith("D") ? "deleted" : "modified");
    }
    const stats = new Map;
    for (const record of splitNul(statOutput.stdout)) {
      const firstTab = record.indexOf("\t");
      const secondTab = record.indexOf("\t", firstTab + 1);
      if (firstTab < 0 || secondTab < 0)
        continue;
      const adds = record.slice(0, firstTab);
      const dels = record.slice(firstTab + 1, secondTab);
      const relPath = record.slice(secondTab + 1);
      const binary = adds === "-" && dels === "-";
      stats.set(relPath, {
        binary,
        additions: binary ? 0 : Number.parseInt(adds, 10) || 0,
        deletions: binary ? 0 : Number.parseInt(dels, 10) || 0
      });
    }
    return [...new Set([...status.keys(), ...stats.keys()])].sort().map((relPath) => ({
      relPath,
      status: status.get(relPath) ?? "modified",
      binary: stats.get(relPath)?.binary ?? false,
      additions: stats.get(relPath)?.additions ?? 0,
      deletions: stats.get(relPath)?.deletions ?? 0
    }));
  }
  async lsTreeEntries(tree, paths, signal) {
    const entries = new Map;
    for (let offset = 0;offset < paths.length; offset += 100) {
      const batch = paths.slice(offset, offset + 100);
      if (batch.length === 0)
        continue;
      const output = await this.run(this.args(["ls-tree", "-l", "-z", tree, "--", ...batch]), signal);
      for (const record of splitNul(output.stdout)) {
        const tab = record.indexOf("\t");
        if (tab < 0)
          continue;
        const header = record.slice(0, tab);
        const relPath = record.slice(tab + 1);
        const match = header.match(/^\d+ (\w+) ([0-9a-f]+)\s+(\d+)$/);
        if (!match || match[1] !== "blob")
          continue;
        entries.set(relPath, { oid: match[2] ?? "", relPath, size: Number(match[3]) });
      }
    }
    return entries;
  }
  async readBlobs(oids, signal, sizes) {
    const result = new Map;
    for (const batch of batchOids(oids, sizes)) {
      const output = await this.run(this.args(["cat-file", "--batch"]), signal, `${batch.join(`
`)}
`, null);
      if (!Buffer.isBuffer(output.stdout))
        throw new ShadowMissingObjectError("cat-file did not return bytes");
      for (const [oid, content] of parseCatFileBatch(output.stdout, batch))
        result.set(oid, content);
    }
    return result;
  }
  async commitBaseline(tree, signal) {
    await this.run(this.args(["update-ref", "refs/diff-detail/baseline", tree]), signal);
    if (Date.now() - this.lastGcAt < 86400000)
      return;
    this.lastGcAt = Date.now();
    this.run(this.args(["gc", "--prune=14.days"]), signal).catch((error) => {
      this.options.log("debug", "shadow_gc_failed", { repo: this.repoRoot, reason: String(error) });
    });
  }
  async dispose() {
    await rm(this.shadowDir, { recursive: true, force: true });
    this.initialized = false;
  }
  args(command) {
    return ["--git-dir", this.shadowDir, "--work-tree", this.repoRoot, ...command];
  }
  async runReal(args, signal) {
    const result = await git([...args], { cwd: this.repoRoot, timeoutMs: this.options.gitTimeoutMs, signal });
    if (!result.ok)
      throw new GitCommandError(args.join(" "), result);
    return result;
  }
  async run(args, signal, stdin, encoding) {
    const result = await git([...args], {
      cwd: this.repoRoot,
      timeoutMs: this.options.gitTimeoutMs,
      signal,
      stdin,
      encoding
    });
    if (!result.ok)
      throw new GitCommandError(args.join(" "), result);
    return result;
  }
  async seed(signal) {
    const common = await this.runReal(["rev-parse", "--path-format=absolute", "--git-common-dir"], signal);
    const commonDir = text(common.stdout).trim();
    const sourceObjects = path4.join(commonDir, "objects");
    const chained = await readOptional(path4.join(sourceObjects, "info", "alternates"));
    const candidates = [sourceObjects, ...chained.split(`
`).map((line) => line.trim()).filter(Boolean)];
    const alternates = [];
    for (const candidate of candidates) {
      if (candidate.includes(`
`) || candidate.includes("\r")) {
        this.options.log("warn", "shadow_alternates_skipped", { repo: this.repoRoot });
        continue;
      }
      try {
        const absolute = await realpath(path4.isAbsolute(candidate) ? candidate : path4.resolve(sourceObjects, candidate));
        alternates.push(absolute);
      } catch (error) {
        this.options.log("debug", "shadow_alternate_missing", { repo: this.repoRoot, reason: error instanceof Error ? error.message : String(error) });
      }
    }
    if (alternates.length > 0) {
      const info = path4.join(this.shadowDir, "objects", "info");
      await mkdir(info, { recursive: true, mode: 448 });
      await writeFile(path4.join(info, "alternates"), `${alternates.join(`
`)}
`, { mode: 384 });
    }
    try {
      await copyFile(path4.join(commonDir, "index"), path4.join(this.shadowDir, "index"));
    } catch (error) {
      this.options.log("debug", "shadow_index_seed_skipped", { repo: this.repoRoot, reason: error instanceof Error ? error.message : String(error) });
    }
  }
  async syncExclude(signal) {
    const result = await this.runReal(["rev-parse", "--path-format=absolute", "--git-path", "info/exclude"], signal);
    const source = text(result.stdout).trim();
    const content = source ? await readOptional(source) : "";
    const info = path4.join(this.shadowDir, "info");
    await mkdir(info, { recursive: true, mode: 448 });
    await writeFile(path4.join(info, "exclude"), content, "utf8");
  }
}

// src/nested.ts
class NestedCollector {
  options;
  mutex = new Mutex;
  runtimes = new Map;
  shadowRoot;
  initPromise;
  initController;
  initSignals = new Set;
  initAbort = () => {
    this.initController?.abort("nested init linked abort");
  };
  initState = "idle";
  constructor(options) {
    this.options = options;
    this.shadowRoot = options.config.shadowDir || path5.join(os2.homedir(), ".local", "share", "opencode", "diff-detail", "shadow");
  }
  initialize(signal) {
    if (signal) {
      if (signal.aborted)
        this.initController?.abort(signal.reason);
      else {
        this.initSignals.add(signal);
        signal.addEventListener("abort", this.initAbort, { once: true });
      }
    }
    this.initPromise ??= this.runInit();
    return this.initPromise;
  }
  async collectTurn(context) {
    await withAbort(this.initialize(context.signal), context.signal);
    throwIfAborted(context.signal);
    const controller = new AbortController;
    const onAbort = () => controller.abort(context.signal.reason);
    context.signal.addEventListener("abort", onAbort, { once: true });
    const timer = setTimeout(() => controller.abort("nested turn deadline"), Math.max(0, context.deadline - Date.now()));
    timer.unref();
    try {
      return await this.mutex.runExclusive(() => this.collectLocked(context, controller.signal), controller.signal);
    } finally {
      this.initSignals.delete(context.signal);
      context.signal.removeEventListener("abort", this.initAbort);
      clearTimeout(timer);
      clearTimeout(timer);
      context.signal.removeEventListener("abort", onAbort);
    }
  }
  async initShadow(runtime, signal) {
    try {
      await runtime.shadow.init(signal);
    } catch (error) {
      if (isPermanentShadowInitError(error)) {
        runtime.disabledReason = error instanceof Error ? error.message : String(error);
      }
      throw error;
    }
  }
  async runInit() {
    this.initState = "running";
    const { config, log } = this.options;
    const controller = new AbortController;
    this.initController = controller;
    for (const signal of this.initSignals) {
      if (signal.aborted)
        controller.abort(signal.reason);
    }
    const timer = setTimeout(() => controller.abort("nested init deadline"), config.nestedInitBudgetMs);
    timer.unref();
    let baselined = 0;
    let failed = 0;
    let discovered = 0;
    log("info", "nested_init_start", { shadowDir: this.shadowRoot, walDir: config.walDir || "default" });
    try {
      const discovery = await discoverRepos(this.options.worktree, {
        maxRepos: config.maxNestedRepos,
        maxEntries: config.maxDiscoveryEntries
      }, log, controller.signal);
      discovered = discovery.repos.length;
      await mapLimit(discovery.repos, config.nestedRepoConcurrency, async (descriptor) => {
        const runtime = this.ensureRuntime(descriptor);
        if (runtime.disabledReason)
          return;
        try {
          await this.initShadow(runtime, controller.signal);
          const tree = await runtime.shadow.track(this.descendantExcludes(descriptor, discovery.repos), controller.signal);
          runtime.baseline = {
            tree,
            initializedAt: Date.now(),
            lastCollectedAt: Date.now(),
            deletedBlobOids: [],
            failures: 0
          };
          baselined++;
        } catch (error) {
          if (isShadowCorruption(error)) {
            await this.rebaseline(runtime, discovery.repos, controller.signal);
            baselined++;
            return;
          }
          failed++;
          failed++;
          log("warn", "nested_repo_shadow_init_failed", { repo: descriptor.root, reason: error instanceof Error ? error.message : String(error) });
        }
      });
      this.initState = failed > 0 || controller.signal.aborted ? "degraded" : "ready";
    } catch (error) {
      this.initState = "degraded";
      log("warn", "nested_init_degraded", { reason: error instanceof Error ? error.message : String(error), discovered, baselined, failed });
    } finally {
      for (const signal of this.initSignals)
        signal.removeEventListener("abort", this.initAbort);
      this.initSignals.clear();
      this.initController = undefined;
      clearTimeout(timer);
      log("info", "nested_init_complete", { state: this.initState, discovered, baselined, failed });
    }
  }
  async collectLocked(context, signal) {
    const { config, log } = this.options;
    const discovery = await discoverRepos(this.options.worktree, {
      maxRepos: config.maxNestedRepos,
      maxEntries: config.maxDiscoveryEntries
    }, log, signal);
    const found = new Set;
    for (const descriptor of discovery.repos) {
      const key = repoKey(descriptor.root);
      found.add(key);
      const runtime = this.ensureRuntime(descriptor);
      runtime.descriptor = descriptor;
    }
    if (!discovery.truncated && !discovery.incomplete) {
      for (const [key, runtime] of this.runtimes) {
        if (found.has(key))
          continue;
        await runtime.shadow.dispose();
        this.runtimes.delete(key);
        log("info", "nested_repo_deleted", { repo: runtime.descriptor.root });
      }
    }
    const stats = {
      repos_discovered: discovery.repos.length,
      repos_collected: 0,
      repos_failed: 0,
      repos_skipped_disabled: 0,
      repos_skipped_unbaselined: 0,
      repos_skipped_budget: 0,
      files_reported: 0,
      files_skipped_binary: 0,
      files_skipped_size: 0,
      files_skipped_patch: 0,
      files_skipped_rename: 0,
      patch_bytes: 0,
      init_state: this.initState
    };
    const candidates = [];
    for (const runtime of this.runtimes.values()) {
      if (runtime.disabledReason) {
        stats.repos_skipped_disabled = Number(stats.repos_skipped_disabled) + 1;
        continue;
      }
      if (runtime.baseline) {
        candidates.push(runtime);
        continue;
      }
      try {
        await this.initShadow(runtime, signal);
        const tree = await runtime.shadow.track(this.descendantExcludes(runtime.descriptor, discovery.repos), signal);
        runtime.baseline = {
          tree,
          initializedAt: context.timestamp,
          lastCollectedAt: context.timestamp,
          deletedBlobOids: [],
          failures: 0
        };
        stats.repos_skipped_unbaselined = Number(stats.repos_skipped_unbaselined) + 1;
        log("info", "nested_repo_late_baseline", { repo: runtime.descriptor.root });
      } catch (error) {
        if (isShadowCorruption(error)) {
          await this.rebaseline(runtime, discovery.repos, signal);
          stats.repos_skipped_unbaselined = Number(stats.repos_skipped_unbaselined) + 1;
          continue;
        }
        stats.repos_failed = Number(stats.repos_failed) + 1;
        stats.repos_failed = Number(stats.repos_failed) + 1;
        log("warn", "nested_repo_shadow_init_failed", { repo: runtime.descriptor.root, reason: error instanceof Error ? error.message : String(error) });
      }
    }
    const patchBudget = { remaining: config.maxNestedPatchBytesPerTurn };
    let totalFiles = 0;
    const collected = [];
    for (let offset = 0;offset < candidates.length; offset += config.nestedRepoConcurrency) {
      if (totalFiles >= config.maxNestedFilesPerTurn) {
        stats.repos_skipped_budget = Number(stats.repos_skipped_budget) + candidates.length - offset;
        break;
      }
      const batch = candidates.slice(offset, offset + config.nestedRepoConcurrency);
      const results = await mapLimit(batch, config.nestedRepoConcurrency, async (runtime) => {
        try {
          const result = await this.collectRepo(runtime, discovery.repos, context, patchBudget, signal);
          totalFiles += result.rows;
          return result.collected;
        } catch (error) {
          if (error instanceof ShadowMissingObjectError || isShadowCorruption(error)) {
            await this.rebaseline(runtime, discovery.repos, signal);
            stats.repos_skipped_unbaselined = Number(stats.repos_skipped_unbaselined) + 1;
            return;
          }
          runtime.baseline && (runtime.baseline.failures += 1);
          stats.repos_failed = Number(stats.repos_failed) + 1;
          log("warn", "nested_repo_collect_failed", { repo: runtime.descriptor.root, reason: String(error) });
          return;
        }
      });
      collected.push(...results);
    }
    const successes = collected.filter((item) => item !== undefined);
    for (const success of successes) {
      stats.repos_collected = Number(stats.repos_collected) + 1;
      stats.files_skipped_binary = Number(stats.files_skipped_binary) + success.fileStats.binary;
      stats.files_skipped_size = Number(stats.files_skipped_size) + success.fileStats.size;
      stats.files_skipped_patch = Number(stats.files_skipped_patch) + success.fileStats.patch;
      stats.files_skipped_rename = Number(stats.files_skipped_rename) + success.fileStats.rename;
      stats.patch_bytes = Number(stats.patch_bytes) + success.fileStats.patchBytes;
    }
    const collectedPayloads = successes.flatMap((success) => success.payloads);
    stats.files_reported = collectedPayloads.length;
    const outcome = collectedPayloads.length > 0 ? await this.options.reporter.tryEnqueue(collectedPayloads, { signal }) : "queued";
    if (outcome !== "rejected") {
      for (const success of successes) {
        try {
          await this.advance(success, context.timestamp, signal);
        } catch (error) {
          stats.repos_failed = Number(stats.repos_failed) + 1;
          log("warn", "shadow_commit_baseline_failed", { repo: success.runtime.descriptor.root, reason: error instanceof Error ? error.message : String(error) });
        }
      }
    } else {
      log("warn", "nested_queue_rejected", { files: collectedPayloads.length });
    }
    log("info", "nested_turn_summary", { sessionID: context.sessionID, ...stats });
    return {
      collectedPayloads,
      acceptedPayloads: outcome === "rejected" ? [] : collectedPayloads,
      rejectedPayloads: outcome === "rejected" ? collectedPayloads : [],
      enqueueOutcome: outcome,
      stats
    };
  }
  async collectRepo(runtime, repos, context, patchBudget, signal) {
    const baseline = runtime.baseline;
    if (!baseline)
      throw new Error("missing nested baseline");
    const afterTree = await runtime.shadow.track(this.descendantExcludes(runtime.descriptor, repos), signal);
    const rows = await runtime.shadow.diffTrees(baseline.tree, afterTree, signal);
    if (rows.length > this.options.config.maxNestedFilesPerRepoPerTurn) {
      throw new NestedResourceError("nested repo file budget exhausted");
    }
    const [branch, remote] = await Promise.all([
      branchName(runtime.descriptor.root, signal),
      remoteInfo(runtime.descriptor.root, signal)
    ]);
    const built = await buildNestedPayloads({
      shadow: runtime.shadow,
      fromTree: baseline.tree,
      toTree: afterTree,
      rows,
      baselineDeleted: baseline.deletedBlobOids,
      branch,
      remote,
      userId: context.userId,
      userName: context.userName,
      timestamp: context.timestamp,
      logSource: this.options.config.logSource,
      maxFileBytes: this.options.config.maxNestedFileBytes,
      maxPatchFileBytes: this.options.config.maxNestedPatchBytesPerFile,
      patchBudget,
      log: this.options.log,
      signal
    });
    return {
      rows: rows.length,
      collected: {
        runtime,
        afterTree,
        payloads: built.payloads,
        currentDeleted: built.currentDeleted,
        fileStats: built.stats
      }
    };
  }
  async advance(success, timestamp, signal) {
    const baseline = success.runtime.baseline;
    if (!baseline)
      return;
    await success.runtime.shadow.commitBaseline(success.afterTree, signal);
    const deleted = new Map;
    for (const item of [...baseline.deletedBlobOids, ...success.currentDeleted]) {
      deleted.set(`${item.oid}\x00${item.relPath}`, item);
    }
    success.runtime.baseline = {
      ...baseline,
      tree: success.afterTree,
      lastCollectedAt: timestamp,
      deletedBlobOids: [...deleted.values()].slice(-1024),
      failures: 0
    };
  }
  async rebaseline(runtime, repos, signal) {
    await runtime.shadow.dispose();
    runtime.shadow = this.createShadow(runtime.descriptor);
    await this.initShadow(runtime, signal);
    const tree = await runtime.shadow.track(this.descendantExcludes(runtime.descriptor, repos), signal);
    runtime.baseline = {
      tree,
      initializedAt: Date.now(),
      lastCollectedAt: Date.now(),
      deletedBlobOids: [],
      failures: 0
    };
    this.options.log("warn", "shadow_rebaseline", { repo: runtime.descriptor.root });
  }
  ensureRuntime(descriptor) {
    const key = repoKey(descriptor.root);
    const existing = this.runtimes.get(key);
    if (existing)
      return existing;
    const runtime = { descriptor, shadow: this.createShadow(descriptor) };
    this.runtimes.set(key, runtime);
    return runtime;
  }
  createShadow(descriptor) {
    const hash = createHash("sha256").update(repoKey(descriptor.root)).digest("hex").slice(0, 32);
    return new ShadowRepo(descriptor.root, {
      dir: path5.join(this.shadowRoot, hash),
      maxFileBytes: this.options.config.maxNestedFileBytes,
      gitTimeoutMs: this.options.config.gitTimeoutMs,
      fileConcurrency: this.options.config.nestedFileConcurrency,
      log: this.options.log
    });
  }
  descendantExcludes(descriptor, repos) {
    return repos.flatMap((candidate) => {
      if (candidate.root === descriptor.root)
        return [];
      const relative = path5.relative(descriptor.root, candidate.root);
      if (relative.startsWith("..") || path5.isAbsolute(relative))
        return [];
      return [relative.replaceAll("\\", "/")];
    });
  }
}

// src/repo.ts
var SKIPPED = new Set([
  "node_modules",
  ".git",
  "dist",
  "build",
  "target",
  ".venv",
  "venv",
  ".idea",
  ".vscode",
  "__pycache__"
]);
function inside(root, candidate) {
  const relative = path6.relative(root, candidate);
  return relative === "" || !relative.startsWith("..") && !path6.isAbsolute(relative);
}
function repoKey(root) {
  return process.platform === "win32" ? root.toLowerCase() : root;
}
async function discoverRepos(worktree, options, log, signal) {
  const root = await realpath2(worktree);
  const result = { repos: [], truncated: false, incomplete: false, scannedEntries: 0 };
  const seen = new Set;
  const stack = [
    { directory: root, relPath: "", depth: 0 }
  ];
  while (stack.length > 0 && !result.truncated) {
    throwIfAborted(signal);
    const current = stack.pop();
    if (!current)
      break;
    let entries;
    try {
      entries = await readdir(current.directory, { withFileTypes: true });
    } catch (error) {
      result.incomplete = true;
      log("warn", "nested_discovery_read_failed", { path: current.directory, reason: error instanceof Error ? error.message : String(error) });
      continue;
    }
    entries.sort((left, right) => right.name.localeCompare(left.name));
    for (const entry of entries) {
      throwIfAborted(signal);
      result.scannedEntries++;
      if (result.scannedEntries > options.maxEntries) {
        result.truncated = true;
        log("warn", "nested_discovery_truncated", { reason: "entries", limit: options.maxEntries });
        break;
      }
      if (entry.isSymbolicLink())
        continue;
      const absolute = path6.join(current.directory, entry.name);
      const relPath = current.relPath ? `${current.relPath}/${entry.name}` : entry.name;
      if (entry.name === ".git") {
        if (entry.isDirectory()) {
          if (current.relPath)
            result.repos.push({ root: current.directory, relPath: current.relPath, depth: current.depth });
          if (result.repos.length >= options.maxRepos) {
            result.truncated = true;
            log("warn", "nested_discovery_truncated", { reason: "repos", limit: options.maxRepos });
            break;
          }
        } else if (entry.isFile() && current.relPath) {
          log("warn", "nested_repo_unsupported_gitfile", { path: current.directory });
        }
        continue;
      }
      if (!entry.isDirectory() || SKIPPED.has(entry.name))
        continue;
      try {
        const resolved = await realpath2(absolute);
        if (!inside(root, resolved)) {
          log("warn", "nested_discovery_escape", { path: absolute });
          continue;
        }
        const key = repoKey(resolved);
        if (seen.has(key))
          continue;
        seen.add(key);
        stack.push({ directory: resolved, relPath, depth: current.depth + 1 });
      } catch (error) {
        result.incomplete = true;
        log("warn", "nested_discovery_read_failed", { path: absolute, reason: error instanceof Error ? error.message : String(error) });
      }
    }
  }
  result.repos.sort((left, right) => left.relPath.localeCompare(right.relPath));
  return result;
}

// src/server.ts
function isRecord3(value) {
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
    const reporter = new Reporter(config, log);
    const nestedCollector = new NestedCollector({ worktree: input.worktree, config, reporter, log });
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
    let jwtPromise;
    let resolvedApiKey = "";
    function triggerJwtResolution() {
      if (jwtInProgress)
        return jwtPromise;
      if (!resolvedApiKey)
        return;
      jwtInProgress = true;
      jwtPromise = resolveUser(resolvedApiKey, config.jwtApiUrl, config.jwtApiAuth, log).then((result) => {
        if (result.resolved) {
          userInfo.userId = result.userId;
          userInfo.userName = result.userName;
          log("info", "JWT 用户信息已更新，缓存到内存", { userId: result.userId, userName: result.userName });
        } else {
          log("error", "JWT 用户解析失败，下次 turn 将自动重试", {});
        }
      }).catch((error) => {
        log("error", "JWT 用户解析意外异常", { reason: String(error) });
      }).finally(() => {
        jwtInProgress = false;
      });
      return jwtPromise;
    }
    async function waitForJwtReady(signal) {
      if (userInfo.userId)
        return "ready";
      const pending = triggerJwtResolution();
      if (!pending)
        return "unavailable";
      let timer;
      const timeout = new Promise((resolve) => {
        timer = setTimeout(() => resolve("timeout"), config.timeoutMs);
        timer.unref();
      });
      try {
        return await withAbort(Promise.race([
          pending.then(() => userInfo.userId ? "ready" : "unavailable"),
          timeout
        ]), signal);
      } catch (error) {
        if (error instanceof TurnAbortedError)
          return "aborted";
        throw error;
      } finally {
        if (timer)
          clearTimeout(timer);
      }
    }
    async function shouldReport(sessionID) {
      if (backgroundSessions.delete(sessionID))
        return true;
      try {
        const response = await input.client.session.get({
          path: { id: sessionID },
          query: { directory: input.directory }
        });
        const parentID = isRecord3(response.data) ? asString2(response.data["parentID"]) : undefined;
        return parentID === undefined;
      } catch (error) {
        log("warn", "读取 session 失败，按根 session 处理", { sessionID, reason: error instanceof Error ? error.message : String(error) });
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
        const info = isRecord3(list[i]) ? list[i]["info"] : undefined;
        if (isRecord3(info) && info["role"] === "user")
          return asString2(info["id"]);
      }
      return;
    }
    const inflight = new Set;
    const turnControllers = new Set;
    function trackTurn(promise, controller) {
      inflight.add(promise);
      turnControllers.add(controller);
      promise.then(() => {
        inflight.delete(promise);
        turnControllers.delete(controller);
      }, () => {
        inflight.delete(promise);
        turnControllers.delete(controller);
      });
    }
    async function handleTurnEnd(sessionID, turnController) {
      try {
        if (!snapshotEnabled || !config.enabled)
          return;
        if (!userInfo.userId) {
          const outcome = await waitForJwtReady(turnController.signal);
          if (outcome !== "ready") {
            const message = outcome === "timeout" ? "JWT 用户等待超时，跳过本 turn 上报" : "JWT 用户信息未就绪，跳过本 turn 上报";
            log("debug", message, { sessionID });
            return;
          }
        }
        if (!reportingReady || !await shouldReport(sessionID))
          return;
        const timestamp = Date.now();
        const signal = turnController.signal;
        const acceptedPayloads = [];
        const rejectedPayloads = [];
        let rootError;
        let nestedError;
        try {
          const messageID = await lastUserMessageID(sessionID);
          if (messageID) {
            const response = await input.client.session.diff({
              path: { id: sessionID },
              query: { directory: input.directory, messageID }
            });
            const changes = transformDiffs(response.data, input.worktree, (file) => {
              log("debug", "root_empty_status_ambiguous", { sessionID, file });
            });
            if (changes.length > 0) {
              const [branch, remote] = await Promise.all([branchName(input.worktree, signal), remoteInfo(input.worktree, signal)]);
              const payloads = changes.map((change) => ({
                user_id: userInfo.userId,
                file_path: change.filePath,
                repo_file_path: change.repoFilePath,
                branch_name: branch,
                project_name: remote.projectName,
                user_name: userInfo.userName,
                diff_info: change.patch,
                timestamp,
                log_source: config.logSource,
                repo: remote.repoName
              }));
              const outcome = await reporter.tryEnqueue(payloads, { signal });
              if (outcome === "rejected") {
                rejectedPayloads.push(...payloads);
                log("warn", "root 队列拒绝", { sessionID, files: payloads.length });
              } else {
                acceptedPayloads.push(...payloads);
              }
            }
          }
        } catch (error) {
          rootError = error instanceof Error ? error.message : String(error);
          log("error", "root diff 采集失败", { sessionID, reason: rootError });
        }
        try {
          if (config.nestedReposEnabled) {
            const result = await nestedCollector.collectTurn({
              sessionID,
              signal,
              deadline: timestamp + config.nestedTurnBudgetMs,
              timestamp,
              userId: userInfo.userId,
              userName: userInfo.userName
            });
            acceptedPayloads.push(...result.acceptedPayloads);
            rejectedPayloads.push(...result.rejectedPayloads);
          }
        } catch (error) {
          nestedError = error instanceof Error ? error.message : String(error);
          log("error", "nested 采集失败", { sessionID, reason: nestedError });
        }
        if (acceptedPayloads.length === 0 && rejectedPayloads.length === 0) {
          log("debug", "turn 无文件变更", { sessionID, rootError, nestedError });
          return;
        }
        log(acceptedPayloads.length === 0 ? "warn" : "info", "turn 上报结果", {
          sessionID,
          acceptedFiles: acceptedPayloads.length,
          rejectedFiles: rejectedPayloads.length,
          patchBytes: acceptedPayloads.reduce((sum, payload) => sum + Buffer.byteLength(payload.diff_info), 0),
          rootError,
          nestedError
        });
      } catch (error) {
        log("error", "处理 turn 结束失败", { sessionID, reason: error instanceof Error ? error.message : String(error) });
      }
    }
    return {
      config: async (loaded) => {
        snapshotEnabled = loaded.snapshot !== false;
        if (!snapshotEnabled)
          log("warn", "opencode snapshot 已关闭，无法统计代码量");
        resolvedApiKey = extractApiKey(loaded);
        if (snapshotEnabled && config.enabled && config.nestedReposEnabled)
          await nestedCollector.initialize();
        if (!resolvedApiKey) {
          log("warn", "未从 provider 配置中找到 apiKey，跳过 JWT 用户解析", {});
          return;
        }
        triggerJwtResolution();
      },
      event: async ({ event }) => {
        if (event.type === "session.deleted") {
          const info = isRecord3(event.properties.info) ? event.properties.info : undefined;
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
        const turnController = new AbortController;
        trackTurn(handleTurnEnd(sessionID, turnController), turnController);
      },
      "tool.execute.after": async (toolInput, output) => {
        if (toolInput.tool !== "task")
          return;
        const metadata = output.metadata;
        if (!isRecord3(metadata))
          return;
        if (metadata["background"] !== true)
          return;
        const childSessionID = asString2(metadata["sessionId"]);
        if (!childSessionID)
          return;
        backgroundSessions.add(childSessionID);
      },
      dispose: async () => {
        for (const controller of turnControllers)
          controller.abort("shutdown");
        turnControllers.clear();
        reporter.shutdown();
        let timer;
        const timeout = new Promise((resolve) => {
          timer = setTimeout(resolve, config.shutdownBudgetMs);
          timer.unref();
        });
        const deadline = Date.now() + config.shutdownBudgetMs;
        try {
          await Promise.race([Promise.allSettled([...inflight]), timeout]);
          if (inflight.size > 0) {
            log("warn", "shutdown 仍有未完成 turn", {
              remaining: inflight.size,
              queueBytes: reporter.status().queuedBytes,
              walPending: reporter.status().walPendingCount
            });
          }
          await Promise.race([reporter.drain(), timeout]);
          if (Date.now() >= deadline)
            log("warn", "shutdown 预算耗尽，未完成工作留待下次启动", {});
        } finally {
          if (timer)
            clearTimeout(timer);
        }
      }
    };
  }
};
var PREFERRED_PROVIDER_NAMES = ["enterprise-llm"];
function extractApiKey(loaded) {
  if (!isRecord3(loaded))
    return "";
  const provider = loaded["provider"];
  if (!isRecord3(provider))
    return "";
  for (const name of PREFERRED_PROVIDER_NAMES) {
    const value = provider[name];
    if (!isRecord3(value))
      continue;
    const options = value["options"];
    if (!isRecord3(options))
      continue;
    const apiKey = asString2(options["apiKey"]);
    if (apiKey)
      return apiKey;
  }
  for (const value of Object.values(provider)) {
    if (!isRecord3(value))
      continue;
    const options = value["options"];
    if (!isRecord3(options))
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
