import type { BinanceTicker, TickerEvent } from "../types";

export type TickerHandlers = {
  onTick: (ticker: BinanceTicker) => void;
  onOpen?: () => void;
  onClose?: (ev: CloseEvent) => void;
  onError?: (ev: Event) => void;
};

/**
 * Cria uma conexão WebSocket com a Binance para múltiplos pares.
 * - pairs: símbolos como ["BTCUSDT", "ETHUSDT"].
 * - Retorna uma função `dispose()` para encerrar a conexão.
 */
export function connectBinanceTickers(pairs: string[], handlers: TickerHandlers) {
  let ws: WebSocket | null = null;
  let closedByUser = false;
  let retries = 0;

  const streams = pairs.map((p) => `${p.toLowerCase()}@ticker`).join("/");
  const url = `wss://stream.binance.com:9443/stream?streams=${streams}`;

  const connect = () => {
    ws = new WebSocket(url);

    ws.onopen = () => {
      retries = 0;
      handlers.onOpen?.();
    };

    ws.onmessage = (msg) => {
      try {
        const payload: TickerEvent = JSON.parse(msg.data as string);
        if (payload?.data) handlers.onTick(payload.data);
      } catch (e) {
        // Ignora mensagens inválidas
      }
    };

    ws.onerror = (ev) => handlers.onError?.(ev);

    ws.onclose = (ev) => {
      handlers.onClose?.(ev);
      if (!closedByUser) {
        // Backoff exponencial simples até 10s
        const delay = Math.min(10000, 1000 * Math.pow(2, retries++));
        setTimeout(connect, delay);
      }
    };
  };

  connect();

  return {
    dispose() {
      closedByUser = true;
      ws?.close();
    },
  };
}

/**
 * Converte um texto de entrada em uma lista de pares Binance (ex.: "BTC/USDT, ethusdt sol/usdt")
 * -> ["BTCUSDT", "ETHUSDT", "SOLUSDT"]
 */
export function parsePairsInput(text: string): string[] {
  if (!text) return []
  return text
    .split(/[\s,;]+/)
    .map((t) => t.replaceAll('/', '').trim().toUpperCase())
    .map((t) => {
      // Se o usuário digitar apenas o ativo (ex.: XRP), assumimos USDT
      if (/^[A-Z]{2,5}$/.test(t)) return t + 'USDT'
      return t
    })
    .filter((t) => t.length >= 6)
}

export function formatPairsForInput(pairs: string[]) {
  return pairs.map(formatSymbol).join(', ')
}

export function formatPrice(value: string | number, digits = 2) {
  const n = typeof value === "string" ? Number(value) : value;
  if (Number.isNaN(n)) return "-";
  return n.toLocaleString(undefined, {
    minimumFractionDigits: digits,
    maximumFractionDigits: digits,
  });
}

export function toNumber(v?: string) {
  const n = Number(v);
  return Number.isFinite(n) ? n : 0;
}

export function formatCompact(value: number) {
  if (!Number.isFinite(value)) return '-';
  try {
    return value.toLocaleString(undefined, {
      notation: 'compact',
      maximumFractionDigits: 2,
    });
  } catch {
    // fallback simples
    if (Math.abs(value) >= 1_000_000_000) return (value / 1_000_000_000).toFixed(2) + 'B';
    if (Math.abs(value) >= 1_000_000) return (value / 1_000_000).toFixed(2) + 'M';
    if (Math.abs(value) >= 1_000) return (value / 1_000).toFixed(2) + 'K';
    return String(value);
  }
}

/**
 * Converte símbolo da Binance para formato "BASE/QUOTE" (ex.: BTCUSDT -> BTC/USDT).
 */
export function formatSymbol(sym: string) {
  const QUOTES = [
    'USDT', 'BUSD', 'USDC', 'BTC', 'ETH', 'BNB', 'BRL', 'EUR', 'TRY'
  ];
  const upper = sym.toUpperCase();
  for (const q of QUOTES) {
    if (upper.endsWith(q)) {
      const base = upper.slice(0, -q.length);
      if (base) return `${base}/${q}`;
    }
  }
  // fallback (últimos 4 como quote)
  return `${upper.slice(0, -4)}/${upper.slice(-4)}`;
}

/**
 * Busca a cotação USDT/BRL na Binance (REST) e retorna número em BRL por 1 USDT.
 * Atualize periodicamente (ex.: a cada 60s).
 */
export async function fetchUsdtBrlRate(): Promise<number> {
  try {
    const res = await fetch('https://api.binance.com/api/v3/ticker/price?symbol=USDTBRL');
    const json = await res.json();
    const price = Number(json?.price);
    return Number.isFinite(price) ? price : 0;
  } catch {
    return 0;
  }
}
