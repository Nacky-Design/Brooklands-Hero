import React from 'react';

// The clean architectural plate supplies the environment. Only light the real GLB.
export function StudioLighting() {
  return <>
    <ambientLight intensity={.45}/>
    <hemisphereLight args={['#e9f0f4', '#5d5b53', 1.2]}/>
    <directionalLight position={[-5,8,5]} intensity={2.4} castShadow shadow-mapSize={[1024,1024]} shadow-camera-left={-9} shadow-camera-right={9} shadow-camera-top={8} shadow-camera-bottom={-8} shadow-bias={-0.0004} shadow-radius={8}/>
    <directionalLight position={[5,4,-3]} intensity={1.2} color="#e4eaf0"/>
  </>;
}
