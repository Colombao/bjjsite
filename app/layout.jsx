import './globals.css';
import { Cinzel, Cormorant_Garamond, Archivo } from 'next/font/google';

const cinzel = Cinzel({
  subsets: ['latin'],
  weight: ['500', '600', '700', '800'],
  variable: '--font-cinzel',
  display: 'swap',
});
const cormorant = Cormorant_Garamond({
  subsets: ['latin'],
  weight: ['500', '600'],
  style: ['italic'],
  variable: '--font-cormorant',
  display: 'swap',
});
const archivo = Archivo({
  subsets: ['latin'],
  weight: ['300', '400', '500', '600', '700'],
  variable: '--font-archivo',
  display: 'swap',
});

export const metadata = {
  title: 'CT Heishikan Aurum — Roger Santos Jiu-Jitsu | Jaraguá do Sul',
  description:
    'CT Heishikan Aurum — Roger Santos Brazilian Jiu-Jitsu em Jaraguá do Sul. Turmas para adultos e crianças. Disciplina, respeito, foco e confiança. Agende sua aula experimental.',
  openGraph: {
    title: 'CT Heishikan Aurum — Roger Santos Jiu-Jitsu',
    description:
      'Jiu-Jitsu brasileiro em Jaraguá do Sul/SC. Turmas adulto e kids. Agende sua aula experimental.',
    locale: 'pt_BR',
    type: 'website',
    images: ['/img/hero-roger.jpg'],
  },
};

export const viewport = {
  width: 'device-width',
  initialScale: 1,
  viewportFit: 'cover',
  themeColor: '#0B0A08',
};

export default function RootLayout({ children }) {
  return (
    <html lang="pt-BR">
      <body className={`${cinzel.variable} ${cormorant.variable} ${archivo.variable}`}>
        {children}
      </body>
    </html>
  );
}
