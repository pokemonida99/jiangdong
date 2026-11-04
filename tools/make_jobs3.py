# 《奪唐》GPT 美術工作清單：python3 tools/make_jobs3.py [all|walk|scene] && <skill>/scripts/run_jobs.sh work/jobs/jobs3_<mode>.jsonl
# 人物依唐末服飾與史料特徵畫，再稍微美化：帥、有魅力，但不失特徵。
import json, sys

BASE = ("Original artwork in authentic 8-bit Famicom / NES era pixel art: huge visible square pixels, very limited flat colors, bold black outline, "
        "no gradients, no anti-aliasing, no dithering noise. Do not imitate any existing game, manga or anime character. No text, no letters, no numbers, no watermark, no frame. ")
ERA = ("Historically grounded late Tang dynasty China, 9th century. Men wear round-collar robes with a belt and a black futou cloth cap, or lamellar iron armor with a rounded helmet; "
       "never Han dynasty or Ming dynasty costume. ")
PORT = BASE + ERA + ("Square 1:1 bust portrait of one person from the chest up, facing the viewer, head, shoulders and chest all face the same direction, no twisted neck, both shoulders visible, "
                     "head fully inside the image with space above it, no hands, no weapons. Attractive and charismatic with clean appealing features, sharp clear eyes and a strong silhouette, "
                     "readable when shrunk to 48 pixels. Background: one flat solid pure magenta (#FF00FF) everywhere, no shadows. Character: ")
CH = {
 'zhuwen_y': "Zhu Wen at 25, a handsome lean young brigand from a poor county, fierce clever narrow eyes, confident half smile, thick dark eyebrows, messy short topknot tied with a torn red cloth, patched brown hemp tunic with a rope belt, tanned skin",
 'zhuwen': "Zhu Wen at 32 as a Tang regional general, handsome and dangerous, sharp calculating eyes, trimmed mustache and short goatee, iron lamellar armor with a crimson round-collar robe beneath, rounded iron helmet with a small red tassel",
 'zhanghui': "Lady Zhang, wife of Zhu Wen, a beautiful wise woman of about 25 from a wealthy family, calm intelligent eyes and a slight gentle smile, black hair in a high late-Tang chignon with one plain gold hairpin, modest layered wide-sleeved pale jade and cream robes closed high at the neck",
 'likeyong': "Li Keyong at 28, the Shatuo Turk warlord called the One-Eyed Dragon, striking and fierce, his left eye narrowed shut with a small scar and his right eye burning bright, strong jaw, short black beard, long hair braided at the sides, black lamellar armor with a dark fur collar",
}
ALL = {
 'zhucun': "Zhu Cun, older brother of Zhu Wen, about 28, a broad cheerful bandit with a square jaw and thick stubble, big honest eyes, a dark blue head cloth, sleeveless patched leather vest over a brown tunic",
 'wangshi': "Lady Wang, mother of Zhu Wen, a thin dignified widow in her fifties, gray hair in a plain bun, kind tired eyes, simple faded indigo cotton robe",
 'liuchong': "Liu Chong, a stout rural landlord of about 50, thin mustache, stern frown, black futou cap, plum colored silk round-collar robe",
 'liumu': "old Lady Liu, a white-haired grandmother of about 70 with a warm shrewd smile, white hair in a neat bun with a wooden pin, brown and gray layered robe",
 'huangchao': "Huang Chao, rebel leader about 55, a failed scholar and former salt smuggler, gaunt and magnetic with burning deep-set eyes, long black beard streaked gray, a golden yellow head wrap, plain yellow robe with a dark armor collar",
 'mengkai': "Meng Kai, rebel chief of staff about 40, sly smug face, thin long mustache, yellow head cloth, ornate rebel robe with a gold collar",
 'yanshi': "Yan Shi, rebel army overseer about 40, cold suspicious eyes, hollow cheeks, thin beard, tall black official cap, dark yellow robe",
 'xietong': "Xie Tong, a rebel staff officer and scholar of about 35, thin, intelligent gentle eyes, neat short beard, black futou cap, plain moss green round-collar robe",
 'pangshigu': "Pang Shigu, a loyal general about 40, solemn square face, heavy eyebrows, short black beard, rounded iron helmet, dark iron lamellar armor over a navy robe",
 'zhuzhen': "Zhu Zhen, a hot-blooded young cavalry officer about 28, bright bold eyes, grinning, clean-shaven, red head band with a short top knot, red leather armor with iron shoulder plates",
 'gecongzhou': "Ge Congzhou, a calm brilliant young general about 30, handsome composed face, very thin mustache, rounded bronze helmet with a green tassel, green-trimmed lamellar armor",
 'jingxiang': "Jing Xiang, a quiet scholar-advisor about 35, slim, narrow observant eyes, long thin beard, black futou cap, dark gray round-collar robe with an ink-stained cuff",
 'wangchongrong': "Wang Chongrong, Tang military governor about 50, imposing, thick gray beard, bold eyes, gold-trimmed black futou cap, red official round-collar robe over a metal collar",
 'yangyanhong': "Yang Yanhong, a Tang court-appointed officer about 45, wary thin face, small eyes, sparse beard, black futou cap, dark red round-collar robe",
 'shangrang': "Shang Rang, rebel commander about 45, heavy brow, big black beard, yellow head wrap, battered iron armor with a yellow cloth sash",
 'liyao': "Li Tiao, the Tang governor of Guangzhou about 55, proud stubborn old official, white goatee, black futou cap, deep purple round-collar robe",
 'mishen': "Mi Cheng, Tang prefect of Tongzhou about 45, anxious rounded face, thin mustache, black futou cap, teal round-collar robe",
 'envoy': "a Tang court eunuch envoy about 45, smooth beardless face, faint knowing smile, black gauze cap, ornate plum robe",
 'peasant': "a thin weary farmer about 40, straw hat tipped back, sun-browned face, patched gray hemp clothes",
 'soldier_b': "an ordinary young soldier of the Bian army about 22, friendly, plain rounded iron helmet, crimson tunic under simple iron plates",
 'soldier_r': "an ordinary rebel soldier about 30, gaunt, yellow head cloth, torn brown tunic, wary look",
 'soldier_t': "an ordinary Tang imperial soldier about 30, grim, rounded iron helmet with a blue tassel, blue tunic under iron lamellar",
 'bandit': "a rough highway bandit about 35, scarred cheek, wild hair, gray head cloth, ragged fur vest",
}
SHEET = BASE + ("Top-down RPG walking sprite sheet with tiny chibi proportions, big head, about 2 heads tall, 8-bit console style. One flat solid pure magenta (#FF00FF) background everywhere, no ground shadows, no grid lines. "
                "The SAME one character drawn 12 times in a neat grid of exactly 3 columns and 4 rows with wide empty space between the cells; every figure the same size, feet on the same line in each row, nothing touching. "
                "Row 1: facing the viewer. Row 2: facing LEFT in pure side view. Row 3: facing RIGHT in pure side view. Row 4: seen from behind. "
                "Columns: 1 standing still, 2 walking with the left foot forward, 3 walking with the right foot forward. Head, shoulders and feet always face the same direction. Colors match the reference portrait. Character: ")
W = {
 'w_zhuwen_y': "lean young brigand in a patched brown hemp tunic with a rope belt, messy black topknot tied with a red cloth",
 'w_zhucun': "broad bandit in a dark leather vest over a brown tunic, dark blue head cloth",
 'w_zhanghui': "elegant woman in long pale jade and cream wide-sleeved robes reaching the ground, black hair in a high chignon with a gold pin",
 'w_wangshi': "thin old woman in a long faded indigo robe, gray hair in a bun",
 'w_liuchong': "stout landlord in a plum colored robe and a black futou cap",
 'w_liumu': "white-haired grandmother in a long brown and gray robe",
 'w_huangchao': "gaunt rebel leader with a long dark beard, golden yellow head wrap, long plain yellow robe with a dark armor collar",
 'w_mengkai': "sly rebel officer with a yellow head cloth and a yellow robe with a gold collar",
 'w_yanshi': "thin overseer with a tall black official cap and a dark yellow robe",
 'w_xietong': "thin scholar with a black futou cap and a moss green round-collar robe",
 'w_pangshigu': "general with a rounded iron helmet and dark iron lamellar armor over a navy robe, short black beard",
 'w_zhuzhen': "young officer with a red head band and top knot, red leather armor with iron shoulder plates",
 'w_gecongzhou': "young general with a rounded bronze helmet with a green tassel and green-trimmed lamellar armor",
 'w_jingxiang': "slim scholar with a black futou cap and a dark gray robe, long thin beard",
 'w_wangchongrong': "imposing governor with a thick gray beard, black futou cap and a red official robe",
 'w_likeyong': "fierce warlord with long side braids and a black beard, black lamellar armor with a dark fur collar, one eye shut",
 'w_yangyanhong': "wary officer with a black futou cap and a dark red robe",
 'w_shangrang': "big-bearded rebel commander with a yellow head wrap and battered iron armor with a yellow sash",
 'w_envoy': "beardless court envoy with a black gauze cap and an ornate plum robe",
 'w_peasant': "thin farmer with a straw hat and patched gray hemp clothes",
 'w_soldier_b': "young soldier with a plain rounded iron helmet and a crimson tunic under iron plates",
 'w_soldier_r': "rebel soldier with a yellow head cloth and a torn brown tunic",
 'w_soldier_t': "imperial soldier with a rounded iron helmet with a blue tassel and a blue tunic under iron lamellar",
 'w_bandit': "rough bandit with wild hair, a gray head cloth and a ragged fur vest",
}
BG = BASE + ("Wide 4:3 background for a side-view RPG battle on an old 8-bit console, no people, no animals, no weapons, no flags. Horizon in the upper third; the lower two thirds are open flat ground with only a little simple pattern so small figures stand out. Scene: ")
BGS = {
 'bg2_plain': "the wide plain of north China in late summer, millet fields far away, low brown hills, big blue sky with blocky clouds",
 'bg2_forest': "a clearing in a dark green forest of pines, thick trunks along the far edge, dry grass on the ground",
 'bg2_ford': "a muddy river crossing of the Yellow River at dusk, wide brown water along the horizon, trampled sand in front",
 'bg2_gate': "outside a gray brick Tang dynasty city wall with a huge wooden gate and a simple tiered gate tower far away, no writing on it, packed dirt field in front",
 'bg2_hall': "inside a Tang dynasty fortress hall, thick red pillars along the far wall, dark wooden beams, torches, a flat gray stone floor",
 'bg2_night': "a courtyard of a Tang dynasty inn at night in a violent rainstorm, dark wooden buildings along the far side, lightning far behind, wet dark stone ground",
 'bg2_pass': "a narrow mountain pass in yellow loess country, steep cliffs on the far side, a small watch tower, packed earth ground",
 'bg2_south': "a humid southern Chinese coast, palm-like trees and banana leaves far away, a walled harbor city on the horizon, red earth ground",
}
TROOPS = BASE + ("Sprite sheet on one flat solid pure magenta (#FF00FF) background with no shadows and no grid lines. A grid of exactly 3 columns and 2 rows with wide empty space between the cells, small late Tang dynasty soldiers in pure side view all facing RIGHT, same scale, feet on one line in each row, nothing touching. "
  "Column 1: a foot soldier in a pure red tunic and rounded iron helmet holding a long spear upright. Column 2: a cavalryman in a pure red tunic riding a brown horse, holding a short spear. Column 3: an archer in a pure red tunic with a rounded helmet holding a bow. "
  "Row 1: standing. Row 2: the same soldier mid-stride, attacking forward. Use pure saturated red for all clothing so it can be recolored.")
LOGO = ("Two huge Traditional Chinese characters 奪唐, written horizontally, exactly these two characters in this order with correct strokes, heavy blocky 8-bit console game title lettering with huge square pixels, "
        "gold fill with a crimson edge and a black outline, no other text. One flat solid pure magenta (#FF00FF) background, wide 2:1 composition.")
TITLE = BASE + ("Vertical 9:16 title screen scene: at dusk a huge walled Tang dynasty capital with a tiered palace roof far below a blood red sky, a lone armored general seen from behind standing on a cliff, a black horse beside him, tattered crimson banners with no writing, "
                "a burning horizon, deep indigo clouds. The upper 40 percent of the image is simple sky so a title can be placed there.")

mode = sys.argv[1] if len(sys.argv) > 1 else 'all'
if mode == 'all':
    jobs = [[k, PORT + v + ".", []] for k, v in {**CH, **ALL}.items()]
elif mode == 'walk':
    jobs = [[k, SHEET + v + ".", [f"work/art/{k[2:]}.png"]] for k, v in W.items()]
else:
    jobs = [[k, BG + v + ".", []] for k, v in BGS.items()] + [['troops2', TROOPS, []], ['logo2', LOGO, []]]
open(f'work/jobs/jobs3_{mode}.jsonl', 'w', encoding='utf-8').write('\n'.join(json.dumps(j, ensure_ascii=False) for j in jobs) + '\n')
print(len(jobs))
