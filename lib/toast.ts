// lib/toast.ts
// Lightweight toast notification utility using sonner

import { toast } from "sonner";

/**
 * Show an error toast notification
 * Use this instead of console.error for user-facing errors
 */
export function showError(message: string, description?: string): void {
  toast.error(message, {
    description,
    duration: 5000,
  });
}

/**
 * Show a success toast notification
 */
export function showSuccess(message: string, description?: string): void {
  toast.success(message, {
    description,
    duration: 3000,
  });
}

/**
 * Show an info toast notification
 */
export function showInfo(message: string, description?: string): void {
  toast.info(message, {
    description,
    duration: 3000,
  });
}

/**
 * Show a warning toast notification
 */
export function showWarning(message: string, description?: string): void {
  toast.warning(message, {
    description,
    duration: 4000,
  });
}
