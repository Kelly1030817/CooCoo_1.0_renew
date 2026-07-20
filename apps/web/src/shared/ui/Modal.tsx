import type { ReactNode } from 'react'

export function Modal({children,label,onClose,wide=false}:{children:ReactNode;label:string;onClose:()=>void;wide?:boolean}){
  return <div className="fixed inset-0 z-[100] flex items-center justify-center overflow-y-auto bg-black/60 p-md backdrop-blur-sm" role="dialog" aria-modal="true" aria-label={label} onMouseDown={e=>{if(e.target===e.currentTarget)onClose()}}><section className={`my-auto max-h-[90vh] w-full overflow-y-auto rounded-3xl bg-white p-lg shadow-2xl ${wide?'max-w-[720px]':'max-w-[520px]'}`}>{children}</section></div>
}
export function ModalHeader({title,kicker,onClose}:{title:string;kicker?:string;onClose:()=>void}){return <div className="mb-md flex items-start justify-between gap-md"><div>{kicker&&<p className="text-[10px] font-extrabold text-secondary">{kicker}</p>}<h2 className="text-xl font-extrabold text-slate-blue">{title}</h2></div><button onClick={onClose} aria-label="關閉" className="rounded-full p-2 text-on-surface-variant hover:bg-surface-container"><span className="material-symbols-outlined">close</span></button></div>}
