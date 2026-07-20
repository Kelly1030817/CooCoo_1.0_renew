import { QueryClient, QueryClientProvider } from '@tanstack/react-query'
import { useCallback, useMemo, useState, type ReactNode } from 'react'
import { UiContext } from './ui-context'

const queryClient = new QueryClient({defaultOptions:{queries:{staleTime:0,retry:false}}})
export function Providers({children}:{children:ReactNode}){
  const [modal,setModal]=useState<ReactNode>(null)
  const [notice,setNotice]=useState<{message:string;type:string}|null>(null)
  const close=useCallback(()=>setModal(null),[])
  const toast=useCallback((message:string,type='success')=>{setNotice({message,type});window.setTimeout(()=>setNotice(null),3000)},[])
  const value=useMemo(()=>({toast,open:setModal,close}),[toast,close])
  return <QueryClientProvider client={queryClient}><UiContext.Provider value={value}>{children}{modal}{notice&&<div role="status" className={`toast-in fixed top-20 left-1/2 z-[120] -translate-x-1/2 rounded-full px-6 py-3 text-sm font-bold text-white shadow-lg ${notice.type==='warning'?'bg-rust-orange':notice.type==='error'?'bg-error':'bg-secondary'}`}><span className="material-symbols-outlined mr-2 align-middle text-xl">{notice.type==='success'?'check_circle':'report'}</span>{notice.message}</div>}</UiContext.Provider></QueryClientProvider>
}
