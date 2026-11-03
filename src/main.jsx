import './utils/duoCoverEmbed' /* first: inside the Duo cover stand-in it locks storage */
import React from 'react'
import ReactDOM from 'react-dom/client'
import { BrowserRouter } from 'react-router-dom'
import App from './App'
import './index.css'

ReactDOM.createRoot(document.getElementById('root')).render(
  <React.StrictMode>
    {/* '/' locally and on Netlify; '/<repo>' on GitHub Pages (vite.config.js BASE_PATH) */}
    <BrowserRouter basename={import.meta.env.BASE_URL.replace(/\/$/, '')}>
      <App />
    </BrowserRouter>
  </React.StrictMode>
)
