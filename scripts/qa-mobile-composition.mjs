import { chromium } from '@playwright/test';
import assert from 'node:assert/strict';
import fs from 'node:fs';
const origin=process.env.QA_URL||'http://127.0.0.1:4210';
const out='artifacts/sequence-22';fs.mkdirSync(out,{recursive:true});
const browser=await chromium.launch({executablePath:'/usr/bin/chromium',args:['--no-sandbox','--disable-dev-shm-usage','--disable-gpu']});
const evidence=[];
try{
for(const [width,height] of [[320,740],[360,800],[390,844],[390,667],[440,956],[600,960],[768,1024],[844,390],[899,1000],[900,900],[1440,1000],[1920,1080]]){
 const p=await browser.newPage({viewport:{width,height},hasTouch:width<900});const errors=[];p.on('pageerror',e=>errors.push(e.message));
 await p.goto(origin);await p.locator('.stage[data-status="ready"]').waitFor();await p.evaluate(()=>document.fonts.ready);
 const geometry=await p.evaluate(()=>{const box=s=>{const r=document.querySelector(s).getBoundingClientRect();return{x:r.x,y:r.y,w:r.width,h:r.height,b:r.bottom}};return{overflow:document.documentElement.scrollWidth>innerWidth,header:box('header'),intro:box('.intro'),stage:box('.stage'),presets:box('.presets'),rotation:box('.rotation'),headline:document.querySelector('h1').innerText,buttons:[...document.querySelectorAll('.preset,.rotation button,.menu-toggle,.city-toggle,.cta')].filter(e=>e.getBoundingClientRect().width).map(e=>({label:e.getAttribute('aria-label')||e.textContent.trim(),height:e.getBoundingClientRect().height}))}});
 assert(!geometry.overflow,`overflow ${width}`);assert(errors.length===0,errors.join(';'));
 if(width<900){assert(geometry.intro.b<=geometry.stage.y+1);assert(geometry.stage.b<=geometry.presets.y+1);assert(geometry.presets.b<geometry.rotation.y);assert(geometry.buttons.every(e=>e.height>=44));}
 await p.screenshot({path:`${out}/hero-${width}-${height}.png`,fullPage:true});
 if(width<900){
  await p.getByRole('button',{name:'Открыть меню',exact:true}).click();assert(await p.locator('nav').isVisible());await p.locator('nav .mobile-booking').click();assert(await p.getByRole('status').isVisible());await p.getByRole('button',{name:'Закрыть сообщение'}).click();
  await p.locator('.city-toggle').click();await p.getByRole('menuitemradio',{name:'Дубай'}).click();assert.equal(await p.locator('.header-phone').getAttribute('href'),'tel:+971581740055');assert.equal(await p.locator('.stage').getAttribute('data-frame'),'0');
  for(const [id,label] of [['carmine','Carmine'],['oak-green','Oak Green'],['silver','Silver']]){await p.getByRole('button',{name:label,exact:true}).click();await p.waitForFunction(id=>document.querySelector('.stage').dataset.preset===id,id);}
  await p.getByRole('button',{name:'Повернуть вправо',exact:true}).click();await p.waitForFunction(()=>document.querySelector('.stage').dataset.frame==='1');
  await p.locator('.stage').scrollIntoViewIfNeeded();const r=await p.locator('.stage').boundingBox();const cdp=await p.context().newCDPSession(p);await cdp.send('Input.dispatchTouchEvent',{type:'touchStart',touchPoints:[{x:r.x+r.width*.7,y:r.y+r.height*.5}]});await cdp.send('Input.dispatchTouchEvent',{type:'touchMove',touchPoints:[{x:r.x+r.width*.3,y:r.y+r.height*.5}]});await cdp.send('Input.dispatchTouchEvent',{type:'touchEnd',touchPoints:[]});await cdp.detach();await p.waitForFunction(()=>document.querySelector('.stage').dataset.frame!=='1' && document.querySelector('.stage').dataset.buffering==='false');
  assert.equal(errors.length,0,errors.join(';'));const swipeFrame=await p.locator('.stage').getAttribute('data-frame');assert.notEqual(swipeFrame,'1');
  // Check keyboard navigation and popup escape without resetting the selected material/angle.
  await p.locator('.menu-toggle').focus();await p.keyboard.press('Enter');await p.locator('nav button').first().focus();await p.keyboard.press('Escape');assert.equal(await p.locator('.menu-toggle').getAttribute('aria-expanded'),'false');
 }
 evidence.push({width,height,...geometry,interactions:width<900?'menu, booking, city/phone, 3 materials, arrows, Chromium touch swipe, keyboard Escape':'desktop render',errors});await p.close();
}
// Same Chromium session and viewport: desktop pixels with and without the new mobile stylesheet.
const p=await browser.newPage({viewport:{width:1440,height:1000}});await p.goto(origin);await p.locator('.stage[data-status="ready"]').waitFor();await p.evaluate(()=>document.fonts.ready);await p.screenshot({path:`${out}/desktop-after.png`});await p.evaluate(()=>{const style=document.querySelector('style[data-vite-dev-id$="/src/mobile.css"]');if(!style)throw Error('missing mobile stylesheet');style.textContent='.mobile-booking{display:none}';});await p.screenshot({path:`${out}/desktop-before.png`});
assert(fs.readFileSync(`${out}/desktop-before.png`).equals(fs.readFileSync(`${out}/desktop-after.png`)),'desktop pixel regression');
fs.writeFileSync(`${out}/qa.json`,JSON.stringify({baseline:'0ff24cb',mode:'LOCAL_PATCH',locked:'desktop composition, copy, imagery, material colors and interactions',editable:'mobile layout below 900px; shared image calibration only within mobile stage',viewports:evidence,desktopPixelIdentical:true,impeccable:'not_connected',playwriter:'not_connected'},null,2)+'\n');console.log('PASS: 12 viewports, 9 mobile interaction scenarios, identical desktop pixels');
}finally{await browser.close();}
