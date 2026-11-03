import { useMemo } from 'react'
import DeliveryPromiseRow from '../delivery/DeliveryPromiseRow'
import { DEFAULT_DELIVERY_PIN, getDeliveryPromiseForPdp } from '../../utils/deliveryPromise'

export default function PdpDeliverySection({ product, pin = DEFAULT_DELIVERY_PIN }) {
  const promise = useMemo(
    () => (product ? getDeliveryPromiseForPdp(product, pin) : null),
    [product, pin],
  )

  if (!promise) return null

  return <DeliveryPromiseRow promise={promise} size="pdp" />
}
