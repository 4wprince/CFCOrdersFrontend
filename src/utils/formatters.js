/**
 * formatters.js - Formatting Utility Functions
 * Date formatting, currency formatting, etc.
 */

/**
 * Format a date as "Dec 13" style
 */
export function formatShortDate(dateString) {
  if (!dateString) return ''
  const date = new Date(dateString)
  return date.toLocaleDateString('en-US', { month: 'short', day: 'numeric' })
}

/**
 * Format a date as full locale date
 */
export function formatFullDate(dateString) {
  if (!dateString) return ''
  const date = new Date(dateString)
  return date.toLocaleDateString()
}

/**
 * Format currency with $ and commas
 */
export function formatCurrency(amount) {
  const num = parseFloat(amount || 0)
  if (num === 0) return ''
  return `$${num.toLocaleString('en-US', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`
}

/**
 * Format currency for display with sign (for profit/loss)
 */
export function formatCurrencyWithSign(amount) {
  const num = parseFloat(amount || 0)
  const sign = num >= 0 ? '+' : ''
  return `${sign}$${num.toFixed(2)}`
}

/**
 * Calculate days open from order date
 */
export function calculateDaysOpen(orderDate) {
  if (!orderDate) return 0
  const created = new Date(orderDate)
  const now = new Date()
  const diffTime = Math.abs(now - created)
  const diffDays = Math.floor(diffTime / (1000 * 60 * 60 * 24))
  return diffDays
}

/**
 * Get display text for days open
 */
export function formatDaysOpen(days) {
  if (days === 0) return 'Today'
  if (days === 1) return '1 Day'
  return `${days} Days`
}
