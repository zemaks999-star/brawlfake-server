// Собирает game-core.js из игровой логики внутри brawl.html (чтобы сервер и клиент считали игру одинаково).
// Запуск:  node make-core.js ../brawl.html
const fs=require('fs');
const src=fs.readFileSync(process.argv[2]||'../brawl.html','utf8');
const m=src.match(/<script>([\s\S]*)<\/script>\s*<\/body>/)[1];
const a=m.indexOf('// ===== Константы мира'),b=m.indexOf('// ===== Отрисовка');
if(a<0||b<0)throw new Error('Не нашёл блок игровой логики в '+process.argv[2]);
const body=m.slice(a,b).replace(/^const ZEUS_FACE=.*$/m,'').replace(/^const ZIMG=.*$/m,''); // картинки нужны только клиенту
const head="'use strict';\nconst clamp=(v,a,b)=>Math.max(a,Math.min(b,v));\nconst rnd=(a,b)=>a+Math.floor(Math.random()*(b-a+1));\n";
fs.writeFileSync(__dirname+'/game-core.js',head+body+"\nmodule.exports={newGame,buildRoster,step,snap,BR,MODES,MAPS,mapKind,autoMap};\n");
console.log('game-core.js готов');
