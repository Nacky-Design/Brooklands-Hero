import { chromium } from '@playwright/test';
import assert from 'node:assert/strict';
import {writeFile} from 'node:fs/promises';
const browser=await chromium.launch({executablePath:'/usr/bin/chromium',headless:true,args:['--no-sandbox','--use-angle=swiftshader','--enable-unsafe-swiftshader']});
const results=[];
try {
 const page=await browser.newPage({viewport:{width:1440,height:900}});
 const errors=[];page.on('pageerror',e=>errors.push(e.message));page.on('console',m=>{if(m.type()==='error')errors.push(m.text());});
 const url=process.env.QA_LOADING_URL||'http://127.0.0.1:4180/Brooklands-Hero/';
 await page.goto(url);await page.waitForSelector('.stage[data-status="ready"]');
 const loading=await page.evaluate(()=>({readyMs:performance.now(),resources:performance.getEntriesByType('resource').filter(x=>/model.glb|\.js$/.test(x.name)).map(x=>({url:x.name,startMs:x.startTime,durationMs:x.duration,bytes:x.transferSize,initiator:x.initiatorType}))}));
 const models=loading.resources.filter(r=>r.url.endsWith('model.glb'));
 assert.equal(models.length,1,'GLB must not be fetched twice');assert.equal(models[0].initiator,'link','GLB starts from HTML preload');
 results.push({check:'Early GLB request reused by GLTFLoader',status:'PASS',...loading});
 if(process.env.QA_LOADING_DEV){
  await page.waitForTimeout(1500);const frames=await page.locator('.stage').getAttribute('data-frames');
  await page.waitForTimeout(1000);assert.equal(await page.locator('.stage').getAttribute('data-frames'),frames,'idle scene keeps rendering');
  results.push({check:'Idle scene has no animation frames',status:'PASS'});
  await page.evaluate(()=>{window.__probes=0;const old=HTMLCanvasElement.prototype.getContext;HTMLCanvasElement.prototype.getContext=function(type,...args){if(type==='webgl2')window.__probes++;return old.call(this,type,...args);};});
  for(let i=0;i<4;i++){await page.getByRole('button',{name:'Обсудить проект'}).click();await page.getByRole('button',{name:'Закрыть сообщение'}).click();}
  assert.equal(await page.evaluate(()=>window.__probes),0,'UI updates leak WebGL contexts');
  results.push({check:'UI rerenders create no extra WebGL probes',status:'PASS'});
 }
 const before=Number(await page.locator('.stage').getAttribute('data-angle'));
 await page.getByRole('button',{name:'Повернуть вправо'}).click();await page.waitForFunction(a=>Number(document.querySelector('.stage').dataset.angle)>a+.7,before,{timeout:15000});
 await page.mouse.move(650,650);await page.mouse.down();await page.mouse.move(850,650,{steps:6});await page.mouse.up();await page.waitForFunction(a=>Number(document.querySelector('.stage').dataset.angle)>a+2,before,{timeout:15000});
 assert.deepEqual(errors,[]);results.push({check:'Demand rendering wakes on buttons and drag; no errors',status:'PASS'});
} catch(e){results.push({status:'FAIL',error:e.stack});process.exitCode=1;}finally{console.log(JSON.stringify(results,null,2));await writeFile(process.env.QA_LOADING_DEV?'artifacts/qa-loading-dev.json':'artifacts/qa-loading-production.json',JSON.stringify(results,null,2));await browser.close();}
