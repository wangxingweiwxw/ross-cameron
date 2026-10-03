// 文字档案页的交互：词条弹窗、资产曲线（按容器宽度绘制，带悬停提示）、目录高亮。正文是静态 HTML，不启用脚本也能完整阅读。
const $=(s,r=document)=>r.querySelector(s),$$=(s,r=document)=>[...r.querySelectorAll(s)];
const esc=s=>String(s).replace(/[&<>"]/g,c=>({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;'}[c]));

// ---- 词条 ----
const TP=$('#term');
function openTerm(id,btn){const t=TERMS[id];if(!t)return;
 $('#term-body').innerHTML=`<h3 id="term-h">${esc(t[0])}<small lang="${LANG}">${esc(t[1])}</small></h3><p>${esc(t[2])}</p><p><a href="#g-${id}">在用语表中查看 →</a></p>`;
 TP.classList.add('on');TP._from=btn;$('#term-x').focus();}
function closeTerm(){if(!TP.classList.contains('on'))return;TP.classList.remove('on');TP._from&&TP._from.focus();}
document.addEventListener('click',e=>{const t=e.target.closest('.t');if(t){openTerm(t.dataset.t,t);return;}
 if(e.target.closest('#term-x')||(TP.classList.contains('on')&&!e.target.closest('#term'))){closeTerm();}
 if(e.target.closest('#term a'))TP.classList.remove('on');});
document.addEventListener('keydown',e=>{if(e.key==='Escape')closeTerm();});

// ---- 资产曲线（对数纵轴，单一序列） ----
function yen(v){if(v>=1e8){const n=v/1e8;return (n>=100?Math.round(n):+n.toFixed(n<10?2:1))+' 亿';}return Math.round(v/1e4).toLocaleString('zh-CN')+' 万';}
function drawChart(box){const C=CHART[box.dataset.chart];if(!C)return;
 const W=box.clientWidth,H=W<560?250:310,m={l:W<560?52:64,r:W<560?44:70,t:30,b:28};
 const P=C.points,x0=Math.floor(P[0][1]*2)/2,x1=Math.ceil(P[P.length-1][1]*2)/2+.1,y0=5.7,y1=10.6;
 const X=x=>m.l+(x-x0)/(x1-x0)*(W-m.l-m.r),Y=v=>m.t+(y1-Math.log10(v))/(y1-y0)*(H-m.t-m.b);
 let g='<g class="grid">',ax='<g class="ax">';
 [[1e6,'100 万'],[1e7,'1,000 万'],[1e8,'1 亿'],[1e9,'10 亿'],[1e10,'100 亿']].forEach(([v,l])=>{g+=`<line x1="${m.l}" x2="${W-m.r}" y1="${Y(v)}" y2="${Y(v)}"/>`;ax+=`<text x="${m.l-8}" y="${Y(v)+4}" text-anchor="end">${l}</text>`;});
 for(let yr=Math.ceil(x0);yr<=x1;yr++){if(W<560&&yr%2)continue;ax+=`<text x="${X(yr)}" y="${H-8}" text-anchor="middle">${yr}</text>`;}
 g+=`<line x1="${m.l}" x2="${W-m.r}" y1="${H-m.b}" y2="${H-m.b}" style="stroke:var(--line2)"/></g>`;ax+='</g>';
 const pts=P.map(p=>[X(p[1]),Y(p[2])]),line=pts.map((p,i)=>(i?'L':'M')+p[0].toFixed(1)+' '+p[1].toFixed(1)).join(' ');
 const area=`${line} L${pts[pts.length-1][0].toFixed(1)} ${H-m.b} L${pts[0][0].toFixed(1)} ${H-m.b} Z`;
 let ev='';(C.events||[]).forEach(([xv,l])=>{const xx=X(xv);ev+=`<line x1="${xx}" x2="${xx}" y1="${m.t-6}" y2="${H-m.b}" style="stroke:var(--line2);stroke-width:1"/><text class="ann" x="${xx-6}" y="${m.t-10}" text-anchor="end">${esc(l)}</text>`;});
 const f=P[0],l=P[P.length-1],pf=pts[0],pl=pts[pts.length-1];
 const labs=`<text class="lab" x="${pf[0]+8}" y="${pf[1]+18}">${yen(f[2])}</text><text class="lab" x="${pl[0]+10}" y="${pl[1]+4}">${yen(l[2])}${l[3]?'+':''}</text>`;
 const dots=pts.map(p=>`<circle cx="${p[0]}" cy="${p[1]}" r="4" fill="var(--ac-mark)" stroke="var(--panel)" stroke-width="2"/>`).join('');
 const hits=pts.map((p,i)=>{const a=i?(pts[i-1][0]+p[0])/2:m.l,b=i<pts.length-1?(p[0]+pts[i+1][0])/2:W-m.r;
  return `<rect class="hit" data-i="${i}" x="${a}" y="${m.t-8}" width="${Math.max(b-a,1)}" height="${H-m.t-m.b+8}" tabindex="0" aria-label="${esc(P[i][0])}：${yen(P[i][2])}日元"/>`;}).join('');
 box.innerHTML=`<svg viewBox="0 0 ${W} ${H}" height="${H}" role="img" aria-label="${esc(C.label)}">${g}${ax}<path d="${area}" fill="var(--ac-mark)" fill-opacity=".1"/>${ev}<path d="${line}" fill="none" stroke="var(--ac-mark)" stroke-width="2" stroke-linejoin="round" stroke-linecap="round"/>${dots}${labs}<circle class="focus" r="7" fill="none" stroke="var(--text)" stroke-width="2" style="display:none"/>${hits}</svg><div class="tip"></div>`;
 const tip=$('.tip',box),fc=$('.focus',box);
 const show=i=>{const p=P[i],q=pts[i];tip.innerHTML=`<small>${esc(p[0])}</small><b>${yen(p[2])}${C.unit}</b>${p[3]?esc(p[3])+'<br>':''}<small>出处：${esc(p[5])}</small>`;
  tip.style.display='block';tip.style.left=Math.min(Math.max(q[0],90),W-90)+'px';tip.style.top=q[1]+'px';fc.setAttribute('cx',q[0]);fc.setAttribute('cy',q[1]);fc.style.display='';};
 const hide=()=>{tip.style.display='none';fc.style.display='none';};
 $$('.hit',box).forEach(r=>{const i=+r.dataset.i;r.addEventListener('pointerenter',()=>show(i));r.addEventListener('focus',()=>show(i));r.addEventListener('pointerleave',hide);r.addEventListener('blur',hide);r.addEventListener('click',()=>show(i));});
}
const plots=$$('.plot[data-chart]');plots.forEach(drawChart);
let rt;window.addEventListener('resize',()=>{clearTimeout(rt);rt=setTimeout(()=>plots.forEach(drawChart),120);});

// ---- 目录高亮 ----
const tocA=$$('.toc a[href^="#"]'),secs=tocA.map(a=>document.getElementById(a.hash.slice(1))).filter(Boolean);
if('IntersectionObserver' in window){const io=new IntersectionObserver(es=>{es.forEach(e=>{if(e.isIntersecting){tocA.forEach(a=>a.classList.toggle('on',a.hash==='#'+e.target.id));}});},{rootMargin:'-20% 0px -70% 0px'});secs.forEach(s=>io.observe(s));}
