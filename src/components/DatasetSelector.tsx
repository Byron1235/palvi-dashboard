import type { DatasetKey } from '../data/types'

interface Props {
  active: DatasetKey
  onChange: (key: DatasetKey) => void
}

const DATASETS: DatasetKey[] = ['A', 'B', 'C', 'D']

export function DatasetSelector({ active, onChange }: Props) {
  return (
    <div className="dataset-selector">
      <span className="selector-label">Dataset</span>
      <div className="selector-buttons">
        {DATASETS.map((key) => (
          <button
            key={key}
            className={`selector-btn ${active === key ? 'active' : ''}`}
            onClick={() => onChange(key)}
          >
            {key}
          </button>
        ))}
      </div>
    </div>
  )
}
