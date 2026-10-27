# NotionNext + GitHub Pages 通用开发文档

**V0.63 · 正式运行与可复用设计规范**  
修订日期：2026-10-27（香港时间）

这是一份可公开复用的建站与维护规格。V0.6 在既有架构、发布和分页规则上，结合技术与设计规格V0.8，新增第5节的阅读导航、轮播、图片加载、滚动导航和目录交互标准。具体主题可调整数值，但必须分别定义可见尺寸、交互范围、输入方式及验收方法。环境数据使用占位符，不写入真实凭据或私人后台信息。 V0.62 于2026年10月27日补充第29至31节的文字分享预览、页面加载占位及发布验收边界。 V0.61 保留上述标准，新增第25至28节：辅助工作流故障定位、依赖更新与有条件自动合并、加密构建缓存及密钥维护。冲突时以本次新增的现行规则为准。

V0.63 新增第32至36节，记录 Design Guide V2.0、双语响应式、footer 往返、当前页图片就绪淡入及点击后加载规范；涉及加载与导航显隐的旧条款，以新增章节为准。

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

### 5 4 时间顺序导航与合集上下文

文章底部统一使用“上一篇＝较旧、下一篇＝较新”的语义，先显示下一篇，再显示上一篇。宽屏可左右分列，窄屏按相同顺序纵向排列；没有相邻文章时省略该方向，不循环跨越集合边界。

在构建阶段为公开且已发布的Post计算全站、Year、Category、Tag的邻接摘要，只输出跳转所需的slug与title。按发布日期倒序排列，并定义相同日期的稳定次序；不要把数据库手动顺序、首页最近编辑顺序和时间先后混为一谈。

筛选列表进入详情页时携带显式上下文，例如 /article/\<SLUG\>?reading=category&collection=\<ENCODED_VALUE\>；上下篇链接继续传递。只接受当前文章真实所属且已预计算的合集，非法或缺失参数回退全站。在按钮上方显示粉色小字 YEAR／TAG／CATEGORY 与当前值，使读者能识别入口。

筛选上下文属于阅读状态，不新建重复文章路由；canonical仍指向文章的正式路径。验证刷新、复制链接、合集首尾、同日期文章以及从不同合集进入同一文章。

### 5 5 Hero 多输入轮播与方向动画

自动轮播之外，应支持左右箭头、圆点、手机单指横滑和桌面鼠标左键拖动。参考标准为横向位移至少40px且达到纵向位移的1.3倍才切换；左滑下一张、右滑上一张，纵向滚动和轻点不触发。拖动期间暂停自动换图，按钮起始事件不进入拖动处理。

桌面拖动使用pointer capture，释放、取消和丢失捕获均清理状态；禁止原生拖图和图片选择。触屏保留pan-y与pinch-zoom。指针采用grab／grabbing，箭头与圆点保持独立键盘入口。

方向是显式状态。下一张从右入、旧图向左出，上一张反向；首尾循环也按操作方向播放，不能仅比较目标索引。圆点可按目标位置确定方向。参考值为7秒自动轮播、14%位移、720ms动画、780ms后移除旧图；当前图、旧图与方向一次更新。

### 5 6 轮播箭头与局部反馈

参考设计使用无外圆框、无背景的18×18px箭头，整体放大而非单向拉伸；基础描边2.5，hover变粉色且描边3.5。保留44×48px交互热区，图标大小与点击范围分开定义。移除图片上的可见DESIGN编号标签，保留alt和圆点名称。

可悬停设备中，鼠标离开轮播图片区时箭头隐藏且不可误点，进入后以180ms透明度和0.92→1缩放显示；键盘可见焦点也能显示。无hover设备保留可见箭头，不能要求触屏先悬停。

### 5 7 图片的局部加载反馈

Hero、作品集、正文和Lightbox图片按实际加载状态显示局部提示。参考样式为容器中央26px粉色环、2px线、850ms旋转，容器保留至少100px高度或原有固定比例。提示不拦截交互，aria-busy同步状态。

需要覆盖初始图片、缓存命中、懒加载占位、动态插入和src变化；同一容器中有多个待加载项时统一判断。load后重新检查真实图片状态，error时停止等待动画；错误反馈与加载态分开定义。卸载时移除事件与观察器，不用无限旋转掩盖失败。

### 5 8 全站滚动导航

所有页面和设备统一为向下滚动收起、向上滚动显示，页面顶部始终显示。参考实现使用sticky，收起时translateY(-100%)并淡出，240ms过渡；同方向累计8px才改变状态，距顶部12px内恢复显示。

监听实际页面滚动而非只监听鼠标滚轮，以覆盖触屏、键盘和滚动条。使用passive scroll与requestAnimationFrame，并约束顶部和底部回弹。导航隐藏时关闭手机菜单、设置inert与aria-hidden；保持既有局部下拉及外侧点击、Esc关闭行为。

### 5 9 目录的显示范围与相对尺寸

目录应区分透明呼出区、可见菜单和可见竖线。参考实现的呼出区固定35dvh，fallback为35vh，覆盖竖线和菜单整个位置，垂直居中；隐藏时仍能从上下左右任意方向进入呼出，不能依赖窄竖线或已隐藏菜单接收事件。

菜单height:auto、max-height:35dvh／35vh，不设置撑满的最小高度。章节少时保持自然排版，长目录内部滚动。竖线高度＝菜单实际渲染高度×0.8，满高菜单对应28%屏高；短菜单按同一比例缩短，透明35%呼出范围始终保持。

用ResizeObserver测量菜单实际边框盒，覆盖换行、字体与窗口变化；内容或文章切换后重新测量，只更新竖线高度。设置window resize兜底，并在卸载时清理观察器和事件。不要以章节数量乘固定行高代替真实测量。

默认隐藏竖线与标题菜单，进入呼出区后以180ms淡入和小幅横移显示，离开整个区后收起。点击不锁定常驻；外侧点击、Esc、焦点移出和文章切换关闭。隐藏菜单使用aria-hidden及inert，保留可聚焦的竖线章节入口供键盘呼出。

视觉竖线只画一条连续低对比线，参考宽度4px，无章节高亮与悬停加粗；其上保留与有效Heading一一对应的等分透明链接，点击仍跳转章节。标题hover／focus仅反馈当前项，不驱动竖线或全局高亮。兼容Notion锚点变体，标题与竖线共用跳转逻辑。

目录挂载body portal，避免祖先transform影响fixed；不锁住整页滚动。参考主题只在≥1400px显示，窄屏完全隐藏；复用项目按正文宽度及剩余空间设置断点，不能让目录遮挡正文。

滚动条保持原生滚动能力并匹配深色主题。参考值为Firefox thin、WebKit宽7px、圆角滑块及2px内边框；轨道使用深色表面、滑块低对比，悬停时可用粉色。滚动条滑块的反馈与连续目录竖线区分，不能重新引入已取消的章节竖线高亮。

### 5 10 动效降级与验收标准

所有上述过渡支持prefers-reduced-motion: reduce：关闭不必要位移和淡变，章节滚动改即时，加载环改静态提示。箭头、章节链接与导航保留可访问名称、焦点轮廓、正确显隐语义，不将hover作为唯一操作方式。

验收至少覆盖：三个筛选入口的上下篇及合集首尾；触屏双方向、PC拖动取消、首尾轮播；箭头悬停及无hover设备；短目录、长目录、标题换行、四方向呼出和窗口缩放；图片慢加载、缓存、错误；全站上下滚动、键盘与减少动态效果。将单元测试、静态导出、部署和真实交互结果分别记录。

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

> 1\. Checkout main。
>
> 2\. 安装固定 Node 与包管理器。
>
> 3\. 使用 frozen lockfile 安装依赖。
>
> 4\. 设置必要环境变量与仓库 Secret。
>
> 5\. 执行静态 export。
>
> 6\. 写入 .nojekyll。
>
> 7\. 上传 github-pages artifact。
>
> 8\. 使用 GitHub Pages deploy action 发布。

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

> 1\. Notion 创建 subscription 时会发送一次 verification payload。
>
> 2\. 首次握手应由受控初始化流程取得 verification token，并由维护者写入专用 Secret；不要假设普通 Worker 请求可以自行持久化平台 Secret，不在公开响应或长期日志中输出验证值。
>
> 3\. 正常事件随后带 X-Notion-Signature；Worker 必须基于原始 raw body 计算 HMAC-SHA256。
>
> 4\. 不要 JSON.parse 后再 stringify 做验签，否则字节变化会导致签名不一致。

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

- □ 普通列表、Category 与 Tag 分别验证第一页、第二页、返回第一页、刷新和直达链接；页码变化后保留筛选条件且文章集合正确。

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

> 1\. 仅对首次建站执行：Fork 或复制稳定源码到选定 Pages 仓库；已有生产站不得把此节作为重置步骤。
>
> 2\. 配置 GitHub Pages Source = GitHub Actions。
>
> 3\. 准备 Published Notion 数据库并只授权发布 Integration。
>
> 4\. 配置仓库 Secret 与正式 SITE_URL。
>
> 5\. 先手动跑 GitHub Pages workflow，确认静态站能发布。
>
> 6\. 创建 Cloudflare Worker，配置两类 Secret：GitHub dispatch token 与 Notion webhook secret。
>
> 7\. 创建 Notion Webhook subscription，完成 HMAC 验签。
>
> 8\. 上传 favicon / Hero / Portfolio 等站点视觉资源。
>
> 9\. 配置稳定 slug 生成策略。
>
> 10\. 执行第 12 节完整验收。
>
> 11\. 最后用一次真实 Notion 编辑验证自动发布闭环。

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

连续竖线上的透明章节链接与有效Heading一一对应，并与标题共用跳转处理。Notion UUID统一匹配后滚动和更新hash；缺少ID时谨慎回退标题匹配。点击展开但不固定常驻，移出整个呼出区域后仍收起；尺寸、显隐及访问性采用第5节标准。

目录采用第5节的连续低对比竖线，不使用竖线加粗或章节高亮；标题局部反馈和主题滚动条各自独立。短目录按菜单实高缩短竖线，长目录内部滚动，透明呼出范围固定。手机隐藏目录，主导航保持局部下拉。

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

依赖升级先在分支完成 frozen install、lockfile 一致性、lint/type-check、适用测试与静态导出。第26节白名单补丁可在检查及全站导出成功后由工作流合并；其他更新保留人工审查。页面回归与部署验收仍单独记录，不把单元测试或自动导出通过等同于真实页面验证。

链接提交、Issue标签、Stale清理、原创证明和迁移准备工作流可与 Pages 并存。各自 success 或 skipped 不代表站点发布。Stale 可能关闭长期无活动的 Issue/PR，应核对现行阈值和豁免规则；不要为减少任务数量盲删工作流。 未配置的链接提交应关闭自动触发，保留源码；其失败不代表 Pages 发布失败，详见第25节。

可保留可选插件及未启用源码。删除报告或示例文件须针对当前路径审计，不扩大为深度瘦身；正文渲染、数据层、workspace校验、slug/分页、SEO/Feed、图片链路和正式部署工作流是保护区。

仓库存在图片代理 Worker 源码不证明生产已部署或启用。判断时核对运行配置、实际图片URL与响应；不得仅根据目录存在改变已稳定的图片链。

## 23 交接证据与公开文档检查

保留本地可复现的文档版本、成功部署记录和验证范围。未读取的后台配置、未测试的自动链和未完成的页面交互必须标注未复验，不写成全部通过；历史记录与当前事实分开。

通用文档只保留 \<OWNER\>、\<REPO\>、\<SITE_URL\>、\<NOTION_PAGE_ID\>、\<GITHUB_DISPATCH_TOKEN\>、\<NOTION_WEBHOOK_SECRET\> 等占位符。GITHUB_TOKEN、NOTION_VERIFICATION_TOKEN 等名称可以说明用途，真实值不得出现在文字、表格、代码、超链接、批注、修订记录、页眉页脚或嵌入对象。

发生凭据泄漏时不能靠删文档恢复安全，应在平台轮换或吊销，再检查自动链。普通更新不要求重新生成全部凭据。

## 24 筛选列表分页与布局分流

分类或标签首页正确，不代表翻页正确。主题可能复用一套文章卡片与分页 UI，但每个筛选列表仍需保持自己的 URL、文章集合和页码状态。本节根据参考项目出现的“分类第二页误跳全站第二页”问题补充规则，不复制个人分类名、提交或部署标识。

### 24 1 分开检查数据路由与展示布局

沿页面路由 → DynamicLayout 或主题布局 → 列表组件 → 分页链接生成函数逐层追踪。若分类路由已经筛选数据，但实际布局无条件进入全站列表，专用组件即使定义了正确 makePageHref 也可能从未被调用。不要先重写数据层或另造 article 路由。

修复应在实际使用的布局入口识别 category/tag props 或明确的筛选路由，将分类与标签列表交给专用结果组件；普通列表保留原入口。检查首页和 /page/\[page\] 子路由是否都经过这条分流，不能只修一个页面文件。

### 24 2 分页地址必须携带筛选上下文

通用路径约定：普通列表 /page/\<PAGE\>；分类首页 /category/\<ENCODED_CATEGORY\>，后续页 /category/\<ENCODED_CATEGORY\>/page/\<PAGE\>；标签首页 /tag/\<ENCODED_TAG\>，后续页 /tag/\<ENCODED_TAG\>/page/\<PAGE\>。返回第一页使用各自首页，不能退回 /page/1。项目如采用不同原生路由，应按该路由生成，不硬套示例。

优先把 getStaticProps 已提供的 category/tag 传入结果组件，必要时回退 router.query。Next.js 已解码的路由参数不应再次 decodeURIComponent；将单个参数规范为字符串后，在构造路径段时 encodeURIComponent。数组参数需按预期取值，尤其检查含空格、中文、百分号和斜线的名称。

分页数量、每页长度与原生数据切片使用同一配置来源。后端已切片时前端不得再次按全列表切片。链接正确与内容正确是两项验收，不能互相替代；Year 或其他筛选需按实际实现分别检查。

### 24 3 最小回归检查

准备文章数超过一页的分类和标签。分别检查：第一页到第二页保留筛选路径；第二页返回第一页仍保留筛选；筛选上下文、当前页高亮和文章集合正确；直接打开及刷新第二页不404；末页有预期内容且不重复切片为空。普通列表第二页仍进入全站列表路径。

补充静态 props 已有而 router.query 尚未就绪的首屏场景，以及名称含空格、中文、百分号和斜线的 URL 编码场景。只点开首页、只看链接字符串或仅跑单元测试，均不能替代静态导出与部署后的真实翻页验证。

### 24 4 发布和记录

对改动执行适用的 lint/type-check、测试与静态导出，部署包含修复的提交后再检查公开页面。记录代码检查、build/deploy 和线上交互分别是否完成；部署成功不自动证明浏览器场景已全部验收。本节是可复用规范，不把参考项目的验证结果直接算作新站通过。

## 25 辅助工作流故障与搜索引擎提交

### 25.1 先定位任务职责，再解释失败

Actions 列表中的红色失败不一定来自站点发布。先核对工作流名称、触发事件、失败 job/step 和实际日志，再区分 CI、Pages build/deploy、搜索引擎提交和其他维护任务。辅助任务失败不会自动撤下已成功部署的静态站，也不能单凭一次失败推定 Notion Webhook 或 Worker 凭据过期。

参考故障发生在 pushUrl 的 Python 安装步骤：ubuntu-latest 本次分配 Ubuntu 26.04，但工作流仍要求 Python 3.8，日志为 “The version '3.8' with architecture 'x64' was not found for Ubuntu 26.04.”。此前同类运行使用 Ubuntu 24.04。任务尚未执行到网址提交；重复运行同一配置不能修复版本兼容问题。

先前绿色运行也可能只是空操作。若 URL、BAIDU_TOKEN、BING_API_KEY 未配置，脚本可能只打印提示后成功退出。未使用该功能时，移除 push/schedule 自动触发并禁用执行 job，保留源码及手动入口供维护；重新启用前须验证运行环境、输入与提供方凭据。

### 25.2 百度、Bing 与 Google 分开处理

参考 pushUrl.py 只有百度与 Bing 提交接口，没有 Google 接口。关闭它不等于禁止 Google 抓取。普通博客应维护有效 sitemap、robots 和站内链接，在 Google Search Console 验证站点并提交 \<SITE_URL\>/sitemap.xml；提交不保证立即抓取或一定收录。Google Indexing API 的适用范围是招聘及特定直播页面，不作为普通博客的通用逐篇推送接口。

## 26 依赖更新与有条件自动合并

### 26.1 根据实际用途判断，不只看分组与版本号

读取 PR 的依赖清单、完整 lockfile、调用位置和检查结果。devDependencies 分组也可能包含评论组件、CSS 处理器和数据验证库；小版本或补丁更新仍可能带来间接依赖变化。Vercel 缓存、Supabase 数据存储等可选能力的更新，不因名字常见就视为当前静态发布链必需。

参考项目的 Next.js 安全补丁先通过现有 CI/CodeQL，再用生产配置完成全站静态导出，之后合并并明确 dispatch 正式 Pages 工作流。其他混合更新、运行时或托管相关更新保留人工决策。原生 Allow auto-merge 未开启时，也可采用下述检查驱动合并，但二者是不同机制。

### 26.2 已实现的白名单门禁

dependency-maintenance.yml 在 CI 或 CodeQL 工作流成功结束后检查，亦提供按 PR 编号手动运行。只接受同一仓库、作者为 dependabot\[bot\]、目标 main、未合并且非草稿的 PR；变化文件只能是 package.json 与 yarn.lock。门禁核对该 PR 精确 head SHA 上由 GitHub Actions 产生的 Lint & type-check、Unit tests、Lockfile consistency、Analyze (javascript-typescript) 均成功。

符合入口条件的 npm PR 自动执行与生产相同配置的完整静态导出，并将 Dependency static export 检查写回 PR head。CI 与 CodeQL 无论谁先完成，都可在另一工作流结束后重新判断；同一 head 已成功导出时跳过重复验证。导出失败或 PR head 变化时不得合并。

当前自动合并仅允许已有 devDependencies 中 @testing-library/user-event 和 eslint-plugin-prettier 的同一主、次版本内递增补丁，且版本范围前缀不变。去除这两项变化后，整个 package.json 必须与基线完全一致；新增/删除依赖、scripts、resolutions、生产依赖及混合更新均拒绝自动合并。锁文件的间接变化仍需完整导出验证；白名单不能替代后续线上检查。

自动合并 job 等待完整导出及报告成功，再用预期 head SHA 调用 squash merge；分支规则仍可能拒绝合并。成功后显式 workflow_dispatch 到 deploy-pages.yml/main。普通 push 不因此变成自动 Pages 发布。Actions 版本、运行时核心依赖和其他 npm 更新不进入此白名单；可以自动验证，但合并仍由人工决定。

### 26.3 状态与回归边界

Dependabot 配置将上述工具补丁与其余组合更新拆开，避免因分组混入高影响变化；移除不存在的 dependencies 标签引用。PR 数量和编号会随重建、替代与新版本变化，不在维护清单中永久写死“待合并数量”。已安装规则不等于所有自动合并路径都已有真实成功样本；记录规则测试、PR 验证、实际合并与公开部署四类证据。

## 27 静态导出加速与缓存失效

### 27.1 全站生成继续保留

静态页数包含文章、列表分页、分类、标签、年份和其他页面，不等于文章篇数。导出耗时通常随数据和路由增长，但也受 Notion 请求等待、限流、编译、依赖下载影响。GitHub Pages 仍发布完整静态产物；缓存是减少重复工作，不是 Next.js ISR，也不是只部署变动页面。

先启用 Yarn 下载缓存，再保存编译及版本化正文缓存；通过实际日志比较冷、热构建。不要把上调 STATIC_PAGE_GENERATION_TIMEOUT 当作提速，不未经测量提高并发或关闭限流。Webhook 防抖、增量构建、调整托管架构属于独立改动，本次没有实施。

### 27.2 加密缓存的保存与恢复

正式部署使用 actions/cache 的恢复/保存步骤。缓存只上传 .build-cache/cache.enc 密文，不上传原始 Notion 记录或未加密编译数据。AES-256-GCM 使用独立随机 IV 和认证标签；密钥仅注入加/解密步骤，不交给依赖安装或 Next.js 导出。公开仓库可被 PR 读取的缓存中不得存放明文敏感数据。

加密包包含 webpack 编译缓存及 key 形如 page_block\_\<PAGE_ID\>\_\<VERSION\> 的正文条目；排除临时站点元数据、构建会话、锁文件及其他非版本化条目。每次仍重新获取发布元数据、按文章版本选择正文并生成全站。解密失败、认证失败、路径异常、缺失或过期时回退干净构建；缺少或格式错误的密钥时不启用加密缓存，发布流程仍可继续。

当前整包有效期6小时；保存及恢复时还检查每篇正文的原始 updatedAt，过期条目不得因重新打包而续期，expireTime 到期也不恢复。缓存 key 纳入运行环境以及 lockfile、Next 配置、缓存/数据层及加密脚本的内容摘要，每次运行另有唯一保存后缀；相关代码变化可能使下一次恢复未命中。

### 27.3 已测效果及适用范围

参考项目于2026年10月21日以同一代码版本连续运行：冷构建全站569页，yarn export 560.16秒；热构建恢复323个文件，仍生成569页，耗时29.96秒，导出阶段减少约94.7%。两次 build/deploy 均成功。冷构建仅跳过正文/编译缓存，Yarn 下载缓存仍可使用；数字不包含整个 Actions 排队、安装、上传和部署耗时，也不承诺每次30秒。

测量后合入逐篇恢复过期检查，相关回归测试及 CI/CodeQL 成功。该补丁改变缓存摘要，因此下一次可能重建缓存；补丁后的冷/热耗时未再次测量。线上抽查首页、About、列表、归档、RSS、sitemap 均正常，两篇文章的标题及正文块数在冷/热构建间一致；未因此宣称所有页面、媒体、Notion 编辑或取消发布场景全部验收。

### 27.4 强制冷构建与内容正确性

普通新增、修改、取消发布及代码更新仍走正常全站部署；应由新元数据与正文版本使变化生效。若 Notion 编辑时间没有准确反映嵌套修改，可能短暂复用旧正文。遇到页面未更新、缓存异常、重大迁移或需要排除缓存因素时，运行正式 workflow，选择正确分支并勾选 clean_build（界面为 Ignore previous build cache）。这会跳过旧正文/编译缓存恢复，成功后重新保存新缓存；不要求同时重装全部下载依赖或更换密钥。

## 28 缓存密钥与运维注意事项

### 28.1 独立密钥，不与发布凭据混用

在仓库 Settings → Secrets and variables → Actions → New repository secret 创建 BUILD_CACHE_KEY，值为密码学安全随机生成的32字节密钥，用64位十六进制字符编码。文档只写变量名或 \<BUILD_CACHE_KEY\>；不记录真实值。它不是 GitHub PAT、Notion Integration Token 或 Webhook 验签 Secret，不能互换。

可在密码管理器保存一份，注明仓库与用途；不提交 Git、不放进截图和聊天。遗失后可重新生成并替换，旧缓存无法解密时仅重建，不丢失文章或停用已部署站点。迁移仓库需重新配置目标 Secret；跨仓库复用密钥不是必要条件。

### 28.2 轮换、恢复与验证

实现未设置密钥到期时间，缓存6小时过期不等于密钥6小时更换。个人站点不必每次发布或每月强制轮换；按风险定期检查，在确认/怀疑泄露、误公开或访问权限变化时更换。泄露后轮换只能保护后续缓存，不能撤回已取得的旧密文或明文；必要时删除现有 Actions 缓存，并检查访问与日志。

更换后用新密钥冷构建建立缓存，再热构建核对恢复、耗时和公开内容。每次优化至少区分：配置/测试通过、实际缓存命中、完整导出/部署成功、线上内容检查。涉及内容模型或撤稿正确性的变动，应单独验证编辑、删除/取消发布及媒体链接有效性。

### 28.3 可复用参考

GitHub Dependabot 自动化：https://docs.github.com/en/code-security/tutorials/secure-your-dependencies/automate-dependabot-with-actions

GitHub 缓存与权限：https://docs.github.com/en/actions/reference/workflows-and-actions/dependency-caching

Next.js 静态导出与不支持 ISR：https://nextjs.org/docs/pages/guides/static-exports

Google sitemap：https://developers.google.com/search/docs/crawling-indexing/sitemaps/build-sitemap；Indexing API：https://developers.google.com/search/apis/indexing-api/v3/quickstart

密钥管理：https://cheatsheetseries.owasp.org/cheatsheets/Cryptographic_Storage_Cheat_Sheet.html

## 29 社媒链接文字预览

### 文字摘要预览的现行规则

分享链接时仅主动提供标题、摘要、地址、站点名称等文字元数据。components/SEO.js 已移除 og:image、og:image:width、og:image:height、og:image:alt、twitter:image 和 twitter:image:alt；twitter:card 从 summary_large_image 改为 summary。取消将文章封面或默认 /bg_image.jpg 传给分享图片的处理，调用 generateStructuredData 时图片参数传 undefined，因此文章结构化数据不再输出该 image 字段。

本次为全站策略，首页、文章和其他使用该 SEO 组件的页面均适用，包括有封面的文章。保留 og:title、og:description、twitter:title、twitter:description、canonical、站点图标和发布者 logo。正文图片、Hero、作品集及站内封面显示不因本次调整而删除。

网站不再主动声明分享配图，不等于可以强制每个平台只显示文字。平台可能缓存旧卡片或自行选取页面图片；已发布帖子的预览不保证追溯更新。部署后应重新分享并观察；若需要临时完全取消 Telegram 预览，可在发送前点击预览旁的 ×，但标题和摘要卡片也会一并消失。不能把移除图片元数据描述为禁止平台抓取图片。

## 30 页面布局加载占位

### 导航栏下方的加载占位

截图中的首页方框来自 themes/theme.js 的 IndexLayoutLoading 骨架占位。现以 PageLayoutLoading 统一文字加载占位，LayoutLoading 和 IndexLayoutLoading 分别复用；不再显示灰色方框、卡片和占位按钮。保留既有导航栏，导航栏以下显示居中的 LOADING… 与简单旋转圆环，页面布局组件就绪后由动态加载机制自动替换为原页面。

占位背景使用 --ins-bg（fallback #202d35），文字和圆环使用 --ins-pink（fallback #ed8eac），字体使用 --ins-ui-font 及与站点一致的后备字体。文字14px、字重650、字距0.16em；圆环24×24px、2px边线、900ms匀速旋转，与文字间隔18px。可用高度为100dvh减去桌面导航78px；≤760px时减去70px，同时保留100vh后备值。

容器使用 role=status 与 aria-live=polite，装饰圆环 aria-hidden=true；prefers-reduced-motion: reduce 时停止旋转但保留文字。未更改已加载页面布局、色彩、导航交互、原有入场动效、路由分流或数据获取逻辑。

完成条件必须按实际实现解释：本次替换的是动态布局组件的 loading fallback，不是等待全站所有图片、字体、懒加载资源或第三方请求全部结束的全屏闸门。页面组件显示后，图片仍可按既有 ImageLoading 逻辑局部加载；不得因此声称所有资源已彻底下载完成。 本段为V0.62／V0.82布局占位层记录；新增首次整页等待与导航显隐规则见本版后续“首次页面呈现与文章图片加载”章节。

## 31 发布与验收边界

### 发布验收与维护边界

两项源码修改均已提交并回读核对：分享图片元数据已移除，summary 卡片与标题摘要保留；骨架已替换，主题解析与路由逻辑保持原样。此前记录未包含完整构建、部署及实机验收，本次文档更新也不将这些状态写成已通过。

部署前确认包含上述修改的提交已进入 main。打开仓库 Actions → Deploy NotionNext to GitHub Pages → Run workflow，分支 main；通常不勾选 Ignore previous build cache。新建运行，待 build 与 deploy 均成功后，分别验收公开页面和平台预览；Re-run 旧任务不代表部署最新提交。

加载验收覆盖首次访问、缓存访问、慢速网络、手机与桌面、页面切换和减少动态效果：导航栏可见，方框不出现，LOADING… 在导航下可用视口中央，组件就绪后提示移除且原布局恢复。分享验收覆盖首页、无封面文章和有封面文章，查看生成 HTML 的元数据并实际重新分享；区分源码验证、静态导出、Pages 部署与平台缓存结果。

## 32 V0.63 Design Guide 的定位与视觉基线

### 指南的发布形式

Design Guide 是博客视觉语言的简化说明，使用 HTML/CSS 重建布局与组件，不以页面截图代替版式。在线版为 V2.0，正式路径为 /design-guide，URL 不附博客名或版本号；页面保留 DESIGN GUIDE 2026 与 A Static guide 标识。Word 开发文档版本与指南版本分别维护。

### 字体与内容结构

沿用博客现有无衬线与衬线字体栈，不额外引入广告字体或在线字体服务。大字号、粗字重、紧凑字距和宽松留白建立广告文案式节奏，短句仍以具体观察、兴趣与作者判断为中心。色彩使用深蓝灰背景 #202D35、表面 #2B3942、奶白 #F2EEE4、强调粉 #ED8EAC 及辅助灰 #AEB9B9。

### 栏目与静态示例

栏目依次说明 Visual identity、Home、Article list、Archive、Reading、About & photography、Interaction、Voice。色块增加悬停高亮；Home 只显示真实首页 Hero 第一张图，左右箭头始终可见但不切换；左下按钮仅保留高亮。文章列表固定两篇示例，“继续阅读”、归档卡片与交互组件均不跳转；卡片保留悬停反馈。

### 阅读与摄影示例

Reading 沿用文章目录的视觉样式，仅作展示，不定位，并删除“查看作品”。About 区使用页面设计综述，社媒改为 logo，保留高亮但不外跳；摄影网格桌面三张、手机两张，图片不放大。参考说明文字不附超链接。以上限制只作用于指南示例，博客真实文章、归档、目录和社媒链接仍按原功能使用。

### 选择态与页尾

粉色收尾区域中，文字选择态为蓝色底、粉色字；其他区域保留粉色底、蓝色字。指南页尾保留“返回顶部 ↑”及“返回Insignificantia.”，桌面悬停高亮，手机持续高亮；手机将返回博客放在返回顶部右侧，底部留白高度保持原设定。

## 33 V0.63 双语排版与响应式阅读位置

### 语言与手机导航

导航右侧增加“中/EN”，与版式、阅读、文案、参考入口对齐。英文版按英文长度重排标题、分栏及行宽，不强套中文断行；指南原创解释、按钮和辅助文字使用英语，直接引用博客的中文内容保留中文。字体尽可能沿用同一套系统字体。手机使用向下展开的汉堡菜单，替代小字号 MENU；保留展开状态及关闭行为。

### 进入动效

指南初始进入时，元素从下向上抬升并由透明变为完全可见；从博客进入的整页淡入与该动效协调，避免内容抢先显示。prefers-reduced-motion: reduce 时减少或关闭不必要动画，操作及文字仍可正常使用。

### 窗口变化后的阅读位置

窗口比例、横竖屏、移动端视口、字体或媒体尺寸变化时，以当前内容锚点及其视口像素偏移恢复阅读位置，不使用滚动条占总高度的百分比。顶部和底部按边界处理；正文高度变化不能把读者带到另一段。该锚点是内部阅读状态，不为静态示例增加点击定位。

### 版本与离线边界

V1.1 确立静态示例，V1.2 增加双语与进入动效，V1.3 修订手机导航、页尾排列及阅读位置，V2.0 连接博客。V2.0 离线版保留双语、菜单、样式与必要脚本，图片内嵌；删除全部链接目的地、返回操作和点击定位。离线版不依赖网络字体或外部脚本，不能直接覆盖在线发布文件。

## 34 V0.63 博客 footer 与整页往返动画

### 全站 footer 入口

博客所有页面共用 footer 入口，整个可点击区域指向 /design-guide。悬停时仅 footer 反色为粉底蓝字，其他区域保持原色，使用 320ms ease 过渡柔化变化。手机在 footer 已进入视口且用户继续向下滑动时高亮，点击该区域进入指南。

### 进入与返回

点击 footer 后记录当前同源 pathname 与 query，播放全屏淡出，再进入指南并全屏淡入。指南导航左上角 Insignificantia. 始终回博客首页；最下方返回博客则回进入指南前的页面并滚到页首，不恢复之前滚动位置。缺少有效记录、直接进入指南或来源不可信时回首页，来源不能指向外站或指南本身。

### 动画协调与故障恢复

离开阶段保持既有 320ms 淡出；到达端等待布局及所需图片/字体条件，再释放整页透明态。返回来源页延续整页淡入；品牌链接回首页时正常播放原首页进入动画。短时导航标记、重复点击保护、页面恢复与超时清理避免取消跳转后文档一直透明；减少动态效果偏好继续生效。

### 只在点击后加载指南

不得在首次加载博客时同时下载 Design Guide，也不得因 footer 接近视口、滚动、悬停或触摸预热指南。现行实现移除距离视口 600px 的 IntersectionObserver 预取，只在明确点击 footer 后启动既有加载流程；点击阶段仍保持原淡出与加载等待上限，不修改动画逻辑。禁止通过隐藏 iframe、自动 fetch、prefetch 或提前挂载完整指南恢复预加载。

## 35 V0.63 首次页面呈现与文章图片加载

### 布局占位与整页淡入分层

原有导航下方 LOADING… 布局占位继续服务于动态主题等待阶段；新增的首次进入控制是另一层。会话首次进入或 referrer 缺失、属于外站时，先隐藏文档正文并显示全屏 LOADING…，等待当前页面内容与受管图片就绪后淡入；这包括外站直接进入 article detail。该阶段导航随文档一起隐藏，不能沿用旧版“导航始终可见”作为首次进入的验收标准。

### 等待范围与时间边界

等待当前文档的受管图片，不抓取全站其他页面，更不连带加载 Design Guide。首次进入时将受管图片设为 eager，并启动旧版 LazyImage 的预加载，避免页面隐藏与懒加载互相等待；load 后还需 decode。检测到内容可用、图片无待处理项且稳定约 200ms 后释放，整页透明度过渡为 500ms。

### 图片失败与正常站内浏览

首次等待最多约 12 秒；控制器未正常启动时由约 18 秒的引导恢复解除隐藏。错误图片停止等待，不使整页永久空白；超时释放后，尚未完成的图片继续局部等待。会话内正常同源浏览不重复强制整页首次等待，既有页面动效和指南往返逻辑分别管理。此处就绪不等于所有第三方请求、字体或整个网站资源全部下载完成。

### 文章图片与图注同步

正文真实图片完成加载与解码后以约 420ms 淡入；同一图片容器内所有真实图片就绪后，caption 才可见，并以约 300ms 淡入、延迟约 100ms。低清 preview 不算最终图片；src、srcset 或尺寸源变化立即重新隐藏旧图注，过期 decode 回调不得误显示新图。错误状态不显示对应图注，缓存命中、后插入图片及 Lightbox 同样纳入状态管理。

### 维护入口

首帧引导与关键 CSS 在 lib/utils/imageRevealBootstrap.js，由 pages/_document.js 注入；public/image-reveal.js 管理图片状态与 initialReady。ImageLoading.js 只请求扫描，components/LazyImage.js 配合首次 eager；public/design-guide-transition.js 协调指南往返，public/design-guide.html 保留相应启动代码。维护共享加载规则时同步检查独立指南，避免两份启动逻辑漂移。

## 36 V0.63 验收与发布记录

### 最小回归矩阵

桌面与手机分别验证 footer 悬停或向下滑动高亮、点击进入、返回来源页顶及品牌回首页。Network 中初次加载、滚到 footer、悬停均不应出现 /design-guide 请求，点击后才出现；再验证中英切换、汉堡菜单、旋转与窗口缩放后的内容位置、静态示例无跳转，以及离线文件在断网状态下无链接或定位。

### 图片验收

覆盖新会话、同源已有会话、外站直达文章、慢图、缓存、图片失败、动态替换与减少动态效果。图片加载与 decode 完成前，文章图注不得闪现；12 秒恢复后页面能阅读，迟到图片仍可正常淡入。分开记录浏览器回归、仓库 CI、Pages 部署及线上结果，不能互相替代。

### 本次归档状态

截至2026年10月27日，footer 与指南连接已合入 PR #34 至 #36，图片就绪淡入合入 PR #37，取消指南提前加载合入 PR #38。用户已确认 PR #37 后部署完成；PR #38 已合并并通过 CI、CodeQL 及本地浏览器回归，尚未在本段对话获得该修订部署完成确认。本次文档和 README 更新不改变页面代码，也不触发 Pages 发布。

### 发布与追溯

指南公开入口：https://takedaiori.github.io/design-guide。PR #37：https://github.com/takedaiori/takedaiori.github.io/pull/37；PR #38：https://github.com/takedaiori/takedaiori.github.io/pull/38。图片实现合并提交为 07c3d1ab1c255bc01e07cd134340ec9eeb3acdbd；点击后加载合并提交为 21e79fbba9eb8931c175b1d517c503d2533eef53。若尚未发布后者，在正式部署工作流新建 main 运行，通常不勾选 clean_build；成功后再进行线上网络请求验证。

## 本版依据与验证范围

V0.6在V0.51原有架构、发布和分页规范上，结合技术与设计规格V0.8与参考项目2026年10月17日09:56之后的最终源码提炼设计标准。第5节是本版交互标准的主要入口，第18节维护说明同步修正。 V0.61于2026年10月21日新增第25至28节，提炼已完成的维护与缓存方案；保留原有设计与历史依据，不把参考项目测量直接当作复用站点验收结果。

保留既有字段、路由、配置表、迁移和安全边界。新增标准不复制个人账号、Notion标识、运行记录或真实凭据；参考数值作为可复用设计起点，复用站点仍须执行自己的构建、部署与真实页面验收。
