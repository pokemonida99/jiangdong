# 江東烽火（試玩版）

原創三國回合制 RPG 的手機網頁試玩段，題材是歷史上的孫策渡江。

- 本機測試：`python3 tools/serve.py 4560`，開 http://localhost:4560/
- 企劃：`docs/design.md`
- 改數值：只改 `js/data.js`，再跑 `node tools/sim.js`
- 全程自動測試：在頁面主控台 `const b = await import('/tools/bot_page.js'); await b.play({ speed: 6 })`
- 開發跳關：`?dev=field`、`?dev=boss1`、`?dev=duel`、`?dev=final`

## 素材與授權

- 人物、地圖、背景、標題圖：為本專案用 GPT 生成（`tools/make_jobs.py`、`make_jobs2.py`），再用 `tools/import_art.py` 轉成像素圖。原圖在 `work/`，不進 git。
- 地圖圖塊、小特效：程式繪製（`js/art.js`）。
- 配樂與音效：WebAudio 程式合成，全部原創（`js/audio.js`）。
- 字型：俐方體 11 號（Cubic 11），SIL Open Font License。
- 三國人物與事件取自歷史。劇情、對白、地圖、數值都是本專案自己寫的，沒有使用其他遊戲的素材或資料。
