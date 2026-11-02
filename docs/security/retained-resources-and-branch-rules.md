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

公开规则集 Protect production main 已启用，目标为默认分支。其规则只有 deletion 和 non_fast_forward，禁止删除与强推，没有旁路名单。它没有声明 pull_request 或 required_status_checks。

旧式分支保护 GET 返回 403 Resource not accessible by integration：这是当前 GitHub App 的管理读取权限不足，不是发现入侵，也不是证明旧保护不存在。规则集与旧式保护可以叠加，不能仅凭这个公开规则集断言所有保护都已缺失。

CI 会执行测试和检查；只有在 GitHub 中配置为必需条件时，红灯/未完成状态才会被强制用于阻止合并。此前本项目的合并由助手实际核对检查结果，并不代表 GitHub 已强制所有操作者这样做。

## 启用强制门禁前，先核对两个旧维护任务

代码中还有两处直接写 main 的维护流程：

- Originality proofs：更新原创证明清单后直接 git push。最近可见的几次定时运行均为 skipped；这不等于已读取当前仓库变量配置。
- Install page media pack：安装图片包后直接 push 到 main。

强制 PR 和必需检查会拦截这两种旧写入方式。普通 Notion 写作、手动 Pages 部署不会因此被改成必须 PR，因为它们不提交 main 源码。如果你依赖这两个维护功能，应先改造为受检查的 PR 流程，再开启下面的规则；本轮没有改造或关闭它们。不要通过给机器人增加 bypass 来掩盖冲突。改造时还须处理 GITHUB_TOKEN 创建 PR 通常不会触发普通 CI 的限制，不能只把 push 的分支名改掉。

如果目前不用这两个可选维护任务，可以配置下面的日常保护；以后先适配再运行它们。

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
7. 目前不要把 Full site export & artifact scan 或名为 audit 的全量扫描设为全局必需项：这两个工作流有 paths 筛选，文档修改可能完全不触发。GitHub 会把被路径过滤跳过的必需工作流留在 Pending，造成无法合并。先按上述五项强制基础检查；全站导出和全量安全扫描仍按当前条件运行并由合并前审阅核对。若要把它们也强制化，需先调整工作流产生稳定的必需状态。
8. 不启用生产环境的 Require deployments to succeed before merging：本项目先合并 main，再手动部署 Pages；直接要求生产部署先完成会形成顺序冲突。
9. 保存。设置立即生效，不需要部署 Pages。

再打开 Settings → Branches → Branch protection rules，检查有没有匹配 main 的旧规则。若有，查看 required status checks / pull request reviews；不要直接删除整条旧规则。若它要求一个他人审批，新规则集中的 0 审批不会取消旧要求，仍会被卡住。需要把两处要求核对一致。

这套推荐会强制基础门禁和 PR 流程，不等于保证没有漏洞，也不等于每个改动都必须全站导出。保存后可以再次读取公开规则集验证内容；旧式管理配置仍需由有权限的用户在后台核对。不需要提供管理员 Token、密码或私钥。


## 本轮验证

本地 368 项测试、70 个测试套件通过；类型检查和 lint 无错误；四项保留制品查询无已知公告命中。实际全站导出、20 组桌面/手机对照、服务器构建与 HTTP 检查由本 PR 的 Actions 验证。页面没有新增任何动效或按钮。GitHub 管理设置只做解释与只读核对，没有替用户修改。
