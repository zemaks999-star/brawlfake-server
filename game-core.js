'use strict';
const clamp=(v,a,b)=>Math.max(a,Math.min(b,v));
const rnd=(a,b)=>a+Math.floor(Math.random()*(b-a+1));
// ===== Константы мира =====
const TS=50,R=20;
const E=0,WALL=1,WOOD=2,BUSH=3,WATER=4,CRATE=5,EDGE=6;
const SM=[0,1,1,0,1,1,1]; // блокирует движение
const SS=[0,1,1,0,0,1,1]; // блокирует снаряды (вода — нет)

// Лицо Зевса (фото)


// ===== Бойцы =====
const BR={ // значения 1-го уровня, близкие к оригинальному Brawl Stars (дальность в px, 50 px = 1 клетка)
  shelly:{name:'Шелли',color:'#a855f7',hp:3800,spd:190,reload:1.6,rate:.55,chg:3500,
    atk:{n:5,spread:.5,range:350,spd:800,dmg:300},
    sup:{n:9,spread:.6,range:400,spd:850,dmg:320,brk:1,kb:140}, // Супер-заряд: ломает стены и отбрасывает врагов
    gadget:{name:'Рывок',desc:'рывок вперёд'},star:{name:'Шоковый удар',desc:'+15% урона',dmg:1.15}},
  colt:{name:'Кольт',color:'#ef4444',hp:2800,spd:190,reload:1.4,rate:.75,chg:4200,
    atk:{n:6,seq:.07,spread:.04,range:530,spd:950,dmg:320},
    sup:{n:12,seq:.05,spread:.015,range:650,spd:1000,dmg:320,brk:1}, // Шквал пуль: 12 пуль в одну линию, ломают стены
    gadget:{name:'Скорозарядник',desc:'мгновенная перезарядка'},star:{name:'Слик-ботинки',desc:'+12% скорости',spd:1.12}},
  primo:{name:'Эль Примо',color:'#3b82f6',hp:4100,spd:205,reload:2.0,rate:.6,chg:2600,
    atk:{n:4,seq:.06,spread:.25,range:160,spd:650,dmg:360},
    sup:{leap:1,range:450,dmg:1000},
    gadget:{name:'Сок',desc:'лечение 1500'},star:{name:'Эль Фуэго',desc:'+20% здоровья',hp:1.2}},
  brock:{name:'Брок',color:'#f59e0b',hp:2600,spd:190,reload:1.9,rate:.9,chg:3500,
    atk:{n:1,range:600,spd:700,dmg:1100,aoe:70},
    sup:{rain:1,n:9,rad:125,range:620,wait:.4,gap:.07,fall:.5,dmg:900,aoe:70,brk:1}, // Ракетный дождь: 9 ракет падают с неба на выбранную область
    gadget:{name:'Залп',desc:'3 ракеты сразу'},star:{name:'Ракетное топливо',desc:'+25% урона',dmg:1.25}},
  dynamike:{name:'Динамайк',color:'#14b8a6',hp:2800,spd:190,reload:1.8,rate:.8,chg:3200, // метатель: динамит летит по дуге над стенами
    atk:{n:1,range:380,spd:480,dmg:800,aoe:80,th:1},
    sup:{n:1,range:470,spd:420,dmg:1200,aoe:140,th:1,brk:1},
    gadget:{name:'Мешок взрывчатки',desc:'бросок заряда: 1100 урона, большой радиус'},star:{name:'Демолиция',desc:'+20% урона',dmg:1.2}},
  zeus:{name:'Зевс',color:'#facc15',hp:3200,spd:195,reload:1.6,rate:.7,chg:3600, // громовержец: веер молний, супер — шквал молний, пробивающий укрытия
    atk:{n:3,spread:.3,range:460,spd:1050,dmg:420},
    sup:{rain:1,lt:1,n:6,rad:110,range:480,wait:.45,gap:.1,fall:.2,dmg:700,aoe:75,brk:1}, // Гроза: 6 ударов молнии по области
    gadget:{name:'Удар грома',desc:'взрыв вокруг себя: 900 урона'},star:{name:'Гнев Олимпа',desc:'+15% урона',dmg:1.15}},
  mortis:{name:'Мортис',color:'#52525b',hp:3200,spd:216,reload:1.6,rate:.5,chg:3600, // скорость 820 против 720 у обычных (190 → 216); атака — рывок с уроном всем на пути
    atk:{n:1,dash:1,range:230,dmg:1000},
    sup:{n:3,spread:.3,range:400,spd:700,dmg:760,ls:1,pierce:1,w:12}, // «Кровь жизни»: стая летучих мышей пронзает врагов и лечит Мортиса на 100% урона
    gadget:{name:'Лопата выживания',desc:'на 3 сек. входящий урон ×0.3'},star:{name:'Жуткий урожай',desc:'атака лечит на 40% от урона',ls:.4}}
};
const MODES={solo:{name:'Одиночное столкновение',n:10},duo:{name:'Парное столкновение',n:10},ko:{name:'Нокаут 3x3',n:6}};
const MAPS={
  sd:[{name:'Каменный лес',seed:11,d:{1:.16,2:.04,3:.08},crates:4},
      {name:'Зелёная чаща',seed:23,d:{1:.06,2:.04,3:.30},crates:4},
      {name:'Две реки',seed:37,d:{1:.07,2:.07,3:.10},river:1,lake:3,crates:4}],
  ko:[{name:'Ущелье',seed:5,d:{1:.18,3:.06}},
      {name:'Тихая гавань',seed:8,d:{1:.06,2:.04,3:.12},lake:3},
      {name:'Деревянный форт',seed:14,d:{1:.04,2:.20,3:.14}}]
};
const mapKind=m=>m==='ko'?'ko':'sd';
const autoMap=k=>Math.floor(Date.now()/120000)%MAPS[k].length; // смена раз в 2 минуты
const lvlMul=l=>1+.05*(l-1); // как в оригинале: +5% здоровья и урона за уровень
const DMG_SCALE=.5; // общий множитель урона: характеристики как в оригинале, но бои чуть медленнее, чтобы матчи были длиннее
const dmgMul=p=>DMG_SCALE*lvlMul(p.lvl)*(p.sp&&BR[p.b].star.dmg||1)*(1+.1*p.cubes);
const spdOf=p=>BR[p.b].spd*(p.sp&&BR[p.b].star.spd||1);

// ===== Генерация карт (детерминированная, 4-сторонняя симметрия) =====
function rng(seed){return()=>{seed=seed+0x6D2B79F5|0;let t=Math.imul(seed^seed>>>15,1|seed);t=t+Math.imul(t^t>>>7,61|t)^t;return((t^t>>>14)>>>0)/4294967296}}
function genMap(kind,idx){
  const m=MAPS[kind][idx],r=rng(m.seed);
  const big=kind==='sd'?2:1,cols=kind==='sd'?72:30,rows=kind==='sd'?72:20,hw=cols/2,hh=rows/2; // карта столкновения в 2 раза больше по каждой стороне
  const t=new Array(cols*rows).fill(E);
  const set=(x,y,v)=>{if(x<0||y<0||x>=hw||y>=hh)return;
    for(const[a,b]of[[x,y],[cols-1-x,y],[x,rows-1-y],[cols-1-x,rows-1-y]])t[b*cols+a]=v};
  for(const[type,dens]of Object.entries(m.d)){
    const cnt=Math.round(dens*hw*hh/3);
    for(let k=0;k<cnt;k++){const x=Math.floor(r()*hw),y=Math.floor(r()*hh),len=2+Math.floor(r()*3),h=r()<.5;
      for(let i=0;i<len;i++)set(x+(h?i:0),y+(h?0:i),+type)}
  }
  if(m.river)for(let y=3*big;y<hh;y++)if(y%6>1)set(9*big,y,WATER);
  if(m.lake)for(let y=0;y<rows;y++)for(let x=0;x<cols;x++)if(Math.hypot(x+.5-hw,y+.5-hh)<m.lake*big)t[y*cols+x]=WATER;
  if(m.crates)for(let k=0;k<m.crates*big*big;k++){const x=1+Math.floor(r()*(hw-1)),y=1+Math.floor(r()*(hh-1));set(x,y,CRATE)}
  for(let x=0;x<cols;x++){t[x]=EDGE;t[(rows-1)*cols+x]=EDGE}
  for(let y=0;y<rows;y++){t[y*cols]=EDGE;t[y*cols+cols-1]=EDGE}
  let spawns;
  if(kind==='sd'){spawns=[];for(let i=0;i<10;i++){const a=i/10*Math.PI*2;spawns.push([cols*TS/2+Math.cos(a)*cols*TS*.38,rows*TS/2+Math.sin(a)*rows*TS*.38])}}
  else spawns=[[-4,0,4].map(o=>[2.5*TS,(hh+o)*TS]),[-4,0,4].map(o=>[(cols-2.5)*TS,(hh+o)*TS])];
  for(const s of spawns.flat().length===20?spawns.flat().reduce((a,v,i)=>(i%2?a[a.length-1].push(v):a.push([v]),a),[]):spawns.flat()){
    const cx=Math.floor(s[0]/TS),cy=Math.floor(s[1]/TS);
    for(let dy=-1;dy<=1;dy++)for(let dx=-1;dx<=1;dx++){const x=cx+dx,y=cy+dy;if(x>0&&y>0&&x<cols-1&&y<rows-1)t[y*cols+x]=E}
  }
  return{cols,rows,tiles:t,spawns};
}

// ===== Игровая логика (считается у хоста или в одиночной игре) =====
const BOTN=['Бот Макс','Бот Лео','Бот Ника','Бот Рико','Бот Пайпер','Бот Джесси','Бот Поко','Бот Карл','Бот Мортис','Бот Спайк'];
const BOT_SK=.55; // навык ботов 0..1 (1 = очень точные и быстрые)
function buildRoster(mode,humans){
  const keys=Object.keys(BR),avg=Math.round(humans.reduce((s,h)=>s+h.lvl,0)/humans.length);
  const bot=i=>({id:'bot'+i,name:BOTN[i%10],b:keys[rnd(0,keys.length-1)],lvl:clamp(avg+rnd(-1,0),1,9),gad:Math.random()<.35,sp:Math.random()<.15,bot:1});
  const ros=[];let bi=0;
  if(mode==='ko'){const t=[[],[]];humans.slice(0,6).forEach((h,i)=>t[i<3?0:1].push(h));
    for(const j of[0,1])while(t[j].length<3)t[j].push(bot(bi++));
    t.forEach((arr,j)=>arr.forEach(r=>ros.push({...r,team:j})))}
  else{humans.slice(0,10).forEach(h=>ros.push({...h}));while(ros.length<10)ros.push(bot(bi++));
    ros.forEach((r,i)=>r.team=mode==='duo'?i>>1:i)}
  return ros;
}
function mkPlayer(r){const d=BR[r.b],base=d.hp*lvlMul(r.lvl)*(r.sp&&d.star.hp||1);
  return{...r,x:0,y:0,hp:base,base,maxhp:base,ammo:3,rl:0,sup:0,cubes:0,alive:1,gadLeft:r.gad?3:0,
    lastHit:-9,lastAtk:-9,lastGad:-9,hitEv:-9,hitAcc:0,ang:0,leap:null,nextThink:0,ai:null,stuck:0,stuckT:0,rdir:0,strafe:1,bush:false}}
function newGame(mode,mi,roster){
  const kind=mapKind(mode),M=genMap(kind,mi);
  const G={mode,mapName:MAPS[kind][mi].name,cols:M.cols,rows:M.rows,W:M.cols*TS,H:M.rows*TS,tiles:M.tiles,
    thp:M.tiles.map(v=>v===WOOD?900:v===CRATE?2600:0),spawns:M.spawns,players:roster.map(mkPlayer),
    bullets:[],strikes:[],cubes:[],fx:[],evs:[],evId:0,lastBrk:-9,tv:0,inputs:{},t:0,rt:0,gas:1e9,teamRank:{},over:0,results:null,
    ko:kind==='ko'?{wins:[0,0],pause:0,round:1,last:-1}:null};
  placeAll(G);ev(G,'round',0,0,{g:1});return G;
}
function placeAll(G){const k=[0,0];G.players.forEach((p,i)=>{const s=G.ko?G.spawns[p.team][k[p.team]++]:G.spawns[i];p.x=s[0];p.y=s[1]})}
function newRound(G){G.ko.round++;G.rt=0;ev(G,'round',0,0,{g:1});G.bullets=[];G.strikes=[];G.players.forEach(p=>{p.alive=1;p.hp=p.maxhp;p.ammo=3;p.leap=null;p.dash=null;p.shieldT=0});placeAll(G)}

function cellIdx(G,x,y){const cx=Math.floor(x/TS),cy=Math.floor(y/TS);return cx<0||cy<0||cx>=G.cols||cy>=G.rows?-1:cy*G.cols+cx}
function tileAt(G,x,y){const i=cellIdx(G,x,y);return i<0?EDGE:G.tiles[i]}
function blocked(G,x,y){const k=R*.85;for(const[dx,dy]of[[-k,-k],[k,-k],[-k,k],[k,k]])if(SM[tileAt(G,x+dx,y+dy)])return true;return false}
function moveP(G,p,dx,dy){if(!blocked(G,p.x+dx,p.y))p.x+=dx;if(!blocked(G,p.x,p.y+dy))p.y+=dy}
function ev(G,type,x,y,o){G.evs.push({id:G.evId++,t:G.t,type,x:Math.round(x),y:Math.round(y),...o})} // звуковые события
function breakTile(G,ci){const v=G.tiles[ci],x=(ci%G.cols+.5)*TS,y=(Math.floor(ci/G.cols)+.5)*TS;
  if(v===CRATE)G.cubes.push({x,y});
  if((v===CRATE||v===WOOD)&&G.t-G.lastBrk>.05){G.lastBrk=G.t;ev(G,'brk',x,y,{c:v===CRATE?1:0})}
  G.tiles[ci]=E;G.tv++}
function hitTile(G,ci,amt){const v=G.tiles[ci];if((v===WOOD||v===CRATE)&&(G.thp[ci]-=amt)<=0)breakTile(G,ci)}
const breakable=v=>v===WALL||v===WOOD||v===CRATE||v===BUSH;

function hurt(G,q,amt,src,sup){if(!q.alive)return;if(q.shieldT>G.t)amt*=.3;q.hp-=amt;q.lastHit=G.t;
  if(src){q.hitAcc+=amt;if(G.t-q.hitEv>.09){q.hitEv=G.t;ev(G,'hit',q.x,q.y,{pid:q.id,sid:src.id,a:Math.round(q.hitAcc)});q.hitAcc=0}}
  if(src&&!sup){const was=src.sup;src.sup=Math.min(1,src.sup+amt/BR[src.b].chg);if(was<1&&src.sup>=1&&!src.bot)ev(G,'rdy',src.x,src.y,{pid:src.id})}
  if(q.hp<=0)kill(G,q,src)}
function kill(G,q,src){q.alive=0;q.hp=0;q.leap=null;q.dash=null;
  ev(G,'kill',q.x,q.y,{pid:q.id,kid:src?src.id:null});
  if(G.ko)return;
  for(let i=0;i<Math.max(1,q.cubes);i++)G.cubes.push({x:q.x+(Math.random()-.5)*40,y:q.y+(Math.random()-.5)*40});
  if(!G.players.some(p=>p.alive&&p.team===q.team))G.teamRank[q.team]=new Set(G.players.filter(p=>p.alive).map(p=>p.team)).size+1}
function boom(G,x,y,r,dmg,src,brk,sup){G.fx.push({x,y,r,t:.3});ev(G,'boom',x,y,{r,sup:sup?1:0});
  for(const q of G.players)if(q.alive&&q.team!==src.team&&Math.hypot(q.x-x,q.y-y)<r+R)hurt(G,q,dmg,src,sup);
  for(let cy=Math.floor((y-r)/TS);cy<=Math.floor((y+r)/TS);cy++)for(let cx=Math.floor((x-r)/TS);cx<=Math.floor((x+r)/TS);cx++){
    if(cx<0||cy<0||cx>=G.cols||cy>=G.rows||Math.hypot((cx+.5)*TS-x,(cy+.5)*TS-y)>r+TS*.5)continue;
    const ci=cy*G.cols+cx;if(brk&&breakable(G.tiles[ci]))breakTile(G,ci);else hitTile(G,ci,dmg)}}

function shoot(G,p,ang,s,sup,inp,quiet){
  const m=dmgMul(p);
  if(!quiet)ev(G,sup?'sup':'atk',p.x,p.y,{b:p.b,pid:p.id,n:s.n||1,a:+p.ang.toFixed(2)});
  if(s.dash){p.dash={dx:Math.cos(ang),dy:Math.sin(ang),left:s.range,hit:new Set(),dmg:s.dmg*m,ls:(s.ls||0)+(BR[p.b].star.ls&&p.sp?BR[p.b].star.ls:0)};return}
  if(s.rain){const dist=Math.min(s.range,Math.hypot(inp.tx-p.x,inp.ty-p.y)||s.range),cx=p.x+Math.cos(ang)*dist,cy=p.y+Math.sin(ang)*dist; // дождь снарядов/молний на область
    for(let i=0;i<s.n;i++){const r=Math.sqrt(Math.random())*s.rad,a=Math.random()*6.283;
      G.strikes.push({x:clamp(cx+Math.cos(a)*r,TS*1.2,G.W-TS*1.2),y:clamp(cy+Math.sin(a)*r,TS*1.2,G.H-TS*1.2),t:s.wait+i*s.gap,f:s.fall,dmg:s.dmg*m,aoe:s.aoe,brk:s.brk||0,lt:s.lt||0,o:p,team:p.team})}
    return}
  if(s.leap){const dist=Math.min(s.range,Math.hypot(inp.tx-p.x,inp.ty-p.y)||s.range);
    p.leap={sx:p.x,sy:p.y,ex:clamp(p.x+Math.cos(ang)*dist,TS*1.5,G.W-TS*1.5),ey:clamp(p.y+Math.sin(ang)*dist,TS*1.5,G.H-TS*1.5),t:0,dmg:s.dmg*m};return}
  for(let i=0;i<s.n;i++){
    const a=s.seq?ang+(Math.random()-.5)*2*s.spread:s.n>1?ang-s.spread/2+s.spread*i/(s.n-1):ang;
    const range=s.th?clamp(Math.hypot(inp.tx-p.x,inp.ty-p.y),60,s.range):s.aoe&&s.n>1?s.range*(.45+.55*Math.random()):s.range;
    G.bullets.push({x:p.x,y:p.y,a,spd:s.spd,d:0,range,dmg:s.dmg*m,ls:s.ls||0,kb:s.kb||0,pierce:s.pierce||0,w:s.w||0,hit:s.pierce?new Set():null,o:p,team:p.team,aoe:s.aoe||0,th:s.th||0,brk:s.brk||0,delay:s.seq?i*s.seq:0,sup,c:BR[p.b].color})}
}
function gadget(G,p,inp){
  ev(G,'gad',p.x,p.y,{b:p.b,pid:p.id});
  if(p.b==='shelly')for(let i=0;i<10;i++)moveP(G,p,Math.cos(p.ang)*20,Math.sin(p.ang)*20);
  if(p.b==='colt')p.ammo=3;
  if(p.b==='primo')p.hp=Math.min(p.maxhp,p.hp+1500);
  if(p.b==='brock')shoot(G,p,p.ang,{...BR.brock.atk,n:3,spread:.5},0,inp,1);
  if(p.b==='mortis')p.shieldT=G.t+3;
  if(p.b==='zeus')boom(G,p.x,p.y,140,900*dmgMul(p),p,0,0);
  if(p.b==='dynamike')shoot(G,p,p.ang,{n:1,range:300,spd:320,dmg:1100,aoe:110,th:1},0,inp,1);
  G.fx.push({x:p.x,y:p.y,r:35,t:.25});
}
function nearestCrate(G,p){
  if(!G.crc||G.t-G.crcT>1){G.crcT=G.t;G.crc=[];G.tiles.forEach((v,i)=>{if(v===CRATE)G.crc.push({x:(i%G.cols+.5)*TS,y:(Math.floor(i/G.cols)+.5)*TS})})}
  let best=null,bd=1e9;for(const c of G.crc){const d=Math.hypot(c.x-p.x,c.y-p.y);if(d<bd){bd=d;best=c}}return best}

// ===== ИИ ботов =====
function botInput(G,p){
  if(G.t<p.nextThink&&p.ai)return p.ai;
  const sk=p.sk??BOT_SK;p.nextThink=G.t+.15+(1-sk)*.35+Math.random()*.1;
  const d=BR[p.b],rg=d.atk.range,cx=G.W/2,cy=G.H/2;
  const inp={mx:0,my:0,tx:p.x+Math.cos(p.ang)*50,ty:p.y+Math.sin(p.ang)*50,fire:0,sup:0,gad:0};
  let goal=null,en=null,ed=1e9;
  for(const q of G.players){if(!q.alive||q.team===p.team)continue;const dd=Math.hypot(q.x-p.x,q.y-p.y);
    if(q.bush&&dd>150&&G.t-q.lastAtk>1)continue;if(dd<ed){ed=dd;en=q}}
  const inGas=Math.hypot(p.x-cx,p.y-cy)>G.gas-100;
  if(inGas)goal={x:cx,y:cy};
  if(p.hp/p.maxhp<.4)p.flee=1;else if(p.hp/p.maxhp>.85)p.flee=0; // отступают лечиться
  if(en&&(ed<(G.ko?1e9:560))){
    const sp=20+(1-sk)*(40+ed*.4);inp.tx=en.x+(Math.random()-.5)*sp;inp.ty=en.y+(Math.random()-.5)*sp;
    if(ed<rg*.95){inp.fire=Math.random()<.35+.25*sk;if(p.sup>=1&&ed<(d.sup.range||rg)&&Math.random()<.6)inp.sup=1}
    if(p.gadLeft&&Math.random()<.02)inp.gad=1;
    if(!goal){if(ed>rg*.7||(rg<260&&p.hp/p.maxhp>.5))goal=en;
      else{if(Math.random()<.05)p.strafe*=-1;const a=Math.atan2(en.y-p.y,en.x-p.x)+p.strafe*1.4;inp.mx=Math.cos(a);inp.my=Math.sin(a)}}
    if(p.flee&&!inGas&&ed<900){goal=null;inp.mx=p.x-en.x;inp.my=p.y-en.y;if(ed>130)inp.fire=0}
  }else if(!goal){
    let best=null,bd=1e9;for(const c of G.cubes){const dd=Math.hypot(c.x-p.x,c.y-p.y);if(dd<bd){bd=dd;best=c}}
    if(best&&bd<600)goal=best;
    else if(!G.ko){const cr=nearestCrate(G,p);
      if(cr){if(Math.hypot(cr.x-p.x,cr.y-p.y)<rg*.8){inp.tx=cr.x;inp.ty=cr.y;inp.fire=1}else goal=cr}else goal={x:cx,y:cy}}
    else goal={x:cx,y:cy};
  }
  if(goal){inp.mx=goal.x-p.x;inp.my=goal.y-p.y}
  if(p.stuckT>0){inp.mx=Math.cos(p.rdir);inp.my=Math.sin(p.rdir)}
  return p.ai=inp;
}

function step(G,dt){
  if(G.over)return;
  G.t+=dt;G.rt+=dt;G.fx=G.fx.filter(f=>(f.t-=dt)>0);G.evs=G.evs.filter(e=>G.t-e.t<1);
  if(G.ko&&G.ko.pause>0){if((G.ko.pause-=dt)<=0)newRound(G);return}
  const R0=Math.hypot(G.W,G.H)/2,cx=G.W/2,cy=G.H/2;
  G.gas=G.ko?(G.rt<45?R0:Math.max(2*TS,R0-(G.rt-45)/50*(R0-2*TS))):(G.t<40?R0:Math.max(2*TS,R0-(G.t-40)/140*(R0-2*TS)));
  for(const p of G.players){
    if(!p.alive)continue;
    const inp=p.bot?botInput(G,p):(G.inputs[p.id]||{}),d=BR[p.b];
    if(p.leap){const L=p.leap;L.t+=dt/.55;const k=Math.min(1,L.t);p.x=L.sx+(L.ex-L.sx)*k;p.y=L.sy+(L.ey-L.sy)*k;
      if(L.t>=1){p.leap=null;boom(G,p.x,p.y,130,L.dmg,p,1,1);if(blocked(G,p.x,p.y)){p.x=L.sx;p.y=L.sy}}continue}
    if(p.dash){const D=p.dash,st=Math.min(D.left,1150*dt),n=Math.max(1,Math.ceil(st/10));p.ang=Math.atan2(D.dy,D.dx); // рывок Мортиса: бьёт каждого врага на пути один раз
      for(let i=0;i<n;i++){const sp=st/n,ox=p.x,oy=p.y;moveP(G,p,D.dx*sp,D.dy*sp);if(Math.hypot(p.x-ox,p.y-oy)<sp*.5){D.left=0;break}}
      D.left-=st;
      for(const q of G.players)if(q.alive&&q.team!==p.team&&!q.leap&&!D.hit.has(q.id)&&Math.hypot(q.x-p.x,q.y-p.y)<R*2+4){
        D.hit.add(q.id);hurt(G,q,D.dmg,p,0);if(D.ls&&p.alive)p.hp=Math.min(p.maxhp,p.hp+D.dmg*D.ls)}
      if(D.left<=.5)p.dash=null;continue}
    let mx=inp.mx||0,my=inp.my||0;const l=Math.hypot(mx,my);
    if(l>0){mx/=l;my/=l;const s=spdOf(p)*(p.bot?.8+.2*(p.sk??BOT_SK):1)*dt,ox=p.x,oy=p.y;moveP(G,p,mx*s,my*s);
      if(p.bot){if(Math.hypot(p.x-ox,p.y-oy)<s*.3){if((p.stuck+=dt)>.3){p.stuckT=.8;p.rdir=Math.random()*6.28;p.stuck=0}}else p.stuck=0}}
    if(p.stuckT>0)p.stuckT-=dt;
    if(inp.tx!==undefined)p.ang=Math.atan2(inp.ty-p.y,inp.tx-p.x);
    if(p.ammo<3&&(p.rl+=dt)>=d.reload){p.ammo++;p.rl=0}
    if(inp.fire&&p.ammo>=1&&G.t-p.lastAtk>(d.rate||.35)){p.ammo--;p.lastAtk=G.t;shoot(G,p,p.ang,d.atk,0,inp)}
    if(inp.sup&&p.sup>=1){p.sup=0;p.lastAtk=G.t;shoot(G,p,p.ang,d.sup,1,inp)}
    if(inp.gad&&p.gadLeft>0&&G.t-p.lastGad>3){p.gadLeft--;p.lastGad=G.t;gadget(G,p,inp)}
    if(!p.bot){inp.sup=0;inp.gad=0}
    if(G.t-p.lastHit>3&&G.t-p.lastAtk>3&&p.hp<p.maxhp)p.hp=Math.min(p.maxhp,p.hp+p.maxhp*.1*dt);
    if(Math.hypot(p.x-cx,p.y-cy)>G.gas)hurt(G,p,500*dt,null,1);
    p.bush=tileAt(G,p.x,p.y)===BUSH;
    for(let i=G.cubes.length-1;i>=0;i--){const c=G.cubes[i];
      if(p.alive&&Math.hypot(c.x-p.x,c.y-p.y)<30){G.cubes.splice(i,1);p.cubes++;ev(G,'cube',p.x,p.y,{pid:p.id});const add=p.base*.1;p.maxhp+=add;p.hp+=add}}
  }
  for(let i=G.bullets.length-1;i>=0;i--){
    const b=G.bullets[i];
    if(b.delay>0){if((b.delay-=dt)<=0){b.x=b.o.x;b.y=b.o.y}else continue}
    const st=b.spd*dt;b.x+=Math.cos(b.a)*st;b.y+=Math.sin(b.a)*st;b.d+=st;
    let dead=0;const ci=cellIdx(G,b.x,b.y);
    if(ci<0)dead=1;else if(!b.th){const v=G.tiles[ci];
      if(b.brk&&breakable(v))breakTile(G,ci);
      else if(SS[v]){if(!b.aoe)hitTile(G,ci,b.dmg);dead=1}}
    if(!dead&&!b.th)for(const q of G.players)if(q.alive&&q.team!==b.team&&!q.leap&&!(b.hit&&b.hit.has(q.id))&&Math.hypot(q.x-b.x,q.y-b.y)<R+6+b.w){
      if(!b.aoe){hurt(G,q,b.dmg,b.o,b.sup);if(b.ls&&b.o.alive)b.o.hp=Math.min(b.o.maxhp,b.o.hp+b.dmg*b.ls);
        if(b.kb&&q.alive&&!(q.kbT>G.t)){q.kbT=G.t+.3;for(let k=0;k<b.kb/10;k++)moveP(G,q,Math.cos(b.a)*10,Math.sin(b.a)*10)}} // отбрасывание один раз за залп
      if(b.pierce)b.hit.add(q.id);else{dead=1;break}}
    if(!dead&&b.d>=b.range)dead=1;
    if(dead){if(b.aoe)boom(G,b.x,b.y,b.aoe,b.dmg,b.o,b.brk,b.sup);G.bullets.splice(i,1)}
  }
  for(let i=G.strikes.length-1;i>=0;i--){const u=G.strikes[i];if((u.t-=dt)<=0){boom(G,u.x,u.y,u.aoe,u.dmg,u.o,u.brk,1);G.strikes.splice(i,1)}}
  checkEnd(G);
}
function finish(G,fn){G.over=1;G.results={};G.players.forEach(p=>G.results[p.id]=fn(p))}
function checkEnd(G){
  if(G.ko){const a=[0,1].map(t=>G.players.some(p=>p.alive&&p.team===t));if(a[0]&&a[1])return;
    G.ko.last=a[0]?0:a[1]?1:-1;if(G.ko.last>=0)G.ko.wins[G.ko.last]++;ev(G,'rend',0,0,{g:1,team:G.ko.last});
    const w=G.ko.wins;
    if(w[0]>=2||w[1]>=2){const win=w[0]>=2?0:1;finish(G,p=>({win:p.team===win,txt:p.team===win?'ПОБЕДА':'ПОРАЖЕНИЕ',tro:p.team===win?8:-4}))}
    else G.ko.pause=2.5;
  }else{const alive=new Set(G.players.filter(p=>p.alive).map(p=>p.team));if(alive.size>1)return;
    for(const t of alive)G.teamRank[t]=1;
    const duo=G.mode==='duo',TR=duo?[9,7,4,0,-3]:[10,8,7,6,4,2,0,-1,-2,-3];
    finish(G,p=>{const r=G.teamRank[p.team]||1;return{win:r<=(duo?2:4),txt:'Место #'+r,tro:TR[r-1]}})}
}
// Снимок состояния: используется и для отрисовки, и для отправки клиентам
function snap(G){return{t:'s',mode:G.mode,mapName:G.mapName,cols:G.cols,rows:G.rows,W:G.W,H:G.H,tiles:G.tcv===G.tv&&G.tcache?G.tcache:(G.tcv=G.tv,G.tcache=G.tiles.join('')),tv:G.tv,gas:G.gas,ko:G.ko,over:G.over,results:G.results,
  players:G.players.map(p=>({id:p.id,name:p.name,b:p.b,team:p.team,x:Math.round(p.x),y:Math.round(p.y),spd:Math.round(spdOf(p)),hp:Math.round(p.hp),maxhp:Math.round(p.maxhp),
    ammo:p.ammo+(p.ammo<3?p.rl/BR[p.b].reload:0),sup:p.sup,cubes:p.cubes,alive:p.alive,bush:p.bush,rev:G.t-p.lastAtk<.8||G.t-p.lastHit<.4,ang:+p.ang.toFixed(2),gadLeft:p.gadLeft,leap:!!p.leap,dash:!!p.dash,sh:G.t<(p.shieldT||0)})),
  st:G.strikes.map(u=>({x:Math.round(u.x),y:Math.round(u.y),t:+u.t.toFixed(2),f:u.f,r:u.aoe,lt:u.lt})),bullets:G.bullets.filter(b=>b.delay<=0).map(b=>({w:b.w,sp:Math.round(b.spd),x:Math.round(b.x),y:Math.round(b.y),c:b.c,aoe:b.aoe,a:+b.a.toFixed(2),th:b.th?1:0,pr:+(b.d/b.range).toFixed(2)})),
  cubes:G.cubes.map(c=>({x:Math.round(c.x),y:Math.round(c.y)})),fx:G.fx,ev:G.evs}}


module.exports={newGame,buildRoster,step,snap,BR,MODES,MAPS,mapKind,autoMap};
