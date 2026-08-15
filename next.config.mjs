/** @type {import('next').NextConfig} */
const nextConfig = {
  async rewrites() {
    // o app de TV é um arquivo estático em public/tv/index.html;
    // este rewrite deixa abrir só "seusite.com/tv"
    return [{ source: '/tv', destination: '/tv/index.html' }];
  },
};

export default nextConfig;
