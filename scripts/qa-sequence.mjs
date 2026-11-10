import { chromium } from '@playwright/test';
import assert from 'node:assert/strict';
import fs from 'node:fs/promises';
const out=process.env.QA_RESULTS_DIR||'artifacts/sequence-01'; await fs.mkdir(out,{recursive:true});
const browser=await chromium.launch({executablePath:process.env.CHROMIUM_PATH||'/usr/bin/chromium',args:['--no-sandbox']});
const url=process.env.QA_URL||'http://127.0.0.1:5173/';
const results=[];
const waitFrame=(p,i)=>p.waitForFunction(i=>document.querySelector('.stage')?.dataset.frame===String(i),i);
try {
for(const [width,height] of [[320,812],[430,932],[1440,900],[1536,864],[1920,1080],[2048,1152]]){
 const page=await browser.newPage({viewport:{width,height}}); const errors=[],requests=[];
 page.on('pageerror',e=>errors.push(e.message));page.on('request',r=>requests.push(r.url()));
 await page.goto(url); await waitFrame(page,0);
 await page.waitForFunction(()=>document.querySelector('.stage').dataset.loaded==='24');
 assert.equal(await page.locator('h1').count(),1); assert.equal(await page.locator('canvas').count(),0);
 assert(await page.evaluate(()=>document.documentElement.scrollWidth<=innerWidth));
 for(let i=1;i<=24;i++){await page.getByRole('button',{name:'Повернуть вправо',exact:true}).click();await waitFrame(page,i%24);}
 await page.screenshot({path:`${out}/hero-${width}x${height}.png`,fullPage:true});
 const box=await page.locator('.sequence').boundingBox(),stage=await page.locator('.stage').boundingBox();
 assert(box.x>=stage.x-1 && box.x+box.width<=stage.x+stage.width+1);
 assert(box.y>=stage.y-1 && box.y+box.height<=stage.y+stage.height+1);
 await page.locator('.stage').focus(); await page.keyboard.press('ArrowLeft');await waitFrame(page,23);
 if(width===1920)await page.screenshot({path:`${out}/hero-frame23-1920x1080.png`});
 await page.keyboard.press('Home');await waitFrame(page,0);
 await page.mouse.move(stage.x+stage.width*.5,stage.y+stage.height*.7);await page.mouse.down();await page.mouse.move(stage.x+stage.width*.5-48,stage.y+stage.height*.7,{steps:4});await page.mouse.up();
 await page.waitForFunction(()=>document.querySelector('.stage').dataset.frame!=='0');
 assert(!requests.some(r=>/\.glb(?:$|\?)/.test(r)));assert.deepEqual(errors,[]);
 results.push({viewport:`${width}x${height}`,pass:true,all24Frames:true,wrap:true,keyboard:true,mouse:true,noGLB:true});await page.close();
}
// Delay all remaining frames: first frame must render independently and remain visible while waiting.
const page=await browser.newPage();let release;const gate=new Promise(r=>release=r);
await page.route('**/turntable-v1/frame-*.webp',async route=>{if(!route.request().url().endsWith('frame-00.webp'))await gate;await route.continue();});
await page.goto(url);await waitFrame(page,0);await page.getByRole('button',{name:'Повернуть вправо',exact:true}).click();
await page.waitForFunction(()=>document.querySelector('.stage').dataset.buffering==='true');assert.equal(await page.locator('.stage').getAttribute('data-frame'),'0');
release();await waitFrame(page,1);await page.close();results.push({firstFrameIndependent:true,retainsFrameWhileLoading:true});
// Fail the initial asset once and prove retry also resumes background loading.
const retry=await browser.newPage();let fail=true;
await retry.route('**/turntable-v1/frame-00.webp',route=>fail?route.fulfill({status:503,body:'temporary'}):route.continue());
await retry.goto(url);await retry.getByRole('button',{name:'Повторить загрузку'}).waitFor();fail=false;
await retry.getByRole('button',{name:'Повторить загрузку'}).click();await waitFrame(retry,0);await retry.waitForFunction(()=>document.querySelector('.stage').dataset.loaded==='24');await retry.close();results.push({initialFailureAndRetry:true});
// A missing angle must keep the previous image and allow retry.
const missing=await browser.newPage();let missingAngle=true;
await missing.route('**/turntable-v1/frame-01.webp',route=>missingAngle?route.fulfill({status:404,body:'missing'}):route.continue());
await missing.goto(url);await waitFrame(missing,0);await missing.getByRole('button',{name:'Повернуть вправо',exact:true}).click();await missing.getByRole('button',{name:'Повторить загрузку'}).waitFor();assert.equal(await missing.locator('.stage').getAttribute('data-frame'),'0');missingAngle=false;
await missing.getByRole('button',{name:'Повторить загрузку'}).click();await waitFrame(missing,1);await missing.close();results.push({missingAngleRetainsFrameAndRetries:true});
const touch=await browser.newPage({viewport:{width:430,height:932},hasTouch:true,isMobile:true});await touch.goto(url);await waitFrame(touch,0);
const cdp=await touch.context().newCDPSession(touch),b=await touch.locator('.stage').boundingBox();const x=215,y=b.y+b.height*.7;
await cdp.send('Input.dispatchTouchEvent',{type:'touchStart',touchPoints:[{x,y}]});await cdp.send('Input.dispatchTouchEvent',{type:'touchMove',touchPoints:[{x:x-45,y}]});await cdp.send('Input.dispatchTouchEvent',{type:'touchEnd',touchPoints:[]});await touch.waitForFunction(()=>document.querySelector('.stage').dataset.frame!=='0');await touch.close();results.push({touchDrag:true});
await fs.writeFile(`${out}/qa-results.json`,JSON.stringify({url,results},null,2));console.log(JSON.stringify(results,null,2));
}finally{await browser.close();}
