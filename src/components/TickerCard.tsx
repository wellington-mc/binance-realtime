import './ticker-card.css'
import Sparkline from './Sparkline'
import { formatPrice, formatCompact } from '../services/binance'

type Props = {
  symbol: string
  last: number
  changePct: number
  series: number[]
  high?: number
  low?: number
  volume?: number
  brl?: number // preço em BRL
}

export default function TickerCard({ symbol, last, changePct, series, high, low, volume, brl }: Props) {
  const up = changePct >= 0
  return (
    <div className="tk">
      <div className="tk__header">
        <div className="tk__symbol">{symbol}</div>
        <div className={`tk__badge ${up ? 'up' : 'down'}`}>
          {up ? '+' : ''}{formatPrice(changePct, 2)}%
        </div>
      </div>
      <div className="tk__main">
        <div className="tk__price">
          {formatPrice(last, 4)}
          {brl ? <div className="tk__subprice">R$ {formatPrice(brl, 2)}</div> : null}
        </div>
        <Sparkline data={series} height={54} />
      </div>
      <div className="tk__meta">
        <div><span>Máx</span><strong>{high !== undefined ? formatPrice(high, 4) : '-'}</strong></div>
        <div><span>Mín</span><strong>{low !== undefined ? formatPrice(low, 4) : '-'}</strong></div>
        <div><span>Vol</span><strong>{volume !== undefined ? formatCompact(volume) : '-'}</strong></div>
      </div>
    </div>
  )
}
