import {chromium} from '@playwright/test';
import assert from 'node:assert/strict';
import {writeFile} from 'node:fs/promises';
const browser=await chromium.launch({executablePath:process.env.CHROMIUM_PATH||'/usr/bin/chromium',headless:true,args:['--no-sandbox','--use-angle=swiftshader','--enable-unsafe-swiftshader']});
const results=[];
try{
 const page=await browser.newPage({viewport:{width:430,height:932}});const errors=[];
 page.on('pageerror',e=>errors.push(e.message));page.on('console',m=>{if(m.type()==='error')errors.push(m.text());});
 await page.goto('http://127.0.0.1:5173');await page.waitForSelector('.stage[data-status="ready"]');await page.waitForTimeout(1000);
 const updates=()=>page.locator('.stage').getAttribute('data-shadow-updates');
 const first=Number(await updates());assert(first>0,'contact projection was not rendered');
 await page.waitForTimeout(1000);assert.equal(Number(await updates()),first,'shadow renders in idle');
 results.push({check:'Contact projection rendered; idle projection cached',status:'PASS',updates:first});
 const angle=Number(await page.locator('.stage').getAttribute('data-angle'));
 await page.getByRole('button',{name:'Повернуть вправо'}).click();
 await page.waitForFunction(target=>Math.abs(Number(document.querySelector('.stage').dataset.angle)-target)<.0002,angle+Math.PI/4,{timeout:15000});
 assert(Number(await updates())>first,'shadow did not follow car rotation');
 await page.screenshot({path:'artifacts/shadow-01/rotated-430x932.png',fullPage:true});
 await page.waitForTimeout(800);const stopped=Number(await updates());await page.waitForTimeout(800);assert.equal(Number(await updates()),stopped,'projection did not stop with car');
 results.push({check:'Shadow follows rotation and stops updating after damping',status:'PASS',updates:stopped});
 assert.deepEqual(errors,[]);results.push({check:'Depth, blur and main shaders have no console errors',status:'PASS'});
 // Actual renderer context loss must leave a readable fallback, not a blank canvas.
 await page.evaluate(()=>document.querySelector('.stage canvas').getContext('webgl2').getExtension('WEBGL_lose_context').loseContext());
 await page.waitForSelector('.stage[data-status="unavailable"]');assert(await page.locator('.fallback').isVisible());
 results.push({check:'Context loss shows fallback',status:'PASS'});
}catch(e){results.push({status:'FAIL',error:e.stack});process.exitCode=1;}finally{await writeFile('artifacts/shadow-01/qa-shadow.json',JSON.stringify(results,null,2));console.log(JSON.stringify(results,null,2));await browser.close();}
