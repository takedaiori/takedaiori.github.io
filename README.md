# Insignificantia. V0.54 HTML prototype

This is a self-contained visual prototype. Each HTML file embeds its own CSS/JS so local double-click preview keeps the intended layout.

- index.html — Home / Hero / 12 latest cards
- articles.html — ARTICLE / 15 articles per page
- article.html — Article detail / desktop TOC / mobile hidden
- archive.html — TAG + YEAR archive
- archive-list.html — Archive result list
- about.html — social links + 12-piece portfolio + lightbox

V0.54 changes: hamburger navigation; Hero slogan + single action; 7s cover carousel; first tag is primary homepage label; author/category removed from content model; full homepage summaries; whole homepage cards clickable; About portfolio captions + lightweight lightbox.

V0.54 changes: Lightbox interpretation confirmed (in-site preview only; no original-file/download link); restored both Hero actions with “关于这里” linking to about.html; Hero kicker changed to HOBBY DRIVEN · AI NATIVE; Hero slogan shortened to “以爱好驱动的AI原生博客。”; Archive tag cards sorted by alphabetic/pinyin order in this prototype; Archive result page no longer shows the redundant “TAG · AI” badge; first-tag ordering must be explicit and reorderable in the future editor.

V0.54 changes:
- Hero secondary copy changed to “游戏行业深度洞察，模拟驾驶，跑鞋与厨艺，与AI共同完成。”
- ARTICLE / ARCHIVE / ARCHIVE RESULT / ABOUT remove the large visible page title and intro; only the pink kicker remains. Semantic headings are retained as visually hidden text for accessibility.
- ARCHIVE removes visible “标签 / 年份” section headings; a larger 136px group gap is used to separate tag cards from year cards. Hidden semantic section headings remain.
- Editor heading model is clarified: article title is a separate title field; body editor visually supports H1 / H2 / H3. The prototype now demonstrates a body H1.
- Image + caption storage is confirmed to render as <figure><img><figcaption>.
- Social profile URLs remain placeholders until pre-launch.
- Archive sorting is confirmed: English A–Z; Chinese by pinyin.

V0.54 changes:
- ARCHIVE result kicker now includes the active filter value, e.g. “ARCHIVE RESULT · AI” or “ARCHIVE RESULT · 2026”.
- Article title/body heading HTML semantics are explicitly deferred to the formal implementation phase; the confirmed editor UX remains title + body H1/H2/H3.
- Visual design is treated as provisionally frozen after V0.54 pending implementation discoveries.
