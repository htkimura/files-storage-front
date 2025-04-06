import { StrictMode } from 'react'
import { createRoot } from 'react-dom/client'
import { BrowserRouter } from 'react-router-dom'
import App from './App.tsx'
import { Toaster } from './components/ui/toaster.tsx'
import { UserProvider } from './contexts'
import { QueryClientProvider } from '@tanstack/react-query'
import { queryClient } from './config/query.ts'

const Root = () => {
  return (
    <StrictMode>
      <BrowserRouter>
        <QueryClientProvider client={queryClient}>
          <UserProvider>
            <App />
          </UserProvider>
        </QueryClientProvider>
        <Toaster />
      </BrowserRouter>
    </StrictMode>
  )
}

createRoot(document.getElementById('root')!).render(<Root />)
