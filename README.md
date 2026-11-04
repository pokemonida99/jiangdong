# 奪唐：朱全忠傳

唐末 8-bit 回合制 RPG 的手機網頁版。主角是朱溫：從碭山窮小子、黃巢部將、賜名「全忠」，一路走向奪唐。目前做到第三章上源驛，全部章節規劃在 `docs/design.md`。

- 本機測試：`python3 tools/serve.py 4560`，開 http://localhost:4560/
- 改數值：只改 `js/data.js`，再跑 `node tools/sim.js`
- 全程自動測試：在頁面主控台 `const b = await import('/tools/bot_page.js'); await b.play({ speed: 10 })`
- 開發跳章：`?dev=0`～`?dev=3`，`?dev=night` 直接到上源驛之夜；加 `&fast=1` 文字不打字
- 改 js 或素材：`index.html` 的 `?v=` 和 `js/art.js` 的 `ART_V` 都要加一

## 怎麼加一章

1. `js/story/chN.js`：寫 `begin`、`npcs`、`places`，照 `ch3.js` 的樣子
2. `js/castles.js`：用文字畫城堡地圖，守軍、寶箱、絞盤、烽火台都填資料就有
3. `js/data.js`：加 `ENEMIES`、`FIGHTS`、`RANDOM`，`CHAPTERS` 標 `built: true`
4. `js/story/index.js`：把章節加進 `CHAPTER_LIST`
5. 新人物：`tools/make_jobs3.py` 加頭像與走路圖，跑 GPT，再跑 `tools/import_art.py`

## 素材與授權

- 人物頭像、走路圖、戰場背景、標題圖與標題字：為本專案用 GPT 生成（`tools/make_jobs3.py`），依唐末服飾與史料特徵繪製並稍微美化，再用 `tools/import_art.py` 轉成 NES 色的真像素。原圖在 `work/`，不進 git。
- 地圖圖塊、視窗、小特效：程式繪製（`js/art.js`、`css/style.css`）。
- 配樂與音效：WebAudio 模擬四聲道合成，全部原創（`js/audio.js`）。
- 字型：俐方體 11 號（Cubic 11），SIL Open Font License。
- 歷史人物與事件取自史書，對白是本專案所寫，史料狀況見 `docs/design.md`。遊戲類型與年代感參考當年的紅白機 RPG，但沒有使用任何既有遊戲的素材或資料；與任天堂無關。
