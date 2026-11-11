import React, { useEffect, useLayoutEffect, useRef, useState } from 'react';
import { createRoot } from 'react-dom/client';
import { FRAME_COUNT, useFrameSequence, wrapFrame } from './useFrameSequence.js';
import { getFrameStyle, getSequenceLayout } from './frameLayout.js';
import { ColorGrade } from './ColorGrade.jsx';
import manifest from './sequenceManifest.json';
import previousMidpoint from './legacyMidpoint.json';
import './style.css';

const frameIndex = id => manifest.frames.findIndex(frame => frame.id === id);
const TRANSITIONS = { '01b': ['01', '01b', '02'], '03b': ['03', '03b', '04'], '10b': ['10', '10b', '11'], '21b': ['21', '21b', '22'] };

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

function App({ gradeMode = 'both', reviewRequest = null, onDisplayedFrame = null, legacyMidpoint = false }) {
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
  const demo = () => setMessage('Демонстрационный прототип — форма заявки не подключена.');
  const choose = index => { target.current = wrapFrame(index); sequence.select(target.current); };
  const rotate = delta => choose(target.current + delta);
  function down(event) {
    if (!sequence.frame || (event.pointerType === 'mouse' && event.button !== 0) || event.target.closest('button')) return;
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
    if (!sequence.frame || !['ArrowLeft', 'ArrowRight', 'Home'].includes(event.key)) return;
    event.preventDefault();
    if (event.key === 'Home') choose(0); else rotate(event.key === 'ArrowRight' ? 1 : -1);
  }
  const status = sequence.frame ? 'ready' : sequence.error ? 'unavailable' : 'loading';
  return <main className="hero"><ColorGrade/>
    <header><a href="#hero" className="brand" aria-label="Brooklands Detailing"><strong>BROOKLANDS</strong><span>DETAILING</span></a><nav aria-label="Основная навигация">{['Услуги','Наши работы','О компании','Контакты'].map(text=><button key={text} onClick={demo}>{text}</button>)}</nav><button className="booking" onClick={demo}>Записаться</button></header>
    <section className="intro" id="hero"><h1>Ваш автомобиль.<br/>Ваша версия.</h1><p>Детейлинг, защита и персонализация<br className="desktop-break"/> автомобилей премиального класса.</p><button className="cta" onClick={demo}>Обсудить проект <span aria-hidden="true">→</span></button></section>
    <section ref={stage} className="stage" data-midpoint-version={legacyMidpoint ? 'previous' : 'refined'} data-grade={gradeMode} data-frame-id={sequence.frame ? manifest.frames[sequence.frame.index].id : ''} aria-label="Покадровый обзор Porsche на 360 градусов" tabIndex={0} data-status={status} data-frame={sequence.frame?.index ?? ''} data-requested-frame={sequence.requested} data-loaded={sequence.loaded} data-buffering={sequence.buffering} onKeyDown={key} onPointerDown={down} onPointerMove={move} onPointerUp={end} onPointerCancel={end} onLostPointerCapture={end}>
      <img className="stage-background" src={BACKGROUND} alt="" fetchPriority="high" decoding="async"/>
      {sequence.frame && <div className="sequence" style={carLayout}><img className="sequence-image" style={getFrameStyle(sequence.frame.index, legacyMidpoint)} src={legacyMidpoint && manifest.frames[sequence.frame.index].id === '01b' ? `${import.meta.env.BASE_URL}${previousMidpoint.file}` : sequence.frame.url} alt="Porsche 911 Turbo S" draggable="false"/></div>}
      {!sequence.frame && !sequence.error && <p className="status" role="status">Загрузка автомобиля…</p>}
      {sequence.frame && sequence.buffering && <p className="frame-loading" role="status">Загрузка ракурса…</p>}
      {sequence.error && <div className={sequence.frame ? 'frame-warning' : 'fallback'} role="status"><p>{sequence.frame ? 'Этот ракурс пока недоступен.' : 'Не удалось загрузить автомобиль.'}</p><button onClick={sequence.retry}>Повторить загрузку</button></div>}
    </section>
    <aside className="presets" aria-label="Визуальный макет пресетов"><div className="preset original"><i/><span>Original</span></div><div className="preset satin"><i/><span>Satin</span></div><div className="preset bespoke"><i/><span>Bespoke</span></div><p>Предпросмотр интерфейса — смена материалов не подключена</p></aside>
    <div className="rotation"><div className="rotation-buttons"><button disabled={!sequence.frame} aria-label="Повернуть влево" onClick={()=>rotate(-1)}>←</button><span className="line"/><span>360°</span><span className="line"/><button disabled={!sequence.frame} aria-label="Повернуть вправо" onClick={()=>rotate(1)}>→</button></div><p>Перетащите автомобиль для вращения</p></div>
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
    const [a, mid, b] = TRANSITIONS[transition].map(frameIndex);
    const frames = [a, mid, b, mid]; let step = 0;
    setRequest({ index: frames[step] });
    const timer = setInterval(() => { step = (step + 1) % frames.length; setRequest({ index: frames[step] }); }, 1200);
    return () => clearInterval(timer);
  }, [loop, transition]);
  const show = index => { setLoop(false); setRequest({ index }); };
  return <><div className="review-tools">
    <h1>BROOKLANDS · цвет и промежуточные ракурсы</h1>
    <p>Добавлены 03b, 10b и 21b. Выберите переход и сравните его в обе стороны. Доработанный 01b и общий цветкор сохранены; мелкие детали и угловой шаг ещё требуют оценки.</p>
    <div role="group" aria-label="Цветокоррекция">{[['none','Исходный'],['background','Только фон'],['both','Фон + автомобиль']].map(([value,label])=><button key={value} aria-pressed={grade===value} onClick={()=>setGrade(value)}>{label}</button>)}</div>
    <div role="group" aria-label="Версия промежуточного кадра"><button disabled={!legacyReady} aria-pressed={legacy} onClick={()=>compareMidpoint(true)}>01b: до правки</button><button aria-pressed={!legacy} onClick={()=>compareMidpoint(false)}>01b: после правки</button></div>
    <div role="group" aria-label="Опорные ракурсы">{[[0,'Старт 00'],[1,'Ракурс 01'],[2,'Новый 01b'],[3,'Боковой 02'],[frameIndex('09'),'Задний 09']].map(([index,label])=><button key={index} onClick={()=>show(index)}>{label}</button>)}<button aria-pressed={loop&&transition==='01b'} onClick={()=>{setTransition('01b');setLoop(value=>transition==='01b'?!value:true);}}>{loop&&transition==='01b'?'Остановить переход':'Повторять 01 → 01b → 02'}</button></div>
    <div role="group" aria-label="Новые переходы">{['03b','10b','21b'].map(id => <React.Fragment key={id}><button onClick={()=>show(frameIndex(id))}>Ракурс {id}</button><button aria-pressed={loop&&transition===id} onClick={()=>{setTransition(id);setLoop(value=>transition===id?!value:true);}}>{loop&&transition===id?'Остановить '+id:'Повторять '+TRANSITIONS[id].join(' → ')}</button></React.Fragment>)}</div>
    <p aria-live="polite">На экране: {manifest.frames[displayed].id}. <a href="./">Открыть HERO</a></p>
  </div><App gradeMode={grade} reviewRequest={request} onDisplayedFrame={setDisplayed} legacyMidpoint={legacy}/></>;
}
createRoot(document.getElementById('root')).render(document.documentElement.dataset.review ? <ReviewPage/> : <App/>);
