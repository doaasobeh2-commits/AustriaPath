import React from 'react'
import ReactDOM from 'react-dom/client'
import App from './app/App.jsx'
import { initFrontendSecurity } from './security/initSecurity.js'

initFrontendSecurity()

ReactDOM.createRoot(document.getElementById('root')).render(
  <React.StrictMode>
    <App />
  </React.StrictMode>,
)