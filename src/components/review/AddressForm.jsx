import { useState } from 'react'

const EMPTY_FORM = {
  name: '',
  phone: '',
  line: '',
  pin: '',
  landmark: '',
  city: 'Bangalore',
}

function addressToForm(addr) {
  if (!addr) return { ...EMPTY_FORM }
  const digits = String(addr.phone ?? '').replace(/\D/g, '').replace(/^91/, '').slice(0, 10)
  return {
    name: addr.name ?? '',
    phone: digits,
    line: addr.line ?? '',
    pin: addr.pin ?? '',
    landmark: addr.landmark ?? '',
    city: addr.city ?? 'Bangalore',
  }
}

function normalizePhone(digits) {
  return String(digits).replace(/\D/g, '').slice(0, 10)
}

/**
 * Add / edit address fields — Contact + Delivery Address (Figma checkout form).
 */
export default function AddressForm({ mode = 'add', initialAddress, onSave, onBack }) {
  const [form, setForm] = useState(() => addressToForm(initialAddress))

  const setField = (key, value) => {
    setForm((prev) => ({ ...prev, [key]: value }))
  }

  const handleSubmit = (e) => {
    e.preventDefault()
    const phone = normalizePhone(form.phone)
    if (!form.name.trim() || phone.length < 10 || !form.line.trim() || !form.pin.trim()) return
    onSave({
      name: form.name.trim(),
      phone,
      line: form.line.trim(),
      pin: form.pin.trim(),
      landmark: form.landmark.trim() || undefined,
      city: form.city.trim() || 'Bangalore',
    })
  }

  const canSave =
    form.name.trim().length > 0 &&
    normalizePhone(form.phone).length === 10 &&
    form.line.trim().length > 0 &&
    form.pin.trim().length >= 6

  return (
    <form className="address-form" onSubmit={handleSubmit}>
      <section className="address-form-section">
        <h3 className="address-form-section-title">Contact</h3>
        <div className="address-form-row">
          <label className="address-form-field address-form-field--underline">
            <span className="address-form-label">Name</span>
            <input
              type="text"
              value={form.name}
              onChange={(e) => setField('name', e.target.value)}
              autoComplete="name"
            />
          </label>
          <label className="address-form-field address-form-field--underline">
            <span className="address-form-label">Phone Number</span>
            <span className="address-form-phone">
              <span className="address-form-phone-prefix" aria-hidden>
                +91
              </span>
              <input
                type="tel"
                inputMode="numeric"
                value={form.phone}
                onChange={(e) => setField('phone', normalizePhone(e.target.value))}
                autoComplete="tel-national"
                maxLength={10}
              />
            </span>
          </label>
        </div>
      </section>

      <div className="address-form-divider" aria-hidden />

      <section className="address-form-section">
        <h3 className="address-form-section-title">Delivery Address</h3>
        <label className="address-form-field address-form-field--boxed">
          <span className="address-form-label">
            Full Address (House No., Road, Colony, Village)
          </span>
          <textarea
            rows={3}
            value={form.line}
            onChange={(e) => setField('line', e.target.value)}
            autoComplete="street-address"
          />
        </label>
        <label className="address-form-field address-form-field--underline">
          <span className="address-form-label">Pincode</span>
          <input
            type="text"
            inputMode="numeric"
            value={form.pin}
            onChange={(e) => setField('pin', e.target.value.replace(/\D/g, '').slice(0, 6))}
            autoComplete="postal-code"
            maxLength={6}
          />
        </label>
        <label className="address-form-field address-form-field--underline address-form-field--optional">
          <input
            type="text"
            value={form.landmark}
            onChange={(e) => setField('landmark', e.target.value)}
            placeholder="Nearby Famous Place/Shop/School, etc. (Optional)"
          />
        </label>
      </section>

      <div className="address-form-actions">
        <button type="button" className="address-form-back" onClick={onBack}>
          Back
        </button>
        <button type="submit" className="address-form-save" disabled={!canSave}>
          {mode === 'edit' ? 'Save address' : 'Add address'}
        </button>
      </div>
    </form>
  )
}

export { addressToForm, EMPTY_FORM }
