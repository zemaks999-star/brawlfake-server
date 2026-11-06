'use strict';
const http=require('http');
const {WebSocketServer}=require('ws');
const hub=require('./hub');
const PORT=process.env.PORT||8080;
const srv=http.createServer((q,r)=>{r.writeHead(200,{'content-type':'text/plain; charset=utf-8'});r.end('Brawl server работает. Комнат: '+hub.rooms.size)});
const wss=new WebSocketServer({server:srv,maxPayload:16384});
wss.on('connection',ws=>{
  const c={ws,id:null,room:null,
    send:o=>{if(ws.readyState===1)ws.send(JSON.stringify(o))},
    sendRaw:s=>{if(ws.readyState===1)ws.send(s)}};
  ws.isAlive=true;ws.on('pong',()=>{ws.isAlive=true});
  ws.on('message',d=>{let m;try{m=JSON.parse(String(d))}catch(e){return}try{hub.handle(c,m)}catch(e){console.error(e)}});
  ws.on('close',()=>hub.close(c));ws.on('error',()=>{});
});
setInterval(hub.tick,1000/60);
setInterval(()=>{for(const ws of wss.clients){if(!ws.isAlive){ws.terminate();continue}ws.isAlive=false;ws.ping()}},25000); // пинги держат соединение живым
srv.listen(PORT,()=>console.log('Brawl server на порту '+PORT));
