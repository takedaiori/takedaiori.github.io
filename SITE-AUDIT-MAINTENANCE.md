# 发布体积与安全检查

## 文章详情数据

Insignificantia 的正文和目录保持原样。全站导航索引仅在启用自定义右键菜单时保留；内链映射只保留正文和公告的可渲染属性、页面/别名目标以及实际集合查询结果引用的目标。数据库视图元数据中的全站 ID 不作为引用依据。集合阅读导航、上下篇、图片及 caption 不变。其他主题的数据不变。

## 自动报告

每次 Pages 工作流导出后继续执行原有页面数据门禁，并扫描 `out`、生成 `.perf/site-audit-report.json`：

- 原始发布目录的总字节数、文件数、HTML/JSON/静态代码与其他资源分组。
- 与最近一次成功的 main Pages 工作流报告比较；列出增减最大的文件，包括新增与删除。
- 总量同时增加超过 20% 和 5 MiB 时警告，不因正常增加文章而直接阻止发布。
- 初次运行或旧报告已过期时明确建立新基线，不声称存在历史比较。
- 报告作为 `site-audit-report` Actions artifact 保留 30 天；报告仅含路径、大小、主机名和规则名，无正文或命中密钥。

报告统计的是未压缩的 `out`，不等于 Git 仓库、Actions 缓存、上传归档或访客单次下载大小。

## 发布产物检查

以下情况阻止发布：私有构建文件（如 `.env`、`.git`、`.next`、`.build-cache`）或符号链接混入产物，检测到受支持格式的凭据，或者产物包含实际 BUILD_CACHE_KEY。错误信息只列规则名和文件路径，不打印密钥和正文片段。

检测范围包括 HTML、JS、JSON、CSS、XML、文本、SVG、source map；这不是覆盖所有格式的秘密检测服务。公开的 Cloudflare Web Analytics beacon token 不按密钥处理。外部 script src 的主机名变化会警告；动态加载的脚本与运行时网络请求仍需浏览器/运行端审计。

检查失败时不要关闭扫描或打印命中内容；先在受控环境定位文件，移除泄露来源。若为真实凭据，撤销并轮换后重新构建。

## 依赖与审查归属

Dependency review 工作流使用只读权限查询 GitHub 依赖图差异。新增 high/critical 已知漏洞阻止该检查成功；删除旧漏洞不阻止，moderate/low 仍需 Dependabot 持续跟踪。无依赖文件变化时明确跳过；API 不可用或依赖差异未就绪时不伪报通过，可稍后重跑。该检查不检测尚未公开的漏洞或所有恶意包。

现有自动依赖合并门禁增加 Dependency vulnerability review 要求；完整导出也增加产物扫描。白名单及原有自动合并/发布范围不扩大。

CODEOWNERS 改为 @takedaiori。CODEOWNERS 本身不会启用强制审核；GitHub 的分支规则、Secret scanning 与 Push protection 开关需要仓库管理权限核实，不在代码提交中宣称已经开启。个人仓库不应设置必须由自己批准自己 PR 的不可满足规则。

## 验证与部署

部署工作流新增 `validate_only`，默认为 false。设为 true 时完成导出、检查和报告，但跳过 Pages 发布。`clean_build` 仍仅影响恢复构建缓存，不清除源码补丁。

本阶段不裁剪依赖或旧媒体，不修改页面布局，不删除 Git 历史，不清理 Actions 缓存。后续可根据报告逐组处理。
