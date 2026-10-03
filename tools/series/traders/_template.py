"""新交易员文字档案的骨架：复制为 traders/<slug>.py，填好后在 series.py 的 TRADERS 里登记同名 slug（kind='profile'）。
不需要的版块直接从 sections 里删掉；版块顺序就是页面顺序，侧栏目录自动生成。

正文标记（brief/notes/body/intro/lede/warn 等文字字段都可用）：
  [[s:来源ID]]          出处角标，来源必须在 sources 里；相邻角标自动合并成 ¹,²
  [[t:词条ID|显示文字]]  可点开的词条，词条必须在 terms 里
  也可以直接写 <b>…</b>。
build.py 会检查：引用了不存在的来源/词条、sources 里有从未被引用的条目，都会直接报错。
文案里写 {sources} 会被替换成出处条数。
lang = 原话的语言：'ja'（默认，用「」）或 'en'（用“”）；quotes/methods 里的原文仍写在 ja 字段。
"""

P = dict(
    slug='slug',                       # 与文件名、series.py 里的 slug 一致，也是输出目录名
    lang='ja',                         # 原话语言：ja / en
    title='某某 资料汇编',               # <title>
    description='一句话页面说明（搜索引擎摘要），可用 {sources}。',
    kicker='REGION · 年代 · 身份',
    h1='名字', h1_sub='副标题',
    lede='导语，两三句话说清楚他是谁、为什么值得看。[[s:example]]',
    facts=[('网名', '…'), ('出生', '…'), ('市场', '…'), ('风格', '…')],   # 右上档案卡
    facts_src='[[s:example]]',
    strip=[('数字', '说明'), ('数字', '说明'), ('数字', '说明'), ('数字', '说明'), ('数字', '说明')],  # 5 格关键数字
    warn='<b>口径提醒</b>：哪些数字是自述、哪些可核对。',
    sections=[
        dict(id='brief', kind='brief', no='01', en='AT A GLANCE', title='一页看懂', items=['<b>要点</b>：……[[s:example]]']),
        # 单序列对数曲线；points = (标签, 横轴年份小数, 数值, 备注, 来源ID)
        dict(id='assets', kind='chart', no='02', en='ASSET CURVE', title='资产曲线', intro='口径说明。', unit='美元',
             label='图表标题，副标题说明', events=[(2008.7, '某事件')],
             points=[('2001 年末', 2001.99, 1e6, '', 'example'), ('2002 年末', 2002.99, 1e7, '', 'example')], notes=['读图要点。']),
        # (日期, 标题, 正文, [来源ID…])
        dict(id='life', kind='timeline', no='03', en='TIMELINE', title='生平时间线', items=[('2001', '标题', '正文', ['example'])]),
        # quote = (原文, 中文, 来源ID, 日期)；note 可选
        dict(id='method', kind='methods', no='04', en='METHOD', title='交易方法', intro='', items=[
            dict(t='方法名', k='标签', body='说明', quote=('原文', '中文', 'example', '2001-01-01'), note='', src=['example'])],
             test='<b>能不能复制？</b>可选的复现/回测说明。'),
        # 案例拆解：steps = (时间, 文字)；calc 为 HTML
        dict(id='case', kind='case', no='05', en='CASE STUDY', title='代表战役', intro='', steps=[('09:30', '…')],
             calc='算式<br><span class="big">结果</span>', calc_note='算式说明', calc_src=['example'], his='本人说法', after=['后续']),
        # 通用表格：每格可用正文标记；num = 右对齐列号，hl = 高亮行号，caption / notes 可选
        dict(id='record', kind='table', no='05', en='TRACK RECORD', title='业绩口径', intro='', caption='', cols=['数字', '口径', '出处'], num=[], hl=[0],
             rows=[('数字', '说明', '[[s:example]]')], notes=['']),
        # ja 留空 = 只有中文大意
        dict(id='quotes', kind='quotes', no='06', en='IN HIS WORDS', title='语录', items=[dict(ja='', zh='中文', s='example')]),
        # (流传说法, 判定, 解释, [来源ID…])；判定可用：不对 / 本人否认 / 不完全对 / 有出入 / 过度简化 / 夸大 / 其他（灰色）
        dict(id='myths', kind='myths', no='07', en='FACT CHECK', title='说法辨析', items=[('说法', '不对', '解释', ['example'])]),
        dict(id='glossary', kind='glossary', no='08', en='GLOSSARY', title='用语'),
        dict(id='sources', kind='sources', no='09', en='SOURCES', title='资料来源', intro='类型说明。'),
    ],
    terms={'example': ('中文名', '原文写法', '释义')},
    # id: (标题, 媒体, 日期或 None, 链接或 None, 类型：原文 / 转引 / 二次)
    sources={'example': ('标题', '媒体', '2001-01-01', None, '原文')},
)
