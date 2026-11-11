const fs = require('fs'), sharp = require('sharp'), crypto = require('crypto');
// Native-pixel near tyre landmarks, visually measured ±6px. Never bake display grade into assets.
const landmarks = { '04b': [473, 823], '18b': [445, 824] };
(async () => {
  const manifest = JSON.parse(fs.readFileSync('src/sequenceManifest.json'));
  const report = { method: 'Manual near-tyre calibration; alpha bounds for horizontal registration. Angles are not measured.', uncertaintyPixels: 6, frames: [] };
  for (const [id, [tyreTop, groundY]] of Object.entries(landmarks)) {
    if (groundY <= tyreTop) throw Error(`Measure tyre landmarks for ${id}`);
    const source = `references/sequence-09/midpoint-${id}.png`, file = `assets/turntable-v8/midpoint-${id}.webp`;
    const sourceInfo=await sharp(source).metadata();
    if(sourceInfo.width>1672||sourceInfo.width<1670||sourceInfo.height>941||sourceInfo.height<940)throw Error(`Unexpected source dimensions for ${id}`);
    const input=sharp(source).extend({left:0,top:0,right:1672-sourceInfo.width,bottom:941-sourceInfo.height,background:{r:0,g:0,b:0,alpha:0}});
    await input.webp({ quality: 94, alphaQuality: 100, effort: 6 }).toFile(`public/${file}`);
    const { data, info } = await sharp(`public/${file}`).ensureAlpha().raw().toBuffer({ resolveWithObject: true });
    const bounds = threshold => {
      let left=info.width, top=info.height, right=0, bottom=0;
      for(let y=0;y<info.height;y++) for(let x=0;x<info.width;x++) if(data[(y*info.width+x)*4+3]>threshold) {
        left=Math.min(left,x); right=Math.max(right,x+1); top=Math.min(top,y); bottom=Math.max(bottom,y+1);
      }
      return { left, right, top, bottom };
    };
    const solid=bounds(240), visible=bounds(16), scale=375/(groundY-tyreTop);
    const calibratedHeight=(groundY-solid.top)*scale;
    if(calibratedHeight<665||calibratedHeight>695)throw Error(`Roof/tyre calibration needs review: ${id} ${calibratedHeight}`);
    const dx=manifest.anchorX-(solid.left+solid.right)/2/info.width*scale, dy=manifest.anchorY-groundY/info.height*scale;
    const corrected = b => ({ left:dx+b.left/info.width*scale, right:dx+b.right/info.width*scale, top:dy+b.top/info.height*scale, bottom:dy+b.bottom/info.height*scale });
    const frame = { id, file, scale, dx, dy };
    const existing = manifest.frames.findIndex(f=>f.id===id);
    if(existing>=0)manifest.frames.splice(existing,1);
    manifest.frames.splice(manifest.frames.findIndex(f=>f.id===id.slice(0,2))+1,0,frame);
    report.frames.push({...frame, source, sourceWidth:sourceInfo.width, sourceHeight:sourceInfo.height, width:info.width, height:info.height, calibratedHeight, tyreTop, groundY, solid, visible, correctedSolid:corrected(solid), correctedVisible:corrected(visible), bytes:fs.statSync(`public/${file}`).size, sha256:crypto.createHash('sha256').update(fs.readFileSync(source)).digest('hex')});
  }
  // Only expand the shared fit if a new silhouette requires it; retain the previous presentation otherwise.
  const requiredRadius=Math.max(...report.frames.flatMap(f=>[Math.abs(f.correctedVisible.left-manifest.anchorX),Math.abs(f.correctedVisible.right-manifest.anchorX)]));
  if(requiredRadius>manifest.maxVisibleRadius+.001)throw Error(`New frame needs calibration review: radius ${requiredRadius}`);
  manifest.mobileCanvasWidthRatio=.94/(2*manifest.maxVisibleRadius);
  fs.writeFileSync('src/sequenceManifest.json',JSON.stringify(manifest,null,2)+'\n');
  fs.writeFileSync('artifacts/sequence-09/midpoint-audit.json',JSON.stringify(report,null,2)+'\n');
  console.log(report);
})().catch(e=>{console.error(e);process.exitCode=1});
