# 暂留资源审计与主分支保护说明

审计日期：2026-11-02。代码基线：c4cf1e2。Netlify 账户审计按站点所有者要求停止，不再继续登录或查询。

## 暂留资源结论

| 资源 | 当前状态 | 本轮结论 |
| --- | --- | --- |
| public/js/lenis.js | 自报版本 0.2.28；旧版转译包，非 npm UMD 构建的字节副本；没有当前主题调用方 | 保留。未发现网络上传、凭据/存储读取或动态执行入口。对整个 npm 包版本范围查询 OSV，当前无命中；不把自报版本当成来源认证。 |
| components/Lenis.js | 闲置封装 | 保留并修复：取消卸载后的 RAF 循环；异步脚本在卸载后返回时不再创建实例。属于资源生命周期问题，并非已证实的远程入侵。 |
| public/js/typed.min.js | 2.0.12；标准化 AST 与官方 npm 版本一致，差别是格式和对象键引号；没有当前调用入口 | 保留。没有主动网络请求或敏感存储读取。支持 HTML 输出是功能边界，不应把不可信文字直接交给默认 HTML 模式。 |
| public/css/wow/animate.css | animate.css 3.7.2 的本地子集；没有当前加载调用方 | 保留。审查内容为动画声明，没有 @import、资源 url()、expression 或 behavior。 |
| lib/plugins/wow.js | 固定版本的远程 WOW 1.1.2 加载器，当前无调用方 | 保留，增加固定 SHA-384 SRI 和 anonymous CORS；返回内容不符时浏览器拒绝执行。CDN 制品与 npm wowjs 构建不相同，记录此来源边界，不声称字节匹配。 |
| public/js/fullscreen.js | 仅服务于已停用的旧 iframe 包装页，无现存引用 | 删除。复用并改进 FullScreenButton 的原生 Fullscreen API 实现，支持指定目标元素；修正 Escape 状态同步和拒绝请求后的错误状态。 |

审计范围包括静态代码检查、调用/输入路径检查、已知漏洞查询和相关生命周期/权限失败测试。结论是当前未发现新增可利用安全问题，不是对未知漏洞的永久保证。没有重新启用任何滚动、打字或 WOW 特效，也没有增加页面上的全屏按钮。

### Typed 的安全使用边界

未来接入动态文字时，使用文本模式，保持光标和属性选项为代码中可信常量。例如：

```js
new window.Typed('#target', {
  strings: textStrings,
  contentType: 'null',
  cursorChar: '|',
  attr: null
})
```

不把 URL 参数、评论、第三方返回内容交给 HTML 模式、事件属性或动态 cursorChar。原库的 HTML 功能没有被篡改；目前也没有业务调用方。

### 后续自动检查

vendored-resources.json 记录本地制品 SHA-256、版本识别依据，以及 WOW 的 URL/SRI。普通 CI 验证摘要，完整安全审计每周查询这些未出现在 yarn.lock 中的包。变更制品必须重新审计并更新记录；不能仅为了让检查变绿而改摘要。已知漏洞查询失败或覆盖不完整会失败；新命中会阻止该审计通过。当前四项查询无命中，和锁文件中仍记录的中低危工具链公告是两组不同结果。

## GitHub 当前能确认的保护

2026-11-02 重新读取公开规则集：Protect production main 为 Active，目标默认分支，没有 bypass。已启用禁止删除、禁止强推、必须 PR、审批数 0，以及五项 GitHub Actions 必需检查：Lint & type-check、Unit tests、Lockfile consistency、Dependency vulnerability review、Analyze (javascript-typescript)。已要求分支在合并前保持最新。本轮新增 Security audit gate、Site validation gate 和 Analyze (python) 已能稳定产生状态，但仍需所有者把它们加入规则集，不能把工作流上线等同于后台规则自动更新。

旧式分支保护管理接口仍返回 403；这表示当前连接缺少相应管理读取权限，不能据此断言旧规则不存在。新规则集已经可以公开确认上述门禁。

普通 Notion 写作、手动 Pages 部署不向 main 提交源码，因此不会被“必须 PR”拦截。源码、依赖、媒体文件更新需通过 PR；检查失败或分支落后时会被拦住，这是预期保护。

## 旧维护任务已经适配

- Originality proofs 自动项目彻底关闭：删除定时/手动工作流、自动清单写入模块、自动开关和构建时调用。以后即使残留同名环境变量也不会启用自动写回。文章已有的手工原创信息、内容哈希展示开关和版权声明不属于自动写回任务，保持原功能。
- Install page media pack 保留，改为只读校验和单独写分支两个 job。不会直接 push main，不授予 bypass，也不会自动部署。详见 [图片包维护说明](page-media-maintenance.md)。
- 需要 PR 时由维护者或现有助手连接创建，使普通 PR CI 运行；不依赖机器人自行创建 PR 或 dispatch 检查替代所需的 PR 检查，不要求新 PAT 或新增 App 权限。

## 个人博客建议配置

打开仓库 → Settings → Rules → Rulesets → Protect production main → Edit：

1. 保持 Enforcement 为 Active，Target 为 Default branch，旁路名单为空。
2. 保持 Restrict deletions 和 Block force pushes。
3. 启用 Require a pull request before merging，使更改先进入 PR。个人维护模式不要求另一个人的审批：审批数为 0；若界面有单独 Require approvals 开关则保持关闭。不要启用 Code Owner 审批或最后一次推送必须由他人批准。作者不能批准自己的 PR；当前助手创建的 PR 也归属同一个用户。
4. 启用 Require status checks to pass before merging，逐项添加下面五项，并选择 GitHub Actions 作为预期来源（界面提供时）：
   - Lint & type-check
   - Unit tests
   - Lockfile consistency
   - Dependency vulnerability review
   - Analyze (javascript-typescript)
5. 建议启用 Require branches to be up to date before merging。主分支前进后，旧 PR 需要 Update branch，再等待新检查。
6. 可启用 Require conversation resolution before merging。
7. 新一轮已经取消安全审计与站点验证的工作流级 paths 筛选，并提供稳定的 Security audit gate 与 Site validation gate。现在应在上述五项之外，额外加入这两项和 Analyze (python)，同样选择 GitHub Actions 来源。文档修改由汇总门禁明确允许跳过导出；需要导出时若失败、取消或被权限条件跳过，会阻止通过。不要用原始 Full site export & artifact scan 或通用 audit 任务替代汇总门禁。完整步骤与后台边界见 [安全审计清单](security-audit-completion.md)。
8. 不启用生产环境的 Require deployments to succeed before merging：本项目先合并 main，再手动部署 Pages；直接要求生产部署先完成会形成顺序冲突。
9. 保存。设置立即生效，不需要部署 Pages。

再打开 Settings → Branches → Branch protection rules，检查有没有匹配 main 的旧规则。若有，查看 required status checks / pull request reviews；不要直接删除整条旧规则。若它要求一个他人审批，新规则集中的 0 审批不会取消旧要求，仍会被卡住。需要把两处要求核对一致。

这套配置会强制基础与新增安全门禁和 PR 流程，不等于保证没有漏洞，也不等于每个改动都必须全站导出。新增三项只有保存到规则集后才成为 GitHub 必需检查。保存后可以再次读取公开规则集验证内容；旧式管理配置仍需由有权限的用户在后台核对。不需要提供管理员 Token、密码或私钥。


## 上一轮保留资源验证

本地 368 项测试、70 个测试套件通过；类型检查和 lint 无错误；四项保留制品查询无已知公告命中。实际全站导出、20 组桌面/手机对照、服务器构建与 HTTP 检查由本 PR 的 Actions 验证。页面没有新增任何动效或按钮。GitHub 管理设置只做解释与只读核对，没有替用户修改。
