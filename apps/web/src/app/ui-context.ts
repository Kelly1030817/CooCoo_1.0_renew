import { createContext, type ReactNode } from 'react'

export type UiContextValue={toast:(message:string,type?:'success'|'warning'|'error')=>void;open:(content:ReactNode)=>void;close:()=>void}
export const UiContext=createContext<UiContextValue>({toast:()=>{},open:()=>{},close:()=>{}})
