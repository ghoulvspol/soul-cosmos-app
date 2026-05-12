#!/usr/bin/env python3
"""
八字排盘引擎 (BaZi Calculator)
基于 lunar-python 库实现专业级四柱排盘
"""
import sys
import json
from lunar_python import Solar

# 天干
TIAN_GAN = ['甲', '乙', '丙', '丁', '戊', '己', '庚', '辛', '壬', '癸']
# 地支
DI_ZHI = ['子', '丑', '寅', '卯', '辰', '巳', '午', '未', '申', '酉', '戌', '亥']
# 五行
WU_XING_TG = {'甲': '木', '乙': '木', '丙': '火', '丁': '火', '戊': '土', '己': '土', '庚': '金', '辛': '金', '壬': '水', '癸': '水'}
WU_XING_DZ = {'子': '水', '丑': '土', '寅': '木', '卯': '木', '辰': '土', '巳': '火', '午': '火', '未': '土', '申': '金', '酉': '金', '戌': '土', '亥': '水'}
# 阴阳
YIN_YANG_TG = {'甲': '阳', '乙': '阴', '丙': '阳', '丁': '阴', '戊': '阳', '己': '阴', '庚': '阳', '辛': '阴', '壬': '阳', '癸': '阴'}
YIN_YANG_DZ = {'子': '阳', '丑': '阴', '寅': '阳', '卯': '阴', '辰': '阳', '巳': '阴', '午': '阳', '未': '阴', '申': '阳', '酉': '阴', '戌': '阳', '亥': '阴'}
# 地支藏干
CANG_GAN = {
    '子': ['癸'], '丑': ['己', '癸', '辛'], '寅': ['甲', '丙', '戊'],
    '卯': ['乙'], '辰': ['戊', '乙', '癸'], '巳': ['丙', '庚', '戊'],
    '午': ['丁', '己'], '未': ['己', '丁', '乙'], '申': ['庚', '壬', '戊'],
    '酉': ['辛'], '戌': ['戊', '辛', '丁'], '亥': ['壬', '甲'],
}
# 五行生克
WUXING_REL = {
    '木': {'生': '火', '克': '土', '被生': '水', '被克': '金'},
    '火': {'生': '土', '克': '金', '被生': '木', '被克': '水'},
    '土': {'生': '金', '克': '水', '被生': '火', '被克': '木'},
    '金': {'生': '水', '克': '木', '被生': '土', '被克': '火'},
    '水': {'生': '木', '克': '火', '被生': '金', '被克': '土'},
}
# 十神
SHISHEN_MAP = {
    ('同', '同'): '比肩', ('同', '异'): '劫财',
    ('生', '同'): '食神', ('生', '异'): '伤官',
    ('克', '同'): '偏财', ('克', '异'): '正财',
    ('被克', '同'): '偏官', ('被克', '异'): '正官',
    ('被生', '同'): '偏印', ('被生', '异'): '正印',
}
# 日主性格
RI_ZHU_TRAIT = {
    '甲': '大树之木，正直向上，有领导气质，不屈不挠',
    '乙': '花草之木，柔韧灵活，善于适应环境，以柔克刚',
    '丙': '太阳之火，热情大方，光芒四射，天生影响力',
    '丁': '灯烛之火，温暖细腻，洞察力强，照亮他人',
    '戊': '高山之土，厚重稳重，值得信赖，承载万物',
    '己': '田园之土，包容滋养，务实低调，默默付出',
    '庚': '刀剑之金，果断刚毅，行动力强，不畏艰难',
    '辛': '珠宝之金，精致敏锐，追求完美，审美出众',
    '壬': '大海之水，智慧深远，胸怀宽广，顺势而为',
    '癸': '雨露之水，细腻敏感，直觉力强，润物无声',
}


def get_shishen(ri_wx, other_wx, ri_yy, other_yy):
    """计算十神"""
    rel = WUXING_REL.get(ri_wx, {})
    relation = None
    for k, v in rel.items():
        if v == other_wx:
            relation = k
            break
    if relation is None:
        return '比肩' if ri_wx == other_wx else '—'
    same = '同' if ri_yy == other_yy else '异'
    return SHISHEN_MAP.get((relation, same), '—')


def calculate_bazi(year, month, day, hour, gender='unknown'):
    """计算八字排盘"""
    solar = Solar.fromYmd(year, month, day)
    lunar = solar.getLunar()

    # 四柱
    year_gz = lunar.getYearInGanZhi()
    month_gz = lunar.getMonthInGanZhi()
    day_gz = lunar.getDayInGanZhi()

    # 时柱（lunar-python 可直接获取）
    hour_dz_idx = ((hour + 1) // 2) % 12
    hour_dz = DI_ZHI[hour_dz_idx]
    day_tg = day_gz[0]
    day_tg_idx = TIAN_GAN.index(day_tg)
    hour_tg_idx = (day_tg_idx * 2 + hour_dz_idx) % 10
    hour_tg = TIAN_GAN[hour_tg_idx]
    hour_gz = f'{hour_tg}{hour_dz}'

    # 日主
    ri_zhu = day_gz[0]
    ri_wx = WU_XING_TG[ri_zhu]
    ri_yy = YIN_YANG_TG[ri_zhu]

    # 构造四柱详情
    pillars_data = [
        ('年柱', year_gz),
        ('月柱', month_gz),
        ('日柱', day_gz),
        ('时柱', hour_gz),
    ]

    pillars = []
    for name, gz in pillars_data:
        tg, dz = gz[0], gz[1]
        is_ri = (name == '日柱')
        pillar = {
            'name': name,
            'tianGan': tg,
            'diZhi': dz,
            'tianGanWuXing': WU_XING_TG[tg],
            'diZhiWuXing': WU_XING_DZ[dz],
            'tianGanYinYang': YIN_YANG_TG[tg],
            'diZhiYinYang': YIN_YANG_DZ[dz],
            'shiShen': '日主' if is_ri else get_shishen(ri_wx, WU_XING_TG[tg], ri_yy, YIN_YANG_TG[tg]),
            'isRiZhu': is_ri,
            'cangGan': [],
        }
        for cg in CANG_GAN.get(dz, []):
            pillar['cangGan'].append({
                'gan': cg,
                'wuxing': WU_XING_TG[cg],
                'yinyang': YIN_YANG_TG[cg],
                'shishen': '日主' if is_ri else get_shishen(ri_wx, WU_XING_TG[cg], ri_yy, YIN_YANG_TG[cg]),
            })
        pillars.append(pillar)

    # 五行统计
    wx_count = {'木': 0, '火': 0, '土': 0, '金': 0, '水': 0}
    for p in pillars:
        wx_count[p['tianGanWuXing']] += 1
        wx_count[p['diZhiWuXing']] += 0.8
        for cg in p['cangGan']:
            wx_count[cg['wuxing']] += 0.3

    dominant = max(wx_count, key=wx_count.get)
    weakest = min(wx_count, key=wx_count.get)

    # 格局判断
    month_dz = month_gz[1]
    month_cg = CANG_GAN.get(month_dz, ['甲'])
    month_cg_wx = WU_XING_TG[month_cg[0]]
    ge_ju = '普通格局'
    rel = WUXING_REL.get(ri_wx, {})
    for k, v in rel.items():
        if v == month_cg_wx:
            ge_ju = {'克': '财格', '被克': '官杀格', '生': '食伤格', '被生': '印格', '同': '比劫格'}.get(k, '普通格局')
            break

    # 构造摘要
    lack = weakest if wx_count[weakest] < 1.5 else None
    summary_lines = [
        f'八字四柱：{year_gz} {month_gz} {day_gz} {hour_gz}',
        f'日主：{ri_zhu}（{ri_wx}，{ri_yy}）— {RI_ZHU_TRAIT.get(ri_zhu, "")}',
        f'格局：{ge_ju}',
        f'五行：木{round(wx_count["木"],1)} 火{round(wx_count["火"],1)} 土{round(wx_count["土"],1)} 金{round(wx_count["金"],1)} 水{round(wx_count["水"],1)}',
        f'主导：{dominant} | 最弱：{weakest}' + (f' | 五行缺：{lack}' if lack else ''),
        f'农历：{lunar.getYearInChinese()}年{lunar.getMonthInChinese()}月{lunar.getDayInChinese()}',
    ]

    return {
        'fourPillars': f'{year_gz} {month_gz} {day_gz} {hour_gz}',
        'yearPillar': year_gz,
        'monthPillar': month_gz,
        'dayPillar': day_gz,
        'hourPillar': hour_gz,
        'riZhu': ri_zhu,
        'riZhuWuXing': ri_wx,
        'riZhuYinYang': ri_yy,
        'riZhuTrait': RI_ZHU_TRAIT.get(ri_zhu, ''),
        'geJu': ge_ju,
        'wuXing': {
            'count': {k: round(v, 1) for k, v in wx_count.items()},
            'dominant': dominant,
            'weakest': weakest,
            'lack': lack,
        },
        'pillars': pillars,
        'lunar': {
            'year': lunar.getYear(),
            'month': lunar.getMonth(),
            'day': lunar.getDay(),
            'monthChinese': lunar.getMonthInChinese(),
            'dayChinese': lunar.getDayInChinese(),
            'yearChinese': lunar.getYearInChinese(),
        },
        'gender': gender,
        'summary': '\n'.join(summary_lines),
    }


if __name__ == '__main__':
    if len(sys.argv) < 5:
        print(json.dumps({'error': 'Usage: python3 bazi.py year month day hour [gender]'}))
        sys.exit(1)
    year = int(sys.argv[1])
    month = int(sys.argv[2])
    day = int(sys.argv[3])
    hour = int(sys.argv[4])
    gender = sys.argv[5] if len(sys.argv) > 5 else 'unknown'
    result = calculate_bazi(year, month, day, hour, gender)
    print(json.dumps(result, ensure_ascii=False, indent=2))
