import React from 'react'
import ReactDOM from 'react-dom/client'
import App from './App.jsx'
import { installErrorReporting } from './errorReporter.js'

installErrorReporting()

ReactDOM.createRoot(document.getElementById('root')!).render(
  <React.StrictMode>
    <App />
  </React.StrictMode>,
)