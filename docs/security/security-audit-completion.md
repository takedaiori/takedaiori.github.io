# 安全审计进展与验收

审计基线：f41c30d；2026-11-02。本轮只做安全检查和必要加固，未裁剪业务路由、页面数据、依赖功能或保留动画；Netlify 账户审计继续停止。

## 已执行的检查

- 非浅克隆的可达 Git 历史由固定版本 Gitleaks 扫描；初次两条命中均为同一个 Cloudflare Web Analytics 公开浏览器 beacon 标识。核对来源后只精确排除该标识，没有整文件、整条规则或整个目录豁免。复扫无凭据命中。不可达/已删除远程引用、已过期日志和外部账户不在该结论内。
- 全锁文件扫描和 vendored 制品扫描继续保留，失败、未知评级、高危/严重公告均阻止安全审计。已知中低危不被隐藏。扫描器结果不能等同于没有未知漏洞。
- 新增 Python CodeQL，与既有 JavaScript/TypeScript 分开出结果；所有维护 Python 编译检查，ShellCheck、Shell 语法、全部工作流 actionlint 和当前文件/历史 Gitleaks 纳入安全检查。二进制按固定版本下载，并在执行前验证独立固定 SHA-256；不使用 curl 管道执行安装脚本。
- 发布产物扫描增加 Clerk/Notion 凭据格式、带凭据 Redis URL、Supabase service_role JWT 和服务器已配置秘密的精确匹配。anon JWT、publishable/search-only 公钥不当成服务端密钥；报告只记录规则和脱敏路径，不记录匹配正文。
- 图片代理源码增加响应类型、10 MiB 大小、10 秒上游超时限制，不转发 Cookie/Authorization；不缓存失败或 HTML 响应，图片响应增加 nosniff 和 sandbox CSP。新缓存版本避免复用旧未校验条目。可选原生 IMAGE_RATE_LIMITER 绑定超限/故障分别拒绝；没有绑定时不声称已有分布式限流。

## 合并门禁

所有 PR 现在都会产生稳定的 Security audit gate 与 Site validation gate，不能因路径过滤而永久 Pending。只有明确的文档文件可跳过全站导出；删除/重命名不会漏判。任务失败、取消、缺失，以及需要导出但被权限条件跳过，均失败。

站点构建密钥只交给同仓库维护者分支，以及仅改变既有依赖版本/锁文件、其他 manifest 字段保持不变的同仓库 Dependabot PR；fork 和其他作者不获得凭据。Dependabot 自动维护仍受原来两项开发依赖补丁白名单限制，并在准备及最终合并前检查新增门禁和 Python CodeQL。保留现有完整导出，不扩大自动合并范围。

**需要仓库所有者一次性设置：** 等本 PR 通过后，Settings → Rules → Rulesets → Protect production main → Require status checks，在已有五项之外添加 GitHub Actions 来源的：

- Security audit gate
- Site validation gate
- Analyze (python)

保持 PR、审批数 0、分支最新、禁止删除和强推、无旁路。当前连接不具备 administration 权限，不能替代这一步。上线代码不自动把一个检查变成 GitHub 必需项。

## 外部服务：代码核对与后台证据分别记录

| 对象 | 仓库代码可确认 | 仍需后台核验 |
| --- | --- | --- |
| GitHub | 新规则集的既有五项门禁；最小化 token、SHA 固定 Actions、无 fork 构建密钥；历史与产物扫描 | 旧式保护接口仍 403；额外三项必需检查、Secret scanning/Push protection、协作者、部署密钥、Webhook、App 安装、Actions/环境策略 |
| Cloudflare | 公开 Analytics beacon 与账户 API Token 不同；图片代理源码可测试，固定 Notion 起始域且不转发用户凭据 | 实际运行版本、自定义域名、Rate Limiting binding、WAF、用量/费用告警、账户成员与 Token 作用域 |
| Notion | 集成 token 与公开数据库 ID 分开；公共写入入口默认关闭，旧 OAuth 交换已停用 | 集成可访问页面、数据库授权范围、是否仍有旧 token、评论数据访问权限与日志 |
| Supabase | 使用服务端 SUPABASE_SECRET_KEY/SERVICE_ROLE_KEY，无 NEXT_PUBLIC 服务密钥读取；客户端不持久化 session，调用方是服务端 API | RLS、Policies、anon/authenticated 表权限、服务密钥状态；源代码不能证明数据库已经配置 RLS |
| Clerk | 使用服务端中间件和用户鉴权；publishable key 与 secret key 分开 | 允许域名/回调、组织管理员、会话/MFA、账户成员、线上密钥状态 |
| Algolia | 管理写索引 key 与浏览器 search-only key 使用不同变量 | search-only ACL、索引可见性、写密钥范围、用量与速率限制 |
| Redis | 服务端 REDIS_URL，缓存有过期逻辑 | 实际使用 rediss/TLS、网络 ACL、账户权限、最大内存/淘汰和连接额度 |

未连接的服务不能通过本仓库扫描验证账户状态；不要向助手发送秘密正文。只提供开关、权限范围、隐藏值后的变量名称/状态即可。不对未连接服务执行探测、写数据库或轮换密钥。

## 后台核验的具体路径

1. GitHub：Settings → Branches，看有没有匹配 main 的旧式规则；Settings → Rules 核对上述八项检查。Settings → Code security / Secret Protection（界面名称依账户而异）确认 Secret scanning 与 Push protection 的可用及启用状态；Settings → Collaborators、Deploy keys、Webhooks、Actions → General、Environments 逐项核对仅保留必要主体和权限。403 是读取权限缺失，不是已确认安全或没有规则。
2. Cloudflare：只在确实使用图片代理时部署 [Worker 安全版本](notion-image-proxy.md)，Pages 不会代为部署。核对绑定、日志、Analytics、用量和费用告警；若未部署此 Worker，记录未使用，不创建新服务。
3. Notion：Settings → Connections 与对应 Integration 页面，核对只共享必要数据库/页面；不为了审计扩大范围。
4. Supabase：SQL Editor 只读核对下面查询；Policies/Authentication 页面核对公开角色，不直接替用户修改生产 RLS，避免锁住实际业务。
5. Clerk/Algolia/Redis：在对应账户后台核对上表字段；没有使用则记录未使用，不能凭仓库包含 SDK 认定服务已开通。

```sql
select schemaname, tablename, rowsecurity
from pg_tables where schemaname = 'public';
select schemaname, tablename, policyname, roles, cmd, qual, with_check
from pg_policies where schemaname = 'public';
select table_name, grantee, privilege_type
from information_schema.role_table_grants
where table_schema = 'public' and grantee in ('anon', 'authenticated');
```

## 通过范围

本地与 PR 检查记录分别保留；沙盒 Worker 测试不等于已部署 Cloudflare。源码合并和 Pages 部署不会自动完成后台权限设置。未完成后台项前不能把整个账户安全审计标为完成；裁剪候选继续暂停。
