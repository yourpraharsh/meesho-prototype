import { publicUrl } from '../../utils/publicUrl'
/** FAST wordmark — Figma 88:25170 */
export default function FastDeliveryLogo({ className = '' }) {
  return (
    <img
      className={`delivery-promise-fast-logo${className ? ` ${className}` : ''}`}
      src={publicUrl('/badges/fast-logo.svg')}
      alt=""
      width={57}
      height={14}
      decoding="async"
      aria-hidden
    />
  )
}
