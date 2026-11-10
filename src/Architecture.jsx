import React, { useEffect, useMemo } from 'react';
import * as THREE from 'three';

const ROOM_ANGLE = Math.atan2(5.6, 7.2);
const WALL_ANGLE = Math.atan(1.25);
const WALL_LENGTH = 24;
const WALL_END = new THREE.Vector3(2.7, 0, -9);
const wallAxis = new THREE.Vector3(Math.cos(WALL_ANGLE), 0, -Math.sin(WALL_ANGLE));
const wallNormal = new THREE.Vector3(Math.sin(WALL_ANGLE), 0, Math.cos(WALL_ANGLE));
const wallCenter = WALL_END.clone().addScaledVector(wallAxis, -WALL_LENGTH / 2);

function concreteTexture() {
  const canvas = document.createElement('canvas');
  canvas.width = canvas.height = 1024;
  const context = canvas.getContext('2d');
  context.fillStyle = '#aaa9a5';
  context.fillRect(0, 0, 1024, 1024);
  let seed = 4182;
  const random = () => { seed = (seed * 1664525 + 1013904223) >>> 0; return seed / 4294967296; };
  // Several scales of quiet variation, instead of a uniform screen-noise pattern.
  for (const [size, opacity] of [[16, .035], [64, .05], [256, .07]]) {
    const grain = document.createElement('canvas');
    grain.width = grain.height = size;
    const grainContext = grain.getContext('2d');
    const pixels = grainContext.createImageData(size, size);
    for (let i = 0; i < pixels.data.length; i += 4) {
      const value = 90 + Math.floor(random() * 120);
      pixels.data.set([value, value, value, 255], i);
    }
    grainContext.putImageData(pixels, 0, 0);
    context.globalAlpha = opacity;
    context.drawImage(grain, 0, 0, 1024, 1024);
  }
  context.globalAlpha = 1;
  // Subtle casting streaks and pores; no photographed scene or external texture.
  for (let i = 0; i < 140; i++) {
    context.strokeStyle = `rgba(55,58,53,${.012 + random() * .025})`;
    context.lineWidth = .5 + random() * 2;
    const x = random() * 1024, y = random() * 1024;
    context.beginPath(); context.moveTo(x, y); context.lineTo(x + random() * 3, y + 100 + random() * 500); context.stroke();
  }
  for (let i = 0; i < 480; i++) {
    context.fillStyle = `rgba(50,53,49,${.04 + random() * .10})`;
    context.beginPath(); context.ellipse(random() * 1024, random() * 1024, .4 + random(), .5 + random() * 1.5, 0, 0, Math.PI * 2); context.fill();
  }
  const texture = new THREE.CanvasTexture(canvas);
  texture.wrapS = texture.wrapT = THREE.RepeatWrapping;
  texture.colorSpace = THREE.SRGBColorSpace;
  return texture;
}

export function Architecture() {
  const resources = useMemo(() => {
    const wallMap = concreteTexture(); wallMap.repeat.set(6, 2);
    const pierMap = wallMap.clone(); pierMap.repeat.set(3, 2);
    const floorMap = wallMap.clone(); floorMap.repeat.set(14, 14);
    const ceilingMap = wallMap.clone(); ceilingMap.repeat.set(8, 6);
    const wall = new THREE.MeshStandardMaterial({ color: '#989a98', map: wallMap, roughness: .94 });
    const pier = new THREE.MeshStandardMaterial({ color: '#777a77', map: pierMap, roughness: .94 });
    const floor = new THREE.MeshStandardMaterial({ color: '#737571', map: floorMap, roughness: .68 });
    const ceiling = new THREE.MeshStandardMaterial({ color: '#a1a39d', map: ceilingMap, roughness: .96 });
    const reveal = new THREE.MeshStandardMaterial({ color: '#a3a59e', map: ceilingMap, roughness: .94 });
    const shape = new THREE.Shape();
    shape.moveTo(-18, -10); shape.lineTo(18, -10); shape.lineTo(18, 12); shape.lineTo(-18, 12); shape.closePath();
    const aperture = new THREE.Path();
    aperture.absellipse(1.6, -5.5, 2.5, 5.4, 0, Math.PI * 2, true, 0);
    shape.holes.push(aperture);
    const roof = new THREE.ExtrudeGeometry(shape, { depth: .5, bevelEnabled: false, curveSegments: 96 });
    return { wallMap, pierMap, floorMap, ceilingMap, wall, pier, floor, ceiling, reveal, roof };
  }, []);
  useEffect(() => () => {
    for (const resource of Object.values(resources)) resource.dispose();
  }, [resources]);
  const seams = Array.from({ length: Math.floor(WALL_LENGTH / 3) - 1 }, (_, i) => wallCenter.clone().addScaledVector(wallAxis, -WALL_LENGTH / 2 + (i + 1) * 3).addScaledVector(wallNormal, .151));
  return <>
    <color attach="background" args={['#bdc8c5']} />
    <group name="static-architecture">
    <ambientLight intensity={.45}/>
    <hemisphereLight args={['#e9f0f4', '#5d5b53', 1.2]}/>
    <directionalLight position={[-5,8,5]} intensity={2.4} castShadow shadow-mapSize={[1024,1024]} shadow-camera-left={-9} shadow-camera-right={9} shadow-camera-top={8} shadow-camera-bottom={-8} shadow-bias={-0.0004} shadow-radius={8}/>
    <directionalLight position={[5,4,-3]} intensity={1.2} color="#e4eaf0"/>
    <mesh name="concrete-floor" rotation={[-Math.PI/2,0,0]} position={[0,-.005,0]} material={resources.floor}><planeGeometry args={[100,100]}/></mesh>
    <group rotation={[0, ROOM_ANGLE, 0]}>
      <mesh name="main-concrete-wall" position={[wallCenter.x,4,wallCenter.z]} rotation={[0,WALL_ANGLE,0]} material={resources.wall}><boxGeometry args={[WALL_LENGTH,8,.3]}/></mesh>
      {seams.map((point,i)=><mesh key={i} position={[point.x,4,point.z]} rotation={[0,WALL_ANGLE,0]}><boxGeometry args={[.008,8,.002]}/><meshStandardMaterial color="#595e56" roughness={1}/></mesh>)}
      <mesh name="right-concrete-pier" position={[8,4,-2.6]} material={resources.pier}><boxGeometry args={[10,8,.4]}/></mesh>
      <mesh name="ceiling-with-open-aperture" position={[0,4,0]} rotation={[Math.PI/2,0,0]} geometry={resources.roof} material={[resources.ceiling,resources.reveal]} />
    </group>
    <mesh rotation={[-Math.PI/2,0,0]} position={[0,-.003,0]}><ringGeometry args={[3.54,3.55,128]}/><meshBasicMaterial color="#c0c1b9" transparent opacity={.65} depthWrite={false}/></mesh>
    </group>
  </>;
}
