import type { TuiPluginApi } from "@opencode-ai/plugin/tui"
import { createMemo, For, type Accessor } from "solid-js"
import { DEFAULT_THEMES, useTheme } from "../../context/theme"
import { useCommandShortcut } from "../../keymap"

const themeCount = Object.keys(DEFAULT_THEMES).length

type TipPart = { text: string; highlight: boolean }
type TipShortcut = Accessor<string>
type Shortcuts = {
  agentCycle: TipShortcut
  childFirst: TipShortcut
  childNext: TipShortcut
  childPrevious: TipShortcut
  commandList: TipShortcut
  editorOpen: TipShortcut
  helpShow: TipShortcut
  inputClear: TipShortcut
  inputNewline: TipShortcut
  inputPaste: TipShortcut
  inputUndo: TipShortcut
  leader: TipShortcut
  messagesCopy: TipShortcut
  messagesFirst: TipShortcut
  messagesLast: TipShortcut
  messagesPageDown: TipShortcut
  messagesPageUp: TipShortcut
  messagesToggleConceal: TipShortcut
  modelCycleRecent: TipShortcut
  modelList: TipShortcut
  sessionExport: TipShortcut
  sessionInterrupt: TipShortcut
  sessionList: TipShortcut
  sessionNew: TipShortcut
  sessionParent: TipShortcut
  sessionPinToggle: TipShortcut
  sessionQuickSwitch1: TipShortcut
  sessionQuickSwitch9: TipShortcut
  sessionSidebarToggle: TipShortcut
  sessionTimeline: TipShortcut
  statusView: TipShortcut
  terminalSuspend: TipShortcut
  themeList: TipShortcut
}
type Tip = string | ((shortcuts: Shortcuts) => string | undefined)

function parse(tip: string): TipPart[] {
  const parts: TipPart[] = []
  const regex = /\{highlight\}(.*?)\{\/highlight\}/g
  const found = Array.from(tip.matchAll(regex))
  const state = found.reduce(
    (acc, match) => {
      const start = match.index ?? 0
      if (start > acc.index) {
        acc.parts.push({ text: tip.slice(acc.index, start), highlight: false })
      }
      acc.parts.push({ text: match[1], highlight: true })
      acc.index = start + match[0].length
      return acc
    },
    { parts, index: 0 },
  )

  if (state.index < tip.length) {
    parts.push({ text: tip.slice(state.index), highlight: false })
  }

  return parts
}

const NO_MODELS_TIP = "运行 {highlight}/connect{/highlight} 添加 AI 服务商并开始编码"
const NO_MODELS_PARTS = parse(NO_MODELS_TIP)

function shortcutText(value: string) {
  return `{highlight}${value}{/highlight}`
}

function commandText(command: string, shortcut: string) {
  if (!shortcut) return shortcutText(command)
  return `${shortcutText(command)} or ${shortcutText(shortcut)}`
}

function press(shortcut: string, text: string) {
  if (!shortcut) return undefined
  return `Press ${shortcutText(shortcut)} ${text}`
}

function configShortcut(api: TuiPluginApi, command: string): TipShortcut {
  return () =>
    api.tuiConfig.keybinds
      .get(command)
      .map((binding) => api.keys.formatSequence(Array.from(api.keymap.parseKeySequence(binding.key))))
      .filter(Boolean)
      .join(", ")
}

export function Tips(props: { api: TuiPluginApi; connected?: boolean }) {
  const theme = useTheme().theme
  const tipOffset = Math.random()
  const shortcuts: Shortcuts = {
    agentCycle: useCommandShortcut("agent.cycle"),
    childFirst: configShortcut(props.api, "session.child.first"),
    childNext: configShortcut(props.api, "session.child.next"),
    childPrevious: configShortcut(props.api, "session.child.previous"),
    commandList: useCommandShortcut("command.palette.show"),
    editorOpen: useCommandShortcut("prompt.editor"),
    helpShow: useCommandShortcut("help.show"),
    inputClear: useCommandShortcut("prompt.clear"),
    inputNewline: useCommandShortcut("input.newline"),
    inputPaste: useCommandShortcut("prompt.paste"),
    inputUndo: useCommandShortcut("input.undo"),
    leader: configShortcut(props.api, "leader"),
    messagesCopy: configShortcut(props.api, "messages.copy"),
    messagesFirst: configShortcut(props.api, "session.first"),
    messagesLast: configShortcut(props.api, "session.last"),
    messagesPageDown: configShortcut(props.api, "session.page.down"),
    messagesPageUp: configShortcut(props.api, "session.page.up"),
    messagesToggleConceal: configShortcut(props.api, "session.toggle.conceal"),
    modelCycleRecent: useCommandShortcut("model.cycle_recent"),
    modelList: useCommandShortcut("model.list"),
    sessionExport: configShortcut(props.api, "session.export"),
    sessionInterrupt: configShortcut(props.api, "session.interrupt"),
    sessionList: useCommandShortcut("session.list"),
    sessionNew: useCommandShortcut("session.new"),
    sessionParent: configShortcut(props.api, "session.parent"),
    sessionPinToggle: configShortcut(props.api, "session.pin.toggle"),
    sessionQuickSwitch1: useCommandShortcut("session.quick_switch.1"),
    sessionQuickSwitch9: useCommandShortcut("session.quick_switch.9"),
    sessionSidebarToggle: configShortcut(props.api, "session.sidebar.toggle"),
    sessionTimeline: configShortcut(props.api, "session.timeline"),
    statusView: useCommandShortcut("opencode.status"),
    terminalSuspend: useCommandShortcut("terminal.suspend"),
    themeList: useCommandShortcut("theme.switch"),
  }
  const tip = createMemo(() => {
    if (props.connected === false) return NO_MODELS_TIP
    const tips = [...TIPS, process.platform !== "win32" ? TERMINAL_SUSPEND_TIP : INPUT_UNDO_TIP].flatMap((item) => {
      const value = typeof item === "string" ? item : item(shortcuts)
      return value ? [value] : []
    })
    return tips[Math.floor(tipOffset * tips.length)] ?? NO_MODELS_TIP
  }, NO_MODELS_TIP)
  // Solid can expose a memo's initial value while a pure computation is pending.
  const parts = createMemo(() => {
    const value = tip()
    if (typeof value === "string") return parse(value)
    return NO_MODELS_PARTS
  }, NO_MODELS_PARTS)

  return (
    <box flexDirection="row" maxWidth="100%">
      <text flexShrink={0} style={{ fg: theme.warning }}>
        ● 小贴士{" "}
      </text>
      <text flexShrink={1} wrapMode="word">
        <For each={parts()}>
          {(part) => <span style={{ fg: part.highlight ? theme.text : theme.textMuted }}>{part.text}</span>}
        </For>
      </text>
    </box>
  )
}

const TIPS: Tip[] = [
  "输入 {highlight}@{/highlight} 后跟文件名，可模糊搜索并附加文件",
  "消息以 {highlight}!{/highlight} 开头可直接运行Shell命令（例如：{highlight}!ls -la{/highlight}）",
  (shortcuts) => press(shortcuts.agentCycle(), "在Build和Plan智能体之间切换"),
  "使用 {highlight}/undo{/highlight} 撤销上一条消息和文件修改",
  "使用 {highlight}/redo{/highlight} 恢复之前撤销的消息和文件修改",
  "运行 {highlight}/share{/highlight} 创建对话的公开分享链接",
  "将图片或PDF拖入终端即可添加为上下文",
  (shortcuts) => press(shortcuts.inputPaste(), "将剪贴板中的图片粘贴到输入框"),
  (shortcuts) => `使用 ${commandText("/editor", shortcuts.editorOpen())} 在外部编辑器中编写消息`,
  "运行 {highlight}/init{/highlight} 基于代码库自动生成项目规则",
  (shortcuts) => `使用 ${commandText("/models", shortcuts.modelList())} 查看并切换可用的AI模型`,
  (shortcuts) => `使用 ${commandText("/themes", shortcuts.themeList())} 在 ${themeCount} 个内置主题之间切换`,
  (shortcuts) => `使用 ${commandText("/new", shortcuts.sessionNew())} 开启全新对话会话`,
  (shortcuts) => `使用 ${commandText("/sessions", shortcuts.sessionList())} 列出、固定和继续会话`,
  (shortcuts) => press(shortcuts.sessionPinToggle(), "在会话列表中固定会话，使其保持在顶部"),
  (shortcuts) =>
    shortcuts.sessionQuickSwitch1() && shortcuts.sessionQuickSwitch9()
      ? `已固定的会话会分配快速槽位；使用 ${shortcutText(shortcuts.sessionQuickSwitch1())} 至 ${shortcutText(shortcuts.sessionQuickSwitch9())} 快速切换`
      : undefined,
  "运行 {highlight}/compact{/highlight} 压缩接近上下文限制的长会话",
  (shortcuts) => `使用 ${commandText("/export", shortcuts.sessionExport())} 将对话保存为Markdown文件`,
  (shortcuts) => press(shortcuts.messagesCopy(), "将助手的最后一条消息复制到剪贴板"),
  (shortcuts) => press(shortcuts.commandList(), "查看所有可用操作和命令"),
  "运行 {highlight}/connect{/highlight} 添加75+支持的LLM提供商API密钥",
  (shortcuts) => `引导键为 ${shortcutText(shortcuts.leader())}；与其他键组合可执行快速操作`,
  (shortcuts) => press(shortcuts.modelCycleRecent(), "在最近使用的模型之间快速切换"),
  (shortcuts) => press(shortcuts.sessionSidebarToggle(), "在会话中显示或隐藏侧边栏面板"),
  (shortcuts) =>
    shortcuts.messagesPageUp() && shortcuts.messagesPageDown()
      ? `使用 ${shortcutText(shortcuts.messagesPageUp())}/${shortcutText(shortcuts.messagesPageDown())} 浏览对话历史`
      : undefined,
  (shortcuts) => press(shortcuts.messagesFirst(), "跳转到对话开头"),
  (shortcuts) => press(shortcuts.messagesLast(), "跳转到最新消息"),
  (shortcuts) => press(shortcuts.inputNewline(), "在输入框中插入换行"),
  (shortcuts) => press(shortcuts.inputClear(), "清空当前输入框内容"),
  (shortcuts) => press(shortcuts.sessionInterrupt(), "立即停止AI响应"),
  "切换到 {highlight}Plan{/highlight} 智能体，仅获取建议不实际修改文件",
  "在提示中使用 {highlight}@agent-name{/highlight} 调用专用子智能体",
  (shortcuts) => {
    const items = [
      shortcuts.sessionParent(),
      shortcuts.childFirst(),
      shortcuts.childPrevious(),
      shortcuts.childNext(),
    ].filter(Boolean)
    if (!items.length) return undefined
    return `使用 ${items.map(shortcutText).join(" / ")} 在父会话和子会话之间导航`
  },
  "在配置中添加 {highlight}$schema{/highlight} 获得编辑器自动补全",
  "在配置中设置 {highlight}model{/highlight} 指定默认模型",
  "在 {highlight}tui.json{/highlight} 的 {highlight}keybinds{/highlight} 部分覆盖任意快捷键",
  "将任意快捷键设为 {highlight}none{/highlight} 可完全禁用该功能",
  "在 {highlight}mcp{/highlight} 配置段配置本地或远程MCP服务器",
  "在自定义命令中使用 {highlight}$ARGUMENTS{/highlight}、{highlight}$1{/highlight}、{highlight}$2{/highlight} 接收动态参数",
  "在命令中使用反引号注入Shell输出（例如：{highlight}`git status`{/highlight}）",
  "为每个智能体单独配置 {highlight}edit{/highlight}、{highlight}bash{/highlight}、{highlight}webfetch{/highlight} 工具权限",
  '使用 {highlight}"git *": "allow"{/highlight} 这样的模式实现细粒度的bash权限控制',
  '设置 {highlight}"rm -rf *": "deny"{/highlight} 阻止破坏性命令',
  '配置 {highlight}"git push": "ask"{/highlight} 在推送前要求确认',
  '在配置中设置 {highlight}"formatter": true{/highlight} 启用内置格式化程序（prettier、gofmt、ruff等）',
  '在配置中设置 {highlight}"formatter": false{/highlight} 禁用其他配置层启用的格式化程序',
  "在配置中定义带文件扩展名的自定义格式化命令",
  '在配置中设置 {highlight}"lsp": true{/highlight} 启用内置LSP服务器进行代码分析',
  "工具定义可以调用Python、Go等语言编写的脚本",
  "使用插件在会话完成时发送系统通知",
  "创建插件阻止读取敏感文件",
  "在脚本中使用 {highlight}--format json{/highlight} 获取机器可读的输出格式",
  "在PR代码行上评论 {highlight}/oc{/highlight} 进行针对性代码审查",
  '设置 {highlight}"theme": "system"{/highlight} 自动匹配终端主题颜色',
  "主题支持深色/浅色两种模式变体",
  "在自定义主题JSON中使用0-255的xterm数字颜色代码",
  "在配置中使用 {highlight}{env:VAR_NAME}{/highlight} 语法引用环境变量",
  "使用 {highlight}{file:path}{/highlight} 在配置值中包含外部文件内容",
  "在配置中使用 {highlight}instructions{/highlight} 加载额外的规则文件",
  "设置智能体的 {highlight}temperature{/highlight}：0.0（最专注）到1.0（最有创造力）",
  "配置 {highlight}steps{/highlight} 限制每个请求的智能体迭代次数",
  '设置 {highlight}"tools": {"bash": false}{/highlight} 禁用特定工具',
  '设置 {highlight}"mcp_*": false{/highlight} 禁用来自某个MCP服务器的所有工具',
  "为每个智能体单独覆盖全局工具设置",
  '设置 {highlight}"share": "auto"{/highlight} 自动分享所有会话',
  '设置 {highlight}"share": "disabled"{/highlight} 禁止任何会话分享',
  "运行 {highlight}/unshare{/highlight} 取消会话的公开访问权限",
  "{highlight}doom_loop{/highlight} 权限可防止无限工具调用循环",
  "{highlight}external_directory{/highlight} 权限可保护项目目录外的文件",
  "使用 {highlight}--print-logs{/highlight} 标志在stderr中查看详细日志",
  (shortcuts) => `使用 ${commandText("/timeline", shortcuts.sessionTimeline())} 跳转到指定消息`,
  (shortcuts) => press(shortcuts.messagesToggleConceal(), "切换消息中代码块的显示/隐藏"),
  (shortcuts) => `使用 ${commandText("/status", shortcuts.statusView())} 查看系统状态信息`,
  "在 {highlight}tui.json{/highlight} 中启用 {highlight}scroll_acceleration{/highlight} 获得流畅的macOS风格滚动",
  (shortcuts) =>
    shortcuts.commandList()
      ? `通过命令面板（${shortcutText(shortcuts.commandList())}）切换聊天中的用户名显示`
      : "通过命令面板切换聊天中的用户名显示",
  "将项目的 {highlight}AGENTS.md{/highlight} 文件提交到Git实现团队共享",
  "使用 {highlight}/review{/highlight} 审查未提交的更改、分支或PR",
  (shortcuts) => `使用 ${commandText("/help", shortcuts.helpShow())} 显示帮助对话框`,
  "使用 {highlight}/rename{/highlight} 重命名当前会话",
]

const INPUT_UNDO_TIP: Tip = (shortcuts) => press(shortcuts.inputUndo(), "to undo changes in your prompt")
const TERMINAL_SUSPEND_TIP: Tip = (shortcuts) =>
  press(shortcuts.terminalSuspend(), "to suspend the terminal and return to your shell")
