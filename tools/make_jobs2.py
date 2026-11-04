# 第二批：地圖走路圖、戰場小兵、標題字
import json
BASE = ("Original pixel art sprite sheet for a top-down 16-bit style RPG, chibi proportions (big head, about 2.5 heads tall), bold dark outline, flat limited palette, no anti-aliasing, large visible square pixels. "
 "One flat solid pure magenta (#FF00FF) background everywhere, no shadows on the ground, no grid lines, no text, no numbers. Do not imitate any existing game. ")
WALK = BASE + ("The SAME one character drawn 12 times in a neat grid of exactly 3 columns and 4 rows with wide empty space between the cells; every figure the same size, feet on the same line in each row, nothing touching. "
 "Row 1: facing the viewer. Row 2: facing LEFT in pure side view. Row 3: facing RIGHT in pure side view. Row 4: seen from behind. "
 "Columns: 1 standing still, 2 walking with the left foot forward, 3 walking with the right foot forward. Head, shoulders and feet always face the same direction. The character's face, hair and clothing colors match the reference portrait. Character: ")
CH = {
 'w_sunce': "young general in bronze-green armor over a red tunic, high black topknot with a red band",
 'w_zhouyu': "young scholar in white and deep teal robes with a black scholar's cap",
 'w_chengpu': "old general in dark iron armor and helmet with a red plume, gray beard, red short cape",
 'w_huanggai': "stocky bald general with a dark headband, full black beard, rust-red armor",
 'w_taishici': "tall warrior in bronze-green scale armor, black hair with a green band, small goatee",
 'w_zhangying': "enemy officer in indigo and gray armor with a round iron helmet and a thick mustache",
 'w_soldier': "young supply clerk in a plain beige tunic with a green sash and a dark cloth cap",
}
REF = {'w_sunce':'sunce','w_zhouyu':'zhouyu','w_chengpu':'chengpu','w_huanggai':'huanggai','w_taishici':'taishici','w_zhangying':'zhangying','w_soldier':'soldier'}
jobs = [[k, WALK + v + ".", [f'work/art/{REF[k]}.png']] for k, v in CH.items()]
jobs.append(['troops', BASE + ("A grid of exactly 3 columns and 2 rows with wide empty space between the cells, small Han dynasty soldiers in pure side view all facing RIGHT, same scale, feet on one line in each row, nothing touching. "
 "Column 1: a foot soldier in a red tunic and simple helmet holding a long spear upright. Column 2: a cavalryman in a red tunic riding a brown horse, holding a short spear. Column 3: an archer in a red tunic holding a bow. "
 "Row 1: standing. Row 2: the same soldier mid-stride, attacking forward. Use pure saturated red for all clothing so it can be recolored."), []])
jobs.append(['logo', ("Four large Traditional Chinese characters 江東烽火 written horizontally left to right in bold rough brush calligraphy, exactly these four characters in this order, correct strokes, "
 "ink black strokes with a cinnabar red dry-brush edge and a few sparks like embers, rendered as chunky pixel art with visible square pixels. One flat solid pure magenta (#FF00FF) background, wide 3:1 composition, no seal stamp, no other text."), []])
open('work/jobs/jobs2.jsonl', 'w', encoding='utf-8').write('\n'.join(json.dumps(j, ensure_ascii=False) for j in jobs) + '\n')
print(len(jobs))
