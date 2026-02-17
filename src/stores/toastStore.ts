/**
 * Global toast notifications. Use toast.success(), toast.error(), toast.info()
 * from anywhere. ToastProvider renders the toast and auto-dismisses.
 */

import { createStore } from 'zustand/vanilla'

export type ToastVariant = 'success' | 'error' | 'info'

type ToastState = {
  show: boolean
  message: string
  variant: ToastVariant
}

type ToastActions = {
  success: (message: string) => void
  error: (message: string) => void
  info: (message: string) => void
  hide: () => void
}

export type ToastStore = ToastState & ToastActions

export const toastStore = createStore<ToastStore>((set) => ({
  show: false,
  message: '',
  variant: 'success',

  success(message: string) {
    set({ show: true, message, variant: 'success' })
  },

  error(message: string) {
    set({ show: true, message, variant: 'error' })
  },

  info(message: string) {
    set({ show: true, message, variant: 'info' })
  },

  hide() {
    set({ show: false })
  },
}))

/** Convenience API: toast.success('Done.') */
export const toast = {
  success: (message: string) => toastStore.getState().success(message),
  error: (message: string) => toastStore.getState().error(message),
  info: (message: string) => toastStore.getState().info(message),
  hide: () => toastStore.getState().hide(),
}
