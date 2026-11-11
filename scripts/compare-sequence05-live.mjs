import {chromium} from '@playwright/test';
import fs from 'node:fs/promises';
import assert from 'node:assert/strict';
import {createRequire} from 'node:module';
const require=createRequire('/workspace/.brooklands-toolchain/package.json');
const sharp=require('sharp');
const out='artifacts/sequence-05/deployment';await fs.mkdir(out,{recursive:true});
const browser=await chromium.launch({executablePath:'/usr/bin/chromium',args:['--no-sandbox']});
const results=[];
try {
 for(const width of [430,1920]) {
  const captures={};
  for(const [version,port,count] of [['published',4206,25],['candidate',4205,28]]) {
   if(process.env.COMPARE_REUSE==='1'){captures[version]={};for(const id of ['00','01b','03','04','10','11','21','22'])captures[version][id]=`${out}/${version}-${width}-${id}.png`;continue;}
   const p=await browser.newPage({viewport:{width,height:width===430?932:1080}});const errors=[];p.on('pageerror',e=>errors.push(e.message));
   await p.goto(`http://127.0.0.1:${port}/Brooklands-Hero/`);await p.waitForFunction(n=>+document.querySelector('.stage').dataset.loaded===n,count);await p.evaluate(()=>document.fonts.ready);
   captures[version]={};
   for(let i=0;i<count;i++) {
    await p.waitForFunction(i=>document.querySelector('.stage').dataset.frame===String(i),i);
    await p.locator('.sequence-image').evaluate(img=>img.decode());
    const id=await p.locator('.stage').getAttribute('data-frame-id');
    if(['00','01b','03','04','10','11','21','22','03b','10b','21b'].includes(id)) {
     const path=`${out}/${version}-${width}-${id}.png`;await p.screenshot({path,fullPage:true});captures[version][id]=path;
    }
    await p.getByRole('button',{name:'Повернуть вправо',exact:true}).click();
   }
   assert.deepEqual(errors,[]);await p.close();
  }
  for(const id of ['00','01b','03','04','10','11','21','22']) {
   const a=await sharp(captures.published[id]).raw().toBuffer(), b=await sharp(captures.candidate[id]).raw().toBuffer();
   assert.equal(a.length,b.length);let changed=0,maxDelta=0;for(let i=0;i<a.length;i++)if(a[i]!==b[i]){changed++;maxDelta=Math.max(maxDelta,Math.abs(a[i]-b[i]));const px=Math.floor(i/3),x=px%width,y=Math.floor(px/width);assert(width===1920&&x<400&&y<550,`${width}/${id}: change outside intro`);}
   // Permit only tiny browser raster differences in intro edges, never changes in the car.
   assert(changed<=100&&maxDelta<=32,`${width}/${id}: existing composition changed`);results.push({width,id,changedChannels:changed,maxDelta,carUnchanged:true});
  }
 }
 await fs.writeFile(`${out}/comparison.json`,JSON.stringify({publishedCommit:'89e22da6c2d567b17872946ba69de4c6d9a81276',comparison:'Published gh-pages build served locally; public URL blocked by proxy',results},null,2));console.log(results);
}finally{await browser.close()}
