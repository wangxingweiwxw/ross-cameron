"""神奇交易员系列：交易员名单（首页卡片、对比表、各页侧栏的系列导航都从这里生成）。

新增一位交易员：
  1. 复制 traders/_template.py 为 traders/<slug>.py，填写资料（文字档案型页面）；
  2. 在下面的 TRADERS 里追加一项，kind='profile'，slug 与文件名一致；
  3. cd tools/series && python3 build.py  → 生成 ../../<slug>/index.html 并刷新首页。
有独立生成器的页面（如 Ross Cameron 的视频复盘档案）用 kind='archive'，build.py 只把它列进首页和导航。
"""
from html import escape

SITE = '神奇交易员'
SITE_EN = 'TRADER CASEBOOKS'

# 列表顺序 = 首页卡片与导航顺序
# accent = 主色；可选 mark / bg / line 覆盖 --ac-mark（图表点、引语竖线）、--ac-bg、--ac-line（默认是蓝色系）
TRADERS = [
    dict(slug='ross-cameron', kind='archive', name='Ross Cameron', zh='罗斯·卡梅伦', mono='RC', accent='#f2a93b',
         region='美国', market='美股小盘动能股', style='动能日内交易 · 做多为主', hold='几秒到几分钟', era='2001—今',
         start='$583（2017 小账户挑战）', peak='$1,881 万（2017—2025 会计师报告累计）',
         tagline='几乎每个交易日收盘后录一期复盘的美股小盘动能交易员、Warrior Trading 创始人。',
         stats=[('30', '期盘后复盘'), ('48', '条心得短片'), ('7.4 h', '中文配音')],
         media=['视频复盘', '中英字幕', '中文配音', '盈亏日历', '会计师账本'],
         source='自录视频字幕 · 会计师报告', updated='2026-09-30'),
    dict(slug='bnf', kind='profile', name='B・N・F', zh='“J-Com 男”', mono='BNF', accent='#9db6ff',
         region='日本', market='东证个股 · 日经 225 期货', style='25 日线负乖离逆张 · 板块联动', hold='一日到一周', era='2000—2009（公开期）',
         start='约 160 万日元（2000）', peak='约 185 亿日元（2007 年末自述）',
         tagline='2000 年用打工攒下的约 160 万日元入市，八年做到两百亿日元级别的日本个人投资者。',
         stats=[('185 亿', '日元 · 2007 年末'), ('20.35 亿', '日元 · J-Com'), ('{sources}', '条出处')],
         media=['文字档案', '资产曲线', '方法拆解', '语录', '说法辨析'],
         source='日本杂志 / 报纸采访 · 公开申报', updated='2026-10-02'),
    dict(slug='seykota', kind='profile', name='Ed Seykota', zh='艾德·塞柯塔', mono='ES', accent='#7fd6a4', mark='#4fbf86', bg='#12251c', line='#24503a',
         region='美国', market='美国商品与金融期货', style='计算机趋势跟踪 · 资金管理', hold='跟随趋势，趋势反转才离场', era='1970 年代—',
         start='$5,000（1972 模型账户）', peak='模型账户 +250,000%（截至 1988 年中）',
         tagline='最早用计算机做期货趋势交易的人之一，Market Wizards 里那个 5,000 美元模型账户的主人，后来转向交易心理。',
         stats=[('$5,000', '1972 模型账户起步'), ('25 万%+', '截至 1988 年中'), ('{sources}', '条出处')],
         media=['文字档案', '业绩口径', '系统案例', '风险热度', '英文原话', '说法辨析'],
         source='Market Wizards 采访 · 本人网站与论文', updated='2026-10-03'),
    dict(slug='livermore', kind='profile', name='Jesse Livermore', zh='杰西·利弗莫尔', mono='JL', accent='#f0918a', mark='#d9665e', bg='#2a1618', line='#5a2c2e',
         region='美国', market='美股 · 棉花、小麦等商品', style='关键点突破 · 顺势加码 · 只做大行情', hold='数周到数月（等大波段）', era='1892—1940',
         start='第一笔交易获利 $3.12（1892，15 岁）', peak='1915—17 年获利约 $500 万；1934 年负债 $226 万',
         tagline='《股票作手回忆录》主人公的原型，几次暴富又几次输光的投机客；1940 年把方法写成书，同年自杀。',
         stats=[('4 次', '失败 / 破产（至 1934）'), ('$300 万+', '1924—25 小麦（自述）'), ('{sources}', '条出处')],
         media=['文字档案', '财富起落', '关键点方法', '小麦与棉花案例', '英文原话', '说法辨析'],
         source='本人 1940 年著作 · 《时代》当年报道 · 回忆录小说', updated='2026-10-03'),
]

UPCOMING = '下一位交易员筹备中'


def by_slug(slug):
    return next(t for t in TRADERS if t['slug'] == slug)


def rail_series(current, base='../'):
    """侧栏里的系列导航（Ross 页和文字档案页共用）。base = 从当前页到站点根目录的相对路径。"""
    links = ''.join(
        f'<a href="{base}{t["slug"]}/"{" class=on aria-current=page" if t["slug"] == current else ""}>'
        f'<i style="--ac:{t["accent"]}">{escape(t["mono"])}</i><span>{escape(t["name"])}<small>{escape(t["market"])}</small></span></a>'
        for t in TRADERS)
    return (f'<div class="series"><a class="series-home" href="{base}">↖ {SITE} · 系列首页</a>'
            f'<nav aria-label="系列中的交易员">{links}</nav></div>')


# 侧栏系列导航的样式：Ross 页（变量与它的模板一致）和文字档案页都内嵌这段
SERIES_CSS = """
.series{display:flex;flex-direction:column;gap:6px}.series .series-home{font:11px var(--mono);letter-spacing:.1em;color:var(--mute);text-decoration:none;margin:0 10px 4px}.series .series-home:hover{color:var(--text)}
.series nav{display:flex;flex-direction:column;gap:2px}.series nav a{display:flex;justify-content:flex-start;align-items:center;gap:10px;text-decoration:none;color:var(--dim);padding:6px 8px;border-radius:7px;font-size:13.5px;box-shadow:none}.series nav a:hover{background:var(--panel)}
.series nav a.on{background:var(--panel2);color:var(--text);box-shadow:none}.series nav a i{flex:none;width:30px;height:30px;border-radius:7px;display:grid;place-items:center;font:normal 600 10px var(--mono);letter-spacing:.02em;color:#0e1114;background:var(--ac)}
.series nav a span{display:flex;flex-direction:column;line-height:1.35;min-width:0}.series nav a small{font-size:11px;color:var(--mute);white-space:nowrap;overflow:hidden;text-overflow:ellipsis}
.m-only{display:none!important}
@media(max-width:980px){.series{display:none}.m-only{display:flex!important}}
"""
