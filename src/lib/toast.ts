import { toast, type ToastOptions } from 'react-toastify'

const defaultOptions: ToastOptions = {
  position: 'top-right',
  autoClose: 5000,
  hideProgressBar: false,
  closeOnClick: true,
  pauseOnHover: true,
  draggable: true,
}

export function showError(message: string, options?: ToastOptions) {
  toast.error(message, { ...defaultOptions, ...options })
}

export function showSuccess(message: string, options?: ToastOptions) {
  toast.success(message, { ...defaultOptions, ...options })
}

export function showInfo(message: string, options?: ToastOptions) {
  toast.info(message, { ...defaultOptions, ...options })
}

export function showWarning(message: string, options?: ToastOptions) {
  toast.warning(message, { ...defaultOptions, ...options })
}
