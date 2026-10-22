import Router from './components/router'
import { Toaster } from 'sonner'
import { MotionConfig } from 'framer-motion'
import { TooltipProvider } from '@/components/ui/tooltip'

function App() {

  return (
  // reducedMotion="user": framer-motion skips transforms when prefers-reduced-motion is set
  <MotionConfig reducedMotion="user">
    <TooltipProvider delayDuration={150}>
      <Router />
    </TooltipProvider>
    <Toaster
      position="top-right"
      theme="dark"
      closeButton={false}
      duration={2000}
      expand={true}
      toastOptions={{
        style: {
          padding: '14px 16px',
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
  </MotionConfig>
  )
}

export default App
