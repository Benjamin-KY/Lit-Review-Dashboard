import React from 'react'
import ReactDOM from 'react-dom/client'
import App from './App.tsx'
import './index.css'

// Import test runner for development (disabled for production build)
// @ts-ignore
// if (import.meta.env?.DEV) {
//   import('./testRunner');
// }

ReactDOM.createRoot(document.getElementById('root')!).render(
  <React.StrictMode>
    <App />
  </React.StrictMode>,
)