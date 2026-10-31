# 已核对的第三方许可索引

核对日期：2026-10-31。此索引用于明确第三方材料范围及保留许可，不是对全部传递依赖、历史资源或外部服务的完整法律认证。包版本依据本次 yarn.lock；静态资源版本依据其文件标头。依赖出现在清单不表示每个页面均运行该依赖。

站点根目录 [LICENSE](./LICENSE) 保留 NotionNext 上游 MIT 许可。其余第三方许可证按对应材料范围适用，不由本站重新许可。许可原文保持原样，不能以本索引摘要代替。

| 项目 / 已核对版本 | 仓库范围或证据 | 许可 | 随站发布的原文 | 上游或发布包依据 |
|---|---|---|---|---|
| Font Awesome Free，CSS 标头 6.4.2 / 6.3.0 | public/vendor/fontawesome/css/all.min.css；public/css/all.min.css；相应 public/vendor/fontawesome/webfonts/ 与 public/webfonts/ 字体 | CSS 等代码 MIT；字体 OFL-1.1；上游 SVG/JS 图标形态 CC-BY-4.0（不表示本站所有 SVG 都来自该项目） | [Font Awesome Free 原文](./public/licenses/fontawesome-free-6.3.0-6.4.2.txt) | [6.4.2](https://github.com/FortAwesome/Font-Awesome/blob/6.4.2/LICENSE.txt) / [6.3.0](https://github.com/FortAwesome/Font-Awesome/blob/6.3.0/LICENSE.txt)，两版原文一致 |
| React 18.3.1 | yarn.lock；核对 npm 18.3.1 发布包 package/LICENSE | MIT | [原文](./public/licenses/react-18.3.1-MIT.txt) | [官方仓库](https://github.com/facebook/react) / [发布包](https://registry.npmjs.org/react/-/react-18.3.1.tgz) |
| Next.js 15.5.28 | yarn.lock；上游 v15.5.28 license.md | MIT | [原文](./public/licenses/next-15.5.28-MIT.txt) | [版本原文](https://github.com/vercel/next.js/blob/v15.5.28/license.md) |
| Tabler Icons 3.49.0 | @tabler/icons-react 的锁定版本；上游 v3.49.0 LICENSE | MIT | [原文](./public/licenses/tabler-icons-3.49.0-MIT.txt) | [版本原文](https://github.com/tabler/tabler-icons/blob/v3.49.0/LICENSE) |
| Typed.js 2.0.12 | public/js/typed.min.js 标头 | MIT | [原文](./public/licenses/typed-js-2.0.12-MIT.txt) | [版本原文](https://github.com/mattboldt/typed.js/blob/v2.0.12/LICENSE.txt) |
| animate.css 3.7.2 | public/css/wow/animate.css 标头（本站文件注明适配 wowjs） | MIT；修改仍须保留原版权和许可 | [原文](./public/licenses/animate-css-3.7.2-MIT.txt) | [版本原文](https://github.com/animate-css/animate.css/blob/3.7.2/LICENSE) |
| remixicon-react 1.0.0 | 锁定发布包；元数据与 package/LICENSE | MIT AND OFL-1.1（发布包声明）；具体材料范围见原文 | [原文](./public/licenses/remixicon-react-1.0.0.txt) | [该版本发布包](https://registry.npmjs.org/remixicon-react/-/remixicon-react-1.0.0.tgz)，其元数据仓库为 bayesimpact/remixicon-react；不以最新 RemixIcon 同名项目许可替换它 |
| GSAP 3.15.0 | yarn.lock；核对该版本 npm 元数据的 license 字段 | Standard “No Charge” GSAP License；专用许可，不标为 MIT 或 OSI 开源许可 | 发布包未附独立 LICENSE；参阅右侧官方条款，而非添加本站自拟的替代许可证 | [官方条款](https://gsap.com/community/standard-license/) / [版本元数据](https://registry.npmjs.org/gsap/3.15.0) |

## 复用及维护要求

- 复用、修改和重新分发时，按各许可证保留原作者声明、许可文件、必要的署名或修改标记。仅链接上游通常不能替代分发时需要附带的原文。
- Font Awesome 字体不能改标为 MIT；需要遵守 OFL 的单独售卖、保留字体名称等条件。品牌图标不授予第三方商标权。
- GSAP 免费使用不等于任意用途均获许可，特别须检查其对竞争性可视化动画工具等用途的限制。本站不作额外授权。
- 不根据项目名称推定素材来源，不将当前上游许可证机械地追溯替换已取得版本的许可证。版本或打包方式变更后应重新核对。
- 本次未逐项认证其他静态脚本、图片、徽章、全部 npm 传递依赖、系统字体及游戏素材。其原有许可、权利人要求和适用法律继续有效；本索引没有为这些材料补发授权。

文章、游戏摄影及个人标识的边界见 [CONTENT-RIGHTS.md](./CONTENT-RIGHTS.md)。这些许可原文的随站公开，均不意味着本站文章或摄影采用了相同许可。
