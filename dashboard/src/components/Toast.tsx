import { useEffect, useState } from 'react';
import { AlertCircle, CheckCircle, Info } from 'lucide-react';
import './Toast.css';

export interface ToastMessage {
  id: number;
  text: string;
  type: 'error' | 'success' | 'info';
}

let toastId = 0;

// eslint-disable-next-line react-refresh/only-export-components
export function createToast(text: string, type: ToastMessage['type'] = 'info'): ToastMessage {
  return { id: ++toastId, text, type };
}

interface ToastContainerProps {
  toasts: ToastMessage[];
  onDismiss: (id: number) => void;
}

function ToastItem({ toast, onDismiss }: { toast: ToastMessage; onDismiss: (id: number) => void }) {
  const [exiting, setExiting] = useState(false);

  useEffect(() => {
    const timer = setTimeout(() => {
      setExiting(true);
      setTimeout(() => onDismiss(toast.id), 300);
    }, 4000);
    return () => clearTimeout(timer);
  }, [toast.id, onDismiss]);

  const Icon = toast.type === 'error' ? AlertCircle : toast.type === 'success' ? CheckCircle : Info;

  return (
    <div className={`toast ${toast.type}${exiting ? ' toast-exit' : ''}`}>
      <Icon size={18} className="toast-icon" />
      <span>{toast.text}</span>
    </div>
  );
}

export default function ToastContainer({ toasts, onDismiss }: ToastContainerProps) {
  if (toasts.length === 0) return null;

  return (
    <div className="toast-container">
      {toasts.map((t) => (
        <ToastItem key={t.id} toast={t} onDismiss={onDismiss} />
      ))}
    </div>
  );
}
