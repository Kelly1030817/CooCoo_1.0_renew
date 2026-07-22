import React from 'react';
import { useToast } from '../../context/ToastContext';

const ToastContainer = () => {
  const { toasts, removeToast } = useToast();

  if (!toasts || toasts.length === 0) return null;

  const getTypeStyle = (type) => {
    switch (type) {
      case 'success':
        return {
          bg: 'bg-[#2c221e]/95 text-white border border-[#be5f48]/40',
          icon: 'check_circle',
          iconColor: 'text-[#e79d5f]'
        };
      case 'warning':
        return {
          bg: 'bg-[#be5f48] text-white border border-red-400',
          icon: 'warning',
          iconColor: 'text-amber-200'
        };
      case 'info':
        return {
          bg: 'bg-[#3b2d27] text-white border border-[#e79d5f]/30',
          icon: 'info',
          iconColor: 'text-[#e79d5f]'
        };
      case 'error':
        return {
          bg: 'bg-red-800 text-white border border-red-500',
          icon: 'error',
          iconColor: 'text-red-300'
        };
      default:
        return {
          bg: 'bg-[#2c221e] text-white border border-stone-700',
          icon: 'notifications',
          iconColor: 'text-[#e79d5f]'
        };
    }
  };

  return (
    <div className="fixed top-6 right-6 z-50 flex flex-col gap-3 max-w-sm w-full pointer-events-none px-4">
      {toasts.map((toast) => {
        const style = getTypeStyle(toast.type);
        return (
          <div
            key={toast.id}
            className={`pointer-events-auto flex items-center gap-3 p-4 rounded-2xl shadow-2xl backdrop-blur-md transition-all transform animate-slide-in ${style.bg}`}
            style={{
              animation: 'toastSlideIn 0.3s cubic-bezier(0.16, 1, 0.3, 1) forwards'
            }}
          >
            <span className={`material-symbols-outlined text-2xl shrink-0 ${style.iconColor}`}>
              {style.icon}
            </span>
            <div className="flex-1 text-sm font-semibold leading-snug tracking-wide">
              {toast.message}
            </div>
            <button
              onClick={() => removeToast(toast.id)}
              className="text-stone-400 hover:text-white transition-colors p-1 rounded-full shrink-0"
              aria-label="Close"
            >
              <span className="material-symbols-outlined text-lg">close</span>
            </button>
          </div>
        );
      })}
    </div>
  );
};

export default ToastContainer;
