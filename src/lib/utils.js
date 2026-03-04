import { clsx } from "clsx"
import { twMerge } from "tailwind-merge"

export function cn(...inputs) {
  return twMerge(clsx(inputs))
} 


export const isIframe = typeof window !== 'undefined' && window.self !== window.top;

const moneyFormatters = new Map()

export function formatMoney(value, precision = 2) {
  if (!moneyFormatters.has(precision)) {
    moneyFormatters.set(
      precision,
      new Intl.NumberFormat("en-US", {
        style: "currency",
        currency: "USD",
        minimumFractionDigits: precision,
        maximumFractionDigits: precision,
      })
    )
  }
  return moneyFormatters.get(precision).format(value || 0)
}
