import { useId } from 'react'

/** Figma delivery truck — node 1790:5357 */
export default function DeliveryTruckIcon() {
  const clipId = useId()

  return (
    <svg width="16" height="16" viewBox="0 0 16 16" fill="none" xmlns="http://www.w3.org/2000/svg" aria-hidden>
      <g clipPath={`url(#${clipId})`}>
        <path
          d="M16 8.85828V11.0437C16 11.6301 15.5203 12.1098 14.9339 12.1098H14.4187C14.2143 12.9005 13.4947 13.4868 12.6507 13.4868C11.8068 13.4868 11.0872 12.9005 10.8828 12.1098H5.10827C4.90394 12.9005 4.20211 13.4868 3.34037 13.4868C2.47862 13.4868 1.77679 12.9005 1.56358 12.1098H1.15491C0.524153 12.1098 0 11.5324 0 10.8216V9.15145H10.9361V5.0293H12.6507C13.0239 5.0293 13.3792 5.20698 13.6191 5.49126L15.6979 8.03207C15.8934 8.25417 15.9822 8.55623 15.9822 8.8494H15.9911L16 8.85828Z"
          fill="#8B8BA3"
        />
        <path
          d="M12.0022 3.11049V9.4714H0V3.11049C0 2.50639 0.470849 2 1.03942 2H10.9628C11.5403 2 12.0022 2.48862 12.0022 3.11049Z"
          fill="#CECEDE"
        />
      </g>
      <defs>
        <clipPath id={clipId}>
          <rect width="16" height="11.4781" fill="white" transform="translate(0 2)" />
        </clipPath>
      </defs>
    </svg>
  )
}
