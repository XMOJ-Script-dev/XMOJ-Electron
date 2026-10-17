# XMOJ Electron

一个基于 [小明的 OJ](https://www.xmoj.tech) 的现代、高效、美观 Electron 桌面客户端。

## 技术栈

| 层次 | 技术 |
| --- | --- |
| 桌面容器 | Electron 43 + `vite-plugin-electron` |
| 界面 | Vue 3 + TypeScript + Tailwind CSS 4 + shadcn-vue (reka-ui) |
| 主进程解析 | `node-html-parser`（css-select 选择器） |
| 渲染进程解析 | `DOMParser` |

## 架构

```
electron/
  main.ts      进程入口：创建窗口 + 注册 IPC 处理器
  preload.ts   通过 contextBridge 暴露收窄的 window.xmoj 接口
  http.ts      带 cookie jar 的 fetch 客户端（会话保持的关键）
  session.ts   登录 / 校验 / 注销 / 会话持久化
  parsers.ts   HTML → 领域对象（首页、题库、状态）
src/
  shared/types.ts   主进程与渲染进程共享的类型 + IPC 频道名
  stores/           会话状态、导航状态
  services/api.ts   preload 桥接的类型化封装
  pages/            首页 / 题库 / 状态 / 登录
```

## 已实现功能

- **登录**：应用内表单，支持"记住密码"与启动时静默重新登录
- **头像**：登录后由邮箱经 Cravatar 取头像（MD5 在主进程计算）
- **用户标识**：凡是出现用户名的地方都渲染为「圆形头像 + 用户名 + 标签」，
  显示名（`nick`）与标签来自判题站 `/api/nav` 与社区后端
- **首页**：公告（Markdown + KaTeX）、**服务公告**（社区后端 `GetNotice`，Markdown +
  KaTeX，位于倒计时与公告之间）、推荐位（卡片高度跟随图片）、与服务器同步的时钟、
  赛事倒计时、底部页脚
- **题库**：一次抓取判题站全部分页后**本地按 20 题分页**，标题/编号搜索、翻页
- **题目**：题面按 `.cnt-row` 逐块渲染成**卡片**（信息头 + 每块一张卡片）、
  样例输入输出独立卡片、每个复制按钮按下后变「已复制」并在 2 秒后复原、
  可读取标程，实体（`&lt;` 等）会解码回原字符。从**题库列表点一行**即可进入题面
- **状态**：评测记录（12 种评测结果按类型着色：AC 绿、WA 红、RE 紫、CE 黄、
  TLE/MLE 黑、未知灰）、多条件筛选、游标翻页；搜索框右侧可进入**代码对比**。
  只有真正的「等待/评测中」才轮询，**「未知」不轮询**
- **提交**：Monaco 编辑器、语言选择、O2 开关、提交前检查、按题保存草稿。
  入口在题面页的「提交代码」按钮（侧栏不单列）
- **竞赛&作业**：比赛列表（共 104 场，可翻页、区分进行中/未开始/已结束）、
  比赛题目（题号按状态着色：已通过浅绿、未通过淡红、评测中淡黄）、
  **OI 排名 / 订正排名**（原生表格，从比赛详情进入，以浮层展示）
- **月赛**：公告卡片（与首页公告同样的卡片样式），标题 + 日期 + 复制
- **下载**：仿用户脚本的软件列表卡片（图标 + 名称 + 链接）
- **讨论**：板块筛选、发帖列表与分页、帖子详情、回复、发新帖
- **短消息**：会话列表、消息气泡、发送；**新建会话前先校验用户是否存在**
- **个人主页**：已解决题目列表（判题站用 `p(id,count)` 脚本发射，主进程解析）、
  按题号筛选、点击直接跳到题面
- **代码对比**：两次提交逐行对比（+/- 行号与差异统计）
- **导出 AC 代码**：把已通过题目的代码打包成 zip
- **关于 / 检查更新**：侧栏底部抽屉内的 dialog；版本取自 `package.json`，
  更新信息取自 `https://www.xmoj-script.uk/Update.json`（与用户脚本同一数据源）
- **通知提醒**：错误/警告以**底部 toast** 呈现；社区未读提及同样以 toast 提示
- **设置**：主题（亮/暗/跟随系统）、动画、单位、相对时间、自动刷新、
  **离开前确认**，以及**显式的云同步**（`GetUserSettings` / `SetUserSettings`）

另；XMOJ Electron 中加入了缓存功能，部分页面可在离线页面下使用缓存加载。

## 开发

```bash
npm install
npm run dev            # 启动 Vite + Electron 开发环境
npm run typecheck      # vue-tsc 类型检查
npm run build          # 类型检查 + 构建 + 打包安装程序
npm run build:dir      # 只产出未打包的目录，便于本地验证
```

### 测试

`tests/` 下是 14 套 Node 侧校验 + 1 套 Electron 端到端：

```bash
npm test              # 解析器校验：对真实页面快照 + 构造的 HUSTOJ 标记
npm run test:poller   # 轮询器行为（启动/自停/不重叠/异常不中断）
npm run test:diff     # 逐行 diff（插入/删除/行号单调/空侧/大输入）
npm run test:cache    # 页面缓存（命中标记、maxAge 失效、按键清除、版本失效）
npm run test:native-views # 题面卡片/样例包装清理/`/upload` 绝对化、排名表格、
                          # 个人主页 `p(id,count)` 解析（离线，合成 fixture）
npm run test:cloud-settings # 云同步的**线格式**：`Settings` 必须是 JSON 字符串，
                            # 且读取时会解析回对象（用本地 stub 后端，不碰真实账号）
npm run test:codecheck # 提交前代码检查（文件 IO / 拼写 / 括号 / 头文件）
npm run test:markdown # 公告 Markdown + KaTeX 渲染（含公式/货币等边界情形）
npm run test:smoke    # 主进程层联调：真实请求 xmoj.tech，覆盖 cookie 作用域、
                      # 会话持久化、解析，以及一次故意失败的登录
npm run test:live     # 真实登录（需要 tests/account.txt），校验登录后的题库、
                      # 状态解析与游标翻页
npm run test:live-community # 真实社区后端：令牌交换、板块/帖子/私信/提醒
npm run test:live-sources   # 真实取源码、导出 zip、比赛题目解析、提交表单
npm run test:live-judge-api # 判题站原生 JSON API：/api/nav、比赛列表与详情、
                            # 用户是否存在
npm run test:compare  # 用「登录 + 真实用户脚本」渲染出的 DOM 反查本项目解析器
npm run test:e2e      # 在真实 Electron 中加载生产构建（需先 npm run build），
                      # 登录后驱动界面做端到端断言（当前 75 项）
```

E2E 断言「没有 webview / 没有 `target="_blank"`」，也断言题面卡片、样例框、
比赛排名浮层、站内浏览缺失等界面事实。

> 提示：E2E 会读应用真实的 `userData`，所以**清掉 `page-cache.json`**
> （`%APPDATA%\xmoj-electron\page-cache.json`）能得到最干净的一次运行；
> 带缓存运行时断言同样成立，只是首屏会先渲染缓存再刷新，总耗时略长。

## 持续集成

`.github/workflows/` 下有 5 个 workflow：

| 文件 | 触发条件 | 作用 |
| --- | --- | --- |
| `test.yml` | push / PR 到 `master`、`dev` | 先跑**不需要账号**的 9 套（含 `test:smoke`，它匿名也要连真实站点），再跑**需要账号**的 6 套（含 E2E） |
| `release.yml` | 推送 `v*` 标签 | 在 Windows / macOS / Linux 上构建安装包并创建 Release |
| `claude-review.yml` | PR 打开 / 更新 | 自动代码审查（只评论 diff 内的文件） |
| `claude.yml` | 评论里 `@claude` | 按评论要求修复或审查 |
| `sync.yml` | push 到 `dev` | 开一个 `dev` → `master` 的同步 PR |

需要配置的仓库 Secret：

- `XMOJ_ACCOUNT` — **可选**。内容就是 `tests/account.txt` 的内容：
  `Username: <账号>` 与 `Password: <密码>` 两行。不配置时，需要登录的那一批
  会被跳过并打一条 notice（`test:live*` 在没有这个文件时会直接以 ENOENT 失败，
  所以必须跳过而不是照常运行）。
- `DEEPSEEK_API_KEY` — 两个 Claude workflow 用，配合仓库变量
  `DEEPSEEK_MODEL` 与 `DEEPSEEK_EFFORT`。
- `TOKEN` — 可选。只有从 fork 推送 Release 时才需要（fork 的 `GITHUB_TOKEN`
  没有本仓库写权限）；否则用默认的 `GITHUB_TOKEN` 即可。

两个 Claude workflow 走 `ANTHROPIC_BASE_URL=https://api.deepseek.com/anthropic`，
把 DeepSeek 当作 Anthropic 兼容后端使用。它们的 prompt 里额外写明了本项目的
几条硬规则（不写注释、不许引入 `webview`/`window.open`、判题站请求必须走主进程
HTTP 客户端、改缓存载荷形状要顺带升 `CACHE_VERSION`）。

发布新版本：

```bash
npm version patch        # 或 minor / major，同时更新 package.json 与 tag
git push --follow-tags
```

`release.yml` 会从标签解析版本号（`v1.2.3` → `1.2.3`），并把它当作
**预发布**的条件是「补丁号为 0」或「版本号里带 `-`」（例如 `v1.2.0`、
`v2.0.0-beta.1` 都是预发布）。

## 许可

GPL-3.0
