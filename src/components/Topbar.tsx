import { useEffect, useState } from 'react'
import './topbar.css'

type Props = {
  searchText: string
  onApply: (text: string) => void
  onReset: () => void
}

export default function Topbar({ searchText, onApply, onReset }: Props) {
  const [text, setText] = useState(searchText)

  useEffect(() => {
    setText(searchText)
  }, [searchText])

  const submit = () => {
    onApply(text)
  }

  return (
    <div className="tb">
      <div className="tb__left">
        <div className="tb__title">Mercado</div>
      </div>
      <div className="tb__right">
        <div className="tb__search">
          <input
            placeholder="Buscar pares: BTCUSDT, ETHUSDT ou BTC/USDT"
            value={text}
            onChange={(e) => setText(e.target.value)}
            onKeyDown={(e) => { if (e.key === 'Enter') submit() }}
          />
        </div>
        <button className="tb__btn" onClick={onReset} title="Restaurar pares padrão">⟲</button>
        <button className="tb__btn" onClick={submit} title="Aplicar pares">✔️</button>
        <button className="tb__btn" title="Tema (em breve)">🌓</button>
      </div>
    </div>
  )
}
