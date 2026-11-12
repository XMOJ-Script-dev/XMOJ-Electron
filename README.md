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

项目介绍页和面向使用者的完整指南位于 [项目网站](https://elxmoj.xmoj-script.uk/) 与 [使用文档](https://elxmoj.xmoj-script.uk/docs/)；无需安装的公开浏览版位于 [XMOJ Electron 网页版](https://webxmoj.xmoj-script.uk/)。

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
- **状态**：评测记录（按评测结论类型着色：AC 绿、WA 红、RE 紫、CE 黄、
  TLE/MLE 黑、未知灰）、多条件筛选、游标翻页；搜索框右侧可进入**代码对比**。
  只有真正的「等待/评测中」才轮询，**「未知」不轮询**
- **提交**：Monaco 编辑器、语言选择、O2 开关、提交前检查、按题保存草稿。
  入口在题面页的「提交代码」按钮（侧栏不单列）
- **竞赛&作业**：比赛列表（共 104 场，可翻页、区分进行中/未开始/已结束）、
  比赛题目（题号按状态着色：已通过浅绿、未通过淡红、评测中淡黄）、
  **OI 排名 / 订正排名**（原生表格，从比赛详情进入，以浮层展示）
- **比赛回放**：原站已开放回放的比赛可在「返回列表」与「OI 排名」之间进入；使用当前账号获取点播授权，回放界面铺满应用内容区，支持进度、音量、倍速和关闭（Esc），退出时停止播放
- **月赛**：首页式双栏公告，右栏「我的月赛」与倒计时；服务器时间显示在首页。月赛页不显示推荐、服务公告、QQ群和复制按钮
- **下载**：软件列表卡片；站内文件先确认保存位置再下载，进度卡片可终止下载；站外链接交给默认浏览器
- **讨论**：板块与分页、引用回复、Markdown 左右实时预览、表单内嵌 Cloudflare 验证（成功后保持显示，失败或过期自动重试）；按脚本管理员/作者/锁定权限显示编辑与删除控件
- **短消息**：会话列表、消息气泡、发送；**新建会话前先校验用户是否存在**
- **个人主页**：已解决题目列表（判题站用 `p(id,count)` 脚本发射，主进程解析）、
  按题号筛选、点击直接跳到题面
- **代码对比**：两次提交逐行对比（+/- 行号与差异统计）
- **导出 AC 代码**：在侧栏底部的「导出 AC 代码」页面中，从当前账号的已解决题目里选择题目，按语言寻找可读的通过代码，显示进度并打包成 zip
- **关于 / 检查更新**：侧栏底部抽屉内的 dialog；版本取自 `package.json`，
  更新信息取自 `https://www.xmoj-script.uk/Update.json`（与用户脚本同一数据源）
- **通知提醒**：错误/警告以**底部 toast** 呈现；社区未读提及同样以 toast 提示
- **设置**：主题（亮/暗/跟随系统）、动画、单位、相对时间、自动刷新、
  **离开前确认**，以及**显式的云同步**（`GetUserSettings` / `SetUserSettings`）

另；XMOJ Electron 中加入了缓存功能，部分页面可在离线页面下使用缓存加载。

### Markdown 扩展

公告、题面及讨论的 Markdown 渲染支持 [洛谷编辑器帮助手册](https://www.luogu.com.cn/article/70w8j2pj) 中的排版语法：

- `:::info[标题]`、`:::success[标题]`、`:::warning[标题]`、`:::error[标题]`：可折叠提示框，标题后加 `{open}` 默认展开。
- `:::align{left}` / `{center}` / `{right}`：段落与标题对齐；`:::epigraph[——作者]`：题记。
- 容器以独立一行的 `:::` 结束，支持嵌套；父容器冒号数量须多于子容器（例如外层 `::::`、内层 `:::`）。
- 表格单元格使用 `<` 向左合并、`^` 向上合并；不合法的合并标记保留为文本。
- 表格前单独一行写 `::cute-table{three}` 或 `::cute-table{tuack}`，分别启用三线表或 Tuack 风格；`::cute-table{tuack=3}` 加粗第 3 列之后的竖线。
- 反引号或波浪线代码围栏支持语法高亮与行号，例如围栏信息 `cpp lines=2-3,5` 高亮第 2、3、5 行。未指定语言时使用 C++，`plain` 或未知语言按纯文本显示。内置 C/C++、Python、Java、JavaScript/TypeScript、Bash、JSON、HTML/CSS 高亮。

保留 GFM 表格、任务列表及 KaTeX 公式支持；代码中的公式和容器标记不参与渲染，最终 HTML 仍经过 DOMPurify 消毒。

## 项目网站与文档发布

网站源码和使用文档维护在 `website/`。`.github/workflows/pages.yml` 会在 `master` 分支的 `website/` 内容变更时，将完整静态站点发布到 `github-pages` 分支根目录；合入 `dev` 不会触发发布，需等变更进入 `master`，或在 Actions 页面手动运行工作流并选择包含网站内容的分支。

首次启用时，先在 Actions 页面手动运行一次该工作流以创建 `github-pages` 分支，再到仓库 **Settings → Pages** 将部署来源设为 `github-pages` 分支的根目录。`website/CNAME` 将自定义域名 `elxmoj.xmoj-script.uk` 一并发布；还需在 GitHub Pages 设置中配置该域名，并在 DNS 提供商中按 GitHub 指引配置记录。还需在 **Settings → Actions → General → Workflow permissions** 中允许 **Read and write permissions**；否则 `GITHUB_TOKEN` 即使在工作流中申请了 `contents: write`，仍可能因仓库权限设置而无法推送分支。

公开浏览版由 Cloudflare Pages 项目从本仓库的 `dev` 分支构建。仓库根目录的 `wrangler.toml` 将 Pages 项目名设为 `webxmoj`、产物目录设为 `web-dist`，并固定 Workers compatibility date。首次创建 Cloudflare Pages 项目时，项目名须为 `webxmoj`；在项目 **Settings → Builds & deployments** 中将生产分支设为 `dev`、Root directory 留空、Build command 设为 `npm ci && npm run build:web`。再将 `webxmoj.xmoj-script.uk` 绑定为 Pages 自定义域名，并按 Cloudflare 指引完成 DNS。以上生产分支、构建命令和自定义域名仍由 Cloudflare 控制台管理，仓库配置文件不能修改账户中的现有项目或 DNS 记录。部署前需在 Pages 项目的 **Settings → Variables and Secrets** 添加加密密钥 `XMOJ_SESSION_KEY`；可本地生成 `openssl rand -base64 32`，并用 `npx wrangler pages secret put XMOJ_SESSION_KEY --project-name=webxmoj` 上传，勿将密钥写入仓库。网页登录凭证只发给同源 Pages Function；函数将 XMOJ 的 `PHPSESSID` 封装在 `Secure; HttpOnly; SameSite=Lax` 加密 Cookie 中，前端不接触或持久化它。社区 API Token 只在服务端单次请求期间使用，不写入浏览器存储。网页构建使用独立的 `web/index.html`，不使用仓库根目录供 Electron 打包的 `index.html`。网页版支持匿名浏览首页、月赛、软件下载和公开用户主页；题库、题面、状态、竞赛列表/详情/排名等需先登录，Pages Function 会验证加密会话并仅在服务端转发 XMOJ 会话。登录后还可提交代码、查看源码与测试点、对比代码、使用讨论区（含 Turnstile 验证）、私信、通知和云同步设置。浏览器偏好保存在本机；本机文件导出、竞赛视频回放、应用更新检查和原生退出确认仍仅由桌面版提供。部署时还需确认 Turnstile 站点密钥允许 `webxmoj.xmoj-script.uk`，并在 Cloudflare 配置 `/api/session` 与 `/api/community` 的速率限制；Pages 项目和 DNS 仍需账户所有者在控制台配置。GitHub Pages 的 `github-pages` 分支只用于介绍页及文档。

网页版支持可分享的直接访问路径：帖子为 `/discussion/{帖子编号}`（分页可追加 `?page={页码}`），独立题目为 `/problem/{题目编号}`，竞赛为 `/contests/{竞赛编号}`，竞赛内题目为 `/contests/{竞赛编号}/problems/{题目编号}`。其他已支持的视图也有稳定路径（如 `/problemset`、`/status`、`/monthly`、`/settings`）；浏览器刷新、前进和后退会恢复对应视图及已支持的实体编号。

### Cloudflare Pages API 速率限制

在 `webxmoj` 区域的 **Security → WAF → Rate limiting rules** 中创建以下规则，Characteristic 选 **IP**，Action 选 **Block**。表达式均只匹配 `/api/` 动态接口，不会限制静态页面、脚本或图片；规则顺序建议先具体接口、后兜底。Cloudflare 各计划可用的窗口、规则数量及自定义响应能力可能不同，若控制台不提供相应选项，应优先保留登录和提交规则并按计划能力调整。

| 匹配表达式 | 次数 / 周期 | Block 持续时间 |
| --- | ---: | ---: |
| `http.request.uri.path eq "/api/session" and http.request.method eq "POST"` | 10 / 600 秒 | 600 秒 |
| `http.request.uri.path eq "/api/submit" and http.request.method eq "POST"` | 10 / 60 秒 | 60 秒 |
| `http.request.uri.path eq "/api/community" and http.request.method eq "POST"` | 60 / 60 秒 | 60 秒 |
| `http.request.uri.path starts_with "/api/" and http.request.method eq "GET"` | 60 / 60 秒 | 60 秒 |
| `http.request.uri.path starts_with "/api/"` | 120 / 60 秒 | 60 秒 |

规则以 Cloudflare 识别的来源 IP 计数；不要把 Cookie、会话 ID、密码或请求正文配置为计数特征。`/api/community` 目前将读写操作统一 POST 到同一路径，按路径无法为发帖、回复、私信分别限额。Cloudflare 区域规则之外的 Pages 项目若不由该区域代理，需在实际承载该域名的区域配置这些规则。初期应监控误拦截、请求量和上游负载，再依据真实流量调整；共享校园/NAT 出口会让多位用户共用 IP 额度。Cloudflare Block 响应是否包含 `Retry-After` 取决于可用的响应配置；网页版会在响应提供该头时显示等待时长，并在当前页面会话中暂缓对同一路径的后续请求，但不会自动重试登录、提交或社区写操作。[Cloudflare Rate limiting rules 文档](https://developers.cloudflare.com/waf/rate-limiting-rules/)。

## 开发

```bash
npm install
npx install-electron    # 下载 Electron 二进制（见下）
npm run dev            # 启动 Vite + Electron 开发环境
npm run typecheck      # vue-tsc 类型检查
npm run build          # 类型检查 + 构建 + 打包安装程序
npm run build:dir      # 只产出未打包的目录，便于本地验证
```

`electron` 43.x 的 npm 包**没有 `postinstall`**（只提供 `install-electron` 这个 bin），
所以 `npm install` 之后 `node_modules/electron/dist` 是空的，`npm run dev` 和
`npm run test:e2e` 都会因为找不到 Electron 而失败。装一次即可：

```bash
npx install-electron
```

如果所在网络连不上 `github.com`（打包时 electron-builder 要从 GitHub Releases 取
electron zip、NSIS 和 winCodeSign），用镜像：

```bash
export ELECTRON_MIRROR=https://npmmirror.com/mirrors/electron/
export ELECTRON_BUILDER_BINARIES_MIRROR=https://npmmirror.com/mirrors/electron-builder-binaries/
```

Windows PowerShell 对应 `$env:ELECTRON_MIRROR = '...'`。GitHub Actions runner 能直连
GitHub，CI 里不需要这两个变量。

### 测试

`tests/` 下是 15 套 Node 侧校验 + 1 套 Electron 端到端：

```bash
npm test              # 解析器校验：对真实页面快照 + 构造的 HUSTOJ 标记
npm run test:poller   # 轮询器行为（启动/自停/不重叠/异常不中断）
npm run test:diff     # 逐行 diff（插入/删除/行号单调/空侧/大输入）
npm run test:cache    # 页面缓存（命中标记、maxAge 失效、按键清除、版本失效）
npm run test:async-resource # 缓存读取/后台刷新期间的加载状态与请求竞争
npm run test:web-functions # 网页版 API 代理：固定上游、错误限制、会话与代码提交
npm run test:native-views # 题面卡片/样例包装清理/`/upload` 绝对化、排名表格、
                          # 个人主页 `p(id,count)` 解析（离线，合成 fixture）
npm run test:cloud-settings # 云同步的**线格式**：`Settings` 必须是 JSON 字符串，
                            # 且读取时会解析回对象（用本地 stub 后端，不碰真实账号）
npm run test:codecheck # 提交前代码检查（文件 IO / 拼写 / 括号 / 头文件）
npm run test:markdown # 公告 Markdown + KaTeX 渲染（含公式/货币等边界情形）
npm run test:markdown-dom # Electron 中验证扩展语法的交互、布局及真实 HTML 消毒
npm run test:pages    # 官网静态页：标题、锚点、样式表、无登录表单与桌面/移动端布局
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

E2E 对首页、题库、状态使用 `aria-busy` 等待实际加载完成（包括缓存后的后台刷新），
而不是只看骨架屏是否消失或固定等待几秒。题库冷启动需要汇总全部分页，等待上限为
120 秒；状态翻页等待上限为 60 秒。超时或内容不正确仍会失败，不会跳过断言。

## 许可

GPL-3.0
