# 页面图片包：安全维护与兼容性

本功能用于首页 3 张 Hero 和 About 12 张作品图片，不是文章图片上传器。Notion 正常新增/编辑文章以及手动 Pages 部署流程不变。没有 ZIP 时不会影响构建；删除 ZIP 的 push 会跳过安装，而不是反复报错。

## 使用步骤

1. 把 `Insignificantia-page-media.zip` 放在仓库根目录，通过 PR 合并到 main。原来的直接上传到 main 会被新规则拦截，GitHub 界面应选择创建分支和 PR。
2. 合并后自动运行 Install page media pack，校验后创建 `maintenance/page-media-运行编号-重试编号` 分支。工作流摘要提供 Compare/Create PR 链接；可以由你点击或让助手建立 PR。
3. 等待全部必需检查，以及本次实际触发的全站导出、页面对照和安全检查通过后合并。图片 PR 同时删除消费过的 ZIP。若 main 已前进，更新分支并重新检查。
4. 手动运行 Deploy NotionNext to GitHub Pages，才会将图片发布到主站。

也可以手动运行 Install page media pack，package_name 填根目录其他 ZIP 的文件名。默认 `validate_only` 为 true：只验证，不生成维护分支；确认需要安装时取消勾选。它是长期保留的安全预演选项，不是临时精简开关。这个选项只属于图片任务，与 Pages 部署工作流中同名选项分别生效。

手动运行只允许 main；ZIP 必须已通过 PR 进入 main。本任务不创建 PR、不合并、不部署，不需要新增个人 Token 或机器人旁路。维护者或现有助手连接负责打开 PR，正常 PR 检查再运行。

## 图片命名

| 位置 | 推荐 ZIP 内文件名 | 安装位置 |
| --- | --- | --- |
| 首页 | hero/Hero1.webp 至 hero/Hero3.webp | public/images/insignificantia/hero/hero-01.webp 至 hero-03.webp |
| About | about/About1.webp 至 about/About12.webp | public/images/insignificantia/portfolio/work-01.webp 至 work-12.webp |

兼容根目录 Hero1.webp / About1.webp 等旧名，也兼容 hero/hero-01.webp / portfolio/work-01.webp 和根目录 hero-01.webp / work-01.webp。每个槽位只能出现一种别名，可以只更新部分槽位。除 README.md、README.txt 和 Mac 辅助文件外，未知文件会被拒绝；不能给整个文件树再套一层文件夹。

## 安全边界

- ZIP 文件名只允许有限 ASCII 字符且不含路径；总压缩大小最多 100 MiB，最多 200 项，解压总量 200 MiB、单文件 20 MiB，压缩比最多 100。加密、特殊文件、符号链接、重复/大小写碰撞、绝对路径、路径穿越和控制字符被拒绝。不使用 extractall。
- 只接受上述 15 个图片目的地。先验证所有文件，再写目标，目标路径中有符号链接也拒绝。不能用图片包更新 JS、HTML、工作流或其他任意文件。
- 检查完整 RIFF/WebP 结构，再以 sharp 完整解码。最长边 12000 像素、最多 4000 万像素，只接收静态 WebP；动画和 EXIF/XMP 等附加元数据被拒绝，ICC 色彩配置及现有图片中的 Photoshop PSAI 来源记录（最多 64 KiB）允许；这些不会作为脚本或 HTML 执行，保留原始来源信息。需要先在本地移除照片隐私元数据或转成静态 WebP。原始合格图片按字节复制，不缩放、不重压缩。
- 原生图片解码和依赖安装在 contents:read job，依赖禁用生命周期脚本，不提供 Notion、部署、数据库等应用密钥。写分支 job 不安装依赖、不运行原生解码；它重新检查固定源 SHA 下的 ZIP、图片 SHA-256 与同一次运行的不可变校验制品。
- 仅最终推送步骤获得写 token；只推唯一维护分支，无强推、无 main 直写、无自动合并。源码更新仍必须通过仓库规则。
- 工作流和维护脚本的更改会触发全站导出验证和安全审计；基础 CI 会运行 ZIP 攻击与分支隔离模拟。

## 验证范围

沙盒使用真实生成的静态 WebP，并把当前站点全部 15 张图片实际打包、完整解码，确认兼容且原字节保留。测试覆盖正常安装和逐字节保留、路径攻击、重复槽位/大小写碰撞、ZIP 符号链接、压缩炸弹、条目数量、文件名限制、目标符号链接无部分写入、伪装与截断图片、动画/隐私元数据、超大尺寸、校验清单篡改、校验后源 ZIP 替换。临时 Git 仓库与本地 bare remote 模拟提交和分支推送，确认 main SHA 不变，提交仅包含允许图片与 ZIP 删除。

这不等于保证所有未来格式都能通过：超过限制、包含元数据或损坏的包会主动失败，并要求修正文件。没有在生产库上传测试 ZIP，也没有发布测试图片。
