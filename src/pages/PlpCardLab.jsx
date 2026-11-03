import { Link } from 'react-router-dom'
import { PLP_CARD_VARIANTS } from '../constants/plpCardVariant'
import { PRICE_DROP_VARIANTS } from '../constants/priceDropVariant'
import { usePlpCardVariant } from '../context/PlpCardVariantContext'
import { usePriceDropVariant } from '../context/PriceDropVariantContext'
import './PlpCardLab.css'

export default function PlpCardLab() {
  const { variantId, setVariantId } = usePlpCardVariant()
  const { variantId: priceDropVariantId, setVariantId: setPriceDropVariantId } = usePriceDropVariant()

  return (
    <div className="plp-lab">
      <header className="plp-lab-header">
        <Link to="/" className="plp-lab-back" aria-label="Back to home">
          ←
        </Link>
        <div className="plp-lab-header-text">
          <h1 className="plp-lab-title">PLP card lab</h1>
          <p className="plp-lab-subtitle">Selection applies to Home PLP &amp; PDP cards</p>
        </div>
      </header>

      <p className="plp-lab-intro">
        Pick a variant, then open Home or any PDP. Cards update live with your choice (saved in this browser).
      </p>

      <ul className="plp-lab-list" role="listbox" aria-label="PLP card variants">
        {PLP_CARD_VARIANTS.map((v) => {
          const isActive = variantId === v.id
          const isDisabled = Boolean(v.disabled)
          return (
            <li key={v.id}>
              <button
                type="button"
                role="option"
                aria-selected={isActive}
                disabled={isDisabled}
                className={`plp-lab-option${isActive ? ' plp-lab-option--active' : ''}${isDisabled ? ' plp-lab-option--disabled' : ''}`}
                onClick={() => !isDisabled && setVariantId(v.id)}
              >
                <div className="plp-lab-option-row">
                  {v.labId && <span className="plp-lab-variant-id">{v.labId}</span>}
                  {!v.labId && <span className="plp-lab-variant-id plp-lab-variant-id--default">Default</span>}
                  <span className="plp-lab-variant-name">{v.name}</span>
                  {isActive && <span className="plp-lab-active-badge">Active</span>}
                </div>
                <p className="plp-lab-option-desc">{v.description}</p>
              </button>
            </li>
          )
        })}
      </ul>

      <h2 className="plp-lab-section-title">Price Drop validation</h2>
      <p className="plp-lab-section-intro">
        Toggle between the two Figma price-drop treatments. Cards with price consideration update on Home.
      </p>
      <ul className="plp-lab-list plp-lab-list--compact" role="listbox" aria-label="Price drop variants">
        {PRICE_DROP_VARIANTS.map((v) => {
          const isActive = priceDropVariantId === v.id
          return (
            <li key={v.id}>
              <button
                type="button"
                role="option"
                aria-selected={isActive}
                className={`plp-lab-option${isActive ? ' plp-lab-option--active' : ''}`}
                onClick={() => setPriceDropVariantId(v.id)}
              >
                <div className="plp-lab-option-row">
                  <span className="plp-lab-variant-id">{v.labId}</span>
                  <span className="plp-lab-variant-name">{v.name}</span>
                  {isActive && <span className="plp-lab-active-badge">Active</span>}
                </div>
                <p className="plp-lab-option-desc">{v.description}</p>
              </button>
            </li>
          )
        })}
      </ul>

      <div className="plp-lab-footer">
        <Link to="/" className="plp-lab-cta">
          View on Home →
        </Link>
      </div>
    </div>
  )
}
