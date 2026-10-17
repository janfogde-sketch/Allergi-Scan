import React from 'react'
import ReactDOM from 'react-dom/client'
import App from './App.jsx'
import { installErrorReporting } from './errorReporter.js'
import ErrorBoundary from './ErrorBoundary.jsx'
import { installDevBadge } from './devBadge.js'
import { installInputModality } from './inputModality.js'

installErrorReporting()
installDevBadge()
installInputModality()

ReactDOM.createRoot(document.getElementById('root')!).render(
  <React.StrictMode>
    <ErrorBoundary screen="Appen" withStyles>
      <App />
    </ErrorBoundary>
  </React.StrictMode>,
)