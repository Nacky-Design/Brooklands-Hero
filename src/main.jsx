import React, { Suspense, useEffect, useMemo, useRef, useState } from 'react';
import { createRoot } from 'react-dom/client';
import { Canvas, useFrame, useLoader, useThree } from '@react-three/fiber';
import * as THREE from 'three';
import { GLTFLoader } from 'three/addons/loaders/GLTFLoader.js';
import './style.css';
import { ContactShadow } from './ContactShadow.jsx';
import { StudioLighting } from './StudioLighting.jsx';

const INITIAL_ROTATION = -1.65;
const MODEL = `${import.meta.env.BASE_URL}assets/model.glb`;
const BACKGROUND = `${import.meta.env.BASE_URL}assets/atelier-background.webp`;
function Car({ angle, report, pivot }) {
  const gltf = useLoader(GLTFLoader, MODEL);
  const { camera, invalidate } = useThree();
  const prepared = useMemo(() => {
    const scene = gltf.scene.clone(true);
    const box = new THREE.Box3().setFromObject(scene);
    const size = box.getSize(new THREE.Vector3());
    const center = box.getCenter(new THREE.Vector3());
    const scale = 5.7 / Math.max(size.x, size.z);
    scene.position.set(-center.x * scale, -box.min.y * scale, -center.z * scale);
    scene.scale.multiplyScalar(scale);
    scene.traverse(o => { if (o.isMesh) { o.castShadow = true; o.receiveShadow = true; o.layers.enable(1); } });
    return scene;
  }, [gltf]);
  useEffect(() => { report('ready'); }, [report]);
  useFrame((_, dt) => {
    if (!pivot.current) return;
    const reduced = window.matchMedia('(prefers-reduced-motion: reduce)').matches;
    pivot.current.rotation.y = reduced ? angle.current : THREE.MathUtils.damp(pivot.current.rotation.y, angle.current, 12, Math.min(dt, .1));
    if (Math.abs(pivot.current.rotation.y - angle.current) > .0001) invalidate();
    const el = document.querySelector('.stage');
    if (el) {
      el.dataset.angle = pivot.current.rotation.y.toFixed(4);
      if(import.meta.env.DEV){
        el.dataset.frames = String(Number(el.dataset.frames || 0) + 1);
        pivot.current.updateWorldMatrix(true,true);
        const box=new THREE.Box3().setFromObject(pivot.current);
        const points=[];
        for(const x of [box.min.x,box.max.x])for(const y of [box.min.y,box.max.y])for(const z of [box.min.z,box.max.z])points.push(new THREE.Vector3(x,y,z).project(camera));
        el.dataset.bounds=JSON.stringify({minX:Math.min(...points.map(p=>p.x)),maxX:Math.max(...points.map(p=>p.x)),minY:Math.min(...points.map(p=>p.y)),maxY:Math.max(...points.map(p=>p.y))});
        el.dataset.camera=JSON.stringify({position:camera.position.toArray(),quaternion:camera.quaternion.toArray()});
      }
    }
  }, -2);
  return <group ref={pivot} rotation={[0, INITIAL_ROTATION, 0]}><primitive object={prepared}/></group>;
}
function Camera() {
  const { camera, size, invalidate } = useThree();
  useEffect(() => {
    const ratio=size.width/size.height;
    const mobile=size.width<900;
    camera.position.set(5.6,1.25,7.2);
    camera.fov = mobile ? 43 : 30;
    if(mobile) camera.position.multiplyScalar(Math.max(1.15, 1.28 / ratio));
    else camera.position.multiplyScalar(Math.max(1, 1.8 / ratio));
    camera.lookAt(0,.65,0);
    if(!mobile) camera.setViewOffset(size.width,size.height,-size.width*.035,-size.height*.12,size.width,size.height);
    else camera.setViewOffset(size.width,size.height,0,-size.height*.23,size.width,size.height);
    camera.updateProjectionMatrix();
    invalidate();
  },[camera,size,invalidate]);
  return null;
}
class SceneBoundary extends React.Component {
  state={error:false};
  static getDerivedStateFromError(){return {error:true};}
  componentDidCatch(){this.props.fail();}
  render(){return this.state.error ? null : this.props.children;}
}
function hasWebGL(){
  try {
    // Three.js requires WebGL 2. Release the probe immediately.
    const context=document.createElement('canvas').getContext('webgl2');
    if(!context) return false;
    context.getExtension('WEBGL_lose_context')?.loseContext();
    return true;
  } catch { return false; }
}
function RendererLifecycle({ report }) {
  const { gl } = useThree();
  useEffect(() => {
    const lost=e=>{e.preventDefault();report('unavailable');};
    gl.domElement.addEventListener('webglcontextlost',lost);
    return ()=>gl.domElement.removeEventListener('webglcontextlost',lost);
  },[gl,report]);
  return null;
}
function App(){
  const angle=useRef(INITIAL_ROTATION);
  const gesture=useRef(null);
  const carRoot=useRef(null);
  const wake=useRef(()=>{});
  const [status,setStatus]=useState(()=>hasWebGL()?'loading':'unavailable');
  const [message,setMessage]=useState('');
  const demo=()=>setMessage('Демонстрационный прототип — форма заявки не подключена.');
  function down(e){if(status!=='ready'||e.target.closest('button'))return;gesture.current={x:e.clientX,y:e.clientY,angle:angle.current}; e.currentTarget.setPointerCapture(e.pointerId);}
  function move(e){if(!gesture.current)return;const dx=e.clientX-gesture.current.x,dy=e.clientY-gesture.current.y;if(e.pointerType==='touch'&&Math.abs(dy)>Math.abs(dx)&&Math.abs(dx)<8){gesture.current=null;return;}angle.current=gesture.current.angle+dx*.012;wake.current();}
  function end(){gesture.current=null;}
  function rotate(delta){angle.current+=delta;wake.current();}
  return <main className="hero">
    <header><a href="#hero" className="brand" aria-label="Brooklands Detailing"><strong>BROOKLANDS</strong><span>DETAILING</span></a><nav aria-label="Основная навигация">{['Услуги','Наши работы','О компании','Контакты'].map(t=><button key={t} onClick={demo}>{t}</button>)}</nav><button className="booking" onClick={demo}>Записаться</button></header>
    <section className="intro" id="hero"><h1>Ваш автомобиль.<br/>Ваша версия.</h1><p>Детейлинг, защита и персонализация<br className="desktop-break"/> автомобилей премиального класса.</p><button className="cta" onClick={demo}>Обсудить проект <span aria-hidden="true">→</span></button></section>
    <section className="stage" aria-label="Интерактивная 3D-модель Porsche" data-status={status} onPointerDown={down} onPointerMove={move} onPointerUp={end} onPointerCancel={end} onLostPointerCapture={end}>
      <img className="stage-background" src={BACKGROUND} alt="" fetchPriority="high" decoding="async"/>
      {status!=='unavailable' && <SceneBoundary fail={()=>setStatus('unavailable')}><Canvas style={{position:'absolute',inset:0}} frameloop="demand" shadows dpr={[1,1.5]} gl={{alpha:true,antialias:true,powerPreference:'high-performance'}} onCreated={({gl,invalidate})=>{wake.current=invalidate;gl.setClearColor(0x000000,0);gl.shadowMap.type=THREE.PCFShadowMap;gl.toneMapping=THREE.ACESFilmicToneMapping;gl.toneMappingExposure=1;}} fallback={<p>WebGL недоступен. Интерактивная модель не отображается.</p>}><RendererLifecycle report={setStatus}/><Camera/><StudioLighting/><ContactShadow carRoot={carRoot}/><Suspense fallback={null}><Car pivot={carRoot} angle={angle} report={setStatus}/></Suspense></Canvas></SceneBoundary>}
      {status==='loading'&&<p className="status" role="status">Загрузка 3D-модели…</p>}
      {status==='unavailable'&&<div className="fallback" role="status"><span>PORSCHE / 3D</span><p>Интерактивная модель недоступна.<br/>Нужен браузер с поддержкой WebGL 2 и доступ к файлу модели.</p></div>}
    </section>
    <aside className="presets" aria-label="Визуальный макет пресетов"><div className="preset original"><i/><span>Original</span></div><div className="preset satin"><i/><span>Satin</span></div><div className="preset bespoke"><i/><span>Bespoke</span></div><p>Предпросмотр интерфейса — смена материалов не подключена</p></aside>
    <div className="rotation"><div className="rotation-buttons"><button disabled={status!=='ready'} aria-label="Повернуть влево" onClick={()=>rotate(-Math.PI/4)}>←</button><span className="line"/><span>360°</span><span className="line"/><button disabled={status!=='ready'} aria-label="Повернуть вправо" onClick={()=>rotate(Math.PI/4)}>→</button></div><p>Перетащите автомобиль для вращения</p></div>
    {message&&<div className="demo-message" role="status">{message}<button aria-label="Закрыть сообщение" onClick={()=>setMessage('')}>×</button></div>}
  </main>;
}
createRoot(document.getElementById('root')).render(<App/>);
