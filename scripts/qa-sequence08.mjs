import { chromium } from '@playwright/test';import fs from 'node:fs/promises';import assert from 'node:assert/strict';
const previousRoof=JSON.parse(await fs.readFile('src/legacyRoofFrames.json'));
const manifest=JSON.parse(await fs.readFile('src/sequenceManifest.json'));
const prior=JSON.parse(await fs.readFile('artifacts/sequence-02/audit.json'));
const iteration='sequence-08';
const mid=JSON.parse(await fs.readFile('artifacts/sequence-04/midpoint-audit.json'));
const added={frames:[...JSON.parse(await fs.readFile('artifacts/sequence-08/midpoint-audit.json')).frames,...JSON.parse(await fs.readFile('artifacts/sequence-05/midpoint-audit.json')).frames]};
const roofs=[...JSON.parse(await fs.readFile('artifacts/sequence-08/roof-audit.json')).frames,...JSON.parse(await fs.readFile('artifacts/sequence-06/roof-audit.json')).frames,...JSON.parse(await fs.readFile('artifacts/sequence-07/roof-audit.json')).frames];
const frameData=manifest.frames.map(f=>roofs.find(a=>a.id===f.id)??(f.id==='01b'?mid:added.frames.find(a=>a.id===f.id)??prior.frames[Number(f.id)]));
const out=`artifacts/${iteration}`;const url=process.env.QA_URL||'http://127.0.0.1:4203/Brooklands-Hero/';
const b=await chromium.launch({executablePath:'/usr/bin/chromium',args:['--no-sandbox']});const results=[];
const wait=(p,i)=>p.waitForFunction(i=>document.querySelector('.stage').dataset.frame===String(i),i);
try{
 for(const [width,height] of [[320,812],[430,932],[900,760],[1440,900],[1920,1080]]){
  const p=await b.newPage({viewport:{width,height}});const errors=[],requests=[];p.on('pageerror',e=>errors.push(e.message));p.on('request',r=>requests.push(r.url()));
  await p.goto(url);await wait(p,0);await p.waitForFunction(n=>+document.querySelector('.stage').dataset.loaded===n,manifest.frames.length);
  assert.equal(await p.locator('.stage').getAttribute('data-grade'),'both');assert.equal(await p.locator('h1').count(),1);
  let baseline=null;
  for(let i=0;i<manifest.frames.length;i++){
   await wait(p,i);await p.locator('.sequence-image').evaluate(img=>img.decode());const f=frameData[i];
   const rects=await p.evaluate(()=>{const rect=s=>{const r=document.querySelector(s).getBoundingClientRect();return{x:r.x,y:r.y,width:r.width,height:r.height}};return{img:rect('.sequence-image'),stage:rect('.stage'),presets:rect('.presets')}});
   const{img,stage,presets}=rects;const visible=f.visible;
   assert(img.x+visible.left/f.width*img.width>=stage.x-1);assert(img.x+visible.right/f.width*img.width<=stage.x+stage.width+1);
   assert(img.y+visible.top/f.height*img.height>=stage.y-1);assert(img.y+visible.bottom/f.height*img.height<=stage.y+stage.height+1);
   if(width>=900)assert(img.x+visible.right/f.width*img.width<=presets.x-19);
   const ground=img.y-stage.y+f.groundY/f.height*img.height;baseline??=ground;assert(Math.abs(ground-baseline)<.1);
   if([430,1920].includes(width)&&['00','01b','02','03','05','05b','06','11','11b','12','17','17b','18'].includes(manifest.frames[i].id))await p.screenshot({path:`${out}/hero-${width}-frame-${manifest.frames[i].id}.png`,fullPage:true});
   await p.getByRole('button',{name:'Повернуть вправо',exact:true}).click();
  }
  await wait(p,0);await p.locator('.stage').focus();await p.keyboard.press('ArrowLeft');await wait(p,manifest.frames.length-1);await p.keyboard.press('Home');await wait(p,0);
  const stage=await p.locator('.stage').boundingBox();await p.mouse.move(stage.x+stage.width/2,stage.y+stage.height*.7);await p.mouse.down();await p.mouse.move(stage.x+stage.width/2-40,stage.y+stage.height*.7,{steps:4});await p.mouse.up();await p.waitForFunction(()=>document.querySelector('.stage').dataset.frame!=='0');
  assert(await p.evaluate(()=>document.documentElement.scrollWidth<=innerWidth));assert(!requests.some(u=>u.endsWith('.glb')));assert.deepEqual(errors,[]);
  results.push({viewport:`${width}x${height}`,frames:manifest.frames.length,allVisible:true,groundStable:true,wrapAndKeyboard:true,mouse:true,noErrors:true});await p.close();
 }
 const review=await b.newPage({viewport:{width:1920,height:1080}});const errors=[];review.on('pageerror',e=>errors.push(e.message));await review.goto(url+'review.html');await wait(review,0);
 for(const [i,label] of [[0,'Старт 00'],[3,'Боковой 02'],[manifest.frames.findIndex(f=>f.id==='09'),'Задний 09']]){
  await review.getByRole('button',{name:label,exact:true}).click();await wait(review,i);
  for(const [grade,name]of[['none','Исходный'],['background','Только фон'],['both','Фон + автомобиль']]){
   await review.getByRole('button',{name,exact:true}).click();assert.equal(await review.locator('.stage').getAttribute('data-grade'),grade);await review.locator('.hero').screenshot({path:`${out}/grade-${manifest.frames[i].id}-${grade}.png`});
  }
 }
 await review.getByRole('button',{name:'Повторять 01 → 01b → 02',exact:true}).click();for(const id of ['01','01b','02','01b'])await review.waitForFunction(id=>document.querySelector('.stage').dataset.frameId===id,id);await review.getByRole('button',{name:'Остановить переход',exact:true}).click();
 for(const id of ['03b','05b','10b','11b','17b','21b']) {
  const n=Number(id.slice(0,2)), a=String(n).padStart(2,'0'), z=String(n+1).padStart(2,'0');
  await review.getByRole('button',{name:`Повторять ${a} → ${id} → ${z}`,exact:true}).click();
  for(const frame of [a,id,z,id])await review.waitForFunction(id=>document.querySelector('.stage').dataset.frameId===id,frame);
  await review.getByRole('button',{name:`Остановить ${id}`,exact:true}).click();
 }
 for(const width of [430,1920]) {
  await review.setViewportSize({width,height:width===430?932:1080});
  for(const id of ['02']) {
   await review.getByRole('button',{name:`Проверить ${id}`,exact:true}).click();await review.waitForFunction(id=>document.querySelector('.stage').dataset.frameId===id,id);
   for(const [name,version] of [['Крыша: до правки','previous'],['Крыша: после правки','refined']]) {
    await review.getByRole('button',{name,exact:true}).click();await review.waitForFunction(v=>document.querySelector('.stage').dataset.roofVersion===v,version);await review.locator('.sequence-image').evaluate(img=>img.decode());const imageSrc=await review.locator('.sequence-image').getAttribute('src');assert(version==='previous'?imageSrc.endsWith(previousRoof[id].file):imageSrc.startsWith('blob:'));await review.locator('.hero').screenshot({path:`${out}/roof-${width}-${id}-${version}.png`});
   }
  }
 }
 await review.getByRole('button',{name:'Повторять передние ракурсы',exact:true}).click();
 for(const id of ['19','20','21','21b','22','23','22','21b','21','20'])await review.waitForFunction(id=>document.querySelector('.stage').dataset.frameId===id,id);
 await review.getByRole('button',{name:'Остановить передние ракурсы',exact:true}).click();
 for(const [label,ids] of [['02–06',['02','03','03b','04','05','05b','06','05b','05','04','03b','03']],['14–18',['14','15','16','17','17b','18','17b','17','16','15']]]) {
  await review.getByRole('button',{name:`Повторять ${label}`,exact:true}).click();
  for(const id of ids)await review.waitForFunction(id=>document.querySelector('.stage').dataset.frameId===id,id);
  await review.getByRole('button',{name:`Остановить ${label}`,exact:true}).click();
 }
 await review.getByRole('button',{name:'Новый 01b',exact:true}).click();await wait(review,2);await review.screenshot({path:`${out}/review-desktop.png`,fullPage:true});assert.deepEqual(errors,[]);await review.close();
 const touch=await b.newPage({viewport:{width:430,height:932},isMobile:true,hasTouch:true});await touch.goto(url);await wait(touch,0);const stage=await touch.locator('.stage').boundingBox();const cdp=await touch.context().newCDPSession(touch),x=215,y=stage.y+stage.height*.7;
 await cdp.send('Input.dispatchTouchEvent',{type:'touchStart',touchPoints:[{x,y}]});await cdp.send('Input.dispatchTouchEvent',{type:'touchMove',touchPoints:[{x:x-42,y}]});await cdp.send('Input.dispatchTouchEvent',{type:'touchEnd',touchPoints:[]});await touch.waitForFunction(()=>document.querySelector('.stage').dataset.frame!=='0');await touch.close();
 results.push({gradeComparison:true,reviewThreeFrameLoop:true,newTransitionLoops:['03b','05b','10b','11b','17b','21b'],roofBeforeAfter:['02'],sideSweepsBothWays:true,frontSweepBothWays:true,touch:true});await fs.writeFile(out+'/qa-results.json',JSON.stringify({url,results},null,2));console.log(results);
}finally{await b.close()}
