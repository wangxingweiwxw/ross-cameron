# 神奇交易员 · 交易员资料汇编

传奇交易员的中文资料档案系列。每位交易员一份档案，资料都标出处，并区分本人自述和可查证的记录。全部是静态 HTML，样式和脚本内嵌，不依赖网络字体或 API，离线也能打开。

```
index.html              系列首页：交易员卡片、并排对比、编辑原则
ross-cameron/           Ross Cameron 盘后复盘档案（视频型：字幕、截图、中文配音）
  index.html  frames/  audio/
bnf/index.html          B・N・F 资料汇编（文字型）
seykota/index.html      Ed Seykota 资料汇编（文字型）
livermore/index.html    Jesse Livermore 资料汇编（文字型）
tools/feed/             Ross Cameron 页面的生成器
tools/series/           首页和文字档案页的生成器
scripts/build.mjs       Cloudflare 部署用：把公开页面复制到 dist/
```

部署时把整个目录放到静态服务器上，服务器要支持 HTTP Range 请求（nginx、Caddy、GitHub Pages、Cloudflare Pages 等都默认支持），否则 Ross Cameron 页的配音不能拖动进度。Python 自带的 `http.server` 不支持 Range。旧版只有 Ross Cameron 一页，首页会把 `#v/视频ID`、`#archive` 这类旧锚点自动转到 `ross-cameron/`。

## Cloudflare 部署

本项目是纯静态站点，无需服务器或 API 密钥。部署产物统一放在 `dist/`，只包含首页 `index.html`、各交易员目录（`ross-cameron/`、`bnf/`、`seykota/`、`livermore/`）和 `.nojekyll`，不含 `tools/`。

### Workers（当前 GitHub 自动部署）

- 仓库：`wangxingweiwxw/ross-cameron`，生产分支：`main`。
- 根目录：仓库根目录；Worker 名称：`ross-cameron`。
- 构建命令可以留空；部署命令：`npx wrangler deploy`（或 `npm run deploy`）。
- `wrangler.jsonc` 会在部署时执行 `node scripts/build.mjs`，然后只上传 `dist/`。

本地验证：`npm ci`，然后运行 `npx wrangler deploy --dry-run`。本地预览：`npm run dev`。

### Pages（如果选择独立的 Pages 项目）

- 框架预设：`None`。
- 构建命令：`npm run build`。
- 构建输出目录：`dist`。
- 根目录：仓库根目录；生产分支：`main`。

Pages 的 Git 集成负责发布构建输出，不需要填写 `wrangler deploy`。仓库根目录的 `wrangler.jsonc` 是 Workers 配置，不要将它直接用作 Pages 的 Wrangler 配置。

不要把仓库根目录 `.` 设为静态资源上传目录：它会把 `.git` 历史、工具及依赖一并纳入上传。Cloudflare 单个静态资源最大为 25 MiB；构建脚本会在上传前检查大小，超限时报告实际资源路径。无需删除 Git 历史或拆分现有音频。

参考：[Workers 静态资源配置](https://developers.cloudflare.com/workers/static-assets/binding/)、[Wrangler 自定义构建](https://developers.cloudflare.com/workers/wrangler/custom-builds/)、[Pages 静态 HTML 部署](https://developers.cloudflare.com/pages/framework-guides/deploy-anything/)。

## 新增一位交易员

文字型档案（像 B・N・F 这样以采访、报道和公开文件为主）：

1. 复制 `tools/series/traders/_template.py` 为 `traders/<slug>.py`，按注释填写。正文里用 `[[s:来源ID]]` 标出处，用 `[[t:词条ID|文字]]` 标词条。
2. 在 `tools/series/series.py` 的 `TRADERS` 里追加一项（`kind='profile'`），填首页卡片和对比表用的字段。
3. 运行 `cd tools/series && python3 build.py`，生成 `<slug>/index.html` 并刷新首页和所有页面的系列导航。引用了不存在的来源，或者来源列表里有从未被引用的条目，构建会直接报错。
4. 在 `scripts/build.mjs` 的发布目录列表里加上 `<slug>`，否则 Cloudflare 部署不会包含新页面。

有自己生成器的页面（像 Ross Cameron 的视频档案）在 `TRADERS` 里用 `kind='archive'` 登记，首页和导航会收录它。改了 `TRADERS` 以后，两个生成器都要重跑，因为 Ross 页的侧栏导航也来自这份名单。

## B・N・F 资料汇编

`bnf/index.html`：日本个人投资者 B・N・F（“J-Com 男”）。页面包括档案卡、一页看懂、2000—2008 自述资产曲线（对数刻度，可以悬停查看出处，附数据表）、生平时间线、交易方法（25 日线乖离率逆张、板块联动、止损等，每条都附原话和出处）、J-Com 误下单事件拆解、语录、说法辨析和日股用语，共 30 条资料来源。

来源分三类：“原文”是本站直接读到的报道，“转引”是只读到爱好者网站对杂志原文的摘录，“二次”是维基百科或第三方研究。日文原话只收录能对上原文的几条，其余只给中文大意。资料核查日期为 2026-10-02。数据在 `tools/series/traders/bnf.py`。

## Ed Seykota 资料汇编

`seykota/index.html`：美国趋势跟踪交易员艾德·塞柯塔。主要依据Market Wizards（1989）中的塞柯塔访谈全文、seykota.com（TSP 均线系统、交易部落流程 TTP、Whipsaw Song）和 1993 年塞柯塔与 Druz 合写的风险热度论文。英文原话保留在对应条目里。公开的账户数据只有一组、两个数据点，所以这页不画资产曲线。数据在 `tools/series/traders/seykota.py`。

## Jesse Livermore 资料汇编

`livermore/index.html`：杰西·利弗莫尔。主要依据他本人的《How to Trade in Stocks》（1940）、《股票作手回忆录》（Gutenberg #60979，叙述者是虚构人物 Larry Livingston，引用时一律标“小说”），以及 TIME 1934 年《Fourth Down》和 1940 年《Boy Plunger》两篇报道。TIME 1940 的说法和“1929 年做空赚 1 亿美元”的流传版本不符，页面在说法辨析里放在第一条。数据在 `tools/series/traders/livermore.py`。

# Ross Cameron 盘后复盘档案

页面位于 `ross-cameron/index.html`，`frames/` 和 `audio/` 两个目录要放在它旁边。

## 内容

- **盈亏日历**：2026-08-24 至 09-29 的日历，每格是他在当期视频中自报的当日盈亏。主账户和小账户挑战分开标注。点格子打开当期复盘。
- **复盘档案**：30 期长视频，包括每日复盘、周末观察清单和 46 天小账户挑战课。每期有中文摘要、要点、带时间点的章节、逐段中英对照的字幕全文和 4 张截图（封面，以及视频约 25%、50%、75% 处的画面）。搜索范围包括字幕全文（中英文都能搜）。
- **详情视图**：点开任意一期，左侧是截图。点缩略图可以看到那一刻前后的字幕，并跳到字幕全文的对应位置；点章节也会跳到对应字幕。字幕全文可以在“中英对照 / 中文 / 英文”之间切换，页面会记住你的选择。支持 ←/→ 切换上一期和下一期，链接格式为 `#v/视频ID`。
- **中文配音**：每期的中文译文都有配音（edge-tts 合成，男声 Yunxi），共 78 个 MP3。详情视图里点“一键播放中文配音”就从头朗读，当前段落会高亮，字幕跟着滚动，左侧截图也跟着切换。每段旁的“▶ 听”从该段开始播放。播放时点时间点或章节，配音会跳到对应段落。可以调语速（0.8×—2×），勾选“连播”后播完自动进入下一期。复盘档案和心得短片列表上有“一键连播中文配音”按钮，从当前筛选结果的第一期开始连续播放。空格键暂停或继续，支持锁屏和耳机按键。如果某期没有配音文件（例如新增后还没生成），改用浏览器自带的中文朗读。
- **心得短片**：48 条短片，每条有依据字幕整理的摘要、视频说明的中英文和中英对照的字幕全文。
- **策略词典**：40 个词条和 100 多个股票代码。摘要和字幕里带点状下划线的词可以点开，查看释义和所有相关内容。
- **生平**和**交易账本**：账本依据 2017—2025 年 SingerLewak 会计师报告整理，保留原有的口径说明和勾稽差额。

## 数据出处

- 字幕：TranscriptAPI（transcriptapi.com）对 Ross Cameron 公开视频的自动语音识别转写，取得于 2026-09-30，共 78 条、约 9.9 万词。人名、代码和数字可能有识别错误。
- 字幕译文：本站逐段翻译，共 915 段。口语重复和识别错误按上下文意译，明显丢了小数点的价格（如“350”实为 3.50 美元）在译文里已改正。
- 摘要：本站依据字幕用中文整理。金额和代码以他在视频中的口述为准，未与券商记录核对。
- 配音：用 edge-tts（`zh-CN-YunxiNeural`，语速 +10%）逐段朗读本站译文，MP3 单声道 32 kbps。
- 截图：视频平台自动生成的封面和截图，已下载到 `frames/` 目录，页面不外链视频网站。截图时间点按视频长度估算。
- 业绩：Warrior Trading 官网嵌入的 SingerLewak 2026-03-17 报告，附表覆盖 2017-01-01 至 2025-12-31，核查日期为 2026-09-28。

## 重新生成

生成页面的源文件在 `tools/feed/`：

- `items.json`：条目元数据（ID、日期、标题、说明、播放量）。
- `zh.py`：标题和说明的中文译文，以及主题。
- `transcripts/*.json`：TranscriptAPI 返回的字幕，每条消耗 1 个额度。
- `tx_zh/<id>.tsv`：字幕逐段中文译文，每行“段落起始秒 + Tab + 译文”，和页面上的分段一一对应。`zh_tx.py` 负责分段；`python3 zh_tx.py dump ID` 打印待译段落，`python3 zh_tx.py load 文件` 把译文拆进 `tx_zh/`，`python3 zh_tx.py status` 查看哪些还没翻译。
- `summaries.py`：长视频的摘要、要点、章节、代码和盈亏（`S`），以及短片摘要（`SH`）。
- `template.html`、`app.js`：页面骨架、样式和交互，`TERMS` 词典在 `template.html` 里。
- `index.v1.html`：交易账本部分的来源（只取标记和数据，不用它的样式）。
- `fetch_frames.py`：下载截图并压缩到 `../../ross-cameron/frames/`。
- `tx.py`：把字幕按时间点分段打印出来，写摘要时用。
- `tts.py`：生成中文配音（需要联网）。每段译文单独合成，缓存在 `tts_cache/`，再按期拼成 `../../ross-cameron/audio/<id>.mp3`；每段在音频中的起点记在 `tts.json`。改了译文后重新运行，只会重新合成改动的段落。`build.py` 会检查配音是否和当前译文一致，不一致的那期页面上改用浏览器朗读。

新增一期的步骤：

1. 在 `items.json` 追加条目，在 `zh.py` 补上译文。
2. 用 TranscriptAPI 取字幕，存为 `transcripts/<id>.json`。
3. 在 `summaries.py` 写摘要，并按 `zh_tx.py dump` 的分段把字幕译文写进 `tx_zh/<id>.tsv`（没有译文的段落只显示英文，也没有配音）。长视频的当日盈亏数字写进 `build.py` 的 `PV`。
4. 运行下面的命令。

```bash
cd tools/feed
python3 fetch_frames.py   # 只下载缺少的截图
python3 tts.py            # 只合成缺少或改过的配音
python3 build.py          # 输出到 ../../ross-cameron/index.html
```
