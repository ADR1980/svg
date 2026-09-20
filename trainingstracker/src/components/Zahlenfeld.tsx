/* Zahlenfeld mit zwei großen Tippzielen. Der Wert lässt sich eintippen oder
   in Schritten verstellen — beides ohne Zielen. */

interface Args {
  etikett: string
  wert: number | null
  einheit?: string
  schritt?: number
  min?: number
  aendern: (wert: number | null) => void
}

export function Zahlenfeld({ etikett, wert, einheit, schritt = 1, min = 0, aendern }: Args) {
  const verstellen = (richtung: number) => {
    const neu = Math.max(min, Math.round(((wert ?? 0) + richtung * schritt) * 100) / 100)
    aendern(neu)
  }

  return (
    <div className="flex-1">
      <div className="etikett mb-1">
        {etikett}
        {einheit ? ` · ${einheit}` : ''}
      </div>
      <div className="flex items-stretch gap-2">
        <button
          type="button"
          className="ziel border border-rule px-3 font-mono text-lg text-muted"
          onClick={() => verstellen(-1)}
          aria-label={`${etikett} verringern`}
        >
          −
        </button>
        <input
          type="number"
          inputMode="decimal"
          step={schritt}
          className="feld text-center"
          value={wert ?? ''}
          onChange={(e) => aendern(e.target.value === '' ? null : Number(e.target.value))}
          onFocus={(e) => e.currentTarget.select()}
        />
        <button
          type="button"
          className="ziel border border-rule px-3 font-mono text-lg text-muted"
          onClick={() => verstellen(1)}
          aria-label={`${etikett} erhöhen`}
        >
          +
        </button>
      </div>
    </div>
  )
}
