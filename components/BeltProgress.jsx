'use client';

import { useEffect, useRef, useState } from 'react';

const BELTS = [
  [0, 'BRANCA'], [20, 'AZUL'], [42, 'ROXA'],
  [64, 'MARROM'], [86, 'PRETA'], [97, 'CORAL'],
];

export default function BeltProgress() {
  const fillRef = useRef(null);
  const [belt, setBelt] = useState('BRANCA');
  const [show, setShow] = useState(false);

  useEffect(() => {
    const onScroll = () => {
      const h = document.documentElement;
      const p = (h.scrollTop / (h.scrollHeight - h.clientHeight)) * 100 || 0;
      if (fillRef.current) fillRef.current.style.width = p + '%';
      setShow(p > 1 && p < 99.5);
      let b = BELTS[0][1];
      for (const [t, n] of BELTS) if (p >= t) b = n;
      setBelt(b);
    };
    onScroll();
    window.addEventListener('scroll', onScroll, { passive: true });
    return () => window.removeEventListener('scroll', onScroll);
  }, []);

  return (
    <>
      <div className="belt-track"><div className="belt-fill" ref={fillRef} /></div>
      <div className={`belt-label ${show ? 'show' : ''}`}>FAIXA <b>{belt}</b></div>
    </>
  );
}
