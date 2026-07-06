import Image from 'next/image';
import Navbar from '@/components/Navbar';
import BeltProgress from '@/components/BeltProgress';
import RevealInit from '@/components/RevealInit';
import Loja from '@/components/Loja';
import { wa, INSTAGRAM, MAPS } from '@/lib/const';

const Arrow = () => (
  <svg width="16" height="12" viewBox="0 0 16 12" fill="none" stroke="currentColor" strokeWidth="1.6">
    <path d="M0 6 h14 M10 1 l5 5 -5 5" />
  </svg>
);

export default function Home() {
  return (
    <>
      <BeltProgress />
      <Navbar />
      <RevealInit />

      {/* ============ HERO ============ */}
      <header className="hero" id="inicio">
        <div className="hero-bg">
          <Image className="hero-desk" src="/img/hero-roger.jpg" alt="Mestre Roger Santos no tatame do CT Heishikan" fill priority sizes="100vw" style={{ objectFit: 'cover', objectPosition: 'center 28%' }} />
          <Image className="hero-mob" src="/img/mestre-retrato.jpg" alt="Mestre Roger Santos no tatame do CT Heishikan" fill priority sizes="100vw" style={{ objectFit: 'cover', objectPosition: 'center 16%' }} />
        </div>
        <div className="hero-tri" aria-hidden="true">
          <svg viewBox="0 0 100 100" preserveAspectRatio="xMidYMid meet">
            <defs>
              <linearGradient id="gTri" x1="0" y1="1" x2="1" y2="0">
                <stop offset="0" stopColor="#8F6B1E" /><stop offset=".5" stopColor="#D9A83C" /><stop offset="1" stopColor="#F0C566" />
              </linearGradient>
            </defs>
            <path d="M50 6 L96 94 L4 94 Z" />
          </svg>
        </div>
        <div className="hero-inner">
          <div className="hero-eyebrow"><span className="rule" /><span>Jaraguá do Sul · Santa Catarina</span></div>
          <h1>
            <span className="l1">A ARTE SUAVE,</span>
            <span className="l2">LEVADA A SÉRIO.</span>
          </h1>
          <p className="hero-sub">No CT Heishikan, o Jiu-Jitsu brasileiro é ensinado como se vive: com disciplina, respeito, foco e confiança — do primeiro nó na faixa branca à jornada rumo à faixa preta.</p>
          <div className="hero-actions">
            <a className="btn btn-gold" href={wa('Olá! Quero agendar uma aula experimental no CT Heishikan.')} target="_blank" rel="noopener noreferrer">Agendar aula experimental</a>
            <a className="btn btn-ghost" href="#programas">Conhecer os programas</a>
          </div>
        </div>
        <div className="hero-scroll">Role</div>
      </header>

      {/* ============ MARQUEE ============ */}
      <div className="marquee" aria-hidden="true">
        <div className="marquee-track">
          {[0, 1].map((i) => (
            <div className="mq-item" key={i}>
              <b>DISCIPLINA</b><i /><span>RESPEITO</span><i /><b>FOCO</b><i /><span>CONFIANÇA</span><i />
              <b>OSS</b><i /><span>CT HEISHIKAN</span><i />
            </div>
          ))}
        </div>
      </div>

      {/* ============ O MESTRE ============ */}
      <section className="mestre" id="mestre">
        <div className="wrap mestre-grid">
          <div className="mestre-figure rv">
            <div className="frame-edge" />
            <div className="frame">
              <Image src="/img/mestre-retrato.jpg" alt="Professor Roger Santos, faixa preta de Brazilian Jiu-Jitsu" fill sizes="(max-width:880px) 100vw, 45vw" />
            </div>
            <div className="tri-badge">
              <Image src="/img/logo-heishikan.jpg" alt="Emblema CT Heishikan" width={86} height={86} style={{ width: '78%', height: '78%', borderRadius: '50%', objectFit: 'cover' }} />
            </div>
          </div>
          <div className="mestre-copy">
            <p className="eyebrow rv">Quem conduz o tatame</p>
            <h2 className="rv rv-d1">Professor <em>Roger Santos</em></h2>
            <p className="rv rv-d2">À frente do CT Heishikan, o professor Roger Santos dedica sua vida a transmitir o Jiu-Jitsu brasileiro em sua forma mais completa: técnica apurada, defesa pessoal real e formação de caráter dentro e fora do tatame.</p>
            <p className="rv rv-d2">A equipe integra a linhagem <strong>Jaraguá BJJ — Henrique Buda</strong>, unindo tradição e metodologia moderna em um ambiente acolhedor, onde iniciantes, competidores, crianças e famílias treinam lado a lado.</p>
            <blockquote className="mestre-quote rv rv-d3">“A faixa apenas cobre dois centímetros do seu quadril. O resto, você precisa conquistar todos os dias.”</blockquote>
            <div className="mestre-stats">
              <div className="stat rv rv-d1"><div className="num" data-count="20">0</div><div className="lbl">Anos de tatame</div></div>
              <div className="stat rv rv-d2"><div className="num" data-count="100">0</div><div className="lbl">Alunos formados</div></div>
              <div className="stat rv rv-d3"><div className="num" data-count="4">0</div><div className="lbl">Valores inegociáveis</div></div>
            </div>
          </div>
        </div>
      </section>

      {/* ============ PILARES ============ */}
      <section className="pilares">
        <div className="wrap">
          <p className="eyebrow rv">Nossa filosofia</p>
          <h2 className="rv rv-d1">Os quatro pilares do <em>Heishikan</em></h2>
          <div className="pilar-grid">
            <div className="pilar rv">
              <div className="glyph"><svg viewBox="0 0 24 24"><path d="M12 2 L21 21 L3 21 Z" /><path d="M12 9 v6" /></svg></div>
              <h3>DISCIPLINA</h3>
              <p>Constância vence talento. O hábito de aparecer, treinar e repetir constrói resultados que a motivação sozinha não sustenta.</p>
            </div>
            <div className="pilar rv rv-d1">
              <div className="glyph"><svg viewBox="0 0 24 24"><path d="M7 12 l4 4 L18 6" /><circle cx="12" cy="12" r="10" /></svg></div>
              <h3>RESPEITO</h3>
              <p>Ao mestre, ao parceiro de treino e a si mesmo. O tatame é uma escola de convivência antes de ser um campo de combate.</p>
            </div>
            <div className="pilar rv rv-d2">
              <div className="glyph"><svg viewBox="0 0 24 24"><circle cx="12" cy="12" r="9" /><circle cx="12" cy="12" r="4.5" /><circle cx="12" cy="12" r="1" /></svg></div>
              <h3>FOCO</h3>
              <p>Cada posição, cada detalhe, cada respiração. O Jiu-Jitsu ensina a mente a permanecer presente sob pressão.</p>
            </div>
            <div className="pilar rv rv-d3">
              <div className="glyph"><svg viewBox="0 0 24 24"><path d="M12 3 l2.6 5.4 L20.5 9.3 l-4.2 4.1 1 5.9 L12 16.6 6.7 19.3 l1-5.9 L3.5 9.3 9.4 8.4 Z" /></svg></div>
              <h3>CONFIANÇA</h3>
              <p>A segurança de quem sabe se defender transforma a postura diante da vida — das crianças aos adultos.</p>
            </div>
          </div>
        </div>
      </section>

      {/* ============ PROGRAMAS ============ */}
      <section id="programas">
        <div className="wrap">
          <p className="eyebrow rv">Treine com a gente</p>
          <h2 className="rv rv-d1">Programas para <em>cada jornada</em></h2>
          <p className="lead rv rv-d2">Do primeiro dia de tatame ao ritmo de competição, há uma turma esperando por você no CT Heishikan.</p>
          <div className="prog-grid">
            <article className="prog rv">
              <div className="ph"><Image src="/img/turma-noite.jpg" alt="Turma adulta de Jiu-Jitsu do CT Heishikan" fill sizes="(max-width:1020px) 100vw, 33vw" /></div>
              <div className="prog-body">
                <span className="prog-tag">Adultos · GI</span>
                <h3>Jiu-Jitsu Adulto</h3>
                <p>Fundamentos, posições avançadas e sparring com metodologia progressiva. Para iniciantes e graduados.</p>
                <a className="prog-link" href={wa('Olá! Tenho interesse na turma adulta.')} target="_blank" rel="noopener noreferrer">Quero treinar <Arrow /></a>
              </div>
            </article>
            <article className="prog rv rv-d1">
              <div className="ph"><Image src="/img/kids.jpg" alt="Turma infantil Jiu-Jitsu Kids do CT Heishikan" fill sizes="(max-width:1020px) 100vw, 33vw" /></div>
              <div className="prog-body">
                <span className="prog-tag">Kids · 4 a 12 anos</span>
                <h3>Jiu-Jitsu Kids</h3>
                <p>Coordenação motora, defesa pessoal e valores para a vida — num ambiente seguro, lúdico e disciplinado.</p>
                <a className="prog-link" href={wa('Olá! Quero matricular meu filho(a) no Jiu-Jitsu Kids.')} target="_blank" rel="noopener noreferrer">Matricular meu filho <Arrow /></a>
              </div>
            </article>
            <article className="prog rv rv-d2">
              <div className="ph"><Image src="/img/turma-manha.jpg" alt="Alunos iniciantes perfilados no tatame" fill sizes="(max-width:1020px) 100vw, 33vw" /></div>
              <div className="prog-body">
                <span className="prog-tag">Iniciantes · Primeira vez</span>
                <h3>Aula Experimental</h3>
                <p>Nunca treinou? Venha sentir o tatame sem compromisso. Kimono emprestado e recepção de equipe.</p>
                <a className="prog-link" href={wa('Olá! Quero agendar minha aula experimental gratuita.')} target="_blank" rel="noopener noreferrer">Agendar agora <Arrow /></a>
              </div>
            </article>
          </div>
        </div>
      </section>

      {/* ============ HORÁRIOS ============ */}
      <section className="horarios" id="horarios">
        <div className="wrap">
          <p className="eyebrow rv">Planeje sua semana</p>
          <h2 className="rv rv-d1">Horários de <em>treino</em></h2>
          <div className="hor-grid">
            <div className="hor-card rv">
              <h3>JIU-JITSU KIDS</h3>
              <p className="who">crianças de 4 a 12 anos</p>
              <div className="hor-row"><span className="dia">Segundas e Quartas</span><span className="hora">09:00 · 18:00</span></div>
              <div className="hor-row"><span className="dia">Terças e Quintas</span><span className="hora">18:00</span></div>
            </div>
            <div className="hor-card rv rv-d1">
              <h3>JIU-JITSU ADULTO</h3>
              <p className="who">a partir de 13 anos · todos os níveis</p>
              <div className="hor-row"><span className="dia">Segunda a Sexta</span><span className="hora">Manhã e Noite</span></div>
              <div className="hor-row"><span className="dia">Grade completa</span><span className="hora">Consulte no WhatsApp</span></div>
            </div>
          </div>
          <p className="hor-note rv rv-d2"><i />Treinos no anexo à Academia Espaço Maior — R. Primo Ronchi, 90, Vila Nova, Jaraguá do Sul/SC. Primeira aula sem compromisso.</p>
        </div>
      </section>

      {/* ============ GALERIA ============ */}
      <section id="galeria">
        <div className="wrap">
          <p className="eyebrow rv">Nossa família no tatame</p>
          <h2 className="rv rv-d1">Uma equipe, <em>uma jornada</em></h2>
          <div className="gal-grid">
            <div className="gal w2 h2 rv"><Image src="/img/equipe-grande.jpg" alt="Equipe completa do CT Heishikan reunida no tatame" fill sizes="(max-width:1020px) 100vw, 50vw" /></div>
            <div className="gal rv rv-d1"><Image src="/img/turma-lineup.jpg" alt="Alunos perfilados após o treino" fill sizes="(max-width:1020px) 50vw, 25vw" /></div>
            <div className="gal rv rv-d2"><Image src="/img/selfie-alunos.jpg" alt="Professor Roger com alunos após o treino" fill sizes="(max-width:1020px) 50vw, 25vw" /></div>
            <div className="gal w2 rv rv-d1"><Image src="/img/hero-roger.jpg" alt="Professor Roger Santos entre os emblemas Jaraguá BJJ e Roger Santos Jiu-Jitsu" fill sizes="(max-width:1020px) 100vw, 50vw" /></div>
            <div className="gal rv rv-d2"><Image src="/img/kids.jpg" alt="Turma kids reunida com os professores" fill sizes="(max-width:1020px) 50vw, 25vw" /></div>
            <div className="gal rv rv-d3"><Image src="/img/turma-noite.jpg" alt="Turma da noite reunida para a foto oficial" fill sizes="(max-width:1020px) 50vw, 25vw" /></div>
          </div>
        </div>
      </section>

      {/* ============ LOJA (EM BREVE) ============ */}
      <Loja />

      {/* ============ CONTATO ============ */}
      <section id="contato">
        <div className="wrap contato-grid">
          <div>
            <p className="eyebrow rv">Fale com a gente</p>
            <h2 className="rv rv-d1">Seu lugar no tatame <em>está esperando</em></h2>
            <div style={{ marginTop: '2rem' }}>
              <a className="cont-item rv" href="https://wa.me/5547988224140" target="_blank" rel="noopener noreferrer">
                <span className="ico"><svg viewBox="0 0 24 24"><path d="M21 11.5a8.5 8.5 0 0 1-12.3 7.6L3 21l1.9-5.7A8.5 8.5 0 1 1 21 11.5Z" /></svg></span>
                <span><span className="lbl">WhatsApp</span><br /><span className="val">(47) 98822-4140</span></span>
              </a>
              <a className="cont-item rv rv-d1" href={INSTAGRAM} target="_blank" rel="noopener noreferrer">
                <span className="ico"><svg viewBox="0 0 24 24"><rect x="3" y="3" width="18" height="18" rx="5" /><circle cx="12" cy="12" r="4" /><circle cx="17.2" cy="6.8" r=".8" fill="currentColor" /></svg></span>
                <span><span className="lbl">Instagram</span><br /><span className="val">@heishikan_rogersantosbjj</span></span>
              </a>
              <a className="cont-item rv rv-d2" href={MAPS} target="_blank" rel="noopener noreferrer">
                <span className="ico"><svg viewBox="0 0 24 24"><path d="M12 21s7-6.1 7-11a7 7 0 1 0-14 0c0 4.9 7 11 7 11Z" /><circle cx="12" cy="10" r="2.6" /></svg></span>
                <span><span className="lbl">Endereço</span><br /><span className="val">R. Primo Ronchi, 90 · Vila Nova, Jaraguá do Sul/SC<br /><small style={{ color: 'var(--mute)' }}>Anexo à Academia Espaço Maior</small></span></span>
              </a>
            </div>
          </div>
          <div className="cont-figure rv rv-d1">
            <Image src="/img/selfie-alunos.jpg" alt="Clima de treino no CT Heishikan" fill sizes="(max-width:880px) 100vw, 40vw" />
          </div>
        </div>
      </section>

      {/* ============ CTA FINAL ============ */}
      <section className="cta-final">
        <div className="tri-bg" aria-hidden="true">
          <svg viewBox="0 0 100 88"><path d="M50 2 L98 86 L2 86 Z" fill="none" stroke="#D9A83C" strokeWidth=".6" /></svg>
        </div>
        <div className="wrap">
          <p className="eyebrow rv" style={{ justifyContent: 'center' }}>O primeiro passo é seu</p>
          <h2 className="rv rv-d1">Amarre a faixa.<br /><em>O resto a gente ensina.</em></h2>
          <p className="lead rv rv-d2" style={{ marginLeft: 'auto', marginRight: 'auto' }}>Agende sua aula experimental gratuita e descubra por que o Jiu-Jitsu transforma corpos, mentes e famílias inteiras.</p>
          <a className="btn btn-gold rv rv-d3" href={wa('Olá! Quero agendar minha aula experimental gratuita.')} target="_blank" rel="noopener noreferrer">Começar agora pelo WhatsApp</a>
        </div>
      </section>

      {/* ============ FOOTER ============ */}
      <footer>
        <div className="foot-grid">
          <div className="foot-brand">
            <Image src="/img/logo-heishikan.jpg" alt="Logo CT Heishikan" width={52} height={52} />
            <div>
              <div className="fb-top">CT HEISHIKAN</div>
              <div className="fb-sub">Roger Santos Brazilian Jiu-Jitsu</div>
            </div>
          </div>
          <div className="foot-social">
            <a href={INSTAGRAM} target="_blank" rel="noopener noreferrer" aria-label="Instagram"><svg viewBox="0 0 24 24"><rect x="3" y="3" width="18" height="18" rx="5" /><circle cx="12" cy="12" r="4" /><circle cx="17.2" cy="6.8" r=".8" fill="currentColor" /></svg></a>
            <a href="https://wa.me/5547988224140" target="_blank" rel="noopener noreferrer" aria-label="WhatsApp"><svg viewBox="0 0 24 24"><path d="M21 11.5a8.5 8.5 0 0 1-12.3 7.6L3 21l1.9-5.7A8.5 8.5 0 1 1 21 11.5Z" /></svg></a>
          </div>
        </div>
        <div className="foot-base">
          <span>© {new Date().getFullYear()} CT Heishikan · Roger Santos Jiu-Jitsu — Jaraguá do Sul/SC</span>
          <span>Linhagem Jaraguá BJJ · Henrique Buda</span>
        </div>
      </footer>

      {/* ============ WHATSAPP FLUTUANTE ============ */}
      <a className="wa-float" href={wa('Olá! Vim pelo site do CT Heishikan.')} target="_blank" rel="noopener noreferrer" aria-label="Falar no WhatsApp">
        <svg viewBox="0 0 32 32"><path d="M16 3C9.4 3 4 8.4 4 15c0 2.6.8 5 2.2 7L4.5 28l6.2-1.6c1.9 1 4 1.6 5.3 1.6 6.6 0 12-5.4 12-12S22.6 3 16 3Zm0 21.8c-1.8 0-3.5-.5-5-1.3l-.4-.2-3.7 1 1-3.6-.2-.4A9.7 9.7 0 0 1 6.2 15c0-5.4 4.4-9.8 9.8-9.8s9.8 4.4 9.8 9.8-4.4 9.8-9.8 9.8Zm5.4-7.3c-.3-.1-1.7-.9-2-1-.3-.1-.5-.1-.7.1-.2.3-.8 1-.9 1.2-.2.2-.3.2-.6.1-.3-.1-1.2-.5-2.4-1.5-.9-.8-1.5-1.8-1.6-2.1-.2-.3 0-.5.1-.6l.4-.5c.1-.2.2-.3.3-.5.1-.2 0-.4 0-.5l-.9-2.2c-.2-.6-.5-.5-.7-.5h-.6c-.2 0-.5.1-.8.4-.3.3-1 1-1 2.5s1.1 2.9 1.2 3.1c.1.2 2.1 3.2 5.1 4.5.7.3 1.3.5 1.7.6.7.2 1.4.2 1.9.1.6-.1 1.7-.7 2-1.4.2-.7.2-1.3.2-1.4-.1-.1-.3-.2-.6-.4Z" /></svg>
      </a>
    </>
  );
}
