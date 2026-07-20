import { StrictMode } from 'react'
import { createRoot } from 'react-dom/client'
import './index.css'
import App from './App'
import { Providers } from './app/providers'

async function enableMocking(){
  if(import.meta.env.VITE_USE_REAL_API==='true')return
  const {worker}=await import('./shared/api/mock/browser')
  await worker.start({onUnhandledRequest:'bypass',quiet:true})
}

enableMocking().then(()=>createRoot(document.getElementById('root')!).render(<StrictMode><Providers><App/></Providers></StrictMode>))
