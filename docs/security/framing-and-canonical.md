# 防嵌入与 canonical 核验

2026-11-02。旧式分支保护的读取/改动及后台浏览器审计按所有者要求跳过，不删除保护，不访问账户后台。已读取的新规则集包含八项必需检查、必须 PR、保持最新、禁止删除/强推、无旁路；这些配置立即生效，不依赖 Pages 部署。

## 点击劫持

`if (top !== self) { top.location = self.location; }` 属于旧式 frame busting。跨源导航权限与 iframe sandbox 可以限制它，不能将其当作完整防护。

优先方案是 HTTP 响应头：Content-Security-Policy: frame-ancestors 'none'，并加 X-Frame-Options: DENY。本站未来 Next 服务器和 Netlify 部署已配置这些头。frame-ancestors 不控制本站向外嵌入视频/音乐，只限制别人嵌入本站。

GitHub Pages 不执行 next.config.js/netlify.toml 的响应头设置；把这些头写成 meta 标签同样不能实现该功能。未改变托管域名或接入外部代理。

因此 Pages 使用本地静态托管备用方案：在 head 最早加入极小的隐藏样式及同步脚本，仅在顶层页面移除隐藏；框架内始终不展示本站交互界面，不依赖 top.location 导航。公用实现也覆盖 Design Guide、内容与许可、隐私三个独立 HTML。没有引入额外第三方项目或外部脚本请求。旧的已停用入口仍维持原来的严格 CSP/静态说明。

边界：这是针对当前 HTML/浏览器的 UI 防护，不等于服务器授权，也不阻止下载内容或恶意爬虫。禁用 JavaScript 时仅显示说明，不显示交互博客；该取舍使无脚本 sandbox 不能绕过隐藏。如果未来需要同时完整支持无 JavaScript 阅读与强制防嵌入，应使用能够设置响应头的托管/CDN，再评估是否移除备用隐藏机制。正常启用 JavaScript 并直接访问时不增加请求，不改变布局。

测试覆盖：顶层可见、同源/跨源 iframe、允许脚本的 sandbox、禁用脚本的 sandbox、无脚本提示；以及实际导出页面的 canonical/早期防护存在性。完整页面对照与服务器 HTTP 头在 PR 中检查。

官方依据：

- https://developer.mozilla.org/en-US/docs/Web/HTTP/Reference/Headers/Content-Security-Policy/frame-ancestors
- https://developer.mozilla.org/en-US/docs/Web/Security/Attacks/Clickjacking

## canonical

它是搜索引擎选择规范网址的提示，不是所有权证明或防盗/反爬机制，恶意复制者可以忽略、删除它。`https://github.io` 不是本站地址，不能将所有页面指向这个域名。

本站已有 canonical。本轮修复分类/标签等分页可能指向首页的情况：使用当前实际路由，保留页码与文章路径，移除 query/hash，仍使用配置中的本站主地址。首页、归档、分类第二页、文章和独立静态页面会做导出核对，避免重复插入 canonical。对应 Open Graph/结构化数据使用同一个正确页面 URL。

官方依据：

- https://developers.google.com/search/docs/crawling-indexing/canonicalization
- https://developers.google.com/search/docs/crawling-indexing/consolidate-duplicate-urls

## 审计状态

仓库扫描、测试、历史可达提交凭据检查与必要安全修复已执行。CodeQL 实际结果为零不代表依赖没有公告；工具链仍保留 deepmerge 与 minimatch 两类中低危公告，继续扫描，没有用忽略名单隐藏。

旧式保护按要求跳过；其他账户后台没有浏览器访问授权，不能宣称整个账户/所有外部项目已经审计。当前 Pages 已确认使用 Notion 内容读取及 Cloudflare Web Analytics；Clerk/Supabase/Algolia/Redis 在当前 Pages 配置中未启用，不能据此推断账户中不存在其他项目。Netlify 账户审计继续停止。

本轮不部署 Pages；所有者完成手动部署后，新的 HTML 防护及分页 canonical 才会进入主站。
