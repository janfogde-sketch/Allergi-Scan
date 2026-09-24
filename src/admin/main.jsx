import React from 'react'
import ReactDOM from 'react-dom/client'
import AdminApp from './AdminApp.jsx'
import { adminCss } from './adminTheme.js'

const styleEl = document.createElement('style')
styleEl.textContent = adminCss
document.head.appendChild(styleEl)

ReactDOM.createRoot(document.getElementById('admin-root')).render(
  <React.StrictMode>
    <AdminApp />
  </React.StrictMode>,
)
