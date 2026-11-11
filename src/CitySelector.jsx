import React, { useEffect, useRef } from 'react';

export const CITIES = [
  { id: 'moscow', label: 'Москва', phone: '+7 (495) 154-52-65', tel: '+74951545265' },
  { id: 'dubai', label: 'Дубай', phone: '+971 58 174 0055', tel: '+971581740055' },
];
const STORAGE_KEY = 'brooklands-city';
export function savedCity() {
  try { return CITIES.find(city => city.id === localStorage.getItem(STORAGE_KEY))?.id || 'moscow'; }
  catch { return 'moscow'; }
}
export function saveCity(id) { try { localStorage.setItem(STORAGE_KEY, id); } catch { /* Selection still works without storage. */ } }

export function CitySelector({ city, onChange, open, onOpenChange, onOpen }) {
  const root = useRef(null), toggle = useRef(null), items = useRef([]), pendingFocus = useRef(null);
  const current = CITIES.find(option => option.id === city);
  useEffect(() => {
    if (!open) return;
    items.current[pendingFocus.current ?? CITIES.findIndex(option => option.id === city)]?.focus();
    pendingFocus.current = null;
    const outside = event => { if (!root.current?.contains(event.target)) onOpenChange(false); };
    document.addEventListener('pointerdown', outside);
    return () => document.removeEventListener('pointerdown', outside);
  }, [open, city, onOpenChange]);
  const close = () => { onOpenChange(false); toggle.current?.focus(); };
  function menuKey(event) {
    if (event.key === 'Escape') { event.preventDefault(); event.stopPropagation(); close(); return; }
    if (!['ArrowDown', 'ArrowUp', 'Home', 'End'].includes(event.key)) return;
    event.preventDefault();
    const index = items.current.indexOf(document.activeElement);
    const next = event.key === 'Home' ? 0 : event.key === 'End' ? CITIES.length - 1 : (index + (event.key === 'ArrowDown' ? 1 : -1) + CITIES.length) % CITIES.length;
    items.current[next]?.focus();
  }
  return <div className="city-selector" ref={root} onBlur={event => { if (!event.currentTarget.contains(event.relatedTarget)) onOpenChange(false); }}>
    <button className="city-toggle" ref={toggle} aria-label={`Город: ${current.label}`} aria-expanded={open} aria-haspopup="menu" aria-controls="city-menu" onClick={() => { if (!open) onOpen(); onOpenChange(!open); }} onKeyDown={event => {
      if (event.key === 'ArrowDown' || event.key === 'ArrowUp') { event.preventDefault(); pendingFocus.current = event.key === 'ArrowDown' ? 0 : CITIES.length - 1; onOpen(); onOpenChange(true); }
      if (event.key === 'Escape' && open) close();
    }}>
      <svg className="city-pin" viewBox="0 0 20 24" aria-hidden="true"><path d="M17 9c0 5-7 12-7 12S3 14 3 9a7 7 0 1 1 14 0Z"/><circle cx="10" cy="9" r="2.3"/></svg>
      <span>{current.label}</span><svg className="city-chevron" viewBox="0 0 16 16" aria-hidden="true"><path d="m4 6 4 4 4-4"/></svg>
    </button>
    {open && <div className="city-menu" id="city-menu" role="menu" aria-label="Выбрать город" onKeyDown={menuKey}>{CITIES.map((option, index) => <button key={option.id} ref={element => { items.current[index] = element; }} className="city-option" role="menuitemradio" tabIndex={-1} aria-checked={city === option.id} onClick={() => { onChange(option.id); close(); }}>
      <span>{option.label}</span><svg viewBox="0 0 16 16" aria-hidden="true"><path d="m3 8 3 3 7-7"/></svg>
    </button>)}</div>}
  </div>;
}
