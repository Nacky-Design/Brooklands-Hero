import {chromium} from '@playwright/test';
import assert from 'node:assert/strict';
import {writeFile} from 'node:fs/promises';
const browser=await chromium.launch({executablePath:process.env.CHROMIUM_PATH||'/usr/bin/chromium',headless:true,args:['--no-sandbox','--use-angle=swiftshader','--enable-unsafe-swiftshader']});
const results=[];
try{
 const page=await browser.newPage({viewport:{width:1920,height:1080}});
 await page.goto('http://127.0.0.1:5173');await page.waitForSelector('.stage[data-status="ready"]');
 const before=Number(await page.locator('.stage').getAttribute('data-angle'));
 const wall=await page.screenshot({clip:{x:1000,y:130,width:160,height:160}});
 for(let i=0;i<3;i++){await page.mouse.move(800,700);await page.mouse.down();await page.mouse.move(1000,700,{steps:8});await page.mouse.up();}
 await page.waitForFunction(a=>Number(document.querySelector('.stage').dataset.angle)>a+7,before,{timeout:15000});
 const after=Number(await page.locator('.stage').getAttribute('data-angle'));assert(after-before>2*Math.PI);
 assert(wall.equals(await page.screenshot({clip:{x:1000,y:130,width:160,height:160}})),'wall pixels changed');
 await page.screenshot({path:'artifacts/rotated-1920x1080.png'});
 const timing=await page.evaluate(()=>new Promise(resolve=>{const times=[];let prev=performance.now();function tick(now){times.push(now-prev);prev=now;if(times.length<30)requestAnimationFrame(tick);else resolve({frames:30,averageMs:times.reduce((a,b)=>a+b)/times.length,maxMs:Math.max(...times)});}requestAnimationFrame(tick);}));
 results.push({check:'Full revolution by actual mouse drag; identical wall pixels',status:'PASS',rotationRadians:after-before});
 results.push({check:'Frame timing in headless software Chromium (not physical GPU performance)',status:'MEASURED',...timing});await page.close();
 const broken=await browser.newPage();await broken.route('**/assets/model.glb',r=>r.fulfill({status:404,body:'Not found'}));await broken.goto('http://127.0.0.1:5173');await broken.waitForSelector('.stage[data-status="unavailable"]');results.push({check:'Missing GLB shows fallback',status:'PASS'});await broken.close();
 const prod=await browser.newPage();const errors=[];prod.on('pageerror',e=>errors.push(e.message));await prod.goto('http://127.0.0.1:4173');await prod.waitForSelector('.stage[data-status="ready"]');assert.deepEqual(errors,[]);results.push({check:'Production preview renders GLB',status:'PASS'});await prod.close();
}catch(e){results.push({status:'FAIL',error:e.stack});process.exitCode=1;}finally{await writeFile('artifacts/qa-extra-results.json',JSON.stringify(results,null,2));console.log(JSON.stringify(results,null,2));await browser.close();}
