/**
 * ShipmentRow.jsx
 * Display a single warehouse shipment with status, method, and actions
 */

import { useState } from 'react'

const STATUS_OPTIONS = [
  { value: 'pending', label: 'Pending' },
  { value: 'quoted', label: 'Quoted' },
  { value: 'booked', label: 'Booked' },
  { value: 'shipped', label: 'Shipped' },
  { value: 'delivered', label: 'Delivered' }
]

const METHOD_OPTIONS = [
  { value: '', label: 'Select...' },
  { value: 'LTL', label: 'LTL' },
  { value: 'Pirateship', label: 'Pirateship' },
  { value: 'Pickup', label: 'Pickup' },
  { value: 'BoxTruck', label: 'BoxTruck' },
  { value: 'LiDelivery', label: 'LiDelivery' }
]

const API_URL = 'https://cfc-backend-b83s.onrender.com'

const ShipmentRow = ({ 
  shipment, 
  onOpenShippingManager,
  onUpdate 
}) => {
  const [updating, setUpdating] = useState(false)
  
  const handleStatusChange = async (newStatus) => {
    setUpdating(true)
    try {
      await fetch(`${API_URL}/shipments/${shipment.shipment_id}?status=${newStatus}`, {
        method: 'PATCH'
      })
      if (onUpdate) onUpdate()
    } catch (err) {
      console.error('Failed to update status:', err)
    }
    setUpdating(false)
  }
  
  const handleMethodChange = async (newMethod) => {
    setUpdating(true)
    try {
      await fetch(`${API_URL}/shipments/${shipment.shipment_id}?ship_method=${newMethod}`, {
        method: 'PATCH'
      })
      if (onUpdate) onUpdate()
      
      // Open shipping manager for methods that need it
      if (newMethod === 'LTL' || newMethod === 'Pirateship') {
        onOpenShippingManager(shipment)
      }
    } catch (err) {
      console.error('Failed to update method:', err)
    }
    setUpdating(false)
  }
  
  const hasRlQuote = shipment.rl_quote_number
  
  return (
    <div className={`shipment-row ${updating ? 'updating' : ''}`}>
      <div className="shipment-warehouse">
        <strong>{shipment.warehouse}</strong>
        {shipment.weight && <span className="weight">{shipment.weight} lbs</span>}
      </div>
      
      <div className="shipment-controls">
        <select 
          value={shipment.status || 'pending'}
          onChange={(e) => handleStatusChange(e.target.value)}
          className="status-select"
        >
          {STATUS_OPTIONS.map(opt => (
            <option key={opt.value} value={opt.value}>{opt.label}</option>
          ))}
        </select>
        
        <select 
          value={shipment.ship_method || ''}
          onChange={(e) => handleMethodChange(e.target.value)}
          className="method-select"
        >
          {METHOD_OPTIONS.map(opt => (
            <option key={opt.value} value={opt.value}>{opt.label}</option>
          ))}
        </select>
        
        {/* Show RL Quote button for LTL shipments */}
        {shipment.ship_method === 'LTL' && (
          <button 
            className={`btn btn-sm ${hasRlQuote ? 'btn-quoted' : 'btn-quote'}`}
            onClick={() => onOpenShippingManager(shipment)}
          >
            {hasRlQuote ? `Q:${shipment.rl_quote_number}` : 'RL Quote'}
          </button>
        )}
        
        {/* Show Pirateship button */}
        {shipment.ship_method === 'Pirateship' && (
          <button 
            className="btn btn-sm btn-pirate"
            onClick={() => onOpenShippingManager(shipment)}
          >
            {shipment.tracking_number ? '📦 Tracking' : 'Ship'}
          </button>
        )}
      </div>
      
      {/* Tracking info */}
      {shipment.tracking_number && (
        <div className="shipment-tracking">
          <span className="tracking-label">Tracking:</span>
          <span className="tracking-number">{shipment.tracking_number}</span>
        </div>
      )}
    </div>
  )
}

export default ShipmentRow
