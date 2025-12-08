/**
 * ShippingManager.jsx
 * Central hub for shipping method selection and routing
 * v5.8.3 - Bypass method selection if already set, Li delivery pricing, Pirateship popup
 */

import { useState, useEffect } from 'react'
import RLQuoteHelper from './RLQuoteHelper'
import { CustomerAddress } from './CustomerAddress'

const API_URL = 'https://cfc-backend-b83s.onrender.com'

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
  
  // Determine initial view based on existing method
  const getInitialView = () => {
    if (!shipment?.ship_method) return 'select'
    if (shipment.ship_method === 'LTL') return 'rl'
    if (shipment.ship_method === 'Pirateship') return 'pirateship'
    if (shipment.ship_method === 'LiDelivery') return 'lidelivery'
    return 'tracking'
  }
  
  const [view, setView] = useState(getInitialView())
  
  // Li Delivery pricing
  const [liCost, setLiCost] = useState(shipment?.li_quote_price || '200')
  const [liCharge, setLiCharge] = useState(shipment?.li_customer_price || '250')
  
  // Load RL data when LTL is selected
  useEffect(() => {
    if (method === 'LTL' && view === 'rl') {
      loadRLData()
    }
  }, [method, view])
  
  // Auto-load if method already set
  useEffect(() => {
    if (shipment?.ship_method === 'LTL') {
      setMethod('LTL')
      loadRLData()
    }
  }, [shipment])
  
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
    } else if (newMethod === 'LiDelivery') {
      setView('lidelivery')
    } else {
      setView('tracking')
    }
  }
  
  const handleSave = () => {
    if (onUpdate) onUpdate()
    onClose()
  }
  
  const saveLiPricing = async () => {
    try {
      const params = new URLSearchParams()
      params.append('li_quote_price', liCost)
      params.append('li_customer_price', liCharge)
      
      await fetch(`${API_URL}/shipments/${shipment.shipment_id}?${params.toString()}`, {
        method: 'PATCH'
      })
      
      if (onUpdate) onUpdate()
      onClose()
    } catch (err) {
      console.error('Failed to save Li pricing:', err)
    }
  }
  
  const openPirateship = () => {
    const w = 800
    const h = window.screen.height
    const left = window.screen.width - w
    window.open(
      'https://ship.pirateship.com/ship',
      'Pirateship',
      `width=${w},height=${h},left=${left},top=0,resizable=yes,scrollbars=yes`
    )
  }
  
  // Method selection view
  if (view === 'select') {
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
            <button className="btn btn-primary" onClick={openPirateship}>
              Open Pirateship →
            </button>
          </div>
          
          <button className="btn btn-success" onClick={handleSave}>
            Done
          </button>
        </div>
      </div>
    )
  }
  
  // Li Delivery view - needs quote pricing
  if (view === 'lidelivery') {
    return (
      <div className="shipping-manager">
        <div className="manager-header">
          <button className="btn btn-back" onClick={() => setView('select')}>← Change Method</button>
          <span className="current-method">Li Delivery</span>
        </div>
        
        <div className="li-delivery-helper">
          <h3>Li Delivery Pricing</h3>
          <p className="method-info">Li handles delivery. Enter quote for cost tracking.</p>
          
          <div className="input-grid">
            <div className="input-group">
              <label>Li Cost ($):</label>
              <input 
                type="number"
                step="0.01"
                value={liCost}
                onChange={(e) => setLiCost(e.target.value)}
                placeholder="200.00"
              />
            </div>
            
            <div className="input-group">
              <label>Customer Charge ($):</label>
              <input 
                type="number"
                step="0.01"
                value={liCharge}
                onChange={(e) => setLiCharge(e.target.value)}
                placeholder="250.00"
              />
            </div>
          </div>
          
          <p className="profit-note">
            Profit: ${(parseFloat(liCharge || 0) - parseFloat(liCost || 0)).toFixed(2)}
          </p>
          
          <button className="btn btn-success" onClick={saveLiPricing}>
            Save Pricing
          </button>
        </div>
      </div>
    )
  }
  
  // Simple tracking view (Pickup, BoxTruck)
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
            <p className="method-info">Enter tracking/reference number when shipped.</p>
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
