'use client';

import { useState } from 'react';
import { wa } from '@/lib/const';

export default function Loja() {
  const [contato, setContato] = useState('');
  const [msg, setMsg] = useState('');

  const enviar = (e) => {
    e.preventDefault();
    const v = contato.trim();
    if (!v) return;
    setMsg('Perfeito! Abrindo o WhatsApp para confirmar seu interesse…');
    window.open(wa(`Olá! Quero ser avisado do lançamento da loja Heishikan. Contato: ${v}`), '_blank');
  };

  return (
    <section className="loja" id="loja">
      <div className="wrap rv">
        <svg className="kimono-ico" viewBox="0 0 64 64">
          <path d="M24 8 h16 l10 6 6 14 -8 4 -4 -8 v32 H20 V24 l-4 8 -8 -4 6 -14 Z" />
          <path d="M24 8 c2 6 14 6 16 0" />
          <path d="M20 44 h24" />
        </svg>
        <p className="eyebrow" style={{ justifyContent: 'center' }}>Em breve</p>
        <h2>Loja oficial <em>Heishikan</em></h2>
        <p>Kimonos, rashguards e produtos oficiais da equipe estão a caminho. Deixe seu WhatsApp ou e-mail e seja avisado em primeira mão no lançamento.</p>
        <form className="loja-form" onSubmit={enviar}>
          <input
            type="text"
            placeholder="Seu WhatsApp ou e-mail"
            value={contato}
            onChange={(e) => setContato(e.target.value)}
            required
          />
          <button className="btn btn-gold" type="submit">Quero ser avisado</button>
        </form>
        <p style={{ marginTop: '1.2rem', color: 'var(--gold-hi)', fontSize: '.9rem', minHeight: '1.4em' }}>{msg}</p>
      </div>
    </section>
  );
}
