/** Delivery OTP: the message it is shared with, and the copy / WhatsApp actions. */

/** What Share / WhatsApp send — someone else at home can hand the OTP over at the door. */
export const deliveryOtpMessage = (otp) =>
  `Delivery OTP for my Meesho order: ${otp}. Share it with the delivery partner when the parcel arrives.`

/** Copies to the clipboard; a blocked clipboard is ignored (the code is on screen anyway). */
export async function copyText(text) {
  try {
    await navigator.clipboard?.writeText(text)
  } catch {
    /* clipboard blocked */
  }
}

/** Opens WhatsApp's share screen (app on a phone, WhatsApp Web elsewhere) with the text filled in. */
export function shareOnWhatsApp(text) {
  window.open(`https://wa.me/?text=${encodeURIComponent(text)}`, '_blank', 'noopener,noreferrer')
}
