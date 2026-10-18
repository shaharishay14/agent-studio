import Router from './components/router'
import { Toaster } from 'sonner'

function App() {

  return (
  <>
    <Router />
    <Toaster 
      position="top-right"
      richColors
      closeButton={false}
      duration={2000}
      expand={true}
      toastOptions={{
        style: {
          borderRadius: '12px',
          border: '1px solid hsl(var(--border))',
          boxShadow: '0 10px 40px rgba(0, 0, 0, 0.15)',
          padding: '16px',
          fontSize: '14px',
          fontWeight: '500',
        },
        classNames: {
          toast: 'sonner-toast',
          success: 'sonner-success',
          error: 'sonner-error',
          info: 'sonner-info',
          warning: 'sonner-warning',
        },
      }}
    />
  </>
  )
}

export default App
