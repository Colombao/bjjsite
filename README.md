# CT Heishikan — Roger Santos Jiu-Jitsu

Site oficial construído em **Next.js 14 (App Router)** — preparado para evoluir
para e-commerce (kimonos, rashguards e produtos da equipe).

## Como rodar

```bash
npm install
npm run dev
```

Abra http://localhost:3000

## Build de produção

```bash
npm run build
npm start
```

## Publicar (recomendado: Vercel)

1. Suba este projeto para um repositório no GitHub
2. Acesse vercel.com → "New Project" → importe o repositório
3. Deploy automático — nada a configurar

## Estrutura

```
app/
  layout.jsx      → fontes (next/font), metadata e SEO
  page.jsx        → todas as seções da landing page
  globals.css     → design system (cores, tipografia, animações)
components/
  Navbar.jsx      → navegação + drawer mobile
  BeltProgress.jsx→ barra de progresso "graduação de faixa"
  RevealInit.jsx  → animações de entrada por scroll
  Loja.jsx        → captura de interessados na loja (em breve)
lib/const.js      → WhatsApp, Instagram e endereço em um só lugar
public/img/       → fotos da equipe
```

## Onde editar

- **Telefone/redes/endereço** → `lib/const.js`
- **Horários** → seção "HORÁRIOS" em `app/page.jsx`
- **Textos e números do mestre** → seção "O MESTRE" em `app/page.jsx`
- **Cores e fontes** → variáveis `:root` em `app/globals.css`

## Próximo passo: e-commerce

Caminho sugerido quando a loja for lançada:
- Criar rota `app/loja/page.jsx` com a vitrine
- Produtos: começar com um arquivo local (`lib/produtos.js`) e migrar para
  um CMS/banco (Sanity, Supabase) quando o catálogo crescer
- Pagamento: Stripe ou Mercado Pago (checkout transparente)
- O design system atual (globals.css) já cobre botões, cards e formulários
