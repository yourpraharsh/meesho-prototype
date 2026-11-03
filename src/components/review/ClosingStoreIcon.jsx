import { useId } from 'react'

/* the library door (rounded top corners): the doorway the leaves slide across */
const DOOR =
  'M7.25977 11.2578C7.25977 10.8436 7.59555 10.5078 8.00977 10.5078H12.0537C12.4679 10.5078 12.8037 10.8436 12.8037 11.2578V17.0816H7.25977L7.25977 11.2578Z'

/**
 * The closed status's icon: the Visual Library's multi-tone Shop (Monotone=Yes, node 765:40095 —
 * the same glyph as the FAQ's), whose door is split into two leaves that slide shut on a loop:
 * the doorway is lit (yellow-base) while open, the light goes out as the leaves meet and the store
 * dims. Everything but the door is the library's own paths; the leaves are the door's two halves,
 * in its colour as drawn (the door's 0.7 blue over the 0.8 body, made opaque), so the shut state
 * is the library icon. Reduced motion: the doors stay shut.
 */
export default function ClosingStoreIcon() {
  const doorwayId = useId()

  return (
    <svg className="dtr-faq-shop" viewBox="0 0 20 17.1034" fill="none" xmlns="http://www.w3.org/2000/svg" aria-hidden>
      <defs>
        <clipPath id={doorwayId}>
          <path d={DOOR} />
        </clipPath>
      </defs>
      <path
        className="dtr-faq-shop-body"
        opacity="0.8"
        d="M19.0348 16.6396V5.83087C19.0348 5.59262 18.9721 5.37946 18.8592 5.21645C18.7464 5.0409 18.6085 4.95312 18.458 4.95312H1.54262C1.39215 4.95312 1.24168 5.05344 1.14137 5.21645C1.02852 5.37946 0.96582 5.59262 0.96582 5.83087V16.6396C0.96582 16.8904 1.17899 17.1036 1.44231 17.1036L3.30766 17.1036H9.21919L18.5583 17.1036C18.8216 17.1036 19.0348 16.8904 19.0348 16.6396Z"
        fill="#90B1FB"
      />
      {/* the doorway: dark inside (it shows as the seam once the leaves meet), lit while open */}
      <path d={DOOR} fill="#3A66CF" />
      <path className="dtr-faq-shop-light" d={DOOR} fill="#F4B619" />
      <g clipPath={`url(#${doorwayId})`}>
        <rect className="dtr-faq-shop-leaf dtr-faq-shop-leaf--l" x="7.26" y="10.5" width="2.57" height="6.6" fill="#6D93EC" />
        <rect className="dtr-faq-shop-leaf dtr-faq-shop-leaf--r" x="10.23" y="10.5" width="2.57" height="6.6" fill="#6D93EC" />
      </g>
      {/* awning */}
      <path
        d="M18.5326 0.539029V2.29451H1.4668V0.539029C1.4668 0.401098 1.52949 0.263167 1.62981 0.150314C1.73012 0.0500006 1.86805 -0.0126953 2.01852 -0.0126953H17.9934C18.1439 -0.0126953 18.2818 0.0500006 18.3822 0.150314C18.4825 0.250628 18.5452 0.388559 18.5452 0.539029H18.5326Z"
        fill="#5580E6"
      />
      <path d="M4 6.00627C4 7.10972 3.10972 8 2.00627 8C0.902821 8 0 7.10972 0 6.00627H4Z" fill="#3A66CF" />
      <path d="M8.40125 2.29467L8.05016 5.57994L8 6.00627H4L4.30094 4.95298L5.07837 2.29467H8.40125Z" fill="#DBE6FF" />
      <path d="M8 6.00627C8 7.10972 7.10972 8 6.00627 8C4.90282 8 4 7.10972 4 6.00627H8Z" fill="#5580E6" />
      <path d="M12 6.00627H8L8.05016 5.57994L8.40125 2.29467H11.5987L11.9498 5.57994L12 6.00627Z" fill="#5580E6" />
      <path d="M12 6.00627C12 7.10972 11.1097 8 10.0063 8C8.90282 8 8 7.10972 8 6.00627H12Z" fill="#3A66CF" />
      <path d="M16 6.00627H12L11.9498 5.57994L11.5987 2.29467H14.9216L15.6865 4.94044L16 6.00627Z" fill="#DBE6FF" />
      <path d="M16 6.00627C16 7.10972 15.1097 8 13.9937 8C12.8777 8 12 7.10972 12 6.00627H16Z" fill="#5580E6" />
      <path opacity="0.7" d="M8 6.00586C8 7.10931 7.10972 7.99959 6.00627 7.99959C4.90282 7.99959 4 7.10931 4 6.00586H8Z" fill="#5580E6" />
      <path opacity="0.7" d="M16 6.00586C16 7.10931 15.1097 7.99959 13.9937 7.99959C12.8777 7.99959 12 7.10931 12 6.00586H16Z" fill="#5580E6" />
      <path d="M20.0002 6.00603H16.0002L15.6868 4.9402L14.9219 2.29443H18.5332L19.3231 4.28816V4.3007L19.4611 4.6518L20.0002 6.00603Z" fill="#5580E6" />
      <path d="M20 6.00627C20 7.10972 19.0972 8 17.9937 8C16.8903 8 16 7.10972 16 6.00627H20Z" fill="#3A66CF" />
      <path d="M5.07837 2.29467L4.30094 4.95298L4 6.00627H0L0.514107 4.68966L0.652038 4.31348L1.44201 2.29467H5.07837Z" fill="#5580E6" />
    </svg>
  )
}
