const fs=require('fs'),sharp=require('sharp'),crypto=require('crypto');
(async()=>{
const manifest=JSON.parse(fs.readFileSync('src/sequenceManifest.json'));
const previous=JSON.parse(fs.readFileSync('src/legacyRoofFrames.json'));
const old=JSON.parse(fs.readFileSync('artifacts/sequence-02/audit.json')).frames;
const additions=JSON.parse(fs.readFileSync('artifacts/sequence-05/midpoint-audit.json')).frames;
const report={method:'Local image_gen canopy edit; retain previous tyre scale, horizontal registration and ground. Alpha bounds measured before/after; landmarks manually verified.',frames:[]};
for(const id of ['03','03b','05','16','17']){
 const source=`references/sequence-07/roof-${id}.png`,file=`assets/turntable-v6/frame-${id}.webp`;
 const sourceInfo=await sharp(source).metadata();
 if(sourceInfo.height!==941||Math.abs(sourceInfo.width-1672)>4)throw Error(`Unexpected source dimensions for ${id}`);
 const input=sourceInfo.width<1672?sharp(source).extend({right:1672-sourceInfo.width,left:0,top:0,bottom:0,background:{r:0,g:0,b:0,alpha:0}}):sharp(source);
 await input.webp({quality:94,alphaQuality:100,effort:6}).toFile(`public/${file}`);
 const {data,info}=await sharp(`public/${file}`).ensureAlpha().raw().toBuffer({resolveWithObject:true});
 const bounds=t=>{let left=info.width,top=info.height,right=0,bottom=0;for(let y=0;y<info.height;y++)for(let x=0;x<info.width;x++)if(data[(y*info.width+x)*4+3]>t){left=Math.min(left,x);right=Math.max(right,x+1);top=Math.min(top,y);bottom=Math.max(bottom,y+1);}return{left,right,top,bottom}};
 const a=additions.find(f=>f.id===id)||old[Number(id)],f=previous[id];
 if(info.width!==1672||info.height!==941)throw Error(`Unexpected image dimensions for ${id}: ${info.width}x${info.height}`);
 const solid=bounds(240),visible=bounds(16);
 const groundY=a.groundY+(solid.bottom-a.solid.bottom);
 const adjusted={...f,dy:manifest.anchorY-groundY/info.height*f.scale};
 const lowerInput=sharp('public/'+f.file);
 const lowerBefore=await (a.width<1672?lowerInput.extend({right:1672-a.width,left:0,top:0,bottom:0,background:{r:0,g:0,b:0,alpha:0}}):lowerInput).ensureAlpha().raw().toBuffer();let overlap=0,union=0,sum=0;
 const lowerCutoff={ '03':385,'03b':400,'05':365,'16':390,'17':385 }[id];
 for(let y=lowerCutoff;y<info.height;y++)for(let x=0;x<info.width;x++){const i=(y*info.width+x)*4,oldSolid=lowerBefore[i+3]>240,newSolid=data[i+3]>240;if(oldSolid||newSolid)union++;if(oldSolid&&newSolid){overlap++;for(let c=0;c<3;c++)sum+=Math.abs(lowerBefore[i+c]-data[i+c]);}}
 const corrected=b=>({left:f.dx+b.left/info.width*f.scale,right:f.dx+b.right/info.width*f.scale,top:adjusted.dy+b.top/info.height*f.scale,bottom:adjusted.dy+b.bottom/info.height*f.scale});
 const item={...adjusted,file,source,sourceWidth:sourceInfo.width,lowerCutoff,transparentRightPadding:1672-sourceInfo.width,lowerBodySilhouetteIoU:overlap/union,lowerBodyMeanAbsoluteRGB:sum/(overlap*3),width:info.width,height:info.height,tyreTop:a.tyreTop,groundY,solid,visible,correctedSolid:corrected(solid),correctedVisible:corrected(visible),beforeHeight:(a.groundY-a.solid.top)*f.scale,afterHeight:(groundY-solid.top)*f.scale,sha256:crypto.createHash('sha256').update(fs.readFileSync(source)).digest('hex'),bytes:fs.statSync(`public/${file}`).size};
 if(item.afterHeight<670||item.afterHeight>692)throw Error(`Roof height needs review: ${id} ${item.afterHeight}`);
 report.frames.push(item);manifest.frames[manifest.frames.findIndex(f=>f.id===id)]={...adjusted,file};
}
fs.writeFileSync('src/sequenceManifest.json',JSON.stringify(manifest,null,2)+'\n');fs.writeFileSync('artifacts/sequence-07/roof-audit.json',JSON.stringify(report,null,2)+'\n');console.log(report.frames.map(({id,beforeHeight,afterHeight})=>({id,beforeHeight,afterHeight})));
})().catch(e=>{console.error(e);process.exitCode=1});
