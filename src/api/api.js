/**
 * api.js - Centralized API Module
 * ALL API calls go through here - single source of truth for API_URL
 * 
 * To change environments, only edit API_URL here.
 */

// ============================================================================
// CONFIGURATION - CHANGE THIS TO SWITCH ENVIRONMENTS
// ============================================================================
const API_URL = 'https://cfc-backend-b83s.onrender.com'
// Production: 'https://cfc-backend-b83s.onrender.com'
// Sandbox:    'https://cfc-backend-b83s.onrender.com'

// ============================================================================
// ORDERS API
// ============================================================================

export async function fetchOrders(limit = 200, includeComplete = true) {
  const res = await fetch(`${API_URL}/orders?limit=${limit}&include_complete=${includeComplete}`)
  return res.json()
}

export async function fetchOrderDetail(orderId) {
  const res = await fetch(`${API_URL}/orders/${orderId}`)
  return res.json()
}

export async function updateOrder(orderId, updates) {
  const res = await fetch(`${API_URL}/orders/${orderId}`, {
    method: 'PATCH',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(updates)
  })
  return res.json()
}

export async function deleteOrder(orderId) {
  const res = await fetch(`${API_URL}/orders/${orderId}`, {
    method: 'DELETE'
  })
  return res.json()
}

// ============================================================================
// STATUS API
// ============================================================================

export async function updateOrderStatus(orderId, statusUpdates) {
  const res = await fetch(`${API_URL}/orders/${orderId}`, {
    method: 'PATCH',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(statusUpdates)
  })
  return res.json()
}

// ============================================================================
// SHIPMENTS API
// ============================================================================

export async function updateShipment(shipmentId, params) {
  const queryString = new URLSearchParams(params).toString()
  const res = await fetch(`${API_URL}/shipments/${shipmentId}?${queryString}`, {
    method: 'PATCH'
  })
  return res.json()
}

export async function updateShipmentStatus(shipmentId, status) {
  return updateShipment(shipmentId, { status })
}

export async function updateShipmentMethod(shipmentId, shipMethod) {
  return updateShipment(shipmentId, { ship_method: shipMethod })
}

export async function updateShipmentTracking(shipmentId, trackingNumber) {
  return updateShipment(shipmentId, { tracking_number: trackingNumber })
}

export async function fetchRLQuoteData(shipmentId) {
  const res = await fetch(`${API_URL}/shipments/${shipmentId}/rl-quote-data`)
  return res.json()
}

// ============================================================================
// AI SUMMARY API
// ============================================================================

export async function generateAISummary(orderId, force = false) {
  const res = await fetch(
    `${API_URL}/orders/${orderId}/generate-summary?force=${force}`,
    { method: 'POST' }
  )
  return res.json()
}

// ============================================================================
// EXPORT API_URL for components that need direct access
// ============================================================================

export { API_URL }
