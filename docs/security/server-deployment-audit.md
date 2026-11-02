# Server deployment security audit — 2026-11-02

Scope: takedaiori/takedaiori.github.io. GitHub Pages currently serves a static export. Retaining Netlify's server adapter is not evidence that a Netlify project exists, nor that server endpoints are safe to publish.

## Changes in this hardening batch

- Keep legacy player/game URLs as inert HTML with restrictive CSP. Do not delete QR codes or other pending-review assets.
- Remove hidden production debugger loading and Notion-controlled GLOBAL_JS/CUSTOM_EXTERNAL_JS execution. Custom CSS is same-origin only.
- Shared script loaders require same-origin files, reviewed versioned CDN URLs, or the explicit Cloudflare beacon exception. Adding a self-hosted integration requires a source-reviewed policy change; a Notion setting cannot extend the executable allowlist. This does not provide SRI for every third-party script or govern every script inserted by a third-party library.
- Move Prism's default CDN to pinned jsDelivr and the fireworks dependency to pinned cdnjs. Existing third-party integrations outside the allowlist intentionally fail closed until reviewed.
- Clerk middleware uses the stable Next.js 15.5 Node.js runtime, avoiding the Edge-only navigation import incompatibility observed during production compilation. Netlify adapter/runtime behavior with real authentication settings still requires preview acceptance testing.
- Cache maintenance fails closed without its server token. User identity returns a controlled unavailable response when Clerk is unconfigured. Public subscription and Notion-comment writes require explicit server opt-in flags (`SERVER_SUBSCRIPTIONS_ENABLED`, `SERVER_NOTION_COMMENTS_ENABLED`), defaulting to disabled until the acceptance checks below are complete.
- Disable both legacy Notion OAuth exchanges. They lacked OAuth state validation and exposed tokens via logs, URLs or props. Re-enabling requires a new state/PKCE-appropriate flow, HttpOnly session handling and a server-side token store. Do not enable by merely adding credentials.
- Netlify response headers restrict embedding, plugins, base URLs and selected browser permissions. These headers are not applied by GitHub Pages. This is not a complete script CSP.
- Whole-lock OSV scanning runs weekly and on dependency PRs, without installing packages or receiving deployment secrets. Scan outages fail; high/critical/unknown findings fail. Reports are retained for 30 days. Moderate/low findings remain visible. Artifact scanning includes .htm.

## Evidence still required before a server launch

### Netlify account and project

Use a read-only account/API token locally; never paste tokens or environment values into chat. Record project name/ID, connected repository, production branch, last deploy commit, team members/roles, allowed Git installations, deploy hooks, production/preview contexts, access protection and billing/function quotas. Check whether previews inherit production credentials. Run a preview with fake or least-privilege test credentials first. Do not connect a production database to arbitrary PR previews.

Environment inventory should contain only variable NAME, context, scope and whether set. Do not export values. Confirm `NOTION_PAGE_ID`, canonical `NEXT_PUBLIC_LINK`, Clerk test/production separation, and separate cache/revalidation tokens. Never put Supabase service-role/secret keys, OAuth secrets, Redis credentials or admin search keys under `NEXT_PUBLIC_*` or in Notion's client-visible config.

The repository can be audited without account access. Actual Netlify integrations, member access and stored secrets require authenticated read-only evidence. A public deployment cannot prove those settings.

### Server endpoint acceptance matrix

| Endpoint | Required checks before Netlify production |
| --- | --- |
| /api/cache | Missing configured token => 503; missing/wrong bearer => 401; authorized request only => success. Confirm function filesystem permits intended cleanup. |
| /api/revalidate | Missing token => 503; invalid token => 401; restrict paths and batch length; bound work and verify provider revalidation semantics. |
| /api/claude/contribution-refresh | Missing token => 503; invalid token => 401; prefer header tokens, not query strings; rate-limit authenticated refresh work. |
| /api/auth/callback/notion and /auth | Remain disabled. No token/code/secret in logs, Location headers, page JSON or browser storage. |
| /api/user | No credentials => 401/controlled unavailable response; valid user sees only their own ID. Authentication must be enforced in the handler, not only middleware. |
| /api/subscribe | Leave unconfigured until schema validation, rate limiting, bot protection and provider double-opt-in are verified. Review consent/retention before collecting email. |
| /api/notion-comments | Leave unconfigured until origin policy, durable rate limiting/bot protection, moderation and public-field filtering are verified. In-memory limits do not coordinate serverless instances. |
| /api/rss | Confirm only intended public posts and the configured feed limit are exposed. |

Test missing/wrong/valid credentials on a controlled preview with test data, not with guessed production tokens. Repeated abusive traffic testing requires a separate bounded plan. Confirm Netlify routes/headers after deployment; source configuration alone is not runtime proof.

### Supabase and other external services

For each table read by contributionStore, check RLS enabled/forced flags, anon/authenticated grants, policies, service-role usage, exposed schemas, security-definer functions and backups. Service-role keys bypass RLS: keeping them server-side is mandatory but does not replace request authorization. Use test users for cross-user isolation tests. Review access logs, key age and rotation procedures without disclosing values.

Read-only SQL evidence (run in the project's SQL editor; inspect before sharing):

```sql
select n.nspname as schema, c.relname as table_name,
       c.relrowsecurity as rls_enabled, c.relforcerowsecurity as rls_forced
from pg_class c join pg_namespace n on n.oid = c.relnamespace
where c.relkind = 'r' and n.nspname = 'public';
select schemaname, tablename, policyname, roles, cmd, qual, with_check
from pg_policies where schemaname = 'public';
select table_schema, table_name, grantee, privilege_type
from information_schema.role_table_grants
where table_schema = 'public' and grantee in ('anon', 'authenticated');
```

For Notion, verify integration page/database scope and whether comments can expose email/IP. For Algolia, distinguish browser search-only keys from admin keys and review index ACLs. For Redis, verify TLS/network ACLs and expiration. For Clerk, review domains, redirect allowlists, session policies and administrative membership. API availability does not prove the absence of leaked historic keys; rotate any key actually exposed in old OAuth deployments/logs.

### GitHub administration

Authenticated read-only checks should cover main rulesets/branch protection, required checks, bypass actors, administrator enforcement, Actions default token permissions, fork secret policies, allowed Actions, environment protection, repository collaborators, GitHub App installations, deploy keys and webhook targets. Inspect secret NAMES and timestamps only. CODEOWNERS alone does not enforce approval. Verify CodeQL/Dependabot alerts and secret-scanning/push-protection availability in the account.

Use repository Settings screens, or authenticated GitHub CLI REST queries for supported endpoints. A 403 is missing evidence, not evidence that a feature is disabled or safe. Some Pages workflows include narrowly gated automatic dependency merges/deployments; do not describe all releases as manual.

## Release and rollback

Keep the current static Pages deployment while testing a separate Netlify preview. Supply the preview's canonical URL and test credentials, inspect generated files and response headers, run auth/abuse acceptance tests, and only then choose production routing. GitHub's `takedaiori.github.io` hostname cannot be moved to Netlify. A custom domain/DNS change is a separate release action. Preserve the previous successful artifact and deploy commit for rollback.

## 本轮结果与后台审计操作说明

本轮本地全量检查覆盖 1,100 个包名/版本组合。严重、高危、未知评级命中为零；仍有 3 条不同公告、4 个包/公告组合：

- `glob@10.5.0`：中危，取消操作后的文件遍历问题。兼容分支没有公告认可的修复版本；直接替换成 14 会改变旧构建工具依赖的 API。
- `minimatch@3.1.5` 和 `9.0.9`：同一条中危资源放大公告。公告修复位于 11 分支；强制统一到 11 会破坏仍使用旧函数接口的 ESLint/Jest 工具链。
- `deepmerge@4.3.1`：低危，对象合并结果污染。上游目前没有公告认可的修复版本，由 Jest 配置工具引入。

这些是仍保留的已知问题，不应写成“全部漏洞已修复”。本项目对应入口是构建/测试配置，未发现接受博客访客输入的调用路径。全量扫描继续展示这些命中；任何高危、严重、未知评级或扫描服务故障都会失败。后续升级整组工具时继续消除，不通过屏蔽公告假装清零。

已在本地验证：359 项测试通过，类型检查通过，lint 无错误，冻结锁文件离线安装通过。本地服务器生产编译和 8 项真实 HTTP 安全检查也已通过。实际数据全站导出、浏览器回归、服务器构建及真实 HTTP 安全检查由本 PR 的 Actions 再验证；本地结果不替代真实部署验收。

### 如何完成需要后台权限的部分

1. **Netlify**：登录后进入项目的 Project configuration，核对连接仓库/生产分支；在 Environment variables 只整理变量名、作用域、生产/预览上下文和是否已设置，隐藏全部值；在团队成员、Deploy hooks、Functions、部署保护和用量页面核对授权与限制。若尚无项目，记录“未建立”，不要为了审计直接连接生产密钥。
2. **GitHub**：仓库 Settings → Rules / Branches、Actions → General、Environments、Collaborators、Deploy keys、Webhooks；Security 页面核对 CodeQL、Dependabot 和可用的 Secret scanning / Push protection。已只读确认 main 的 protected 标记为 true，但这不能证明所有必需检查和管理员限制都已启用。
3. **Supabase**：项目后台核对 API key 类型与使用位置、表的 RLS、Policies 和匿名角色权限；执行上面的只读 SQL，仅分享结构与策略信息。服务密钥正文始终不需要发送。
4. **Clerk / Notion / 搜索与缓存服务**：分别核对允许域名、回调地址、管理员、授权数据库或页面范围、浏览器公开键与服务端密钥的隔离，以及调用日志和轮换记录。

可以使用已登录的后台只读检查，或由你导出经过脱敏的配置清单后审阅。若现有连接器不能读取这些管理设置，需要单独的只读访问或由你操作后台；公开网址和一次成功构建不能证明后台安全。实际用户隔离、限流和反滥用测试应在独立预览站、测试账户及测试数据库中执行，完成后再决定是否启用服务器写入功能。
