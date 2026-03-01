import React from 'react'
import ReactDOM from 'react-dom/client'
import App from '@/App.jsx'
import '@/index.css'
import { ThemeProvider } from '@/components/theme-provider'

ReactDOM.createRoot(document.getElementById('root')).render(
  <ThemeProvider defaultTheme="system" storageKey="zerithum-ui-theme">
    <App />
  </ThemeProvider>
)
