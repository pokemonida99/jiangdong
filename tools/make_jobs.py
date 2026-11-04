# GPT 美術工作清單：python3 tools/make_jobs.py && <skill>/scripts/run_jobs.sh
import json
STYLE = ("Original artwork in a chunky 16-bit pixel art style with large visible square pixels, inspired by Chinese woodblock prints: "
 "bold ink outlines, flat limited palette of ink black, aged silk beige, cinnabar red, bronze green and muted indigo, 3 tones per color, no gradients, no anti-aliasing. "
 "Do not imitate any existing game, manga or anime. No text, no letters, no numbers, no watermark, no frame. ")
PORT = STYLE + ("Square 1:1 bust portrait of one man from the chest up, facing the viewer, head, shoulders and chest all face the same direction, no twisted neck, both shoulders visible, "
 "head fully inside the image with space above it, no hands, no weapons. Background: one flat solid pure magenta (#FF00FF) everywhere, no shadows. Character: ")
CH = {
 'sunce': "a dashing 20-year-old Han dynasty general, sharp eyebrows, confident grin, black hair in a high topknot tied with a cinnabar red cloth band, bronze lamellar armor over a red tunic",
 'zhouyu': "an elegant 20-year-old Han dynasty scholar strategist, calm narrow eyes, clean-shaven, black scholar's cap, layered white and deep teal robes with a thin bronze collar",
 'chengpu': "a stern 50-year-old Han dynasty veteran general, gray beard and gray eyebrows, deep wrinkles, dark iron helmet with a short red plume, dark iron scale armor",
 'huanggai': "a stocky 45-year-old Han dynasty general, thick black full beard, broad face, a small scar across one eyebrow, bald head with a tied dark headband, rust-red leather armor with iron shoulder plates",
 'taishici': "a tall fierce 30-year-old Han dynasty warrior, long black sideburns and a short goatee, intense eyes, hair tied back with a dark green band, bronze-green scale armor with a dark high collar",
 'zhangying': "a gruff 40-year-old Han dynasty enemy officer, thick mustache, scowl, round iron helmet with indigo trim, indigo and gray armor",
 'liuyao': "a nervous 50-year-old Han dynasty aristocrat governor, thin long beard, pale face, tall black official's hat, plum purple court robe with gold trim",
 'soldier': "a young friendly Han dynasty supply clerk, round face, simple dark cloth cap, plain beige tunic with a bronze-green sash",
}
BG = STYLE + ("Wide 4:3 landscape background for a side-view battle scene, no people, no animals, no weapons, no flags. Horizon line in the upper third, the lower two thirds are open empty flat ground with only subtle texture so characters can stand on it. Scene: ")
BGS = {
 'bg_plain': "the grassy plain of the lower Yangtze in early spring, far hills, pale sky, a few distant willow trees",
 'bg_forest': "a clearing inside a dense bamboo and pine forest, dark trunks along the far edge, dry reeds on the ground",
 'bg_ford': "a muddy river landing at dusk, the wide Yangtze river and a far shore along the horizon, trampled sand and shallow water at the near ground",
 'bg_gate': "outside the stone walls of a Han dynasty walled city, a huge wooden city gate far away in the middle of the horizon with no writing on it, a packed dirt field in front",
}
TITLE = STYLE + ("Vertical 9:16 poster scene: dusk over the wide Yangtze river, several wooden Han dynasty war boats with cinnabar red sails crossing toward a dark far shore, one small silhouette of a general seen from behind standing at the prow of the nearest boat, huge low sun. The upper 40% of the image is empty sky with thin horizontal clouds, kept simple so a title can be placed there. Banners are plain with no writing.")
jobs = [[k, PORT + v + ".", []] for k, v in CH.items()] + [[k, BG + v + ".", []] for k, v in BGS.items()] + [['title', TITLE, []]]
open('work/jobs/jobs.jsonl', 'w', encoding='utf-8').write('\n'.join(json.dumps(j, ensure_ascii=False) for j in jobs) + '\n')
print(len(jobs))
