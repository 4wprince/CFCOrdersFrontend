/**
 * constants.js - Application Constants
 * Status mappings, options, and configuration values
 */

// ============================================================================
// STATUS CONFIGURATION
// ============================================================================

export const STATUS_MAP = {
  'needs_payment_link': { label: '1-Need Invoice', color: '#f44336', class: 'needs-invoice' },
  'awaiting_payment': { label: '2-Awaiting Pay', color: '#ff9800', class: 'awaiting-pay' },
  'needs_warehouse_order': { label: '3-Need to Order', color: '#9c27b0', class: 'needs-order' },
  'awaiting_warehouse': { label: '4-At Warehouse', color: '#2196f3', class: 'at-warehouse' },
  'needs_bol': { label: '5-Need BOL', color: '#00bcd4', class: 'needs-bol' },
  'awaiting_shipment': { label: '6-Ready Ship', color: '#4caf50', class: 'ready-ship' },
  'complete': { label: 'Complete', color: '#9e9e9e', class: 'complete' }
}

export const STATUS_OPTIONS = [
  { value: 'needs_payment_link', label: '1-Need Invoice' },
  { value: 'awaiting_payment', label: '2-Awaiting Pay' },
  { value: 'needs_warehouse_order', label: '3-Need to Order' },
  { value: 'awaiting_warehouse', label: '4-At Warehouse' },
  { value: 'needs_bol', label: '5-Need BOL' },
  { value: 'awaiting_shipment', label: '6-Ready Ship' },
  { value: 'complete', label: 'Complete' }
]

// Maps status value to the boolean fields that should be set
export const STATUS_FIELD_MAP = {
  'needs_payment_link': { payment_link_sent: false, payment_received: false },
  'awaiting_payment': { payment_link_sent: true, payment_received: false },
  'needs_warehouse_order': { payment_received: true, sent_to_warehouse: false },
  'awaiting_warehouse': { sent_to_warehouse: true, warehouse_confirmed: false },
  'needs_bol': { warehouse_confirmed: true, bol_sent: false },
  'awaiting_shipment': { bol_sent: true, is_complete: false },
  'complete': { is_complete: true }
}

// ============================================================================
// SHIPMENT STATUS OPTIONS
// ============================================================================

export const SHIPMENT_STATUS_OPTIONS = [
  { value: 'pending', label: 'Pending' },
  { value: 'quoted', label: 'Quoted' },
  { value: 'booked', label: 'Booked' },
  { value: 'shipped', label: 'Shipped' },
  { value: 'delivered', label: 'Delivered' }
]

export const SHIPPING_METHOD_OPTIONS = [
  { value: '', label: 'Select...' },
  { value: 'LTL', label: 'LTL' },
  { value: 'Pirateship', label: 'Pirateship' },
  { value: 'Pickup', label: 'Pickup' },
  { value: 'BoxTruck', label: 'BoxTruck' },
  { value: 'LiDelivery', label: 'LiDelivery' }
]

// ============================================================================
// APPLICATION CONFIG
// ============================================================================

export const APP_PASSWORD = 'cfc2025'
