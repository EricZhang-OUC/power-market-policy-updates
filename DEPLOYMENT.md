# 发布与同步

网站是纯静态前台，访问者不需要账号。发布所需的文件可以用以下命令生成：

```powershell
node --test tests/*.test.mjs
node scripts/build-static.mjs
```

将生成的 `dist/` 目录作为静态站点根目录发布。它包含首页、样式、前台脚本与数据，不需要发布采集脚本、审计记录或文档。托管目标为 GitHub Pages，仓库为 `EricZhang-OUC/power-market-policy-updates`。

公开地址：<https://ericzhang-ouc.github.io/power-market-policy-updates/>

## 定时更新

统一采集命令：

```powershell
node scripts/update-all.mjs
```

运行环境需要 Node.js 20 或更新版本，并能访问所配置的中国大陆政府及媒体网站。采集后需重新执行 `node scripts/build-static.mjs` 并重新发布 `dist/`，公众网页才会获得新数据。

`node scripts/sync-hourly.mjs` 会立即采集一次，再每60分钟采集一次，防止同一进程重叠运行。它只更新本机数据，不负责远程发布；必须保持电脑和进程运行。目前没有启用常驻进程、系统计划任务或云端调度。

`.github/workflows/deploy-pages.yml` 在 `main` 分支推送时发布网站，并在每天北京时间08:00、13:00和23:00运行“采集 → 测试 → 打包 → 发布”。也可在 GitHub Actions 页面手动运行。GitHub cron 显式指定 Asia/Shanghai 时区，直接按北京时间运行。采集结果提交回仓库，以保留已发现的历史记录。

某个来源失败时保留其历史记录和异常状态，后续来源仍继续采集。界面上的更新日期表示本次有来源成功，不代表每一个来源都已完整同步。自动调度已启用；GitHub Actions 每天执行三次，个别来源失败时会继续发布其余成功来源及既有记录。

## 媒体来源边界

目前行业观察只接入北极星电力市场频道的公开网站目录。保存标题、目录发布日期和网站文章链接，不保存全文或摘要，也不将其标为政策官方原文。历史范围为2026年起，不能保证完整回溯。

已移除公众号采集、独立阅读版及少量固定转载补录，取消“其他”栏目。后续新增媒体须先核实其公开文章列表；当前仅研究的候选网站尚未接入，不显示空来源。
