type Props = {
  data: number[]
  width?: number
  height?: number
  stroke?: string
}

export default function Sparkline({ data, width = 160, height = 48, stroke = '#3b82f6' }: Props) {
  if (!data || data.length < 2) {
    return <svg width={width} height={height} />
  }

  const min = Math.min(...data)
  const max = Math.max(...data)
  const range = max - min || 1
  const stepX = width / (data.length - 1)

  const points = data.map((v, i) => {
    const x = i * stepX
    const y = height - ((v - min) / range) * height
    return `${x.toFixed(1)},${y.toFixed(1)}`
  })

  const d = `M ${points.join(' L ')}`

  return (
    <svg width={width} height={height} viewBox={`0 0 ${width} ${height}`}>
      <defs>
        <linearGradient id="grad" x1="0" y1="0" x2="0" y2="1">
          <stop offset="0%" stopColor={stroke} stopOpacity="0.5" />
          <stop offset="100%" stopColor={stroke} stopOpacity="0" />
        </linearGradient>
      </defs>
      <path d={d} fill="none" stroke={stroke} strokeWidth="2" />
      <path d={`${d} L ${width},${height} L 0,${height} Z`} fill="url(#grad)" opacity="0.22" />
    </svg>
  )
}
