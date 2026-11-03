import { useState } from 'react'
import AddressForm from './AddressForm'
import { useRailActions } from '../../context/RailContext'
import { useCommittedPosture, useUiLayout } from '../../utils/uiTheme'
import './AddressPicker.css'

const CloseIcon = () => (
  <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" width="20" height="20" aria-hidden>
    <path d="M18 6 6 18M6 6l12 12" />
  </svg>
)

const PlusIcon = () => (
  <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" width="18" height="18" aria-hidden>
    <path d="M12 5v14M5 12h14" />
  </svg>
)

function formatAddressLine(addr) {
  const city = addr.city ?? 'Bangalore'
  return `${addr.line}, ${city}, Karnataka - ${addr.pin}`
}

/**
 * Figma BrowseX-Playground-2026 — Select Address sheet + add/edit form.
 */
export default function AddressPicker({
  addresses,
  selectedId,
  onSelect,
  onSaveAddress,
  onClose,
}) {
  /* Duo Open / Book show the picker as a popup with its own close; the rail postures that
     make it a full-height page (Folded, Stand) lift the rail and put the close there */
  const [uiLayout] = useUiLayout()
  const posture = useCommittedPosture()
  const popup = uiLayout === 'duo' && (posture === 'landscape' || posture === 'book')
  useRailActions(popup ? [] : [{ id: 'close', icon: 'close', label: 'Close', onClick: onClose }], { overlay: !popup })
  const [pendingId, setPendingId] = useState(selectedId)
  const [view, setView] = useState('list')
  const [editingAddress, setEditingAddress] = useState(null)

  const handleDeliver = () => {
    onSelect(pendingId)
  }

  const openAddForm = () => {
    setEditingAddress(null)
    setView('form')
  }

  const openEditForm = (addr, e) => {
    e.stopPropagation()
    setEditingAddress(addr)
    setView('form')
  }

  const handleSave = (data) => {
    const savedId = onSaveAddress?.(data, editingAddress?.id ?? null)
    if (savedId) setPendingId(savedId)
    setView('list')
    setEditingAddress(null)
  }

  const formTitle = editingAddress ? 'Edit Address' : 'Add New Address'

  return (
    <div className="address-picker-backdrop" onClick={onClose} aria-hidden="true">
      <div
        className="address-picker-sheet"
        role="dialog"
        aria-modal="true"
        aria-labelledby="address-picker-title"
        onClick={(e) => e.stopPropagation()}
      >
        <div className="address-picker-handle" aria-hidden />

        <div className="address-picker-header">
          <h2 id="address-picker-title" className="address-picker-title">
            {view === 'form' ? formTitle : 'Select Address'}
          </h2>
          <button type="button" className="address-picker-close" aria-label="Close" onClick={onClose}>
            <CloseIcon />
          </button>
        </div>

        {view === 'form' ? (
          <div className="address-picker-form-wrap">
            <AddressForm
              mode={editingAddress ? 'edit' : 'add'}
              initialAddress={editingAddress}
              onSave={handleSave}
              onBack={() => {
                setView('list')
                setEditingAddress(null)
              }}
            />
          </div>
        ) : (
          <>
        <div className="address-picker-list">
          {addresses.map((addr) => {
            const isSelected = addr.id === pendingId
            return (
              <button
                key={addr.id}
                type="button"
                className={`address-picker-card${isSelected ? ' address-picker-card--selected' : ''}`}
                onClick={() => setPendingId(addr.id)}
              >
                <span className={`address-picker-radio${isSelected ? ' address-picker-radio--selected' : ''}`} aria-hidden />

                <span className="address-picker-card-body">
                  <span className="address-picker-card-top">
                    <span
                      className="address-picker-edit"
                      role="button"
                      tabIndex={0}
                      onClick={(e) => openEditForm(addr, e)}
                      onKeyDown={(e) => {
                        if (e.key === 'Enter' || e.key === ' ') openEditForm(addr, e)
                      }}
                    >
                      EDIT
                    </span>
                  </span>
                  <span className="address-picker-name">
                    {addr.name} <span aria-hidden>•</span> {addr.phone}
                  </span>
                  <span className="address-picker-line">{formatAddressLine(addr)}</span>
                </span>
              </button>
            )
          })}
        </div>

        <button
          type="button"
          className="address-picker-add"
          onClick={(e) => {
            e.stopPropagation()
            openAddForm()
          }}
        >
          <PlusIcon />
          Add New Address
        </button>

        <button type="button" className="address-picker-cta" onClick={handleDeliver}>
          Deliver to this address
        </button>
          </>
        )}
      </div>
    </div>
  )
}

export { useCheckoutAddress } from './useCheckoutAddress'
