import {chromium} from '@playwright/test';import fs from 'node:fs/promises';import assert from 'node:assert/strict';
const url=process.env.QA_URL||'http://127.0.0.1:4204/Brooklands-Hero/';const b=await chromium.launch({executablePath:'/usr/bin/chromium',args:['--no-sandbox']});const results=[];
try{
for(const width of [430,1920]){
 const p=await b.newPage({viewport:{width,height:width===430?932:1080}});const errors=[];p.on('pageerror',e=>errors.push(e.message));await p.goto(url+'review.html');await p.waitForFunction(()=>document.querySelector('.stage')?.dataset.frame==='0');
 for(const [name,version] of [['01b: до правки','previous'],['01b: после правки','refined']]){
  await p.getByRole('button',{name,exact:true}).click();await p.waitForFunction(version=>document.querySelector('.stage').dataset.frame==='2'&&document.querySelector('.stage').dataset.midpointVersion===version,version);await p.locator('.sequence-image').evaluate(img=>img.decode());const src=await p.locator('.sequence-image').getAttribute('src');assert.equal(src.includes('turntable-v2'),version==='previous');await p.screenshot({path:`artifacts/sequence-04/compare-${width}-${version}.png`,fullPage:true});
 }
 await p.getByRole('button',{name:'Повторять 01 → 01b → 02',exact:true}).click();
 for(const [name,version] of [['01b: до правки','previous'],['01b: после правки','refined']]){
  await p.getByRole('button',{name,exact:true}).click();assert.equal(await p.locator('.stage').getAttribute('data-midpoint-version'),version);
  for(const id of ['01','01b','02','01b'])await p.waitForFunction(id=>document.querySelector('.stage').dataset.frameId===id,id);
  assert(await p.getByRole('button',{name:'Остановить переход',exact:true}).isVisible());
 }
 await p.getByRole('button',{name:'Остановить переход',exact:true}).click();assert(await p.evaluate(()=>document.documentElement.scrollWidth<=innerWidth));assert.deepEqual(errors,[]);results.push({width,oldAndRefinedImagesDecoded:true,versionSwitchWhileLooping:true,threeFrameLoopBothWays:true,noErrors:true});await p.close();
}
await fs.writeFile('artifacts/sequence-04/qa-before-after.json',JSON.stringify({url,results},null,2));console.log(results);
}finally{await b.close()}
