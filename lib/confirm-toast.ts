import { toast } from 'sonner'

type ConfirmOptions = {
  message: string
  confirmLabel?: string
  cancelLabel?: string
  onConfirm: () => void
  onCancel?: () => void
}

/**
 * Shows a sonner toast with Bevestig / Annuleer actions. Sticks until the
 * user makes a choice. Replaces the native `confirm()` dialog for a
 * less jarring experience in the kids-facing UI.
 */
export function confirmToast({
  message,
  confirmLabel = 'Bevestig',
  cancelLabel = 'Annuleer',
  onConfirm,
  onCancel,
}: ConfirmOptions) {
  toast.warning(message, {
    duration: 15_000,
    action: {
      label: confirmLabel,
      onClick: () => onConfirm(),
    },
    cancel: {
      label: cancelLabel,
      onClick: () => onCancel?.(),
    },
  })
}
