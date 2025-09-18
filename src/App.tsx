import { useEffect, useMemo, useState } from 'react'
import './App.css'
import Sidebar from './components/Sidebar'
import Topbar from './components/Topbar'
import TickerCard from './components/TickerCard'
import { connectBinanceTickers, formatPrice, toNumber, formatSymbol, fetchUsdtBrlRate, parsePairsInput, formatPairsForInput } from './services/binance'
import type { BinanceTicker } from './types'

const DEFAULT_PAIRS = [
  'BTCUSDT',
  'ETHUSDT',
  'BNBUSDT',
  'SOLUSDT',
  'XRPUSDT',
  'ADAUSDT',
]

type Row = {
  symbol: string
  last: number
  changePct: number
  high: number
  low: number
  volume: number
}

function App() {
  const loadInitialPairs = (): string[] => {
    try {
      const stored = localStorage.getItem('pairs')
      if (stored) {
        const arr = JSON.parse(stored)
        if (Array.isArray(arr) && arr.every((s) => typeof s === 'string')) return arr
      }
    } catch {}
    return DEFAULT_PAIRS
  }

  const [pairs, setPairs] = useState<string[]>(loadInitialPairs())
  const [data, setData] = useState<Record<string, BinanceTicker>>({})
  const [blink, setBlink] = useState<Record<string, 'up' | 'down' | null>>({})
  const [connected, setConnected] = useState(false)
  const [view, setView] = useState<'table' | 'cards'>('table')
  const [history, setHistory] = useState<Record<string, number[]>>({})
  const [usdtBrl, setUsdtBrl] = useState<number>(0)

  useEffect(() => {
    const conn = connectBinanceTickers(pairs, {
      onOpen: () => setConnected(true),
      onClose: () => setConnected(false),
      onTick: (ticker) => {
        setData((prev) => {
          const prevLast = prev[ticker.s]?.c
          const nextLast = ticker.c
          if (prevLast && nextLast && prevLast !== nextLast) {
            const dir = Number(nextLast) >= Number(prevLast) ? 'up' : 'down'
            setBlink((b) => ({ ...b, [ticker.s]: dir }))
            // limpa o blink depois de 900ms
            setTimeout(() => {
              setBlink((b) => ({ ...b, [ticker.s]: null }))
            }, 900)
          }
          return { ...prev, [ticker.s]: ticker }
        })
        // histórico para sparkline (últimos 60 pontos)
        setHistory((h) => {
          const last = Number(ticker.c)
          const arr = h[ticker.s] ? [...h[ticker.s], last] : [last]
          const trimmed = arr.length > 60 ? arr.slice(arr.length - 60) : arr
          return { ...h, [ticker.s]: trimmed }
        })
      },
    })
    return () => conn.dispose()
  }, [pairs])

  // Atualiza a cotação USDT->BRL a cada 60s
  useEffect(() => {
    let stop = false
    const load = async () => {
      const rate = await fetchUsdtBrlRate()
      if (!stop) setUsdtBrl(rate)
    }
    load()
    const id = setInterval(load, 60_000)
    return () => { stop = true; clearInterval(id) }
  }, [])

  const rows = useMemo<Row[]>(() => {
    return pairs.map((s) => {
      const t = data[s]
      return {
        symbol: s,
        last: toNumber(t?.c),
        changePct: toNumber(t?.P),
        high: toNumber(t?.h),
        low: toNumber(t?.l),
        volume: toNumber(t?.v),
      }
    })
  }, [pairs, data])

  const applySearch = (text: string) => {
    const next = parsePairsInput(text)
    if (next.length === 0) return
    setPairs(next)
    // reseta histórico para novos pares
    setHistory({})
    try { localStorage.setItem('pairs', JSON.stringify(next)) } catch {}
  }

  const resetPairs = () => {
    setPairs(DEFAULT_PAIRS)
    setHistory({})
    try { localStorage.setItem('pairs', JSON.stringify(DEFAULT_PAIRS)) } catch {}
  }

  return (
    <div className="layout">
      <Sidebar />
      <main className="main">
        <Topbar
          searchText={formatPairsForInput(pairs)}
          onApply={applySearch}
          onReset={resetPairs}
        />
        <div className="container">
          <header className="header">
            <h1>Binance Tickers (tempo real)</h1>
            <div className={`status ${connected ? 'on' : 'off'}`}>
              {connected ? 'Conectado' : 'Reconectando...'}
            </div>
          </header>

          <div className="tabs">
            <button className={view === 'table' ? 'tab active' : 'tab'} onClick={() => setView('table')}>Tabela</button>
            <button className={view === 'cards' ? 'tab active' : 'tab'} onClick={() => setView('cards')}>Cards</button>
          </div>

          {view === 'table' ? (
            <div className="table-wrapper">
              <table className="table">
                <thead>
                  <tr>
                    <th>Par</th>
                    <th>Último</th>
                    <th>Último (BRL)</th>
                    <th>Variação 24h</th>
                    <th>Máx 24h</th>
                    <th>Mín 24h</th>
                    <th>Volume</th>
                  </tr>
                </thead>
                <tbody>
                  {rows.map((r) => (
                    <tr key={r.symbol}>
                      <td>{formatSymbol(r.symbol)}</td>
                      <td className={blink[r.symbol] ? `monospace ${blink[r.symbol] === 'up' ? 'blink-up' : 'blink-down'}` : 'monospace'}>
                        {formatPrice(r.last, 4)}
                      </td>
                      <td className="monospace">
                        {usdtBrl ? `R$ ${formatPrice(r.last * usdtBrl, 2)}` : '-'}
                      </td>
                      <td className={r.changePct >= 0 ? 'up' : 'down'}>
                        {r.changePct >= 0 ? '+' : ''}
                        {formatPrice(r.changePct, 2)}%
                      </td>
                      <td>{formatPrice(r.high, 4)}</td>
                      <td>{formatPrice(r.low, 4)}</td>
                      <td>{formatPrice(r.volume, 2)}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          ) : (
            <div className="cards">
              {rows.map((r) => (
                <TickerCard
                  key={r.symbol}
                  symbol={formatSymbol(r.symbol)}
                  last={r.last}
                  changePct={r.changePct}
                  series={history[r.symbol] || []}
                  high={r.high}
                  low={r.low}
                  volume={r.volume}
                  brl={usdtBrl ? r.last * usdtBrl : undefined}
                />
              ))}
            </div>
          )}

          <footer className="footer">
            <small>
              Fonte: Binance WebSocket — pares: {pairs.join(', ')} | USDT/BRL: {usdtBrl ? `R$ ${formatPrice(usdtBrl, 2)}` : '...' }
            </small>
          </footer>
        </div>
      </main>
    </div>
  )
}

export default App
