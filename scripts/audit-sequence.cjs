const fs=require('node:fs');const sharp=require('sharp');
(async()=>{
const manifest=JSON.parse(fs.readFileSync('public/assets/turntable-v1/manifest.json'));
const landmarks=JSON.parse(fs.readFileSync('references/sequence-landmarks.json'));
const measured=[];
for(const frame of manifest.frames){
 const {data,info}=await sharp(`public/assets/turntable-v1/${frame.file}`).ensureAlpha().raw().toBuffer({resolveWithObject:true});
 const bounds=threshold=>{let left=info.width,top=info.height,right=0,bottom=0;for(let y=0;y<info.height;y++)for(let x=0;x<info.width;x++)if(data[(y*info.width+x)*4+3]>threshold){left=Math.min(left,x);top=Math.min(top,y);right=Math.max(right,x+1);bottom=Math.max(bottom,y+1);}return {left,top,right,bottom,width:right-left,height:bottom-top};};
 measured.push({...frame,...landmarks.frames[frame.index],solid:bounds(240),visible:bounds(16)});
}
const base=measured[0],targetDiameter=base.groundY-base.tyreTop;
const anchorX=(base.solid.left+base.solid.right)/2/base.width,anchorY=base.groundY/base.height;
const scales=measured.map(f=>f.tyreTop===null?null:targetDiameter/(f.groundY-f.tyreTop));
for(const f of measured) if(scales[f.index]===null){
 const neighbours=[measured[(f.index+23)%24],measured[(f.index+1)%24]];
 const targetHeight=neighbours.reduce((sum,n)=>sum+(n.groundY-n.solid.top)*scales[n.index],0)/2;
 scales[f.index]=targetHeight/(f.groundY-f.solid.top);
}
const frames=measured.map(f=>{
 const diameter=f.tyreTop===null?null:f.groundY-f.tyreTop;
 const scale=scales[f.index];
 const dx=anchorX-(f.solid.left+f.solid.right)/2/f.width*scale,dy=anchorY-f.groundY/f.height*scale;
 const normalized=b=>({left:dx+b.left/f.width*scale,right:dx+b.right/f.width*scale,top:dy+b.top/f.height*scale,bottom:dy+b.bottom/f.height*scale});
 return {...f,diameter,scale,dx,dy,correctedSolid:normalized(f.solid),correctedVisible:normalized(f.visible)};
});
// One shared mobile zoom for the whole sequence: never fit each angle separately.
const radius=Math.max(...frames.flatMap(f=>[Math.abs(f.correctedVisible.left-anchorX),Math.abs(f.correctedVisible.right-anchorX)]));
const mobileCanvasWidthRatio=.94/(2*radius);
const runtime={anchorX,anchorY,maxVisibleRadius:radius,mobileCanvasWidthRatio,frames:frames.map(({index,scale,dx,dy})=>({index,scale,dx,dy}))};
fs.writeFileSync('src/frameCalibration.json',JSON.stringify(runtime,null,2)+'\n');
fs.mkdirSync('artifacts/sequence-02',{recursive:true});
const heightsBefore=frames.map(f=>f.solid.height),heightsAfter=frames.map(f=>(f.correctedSolid.bottom-f.correctedSolid.top)*base.height);
const range=a=>({min:Math.min(...a),max:Math.max(...a),maxOverMin:Math.max(...a)/Math.min(...a)});
fs.writeFileSync('artifacts/sequence-02/audit.json',JSON.stringify({method:landmarks.method,uncertaintyPixels:landmarks.uncertaintyPixels,tyreDiameterAnchor:targetDiameter,opaqueSilhouetteHeight:{before:range(heightsBefore),after:range(heightsAfter)},mobileCanvasWidthRatio,frames},null,2)+'\n');
console.table(frames.map(f=>({frame:f.index,view:f.view,scale:f.scale.toFixed(3),heightBefore:f.solid.height,heightAfter:(f.solid.height*f.scale).toFixed(1)})));console.log({mobileCanvasWidthRatio,before:range(heightsBefore),after:range(heightsAfter)});
})().catch(e=>{console.error(e);process.exit(1)});
