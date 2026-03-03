import { clsx } from "clsx"
import { twMerge } from "tailwind-merge"

export function cn(...inputs) {
  return twMerge(clsx(inputs))
} 


export const isIframe = typeof window !== 'undefined' && window.self !== window.top;

const moneyFormatters = new Map();

/**
 * Formats a numeric value as USD currency with specified precision.
 * @param {number|null|undefined} value - The amount to format.
 * @param {number} [precision=2] - Decimal places.
 * @returns {string} Formatted currency string.
 */
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
    );
  }
  return moneyFormatters.get(precision).format(value || 0);
}
