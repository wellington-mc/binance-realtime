# Binance Realtime (React + Vite)

Aplicação em React que acompanha, em tempo real, os tickers da Binance via WebSocket, com tabela e cards, mini‑gráfico (sparkline), variação 24h e conversão para BRL.

## Recursos
- Visualização em abas: Tabela e Cards.
- Sparkline por par (histórico curto dos últimos preços).
- Destaque visual quando o preço sobe/desce.
- Conversão USD → BRL usando USDT/BRL da própria Binance (REST).
- Busca de pares inteligente: aceita `BTCUSDT`, `BTC/USDT` ou apenas `BTC` (assume USDT).
- Lista de pares persistida no `localStorage` e botão de reset.
- Sidebar colapsável e layout responsivo.

## Como rodar local
Pré‑requisitos: Node 18+.

```bash
# instalar deps
npm install

# ambiente de desenvolvimento
npm run dev

# build de produção
npm run build

# pré‑visualizar build
npm run preview
```

Se você prefere Yarn:
```bash
yarn
yarn dev
```

## Deploy (GitHub Pages)
Este repositório já está preparado para Pages:

- `vite.config.ts` com `base: '/binance-realtime/'`.
- Workflow em `.github/workflows/deploy.yml` que faz build e publica em Pages a cada push na `main`.

Após o primeiro push:
1. Vá em Settings → Pages → Source: GitHub Actions (se ainda não estiver).
2. Aguarde o workflow finalizar. A URL ficará:
   `https://wellington-mc.github.io/binance-realtime/`

Opcionalmente, você pode usar `gh-pages` manualmente:
```bash
npm run build
npm run deploy
```

## Observações técnicas
- WebSocket: stream `!ticker@arr` multi‑par da Binance.
- Conversão BRL: `GET /api/v3/ticker/price?symbol=USDTBRL`.
- O app não exige API keys.

## Licença
Uso livre para fins de portfólio e estudos. Se for publicar, cite o repositório.

