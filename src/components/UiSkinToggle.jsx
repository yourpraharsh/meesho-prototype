import { createPortal } from 'react-dom'
import { DUO_POSTURES, postureSplits, setUiState, useDuoPosture, useDuoSplit, useUiLayout, useUiTheme } from '../utils/uiTheme'
import { POSTURE_META, PostureIcon } from './DuoPostureIcons'
import './UiSkinToggle.css'

const SPLITS = [
  { id: 'full', label: 'Full screen' },
  { id: 'left', label: 'App left' },
  { id: 'right', label: 'App right' },
]

const SplitGlyph = ({ id }) => (
  <svg width="22" height="16" viewBox="0 0 22 16" aria-hidden>
    <rect x="1" y="1" width="20" height="14" rx="3" fill="none" stroke="currentColor" strokeWidth="1.6" />
    {id === 'full' && <rect x="3.5" y="3.5" width="15" height="9" rx="1.5" fill="currentColor" />}
    {id === 'left' && <rect x="3.5" y="3.5" width="6.6" height="9" rx="1.5" fill="currentColor" />}
    {id === 'right' && <rect x="11.9" y="3.5" width="6.6" height="9" rx="1.5" fill="currentColor" />}
    {id !== 'full' && <path d="M11 3v10" stroke="currentColor" strokeWidth="1" strokeDasharray="1.5 1.5" />}
  </svg>
)

const OPTIONS = [
  { id: 'android', label: 'Android', theme: 'android', layout: 'phone' },
  { id: 'ios', label: 'iOS', theme: 'ios', layout: 'phone' },
  { id: 'duo', label: 'Duo', theme: 'ios', layout: 'duo' },
]

/**
 * Research control: Meesho (Android) · Liquid Glass (iOS) · iPhone Duo.
 * Rendered into <body> so it never sits inside the device screen; in Duo it becomes a
 * control bar above the device with the six posture options.
 */
export default function UiSkinToggle() {
  const [theme] = useUiTheme()
  const [layout] = useUiLayout()
  const [posture] = useDuoPosture()
  const split = useDuoSplit()
  const current = layout === 'duo' ? 'duo' : theme
  const isDuo = layout === 'duo'

  const bar = (
    <div className={`ui-skin${isDuo ? ' ui-skin--duo' : ''}`} role="toolbar" aria-label="Device preview">
      <div className="ui-skin-group" role="group" aria-label="Device skin">
        {OPTIONS.map((o) => (
          <button
            key={o.id}
            type="button"
            className={`ui-skin-btn${current === o.id ? ' ui-skin-btn--on' : ''}`}
            aria-pressed={current === o.id}
            onClick={() => setUiState({ theme: o.theme, layout: o.layout })}
          >
            {o.label}
          </button>
        ))}
      </div>
      {isDuo && (
        <div className="ui-skin-postures" role="radiogroup" aria-label="iPhone Duo posture">
          {DUO_POSTURES.map((p) => (
            <button
              key={p}
              type="button"
              role="radio"
              aria-checked={posture === p}
              className={`ui-skin-posture${posture === p ? ' ui-skin-posture--on' : ''}`}
              title={`${POSTURE_META[p].label} · ${POSTURE_META[p].hint}`}
              /* the preview gets ready for a fold the moment the pointer heads for it */
              onPointerEnter={() => window.dispatchEvent(new CustomEvent('duo-intent', { detail: p }))}
              onClick={() => setUiState({ posture: p })}
            >
              <PostureIcon posture={p} size={30} />
              <span className="ui-skin-posture-label">{POSTURE_META[p].label}</span>
            </button>
          ))}
        </div>
      )}
      {isDuo && postureSplits(posture) && (
        <div className="ui-skin-splits" role="radiogroup" aria-label="Split view">
          {SPLITS.map((o) => (
            <button
              key={o.id}
              type="button"
              role="radio"
              aria-checked={split === o.id}
              className={`ui-skin-split${split === o.id ? ' ui-skin-split--on' : ''}`}
              onClick={() => setUiState({ split: o.id })}
            >
              <SplitGlyph id={o.id} />
              {o.label}
            </button>
          ))}
        </div>
      )}
    </div>
  )

  return typeof document === 'undefined' ? bar : createPortal(bar, document.body)
}
