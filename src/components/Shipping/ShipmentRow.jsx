/**
 * ShipmentRow.jsx
 * Display a single warehouse shipment with status, method, and actions
 */

import { useState } from 'react'
import { updateShipmentStatus, updateShipmentMethod, updateShipmentTracking } from '../../api/api'
import { SHIPMENT_STATUS_OPTIONS, SHIPPING_METHOD_OPTIONS } from '../../utils/constants'
import { getCarrierFromTracking } from '../../utils/shippingCalculations'

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
      await updateShipmentStatus(shipment.shipment_id, newStatus)
      if (onUpdate) onUpdate()
    } catch (err) {
      console.error('Failed to update status:', err)
    }
    setUpdating(false)
  }
  
  const handleMethodChange = async (newMethod) => {
    setUpdating(true)
    try {
      await updateShipmentMethod(shipment.shipment_id, newMethod)
      if (onUpdate) onUpdate()
      
      // Open shipping manager for methods that need helpers
      if (newMethod && newMethod !== 'Pickup') {
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
      await updateShipmentTracking(shipment.shipment_id, trackingNumber)
      await updateShipmentStatus(shipment.shipment_id, 'shipped')
      
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
    const firstName = customerName.split(' ')[0]
    
    const { carrier, trackingUrl } = getCarrierFromTracking(trackingNumber, shipment.ship_method)
    
    const subject = `${companyName}, please see tracking information for order ${orderId}`
    
    const body = `Hey ${firstName},

Thank you for your business! Your order ${orderId} has been shipped.

${carrier} Tracking Number: ${trackingNumber}
${trackingUrl ? `Track your shipment: ${trackingUrl}` : ''}

Thank you for your business,
The Cabinets For Contractors Team`
    
    const mailtoUrl = `mailto:${customerEmail}?subject=${encodeURIComponent(subject)}&body=${encodeURIComponent(body)}`
    window.open(mailtoUrl, '_blank')
  }
  
  // Check if shipment has any quote/price info
  const hasQuoteInfo = shipment.rl_quote_number || shipment.rl_quote_price || 
                       shipment.li_quote_price || shipment.quote_price
  
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
          {SHIPMENT_STATUS_OPTIONS.map(opt => (
            <option key={opt.value} value={opt.value}>{opt.label}</option>
          ))}
        </select>
        
        <select 
          value={shipment.ship_method || ''}
          onChange={(e) => handleMethodChange(e.target.value)}
          className="method-select"
        >
          {SHIPPING_METHOD_OPTIONS.map(opt => (
            <option key={opt.value} value={opt.value}>{opt.label}</option>
          ))}
        </select>
        
        {/* Shipping button - show for all shipments */}
        <button 
          className={`btn btn-sm ${hasQuoteInfo ? 'btn-quoted' : 'btn-quote'}`}
          onClick={() => onOpenShippingManager(shipment)}
        >
          Shipping
        </button>
        
        {/* Tracking input/display */}
        {shipment.ship_method !== 'Pickup' && shipment.ship_method !== 'LiDelivery' && (
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
      
      {/* Tracking input row */}
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
