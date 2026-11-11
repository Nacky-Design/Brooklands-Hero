import React, { useEffect, useLayoutEffect, useRef, useState } from 'react';
import { createRoot } from 'react-dom/client';
import { FRAME_COUNT, useFrameSequence, wrapFrame } from './useFrameSequence.js';
import { getFrameStyle, getSequenceLayout } from './frameLayout.js';
import { ColorGrade } from './ColorGrade.jsx';
import manifest from './sequenceManifest.json';
import previousMidpoint from './legacyMidpoint.json';
import previousRoof from './legacyRoofFrames.json';
import './style.css';

const frameIndex = id => manifest.frames.findIndex(frame => frame.id === id);
const TRANSITIONS = { '01b': ['01', '01b', '02'], '03b': ['03', '03b', '04'], '10b': ['10', '10b', '11'], '21b': ['21', '21b', '22'], '05b': ['05','05b','06'], '11b': ['11','11b','12'], '17b': ['17','17b','18'], '04b':['04','04b','05'], '18b':['18','18b','19'] };

const ROOF_SWEEPS = {
  roof: ['19','20','21','21b','22','23','22','21b','21','20'],
  leftRoof: ['03','02','03b','04','04b','05','05b','06','05b','05','04b','04','03b','02'],
  rightRoof: ['14','15','16','17','17b','18','17b','17','16','15'],
};

const PREVIEW_PRESETS = [
  {name:'Silver',className:'silver',file:'assets/turntable-v1/frame-00.webp'},
  {name:'Carmine',className:'carmine',file:'assets/presets-preview/carmine-00.webp'},
  {name:'Oak Green',className:'oak-green',file:'assets/presets-preview/oak-green-00.webp'},
];

const BACKGROUND = `${import.meta.env.BASE_URL}assets/atelier-background.webp`;

function useCarLayout(stage) {
  const [size, setSize] = useState({ width: 0, height: 0 });
  useLayoutEffect(() => {
    const element = stage.current;
    const measure = () => setSize(previous => {
      const next = { width: element.clientWidth, height: element.clientHeight };
      return previous.width === next.width && previous.height === next.height ? previous : next;
    });
    measure();
    const observer = new ResizeObserver(measure);
    observer.observe(element);
    return () => observer.disconnect();
  }, [stage]);
  return getSequenceLayout(size.width, size.height);
}

function App({ gradeMode = 'both', reviewRequest = null, onDisplayedFrame = null, legacyMidpoint = false, legacyRoof = false, presetPreview = false }) {
  const stage = useRef(null);
  const target = useRef(0);
  const gesture = useRef(null);
  const sequence = useFrameSequence();
  const carLayout = useCarLayout(stage);
  useEffect(() => {
    if (!reviewRequest) return;
    target.current = wrapFrame(reviewRequest.index);
    sequence.select(target.current);
  }, [reviewRequest, sequence.select]);
  useEffect(() => {
    if (sequence.frame) onDisplayedFrame?.(sequence.frame.index);
  }, [sequence.frame?.index, onDisplayedFrame]);
  const [message, setMessage] = useState('');
  const [preset, setPreset] = useState(presetPreview ? 'Silver' : 'Original');
  const [presetLoading, setPresetLoading] = useState(false);
  const presetRequest = useRef(0);
  const options = presetPreview ? PREVIEW_PRESETS : ['Original','Satin','Bespoke'].map(name=>({name,className:name.toLowerCase(),file:'assets/turntable-v1/frame-00.webp'}));
  const selectedPreset = options.find(option=>option.name===preset);
  useEffect(()=>{if(presetPreview)for(const option of PREVIEW_PRESETS){const image=new Image();image.src=`${import.meta.env.BASE_URL}${option.file}`;}},[presetPreview]);
  async function choosePreset(name) {
    if(!presetPreview){setPreset(name);return;}
    const request=++presetRequest.current;setPresetLoading(true);
    try{const image=new Image();image.src=`${import.meta.env.BASE_URL}${PREVIEW_PRESETS.find(option=>option.name===name).file}`;await image.decode();if(request===presetRequest.current){setPreset(name);setMessage('');}}
    catch{if(request===presetRequest.current)setMessage('Не удалось загрузить пресет. Попробуйте выбрать его ещё раз.');}
    finally{if(request===presetRequest.current)setPresetLoading(false);}
  }
  const [menuOpen, setMenuOpen] = useState(false);
  const menuToggle = useRef(null);
  const groundX = carLayout.left + carLayout.width * manifest.anchorX;
  const groundY = carLayout.top + carLayout.height * manifest.anchorY;
  const orbit = {left:groundX-carLayout.width*.66, top:groundY-carLayout.height*.11, width:carLayout.width*1.32, height:carLayout.height*.23};
  const demo = () => setMessage('Демонстрационный прототип — форма заявки не подключена.');
  const choose = index => { if(presetPreview)return; target.current = wrapFrame(index); sequence.select(target.current); };
  const rotate = delta => choose(target.current + delta);
  function down(event) {
    if (presetPreview || !sequence.frame || (event.pointerType === 'mouse' && event.button !== 0) || event.target.closest('button')) return;
    gesture.current = { x: event.clientX, y: event.clientY, frame: target.current, step: Math.max(12, Math.min(24, event.currentTarget.clientWidth / FRAME_COUNT)) };
    event.currentTarget.setPointerCapture(event.pointerId);
  }
  function move(event) {
    const drag = gesture.current;
    if (!drag) return;
    const dx = event.clientX - drag.x, dy = event.clientY - drag.y;
    if (event.pointerType === 'touch' && Math.abs(dy) > Math.abs(dx) && Math.abs(dy) > 8) { gesture.current = null; return; }
    const index = wrapFrame(drag.frame - Math.round(dx / drag.step));
    if (index !== target.current) choose(index);
  }
  const end = () => { gesture.current = null; };
  function key(event) {
    if (presetPreview || !sequence.frame || !['ArrowLeft', 'ArrowRight', 'Home'].includes(event.key)) return;
    event.preventDefault();
    if (event.key === 'Home') choose(0); else rotate(event.key === 'ArrowRight' ? 1 : -1);
  }
  const status = sequence.frame ? 'ready' : sequence.error ? 'unavailable' : 'loading';
  return <main className="hero" data-preset-preview={presetPreview} data-preset={preset}><ColorGrade/>
    <header><a href="#hero" className="brand" aria-label="Brooklands Detailing"><img className="brand-logo" src={`${import.meta.env.BASE_URL}assets/brooklands-logo.svg`} width="5283" height="672" alt="Brooklands" /></a><button ref={menuToggle} className="menu-toggle" aria-label={menuOpen?'Закрыть меню':'Открыть меню'} aria-expanded={menuOpen} aria-controls="main-nav" onClick={()=>setMenuOpen(v=>!v)}><svg viewBox="0 0 24 24" aria-hidden="true"><path d={menuOpen?'M6 6l12 12M18 6L6 18':'M4 8h16M4 16h16'}/></svg></button><nav id="main-nav" data-open={menuOpen} aria-label="Основная навигация" onKeyDown={e=>{if(e.key==='Escape'){setMenuOpen(false);menuToggle.current?.focus();}}}>{['Услуги','Наши работы','О компании','Контакты'].map(text=><button key={text} onClick={()=>{setMenuOpen(false);demo();}}>{text}</button>)}</nav><div className="header-contact"><a className="header-phone" href="tel:+74951545265">+7 (495) 154-52-65</a><button className="booking" onClick={demo}>Записаться</button></div></header>
    <section className="intro" id="hero"><h1>Ваш автомобиль.<br/>Ваша версия.</h1><p>С 2014 года защищаем, преображаем и персонализируем автомобили премиального класса.</p><button className="cta" onClick={demo}>Выбрать услугу <svg className="cta-arrow" viewBox="0 0 24 24" aria-hidden="true"><path d="M4 12h15m-6-6 6 6-6 6"/></svg></button></section>
    <section ref={stage} className="stage" data-roof-version={legacyRoof ? 'previous' : 'refined'} data-midpoint-version={legacyMidpoint ? 'previous' : 'refined'} data-grade={gradeMode} data-frame-id={sequence.frame ? manifest.frames[sequence.frame.index].id : ''} aria-label={presetPreview ? "Предпросмотр отделки Porsche" : "Покадровый обзор Porsche на 360 градусов"} tabIndex={presetPreview ? -1 : 0} data-status={status} data-frame={sequence.frame?.index ?? ''} data-requested-frame={sequence.requested} data-loaded={sequence.loaded} data-buffering={sequence.buffering} onKeyDown={key} onPointerDown={down} onPointerMove={move} onPointerUp={end} onPointerCancel={end} onLostPointerCapture={end}>
      <img className="stage-background" src={BACKGROUND} alt="" fetchPriority="high" decoding="async"/>
      <svg className="floor-orbit" style={orbit} viewBox="0 0 1000 120" preserveAspectRatio="none" aria-hidden="true"><ellipse cx="500" cy="60" rx="495" ry="56"/></svg>
      <div className="ground-contact" aria-hidden="true" style={{left:groundX,top:groundY,width:carLayout.width*.94,height:carLayout.height*.075}}/>
      {sequence.frame && <div className="sequence" style={carLayout}><img className="sequence-image" style={getFrameStyle(sequence.frame.index, legacyMidpoint, legacyRoof)} src={presetPreview ? `${import.meta.env.BASE_URL}${selectedPreset.file}` : legacyMidpoint && manifest.frames[sequence.frame.index].id === '01b' ? `${import.meta.env.BASE_URL}${previousMidpoint.file}` : legacyRoof && previousRoof[manifest.frames[sequence.frame.index].id] ? `${import.meta.env.BASE_URL}${previousRoof[manifest.frames[sequence.frame.index].id].file}` : sequence.frame.url} alt={presetPreview ? `Porsche 911 Turbo S — ${preset}` : "Porsche 911 Turbo S"} draggable="false"/></div>}
      {!sequence.frame && !sequence.error && <p className="status" role="status">Загрузка автомобиля…</p>}
      {sequence.frame && sequence.buffering && <p className="frame-loading" role="status">Загрузка ракурса…</p>}
      {sequence.error && <div className={sequence.frame ? 'frame-warning' : 'fallback'} role="status"><p>{sequence.frame ? 'Этот ракурс пока недоступен.' : 'Не удалось загрузить автомобиль.'}</p><button onClick={sequence.retry}>Повторить загрузку</button></div>}
    </section>
    <aside className="presets" aria-label="Предпросмотр пресетов" aria-busy={presetLoading}><div className="preset-options" role="group" aria-label="Выбрать пресет">{options.map(({name,className,file})=><button key={name} className={`preset ${className}`} aria-pressed={preset===name} onClick={()=>choosePreset(name)}><img className="preset-preview" src={`${import.meta.env.BASE_URL}${file}`} alt=""/><span className="preset-copy"><i aria-hidden="true"/><span>{name}</span></span><span className="preset-check" aria-hidden="true"><svg viewBox="0 0 16 16"><path d="m3 8 3 3 7-7"/></svg></span></button>)}</div></aside>
    {!presetPreview && <div className="rotation"><div className="rotation-buttons" role="group" aria-label="Управление обзором 360 градусов"><button disabled={presetPreview || !sequence.frame} aria-label="Повернуть влево" onClick={()=>rotate(-1)}><svg viewBox="0 0 24 24" aria-hidden="true"><path d="M19 12H5m6-6-6 6 6 6"/></svg></button><span className="rotation-label" aria-hidden="true">360°</span><button disabled={presetPreview || !sequence.frame} aria-label="Повернуть вправо" onClick={()=>rotate(1)}><svg viewBox="0 0 24 24" aria-hidden="true"><path d="M5 12h14m-6-6 6 6-6 6"/></svg></button></div></div>}
    {message && <div className="demo-message" role="status">{message}<button aria-label="Закрыть сообщение" onClick={()=>setMessage('')}>×</button></div>}
  </main>;
}
function ReviewPage() {
  const [grade, setGrade] = useState('both');
  const [request, setRequest] = useState(null);
  const [displayed, setDisplayed] = useState(0);
  const [loop, setLoop] = useState(false);
  const [transition, setTransition] = useState('01b');
  const [legacy, setLegacy] = useState(false);
  const [legacyRoof, setLegacyRoof] = useState(false);
  const [legacyReady, setLegacyReady] = useState(false);
  useEffect(() => {
    let mounted = true;
    const image = new Image();
    image.src = `${import.meta.env.BASE_URL}${previousMidpoint.file}`;
    image.decode().then(() => { if (mounted) setLegacyReady(true); }).catch(() => {});
    return () => { mounted = false; };
  }, []);
  const compareMidpoint = old => { setLegacy(old); if (!loop) setRequest({ index: 2 }); };
  useEffect(() => {
    if (!loop) return;
    const ids = ROOF_SWEEPS[transition] ?? [...TRANSITIONS[transition], TRANSITIONS[transition][1]];
    const frames = ids.map(frameIndex); let step = 0;
    setRequest({ index: frames[step] });
    const timer = setInterval(() => { step = (step + 1) % frames.length; setRequest({ index: frames[step] }); }, 1200);
    return () => clearInterval(timer);
  }, [loop, transition]);
  const show = index => { setLoop(false); setRequest({ index }); };
  return <><div className="review-tools">
    <h1>BROOKLANDS · цвет и промежуточные ракурсы</h1>
    <p>Новая партия: 05b, 11b, 17b. У 02 слегка снижена крыша. Сравните новые переходы в обе стороны; прежние правки сохранены. Переходы и цветкор доступны ниже. Доработанный 01b сохранён; мелкие детали и угловой шаг ещё требуют оценки.</p>
    <div role="group" aria-label="Цветокоррекция">{[['none','Исходный'],['background','Только фон'],['both','Фон + автомобиль']].map(([value,label])=><button key={value} aria-pressed={grade===value} onClick={()=>setGrade(value)}>{label}</button>)}</div>
    <div role="group" aria-label="Версия промежуточного кадра"><button disabled={!legacyReady} aria-pressed={legacy} onClick={()=>compareMidpoint(true)}>01b: до правки</button><button aria-pressed={!legacy} onClick={()=>compareMidpoint(false)}>01b: после правки</button></div>
    <div role="group" aria-label="Опорные ракурсы">{[[0,'Старт 00'],[1,'Ракурс 01'],[2,'Новый 01b'],[frameIndex('02'),'Боковой 02'],[frameIndex('09'),'Задний 09']].map(([index,label])=><button key={index} onClick={()=>show(index)}>{label}</button>)}<button aria-pressed={loop&&transition==='01b'} onClick={()=>{setTransition('01b');setLoop(value=>transition==='01b'?!value:true);}}>{loop&&transition==='01b'?'Остановить переход':'Повторять 01 → 01b → 02'}</button></div>
    <div role="group" aria-label="Новые переходы">{['03b','04b','05b','10b','11b','17b','18b','21b'].map(id => <React.Fragment key={id}><button onClick={()=>show(frameIndex(id))}>Ракурс {id}</button><button aria-pressed={loop&&transition===id} onClick={()=>{setTransition(id);setLoop(value=>transition===id?!value:true);}}>{loop&&transition===id?'Остановить '+id:'Повторять '+TRANSITIONS[id].join(' → ')}</button></React.Fragment>)}</div>
    <div role="group" aria-label="Коррекция крыши"><button aria-pressed={loop&&transition==='roof'} onClick={()=>{setTransition('roof');setLoop(value=>transition==='roof'?!value:true);}}>{loop&&transition==='roof'?'Остановить передние ракурсы':'Повторять передние ракурсы'}</button><button aria-pressed={legacyRoof} onClick={()=>setLegacyRoof(true)}>Крыша: до правки</button><button aria-pressed={!legacyRoof} onClick={()=>setLegacyRoof(false)}>Крыша: после правки</button>{[['leftRoof','02–06'],['rightRoof','14–18']].map(([key,label])=><button key={key} aria-pressed={loop&&transition===key} onClick={()=>{setTransition(key);setLoop(value=>transition===key?!value:true);}}>{loop&&transition===key?'Остановить '+label:'Повторять '+label}</button>)}{['02','03','03b','04','05','06','14','15','16','17','18','19','20','21','21b','22','23','00'].map(id=><button key={id} onClick={()=>show(frameIndex(id))}>Проверить {id}</button>)}</div>
    <p aria-live="polite">На экране: {manifest.frames[displayed].id}. <a href="./">Открыть HERO</a></p>
  </div><App gradeMode={grade} reviewRequest={request} onDisplayedFrame={setDisplayed} legacyMidpoint={legacy} legacyRoof={legacyRoof}/></>;
}
createRoot(document.getElementById('root')).render(document.documentElement.dataset.review && new URLSearchParams(location.search).get('audit') === '1' ? <ReviewPage/> : <App presetPreview={new URLSearchParams(location.search).get('presets') === '1'}/>);
