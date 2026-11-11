import {chromium} from '@playwright/test';import fs from 'node:fs/promises';import assert from 'node:assert/strict';
const manifest=JSON.parse(await fs.readFile('src/sequenceManifest.json'));const out='artifacts/sequence-08';
const url=process.env.QA_URL||'http://127.0.0.1:4205/Brooklands-Hero/';const browser=await chromium.launch({executablePath:'/usr/bin/chromium',args:['--no-sandbox']});const results=[];
const wait=(p,i)=>p.waitForFunction(i=>document.querySelector('.stage').dataset.frame===String(i),i);
const next=p=>p.getByRole('button',{name:'Повернуть вправо',exact:true});
async function advance(p,last){for(let i=1;i<=last;i++){await next(p).click();await wait(p,i)}}
try{
 const p=await browser.newPage();const index=manifest.frames.findIndex(f=>f.id==='05b');let release;const gate=new Promise(r=>release=r);
 await p.route('**/midpoint-05b.webp',async r=>{await gate;await r.continue()});await p.goto(url);await wait(p,0);await advance(p,index-1);await next(p).click();await p.waitForFunction(i=>+document.querySelector('.stage').dataset.requestedFrame===i,index);assert.equal(await p.locator('.stage').getAttribute('data-frame'),String(index-1));await next(p).click();await wait(p,index+1);release();await p.waitForFunction(n=>+document.querySelector('.stage').dataset.loaded===n,manifest.frames.length);assert.equal(await p.locator('.stage').getAttribute('data-frame'),String(index+1));await p.close();results.push({delayedFrame:'05b',retainsPrevious:true,staleResponseCannotOverwriteSelection:true});
 for(const id of ['05b','11b','17b']){
  const p=await browser.newPage();let fail=true;const index=manifest.frames.findIndex(f=>f.id===id);
  await p.route(`**/midpoint-${id}.webp`,r=>fail?r.fulfill({status:503,body:'temporary'}):r.continue());await p.goto(url);await wait(p,0);await advance(p,index-1);await next(p).click();await p.getByRole('button',{name:'Повторить загрузку'}).waitFor();assert.equal(await p.locator('.stage').getAttribute('data-frame'),String(index-1));fail=false;await p.getByRole('button',{name:'Повторить загрузку'}).click();await wait(p,index);await p.locator('.sequence-image').evaluate(img=>img.decode());await p.close();results.push({id,failureAndRetry:true});
 }
 const first=await browser.newPage();let fail=true;await first.route('**/frame-00.webp',r=>fail?r.fulfill({status:503,body:'temporary'}):r.continue());await first.goto(url);await first.getByRole('button',{name:'Повторить загрузку'}).waitFor();fail=false;await first.getByRole('button',{name:'Повторить загрузку'}).click();await wait(first,0);await first.waitForFunction(n=>+document.querySelector('.stage').dataset.loaded===n,manifest.frames.length);await first.close();results.push({firstFrameRetry:true,loaded:manifest.frames.length});
 await fs.writeFile(`${out}/qa-network.json`,JSON.stringify({url,results},null,2)+'\n');console.log(results);
}finally{await browser.close()}
