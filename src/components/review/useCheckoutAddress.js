import { useEffect, useMemo, useState } from 'react'
import { PLACEHOLDER_ADDRESSES } from '../../utils/checkoutConfig'
import { getSelectedPincode } from '../../utils/testPincode'

let nextCustomAddressId = 1

/** User-testing: the chosen pincode replaces the default address location. */
function applyTestPincode(addresses) {
  const pin = getSelectedPincode()
  if (!pin) return addresses
  return addresses.map((a, index) =>
    index === 0
      ? { ...a, line: 'B404, SJR Complex, Untkhana Rd, Nagpur', city: 'Nagpur', pin }
      : a,
  )
}

/** Saved { addresses, addressId } for a flow that spans pages (the cart flow), or null. */
function loadPersisted(persistKey) {
  if (!persistKey) return null
  try {
    const saved = JSON.parse(window.sessionStorage.getItem(persistKey) || 'null')
    if (!saved || !Array.isArray(saved.addresses) || !saved.addresses.length) return null
    /* new addresses must not reuse a saved custom-N id */
    saved.addresses.forEach((a) => {
      const n = Number(String(a.id).match(/^custom-(\d+)$/)?.[1])
      if (n >= nextCustomAddressId) nextCustomAddressId = n + 1
    })
    return saved
  } catch {
    return null
  }
}

/**
 * `persistKey` (optional): keep the address list and the chosen address in sessionStorage
 * under that key, so every page of a multi-page flow (cart → review → payment) shows the
 * address picked on any of them.
 */
export function useCheckoutAddress(initialId = 'home', { persistKey = null } = {}) {
  const [persisted] = useState(() => loadPersisted(persistKey))
  const [addresses, setAddresses] = useState(() =>
    applyTestPincode(persisted ? persisted.addresses : [...PLACEHOLDER_ADDRESSES]),
  )
  const [addressId, setAddressId] = useState(persisted?.addressId ?? initialId)

  useEffect(() => {
    if (!persistKey) return
    try {
      window.sessionStorage.setItem(persistKey, JSON.stringify({ addresses, addressId }))
    } catch {
      /* storage unavailable: the choice lives on this page only */
    }
  }, [persistKey, addresses, addressId])
  const [showPicker, setShowPicker] = useState(false)
  const [justUpdated, setJustUpdated] = useState(false)

  const address = useMemo(
    () => addresses.find((a) => a.id === addressId) ?? addresses[0],
    [addresses, addressId],
  )

  const markUpdated = () => {
    setJustUpdated(true)
    window.setTimeout(() => setJustUpdated(false), 3000)
  }

  const selectAddress = (id) => {
    setAddressId(id)
    markUpdated()
    setShowPicker(false)
  }

  const saveAddress = (data, editId) => {
    if (editId) {
      setAddresses((prev) =>
        prev.map((a) => (a.id === editId ? { ...a, ...data } : a)),
      )
      setAddressId(editId)
      markUpdated()
      return editId
    }
    const id = `custom-${nextCustomAddressId++}`
    setAddresses((prev) => [
      ...prev,
      {
        id,
        label: 'Other',
        ...data,
      },
    ])
    setAddressId(id)
    markUpdated()
    return id
  }

  return {
    address,
    addressId,
    showPicker,
    setShowPicker,
    justUpdated,
    selectAddress,
    saveAddress,
    addresses,
  }
}
