import * as React from "react"
import { X } from "lucide-react"
import { cn } from "../../lib/utils"

const ToastContext = React.createContext<{
  toast: (props: ToastProps) => { id: string; dismiss: () => void }
  dismissToast: (id: string) => void
} | null>(null)

export type ToastProps = {
  id?: string
  title?: React.ReactNode
  description?: React.ReactNode
  variant?: "default" | "destructive"
  duration?: number
  onDismiss?: () => void
}

type ToastProviderProps = {
  children: React.ReactNode
}

export function ToastProvider({ children }: ToastProviderProps) {
  const [toasts, setToasts] = React.useState<Array<ToastProps & { id: string }>>([])

  const toast = React.useCallback(
    ({ id = Math.random().toString(36).substring(2, 9), ...props }: ToastProps) => {
      setToasts((toasts) => [...toasts, { ...props, id }])
      return {
        id,
        dismiss: () => {
          setToasts((toasts) => toasts.filter((t) => t.id !== id))
          props.onDismiss?.()
        },
      }
    },
    []
  )

  const dismissToast = React.useCallback((id: string) => {
    setToasts((toasts) => toasts.filter((t) => t.id !== id))
  }, [])

  return (
    <ToastContext.Provider value={{ toast, dismissToast }}>
      {children}
      <div className="fixed bottom-0 right-0 z-50 flex flex-col gap-2 p-4">
        {toasts.map((toast) => (
          <div
            key={toast.id}
            className={cn(
              "flex items-center justify-between gap-4 rounded-lg border bg-background p-4 shadow-lg",
              toast.variant === "destructive" && "border-destructive bg-destructive/10"
            )}
          >
            <div className="grid gap-1">
              {toast.title && (
                <h3
                  className={cn(
                    "font-medium",
                    toast.variant === "destructive" && "text-destructive"
                  )}
                >
                  {toast.title}
                </h3>
              )}
              {toast.description && <p className="text-sm text-muted-foreground">{toast.description}</p>}
            </div>
            <button
              onClick={() => dismissToast(toast.id)}
              className="rounded-full p-1 opacity-70 transition-opacity hover:opacity-100 focus:outline-none focus:ring-2 focus:ring-ring"
            >
              <X className="h-4 w-4" />
            </button>
          </div>
        ))}
      </div>
    </ToastContext.Provider>
  )
}

export function useToast() {
  const context = React.useContext(ToastContext)
  if (!context) {
    throw new Error("useToast must be used within a ToastProvider")
  }
  return context
}
