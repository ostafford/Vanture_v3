/**
 * Global toast notifications. Use toast.success(), toast.error(), toast.info()
 * from anywhere. ToastProvider renders the toast and auto-dismisses unless
 * info(..., { persistent: true }) is used (e.g. long-running sync progress).
 */

import { createStore } from 'zustand/vanilla'

export type ToastVariant = 'success' | 'error' | 'info'

export type ToastShowOptions = {
  persistent?: boolean
}

type ToastState = {
  show: boolean
  message: string
  variant: ToastVariant
  persistent: boolean
}

type ToastActions = {
  success: (message: string, options?: ToastShowOptions) => void
  error: (message: string, options?: ToastShowOptions) => void
  info: (message: string, options?: ToastShowOptions) => void
  hide: () => void
}

export type ToastStore = ToastState & ToastActions

export const toastStore = createStore<ToastStore>((set) => ({
  show: false,
  message: '',
  variant: 'success',
  persistent: false,

  success(message: string, _options?: ToastShowOptions) {
    set({ show: true, message, variant: 'success', persistent: false })
  },

  error(message: string, _options?: ToastShowOptions) {
    set({ show: true, message, variant: 'error', persistent: false })
  },

  info(message: string, options?: ToastShowOptions) {
    set({
      show: true,
      message,
      variant: 'info',
      persistent: options?.persistent === true,
    })
  },

  hide() {
    set({ show: false, persistent: false })
  },
}))

/** Convenience API: toast.success('Done.') */
export const toast = {
  success: (message: string, options?: ToastShowOptions) =>
    toastStore.getState().success(message, options),
  error: (message: string, options?: ToastShowOptions) =>
    toastStore.getState().error(message, options),
  info: (message: string, options?: ToastShowOptions) =>
    toastStore.getState().info(message, options),
  hide: () => toastStore.getState().hide(),
}
