/**
 * ShippingManager.jsx
 * Central hub for shipping method selection and routing
 * 
 * Methods:
 * - LTL: Opens RLQuoteHelper
 * - Pirateship: Opens PirateshipHelper (address copy + label)
 * - Pickup: Customer picks up, no shipping needed
 * - BoxTruck: Manual tracking entry
 * - LiDelivery: Li handles delivery
 */

import { useState, useEffect } from 'react'
import RLQuoteHelper from './RLQuoteHelper'
import { CustomerAddress } from './CustomerAddress'

const API_URL = 'https://cfc-backend-b83s.onrender.com'

// Shipping methods that need helpers
const METHODS_WITH_HELPER = ['LTL', 'Pirateship']

// Shipping methods that skip helpers
const METHODS_NO_HELPER = ['Pickup', 'BoxTruck', 'LiDelivery']

const ShippingManager = ({ 
  shipment, 
  orderId,
  customerInfo,
  onClose, 
  onUpdate 
}) => {
  const [method, setMethod] = useState(shipment?.ship_method || '')
  const [rlData, setRlData] = useState(null)
  const [loading, setLoading] = useState(false)
  const [view, setView] = useState('select') // 'select', 'rl', 'pirateship', 'tracking'
  
  // Load RL data when LTL is selected
  useEffect(() => {
    if (method === 'LTL' && view === 'rl') {
      loadRLData()
    }
  }, [method, view])
  
  const loadRLData = async () => {
    setLoading(true)
    try {
      const res = await fetch(`${API_URL}/shipments/${shipment.shipment_id}/rl-quote-data`)
      const data = await res.json()
      if (data.status === 'ok') {
        setRlData(data)
      } else {
        console.error('Failed to load RL data:', data.message)
      }
    } catch (err) {
      console.error('Failed to load RL data:', err)
    }
    setLoading(false)
  }
  
  const handleMethodChange = async (newMethod) => {
    setMethod(newMethod)
    
    // Save method to backend
    try {
      await fetch(`${API_URL}/shipments/${shipment.shipment_id}?ship_method=${newMethod}`, {
        method: 'PATCH'
      })
      if (onUpdate) onUpdate()
    } catch (err) {
      console.error('Failed to update shipping method:', err)
    }
    
    // Route to appropriate view
    if (newMethod === 'LTL') {
      setView('rl')
    } else if (newMethod === 'Pirateship') {
      setView('pirateship')
    } else {
      setView('tracking')
    }
  }
  
  const handleSave = () => {
    if (onUpdate) onUpdate()
    onClose()
  }
  
  // Method selection view
  if (view === 'select' || !method) {
    return (
      <div className="shipping-manager">
        <h3>Select Shipping Method</h3>
        <p className="subtitle">Warehouse: {shipment.warehouse}</p>
        
        <div className="method-grid">
          <button 
            className={`method-btn ${method === 'LTL' ? 'active' : ''}`}
            onClick={() => handleMethodChange('LTL')}
          >
            <span className="method-icon">🚛</span>
            <span className="method-name">LTL (RL Carriers)</span>
            <span className="method-desc">Freight shipping with quote</span>
          </button>
          
          <button 
            className={`method-btn ${method === 'Pirateship' ? 'active' : ''}`}
            onClick={() => handleMethodChange('Pirateship')}
          >
            <span className="method-icon">📦</span>
            <span className="method-name">Pirateship</span>
            <span className="method-desc">Parcel shipping</span>
          </button>
          
          <button 
            className={`method-btn ${method === 'Pickup' ? 'active' : ''}`}
            onClick={() => handleMethodChange('Pickup')}
          >
            <span className="method-icon">🏪</span>
            <span className="method-name">Pickup</span>
            <span className="method-desc">Customer picks up</span>
          </button>
          
          <button 
            className={`method-btn ${method === 'BoxTruck' ? 'active' : ''}`}
            onClick={() => handleMethodChange('BoxTruck')}
          >
            <span className="method-icon">🚚</span>
            <span className="method-name">Box Truck</span>
            <span className="method-desc">Local delivery</span>
          </button>
          
          <button 
            className={`method-btn ${method === 'LiDelivery' ? 'active' : ''}`}
            onClick={() => handleMethodChange('LiDelivery')}
          >
            <span className="method-icon">🏭</span>
            <span className="method-name">Li Delivery</span>
            <span className="method-desc">Li handles shipping</span>
          </button>
        </div>
      </div>
    )
  }
  
  // RL Carriers view
  if (view === 'rl') {
    if (loading) {
      return <div className="shipping-manager loading">Loading RL data...</div>
    }
    
    if (!rlData) {
      return (
        <div className="shipping-manager error">
          <p>Failed to load RL data</p>
          <button className="btn" onClick={() => setView('select')}>← Back</button>
        </div>
      )
    }
    
    return (
      <div className="shipping-manager">
        <div className="manager-header">
          <button className="btn btn-back" onClick={() => setView('select')}>← Change Method</button>
          <span className="current-method">LTL (RL Carriers)</span>
        </div>
        
        <RLQuoteHelper 
          shipmentId={shipment.shipment_id}
          data={rlData}
          onClose={onClose}
          onSave={handleSave}
        />
      </div>
    )
  }
  
  // Pirateship view
  if (view === 'pirateship') {
    return (
      <div className="shipping-manager">
        <div className="manager-header">
          <button className="btn btn-back" onClick={() => setView('select')}>← Change Method</button>
          <span className="current-method">Pirateship</span>
        </div>
        
        <div className="pirateship-helper">
          <h3>Pirateship - Copy Address</h3>
          
          <CustomerAddress 
            destination={customerInfo}
            title="Ship To"
          />
          
          <div className="pirateship-actions">
            <a 
              href="https://ship.pirateship.com/ship" 
              target="_blank" 
              rel="noopener noreferrer"
              className="btn btn-primary"
            >
              Open Pirateship →
            </a>
          </div>
          
          <div className="tracking-entry">
            <h4>Enter Tracking</h4>
            <input 
              type="text" 
              placeholder="Tracking number..."
              defaultValue={shipment.tracking_number || ''}
            />
            <button className="btn btn-success" onClick={handleSave}>
              Save & Close
            </button>
          </div>
        </div>
      </div>
    )
  }
  
  // Simple tracking view (Pickup, BoxTruck, LiDelivery)
  if (view === 'tracking') {
    return (
      <div className="shipping-manager">
        <div className="manager-header">
          <button className="btn btn-back" onClick={() => setView('select')}>← Change Method</button>
          <span className="current-method">{method}</span>
        </div>
        
        <div className="tracking-simple">
          {method === 'Pickup' && (
            <p className="method-info">Customer will pick up from warehouse. Mark as complete when picked up.</p>
          )}
          
          {method === 'BoxTruck' && (
            <>
              <p className="method-info">Enter tracking/reference number when shipped.</p>
              <input 
                type="text" 
                placeholder="Tracking/Reference..."
                defaultValue={shipment.tracking_number || ''}
              />
            </>
          )}
          
          {method === 'LiDelivery' && (
            <p className="method-info">Li handles delivery. No action needed.</p>
          )}
          
          <button className="btn btn-success" onClick={handleSave}>
            Done
          </button>
        </div>
      </div>
    )
  }
  
  return null
}

export default ShippingManager
