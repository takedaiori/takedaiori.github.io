# Insignificantia. 部署指南

> 本文件只描述 Insignificantia. 当前生产链。通用 NotionNext 的 Vercel、Netlify、EdgeOne、Docker/GHCR 等部署方式不属于本实验产品的正式架构。

## 1. 生产架构

当前唯一正式发布路径为：

```text
Private Notion
  → 人工筛选 / 移入 Published Database
  → Notion 事件
  → Cloudflare Worker
  → GitHub workflow_dispatch
  → .github/workflows/deploy-pages.yml
  → yarn export
  → GitHub Pages
```

GitHub Pages 是生产托管端。Cloudflare Worker 只负责验证 Notion 请求并触发 GitHub Actions，不负责托管博客本体。

## 2. 固定运行基线

- Node.js: 22
- Yarn: 1.22.22
- Production theme: `insignificantia`
- Production host: GitHub Pages
- Production workflow: `.github/workflows/deploy-pages.yml`
- Published content source: 独立的 Published Notion Database

不要把 Private Notion 工作区直接接入公开站点。

## 3. GitHub Pages 工作流

`deploy-pages.yml` 使用 `workflow_dispatch` 触发，并完成以下步骤：

1. Checkout repository
2. Setup Node.js 22
3. Install Yarn 1.22.22
4. `yarn install --frozen-lockfile`
5. `yarn export`
6. 为 `out/` 添加 `.nojekyll`
7. 上传 GitHub Pages artifact
8. 使用 GitHub 官方 Pages action 部署

生产构建所需的 Notion 数据入口通过 GitHub Actions Secret `NOTION_PAGE_ID` 提供。不得把真实 ID 或任何 Secret 写入源码、提交记录、Issue、日志示例或本文档。

当前生产工作流还显式固定：

```text
NEXT_PUBLIC_THEME=insignificantia
NEXT_PUBLIC_THEME_SWITCH=false
NEXT_PUBLIC_WIDGET_PET=false
NEXT_PUBLIC_WIDGET_PET_SWITCH_THEME=false
NEXT_PUBLIC_POSTS_PER_PAGE=15
BUILD_PREFETCH_ENABLED=false
STATIC_PAGE_GENERATION_TIMEOUT=600
```

这些值属于当前产品基线；调整时应单独审计并重新执行完整 Pages 验收。

## 4. 手动发布

需要人工重新发布时：

1. 打开 GitHub repository 的 Actions。
2. 选择 `Deploy NotionNext to GitHub Pages`。
3. 使用 `Run workflow`，分支选择 `main`。
4. 确认 build 与 deploy 两个阶段均成功。
5. 检查线上首页、ARTICLE、ARCHIVE、ABOUT 与文章详情页。

手动发布是 Cloudflare 自动链失效时的正式回退方案。

## 5. Notion → Cloudflare Worker → GitHub 自动触发

自动链只负责“通知 GitHub 重新构建”，不改变内容审核模型：只有已经人工确认并进入 Published Database 的内容才应影响公开站点。

Worker 的职责顺序应保持为：

1. 接收 Notion 请求。
2. 使用原始 request body 进行签名校验。
3. 使用 `NOTION_VERIFICATION_TOKEN` 完成 HMAC SHA-256 验证。
4. 过滤不需要触发发布的事件。
5. 调用 GitHub Actions API，对 `deploy-pages.yml` 的 `main` ref 发起 `workflow_dispatch`。
6. 只返回必要状态，不输出任何 Secret。

Cloudflare Worker 中需要的敏感值以 Secret 形式保存，例如：

```text
GITHUB_TOKEN
NOTION_VERIFICATION_TOKEN
```

这里只记录变量名，不记录值。GitHub Token 应限制在目标仓库，并只授予触发 Actions 所需的最小权限。

完整的 Worker 创建、Notion verification、签名验证、Token 权限与故障排查步骤，以《Insignificantia. 技术与设计规格》的最新正式版本为准。

## 6. 发布验收

每次影响生产构建、依赖、路由、主题或数据读取方式的改动，至少确认：

- CI: Lint & type-check 通过
- CI: Unit tests 通过
- CI: Lockfile consistency 通过
- CodeQL 通过
- `deploy-pages.yml` build 成功
- Pages artifact 上传成功
- GitHub Pages deploy 成功
- 首页可访问
- ARTICLE 分页正常，每页 15 篇
- ARCHIVE 正常
- ABOUT 正常
- 文章详情页正常
- `themes/insignificantia` 正常加载
- PET 与主题切换保持关闭
- Published Database 之外的私人内容不会进入公开站点

## 7. 回滚原则

如果某次改动导致构建或线上页面异常：

1. 确认最后一个已验收成功的 commit。
2. 回滚问题改动或恢复对应文件。
3. 重新执行 CI / CodeQL。
4. 重新手动运行 `deploy-pages.yml`。
5. 线上验收通过后再继续下一波瘦身。

不要通过修改 Notion 私有内容、泄露 Secret、临时切换生产主题或启用已冻结功能来规避构建问题。

## 8. Docker / GHCR 状态

Insignificantia. 不使用 Docker 或 GHCR 作为生产、备份或自动发布路径。Wave D 后仓库不再维护 Dockerfile、Docker ignore 或 GHCR image workflow。

如果未来确实需要容器部署，应把它视为新的架构决策重新设计，而不是恢复历史 NotionNext Docker 文件。
