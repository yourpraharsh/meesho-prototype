import { useNavigate } from 'react-router-dom'
import BottomNav from '../components/BottomNav'
import { deliveryOtp, getOrdersForListing, isOutForDelivery, shortEta } from '../utils/orders'
import { DELIVERY_TYPE } from '../utils/deliveryTypes'
import './OrderListing.css'

const IMAGE_FALLBACK = 'https://placehold.co/400x400/e2e8f0/64748b?text=Product'

const SearchIcon = () => (
  <svg viewBox="0 0 24 24" width="24" height="24" fill="none" stroke="currentColor" strokeWidth="1.8" aria-hidden>
    <circle cx="11" cy="11" r="7" />
    <path d="m20 20-3.8-3.8" strokeLinecap="round" />
  </svg>
)

const FilterIcon = () => (
  <svg viewBox="0 0 24 24" width="22" height="22" fill="none" stroke="currentColor" strokeWidth="2.2" strokeLinecap="round" aria-hidden>
    <path d="M4 7h16M7 12h10M10 17h4" />
  </svg>
)

const ChevronIcon = () => (
  <svg viewBox="0 0 24 24" width="24" height="24" fill="none" stroke="currentColor" strokeWidth="2" aria-hidden>
    <path d="m9 6 6 6-6 6" strokeLinecap="round" strokeLinejoin="round" />
  </svg>
)

const MallBadgeIcon = () => (
  <svg viewBox="0 0 16 16" width="14" height="14" aria-hidden>
    <path d="m8 1.2 1.5 1.3 2-.4.6 1.9 1.8.8-.7 1.9.7 1.9-1.8.8-.6 1.9-2-.4L8 14.8l-1.5-1.3-2 .4-.6-1.9-1.8-.8.7-1.9-.7-1.9 1.8-.8.6-1.9 2 .4L8 1.2Z" fill="#fff" />
    <path d="m5.4 8.1 1.7 1.7 3.5-3.6" fill="none" stroke="#5E2BD9" strokeWidth="1.6" strokeLinecap="round" strokeLinejoin="round" />
  </svg>
)

/** Order Listing Page (OLP) — "My Orders" tab. */
export default function OrderListing() {
  const navigate = useNavigate()
  const orders = getOrdersForListing()

  return (
    <div className="olp has-bottom-nav">
      <header className="olp-header">
        <h1 className="olp-title">My Orders</h1>
      </header>

      <div className="olp-toolbar">
        <label className="olp-search">
          <SearchIcon />
          <input className="olp-search-input" type="search" placeholder="Search orders" />
        </label>
        <button type="button" className="olp-filters">
          <FilterIcon /> Filters
        </button>
      </div>

      <ul className="olp-list">
        {orders.map((order) => {
          const isPickup = order.deliveryTypeId === DELIVERY_TYPE.PICKUP
          const outForDelivery = isOutForDelivery(order)
          return (
            <li key={order.id}>
              <button
                type="button"
                className="olp-card"
                onClick={() => navigate(`/orders/${order.id}`)}
              >
                <img
                  className="olp-card-img"
                  src={order.image || IMAGE_FALLBACK}
                  alt=""
                  onError={(e) => {
                    e.currentTarget.onerror = null
                    e.currentTarget.src = IMAGE_FALLBACK
                  }}
                />
                <span className="olp-card-body">
                  <span className="olp-card-status">{outForDelivery ? 'Out for Delivery' : 'Order Placed'}</span>
                  {outForDelivery ? (
                    /* the OTP to give the delivery partner, right on the card */
                    <span className="olp-card-eta">
                      Delivery OTP <b className="olp-otp">{deliveryOtp(order)}</b>
                    </span>
                  ) : (
                    <span className="olp-card-eta">
                      {isPickup ? 'Store pickup by ' : 'Delivery by '}
                      {shortEta(order.etaLabel)}
                    </span>
                  )}
                  <span className="olp-card-meta">
                    {order.sizeLabel && (
                      <>
                        Size: {order.sizeLabel}
                        <span className="olp-dot" aria-hidden />
                      </>
                    )}
                    Qty: {order.qty ?? 1}
                  </span>
                  <span className="olp-card-chips">
                    <span className="olp-chip olp-chip--mall">
                      <MallBadgeIcon /> Mall
                    </span>
                  </span>
                </span>
                <span className="olp-card-chevron" aria-hidden>
                  <ChevronIcon />
                </span>
              </button>
            </li>
          )
        })}
      </ul>

      <BottomNav active="orders" />
    </div>
  )
}
