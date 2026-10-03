"""神奇交易员系列：生成首页 ../../index.html 和每位文字档案型交易员的 ../../<slug>/index.html。
用法：cd tools/series && python3 build.py
页面都是单文件静态 HTML（样式和脚本内嵌，无外部依赖）；Ross Cameron 的视频档案由 tools/feed/build.py 单独生成。"""
import importlib, json, os, re, sys
from html import escape
sys.path.insert(0, os.path.dirname(os.path.abspath(__file__)))
from series import SITE, SITE_EN, TRADERS, UPCOMING, SERIES_CSS, rail_series

ROOT = '../..'
read = lambda f: open(f, encoding='utf-8').read()
ICON = lambda c, t: ("data:image/svg+xml," + f"<svg xmlns='http://www.w3.org/2000/svg' viewBox='0 0 32 32'><rect width='32' height='32' rx='7' fill='{c}'/>"
                     f"<text x='16' y='21' font-family='monospace' font-weight='700' font-size='{11 if len(t) > 2 else 13}' text-anchor='middle' fill='%230e1114'>{t}</text></svg>").replace('#', '%23').replace('<', '%3C').replace('>', '%3E')


class Page:
    """渲染一位交易员的文字档案。正文标记：[[s:来源ID]] → 出处角标，[[t:词条ID|文字]] → 词条按钮。"""

    def __init__(self, P):
        self.P, self.cited = P, set()
        self.lang = P.get('lang', 'ja')  # 原话的语言：ja 用「」，en 用“”
        self.qo, self.qc = ('「', '」') if self.lang == 'ja' else ('“', '”')
        self.num = {k: n for n, k in enumerate(P['sources'], 1)}  # 出处编号 = 资料来源列表里的顺序

    def cite(self, k):
        assert k in self.num, f'unknown source {k}'
        self.cited.add(k)
        t = self.P['sources'][k]
        return f'<sup class="c"><a href="#src-{k}" title="{escape(t[1] + "：" + t[0])}">{self.num[k]}</a></sup>'

    def md(self, s):
        def term(m):
            k, txt = m.group(1), m.group(2)
            assert k in self.P['terms'], f'unknown term {k}'
            return f'<button type="button" class="t" data-t="{k}">{txt}</button>'
        s = re.sub(r'\[\[t:([\w-]+)\|(.+?)\]\]', term, s)
        s = re.sub(r'\[\[s:([\w-]+)\]\]', lambda m: self.cite(m.group(1)), s)
        assert '[[' not in s, s
        return s

    def cites(self, ks):
        return ''.join(self.cite(k) for k in sorted(set(ks), key=self.num.get))

    # ---- section renderers（kind → 方法），新增版块类型时在这里加一个 r_<kind> ----
    def r_brief(self, S):
        return '<ol class="brief">' + ''.join(f'<li>{self.md(x)}</li>' for x in S['items']) + '</ol>'

    def r_chart(self, S):
        src = self.P['sources']
        pts = [list(p) + [src[p[4]][1]] for p in S['points']]
        for p in S['points']: self.cite(p[4])
        self.charts[S['id']] = dict(points=pts, unit=S['unit'], label=S['label'], events=S.get('events', []))
        rows = ''.join(f'<tr><td>{escape(p[0])}</td><td class="num">{fmt_yen(p[2])}</td><td>{escape(p[3])}</td><td>{self.cite(p[4])} {escape(src[p[4]][1])}</td></tr>' for p in S['points'])
        first, last = S['points'][0], S['points'][-1]
        return (f'<div class="chartbox"><h3>{escape(S["label"].split("，")[0])}</h3><p class="sub">{escape(first[0])} 至 {escape(last[0])} · 单位：{S["unit"]} · 对数刻度 · 悬停或点按圆点看出处</p>'
                f'<div class="plot" data-chart="{S["id"]}"><noscript><p class="sub">图表需要 JavaScript，数据见下表。</p></noscript></div>'
                f'<details class="tbl"><summary>查看数据表（{len(pts)} 个时点）</summary><div style="overflow:auto"><table><thead><tr><th>时点</th><th class="num">资产（{S["unit"]}）</th><th>备注</th><th>出处</th></tr></thead><tbody>{rows}</tbody></table></div></details></div>'
                + '<ul class="notes">' + ''.join(f'<li>{self.md(n)}</li>' for n in S.get('notes', [])) + '</ul>')

    def r_timeline(self, S):
        return '<ol class="tl">' + ''.join(
            f'<li><div class="when">{escape(d)}</div><div><b>{escape(t)}{"" if x else self.cites(s)}</b>{"<p>" + self.md(x) + self.cites(s) + "</p>" if x else ""}</div></li>'
            for d, t, x, s in S['items']) + '</ol>'

    def quote(self, q):
        ja, zh, s, when = q
        return (f'<blockquote class="q"><p lang="{self.lang}">{self.qo}{escape(ja)}{self.qc}</p><p class="zh">{escape(zh)}</p>'
                f'<footer>{escape(self.P["sources"][s][1].split("·")[0].strip())} · {escape(when)}{self.cite(s)}</footer></blockquote>')

    def r_methods(self, S):
        cards = ''.join(
            f'<article class="mcard"><span class="tag">{escape(m["k"])}</span><h3>{escape(m["t"])}</h3><p>{self.md(m["body"])}{self.cites(m.get("src", []))}</p>'
            + (self.quote(m['quote']) if m.get('quote') else '') + (f'<p class="note">{self.md(m["note"])}</p>' if m.get('note') else '') + '</article>'
            for m in S['items'])
        return f'<div class="methods">{cards}</div>' + (f'<p class="test">{self.md(S["test"])}</p>' if S.get('test') else '')

    def r_case(self, S):
        steps = ''.join(f'<li><span class="ts">{escape(t)}</span><p>{self.md(x)}</p></li>' for t, x in S['steps'])
        return (f'<div class="case"><ol class="steps">{steps}</ol><div class="side">'
                f'<div class="box"><h3>账怎么算</h3><div class="calc">{S["calc"]}</div><p class="small">{self.md(S["calc_note"])}{self.cites(S.get("calc_src", []))}</p></div>'
                f'<div class="box"><h3>他怎么说</h3><p>{self.md(S["his"])}</p></div>'
                f'<div class="box"><h3>事后</h3><ul>' + ''.join(f'<li>{self.md(a)}</li>' for a in S['after']) + '</ul></div></div></div>')

    def r_quotes(self, S):
        out = []
        for q in S['items']:
            src = self.P['sources'][q['s']]
            kind = '原文' if q.get('ja') else '大意'
            body = (f'<p lang="{self.lang}">{self.qo}{escape(q["ja"])}{self.qc}</p><p class="zh">{escape(q["zh"])}</p>' if q.get('ja') else f'<p class="zh only">“{escape(q["zh"])}”</p>')
            out.append(f'<figure class="quote">{body}<footer><span class="kind">{kind}</span>{escape(src[1])}{" · " + escape(src[2]) if src[2] else ""}{self.cite(q["s"])}</footer></figure>')
        return '<div class="quotes">' + ''.join(out) + '</div>'

    def r_myths(self, S):
        cls = {'不对': 'v-no', '本人否认': 'v-mid', '不完全对': 'v-mid', '有出入': 'v-mid', '过度简化': 'v-mid', '夸大': 'v-mid'}
        return '<div class="myths">' + ''.join(
            f'<div class="myth"><div class="claim">{escape(c)}</div><span class="verdict {cls.get(v, "v-na")}">{escape(v)}</span><p>{self.md(x)}{self.cites(s)}</p></div>'
            for c, v, x, s in S['items']) + '</div>'

    def r_table(self, S):
        # cols = 表头；rows 的每格都可用正文标记；num = 右对齐的列号；hl = 高亮的行号
        num, hl = set(S.get('num', [])), set(S.get('hl', []))
        head = ''.join(f'<th{" class=num" if i in num else ""}>{escape(c)}</th>' for i, c in enumerate(S['cols']))
        rows = ''.join(f'<tr{" class=hl" if r in hl else ""}>' + ''.join(f'<td{" class=num" if i in num else ""}>{self.md(str(c))}</td>' for i, c in enumerate(row)) + '</tr>'
                       for r, row in enumerate(S['rows']))
        cap = f'<h3>{escape(S["caption"])}</h3>' if S.get('caption') else ''
        return (f'<div class="tblbox">{cap}<div style="overflow:auto"><table><thead><tr>{head}</tr></thead><tbody>{rows}</tbody></table></div></div>'
                + ('<ul class="notes">' + ''.join(f'<li>{self.md(n)}</li>' for n in S['notes']) + '</ul>' if S.get('notes') else ''))

    def r_glossary(self, S):
        return '<div class="gloss">' + ''.join(
            f'<div class="gterm" id="g-{k}"><h3>{escape(zh)}<small lang="{self.lang}">{escape(ja)}</small></h3><p>{escape(d)}</p></div>'
            for k, (zh, ja, d) in self.P['terms'].items()) + '</div>'

    def r_sources(self, S):
        unused = set(self.P['sources']) - self.cited
        assert not unused, f'sources never cited: {unused}'
        items = []
        for k, (title, pub, date, url, ty) in self.P['sources'].items():
            ti = f'<a class="ti" href="{escape(url)}" target="_blank" rel="noopener noreferrer">{escape(title)} ↗</a>' if url else f'<span class="ti">{escape(title)}</span>'
            items.append(f'<li id="src-{k}"><span class="n">{self.num[k]}</span><div>{ti}<small><span class="ty">{ty}</span>{escape(pub)}{" · " + escape(date) if date else ""}</small></div></li>')
        return '<ol class="srcs">' + ''.join(items) + '</ol>'

    def render(self):
        P, self.charts = self.P, {}
        # 资料来源放最后渲染，以便检查每条来源都被引用过
        order = [S for S in P['sections'] if S['kind'] != 'sources'] + [S for S in P['sections'] if S['kind'] == 'sources']
        html = {}
        for S in order:
            intro = f'<p class="intro">{self.md(S["intro"])}</p>' if S.get('intro') else ''
            html[S['id']] = (f'<section class="block" id="{S["id"]}"><div class="shead"><h2><small>{S["no"]} · {S["en"]}</small>{escape(S["title"])}</h2></div>'
                             f'{intro}{getattr(self, "r_" + S["kind"])(S)}</section>')
        body = [html[S['id']] for S in P['sections']]
        facts = ''.join(f'<div class="fact"><span>{escape(k)}</span><b>{escape(v)}</b></div>' for k, v in P['facts'])
        fsrc = self.cites(re.findall(r'\[\[s:([\w-]+)\]\]', P.get('facts_src', '')))  # 档案卡出处按编号排序
        mast = (f'<header class="mast"><div><p class="kick">{escape(P["kicker"])}</p><h1>{escape(P["h1"])}<span>{escape(P["h1_sub"])}</span></h1>'
                f'<p class="lede">{self.md(P["lede"])}</p></div><aside class="facts" aria-label="基本资料"><h2>档案卡</h2>{facts}<p class="fsrc">出处{fsrc}</p></aside></header>'
                '<div class="strip" aria-label="关键数字">' + ''.join(f'<div><b>{escape(v)}</b><small>{escape(l)}</small></div>' for v, l in P['strip']) + '</div>'
                f'<p class="warn"><span aria-hidden="true">⚠</span><span>{self.md(P["warn"])}</span></p>')
        # 相邻的出处角标合并成一个：¹²  →  ¹,²
        return re.sub(r'</a></sup><sup class="c">', '</a>,', mast + ''.join(body))


def fmt_yen(v):
    if v >= 1e8:
        n = v / 1e8
        return f'{n:,.2f}'.rstrip('0').rstrip('.') + ' 亿'
    return f'{v / 1e4:,.0f} 万'


def build_profile(T):
    P = importlib.import_module(f'traders.{T["slug"]}').P
    assert P['slug'] == T['slug']
    n_src = len(P['sources'])
    P = json.loads(json.dumps(P).replace('{sources}', str(n_src)))  # 文案里的 {sources} = 出处条数
    pg = Page(P)
    body = pg.render()
    toc = ''.join(f'<a href="#{S["id"]}"><i>{S["no"]}</i>{escape(S["title"].split("：")[0])}</a>' for S in P['sections'])
    others = ''.join(f'<a href="../{t["slug"]}/">{escape(t["name"])} · {escape(t["market"])}</a>' for t in TRADERS if t['slug'] != T['slug'])
    body += f'<aside class="more"><p>本系列的其他交易员</p><nav>{others}<a href="../">系列首页 →</a></nav></aside>'
    accent = f'--ac:{T["accent"]}' + ''.join(f';--ac-{k}:{T[k]}' for k in ('mark', 'bg', 'line') if T.get(k))
    rep = {'__TITLE__': escape(P['title']), '__SITE__': SITE, '__DESC__': escape(P['description']), '__ICON__': ICON(T['accent'], T['mono']),
           '__BASECSS__': read('base.css'), '__SERIESCSS__': SERIES_CSS, '__ACCENT__': accent, '__SERIES__': rail_series(T['slug']),
           '__MONO__': escape(T['mono']), '__NAME__': escape(T['name']), '__RAILSUB__': escape(P['h1_sub']), '__TOC__': toc,
           '__RAILNOTE__': f'<b>资料</b>：{escape(T["source"])}<br><b>出处</b>：{n_src} 条，文中角标可跳转<br><b>核查</b>：{T["updated"]}<br>独立整理，与本人无关联',
           '__BODY__': body,
           '__FOOTER__': f'{escape(P["title"])} · {SITE}系列。独立资料整理，与 {escape(T["name"])} 本人无任何关联；引用的报道与文件版权归原作者和媒体所有，{"日文" if pg.lang == "ja" else "英文"}原话仅作短篇引用。数字多为本人在采访中的自述，不构成投资建议。',
           '__LANG__': json.dumps(pg.lang), '__TERMS__': json.dumps(P['terms'], ensure_ascii=False, separators=(',', ':')),
           '__CHART__': json.dumps(pg.charts, ensure_ascii=False, separators=(',', ':')), '__JS__': read('profile.js')}
    t = read('profile.html')
    for k, v in rep.items():
        assert k in t, k
        t = t.replace(k, v)
    os.makedirs(f'{ROOT}/{T["slug"]}', exist_ok=True)
    open(f'{ROOT}/{T["slug"]}/index.html', 'w', encoding='utf-8').write(t)
    print('ok', T['slug'], len(t) // 1024, 'KB,', n_src, 'sources,', len(P['sections']), 'sections')
    return n_src


def build_hub(counts):
    cards = []
    for T in TRADERS:
        stats = ''.join(f'<div><b>{escape(v.replace("{sources}", str(counts.get(T["slug"], ""))))}</b><small>{escape(l)}</small></div>' for v, l in T['stats'])
        media = ''.join(f'<span>{escape(m)}</span>' for m in T['media'])
        cards.append(
            f'<a class="tcard" href="{T["slug"]}/" style="--ac:{T["accent"]}"><div class="tc-top"><i>{escape(T["mono"])}</i><span class="tc-flag">{escape(T["region"])} · {escape(T["era"])}</span></div>'
            f'<h3>{escape(T["name"])}<small>{escape(T["zh"])}</small></h3><p class="tc-line">{escape(T["tagline"])}</p>'
            f'<dl><div><dt>市场</dt><dd>{escape(T["market"])}</dd></div><div><dt>风格</dt><dd>{escape(T["style"])}</dd></div></dl>'
            f'<div class="tc-stats">{stats}</div><div class="tc-media">{media}</div><span class="tc-go">进入档案 →</span></a>')
    cards.append(f'<div class="tcard soon"><div class="tc-top"><i>+</i></div><h3>{UPCOMING}</h3><p class="tc-line">每位交易员一份档案：生平、业绩口径、方法、原话与出处。资料以本人公开发言和可查证文件为准。</p></div>')
    rows = [('地区', 'region'), ('市场', 'market'), ('风格', 'style'), ('典型持仓', 'hold'), ('公开时期', 'era'), ('起步资金', 'start'), ('代表数字', 'peak'), ('主要资料', 'source')]
    head = ''.join(f'<th scope="col"><a href="{T["slug"]}/">{escape(T["name"])}</a></th>' for T in TRADERS)
    body = ''.join(f'<tr><th scope="row">{l}</th>' + ''.join(f'<td>{escape(T[k])}</td>' for T in TRADERS) + '</tr>' for l, k in rows)
    rep = {'__SITE__': SITE, '__SITE_EN__': SITE_EN, '__BASECSS__': read('base.css'), '__CARDS__': ''.join(cards), '__N__': str(len(TRADERS)),
           '__CMPHEAD__': head, '__CMPBODY__': body, '__ICON__': ICON('#e8eaed', '神'),
           '__NAMES__': '、'.join(t['name'] for t in TRADERS)}
    t = read('hub.html')
    for k, v in rep.items():
        assert k in t, k
        t = t.replace(k, v)
    open(f'{ROOT}/index.html', 'w', encoding='utf-8').write(t)
    print('ok hub', len(t) // 1024, 'KB,', len(TRADERS), 'traders')


if __name__ == '__main__':
    os.chdir(os.path.dirname(os.path.abspath(__file__)))
    counts = {T['slug']: build_profile(T) for T in TRADERS if T['kind'] == 'profile'}
    for T in TRADERS:
        if T['kind'] == 'archive':
            assert os.path.exists(f'{ROOT}/{T["slug"]}/index.html'), f'{T["slug"]}: run its own generator first'
    build_hub(counts)
