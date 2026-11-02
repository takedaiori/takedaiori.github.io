# 裁剪事项：已关闭（保留历史用途清单）

2026-11-02：依所有者要求，停止裁剪计划；不再删除或关闭以下功能，也不再把本清单作为后续待办。安全复核和修复记录见 [暂留内容安全复核](../security/retained-resources-review.md)。安全维护、漏洞升级和正常文章发布继续进行；账户后台未核验项目仍单独标注，不视为完成。

## 体积判断依据

先区分仓库源码、安装的 node_modules 和实际 Pages 发布目录：删除开发工具主要减少安装/维护成本，不会按它的安装体积减少首屏下载。此前已部署 f41c30d 的报告约 122.45 MiB，HTML+页面 JSON 约占 95.5%；其后的完整验证因 Notion 内容变化约 130.23 MiB，不能把两次差值直接当作代码裁剪收益。应比较同一份内容快照。

本仓库已经只剩 insignificantia 一个主题，不能再列出不存在的其他主题来凑裁剪收益。主题当前约 39 个文件/160 KB 源码；public/js 约 190 KB，public/css 约 45 KB，远小于重复页面数据。下面的源码体积不是预计发布收益。

## 第一组：优先模拟的页面数据与无业务静态路由

| 候选 | 具体用途 | 当前问题/候选操作 | 风险与保留方式 |
| --- | --- | --- | --- |
| pages/search/index.js 的 allPages/posts 等数据 | 浏览器本地按标题、摘要、标签、分类搜索 | 检查重复集合；将最小搜索索引改为打开搜索时加载，避免不搜索也携带全站元数据 | 必须保留正常搜索与中文/特殊字符匹配；不能只截断文章列表 |
| pages/search/[keyword] 及其分页 | 预生成关键词搜索结果 | 核验 search/NotionNext 等示例搜索路由是否仍有入口，确认无业务用途后停止预生成 | 不删除普通搜索入口和有效搜索链接；旧 URL 是否重定向要核验 |
| pages/404.js、pages/500.js | 错误页与返回导航 | 减少错误页面无须的全站数据，只保留显示/导航字段 | 404 必须仍返回正确状态并能返回主站；不应让错误页下载整份文章数据 |
| pages/dashboard/[[...index]].js | 会员首页、membership、balance、order、affiliate、user-profile/security 等 7 个路径 | 当前 Pages 没有启用对应会员服务，候选仅停止这些静态路由及 JSON 导出 | 保留 Next/Netlify 服务器源码和能力；不能直接删除所有 Clerk/服务端依赖 |
| components/ui/dashboard（11 个文件，约 34 KB） | 上述会员菜单、订单、余额、退出等 UI | 在确认没有当前主题调用后，决定保留服务器专用或后续删除 | 只删源码不会自动减少共享依赖；须先确认未来会员需求 |
| pages/sign-in、pages/sign-up | Clerk 登录/注册及二步验证路由 | 当前 Pages 未启用 Clerk，候选停止 Pages 静态生成 | 服务器部署需要时仍保留；不能破坏未来正常登录回调 |
| pages/auth/result.js、旧 pages/auth/index.js | 历史授权结果展示；旧 OAuth 已停用 | 清理结果页无须的全站数据，核验是否可停止 Pages 导出 | 保留已停用接口的安全拒绝行为，不能重新启用令牌跳转 |
| 文章详情、归档/分类/标签全局 props | 正文、目录、推荐、上一下篇与列表 | 已做过精简；继续检查大文章和不必要字段、重复摘要，不是删除正文 | 必须保留全部内容、目录、分页与图片，逐组测试超长文章/嵌套集合 |

此前发布报告中 dashboard 相关产物约 4.14 MiB，auth/result 约 0.55 MiB；这是候选路由关联文件的合计，不是保证可全部删掉的净收益，也不是每次访问都会下载这些文件。

## 第二组：需要确认未来业务的可选集成

| 依赖/模块 | 用途与已找到的调用 | 后续判断 |
| --- | --- | --- |
| @clerk/nextjs、@clerk/localizations、middleware.ts、登录/会员 UI | 身份认证、中间件、组织管理员与本地化 | 当前 Pages 未启用，但完整服务器能力已要求保留；优先隔离 Pages 导出，暂不直接删包 |
| @supabase/supabase-js、lib/server/claude/contributionStore.js | Claude 使用贡献事件/每日快照的服务端存储 | 先确认是否保留此功能及实际服务；不因为 Pages 不能运行 API 就认定所有服务器用途无效 |
| algoliasearch、AlgoliaSearchModal、react-hotkeys-hook | 云端搜索、构建时索引写入、搜索弹窗快捷键 | 当前未启用 Algolia，本地搜索可用；如确认不用云搜索，按整组调用裁剪，快捷键库不是独立无引用结论 |
| ioredis、lib/cache/redis_cache.js | 可选 Redis 服务端缓存 | 当前 Pages 未配置 REDIS_URL；需确认未来服务器是否使用，内存/文件缓存不能等同于跨实例 Redis |
| @vercel/functions、lib/cache/vercel_cache.js | Vercel 平台缓存接口 | 对 Netlify/Pages 可能不启用，但须核验缓存适配器选择和未来平台需求后决定 |
| @vercel/analytics、ExternalPlugins.js | Vercel 访客统计，按配置动态导入 | 当前使用的是 Cloudflare Analytics；如不保留 Vercel 统计可单独裁剪；保留 Cloudflare beacon |
| @waline/client、WalineComponent、RecentCommentListForExample | Waline 评论和最近评论列表，包含静态 CSS 导入 | 未见当前展示不等于无隐式加载，需检查 Notion 配置、组件入口与文章页 |
| react-facebook、FacebookPage | Facebook 页面插件 | 确认无页面引用且不再需要后才能删除 SDK/封装 |
| 邮件订阅与 @notionhq/client | Mailchimp 订阅、Notion 评论 API | 写接口目前默认关闭；与读取正文的 notion-client 不是同一个包，不能混删 |

以上全部为条件候选，不是已经确认可删。密钥或账户未使用状态与源码可选能力是否保留是两件事。

## 第三组：本地脚本、样式与资源

| 文件/组 | 用途 | 后续条件 |
| --- | --- | --- |
| public/js/aos.js、public/css/aos.css、AOSAnimation | 滚动进入动画 | 核验配置和动态加载入口，确认永不启用后才整组处理 |
| fireworks.js、sakura.js、starrySky.js、nest.js、flutteringRibbon.js、ribbon.js、mouse-follow.js | 鼠标跟随、烟花、樱花、星空、彩带/背景特效 | ExternalPlugins 按配置加载，不能凭零静态引用删除；需确认保留哪些效果 |
| cusdis.es.js、giscus.js 与对应评论封装 | 第三方评论功能 | 检查当前配置、备用评论需求，不能影响实际评论或隐私说明 |
| custom.js、custom.css | 自定义资源入口 | 先读内容和资源策略，确认不包含必要修正；不可重新打开不可信配置执行 JS |
| spoilerText.js、spoiler-text.css、prism-mac-style.css、img-shadow.css | 剧透遮罩、代码高亮外观、图片阴影 | 按实际旧文章和 CSS 类核验；即使没有菜单按钮，正文仍可能需要 |
| public/svg/not-by-ai 的多语言黑白徽章 | 可选文章来源/人工写作徽章 | 通过语言/颜色动态拼路径，需核验配置和内容声明；不能把 AI 文章自动标为纯人工 |
| 根目录 avatar/bg_image、多个 favicon、PWA 图标/manifest/sw.js | 默认头像/背景、浏览器图标、安装图标和离线能力 | 核验 fallback、SEO、manifest 和 service worker 注册；不能把没有显式 JSX import 当作无用途 |
| public/images/insignificantia 的 3 Hero、12 About 作品图 | 当前首页与作品集 | 属于明确业务资源，保留；未来按图片包维护，不纳入默认删除 |
| cloudflare/notion-image-proxy/wrangler.toml | 图片代理部署参数 | 已将上游作者域名替换为保留的 .invalid 示例域名；启用前必须配置本人拥有的域名，不执行任何部署 |
| prepare-personal-site-migration.yml | 旧仓库限定、固定历史提交的迁移打包工作流 | 迁移完成后可候选归档/删除，但不影响当前 Pages 体积，优先级低 |

## 明确保留，不再次默认列为删除项

- Lenis 脚本与封装、Typed、WOW 样式及加载器：所有者已选择保留，保持已加固状态。
- @netlify/plugin-nextjs、netlify.toml、Next 服务器构建与安全检查：完整服务器部署能力已选择保留。
- sharp：图片包完整解码和服务器图片能力均有用途；不是无 import 就能删的工具。
- Tailwind、PostCSS、Autoprefixer：由配置和构建命令隐式调用；先比较输出样式，不能以普通源码搜索代替依赖审计。
- TypeScript、@types、ESLint、Jest、Testing Library、Puppeteer/Lighthouse：类型/质量/安全与浏览器测试；开发依赖不按安装大小等比例进入 Pages。部分辅助工具可以继续审查，但不为了清空告警删除测试框架。
- React/Next、notion-client/notion-utils/react-notion-x：核心框架与正文渲染。
- react-tweet-embed：NotionPage.js 存在动态导入，文章嵌入内容需保留；不能先称为无用包。
- LICENSE、第三方许可原文与版权/隐私说明：不是用于瘦身的业务无关垃圾。
- 按历史决定保留的 pushUrl/stale 等维护流程不自动删除；若要改变此决定，另行讨论。
- 三张二维码和旧 fullscreen.js 已在前轮删除，不重复计算后续收益。

## 关闭结论

上述候选保留，不再安排逐组裁剪或追加确认。表中的候选判断仅为历史说明，不是待执行计划。
