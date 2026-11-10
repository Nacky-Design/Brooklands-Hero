import {chromium} from '@playwright/test';
import assert from 'node:assert/strict';
import {writeFile} from 'node:fs/promises';
const browser=await chromium.launch({executablePath:process.env.CHROMIUM_PATH||'/usr/bin/chromium',headless:true,args:['--no-sandbox','--use-angle=swiftshader','--enable-unsafe-swiftshader']});
const results=[];
try {
 const page=await browser.newPage({viewport:{width:1920,height:1080}});const errors=[];
 page.on('pageerror',e=>errors.push(e.message));page.on('console',m=>{if(m.type()==='error')errors.push(m.text());});
 await page.goto('http://127.0.0.1:5173');await page.waitForSelector('.stage[data-status="ready"]');await page.waitForTimeout(1000);
 const clips=[{x:32,y:600,width:64,height:128},{x:800,y:100,width:80,height:40},{x:1380,y:100,width:100,height:80}];
 const before=[];for(const clip of clips)before.push(await page.screenshot({clip}));
 const initial=Number(await page.locator('.stage').getAttribute('data-angle'));
 const camera=await page.locator('.stage').getAttribute('data-camera');
 for(let i=0;i<2;i++)await page.getByRole('button',{name:'Повернуть вправо'}).click();
 await page.waitForFunction(target=>Math.abs(Number(document.querySelector('.stage').dataset.angle)-target)<.0002,initial+Math.PI/2,{timeout:15000});
 await page.screenshot({path:'artifacts/architecture-01/rotated-1920x1080.png'});
 for(let i=0;i<clips.length;i++)assert(before[i].equals(await page.screenshot({clip:clips[i]})),`architecture pixels changed in region ${i}`);
 assert.equal(await page.locator('.stage').getAttribute('data-camera'),camera);
 assert.deepEqual(errors,[]);
 results.push({check:'Wall, ceiling and aperture pixels identical after car rotates 90 degrees; camera fixed',status:'PASS'});
 await page.waitForTimeout(1000);const frames=await page.locator('.stage').getAttribute('data-frames');const shadows=await page.locator('.stage').getAttribute('data-shadow-updates');
 await page.waitForTimeout(1000);assert.equal(await page.locator('.stage').getAttribute('data-frames'),frames);assert.equal(await page.locator('.stage').getAttribute('data-shadow-updates'),shadows);
 results.push({check:'No continuous architecture or contact-shadow rendering at rest',status:'PASS'});
} catch(e){results.push({status:'FAIL',error:e.stack});process.exitCode=1;}finally{console.log(JSON.stringify(results,null,2));await writeFile('artifacts/architecture-01/qa-static.json',JSON.stringify(results,null,2));await browser.close();}
