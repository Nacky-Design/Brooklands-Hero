import { chromium } from '@playwright/test';
import assert from 'node:assert/strict';
import fs from 'node:fs/promises';
const audit=JSON.parse(await fs.readFile('artifacts/sequence-02/audit.json'));
const out='artifacts/sequence-02';const url=process.env.QA_URL||'http://127.0.0.1:4201/Brooklands-Hero/';
const browser=await chromium.launch({executablePath:process.env.CHROMIUM_PATH||'/usr/bin/chromium',args:['--no-sandbox']});
const results=[];
try {
 for(const [width,height] of [[320,812],[430,932],[900,760],[1440,900],[1536,864],[1920,1080],[2048,1152]]){
  const page=await browser.newPage({viewport:{width,height}}),errors=[];page.on('pageerror',e=>errors.push(e.message));
  await page.goto(url);await page.waitForFunction(()=>document.querySelector('.stage')?.dataset.loaded==='24');
  let firstGround=null,minHeight=Infinity,maxHeight=0;
  for(const f of audit.frames){
   await page.waitForFunction(i=>document.querySelector('.stage').dataset.frame===String(i),f.index);
   await page.locator('.sequence-image').evaluate(img=>img.decode());
   const geometry=await page.evaluate(()=>{const box=document.querySelector('.sequence').getBoundingClientRect(),stage=document.querySelector('.stage').getBoundingClientRect(),img=document.querySelector('.sequence-image');return{box:{x:box.x,y:box.y,width:box.width,height:box.height},stage:{x:stage.x,y:stage.y,width:stage.width,height:stage.height},image:(()=>{const r=img.getBoundingClientRect();return {x:r.x,y:r.y,width:r.width,height:r.height}})(),transform:getComputedStyle(img).transform};});
   const {box,stage,image}=geometry;const v=f.correctedVisible;
   if(width>=900){const presets=await page.locator('.presets').boundingBox();assert(box.x+v.right*box.width<=presets.x-19,`frame${f.index} preset overlap ${width}`);}
   assert(Math.abs(image.x-(box.x+f.dx*box.width))<.1);
   assert(Math.abs(image.y-(box.y+f.dy*box.height))<.1);
   assert(box.x+v.left*box.width>=stage.x-1,`frame${f.index} left ${width}`);
   assert(box.x+v.right*box.width<=stage.x+stage.width+1,`frame${f.index} right ${width}`);
   assert(box.y+v.top*box.height>=stage.y-1,`frame${f.index} top ${width}`);
   assert(box.y+v.bottom*box.height<=stage.y+stage.height+1,`frame${f.index} bottom ${width}`);
   const actual=geometry.transform.match(/matrix\(([^)]+)\)/)[1].split(',').map(Number);
   assert(Math.abs(actual[0]-f.scale)<.00001);assert(Math.abs(actual[3]-f.scale)<.00001);
   const ground=image.y-stage.y+f.groundY/f.height*image.height;
   firstGround??=ground;assert(Math.abs(ground-firstGround)<.1);
   const silhouetteHeight=(f.correctedSolid.bottom-f.correctedSolid.top)*box.height;minHeight=Math.min(minHeight,silhouetteHeight);maxHeight=Math.max(maxHeight,silhouetteHeight);
   if([320,430,1920].includes(width)&&[0,2,3,9,14,15,21,23].includes(f.index))await page.screenshot({path:`${out}/hero-${width}x${height}-frame${String(f.index).padStart(2,'0')}.png`,fullPage:true});
   await page.getByRole('button',{name:'Повернуть вправо',exact:true}).click();
  }
  await page.waitForFunction(()=>document.querySelector('.stage').dataset.frame==='0');assert(await page.evaluate(()=>document.documentElement.scrollWidth<=innerWidth));assert.deepEqual(errors,[]);
  results.push({viewport:`${width}x${height}`,all24Visible:true,uniformScale:true,groundStable:true,maxOverMinSilhouetteHeight:maxHeight/minHeight});await page.close();
 }
 await fs.writeFile(`${out}/qa-calibration.json`,JSON.stringify({url,results},null,2));console.log(JSON.stringify(results,null,2));
}finally{await browser.close()}
