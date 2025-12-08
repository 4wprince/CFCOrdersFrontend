/**
 * ShipmentRow.jsx
 * Display a single warehouse shipment with status, method, and actions
 * v5.8.3 - Added quote buttons for all methods, Li pricing, mailto tracking
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
  order,
  onOpenShippingManager,
  onUpdate 
}) => {
  const [updating, setUpdating] = useState(false)
  const [showTrackingInput, setShowTrackingInput] = useState(false)
  const [trackingNumber, setTrackingNumber] = useState(shipment.tracking_number || '')
  
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
      
      // Open shipping manager for methods that need helpers
      if (newMethod === 'LTL' || newMethod === 'Pirateship' || newMethod === 'LiDelivery') {
        onOpenShippingManager(shipment)
      }
    } catch (err) {
      console.error('Failed to update method:', err)
    }
    setUpdating(false)
  }
  
  const handleSaveTracking = async () => {
    if (!trackingNumber.trim()) return
    
    setUpdating(true)
    try {
      await fetch(`${API_URL}/shipments/${shipment.shipment_id}?tracking_number=${encodeURIComponent(trackingNumber)}`, {
        method: 'PATCH'
      })
      
      // Update status to shipped
      await fetch(`${API_URL}/shipments/${shipment.shipment_id}?status=shipped`, {
        method: 'PATCH'
      })
      
      if (onUpdate) onUpdate()
      setShowTrackingInput(false)
      
      // Open mailto with tracking info
      sendTrackingEmail()
    } catch (err) {
      console.error('Failed to save tracking:', err)
    }
    setUpdating(false)
  }
  
  const sendTrackingEmail = () => {
    const customerEmail = order?.email || ''
    const customerName = order?.customer_name || 'Valued Customer'
    const companyName = order?.company_name || customerName
    const orderId = order?.order_id || shipment.order_id
    
    // Determine carrier
    let carrier = 'Freight'
    let trackingUrl = ''
    if (shipment.ship_method === 'LTL') {
      carrier = 'RL Carriers'
      trackingUrl = `https://www.rlcarriers.com/freight/shipping/shipment-tracing?pro=${trackingNumber}`
    } else if (shipment.ship_method === 'Pirateship') {
      // Check if UPS or USPS based on tracking format
      if (trackingNumber.startsWith('1Z')) {
        carrier = 'UPS'
        trackingUrl = `https://www.ups.com/track?tracknum=${trackingNumber}`
      } else {
        carrier = 'USPS'
        trackingUrl = `https://tools.usps.com/go/TrackConfirmAction?tLabels=${trackingNumber}`
      }
    }
    
    const subject = encodeURIComponent(`${companyName}, please see tracking information for order ${orderId}`)
    const body = encodeURIComponent(
      `Hey ${customerName.split(' ')[0]},\n\n` +
      `Thank you for your business! Your order ${orderId} has been shipped.\n\n` +
      `${carrier} Tracking Number: ${trackingNumber}\n` +
      (trackingUrl ? `Track your shipment: ${trackingUrl}\n\n` : '\n') +
      `Thank you for your business,\n` +
      `The Cabinets For Contractors Team`
    )
    
    window.open(`mailto:${customerEmail}?subject=${subject}&body=${body}`, '_blank')
  }
  
  const hasRlQuote = shipment.rl_quote_number
  const hasLiQuote = shipment.li_quote_price
  const hasQuote = hasRlQuote || hasLiQuote || shipment.quote_price
  
  // Get display price
  const getQuoteDisplay = () => {
    if (hasRlQuote) return `Q:${shipment.rl_quote_number}`
    if (hasLiQuote) return `$${shipment.li_quote_price}`
    if (shipment.quote_price) return `$${shipment.quote_price}`
    return 'Quote'
  }
  
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
        
        {/* Quote/Manage button - show for LTL, Pirateship, LiDelivery */}
        {(shipment.ship_method === 'LTL' || shipment.ship_method === 'Pirateship' || shipment.ship_method === 'LiDelivery') && (
          <button 
            className={`btn btn-sm ${hasQuote ? 'btn-quoted' : 'btn-quote'}`}
            onClick={() => onOpenShippingManager(shipment)}
          >
            {getQuoteDisplay()}
          </button>
        )}
        
        {/* Tracking input/display */}
        {shipment.ship_method && shipment.ship_method !== 'Pickup' && (
          <>
            {shipment.tracking_number ? (
              <button 
                className="btn btn-sm btn-tracking"
                onClick={() => setShowTrackingInput(true)}
                title={shipment.tracking_number}
              >
                📦 {shipment.tracking_number.slice(-6)}
              </button>
            ) : (
              <button 
                className="btn btn-sm btn-track-entry"
                onClick={() => setShowTrackingInput(true)}
              >
                + Track
              </button>
            )}
          </>
        )}
      </div>
      
      {/* Tracking input modal */}
      {showTrackingInput && (
        <div className="tracking-input-row">
          <input 
            type="text"
            value={trackingNumber}
            onChange={(e) => setTrackingNumber(e.target.value)}
            placeholder="Enter tracking/PRO number..."
            autoFocus
          />
          <button className="btn btn-sm btn-success" onClick={handleSaveTracking}>
            Save & Email
          </button>
          <button className="btn btn-sm" onClick={() => setShowTrackingInput(false)}>
            ✕
          </button>
        </div>
      )}
    </div>
  )
}

export default ShipmentRow
