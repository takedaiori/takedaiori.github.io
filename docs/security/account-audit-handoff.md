# 后台安全审计：已完成检查与权限交接

2026-11-02（香港时间）。生产代码基线 `0106c556f89b29aff321a7d15399c380d675717e`，已成功部署的 Pages 运行 [41464165791](https://github.com/takedaiori/takedaiori.github.io/actions/runs/41464165791)。本轮继续执行可读取的检查，没有修改服务后台权限、公开状态、密钥或业务内容。

## 本轮已实际完成

| 检查 | 结果与边界 |
| --- | --- |
| GitHub 规则集 | Protect production main 为 active；要求 PR、分支最新及八项指定 GitHub Actions 检查；禁止删除/强推；无 bypass actor。没有更改规则或旧式保护。 |
| 最新部署与 CI | 生产代码部署成功，主分支 CI 与两种语言 CodeQL 成功；当前无打开的 PR。先前诊断分支保留旧代码得到的预期失败，不代表生产仍有该告警。 |
| 实际部署产物 | 下载并安全解包这次成功部署的 github-pages 制品，重扫 1,476 个文件。私钥、所列平台密钥格式、带凭据 Redis URL、service_role JWT、私密构建目录等检查未命中。597 个 JSON 中未发现非空字符串 password 字段。这里没有获得所有后台秘密的实际值，不能声称覆盖任意未知格式。 |
| 外部前端脚本 | 发布产物识别到的外部脚本主机只有 static.cloudflareinsights.com；统计 beacon 标识不是账户管理 Token。不能据此认定 Cloudflare 账户没有其他服务。 |
| deepmerge | 再核对官方公告仍无修复版；验证已提交补丁及幂等安装，并运行补丁/调用兼容性测试。没有忽略公告或修改上游版本号。 |
| minimatch | 最新 eslint-plugin-react 7.37.5、eslint-plugin-import 2.32.0 仍声明 3.x；最新版 jest-config 30.5.2 仍使用 deepmerge 4.x。沙盒将旧调用改用 minimatch 11 后，覆盖率依赖 test-exclude 实际报 TypeError: minimatch is not a function；当前兼容调用正常。不能靠只升级一个顶层包就清空全部记录。 |
| 全锁扫描 | 1,091 个包版本，仍为 deepmerge 4.3.1 低危和 minimatch 3.1.5 中危两条版本命中；未发现高危、严重或未知评级。现代解析器调用的 minimatch 已是 11.0.4。 |
| Notion 可访问范围 | 当前连接能读取博客数据源及页面，但没有账户 Integrations、Token 生命周期、发布/共享权限管理接口。没有修改文章属性或数据库。 |

## Notion 草稿与公开权限的专项结果

Notion 的索引 SQL 汇总/筛选与页面实时属性出现不一致，因此不把 SQL 的草稿计数当作完整实时清单。对筛选返回的 23 个候选逐页读取属性，确认其中 4 条为 Draft、18 条为 Published、1 条为 Invisible。这只是候选核验范围，不是全库所有草稿的证明。

对这 4 条已确认 Draft 逐项检查实际部署 JSON：未发现它们的正文记录对象，但部分 collection_view.page_sort 保留了页面标识；标识不等于访问凭据，也不能代替权限检查。为避免进一步传播未发表页面的标识，本公开报告不记录其 URL、标题或标识。

再用没有 authToken/Cookie 的 notion-client 对同一组页面进行读取，并用一条 Published 页面作可用性对照：

- 对照 Published 页面能读取，排除了“所有请求均被网络阻断”的解释。
- 3 条 Draft 返回 page not found。
- 1 条模板类 Draft 可匿名读取根记录及子块，需要所有者确认是否有意公开。可匿名读取模板不等于已经泄露私人文章；以后往该公开页面中写入内容时，Draft 属性不会替它加访问控制。
- Invisible 页面可匿名读取；它表示不列入博客列表，不表示私密。

模板链接只在给所有者的私下交接中提供，不加入公开仓库。需要在该页 Share/Publish 检查直接公开和父级继承。若想取消公开，应先确认是否继承自博客父数据库；不要直接取消整个博客数据库的公开，以免导致构建无法取数。当前连接没有调整共享/发布权限的工具，未擅自移动、删除或改为 Published。

## 需要所有者提供的后台证据

下表列的是未完成核验，不是已发现配置错误。只提供名称、开关、权限范围；密钥正文、Cookie、恢复码、私人邮箱等应遮挡。没有对应服务就记录“本博客未使用”，不要求新建账户或计费资源。

| 编号 | 项目与入口 | 需要看什么 | 当前为什么不能代查 |
| --- | --- | --- | --- |
| G1 | 仓库 Settings → Advanced Security（或 Secret Protection） | Secret scanning、Push protection 是否启用；Security 中有无未解决的秘密告警 | 仓库元数据没有返回这些状态；连接器不开放相应管理/告警接口。 |
| G2 | Settings → Collaborators / Manage access | 直接协作者、角色和未完成邀请，是否都是本人认可的主体 | collaborators 端点被连接器 URL allowlist 拦截，未得到名单。 |
| G3 | Settings → Deploy keys | 每把 key 的名称、只读/写入标志、是否仍使用；不提供私钥 | keys 端点被拦截。 |
| G4 | Settings → Webhooks | 目标域名、事件范围、SSL verification、近期投递状态；遮挡 secret | hooks 端点被拦截。 |
| G5 | Settings → Integrations / GitHub Apps；个人 Settings → Applications | 已安装/授权的 App、仓库访问范围、权限；确认是否仍需保留 | 当前连接的安装可见性不等于能列出本仓库全部第三方授权。 |
| G6 | Settings → Actions → General | 默认 Workflow permissions、外部 PR 审批策略、Actions 创建/审批 PR 开关、允许的 Actions | actions/permissions 端点被拦截。当前媒体安装器只创建维护分支，PR 由所有者/连接器创建；未找到依赖 GITHUB_TOKEN 自动创建/审批 PR 的现有流程。先核对配置，再决定修改。 |
| G7 | Settings → Environments → github-pages | 可部署分支是否限制 main；环境保护与 bypass 条件 | environments 端点被拦截，成功部署不能证明环境策略最小化。 |
| G8 | 个人 Settings → Password and authentication | 仅确认 2FA/通行密钥状态和恢复方式是否已妥善保存；不提供恢复码 | 账户安全状态不在仓库连接能力内。 |
| N1 | 上述模板页 Share/Publish | 是否有意公开、是否继承父级公开；新模板副本是否继承同样权限 | Notion 内容工具没有共享/发布权限管理接口。 |
| N2 | Notion Settings → Connections；博客专用 Integration 的 Access/Capabilities | 博客专用连接授权的页面/数据库、读写能力、闲置 Token 状态 | 当前 ChatGPT Notion 连接的可读写范围不能证明博客构建集成或其他 Integration 的权限；不能枚举全部 Token。 |
| C1 | Cloudflare Web Analytics 与账户成员/API Tokens 页面 | 本博客站点绑定、账户成员、现有 Token 的权限和范围；无 Token 也可以 | 没有 Cloudflare 管理连接。当前只确认统计在用，不要求因此启用 WAF、反向代理或 Worker。 |
| C2 | 仅当实际使用图片代理 Worker 时：Workers 页面 | 线上代码版本、自定义域名、限流绑定、用量和费用告警 | 源码安全测试不能证明线上实例配置；没有管理连接。没部署此 Worker 就记本博客未使用。 |
| S1 | Supabase（只在本博客实际使用时） | RLS、anon/authenticated 表权限、Policies、服务密钥状态 | 当前 Pages 没启用该服务；没有 Supabase 管理连接。 |
| S2 | Clerk（只在本博客实际使用时） | 允许的域名/回调、成员/组织管理员、会话/MFA、密钥状态 | 当前 Pages 没启用该服务；没有 Clerk 管理连接。 |
| S3 | Algolia（只在本博客实际使用时） | search-only ACL、索引范围、写入 key 范围和用量限制 | 当前 Pages 没启用该服务；没有 Algolia 管理连接。 |
| S4 | Redis（只在本博客实际使用时） | TLS/rediss、网络 ACL、用户权限、连接/内存额度 | 当前 Pages 没启用该服务；没有 Redis 管理连接。 |

GitHub 的本次拦截主要发生在连接器允许访问的端点范围，不应全部写成“GitHub 返回 403”。所有者账号在仓库具有 admin 权限，并不意味着当前 GitHub App/工具获得 Administration 管理接口。重新连接同一个 App、提供更多仓库写权限或升级 Notion 套餐，都不能保证补齐缺失的管理能力；不要求所有者把 PAT、服务 Token 或密码交给助手。

## 未完成依赖项的处理边界

- deepmerge 的官方替换须等待兼容修复发布；本地补丁继续随标准安装应用。详情见 [工具链公告处理](toolchain-advisory-mitigations.md)。
- minimatch 3.x 的后续根本修复需要所有旧调用方迁移或经过完整验证的兼容适配；当前不能以破坏覆盖率/质量检查为代价强升。此次没有为消除计数而引入未经验证的替代实现。
- 没有启用新服务、扩大密钥权限或执行生产数据库写入。
- 裁剪事项维持关闭；Netlify 账户审计维持取消；旧式分支保护按所有者要求跳过。

## 来源

- [deepmerge 公告](https://github.com/advisories/GHSA-gcqx-w48m-w2h4)
- [minimatch 公告](https://github.com/advisories/GHSA-g3hv-75wg-m249)
- [GitHub Secret scanning 设置](https://docs.github.com/en/code-security/how-tos/secure-your-secrets/detect-secret-leaks/enable-secret-scanning)
- [GitHub Actions 后台设置](https://docs.github.com/en/repositories/managing-your-repositorys-settings-and-features/enabling-features-for-your-repository/managing-github-actions-settings-for-a-repository)
