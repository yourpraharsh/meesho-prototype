import { publicUrl } from '../../utils/publicUrl'
/** Delivery truck mark — motion lines + truck (Figma 1388:40936) */
export default function DeliveryTruckMark({ className = '' }) {
  return (
    <img
      className={`delivery-promise-truck-icon${className ? ` ${className}` : ''}`}
      src={publicUrl('/badges/delivery-promise-truck.svg')}
      alt=""
      width={27}
      height={14}
      decoding="async"
      aria-hidden
    />
  )
}
