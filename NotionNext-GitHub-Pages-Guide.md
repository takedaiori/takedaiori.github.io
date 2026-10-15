# NotionNext + GitHub Pages 通用开发文档

**V0.5 · 正式运行与可复用维护规范**  
修订日期：2026-10-15（香港时间）

这是一份可公开复用的建站与维护规格。本版依据《Insignificantia 技术与设计规格 V0.74》《Insignificantia 正式发布与迁移手册 V0.3》《Insignificantia 后续维护手册 V0.5》修订。参考项目已进入正式运行阶段，首次建站、日常发布和未来迁移分别说明。通用文档不复制真实 Token、Secret、Notion ID、个人账号、仓库归属、Worker URL、部署 Run ID 或 Commit SHA，环境数据统一使用占位符。

## 1. 系统目标与总体架构

目标是把 Notion 作为可视化内容后台，把 NotionNext 作为内容解析与静态生成引擎，把 GitHub Pages 作为公开静态托管，再用 Cloudflare Worker 把 Notion 内容更新转换成 GitHub Actions 的自动部署。

内容路径为私人 Notion 写作区，经作者确认后进入 Published 数据库；NotionNext 在构建时读取内容、套用主题并生成静态页面，由 GitHub Actions 部署至 GitHub Pages。自动触发路径为 Notion Webhook → Cloudflare Worker 验签 → GitHub workflow_dispatch。Worker 只负责触发，公开阅读端不执行 Notion 抓取或静态构建。

核心原则  
内容后台、构建系统、公开托管、自动触发四层分离。任何一层出现问题时，应先定位层级，再做最小修复；不要用前端 CSS 去修数据问题，也不要用删除依赖去修平台权限问题。

### 1.1 为什么选择静态托管

- 公开阅读端不需要常驻 Node/Next.js Server，降低托管成本和运维面。

- 文章内容在构建时生成 HTML/JSON/静态资源，访问速度稳定，GitHub Pages 可直接分发。

- 静态代码和资源可版本化，但回滚必须重新部署。构建读取的是当时 Notion 内容，代码 SHA 不冻结数据库；回退代码不会自动恢复 Notion、Secret 或 Worker 配置。

- 代价是：/api/\*、middleware、SSR、服务器端 Image Optimization 等运行时能力不可被 GitHub Pages 执行。需要后端能力时应外置到 Worker、Serverless 或第三方服务。

## 2. 基础仓库与运行环境

### 2.1 仓库形态

推荐使用 GitHub Pages 根站仓库，以避免 Project Pages 的 basePath 复杂度。个人根站通常命名为 \<GITHUB_USERNAME\>.github.io；组织根站通常命名为 \<ORG_NAME\>.github.io。

Repository: \<OWNER\>/\<OWNER\>.github.io  
Default branch: main  
Pages source: GitHub Actions

### 2.2 工具链固定与依赖版本

- 固定 Node 主版本和包管理器，不使用 latest 作为生产基线。参考项目部署固定 Node 22、Yarn 1.22.22 和 frozen lockfile；复用项目应将自己的选择同时写入 CI、部署和本地环境。

- 提交 lockfile，并在 CI/部署中使用 frozen/immutable 安装。

- NotionNext、Next.js、React 升级单独评估，不与普通文章发布或视觉修改混合。package.json 的 ^ 或 ~ 表达允许范围，实际安装版本以 lockfile 与构建日志为准；依赖回滚同时恢复清单和 lockfile。

- 保留 CI、静态导出、Pages deploy 与安全扫描；不要为“仓库整洁”删除仍有维护价值的诊断工具。

## 3. Notion 内容层设计

### 3.1 Draft 与 Published 分离

将私人写作区与公开 Published 数据源分离，只授权必要内容。授权范围、公开分享、Published/Post 筛选和 workspace 归属校验共同构成边界，不能只靠数据库名称保证隔离。发布前由作者确认，发布后抽查实际输出。

### 3.2 Published 数据库最小字段

| 字段     | 用途                     | 建议     |
|----------|--------------------------|----------|
| title    | 文章/页面标题            | 必需     |
| status   | 发布状态，例如 Published | 必需     |
| type     | Post / Page              | 必需     |
| summary  | 列表摘要                 | 推荐     |
| date     | 发布日期                 | 推荐     |
| category | 单一主分类               | 推荐     |
| tags     | 细粒度标签集合           | 推荐     |
| slug     | 稳定英文路径             | 强烈推荐 |

Category 与 Tags  
Category 是主分类；Tags 是细粒度标签。不要使用 tags\[0\] 或“第一个 Tag”隐式充当 Category，否则 Archive 与页面语义会变得不稳定。

### 3.3 页面正文

正文继续使用 Notion 原生块：段落、H1/H2/H3、Quote、Callout、图片、Caption、链接、列表等。视觉作品、Hero 等站点级资源不要强行塞进文章数据库列；它们属于站点静态资源层。

## 4. URL、路由与信息架构

一个可维护的内容站应先冻结路由，再做视觉。推荐最少包含 Home、Article List、Archive、About、Article Detail、Category、Tag、404。

| 页面           | 建议路径               | 职责                                 |
|----------------|------------------------|--------------------------------------|
| Home           | /                      | 编辑式入口与按约定数据入口展示的文章 |
| Article List   | /page/1, /page/2 ...   | 原生分页入口                         |
| Archive        | /archive               | 按分类/年份浏览                      |
| Category       | /category/\<category\> | 主分类结果                           |
| Tag            | /tag/\<tag\>           | 标签结果                             |
| About          | /about                 | 说明与作品集                         |
| Article Detail | /article/\<slug\>      | 永久文章 URL                         |
| 404            | /404                   | 无效路径                             |

不要创建平行数据通道  
如果 NotionNext 已有稳定的 /page/\[page\]、Category、Tag、Slug 数据路径，优先复用原生 SiteData API。不要为了改 UI 重新造一套 article.js 数据入口。

## 5. 自定义主题与前端层

### 5.1 主题职责

自定义主题负责布局、视觉、交互和数据呈现，不重写 Notion 数据层。主题应为所需 Layout 明确提供实现，或明确提供 EmptyLayout，避免运行时悄悄借用其它主题导致闪屏或风格漂移。

主题入口通常包含 index.js、页面组件以及主题样式文件。目录可以按项目组织为 components、styles、motion，也可以把样式放在主题根目录；不得把示意目录当作框架硬性要求。

### 5.2 Loading / Fallback

动态主题加载阶段也应使用与最终站点一致的中性 loading shell。若首屏闪出上游默认主题，不要先删数据层或所有内置主题；先确认 DynamicLayout/Theme Resolver 的 fallback 与 loading 视觉。

### 5.3 动效与可访问性

- 页面进入动效应包裹内容区而不是固定导航，避免 Header 跟随抖动。

- 长文 Article Detail 可选择不播放整页进入动画，减少阅读干扰。

- Hero 轮播应同时定义进入态和离开态，并保留旧 slide 足够时间完成 CSS transition。

- 必须支持 prefers-reduced-motion: reduce；系统请求减少动态效果时关闭位移/淡变不是故障。

## 6. 静态视觉资源

### 6.1 推荐目录

建议把 Hero 与作品集保存在 public 下的独立 hero 和 portfolio 目录；路径使用 \<PUBLIC_MEDIA_DIR\> 占位，槽位采用稳定文件名。favicon.ico、favicon.png、favicon.svg 及移动端图标分别维护，只有实际存在且被引用的资产才属于交付范围。

### 6.2 GitHub Pages 的图片边界

重要：static export 没有 /\_next/image  
GitHub Pages 不提供 Next.js 服务器端 Image Optimization。自定义 SVG/WebP/PNG 优先用 public 静态 URL 或对 Next Image 显式设置 unoptimized；否则可能在静态站出现 /\_next/image?... 404。

### 6.3 Favicon

SEO Head 输出 rel=icon 后，浏览器还会强缓存 favicon。替换浏览器标签页图标时可直接使用有效 ICO 并更新 FAVICON 路径或版本 query；PNG/SVG 及移动端/PWA 图标应按实际引用另行更新，并用无痕窗口或直接访问 /favicon.\* 验证真实部署资源。

### 6.4 页面视觉资产的两种人工维护路径

建议保留本地 Git 与浏览器 ZIP 两条维护路径。参考项目优先使用浏览器 ZIP 加安装 Workflow；有稳定本地环境时也可用 GitHub Desktop。两条路径都直接提交原始静态字节，不在安装时转码。

### A. GitHub Desktop：标准维护方案

- Clone 生产仓库，在本地直接覆盖 \<PUBLIC_MEDIA_DIR\>/hero/ 与 \<PUBLIC_MEDIA_DIR\>/portfolio/ 中的目标文件。

- 用 GitHub Desktop 检查变更，只提交预期静态资源；Commit → Push → CI → Pages Deploy。

- Git 不会自动重新压缩 WebP/JPEG/PNG；图像优化应在提交前由维护者显式完成。

### B. ZIP + Workflow：浏览器 / 小白 / 应急方案

为静态页面视觉资产准备一个受控的媒体安装 Workflow，例如 .github/workflows/install-page-media-pack.yml。推荐只接受白名单目录和文件名，检查图片格式，复制原始字节，自动提交并消费临时 ZIP。

媒体包示意为 \<PAGE_MEDIA_PACKAGE\>.zip，根目录直接含 hero/ 和 about/。hero/ 中为 Hero1.webp 至 Hero3.webp，about/ 中为 About1.webp 至 AboutN.webp。实际槽位数、文件名和目标路径以已有安装器白名单为准。

- ZIP 必须放在约定位置；内部不要多套一层未知总目录。目录与文件名应视为大小写敏感。

- Workflow 应支持局部更新，未提供的槽位保持原文件不变；同时拒绝路径穿越和非允许格式。

- 媒体安装 Workflow 与 Pages Deploy 最好分开：先检查安装结果，再发布到公开站。

- 通用文档仅记录配置名称、占位符、用途和验证方法。真实凭据保存在平台 Secret；运行标识和部署证据留在项目运维记录，不粘贴进公开示例。

### 6.5 页面作品说明文字的维护入口

如果作品说明不是由 CMS/Notion 驱动，而是由主题静态代码生成，应在主题组件中明确一个可定位的数据入口（例如 portfolioItems\[\].title 和 src）。文档必须说明该字段是“全局统一文案”还是“逐项文案”，避免维护者误以为修改图片 ZIP 会同时修改文字。

### 6.6 格式、比例与文件体积原则

静态页面媒体建议使用 WebP 等浏览器原生支持的现代格式。比例应与实际卡片/画框一致；若使用 object-fit: cover，需预留安全裁切区。不要为追求极小文件强行压缩到出现色带、色块或暗部细节损失。通用规范不应写死一个统一 KB 上限，应结合页面数量、首屏位置、懒加载策略和真实 Network/Lighthouse 结果设定项目预算。

## 7. Slug、SEO、RSS 与 Sitemap

### 7.1 英文 Slug

中文标题可以在首次发布时生成英文 slug，但必须“一次生成、写回 Notion、已有值不覆盖”。不要在每次 build 时重新翻译标题，否则永久链接会随标题变化。

IF slug is empty:  
generate semantic-lowercase-hyphen-slug  
write back to Notion  
ELSE:  
keep existing slug unchanged

### 7.2 SEO 基线

- 正式 SITE_URL、canonical、og:url、Feed 和 sitemap 应统一到最终公开地址。检查环境变量、代码默认值和 Notion 配置的实际优先级，不凭变量已填写就认定输出正确。

- sitemap.xml 与 robots.txt 在静态构建中生成。

- RSS/Atom/JSON Feed 应在构建阶段生成静态文件，不依赖 GitHub Pages 上的 API Route。

- 仓库迁移后必须抽查 canonical、sitemap 与 RSS 是否仍指向旧域名。

## 8. GitHub Actions 静态部署

### 8.1 Workflow 基本步骤

1. Checkout main。

2. 安装固定 Node 与包管理器。

3. 使用 frozen lockfile 安装依赖。

4. 设置必要环境变量与仓库 Secret。

5. 执行静态 export。

6. 写入 .nojekyll。

7. 上传 github-pages artifact。

8. 使用 GitHub Pages deploy action 发布。

部署触发示例为 on: workflow_dispatch。最小权限为 contents: read、pages: write、id-token: write。参考项目仅通过 workflow_dispatch 部署；普通 push 会触发质量检查，但不会自动发布 Pages。并发策略可让同一 Pages 组只保留最新部署，维护者应检查旧 run 是否被取消。

部署前必须检查 \<NOTION_PAGE_ID\> 已配置；缺失时直接失败，避免悄悄使用上游演示库。固定主题、关闭主题切换和分页等环境项必须沿完整配置链核对。

### 8.2 仓库 Secrets

真实值只存在 GitHub/Cloudflare 的 Secret 管理界面。文档、Git、截图、URL、日志示例中只写占位符。

| 占位符                    | 存放位置                 | 用途                          |
|---------------------------|--------------------------|-------------------------------|
| \<NOTION_PAGE_ID\>        | GitHub Actions Secret    | Published 数据源/根页面标识   |
| \<SITE_URL\>              | 环境变量                 | 公开站 URL / canonical 基准   |
| \<GITHUB_DISPATCH_TOKEN\> | Cloudflare Worker Secret | 调用 GitHub workflow_dispatch |
| \<NOTION_WEBHOOK_SECRET\> | Cloudflare Worker Secret | 验证 Notion Webhook HMAC      |

## 9. Notion → Cloudflare Worker → GitHub 自动发布

### 9.1 Webhook

在 Notion Integration / Connection 中只授权 Published 数据源，然后创建 Webhook subscription，目标是 Cloudflare Worker 的公开 HTTPS URL。

### 9.2 首次验证

1. Notion 创建 subscription 时会发送一次 verification payload。

2. 首次握手应由受控初始化流程取得 verification token，并由维护者写入专用 Secret；不要假设普通 Worker 请求可以自行持久化平台 Secret，不在公开响应或长期日志中输出验证值。

3. 正常事件随后带 X-Notion-Signature；Worker 必须基于原始 raw body 计算 HMAC-SHA256。

4. 不要 JSON.parse 后再 stringify 做验签，否则字节变化会导致签名不一致。

### 9.3 调用 workflow_dispatch

Worker 验签成功且事件在 allowlist 中后，调用 GitHub REST 的 workflow dispatch endpoint。Fine-grained PAT 只授予目标仓库，并给 Repository permissions → Actions: Read and write。

调用形态为 POST /repos/\<OWNER\>/\<REPO\>/actions/workflows/\<WORKFLOW_FILE\>/dispatches，Authorization 使用 Bearer \<GITHUB_DISPATCH_TOKEN\>，请求体为 {"ref":"\<DEPLOY_BRANCH\>"}。示例只保留占位符，禁止代入真实口令。

PAT 需要周期维护。每月检查到期日，可在到期前45天轮换并设置提前提醒。轮换的是 GitHub dispatch PAT 及 Worker 中保存它的 Secret；Notion HMAC 验签 Secret 属于另一条凭据链，不应同时更改。

## 10. 安全边界

### 10.1 Notion Workspace 归属校验

如果路由支持按 UUID 回退读取 Notion block，必须验证该 block 属于本站允许的 Notion workspace。无法确认归属时应 fail closed（404），不能把任意公开 Notion block 当成本站 Published 内容。

生产保护项  
Workspace ownership validation、Published-only 数据边界、Webhook HMAC、最小权限 PAT 都属于安全保护层，不能在“瘦身”或主题重构中顺手删除。

### 10.2 Secrets

- Token/Secret 不写入 Git。

- 不把 Secret 放在 Worker URL query。

- Cloudflare 敏感凭据使用 Secret 类型，而不是普通 vars。

- Token 轮换后做真实端到端验证，旧 Token 在验证成功后删除/吊销。

## 11. 评论、搜索与其它可选能力

静态博客可以保留可选能力源码但默认关闭。源码存在不等于首屏一定加载；是否删除应由真实 bundle/performance 数据而不是“看起来没用”决定。

| 能力                  | 默认建议   | 说明                                                           |
|-----------------------|------------|----------------------------------------------------------------|
| Search                | 可选       | 首版可隐藏入口；未来恢复时复用原生能力                         |
| Comments              | 可选       | GitHub Pages 无自建 API；推荐 Giscus 或独立 Twikoo/Waline 后端 |
| Animations            | 可选       | 前端静态能力；注意 reduced-motion                              |
| Auth/Dashboard        | 通常不需要 | 如果未展示，可以保留但不要把它当静态站后端                     |
| AI/Chat/Ads/Music/PET | 通常关闭   | 保持配置关闭即可，不必为仓库洁癖主动删除                       |

## 12. 上线验收矩阵

- □ Home 可访问，文章内容与实际数据入口一致；不把最近编辑顺序误称为发布日期顺序。

- □ Article List 分页正常。

- □ Archive / Category / Tag 正常。

- □ About 已配置的个人链接正确；未配置入口隐藏，介绍文案与可见入口一致。

- □ Article Detail 的 H1/H2/H3、Quote、Callout、链接、图片、Caption、列表、待办、折叠、表格和代码正常，深色主题无默认黑字。

- □ 404 正常。

- □ favicon 正常。

- □ Hero/作品集静态图片正常。

- □ 桌面与手机端正常。

- □ reduced-motion 开/关行为正确。

- □ RSS/Atom/JSON Feed 可访问。

- □ sitemap.xml / robots.txt 可访问。

- □ 手动 workflow_dispatch 成功。

- □ 一次真实 Notion 修改与 Worker 事件、目标部署 run、build/deploy success 及公开内容对应；仅看到 workflow_dispatch 不能区分人工和自动触发。

- □ 无真实 Token 出现在仓库、页面、日志截图或文档。

## 13 首次建站流程

1. 仅对首次建站执行：Fork 或复制稳定源码到选定 Pages 仓库；已有生产站不得把此节作为重置步骤。

2. 配置 GitHub Pages Source = GitHub Actions。

3. 准备 Published Notion 数据库并只授权发布 Integration。

4. 配置仓库 Secret 与正式 SITE_URL。

5. 先手动跑 GitHub Pages workflow，确认静态站能发布。

6. 创建 Cloudflare Worker，配置两类 Secret：GitHub dispatch token 与 Notion webhook secret。

7. 创建 Notion Webhook subscription，完成 HMAC 验签。

8. 上传 favicon / Hero / Portfolio 等站点视觉资源。

9. 配置稳定 slug 生成策略。

10. 执行第 12 节完整验收。

11. 最后用一次真实 Notion 编辑验证自动发布闭环。

## 14. 迁移与回滚

### 14.1 推荐迁移方式

首次从实验环境迁移时，优先在目标仓库并行部署稳定快照，完成验收后再切换。目标仓库已存在时先备份，无需删除仓库；已进入正式运行的站点不重复覆盖导入。仓库 Transfer 不自动保证关联 Pages 地址重定向，旧地址处理需单独验证。

### 14.2 迁移必须同步修改

- GitHub owner/repo

- Pages 设置

- 仓库 Secrets

- SITE_URL / canonical

- Cloudflare Worker owner/repo/workflow/ref

- Fine-grained PAT 的目标仓库 scope

- RSS / sitemap / robots 的公开 URL

- 自定义域名（如有）

### 14.3 回滚原则

- 记录每次成功的源码提交、实际部署提交、Pages run、内容状态和外部配置变更；这些证据不能相互替代。

- 一次变更只做一个目的。

- 故障优先 Revert 引入回归的最小提交并重新部署，依赖回退同时恢复 lockfile。手动发布可作为自动触发失效时的兜底；不要因 Worker 故障回滚正常页面，也不默认切回实验仓库。

- 上游升级先在实验环境验证，再移植到生产。

## 15. 维护与升级边界

稳定优先于“清理干净”  
关闭但未使用的源码、历史兼容层或可选依赖，只要没有造成安全、升级、平台限制或可测性能问题，就不需要主动删除。大规模“瘦身”经常比它带来的真实速度收益更危险。

- 出现安全漏洞：最小补丁 + CI + static export + Pages QA。

- 出现上游平台变化：先查上游 Issue/Release，再移植最小修复。

- 出现性能问题：先有 Lighthouse/bundle/真实网络指标，再做优化。

- Next.js/NotionNext 大版本升级：单独分支/实验仓库，完成完整页面矩阵与自动发布闭环后再上线。

## 16. 环境占位符清单

| 占位符                    | 含义                             |
|---------------------------|----------------------------------|
| \<OWNER\>                 | GitHub 用户或组织                |
| \<REPO\>                  | Pages 仓库                       |
| \<SITE_URL\>              | 公开站 URL                       |
| \<NOTION_PAGE_ID\>        | Published 根页面/数据源标识      |
| \<NOTION_WORKSPACE_ID\>   | 可选：允许的 Notion workspace id |
| \<WORKER_URL\>            | Cloudflare Worker HTTPS 地址     |
| \<WORKFLOW_FILE\>         | Pages workflow 文件名            |
| \<GITHUB_DISPATCH_TOKEN\> | 只存 Secret 管理界面             |
| \<NOTION_WEBHOOK_SECRET\> | 只存 Secret 管理界面             |

## 17. 官方参考

| 主题                              | 官方文档                                                                                                         |
|-----------------------------------|------------------------------------------------------------------------------------------------------------------|
| GitHub Pages                      | https://docs.github.com/pages                                                                                    |
| GitHub workflow dispatch REST API | https://docs.github.com/rest/actions/workflows                                                                   |
| GitHub Fine-grained PAT           | https://docs.github.com/authentication/keeping-your-account-and-data-secure/managing-your-personal-access-tokens |
| Cloudflare Workers Secrets        | https://developers.cloudflare.com/workers/configuration/secrets/                                                 |
| Notion Webhooks                   | https://developers.notion.com/reference/webhooks                                                                 |

## 18 静态页面维护的可复用实现

站点图片、作品标题、社交 href 与 UI 交互应有独立入口。图片包负责静态字节安装，主题数组负责标题和链接；素材安装与公开部署分成两个可检查阶段。

### 18 1 媒体包与发布时序

1 先复用仓库已有安装器，确认触发条件、固定包名、目录与文件白名单。标准包名可配置为 main 上特定路径 push 触发，同时保留 workflow_dispatch 手动入口。

2 ZIP 只装图片，不在安装时二次压缩或改尺寸。检查路径穿越、真实格式、同槽位多来源冲突；只提交识别的目标文件并删除消费包。

3 浏览器上传受平台单文件限制；包较大时拆为已验证的局部更新包或走 Git，不强制降低原图质量。上传前核对当时平台限制，不把媒体局部安装方案用于整站源码分包。

4 安装 commit 进入 main 后再执行 Pages Deploy，确认 head SHA 包含媒体更新。若部署 workflow 仅 workflow_dispatch，普通 push 不会自动发布。

### 18 2 社媒与作品数据

社媒使用含 name、href、icon 的显式数组，复用内嵌 SVG 和 currentColor、hover/focus 样式。正式发布时使用已确认的个人 URL；未配置 href 的入口过滤隐藏，不以平台公共首页冒充个人主页。新增或隐藏入口后检查分隔线、排列和键盘操作。作品使用 id、title、src 显式数组，图片及 Lightbox 共用逐项 title；图片包不会更换作品标题。

### 18 3 视口浮层与独立目录

页面进入动画中的 transform 可能改变 fixed 浮层的包含块。Lightbox 和长文目录可挂载到 document.body 的 portal，并使用 viewport 尺寸约束；检查背景变量在 body 上是否可继承。浮层必须明确外侧、Esc、关闭动作，不通过目录遮罩锁住整页。

目录标记与有效 Heading 一一对应；每个标记是独立章节链接，并与标题共用跳转处理。Notion UUID 可有带横线、压缩 ID 或块类名等变体，统一匹配后 scrollIntoView、更新 hash；缺少 ID 时谨慎回退标题匹配。点击后保持展开与仅 hover 临时展开应分开管理，避免点击导航立即关闭。

右侧抽屉用滑出动画、标题位移/高亮和竖线加粗表达交互，保持页面背景、无多余外框。为长目录设置视口高度上限及内部滚动，为手机隐藏控件并还原正文边距。动画和滚动需支持 reduced-motion，标记需键盘聚焦和可访问名称。手机主导航采用局部下拉，点击页面其他处不应被遮罩拦截。

### 18 4 有限摘要 Feed

在构建阶段生成 RSS、Atom、JSON Feed，三种格式复用同一筛选函数：公开 Post → 按发布日期倒序 → 最多 3 篇 → title、summary、原文 URL。只写摘要，不抓取全文正文或嵌图。静态写入为异步时必须 await，相关页面调用者也要等待完成；API 版本可保持规则一致，但不作为 Pages 运行时能力。

最新上传、最近编辑、发布日期、数据库手动顺序是不同规则。文档按页面真实数据入口记录，避免把首页与 Feed 自动视为同一种排序。

## 19 迁移预检与导入边界

迁移准备 Workflow 固定 source commit，在临时目录应用目标 host、RSS URL 与数据源缺失保护，构建和校验后输出源 ZIP 与报告。记录 run head 与包内 source_commit 两个值；CI、Pages success、迁移预检 PASS 是三个不同结论。空文章库或未覆盖分类/标签时，PASS 只能表示已存在页面通过，不表示首发内容验收完成。

Artifact 下载可能是外层传输 ZIP，里面还有实际 source ZIP。只将内层源码包交给导入器；内层应直接包含项目文件和迁移 manifest，拒绝误解压外层后只得到一个 ZIP 文件。

已有目标仓库先备份再导入，不必删除仓库。网页上传 ZIP 只有在目标 Import Workflow 已实现、进入默认分支且通过演练后才可执行；图片安装器不能导入整个项目。若 workflow 身份令牌无权更新 workflows 文件，应先解决写入权限或采用经授权的 Git 导入，不绕过平台检查。

未来迁移分为导入前准备、目标手动部署验收、自动链切换后三阶段。Worker 最后切换；旧站是否能回滚需验证其当前代码、凭据与托管状态，不能仅因实验仓库仍存在就认定可立即恢复。

### 核验来源

https://docs.github.com/en/repositories/working-with-files/managing-files/adding-a-file-to-a-repository

https://docs.github.com/en/rest/actions/workflows#create-a-workflow-dispatch-event

https://docs.github.com/en/repositories/creating-and-managing-repositories/transferring-a-repository

## 20 正式运行后的日常发布

项目进入正式运行后，默认工作是内容发布和局部维护。首次建站、整站导入、重新创建 PAT 和切换 Worker 只在明确需要时执行。历史迁移 P0、空库预检和实验部署记录不再作为当前生产基线。

### 20.1 内容发布

在私人 Notion 完成文章并人工确认后，放入 Published，核对状态、类型、日期、分类、标签、summary 和固定 slug。保存修改后查看目标 Actions，确认新 Deploy run 的 build 与 deploy 成功，再访问文章、列表及相关图片。自动 run 未出现时先手动部署，随后排查 Webhook、Worker、PAT。

### 20.2 代码与媒体发布

确认预期修改已进入生产分支，查看对应 CI 与安全扫描结果。媒体安装还需核对机器人提交与实际目标文件；之后新建 Pages Run workflow，选择正确分支。Re-run 旧任务仍使用旧提交，不能验证新修复。

### 20.3 四类结果分别判断

CI success 说明对应质量检查通过；安全扫描 success 说明扫描流程完成，不等同于所有告警清零；媒体安装 success 说明资源进入仓库；Pages build/deploy success 才证明部署流程完成。最后仍需检查公开内容和受影响交互。

main 比最近成功部署更新不一定异常。例如两者之间只有 README 介绍修订时，页面可以仍使用前一成功提交；涉及主题或图片的新提交则需要部署。每次留档分开记录源码与部署提交。

## 21 生产页面的可复用回归规则

### 21.1 深色正文与移动端

只修 p 或段落类名不足以覆盖 Notion 全部内容块。列表、待办、折叠与表格可能从渲染器继承默认黑字，应在受控正文容器设置主题前景变量并检查嵌套继承。保留链接、Quote、Callout、代码和作者显式颜色的语义，避免全局通配颜色覆盖。

移动端以 width:100% 配合内部 padding 和 border-box 保留正文安全边距，并检查最终覆盖层是否归零。参考项目详情页约20px；具体数值属于主题设计，不要求所有新站照抄。

### 21.2 浮层与响应式目录

Lightbox 和目录挂载 body portal 后检查当前视口居中、外侧点击、Esc、焦点和滚动。参考项目宽屏目录在至少1400px时显示，较窄桌面、平板和手机隐藏；这属于项目断点，不能与旧视觉原型的汉堡目录混用。

### 21.3 首页与 Feed

参考项目 Home 优先 latestPosts、缺省 posts，主题上限12；上游配置与实际数据量仍可能限制数量。Feed 按发布日期倒序最多3篇。数据库拖动、最近编辑、最新上传和发布日期是不同规则，排查顺序问题先查真实数据入口。

### 21.4 资产与介绍同步

图片、作品标题、个人链接和介绍文字分别维护。未配置支持入口时同步移除相关邀请文案；隐藏图标后保留正确分隔线。Favicon ICO 更换不代表 Feed、Apple 或 PWA 图标一起更新。

## 22 依赖更新与现存维护工作流

依赖升级先查看当时开放 PR、变更清单和 lockfile，不把旧文档记录的待合并数量当作现值。参考项目先前一批更新已整合；新项目不能据此直接合并自己的同名更新。

在分支完成 frozen install、lockfile一致性、lint/type-check、适用测试、静态导出和页面回归后合入。具体检查以仓库当前 CI 为准；不把单元测试通过等同于真实页面验证。

链接提交、Issue标签、Stale清理、原创证明和迁移准备工作流可与 Pages 并存。各自 success 或 skipped 不代表站点发布。Stale 可能关闭长期无活动的 Issue/PR，应核对现行阈值和豁免规则；不要为减少任务数量盲删工作流。

可保留可选插件及未启用源码。删除报告或示例文件须针对当前路径审计，不扩大为深度瘦身；正文渲染、数据层、workspace校验、slug/分页、SEO/Feed、图片链路和正式部署工作流是保护区。

仓库存在图片代理 Worker 源码不证明生产已部署或启用。判断时核对运行配置、实际图片URL与响应；不得仅根据目录存在改变已稳定的图片链。

## 23 交接证据与公开文档检查

保留本地可复现的文档版本、成功部署记录和验证范围。未读取的后台配置、未测试的自动链和未完成的页面交互必须标注未复验，不写成全部通过；历史记录与当前事实分开。

通用文档只保留 \<OWNER\>、\<REPO\>、\<SITE_URL\>、\<NOTION_PAGE_ID\>、\<GITHUB_DISPATCH_TOKEN\>、\<NOTION_WEBHOOK_SECRET\> 等占位符。GITHUB_TOKEN、NOTION_VERIFICATION_TOKEN 等名称可以说明用途，真实值不得出现在文字、表格、代码、超链接、批注、修订记录、页眉页脚或嵌入对象。

发生凭据泄漏时不能靠删文档恢复安全，应在平台轮换或吊销，再检查自动链。普通更新不要求重新生成全部凭据。

## 本版依据与验证范围

修订依据为技术与设计规格 V0.74、正式发布与迁移手册 V0.3、后续维护手册 V0.5，以及所附通用开发文档 V0.4。本版提炼已记录的项目事实，不重复写入其环境标识，也未在本次文档修订中重新运行部署或读取私密后台。首次迁移原始记录、Worker运行配置和交互复验的限制沿用三份项目文档。

V0.5 主要修订为正式运行阶段分流、发布证据区分、凭据轮换与握手说明、未配置社媒隐藏、深色正文回归、依赖与维护工作流、未来迁移及恢复边界。文档保留通用架构和原有字段、路由、配置表，未复制真实凭据。
