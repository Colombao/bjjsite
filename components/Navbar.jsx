'use client';

import { useEffect, useState } from 'react';
import Image from 'next/image';
import { wa } from '@/lib/const';

const LINKS = [
  { href: '#mestre', label: 'O Mestre' },
  { href: '#programas', label: 'Programas' },
  { href: '#feminino', label: 'Feminino' },
  { href: '#estrutura', label: 'Estrutura' },
  { href: '#horarios', label: 'Horários' },
  { href: '#galeria', label: 'Galeria' },
  { href: '#contato', label: 'Contato' },
];

export default function Navbar() {
  const [scrolled, setScrolled] = useState(false);
  const [open, setOpen] = useState(false);

  useEffect(() => {
    const onScroll = () => setScrolled(window.scrollY > 40);
    onScroll();
    window.addEventListener('scroll', onScroll, { passive: true });
    return () => window.removeEventListener('scroll', onScroll);
  }, []);

  useEffect(() => {
    document.body.style.overflow = open ? 'hidden' : '';
    const onKey = (e) => e.key === 'Escape' && setOpen(false);
    window.addEventListener('keydown', onKey);
    return () => {
      document.body.style.overflow = '';
      window.removeEventListener('keydown', onKey);
    };
  }, [open]);

  const close = () => setOpen(false);

  return (
    <>
      <nav className={scrolled ? 'scrolled' : ''}>
        <a className="nav-brand" href="#inicio" onClick={close}>
          <Image src="/img/logo-heishikan.png" alt="Logo CT Heishikan Aurum" width={44} height={44} />
          <span className="nb-txt">
            <span className="nb-top">CT HEISHIKAN AURUM</span>
            <br />
            <span className="nb-sub">Roger Santos BJJ</span>
          </span>
        </a>

        <div className="nav-links">
          {LINKS.map((l) => (
            <a key={l.href} href={l.href}>{l.label}</a>
          ))}
          <a
            className="nav-cta"
            href={wa('Olá! Quero agendar uma aula experimental no CT Heishikan Aurum.')}
            target="_blank"
            rel="noopener noreferrer"
          >
            Aula Experimental
          </a>
        </div>

        <button
          className={`burger ${open ? 'open' : ''}`}
          aria-label={open ? 'Fechar menu' : 'Abrir menu'}
          aria-expanded={open}
          aria-controls="drawer"
          onClick={() => setOpen(!open)}
        >
          <span /><span /><span />
        </button>
      </nav>

      {/* Menu mobile — drawer lateral */}
      <div className={`drawer-backdrop ${open ? 'open' : ''}`} onClick={close} aria-hidden="true" />
      <aside id="drawer" className={`drawer ${open ? 'open' : ''}`} aria-hidden={!open}>
        <div className="drawer-head">
          <div className="db">
            <Image src="/img/logo-heishikan.png" alt="" width={40} height={40} />
            <div>
              <div className="t1">CT HEISHIKAN AURUM</div>
              <div className="t2">Roger Santos BJJ</div>
            </div>
          </div>
          <button className="drawer-close" onClick={close} aria-label="Fechar menu">
            <svg viewBox="0 0 16 16" fill="none"><path d="M2 2 L14 14 M14 2 L2 14" /></svg>
          </button>
        </div>

        <div className="drawer-links">
          {LINKS.map((l) => (
            <a key={l.href} href={l.href} onClick={close}>
              {l.label}
              <svg viewBox="0 0 16 12" fill="none"><path d="M0 6 h14 M10 1 l5 5 -5 5" /></svg>
            </a>
          ))}
        </div>

        <div className="drawer-cta">
          <a
            className="btn btn-gold"
            href={wa('Olá! Quero agendar uma aula experimental no CT Heishikan Aurum.')}
            target="_blank"
            rel="noopener noreferrer"
            onClick={close}
          >
            Aula experimental
          </a>
        </div>

        <div className="drawer-foot">
          <div className="df-lbl">Fale com a gente</div>
          <a href="https://wa.me/5547988224140" target="_blank" rel="noopener noreferrer">(47) 98822-4140</a>
          <a href="https://instagram.com/heishikan_rogersantosbjj" target="_blank" rel="noopener noreferrer">@heishikan_rogersantosbjj</a>
          <div className="df-tri" aria-hidden="true">
            <svg viewBox="0 0 24 24"><path d="M12 3 L22 21 L2 21 Z" /></svg>
          </div>
        </div>
      </aside>
    </>
  );
}
