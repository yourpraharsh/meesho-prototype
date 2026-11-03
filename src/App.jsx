import { useEffect } from 'react'
import { Routes, Route, useLocation, useNavigate } from 'react-router-dom'
import { IS_DUO_COVER, duoCoverSrc } from './utils/duoCoverEmbed'
import { WishlistProvider } from './context/WishlistContext'
import { CartProvider } from './context/CartContext'
import { ToastProvider, ToastHost } from './context/ToastContext'
import { PlpCardVariantProvider } from './context/PlpCardVariantContext'
import { PriceDropVariantProvider } from './context/PriceDropVariantContext'
import { CohortProvider } from './context/CohortContext'
import PincodeGate from './components/PincodeGate'
import Home from './pages/Home'
import SearchResults from './pages/SearchResults'
import ProductDetails from './pages/ProductDetails'
import ReviewOrder from './pages/ReviewOrder'
import PaymentOrder from './pages/PaymentOrder'
import OrderSuccess from './pages/OrderSuccess'
import OrderListing from './pages/OrderListing'
import OrderDetails from './pages/OrderDetails'
import Cart from './pages/Cart'
import CartReview from './pages/CartReview'
import PlpCardLab from './pages/PlpCardLab'
import FaqLab from './pages/FaqLab'
import UiSkinToggle from './components/UiSkinToggle'
import DuoRail from './components/DuoRail'
import DuoDevice from './components/DuoDevice'
import { RailProvider } from './context/RailContext'
import './styles/glassNav.css'
import './styles/duoLayout.css'

/* inside the Duo cover stand-in: follow the live app's page and scroll when asked, then say
   when that has been drawn */
function DuoCoverSync() {
  const navigate = useNavigate()
  const location = useLocation()
  useEffect(() => {
    const onMessage = async (e) => {
      if (e.origin !== window.location.origin || e.data?.type !== 'duo-cover-sync') return
      const { id, path, scrollTop } = e.data
      const target = duoCoverSrc(path)
      /* router paths, so it also holds under a base path (GitHub Pages) */
      if (`${location.pathname}${location.search}` !== target) navigate(target, { replace: true })
      const frame = () => new Promise((r) => requestAnimationFrame(() => r()))
      await frame()
      await frame()
      const scroller = document.querySelector('.app-scroll')
      if (scroller) scroller.scrollTop = scrollTop || 0
      await frame()
      e.source?.postMessage({ type: 'duo-cover-ready', id }, window.location.origin)
    }
    window.addEventListener('message', onMessage)
    return () => window.removeEventListener('message', onMessage)
  }, [navigate, location])
  return null
}

export default function App() {
  const location = useLocation()
  /* review page for the Call Store FAQ versions: full width, outside the phone / Duo shell */
  if (location.pathname === '/faq-lab') return <FaqLab />
  return (
    <WishlistProvider>
      <CartProvider>
      <ToastProvider>
      <PlpCardVariantProvider>
        <PriceDropVariantProvider>
          <CohortProvider>
            <PincodeGate>
            <RailProvider>
            <DuoDevice>
            <div className="app">
              {/* the scroller: in the Duo device viewport this scrolls while fixed chrome stays on the screen */}
              <div className="app-scroll">
              <Routes>
                <Route path="/" element={<Home />} />
                <Route path="/search" element={<SearchResults />} />
                <Route path="/plp-lab" element={<PlpCardLab />} />
                <Route path="/product/:id" element={<ProductDetails />} />
                <Route path="/product/:id/review" element={<ReviewOrder />} />
                <Route path="/product/:id/payment" element={<PaymentOrder />} />
                <Route path="/order/success" element={<OrderSuccess />} />
                <Route path="/orders" element={<OrderListing />} />
                <Route path="/orders/:id" element={<OrderDetails />} />
                <Route path="/cart" element={<Cart />} />
                <Route path="/cart/review" element={<CartReview />} />
                <Route path="/cart/payment" element={<PaymentOrder cart />} />
              </Routes>
              </div>
              <DuoRail />
              <ToastHost />
            </div>
            </DuoDevice>
            {IS_DUO_COVER ? <DuoCoverSync /> : <UiSkinToggle />}
            </RailProvider>
            </PincodeGate>
          </CohortProvider>
        </PriceDropVariantProvider>
      </PlpCardVariantProvider>
      </ToastProvider>
      </CartProvider>
    </WishlistProvider>
  )
}
