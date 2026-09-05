import { StrictMode } from 'react'
import { createRoot } from 'react-dom/client'
import './index.css'
import App from './App'
import { Providers } from './app/providers'
import { registerServiceWorker } from './shared/offline/recipe-packages'
import { syncOfflineOperations } from './shared/offline/sync'

async function enableMocking(){
  if(import.meta.env.PROD && import.meta.env.VITE_USE_MOCK_API!=='true')return
  if(import.meta.env.VITE_USE_REAL_API==='true')return
  const {worker}=await import('./shared/api/mock/browser')
  await worker.start({onUnhandledRequest:'bypass',quiet:true})
}

enableMocking().then(()=>{
  if(import.meta.env.PROD)void registerServiceWorker()
  void syncOfflineOperations()
  window.addEventListener('online',()=>{void syncOfflineOperations()})
  createRoot(document.getElementById('root')!).render(<StrictMode><Providers><App/></Providers></StrictMode>)
})
