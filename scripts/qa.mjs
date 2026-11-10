import { chromium } from '@playwright/test';
import assert from 'node:assert/strict';
import { mkdir, writeFile } from 'node:fs/promises';
const base=process.env.QA_URL||'http://127.0.0.1:5173';
const browser=await chromium.launch({executablePath:process.env.CHROMIUM_PATH||'/usr/bin/chromium',headless:true,args:['--no-sandbox','--use-angle=swiftshader','--enable-unsafe-swiftshader']});
await mkdir('artifacts',{recursive:true});
const results=[];
try{
 for(const [width,height] of [[320,812],[430,932],[1440,900],[1536,864],[1920,1080],[2048,1152]].filter(([w])=>!process.env.QA_WIDTHS||process.env.QA_WIDTHS.split(',').map(Number).includes(w))){
  const page=await browser.newPage({viewport:{width,height}});
  const errors=[],requests=[];page.on('pageerror',e=>errors.push(e.message));page.on('console',m=>{if(m.type()==='error')errors.push(m.text());});page.on('request',r=>requests.push(r.url()));
  await page.goto(base);await page.waitForSelector('.stage[data-status="ready"]');await page.waitForTimeout(1200);
  assert.equal(await page.locator('h1').count(),1);
  assert.equal(await page.evaluate(()=>document.documentElement.scrollWidth<=innerWidth),true,'horizontal overflow');
  const h1=await page.locator('h1').boundingBox();assert(h1.x>=0&&h1.x+h1.width<=width);
  assert(requests.some(u=>u.endsWith('/assets/model.glb')));assert(!requests.some(u=>u.includes('hero-approved')));
  const camera=await page.locator('.stage').getAttribute('data-camera');
  const initial=Number(await page.locator('.stage').getAttribute('data-angle'));
  await page.screenshot({path:`artifacts/hero-${width}x${height}.png`,fullPage:true});
  // Sample all eight eighth-turns; projected world bounding box is conservative.
  const fits=[];
  for(let i=0;i<8;i++){
   await page.getByRole('button',{name:'Повернуть вправо'}).click();await page.waitForFunction(target=>Math.abs(Number(document.querySelector('.stage').dataset.angle)-target)<.01,initial+(i+1)*Math.PI/4,{timeout:15000});
   const b=JSON.parse(await page.locator('.stage').getAttribute('data-bounds'));fits.push(b);
   assert(b.minX>=-1&&b.maxX<=1&&b.minY>=-1&&b.maxY<=1,`model clipped ${width}: ${JSON.stringify(b)}`);
  }
  const full=Number(await page.locator('.stage').getAttribute('data-angle'));assert(Math.abs(full-initial-2*Math.PI)<.03,'full revolution');
  assert.equal(await page.locator('.stage').getAttribute('data-camera'),camera,'camera moved');
  const stage=await page.locator('.stage').boundingBox();
  const x=stage.x+stage.width*.4,y=stage.y+stage.height*.6;
  await page.mouse.move(x,y);await page.mouse.down();await page.mouse.move(x+180,y,{steps:10});await page.mouse.up();await page.waitForFunction(target=>Math.abs(Number(document.querySelector('.stage').dataset.angle)-target)<.02,full+2.16,{timeout:15000});
  const dragged=Number(await page.locator('.stage').getAttribute('data-angle'));assert(dragged-full>2,'mouse drag');
  await page.mouse.move(x+180,y);await page.mouse.down();await page.mouse.move(x,y,{steps:10});await page.mouse.up();await page.waitForFunction(target=>Math.abs(Number(document.querySelector('.stage').dataset.angle)-target)<.02,full,{timeout:15000});
  assert(Math.abs(Number(await page.locator('.stage').getAttribute('data-angle'))-full)<.05,'reverse drag');
  await page.getByRole('button',{name:'Повернуть влево'}).focus();await page.keyboard.press('Enter');await page.waitForFunction(target=>Math.abs(Number(document.querySelector('.stage').dataset.angle)-target)<.02,full-Math.PI/4,{timeout:15000});
  assert(Number(await page.locator('.stage').getAttribute('data-angle'))<full-.7,'keyboard');
  assert.deepEqual(errors,[]);
  results.push({viewport:`${width}x${height}`,status:'PASS',checks:['GLB','no overflow','H1 visible','full 360 via buttons','mouse both directions','keyboard','model bounds at 8 angles','fixed camera','no reference image request','no console errors']});
  await page.close();
 }
 // Actual touch input through Chrome DevTools, including scrolling outside stage.
 const page=await browser.newPage({viewport:{width:430,height:932},isMobile:true,hasTouch:true});
 await page.goto(base);await page.waitForSelector('.stage[data-status="ready"]');await page.locator('.stage').scrollIntoViewIfNeeded();await page.waitForTimeout(500);
 const rect=await page.locator('.stage').boundingBox();const before=Number(await page.locator('.stage').getAttribute('data-angle'));
 const cdp=await page.context().newCDPSession(page);const tx=rect.x+80,ty=rect.y+rect.height/2;
 await cdp.send('Input.dispatchTouchEvent',{type:'touchStart',touchPoints:[{x:tx,y:ty}]});
 for(let i=1;i<=10;i++)await cdp.send('Input.dispatchTouchEvent',{type:'touchMove',touchPoints:[{x:tx+i*20,y:ty}]});
 await cdp.send('Input.dispatchTouchEvent',{type:'touchEnd',touchPoints:[]});await page.waitForFunction(target=>Math.abs(Number(document.querySelector('.stage').dataset.angle)-target)<.02,before+2.4,{timeout:15000});
 assert(Number(await page.locator('.stage').getAttribute('data-angle'))>before+2,'touch drag');
 await page.evaluate(()=>scrollTo(0,0));await cdp.send('Input.dispatchTouchEvent',{type:'touchStart',touchPoints:[{x:30,y:360}]});
 for(let i=1;i<=8;i++)await cdp.send('Input.dispatchTouchEvent',{type:'touchMove',touchPoints:[{x:30,y:360-i*30}]});
 await cdp.send('Input.dispatchTouchEvent',{type:'touchEnd',touchPoints:[]});await page.waitForTimeout(500);assert(await page.evaluate(()=>scrollY)>0,'outside stage scroll');
 results.push({check:'touch drag and outside-stage vertical scrolling',status:'PASS'});await page.close();
 const fallback=await browser.newPage();await fallback.addInitScript(()=>{HTMLCanvasElement.prototype.getContext=function(){return null;};});await fallback.goto(base);await fallback.waitForSelector('.stage[data-status="unavailable"]');await fallback.screenshot({path:'artifacts/fallback.png'});results.push({check:'WebGL fallback',status:'PASS'});await fallback.close();
 const reduced=await browser.newPage({reducedMotion:'reduce'});await reduced.goto(base);await reduced.waitForSelector('.stage[data-status="ready"]');await reduced.waitForTimeout(300);const a=await reduced.locator('.stage').getAttribute('data-angle');await reduced.waitForTimeout(600);assert.equal(await reduced.locator('.stage').getAttribute('data-angle'),a);results.push({check:'reduced motion, no auto rotation',status:'PASS'});await reduced.close();
}catch(e){results.push({status:'FAIL',error:e.stack});process.exitCode=1;}
finally{await writeFile(process.env.QA_RESULTS_PATH||'artifacts/qa-results.json',JSON.stringify(results,null,2));console.log(JSON.stringify(results,null,2));await browser.close();}
