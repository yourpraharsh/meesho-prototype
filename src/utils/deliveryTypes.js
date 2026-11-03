/**
 * Delivery type selection (Self-pickup v2) — Figma 779:50287.
 * Pickup savings derive from computeOrder() totals; components never hold literal prices.
 */

export const DELIVERY_TYPE = {
  HOME: 'home',
  PICKUP: 'pickup',
}

/** Days a pickup store keeps a parcel after it arrives. */
export const PICKUP_HOLD_DAYS = 3

/* Store pickup discount: a fixed ₹30 per order plus ₹10 for every unit in it, whether the
   unit is more of the same product or a different one (1 unit → ₹40, 3 units → ₹60). */
const PICKUP_SAVINGS_FIXED = 30
const PICKUP_SAVINGS_PER_UNIT = 10

/** Units in an order: a cart order's total quantity, a placed order's qty, else 1. */
function getOrderUnits(order) {
  return Math.max(1, order?.qtyTotal ?? order?.qty ?? 1)
}

/**
 * Pickup discount for an order ({ orderTotal } plus qtyTotal / qty when more than one unit),
 * never more than the order itself.
 */
export function getPickupSavings(order) {
  const total = order?.orderTotal
  if (!total || total <= 0) return 0
  return Math.min(total, PICKUP_SAVINGS_FIXED + PICKUP_SAVINGS_PER_UNIT * getOrderUnits(order))
}

/**
 * Order totals adjusted for the chosen delivery type.
 * computeOrder() stays the single base pricing source; this layers the pickup
 * discount on top so review, payment, and success all agree.
 * @param {ReturnType<typeof import('./computeOrder').computeOrder>} order
 * @param {string | null | undefined} deliveryTypeId
 */
export function applyDeliveryType(order, deliveryTypeId) {
  if (!order || deliveryTypeId !== DELIVERY_TYPE.PICKUP) return order
  const pickupSavings = getPickupSavings(order)
  const orderTotal = Math.max(0, order.orderTotal - pickupSavings)
  const totalDiscount = order.totalDiscount + pickupSavings
  return {
    ...order,
    orderTotal,
    totalDiscount,
    pickupSavings,
    deliveryTypeId,
    discountPercent: order.mrp > 0 ? Math.round((totalDiscount / order.mrp) * 100) : 0,
    savingsLabel: totalDiscount > 0 ? `₹${totalDiscount} discount applied` : null,
    youSaveLabel: totalDiscount > 0 ? `You'll save ₹${totalDiscount}` : null,
  }
}

import { getStoresForSelectedPincode } from './testPincode'

/**
 * Pickup stores for the session — real stores (<1km, closest first) for the
 * tester's selected pincode, else the labelled placeholders below.
 */
export function getPickupStores() {
  return getStoresForSelectedPincode() ?? PICKUP_STORES
}

/** Placeholder pickup stores — used when no test pincode is selected. */
export const PICKUP_STORES = [
  {
    id: 'karthik',
    name: 'Karthik Stores',
    landmark: 'Near HDFC Bank',
    walk: '2 mins walk',
    hours: '8 AM – 10 PM',
    phone: '+91 98123 45678',
    awning: '#9F2089',
  },
  {
    id: 'sri-ganesh',
    name: 'Sri Ganesh General Store',
    landmark: 'Opp. Bazaar Samiti Gate',
    walk: '5 mins walk',
    hours: '9 AM – 9 PM',
    phone: '+91 98876 54321',
    awning: '#EE7212',
  },
  {
    id: 'anand',
    name: 'Anand Provision Mart',
    landmark: 'Beside SBI ATM, 4th Cross',
    walk: '8 mins walk',
    hours: '8 AM – 10 PM',
    phone: '+91 98112 23344',
    awning: '#038D63',
  },
]
