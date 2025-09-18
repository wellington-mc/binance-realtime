import './sidebar.css'

type Props = { collapsed?: boolean }

const NAV = [
  { label: 'Markets', icon: '📈' },
]

export default function Sidebar({ collapsed }: Props) {
  return (
    <aside className={collapsed ? 'sb sb--collapsed' : 'sb'}>
      <div className="sb__brand">
        <div className="sb__logo">₿</div>
        <span className="sb__brandText">CryptoBoard</span>
      </div>
      <nav className="sb__nav">
        {NAV.map((item) => (
          <button key={item.label} className="sb__item">
            <span className="sb__icon" aria-hidden>{item.icon}</span>
            <span className="sb__label">{item.label}</span>
          </button>
        ))}
      </nav>
    </aside>
  )
}
