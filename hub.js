'use strict';
// Комнаты и игровой цикл. Не зависит от транспорта: соединение — объект {send(obj), sendRaw(str)}.
const core=require('./game-core');
const rooms=new Map();let uid=0;
const MAX_ROOMS=30,MAX_MEMBERS=10,SNAP_EVERY=.05; // 20 снимков в секунду
const A='ABCDEFGHJKLMNPQRSTUVWXYZ23456789';
const mkCode=()=>Array.from({length:5},()=>A[Math.floor(Math.random()*A.length)]).join('');
const clamp=(v,a,b)=>Math.max(a,Math.min(b,v));
const profile=m=>({name:String(m.name||'Игрок').slice(0,16),b:core.BR[m.b]?m.b:'shelly',lvl:clamp(m.lvl|0||1,1,9),gad:!!m.gad,sp:!!m.sp});
const bcast=(room,o)=>{for(const m of room.members.values())m.conn.send(o)};
const lobbyMsg=room=>({t:'lobby',mode:room.mode,host:room.hostId,
  members:[...room.members.values()].map(m=>({id:m.id,name:m.name,b:m.b,lvl:m.lvl,gad:m.gad,sp:m.sp}))});

function join(room,c,m,host){
  c.id='u'+(++uid);c.room=room;room.members.set(c.id,{id:c.id,conn:c,...profile(m)});
  if(host)room.hostId=c.id;
  c.send({t:'welcome',id:c.id,code:room.code,host:!!host});bcast(room,lobbyMsg(room))}

function stopIfEmpty(room){
  if(room.G&&!room.G.players.some(p=>!p.bot&&room.members.has(p.id))){room.G=null;room.overAt=0}
  if(!room.members.size)rooms.delete(room.code)}
function botify(room,id){const p=room.G&&room.G.players.find(x=>x.id===id);if(p){p.bot=1;delete room.G.inputs[id]}stopIfEmpty(room)}

function handle(c,m){
  if(!m||typeof m!=='object')return;
  if(m.t==='ping'){c.send({t:'pong',ts:m.ts});return}
  if(m.t==='create'){
    if(c.room)return;if(rooms.size>=MAX_ROOMS)return c.send({t:'err',msg:'Сервер занят, попробуйте позже'});
    let code;do code=mkCode();while(rooms.has(code));
    const room={code,members:new Map(),hostId:null,mode:'solo',G:null,seq:0,sentTv:-1,sentTt:-9,acc:0,overAt:0,last:0};
    rooms.set(code,room);join(room,c,m,true);return}
  if(m.t==='join'){
    if(c.room)return;const room=rooms.get(String(m.code||'').toUpperCase());
    if(!room)return c.send({t:'err',msg:'Лобби не найдено'});
    if(room.G)return c.send({t:'err',msg:'В этой комнате уже идёт игра'});
    if(room.members.size>=MAX_MEMBERS)return c.send({t:'err',msg:'Лобби заполнено'});
    join(room,c,m,false);return}
  const room=c.room,me=room&&room.members.get(c.id);if(!me)return;
  if(m.t==='hello'&&!room.G){Object.assign(me,profile(m));bcast(room,lobbyMsg(room))}
  else if(m.t==='cfg'&&c.id===room.hostId&&core.MODES[m.mode]){room.mode=m.mode;bcast(room,lobbyMsg(room))}
  else if(m.t==='go'&&c.id===room.hostId&&!room.G){
    const mode=core.MODES[m.mode]?m.mode:room.mode,kind=core.mapKind(mode),n=core.MAPS[kind].length;
    const mi=Number.isInteger(m.map)&&m.map>=0&&m.map<n?m.map:core.autoMap(kind);
    room.mode=mode;
    const humans=[...room.members.values()].map(x=>({id:x.id,name:x.name,b:x.b,lvl:x.lvl,gad:x.gad,sp:x.sp}));
    room.G=core.newGame(mode,mi,core.buildRoster(mode,humans));
    Object.assign(room,{sentTv:-1,sentTt:-9,seq:0,acc:0,overAt:0,last:Date.now()});
    bcast(room,{t:'start'})}
  else if(m.t==='in'&&room.G){
    const p=room.G.players.find(x=>x.id===c.id);if(!p||p.bot)return;
    const prev=room.G.inputs[c.id]||{};
    room.G.inputs[c.id]={mx:clamp(+m.mx||0,-1,1),my:clamp(+m.my||0,-1,1),tx:+m.tx||0,ty:+m.ty||0,fire:!!m.fire,sup:!!m.sup||!!prev.sup,gad:!!m.gad||!!prev.gad}}
  else if(m.t==='quit'&&room.G)botify(room,c.id)
}
function close(c){
  const room=c.room;if(!room)return;
  room.members.delete(c.id);c.room=null;
  if(room.G)botify(room,c.id);
  if(!room.members.size){rooms.delete(room.code);return}
  if(c.id===room.hostId)room.hostId=room.members.keys().next().value; // хост ушёл — роль переходит следующему
  if(rooms.has(room.code))bcast(room,lobbyMsg(room))}

function sendSnap(room,force){
  const G=room.G,V=core.snap(G),full=force||G.tv!==room.sentTv||G.t-room.sentTt>2;
  if(full){room.sentTv=G.tv;room.sentTt=G.t}
  V.seq=++room.seq;if(!full)V.tiles=null;
  const s=JSON.stringify(V);for(const m of room.members.values())m.conn.sendRaw(s)}
function tick(){
  const now=Date.now();
  for(const room of rooms.values()){const G=room.G;if(!G)continue;
    const dt=Math.min(.05,(now-room.last)/1000);room.last=now;
    if(G.over){
      if(!room.overAt){room.overAt=now;sendSnap(room,true)}
      else if(now-room.overAt>3500){room.G=null;room.overAt=0;bcast(room,lobbyMsg(room))}
      continue}
    core.step(G,dt);
    if((room.acc+=dt)>=SNAP_EVERY){room.acc=0;sendSnap(room,false)}}}
module.exports={handle,close,tick,rooms};
