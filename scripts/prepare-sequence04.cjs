const fs=require('fs'),sharp=require('sharp'),crypto=require('crypto');
(async()=>{
const source='references/sequence-04/midpoint-01b-refined.png',out='public/assets/turntable-v3/midpoint-01b.webp';
await sharp(source).webp({quality:94,alphaQuality:100,effort:6}).toFile(out);
const {data,info}=await sharp(out).ensureAlpha().raw().toBuffer({resolveWithObject:true});
function bounds(t){let left=info.width,top=info.height,right=0,bottom=0;for(let y=0;y<info.height;y++)for(let x=0;x<info.width;x++)if(data[(y*info.width+x)*4+3]>t){left=Math.min(left,x);right=Math.max(right,x+1);top=Math.min(top,y);bottom=Math.max(bottom,y+1)}return{left,right,top,bottom}}
const solid=bounds(240),visible=bounds(16),base=JSON.parse(fs.readFileSync('src/frameCalibration.json'));
// Manually reviewed native-pixel endpoints of the near front tyre, approx ±6px.
const tyreTop=486,groundY=795,scale=375/(groundY-tyreTop);
const dx=base.anchorX-(solid.left+solid.right)/2/info.width*scale,dy=base.anchorY-groundY/info.height*scale;
const corrected=b=>({left:dx+b.left/info.width*scale,right:dx+b.right/info.width*scale,top:dy+b.top/info.height*scale,bottom:dy+b.bottom/info.height*scale});
const cb=corrected(visible),radius=Math.max(base.maxVisibleRadius,Math.abs(cb.left-base.anchorX),Math.abs(cb.right-base.anchorX));
const frames=base.frames.map(f=>({...f,id:String(f.index).padStart(2,'0'),file:`assets/turntable-v1/frame-${String(f.index).padStart(2,'0')}.webp`}));
const mid={id:'01b',file:'assets/turntable-v3/midpoint-01b.webp',scale,dx,dy};frames.splice(2,0,mid);
const manifest={anchorX:base.anchorX,anchorY:base.anchorY,maxVisibleRadius:radius,mobileCanvasWidthRatio:.94/(2*radius),frames};
fs.writeFileSync('src/sequenceManifest.json',JSON.stringify(manifest,null,2)+'\n');
const report={source,sourceSha256:crypto.createHash('sha256').update(fs.readFileSync(source)).digest('hex'),webp:out,bytes:fs.statSync(out).size,width:info.width,height:info.height,hasAlpha:info.channels===4,tyreTop,groundY,uncertaintyPixels:6,solid,visible,scale,dx,dy,correctedSolid:corrected(solid),correctedVisible:cb,anglesCalibrated:false,review:'Local spoiler and canopy refinement of existing 01b. Same intermediate yaw, compact spoiler support and reduced canopy height. Generation can still change fine details outside requested edit regions; angular spacing is not calibrated.'};
fs.writeFileSync('artifacts/sequence-04/midpoint-audit.json',JSON.stringify(report,null,2)+'\n');console.log(report);
})().catch(e=>{console.error(e);process.exit(1)});
