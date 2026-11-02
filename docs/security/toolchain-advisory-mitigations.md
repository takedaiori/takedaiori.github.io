# deepmerge 与 minimatch 公告处理

2026-11-02。原始公告继续由全锁文件 OSV 审计显示，不通过忽略规则、改版本号或删测试工具制造清零。

## deepmerge：本地可复核补丁

GHSA-gcqx-w48m-w2h4，低危，官方公告截至本次核查没有修复版。当前 4.3.1 由 Jest 配置合并使用，不是面向博客访客的 API。不要把“开发依赖”理解为永远没有风险：不可信测试配置仍可能触发问题。

补丁将 mergeObject 的三个 destination[key] 赋值改为显式定义可写、可枚举、可配置的数据属性，避免 __proto__ 触发原型 setter，同时保留普通对象原型、数组、Symbol 和自定义合并功能。覆盖 index.js、CommonJS 和 UMD 三份入口，不改上游包版本。

- patches/deepmerge-security.json 固定上游版本、原始和补丁后 SHA-256。
- 安装后由 scripts/maintenance/patch-deepmerge.cjs 验证并应用；重复执行不重复修改。
- 上游版本或内容不符时失败，要求重新审查，不能默默对未知代码打补丁。
- __tests__/lib/deepmergeSecurity.test.js 验证目标对象原型注入、null-prototype 输入、正常配置合并以及补丁一致性。
- 如果维护者刻意使用 --ignore-scripts 安装，必须先手动执行 node scripts/maintenance/patch-deepmerge.cjs，再运行工具链。标准 frozen install 会执行安装后步骤。clean build 重新安装时也会重施补丁，不依赖旧缓存保留修改。

这是本站维护的临时缓解，不是官方已发布修复，也不会让版本型公告自动消失。官方发布兼容修复后应移除本地补丁并升级。

## minimatch：按调用方分组，不能全局强升

GHSA-g3hv-75wg-m249，中危；官方修复从 11.0.1 开始。描述的放大路径涉及 optimizationLevel >= 2 的 globParts 预处理。旧 3.x 不具备同一预处理实现，但版本扫描仍将其列入，不能擅自把公告删掉。

3.1.5 仍由 ESLint/Jest 的旧工具链调用，CommonJS 导出为可直接调用的函数。11.x 改为对象导出；全局替换会造成 TypeError，因此不可直接把所有版本强制改为 11。后续根本解决需要调用方升级或有明确 API 适配的替代实现，再完整验证 lint、测试和导出。

已在隔离环境将两个 TypeScript-ESLint 调用链的 9.x 定向升级到 11.0.4。移除旧 brace-expansion 全局 2.x 强制解析后，新版调用自己的 5.0.12，旧 minimatch 3.x 调用其兼容的已修复 1.1.21；不将 5.x 强塞给旧调用方。新增兼容性测试直接验证两个解析器的实际版本、花括号模式、命名导出，以及旧工具链的函数 API。合并还要求完整发布验证通过。

博客访客没有提交 glob 模式给上述工具链的入口。仍应只运行可信仓库配置，不向未审核外部 PR 的构建开放私密凭据；正常依赖扫描和升级维护保留。
