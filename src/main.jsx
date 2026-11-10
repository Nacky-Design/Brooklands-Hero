import React, { useLayoutEffect, useRef, useState } from 'react';
import { createRoot } from 'react-dom/client';
import { FRAME_COUNT, useFrameSequence, wrapFrame } from './useFrameSequence.js';
import './style.css';

const BACKGROUND = `${import.meta.env.BASE_URL}assets/atelier-background.webp`;
const PLATE_RATIO = 1672 / 941;

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
  const { width, height } = size;
  if (width < 900) {
    const carWidth = width * .96, carHeight = carWidth / PLATE_RATIO;
    return { width: carWidth, height: carHeight, left: (width - carWidth) / 2, top: height * .92 - carHeight };
  }
  // Apply the same cover transform as the background to reference-space coordinates.
  const coverWidth = Math.max(width, height * PLATE_RATIO);
  const coverHeight = coverWidth / PLATE_RATIO;
  const carWidth = coverWidth * .62;
  return { width: carWidth, height: carWidth / PLATE_RATIO, left: (width - coverWidth) / 2 + coverWidth * .51 - carWidth / 2, top: (height - coverHeight) / 2 + coverHeight * .295 };
}

function App() {
  const stage = useRef(null);
  const target = useRef(0);
  const gesture = useRef(null);
  const sequence = useFrameSequence();
  const carLayout = useCarLayout(stage);
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
  return <main className="hero">
    <header><a href="#hero" className="brand" aria-label="Brooklands Detailing"><strong>BROOKLANDS</strong><span>DETAILING</span></a><nav aria-label="Основная навигация">{['Услуги','Наши работы','О компании','Контакты'].map(text=><button key={text} onClick={demo}>{text}</button>)}</nav><button className="booking" onClick={demo}>Записаться</button></header>
    <section className="intro" id="hero"><h1>Ваш автомобиль.<br/>Ваша версия.</h1><p>Детейлинг, защита и персонализация<br className="desktop-break"/> автомобилей премиального класса.</p><button className="cta" onClick={demo}>Обсудить проект <span aria-hidden="true">→</span></button></section>
    <section ref={stage} className="stage" aria-label="Покадровый обзор Porsche на 360 градусов" tabIndex={0} data-status={status} data-frame={sequence.frame?.index ?? ''} data-requested-frame={sequence.requested} data-loaded={sequence.loaded} data-buffering={sequence.buffering} onKeyDown={key} onPointerDown={down} onPointerMove={move} onPointerUp={end} onPointerCancel={end} onLostPointerCapture={end}>
      <img className="stage-background" src={BACKGROUND} alt="" fetchPriority="high" decoding="async"/>
      {sequence.frame && <div className="sequence" style={carLayout}><img className="sequence-image" src={sequence.frame.url} alt="Porsche 911 Turbo S" draggable="false"/></div>}
      {!sequence.frame && !sequence.error && <p className="status" role="status">Загрузка автомобиля…</p>}
      {sequence.frame && sequence.buffering && <p className="frame-loading" role="status">Загрузка ракурса…</p>}
      {sequence.error && <div className={sequence.frame ? 'frame-warning' : 'fallback'} role="status"><p>{sequence.frame ? 'Этот ракурс пока недоступен.' : 'Не удалось загрузить автомобиль.'}</p><button onClick={sequence.retry}>Повторить загрузку</button></div>}
    </section>
    <aside className="presets" aria-label="Визуальный макет пресетов"><div className="preset original"><i/><span>Original</span></div><div className="preset satin"><i/><span>Satin</span></div><div className="preset bespoke"><i/><span>Bespoke</span></div><p>Предпросмотр интерфейса — смена материалов не подключена</p></aside>
    <div className="rotation"><div className="rotation-buttons"><button disabled={!sequence.frame} aria-label="Повернуть влево" onClick={()=>rotate(-1)}>←</button><span className="line"/><span>360°</span><span className="line"/><button disabled={!sequence.frame} aria-label="Повернуть вправо" onClick={()=>rotate(1)}>→</button></div><p>Перетащите автомобиль для вращения</p></div>
    {message && <div className="demo-message" role="status">{message}<button aria-label="Закрыть сообщение" onClick={()=>setMessage('')}>×</button></div>}
  </main>;
}
createRoot(document.getElementById('root')).render(<App/>);
