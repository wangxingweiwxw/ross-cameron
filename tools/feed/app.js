const $=s=>document.querySelector(s),$$=s=>[...document.querySelectorAll(s)];
const esc=s=>String(s).replace(/[&<>"]/g,c=>({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;'}[c]));
const WEEK='日一二三四五六';
const day=d=>new Date(d+'T12:00:00');
const ts=s=>`${Math.floor(s/60)}:${String(Math.floor(s%60)).padStart(2,'0')}`;
const money=v=>v===0?'$0':(v>0?'+':'−')+'$'+Math.abs(v).toLocaleString('en-US');
const tone=v=>v>0?'up':v<0?'dn':'flat';
const img=(i,k)=>`frames/${i.id}-${k}.jpg`;
const kfmt=v=>{if(v===0)return '0';const a=Math.abs(v),k=a/1000;return (v>0?'+':'−')+(a<1000?a:(k>=9.95?Math.round(k):k.toFixed(1))+'K');};

// ---- term marking: one combined pattern, longest first; English words may take a plural/tense suffix ----
const TERM=Object.fromEntries(TERMS.map(t=>[t.id,t]));
const PAT=[];TERMS.forEach(t=>t.p.forEach(p=>PAT.push([p,t.id])));PAT.sort((a,b)=>b[0].length-a[0].length);
const LOOK=new Map(PAT.map(([p,id])=>[p.toLowerCase(),id]));
const RX=new RegExp('(\\$[A-Z]{2,5}\\b)|('+PAT.map(([p])=>{const e=p.replace(/[.*+?^${}()|[\]\\]/g,'\\$&');return /^[a-z]/i.test(p)?`\\b${e}(?:s|es|ed|ing)?\\b`:e;}).join('|')+')','gi');
const lookup=m=>{m=m.toLowerCase();return LOOK.get(m)||LOOK.get(m.replace(/(ing|ed|es|s)$/,''))||LOOK.get(m.replace(/(s)$/,''));};
function mark(text){return esc(text).replace(RX,(m,tk)=>{if(tk)return `<button type="button" class="t tk" data-term="${tk}">${tk}</button>`;const id=lookup(m);return id?`<button type="button" class="t c-${TERM[id].cat}" data-term="${id}">${m}</button>`:m;});}
function termsIn(s,hit){s.replace(RX,(m,tk)=>{const id=tk||lookup(m);if(id)hit.add(id);return m;});return hit;}

// ---- data ----
const REC=FEED.filter(i=>i.kind==='video'),SHO=FEED.filter(i=>i.kind==='short'),BY=Object.fromEntries(FEED.map(i=>[i.id,i]));
FEED.forEach(i=>{const zh=[i.zt,i.ze,i.sum,...(i.pts||[]),...(i.ch||[]).map(c=>c[1]),i.pnl||''].join('\n');i.txt=TX[i.id].map(p=>p.slice(1).join('\n')).join('\n');
 i.terms=termsIn(i.txt,termsIn(zh+'\n'+i.title+'\n'+i.en,new Set()));(i.tk||[]).forEach(t=>i.terms.add(t));
 i.hay=(zh+' '+i.title+' '+(i.tk||[]).join(' ')).toLowerCase();i.hayTx=i.txt.toLowerCase();
 i.sub=i.kind==='short'?'short':i.topic==='watch'?'watch':'recap';});
const TICKERS=[...new Set(FEED.flatMap(i=>[...i.terms].filter(t=>t[0]==='$')))].sort();
const label=i=>i.kind==='short'?'心得短片':i.sub==='watch'?'周末观察清单':i.topic==='result'?'小账户挑战课':'每日复盘';
const pnlChip=i=>i.pv!=null?`<span class="chip ${tone(i.pv)}">${money(i.pv)}</span>`:i.ps!=null?`<span class="chip ${tone(i.ps)}">小 ${money(i.ps)}</span>`:i.sub==='watch'?'<span class="chip flat">清单</span>':'';

// ---- masthead ----
$('#s-rec').textContent=REC.length;$('#s-sh').textContent=SHO.length;$('#s-img').textContent=FEED.reduce((n,i)=>n+i.fr.length,0);
$('#n-rec').textContent=REC.length;$('#n-sh').textContent=SHO.length;$('#n-terms').textContent=TERMS.length;
$('#tape').innerHTML=REC.filter(i=>i.pv!=null||i.ps!=null).slice(0,7).map(i=>{const v=i.pv??i.ps;return `<button type="button" data-open="${i.id}"><b class="d">${i.date.slice(5).replace('-','.')}</b><span>${esc(i.zt)}</span><b class="v ${tone(v)}">${i.pv==null?'小 ':''}${money(v)}</b></button>`;}).join('');

// ---- P&L calendar ----
(function(){const byDate={};REC.forEach(i=>(byDate[i.date]=byDate[i.date]||[]).push(i));
 const start=day('2026-08-24'),last=REC.map(i=>i.date).sort().at(-1),iso=d=>d.toISOString().slice(0,10);
 let h='<span class="hd">周一</span><span class="hd">周二</span><span class="hd">周三</span><span class="hd">周四</span><span class="hd">周五</span><span class="hd we">周末</span>',g=0,r=0,z=0,sm=0,net=0;
 for(let w=new Date(start);iso(w)<=last;w.setDate(w.getDate()+7)){
  for(let k=0;k<5;k++){const d=new Date(w);d.setDate(d.getDate()+k);const ds=iso(d),its=(byDate[ds]||[]).filter(i=>i.sub!=='watch');const md=ds.slice(5).replace('-','.');
   if(!its.length){h+=`<div class="cc empty ${ds==='2026-09-07'?'off':''}"><span class="dt">${md}</span><span class="tag">${ds==='2026-09-07'?'劳动节休市':ds>last?'':'—'}</span></div>`;continue;}
   const i=its.find(x=>x.pv!=null)||its.find(x=>x.ps!=null)||its[0],v=i.pv??i.ps;
   if(i.pv!=null){net+=i.pv;i.pv>0?g++:i.pv<0?r++:z++;}else if(i.ps!=null)sm++;
   const a=v==null?0:Math.min(.5,.1+Math.abs(v)/50000*.4);
   h+=`<button type="button" class="cc ${v>0?'g':v<0?'r':''}" style="--a:${a}" data-open="${i.id}" title="${esc(i.zt)}"><span class="dt">${md}</span>${its.length>1?`<span class="n2">${its.length} 期</span>`:''}<span class="amt ${tone(v)}">${v==null?'—':`<span class="f">${i.pv==null?'小 ':''}${money(v)}</span><span class="k">${i.pv==null?'小':''}${kfmt(v)}</span>`}</span><span class="tag">${i.pv==null&&i.ps!=null?'小账户挑战':i.ps!=null&&i.pv!=null?`小账户 ${money(i.ps)}`:esc(i.zt)}</span></button>`;}
  const we=[6,7].map(k=>{const d=new Date(w);d.setDate(d.getDate()+k-1);return iso(d);}).flatMap(ds=>(byDate[ds]||[]).filter(i=>i.sub==='watch'));
  h+=we.length?`<button type="button" class="cc we" data-open="${we[0].id}" title="${esc(we[0].zt)}"><span class="dt">${we[0].date.slice(5).replace('-','.')}</span><span class="amt flat">清单</span><span class="tag">周末观察清单</span></button>`:'<div class="cc empty we"><span class="dt">—</span></div>';}
 $('#cal').innerHTML=h;
 $('#calsum').innerHTML=`<span>主账户绿日 <b class="up">${g}</b></span><span>红日 <b class="dn">${r}</b></span><span>零交易 / 打平 <b>${z}</b></span><span>只报小账户 <b>${sm}</b></span><span>主账户自报合计 <b class="${tone(net)}">${money(net)}</b></span>`;})();

// ---- recap archive ----
const st={k:'all',q:'',term:null};
function recList(){const q=st.q;return REC.filter(i=>(st.k==='all'||(st.k==='green'?(i.pv??i.ps)>0:st.k==='red'?(i.pv??i.ps)<0:i.sub===st.k))&&(!st.term||i.terms.has(st.term))&&(!q||i.hay.includes(q)||i.hayTx.includes(q)));}
function hits(i){if(!st.q||i.hay.includes(st.q))return 0;let n=0,p=0;while((p=i.hayTx.indexOf(st.q,p))>-1){n++;p+=st.q.length;}return n;}
function card(i){const d=day(i.date),n=hits(i);return `<a class="card" href="#v/${i.id}"><div class="pic"><img loading="lazy" src="${img(i,0)}" alt=""><span class="kind">${label(i)}</span>${pnlChip(i)}</div><div class="body"><span class="when">${i.date} · 周${WEEK[d.getDay()]} · ${ts(i.len)}</span><h3>${esc(i.zt)}</h3><p>${esc(i.sum)}</p>${n?`<span class="hit">字幕命中 ${n} 处</span>`:''}<div class="tks">${(i.tk||[]).slice(0,6).map(t=>`<span>${t}</span>`).join('')}</div></div></a>`;}
function renderRec(){const L=recList();$('#cards').innerHTML=L.map(card).join('')||'<p class="empty-note">没有符合条件的复盘。换个关键词，或清除筛选。</p>';
 $('#count').textContent=`${L.length} / ${REC.length} 期`;const p=$('#pill');p.classList.toggle('on',!!st.term);if(st.term)p.firstElementChild.textContent='词条：'+(st.term[0]==='$'?st.term:TERM[st.term].zh);}
$$('#archive .seg button').forEach(b=>b.addEventListener('click',()=>{st.k=b.dataset.k;$$('#archive .seg button').forEach(x=>x.setAttribute('aria-pressed',x===b));renderRec();}));
let qt;$('#q').addEventListener('input',e=>{clearTimeout(qt);qt=setTimeout(()=>{st.q=e.target.value.trim().toLowerCase();renderRec();},160);});
$('#pill button').addEventListener('click',()=>{st.term=null;renderRec();});
function filterTerm(id){st.term=id;renderRec();closeTerm();closeViewer();$('#archive').scrollIntoView();}

// ---- shorts ----
let sTopic='all';
const sTopics=[...new Set(SHO.map(i=>i.topic))];
$('#stopics').innerHTML=`<button type="button" data-t="all" aria-pressed="true">全部</button>`+sTopics.map(t=>`<button type="button" data-t="${t}" aria-pressed="false">${TOPICS[t]}</button>`).join('');
function sList(){return SHO.filter(i=>sTopic==='all'||i.topic===sTopic);}
function renderShorts(){const L=sList();$('#scards').innerHTML=L.map(i=>`<a class="scard" href="#v/${i.id}"><img loading="lazy" src="${img(i,0)}" alt=""><span class="cap"><small>${i.date.slice(5).replace('-','.')} · ${TOPICS[i.topic]}</small><b>${esc(i.zt)}</b></span></a>`).join('');$('#scount').textContent=`${L.length} 条`;}
$$('#stopics button').forEach(b=>b.addEventListener('click',()=>{sTopic=b.dataset.t;$$('#stopics button').forEach(x=>x.setAttribute('aria-pressed',x===b));renderShorts();}));

// ---- glossary ----
const count=id=>FEED.filter(i=>i.terms.has(id)).length;
$('#gloss').innerHTML=Object.entries(CAT).map(([c,n])=>`<div class="gcol"><h3>${n}</h3>${TERMS.filter(t=>t.cat===c).map(t=>`<button type="button" data-term="${t.id}"><b>${t.zh}<small>${t.en}</small></b><i>${count(t.id)} 条</i></button>`).join('')}</div>`).join('');
$('#tickers').innerHTML=TICKERS.map(t=>`<button type="button" data-term="${t}">${t}<i>${count(t)}</i></button>`).join('');

// ---- term panel ----
const panel=$('#term');
function openTerm(id){const rel=FEED.filter(i=>i.terms.has(id));let h;
 if(id[0]==='$')h=`<div class="k">TICKER · 股票代码</div><h3 id="term-title">${id}</h3><p>在收录的复盘和短片里出现 <b>${rel.length}</b> 次。代码按字幕和画面校正，自动转写可能有误；本站不提供行情或个股观点，提及不代表推荐。</p>`;
 else{const t=TERM[id];h=`<div class="k">${CAT[t.cat]} · ${t.en.toUpperCase()}</div><h3 id="term-title">${t.zh}<small>${t.en}</small></h3><p>${mark(t.d).replace(new RegExp(`<button[^>]*data-term="${id}"[^>]*>(.*?)</button>`,'g'),'$1')}</p><div class="src">释义依据：${t.s.map(k=>`<a href="${SRC[k][1]}" ${SRC[k][1][0]==='#'?'':'target="_blank" rel="noopener noreferrer"'}>${SRC[k][0]}${SRC[k][1][0]==='#'?'':' ↗'}</a>`).join('、')}</div>`;}
 const nr=rel.filter(i=>i.kind==='video').length;
 h+=rel.length?`${nr?`<p><button type="button" class="ghost" data-filter="${id}">在复盘档案中只看这 ${nr} 期 →</button></p>`:''}<ul>${rel.slice(0,10).map(i=>`<li><button type="button" data-open="${i.id}"><small>${i.date.slice(5)}</small>${esc(i.zt)}</button></li>`).join('')}</ul>`:'<p class="src">收录内容中暂未直接出现该词，释义供对照理解。</p>';
 $('#term-body').innerHTML=h;panel.classList.add('on');$('#term-x').focus();}
function closeTerm(){panel.classList.remove('on');}
$('#term-x').addEventListener('click',closeTerm);

// ---- viewer ----
const V=$('#viewer');let cur=null,ctx=[],frame=0,back=null,query='';
function paraAt(i,sec){const P=TX[i.id];let k=0;P.forEach((p,j)=>{if(p[0]<=sec)k=j;});return k;}
function setFrame(k){frame=k;const i=cur,f=i.fr[k];$('#v-img').src=img(i,f[0]);$('#v-img').alt=f[1]==null?'视频封面':`视频约 ${ts(f[1])} 处的画面`;
 $$('#v-thumbs button').forEach((b,j)=>b.setAttribute('aria-pressed',j===k));
 if(f[1]==null){$('#v-cap').innerHTML=`<div class="row"><b>封面 · 视频缩略图</b></div><p>其余${i.fr.length-1>1?' '+(i.fr.length-1)+' ':''}张截图取自视频约 ${i.kind==='short'?'一半':'25% / 50% / 75%'} 处（${i.fr.slice(1).map(f=>'约 '+ts(f[1])).join('、')}）。点缩略图，可以看到那一刻前后他说了什么，并跳到字幕全文的对应位置。</p>`;return;}
 const P=TX[i.id],j=paraAt(i,f[1]);
 $('#v-cap').innerHTML=`<div class="row"><b>约 ${ts(f[1])} · 画面前后他在说</b><button type="button" class="ghost" data-jump="${f[1]}" data-keep="1">在字幕中定位 →</button></div>${P[j][2]?`<p>${mark(P[j][2])}</p><p class="en" lang="en">${mark(P[j][1])}</p>`:`<p lang="en">${mark(P[j][1])}</p>`}<p class="note">截图时间按视频长度估算（约 ${Math.round(f[1]/i.len*100)}% 处），可能与字幕相差数秒。</p>`;}
// 字幕全文：每段 [开始秒, 英文, 中文译文]；txMode = both | zh | en
let txMode='both';try{txMode=localStorage.getItem('rc-txmode')||'both';}catch(e){}
function renderTx(){const i=cur,P=TX[i.id],q=query.toLowerCase();let n=0;
 const re=q&&new RegExp(esc(q).replace(/[.*+?^${}()|[\]\\]/g,'\\$&'),'gi'),body=t=>re?esc(t).replace(re,m=>{n++;return `<mark>${m}</mark>`;}):mark(t);
 $$('#txmode button').forEach(b=>b.setAttribute('aria-pressed',b.dataset.txm===txMode));$('#tx').className='m-'+txMode;
 $('#tx').innerHTML=P.map(([s,e,z],j)=>`<div class="para" data-s="${s}"><div class="pt"><button type="button" data-seek="${s}">${ts(s)}</button>${z?`<button type="button" class="pp" data-play="${j}" aria-label="从这段播放中文配音">▶ 听</button>`:''}</div><div>${z&&txMode!=='en'?`<p class="zh">${body(z)}</p>`:''}${!z||txMode!=='zh'?`<p class="en" lang="en">${body(e)}</p>`:''}</div></div>`).join('');
 $('#tcount').textContent=q?`${n} 处`:`${P.length} 段`;markSay(false);if(q){const m=$('#tx mark');m&&m.scrollIntoView({block:'center'});}}
$$('#txmode button').forEach(b=>b.addEventListener('click',()=>{txMode=b.dataset.txm;try{localStorage.setItem('rc-txmode',txMode);}catch(e){}const el=$('#tx .para.cur'),s=el&&el.dataset.s;renderTx();if(s){const p=$(`#tx .para[data-s="${s}"]`);p&&p.classList.add('cur');}}));
function tab(name){$$('#v-tabs button').forEach(b=>b.setAttribute('aria-selected',b.dataset.tab===name));$('#p-sum').hidden=name!=='sum';$('#p-tx').hidden=name!=='tx';}
function jump(sec,keep){tab('tx');if(query){query='';$('#tq').value='';renderTx();}const j=paraAt(cur,sec),el=$$('#tx .para')[j];if(PL.on&&PL.id===cur.id)plPlay(j);$$('#tx .para.cur').forEach(p=>p.classList.remove('cur'));if(el){el.classList.add('cur');el.scrollIntoView({block:'center'});}
 if(keep)return;let best=-1,bd=60;cur.fr.forEach((x,k)=>{if(x[1]!=null&&Math.abs(x[1]-sec)<bd){bd=Math.abs(x[1]-sec);best=k;}});if(best>-1&&best!==frame)setFrame(best);}
function openViewer(id,list){const i=BY[id];if(!i)return;if(!V.classList.contains('on'))back=document.activeElement;const was=PL.on;if(PL.id&&PL.id!==id)plStop();cur=i;
 ctx=list&&list.includes(id)?list:(i.kind==='short'?sList():recList()).map(x=>x.id);if(!ctx.includes(id))ctx=(i.kind==='short'?SHO:REC).map(x=>x.id);
 const d=day(i.date),v=i.pv??i.ps;
 $('#v-meta').innerHTML=`<span>${i.date} · 周${WEEK[d.getDay()]}</span><span>${label(i)}</span><span>时长 ${ts(i.len)}</span><span>▶ ${i.views.toLocaleString('en-US')} 次播放</span>${v!=null?`<span class="v ${tone(v)}">${i.pv==null?'小账户 ':''}${money(v)}</span>`:''}${AU[id]?`<span>中文配音 ${ts(AU[id].dur)}</span>`:''}<span>${ctx.indexOf(id)+1} / ${ctx.length}</span>`;
 $('#v-title').innerHTML=`${esc(i.zt)}<small lang="en">${esc(i.title)}</small>`;
 const tall=i.kind==='short';$('#v-stage').classList.toggle('tall',tall);$('#v-thumbs').className='thumbs'+(tall?' two':'');
 $('#v-thumbs').innerHTML=i.fr.map((f,k)=>`<button type="button" data-frame="${k}" aria-label="${f[1]==null?'封面':'约 '+ts(f[1])}"><img src="${img(i,f[0])}" alt=""><span>${f[1]==null?'封面':'约 '+ts(f[1])}</span></button>`).join('');
 const P=TX[i.id];$('#v-tabs').innerHTML=`<button type="button" role="tab" data-tab="sum">${i.kind==='short'?'摘要与说明':'摘要 · 要点 · 章节'}</button><button type="button" role="tab" data-tab="tx">字幕全文 · 中英<i>${P.length} 段</i></button>`;
 let s='';
 if(i.kind==='short'){s=`<h4>摘要 · 依据字幕</h4><p class="lead">${mark(i.sum)}</p><h4>视频说明</h4><div class="bi2">${i.ze?`<div><small>中文译文</small>${mark(i.ze)}</div>`:''}${i.en?`<div lang="en"><small>ENGLISH</small>${mark(i.en)}</div>`:'<div><small>说明</small>这条短片没有文字说明。</div>'}</div><h4>主题</h4><p><button type="button" class="ghost" data-stopic="${i.topic}">#${TOPICS[i.topic]} · 看同主题短片</button></p>`;}
 else{s=`${i.pnl?`<h4>当日盈亏 · 他自报</h4><p class="lead mono ${tone(v??0)}">${esc(i.pnl)}</p>`:''}<h4>摘要</h4><p class="lead">${mark(i.sum)}</p><h4>要点</h4><ol class="pts">${i.pts.map(p=>`<li>${mark(p)}</li>`).join('')}</ol><h4>章节 · 点击跳到字幕</h4><div class="chs">${i.ch.map(([t,c])=>`<button type="button" data-jump="${t}"><span class="ts">${ts(t)}</span><span>${mark(c).replace(/<button[^>]*>(.*?)<\/button>/g,'$1')}</span><i>字幕 →</i></button>`).join('')}</div>${i.tk.length?`<h4>涉及代码</h4><div class="tickers" style="margin:0">${i.tk.map(t=>`<button type="button" data-term="${t}">${t}</button>`).join('')}</div>`:''}`;}
 $('#p-sum').innerHTML=s+`<p class="srcnote">摘要由本站依据 TranscriptAPI 取得的英文字幕整理；金额、代码以他在视频中的口述为准，未经券商记录核对。</p>`;
 query='';$('#tq').value='';renderTx();tab('sum');setFrame(i.fr.length>1&&i.kind==='short'?1:0);$('#p-sum').scrollTop=0;$('#p-tx').scrollTop=0;$('.vbody').scrollTop=0;
 V.classList.add('on');document.body.style.overflow='hidden';closeTerm();$('#v-close').focus();plUI();if(was&&PL.id!==id)plPlay();}
// ---- 中文配音：audio/<id>.mp3 由 tts.py 生成，AU[id].at = 每段在音频里的起点秒数（未翻译的段为 null）。
// 没有音频（新条目还没跑 tts.py，或 audio/ 目录没跟着页面一起拷走）时，改用浏览器自带的中文朗读。
const AE=$('#pl-audio'),SS=window.speechSynthesis,PL={id:null,k:-1,on:false,tts:false,tok:0};
let plRate=1,plChain=false,userScroll=0;try{plRate=+localStorage.getItem('rc-rate')||1;plChain=localStorage.getItem('rc-chain')==='1';}catch(e){}
$('#pl-rate').value=String(plRate);$('#pl-chain').checked=plChain;
const zhAt=(i,j,d=1)=>{const P=TX[i.id];for(;j>=0&&j<P.length;j+=d)if(P[j][2])return j;return -1;};
const ICON={play:'<svg width="13" height="13" viewBox="0 0 24 24" fill="currentColor" aria-hidden="true"><path d="M7 4v16l13-8z"/></svg>',pause:'<svg width="13" height="13" viewBox="0 0 24 24" fill="currentColor" aria-hidden="true"><path d="M6 4h4v16H6zM14 4h4v16h-4z"/></svg>'};
function plUI(){const i=cur;if(!i)return;const has=TX[i.id].some(p=>p[2]);$('#player').hidden=!has;if(!has)return;
 const mine=PL.id===i.id,a=AU[i.id],n=TX[i.id].filter(p=>p[2]).length,k=mine?PL.k:-1;
 $('#pl-btn').innerHTML=PL.on&&mine?ICON.pause+'<span>暂停</span>':ICON.play+`<span>${mine&&k>-1?'继续播放':'一键播放中文配音'}</span>`;
 $('#pl-btn').setAttribute('aria-label',PL.on&&mine?'暂停中文配音':'播放中文配音');
 const nth=k>-1?TX[i.id].slice(0,k+1).filter(p=>p[2]).length:0;
 $('#pl-now').textContent=k>-1?`第 ${nth} / ${n} 段 · 原视频 ${ts(TX[i.id][k][0])}`:`${n} 段译文${a&&!(mine&&PL.tts)?'':' · 浏览器朗读'}`;
 if(a&&!(mine&&PL.tts)){const t=mine?AE.currentTime:0;$('#pl-time').textContent=`${ts(t)} / ${ts(a.dur)}`;if(!seeking)$('#pl-seek').value=Math.round(t/a.dur*1000);}
 else{$('#pl-time').textContent='';if(!seeking)$('#pl-seek').value=Math.round(nth/n*1000);}}
// 当前朗读的段落：高亮、跟随滚动（手动滚动后 6 秒内不跟随），左侧换成时间最接近的截图
function markSay(scroll){$$('#tx .para.say').forEach(p=>p.classList.remove('say'));if(!cur||PL.id!==cur.id||PL.k<0)return;const el=$$('#tx .para')[PL.k];if(!el)return;el.classList.add('say');
 if(scroll&&!$('#p-tx').hidden&&Date.now()-userScroll>6000)el.scrollIntoView({block:'center',behavior:'smooth'});}
function setK(k){if(k===PL.k)return;PL.k=k;markSay(true);const s=TX[cur.id][k][0];let best=0;cur.fr.forEach((f,j)=>{if(f[1]!=null&&f[1]<=s+5)best=j;});if(best!==frame)setFrame(best);}
['wheel','touchmove','keydown'].forEach(ev=>{$('#p-tx').addEventListener(ev,()=>userScroll=Date.now(),{passive:true});$('.vbody').addEventListener(ev,()=>userScroll=Date.now(),{passive:true});});
// plPlay()：继续 / 从头播放；plPlay(k)：从第 k 段（没有译文就往后找）开始；t：音频里的精确秒数（拖进度条用）
let pendT=null;const setT=t=>{if(AE.readyState>=1)AE.currentTime=t;else pendT=t;};
AE.addEventListener('loadedmetadata',()=>{if(pendT!=null){AE.currentTime=pendT;pendT=null;}});
function plPlay(k,t){const i=cur;if(!i)return;if(PL.id!==i.id){plStop();PL.id=i.id;PL.tts=!AU[i.id];}
 const fresh=k==null&&PL.k<0;if(k==null)k=PL.k>-1?PL.k:zhAt(i,0);else k=zhAt(i,k)>-1?zhAt(i,k):zhAt(i,k,-1);if(k<0)return;
 if($('#p-tx').hidden){tab('tx');userScroll=0;}
 PL.on=true;setK(k);
 if(PL.tts)say(k);
 else{const a=AU[i.id],src=`audio/${i.id}.mp3?v=${a.h}`;if(AE.getAttribute('src')!==src)AE.src=src;
  if(t!=null)setT(t);else if(fresh||arguments.length)setT(a.at[k]);
  AE.playbackRate=plRate;AE.play().catch(()=>{PL.on=false;plUI();});}
 media();plUI();}
function plPause(){if(!PL.on)return;PL.on=false;if(PL.tts){PL.tok++;SS&&SS.cancel();}else AE.pause();plUI();}
function plStop(){PL.on=false;PL.tok++;SS&&SS.cancel();AE.pause();AE.removeAttribute('src');AE.load();PL.id=null;PL.k=-1;markSay(false);}
function plEnd(){PL.on=false;PL.k=-1;markSay(false);plUI();
 if(plChain){const j=ctx.indexOf(cur.id);if(j>-1&&j<ctx.length-1){step(1);plPlay();}}}
// 浏览器朗读：按句切开（部分浏览器长句会被截断），一句一句排队
let zhVoice=null;const pickVoice=()=>{if(!SS)return;const L=SS.getVoices().filter(v=>/^zh[-_](CN|Hans)/i.test(v.lang)||/^cmn/i.test(v.lang));zhVoice=L.find(v=>/Xiaoxiao|Yunxi|Natural|Online|Google/i.test(v.name))||L[0]||null;};
if(SS){pickVoice();SS.addEventListener&&SS.addEventListener('voiceschanged',pickVoice);}
function say(k){if(!SS){PL.on=false;plUI();$('#pl-now').textContent='这个浏览器不支持朗读，也没有找到配音文件';return;}
 const tok=++PL.tok;SS.cancel();const parts=TX[cur.id][k][2].match(/[^。！？；!?]+[。！？；!?”」]*/g)||[TX[cur.id][k][2]];let left=parts.length;
 parts.forEach(s=>{const u=new SpeechSynthesisUtterance(s);u.lang='zh-CN';if(zhVoice)u.voice=zhVoice;u.rate=plRate;
  u.onend=()=>{if(tok!==PL.tok||--left)return;const n=zhAt(cur,k+1);if(n<0)plEnd();else{setK(n);plUI();say(n);}};
  u.onerror=e=>{if(tok!==PL.tok||/interrupted|canceled/.test(e.error))return;PL.tok++;SS.cancel();PL.on=false;plUI();$('#pl-now').textContent='浏览器朗读失败（可能没有安装中文语音）';};SS.speak(u);});}
AE.addEventListener('timeupdate',()=>{if(PL.tts||!cur||PL.id!==cur.id)return;const a=AU[cur.id],t=AE.currentTime;let k=-1;a.at.forEach((x,j)=>{if(x!=null&&x<=t+.05)k=j;});if(k>-1)setK(k);plUI();});
AE.addEventListener('ended',plEnd);
AE.addEventListener('pause',()=>{if(PL.on&&!PL.tts&&!AE.ended&&!AE.seeking){PL.on=false;plUI();}});
AE.addEventListener('play',()=>{if(!PL.on&&cur&&PL.id===cur.id){PL.on=true;plUI();}});
AE.addEventListener('error',()=>{if(!AE.getAttribute('src')||PL.tts)return;PL.tts=true;const k=PL.k>-1?PL.k:zhAt(cur,0);AE.removeAttribute('src');if(PL.on){setK(k);say(k);}plUI();});
let seeking=false;const seek=$('#pl-seek');
seek.addEventListener('input',()=>{seeking=true;const i=cur,f=seek.value/1000;if(AU[i.id]&&!(PL.id===i.id&&PL.tts))$('#pl-time').textContent=`${ts(f*AU[i.id].dur)} / ${ts(AU[i.id].dur)}`;});
seek.addEventListener('change',()=>{seeking=false;const i=cur,f=seek.value/1000,P=TX[i.id];
 if(AU[i.id]&&!(PL.id===i.id&&PL.tts)){const t=f*AU[i.id].dur;let k=0;AU[i.id].at.forEach((x,j)=>{if(x!=null&&x<=t)k=j;});plPlay(k,t);}
 else{const L=P.map((p,j)=>p[2]?j:-1).filter(j=>j>-1);plPlay(L[Math.min(L.length-1,Math.floor(f*L.length))]);}});
$('#pl-btn').addEventListener('click',()=>PL.on&&PL.id===cur.id?plPause():plPlay());
$('#pl-rate').addEventListener('change',e=>{plRate=+e.target.value;try{localStorage.setItem('rc-rate',plRate);}catch(x){}AE.playbackRate=plRate;if(PL.on&&PL.tts)say(PL.k);});
$('#pl-chain').addEventListener('change',e=>{plChain=e.target.checked;try{localStorage.setItem('rc-chain',plChain?'1':'0');}catch(x){}});
// 列表上的“一键连播”：从当前筛选结果的第一期开始，自动打开连播
function playAll(L){if(!L.length)return;plChain=true;$('#pl-chain').checked=true;try{localStorage.setItem('rc-chain','1');}catch(x){}
 const id=L[0].id;history.pushState(null,'','#v/'+id);openViewer(id,L.map(x=>x.id));plPlay();}
// 锁屏 / 耳机按键
function media(){if(!('mediaSession' in navigator)||!cur)return;const i=cur;
 navigator.mediaSession.metadata=new MediaMetadata({title:i.zt,artist:'Ross Cameron · 中文配音',album:label(i)+' · '+i.date,artwork:[{src:new URL(img(i,0),location.href).href,sizes:'480x360',type:'image/jpeg'}]});}
if('mediaSession' in navigator){const ms=navigator.mediaSession,H={play:()=>plPlay(),pause:plPause,previoustrack:()=>step(-1),nexttrack:()=>step(1),
 seekbackward:()=>{if(!PL.tts)AE.currentTime=Math.max(0,AE.currentTime-10);},seekforward:()=>{if(!PL.tts)AE.currentTime+=10;}};
 for(const k in H)try{ms.setActionHandler(k,H[k]);}catch(e){}}
function closeViewer(){if(!V.classList.contains('on'))return;plPause();V.classList.remove('on');document.body.style.overflow='';if(location.hash.startsWith('#v/'))history.replaceState(null,'',location.pathname+location.search);back&&back.focus&&back.focus();}
function step(d){const k=ctx.indexOf(cur.id)+d;if(k>=0&&k<ctx.length){const id=ctx[k];history.replaceState(null,'','#v/'+id);openViewer(id,ctx);}}
$('#v-close').addEventListener('click',closeViewer);$('#v-prev').addEventListener('click',()=>step(-1));$('#v-next').addEventListener('click',()=>step(1));
V.addEventListener('click',e=>{if(e.target===V)closeViewer();});
let tq;$('#tq').addEventListener('input',e=>{clearTimeout(tq);tq=setTimeout(()=>{query=e.target.value.trim();renderTx();},180);});
function route(){const m=location.hash.match(/^#v\/([\w-]{11})$/);if(m)openViewer(m[1]);else closeViewer();}
window.addEventListener('hashchange',route);

// ---- global clicks & keys ----
document.addEventListener('click',e=>{const t=e.target.closest('[data-term]');if(t){e.preventDefault();openTerm(t.dataset.term);return;}
 const o=e.target.closest('[data-open]');if(o){e.preventDefault();location.hash='#v/'+o.dataset.open;return;}
 const f=e.target.closest('[data-filter]');if(f){filterTerm(f.dataset.filter);return;}
 const fr=e.target.closest('[data-frame]');if(fr){setFrame(+fr.dataset.frame);return;}
 const j=e.target.closest('[data-jump],[data-seek]');if(j){jump(+(j.dataset.jump??j.dataset.seek),!!j.dataset.keep);return;}
 const pp=e.target.closest('[data-play]');if(pp){plPlay(+pp.dataset.play);return;}
 const pa=e.target.closest('[data-playall]');if(pa){playAll(pa.dataset.playall==='short'?sList():recList());return;}
 const tb=e.target.closest('[data-tab]');if(tb){tab(tb.dataset.tab);return;}
 const sp=e.target.closest('[data-stopic]');if(sp){closeViewer();sTopic=sp.dataset.stopic;$$('#stopics button').forEach(x=>x.setAttribute('aria-pressed',x.dataset.t===sTopic));renderShorts();$('#shorts').scrollIntoView();return;}
 if(panel.classList.contains('on')&&!panel.contains(e.target))closeTerm();});
document.addEventListener('keydown',e=>{if(e.key==='Escape'){if(panel.classList.contains('on'))closeTerm();else closeViewer();return;}
 if(V.classList.contains('on')&&!/INPUT|TEXTAREA|SELECT/.test(document.activeElement.tagName)){if(e.key==='ArrowLeft')step(-1);if(e.key==='ArrowRight')step(1);
  if(e.key===' '&&!e.target.closest('button,a,label')){e.preventDefault();PL.on?plPause():plPlay();}}});

// ---- timeline (官网自述 + 会计师报告 + 本站复盘) ----
const TL=[
['2001','',"高中开出第一个账户","在 Ameritrade 开户，入金打零工攒下的 $1,000。一个夏天过去几乎没变化，让他以为交易需要大本金或深厚知识。",'bio'],
['大衰退时期','warn2',"失业，转向日内交易","官网自述他是“从大衰退期间的失业者”成为日内交易员的。早年尝试仙股、小盘股、期权等多种体系，都没有稳定盈利。",'bio'],
['转折点','',"跌破 $25,000，复盘找到动能","一次亏损让账户跌破 $25,000，受 PDT 规则限制无法继续日内交易。停下来复盘后发现：最成功的交易集中在 $2—$10、快速异动的动能股——这成了他此后的核心策略。",'bio'],
['2012','',"创办 Warrior Trading","以 “Day Trade Warrior Blog” 起步，公开交易日记与市场分析；后来发展为带直播交易室、模拟器与课程的教育社区。",'bio'],
['2017','',"$583.15 小账户挑战","为证明策略适用于小资金，以 $583.15 起步公开挑战；据官网，44 天超过 $100,000（他在复盘里补充：当时用了约 6 倍杠杆的离岸券商）。",'bio'],
['2020—2021','',"两年合计 $839 万","会计师报告：2020 年收益 $4,567,591（6 月单月 $1,261,041），2021 年 $3,826,835，两年合计约占九年累计收益的 44.6%。",'ledger'],
['2022.04','warn2',"FTC 和解","FTC 指控 Warrior Trading 的课程盈利宣传具有误导性，和解要求支付 300 万美元用于消费者退款。如今他的视频都附有“结果不典型”的声明。",'ftc'],
['2025','',"单年 $620 万","会计师报告列示 2025 年收益 $6,200,647，占九年累计的 33.0%；同年净出金 $7,515,000。",'ledger'],
['2026.03.17','',"会计师报告签署","SingerLewak LLP 签署报告，附表覆盖 2017—2025，累计交易收益 $18,810,638。",'ledger'],
['2026.06—09','',"$2,000 → $105,951.28","用嘉信理财现金账户、不加杠杆，46 天把 $2,000 做到 $105,951.28；113 笔交易、胜率约 70%，盈利连同点赞加码捐给 50 州儿童医院，累计超过 $50 万。",'rec'],
['2026.09','warn2',"一年多来最差的月份","他在复盘里说 9 月是一年多来最差的月份：9 月 11 日、28 日两次触及最大亏损，他反复检讨冷市里“松不开油门”。",'rec2']];
const TLS={bio:['官网自述',SRC.bio[1]],ledger:['本页交易账本','#annual'],ftc:['FTC 公告','https://www.ftc.gov/news-events/news/press-releases/2022/04/federal-trade-commission-cracks-down-warrior-trading-misleading-consumers-false-investment-promises'],rec:['本站复盘：46 天小账户课','#v/spaw93SAySQ'],rec2:['本站复盘：周一触及最大亏损','#v/0yaq1jVucSw']};
$('#timeline').innerHTML=TL.map(([w,c,t,p,s])=>`<li class="${c}"><span class="when">${w}</span><div><b>${t}</b><p>${mark(p)} <a class="s" href="${TLS[s][1]}" ${TLS[s][1][0]==='#'?'':'target="_blank" rel="noopener noreferrer"'}>${TLS[s][0]}${TLS[s][1][0]==='#'?'':' ↗'}</a></p></div></li>`).join('');

// ---- rail: current section ----
const navA=$$('.rail nav a');const io=new IntersectionObserver(es=>es.forEach(e=>{if(e.isIntersecting)navA.forEach(a=>a.classList.toggle('on',a.getAttribute('href')==='#'+e.target.id));}),{rootMargin:'-25% 0px -65% 0px'});
['calendar','archive','shorts','glossary','bio','ledger','sources'].forEach(id=>{const s=document.getElementById(id);s&&io.observe(s);});
renderRec();renderShorts();route();
