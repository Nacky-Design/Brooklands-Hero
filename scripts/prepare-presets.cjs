const fs=require('fs'),sharp=require('sharp'),crypto=require('crypto');
const manifest=JSON.parse(fs.readFileSync('src/sequenceManifest.json'));
const auditPath='artifacts/sequence-18/assets.json';
const audit=fs.existsSync(auditPath)?JSON.parse(fs.readFileSync(auditPath)):[];
const hash=p=>crypto.createHash('sha256').update(fs.readFileSync(p)).digest('hex');
function bounds(data,threshold){let left=1672,right=0,top=941,bottom=0;for(let y=0;y<941;y++)for(let x=0;x<1672;x++)if(data[(y*1672+x)*4+3]>threshold){left=Math.min(left,x);right=Math.max(right,x+1);top=Math.min(top,y);bottom=Math.max(bottom,y+1)}return{left,right,top,bottom}}
(async()=>{
for(const preset of ['carmine','oak-green']){
 for(const f of manifest.frames){
  const source=f.id==='00'?`references/sequence-17/${preset}-00.png`:`references/sequence-18/${preset}-${f.id}.png`;
  if(!fs.existsSync(source))continue;
  const sha256=hash(source),file=`assets/presets/${preset}/frame-${f.id}.webp`;
  if(audit.some(a=>a.preset===preset&&a.id===f.id&&a.sha256===sha256&&a.auditVersion===2)&&fs.existsSync(`public/${file}`))continue;
  const meta=await sharp(source).metadata();
  if(!meta.hasAlpha||meta.width>1673||meta.width<1670||meta.height>943||meta.height<940)throw Error(`Unexpected canvas ${source}: ${meta.width}x${meta.height}`);
  if(f.id==='00')fs.copyFileSync(`public/assets/presets-preview/${preset}-00.webp`,`public/${file}`);
  else {
   if(meta.width>1672||meta.height>941){const raw=await sharp(source).ensureAlpha().raw().toBuffer();for(let y=0;y<meta.height;y++)for(let x=0;x<meta.width;x++)if((x>=1672||y>=941)&&raw[(y*meta.width+x)*4+3]>0)throw Error(`Nontransparent excess border: ${source}`);}
   const width=Math.min(meta.width,1672),height=Math.min(meta.height,941);
   await sharp(source).extract({left:0,top:0,width,height}).extend({left:0,top:0,right:1672-width,bottom:941-height,background:{r:0,g:0,b:0,alpha:0}}).webp({quality:95,alphaQuality:100,effort:4}).toFile(`public/${file}`);
  }
  const original=sharp(`public/${f.file}`),originalMeta=await original.metadata();
  const baseline=await original.extend({left:0,top:0,right:1672-originalMeta.width,bottom:941-originalMeta.height,background:{r:0,g:0,b:0,alpha:0}}).ensureAlpha().raw().toBuffer();
  const data=await sharp(`public/${file}`).ensureAlpha().raw().toBuffer();
  let union=0,intersection=0;for(let i=3;i<data.length;i+=4){const a=baseline[i]>240,b=data[i]>240;union+=a||b;intersection+=a&&b}
  const opaqueIoU=intersection/union;
  const entry={auditVersion:2,id:f.id,preset,file,source,sha256,outputSha256:hash(`public/${file}`),width:1672,height:941,solid:bounds(data,240),visible:bounds(data,16),opaqueIoU,review:opaqueIoU<.97?'needs_geometry_review':'geometry_candidate',bytes:fs.statSync(`public/${file}`).size};
  const index=audit.findIndex(a=>a.preset===preset&&a.id===f.id);if(index>=0)audit[index]=entry;else audit.push(entry);
  fs.writeFileSync(auditPath,JSON.stringify(audit,null,2)+'\n');console.log(`${preset}/${f.id}: IoU ${opaqueIoU.toFixed(4)} ${entry.review}`);
 }
}
console.log(`${audit.length}/66 prepared`);
})().catch(e=>{console.error(e);process.exitCode=1});
