import React from 'react'
import ReactDOM from 'react-dom/client'
import App from './App.jsx'
import { installErrorReporting } from './errorReporter.js'
import ErrorBoundary from './ErrorBoundary.jsx'

installErrorReporting()

ReactDOM.createRoot(document.getElementById('root')!).render(
  <React.StrictMode>
    <ErrorBoundary screen="Appen" withStyles>
      <App />
    </ErrorBoundary>
  </React.StrictMode>,
)