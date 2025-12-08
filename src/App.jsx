import { useState, useEffect } from 'react'

const API_URL = 'https://cfc-backend-b83s.onrender.com'
const APP_PASSWORD = 'cfc2025' // Change this!

// Status mapping
const STATUS_MAP = {
  'needs_payment_link': { label: '1-Need Invoice', class: 'needs-invoice' },
  'awaiting_payment': { label: '2-Awaiting Pay', class: 'awaiting-pay' },
  'needs_warehouse_order': { label: '3-Need to Order', class: 'needs-order' },
  'awaiting_warehouse': { label: '4-At Warehouse', class: 'at-warehouse' },
  'needs_bol': { label: '5-Need BOL', class: 'needs-bol' },
  'awaiting_shipment': { label: '6-Ready Ship', class: 'ready-ship' },
  'complete': { label: 'Complete', class: 'complete' }
}

const STATUS_OPTIONS = [
  { value: 'needs_payment_link', label: '1-Need Invoice' },
  { value: 'awaiting_payment', label: '2-Awaiting Pay' },
  { value: 'needs_warehouse_order', label: '3-Need to Order' },
  { value: 'awaiting_warehouse', label: '4-At Warehouse' },
  { value: 'needs_bol', label: '5-Need BOL' },
  { value: 'awaiting_shipment', label: '6-Ready Ship' },
  { value: 'complete', label: 'Complete' }
]

function App() {
  const [isLoggedIn, setIsLoggedIn] = useState(false)
  const [password, setPassword] = useState('')
  const [loginError, setLoginError] = useState('')
  
  const [orders, setOrders] = useState([])
  const [alerts, setAlerts] = useState([])
  const [loading, setLoading] = useState(true)
  const [statusFilter, setStatusFilter] = useState(null)
  const [showAlerts, setShowAlerts] = useState(false)
  const [selectedOrder, setSelectedOrder] = useState(null)
  const [activeTab, setActiveTab] = useState('orders')
  const [aiSummary, setAiSummary] = useState(null)
  const [summaryLoading, setSummaryLoading] = useState(false)
  const [showArchived, setShowArchived] = useState(false)
  const [rlQuoteModal, setRlQuoteModal] = useState(null)  // { shipmentId, data }
  const [rlQuoteLoading, setRlQuoteLoading] = useState(false)
  
  // Check if already logged in
  useEffect(() => {
    const saved = localStorage.getItem('cfc_logged_in')
    if (saved === 'true') {
      setIsLoggedIn(true)
    }
  }, [])
  
  // Load data when logged in
  useEffect(() => {
    if (isLoggedIn) {
      loadOrders()
      loadAlerts()
    }
  }, [isLoggedIn])
  
  const handleLogin = (e) => {
    e.preventDefault()
    if (password === APP_PASSWORD) {
      setIsLoggedIn(true)
      localStorage.setItem('cfc_logged_in', 'true')
      setLoginError('')
    } else {
      setLoginError('Incorrect password')
    }
  }
  
  const handleLogout = () => {
    setIsLoggedIn(false)
    localStorage.removeItem('cfc_logged_in')
  }
  
  const loadOrders = async () => {
    setLoading(true)
    try {
      // Always load all orders, filter client-side
      const res = await fetch(`${API_URL}/orders?limit=200&include_complete=true`)
      const data = await res.json()
      if (data.orders) {
        setOrders(data.orders)
      }
    } catch (err) {
      console.error('Failed to load orders:', err)
    }
    setLoading(false)
  }
  
  const loadAlerts = async () => {
    try {
      const res = await fetch(`${API_URL}/alerts`)
      const data = await res.json()
      if (data.alerts) {
        setAlerts(data.alerts)
      }
    } catch (err) {
      console.error('Failed to load alerts:', err)
    }
  }
  
  const updateCheckpoint = async (orderId, checkpoint) => {
    try {
      await fetch(`${API_URL}/orders/${orderId}/checkpoint`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ checkpoint, source: 'web_ui' })
      })
      loadOrders()
    } catch (err) {
      console.error('Failed to update checkpoint:', err)
    }
  }
  
  const updateOrder = async (orderId, updates) => {
    try {
      await fetch(`${API_URL}/orders/${orderId}`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(updates)
      })
      loadOrders()
    } catch (err) {
      console.error('Failed to update order:', err)
    }
  }
  
  const loadAiSummary = async (orderId, force = false) => {
    setSummaryLoading(true)
    setAiSummary(null)
    try {
      const res = await fetch(`${API_URL}/orders/${orderId}/generate-summary?force=${force}`, {
        method: 'POST'
      })
      const data = await res.json()
      if (data.summary) {
        setAiSummary(data.summary)
      }
    } catch (err) {
      console.error('Failed to load AI summary:', err)
      setAiSummary('Failed to generate summary')
    }
    setSummaryLoading(false)
  }
  
  const loadRlQuoteData = async (shipmentId) => {
    setRlQuoteLoading(true)
    try {
      const res = await fetch(`${API_URL}/shipments/${shipmentId}/rl-quote-data`)
      const data = await res.json()
      if (data.status === 'ok') {
        setRlQuoteModal({ shipmentId, data })
      }
    } catch (err) {
      console.error('Failed to load RL quote data:', err)
    }
    setRlQuoteLoading(false)
  }
  
  const saveRlQuote = async (shipmentId, quoteNumber, quotePrice) => {
    const customerPrice = quotePrice ? parseFloat(quotePrice) + 50 : null
    try {
      const params = new URLSearchParams()
      if (quoteNumber) params.append('rl_quote_number', quoteNumber)
      if (quotePrice) params.append('rl_quote_price', quotePrice)
      if (customerPrice) params.append('rl_customer_price', customerPrice)
      
      await fetch(`${API_URL}/shipments/${shipmentId}?${params.toString()}`, { method: 'PATCH' })
      loadOrders()
      setRlQuoteModal(null)
    } catch (err) {
      console.error('Failed to save RL quote:', err)
    }
  }
  
  const resolveAlert = async (alertId) => {
    try {
      await fetch(`${API_URL}/alerts/${alertId}/resolve`, { method: 'PATCH' })
      loadAlerts()
    } catch (err) {
      console.error('Failed to resolve alert:', err)
    }
  }
  
  const formatDate = (dateStr) => {
    if (!dateStr) return ''
    const d = new Date(dateStr)
    return d.toLocaleDateString('en-US', { month: 'numeric', day: 'numeric', year: 'numeric' })
  }
  
  const formatMoney = (amount) => {
    if (!amount) return ''
    return '$' + Number(amount).toFixed(2)
  }
  
  const getStatusClass = (status) => {
    return STATUS_MAP[status]?.class || ''
  }
  
  const getStatusLabel = (status) => {
    return STATUS_MAP[status]?.label || status
  }
  
  const getShipmentStatusClass = (status) => {
    const map = {
      'needs_order': 'needs-order',
      'at_warehouse': 'at-warehouse',
      'needs_bol': 'needs-bol',
      'ready_ship': 'ready-ship',
      'shipped': 'ready-ship',
      'delivered': 'complete'
    }
    return map[status] || ''
  }
  
  // Count by status
  const statusCounts = orders.reduce((acc, order) => {
    const status = order.current_status
    acc[status] = (acc[status] || 0) + 1
    return acc
  }, {})
  
  // Filter orders
  let filteredOrders = orders
  if (showArchived) {
    // Only show completed orders
    filteredOrders = orders.filter(o => o.current_status === 'complete' || o.is_complete)
  } else if (statusFilter) {
    filteredOrders = orders.filter(o => o.current_status === statusFilter)
  } else {
    // Hide completed from main view
    filteredOrders = orders.filter(o => o.current_status !== 'complete' && !o.is_complete)
  }
  
  // Login screen
  if (!isLoggedIn) {
    return (
      <div className="login-container">
        <form className="login-box" onSubmit={handleLogin}>
          <h1>🗄️ CFC Orders</h1>
          <p>Cabinets For Contractors</p>
          <input
            type="password"
            placeholder="Enter password"
            value={password}
            onChange={(e) => setPassword(e.target.value)}
            autoFocus
          />
          <button type="submit">Login</button>
          {loginError && <div className="login-error">{loginError}</div>}
        </form>
      </div>
    )
  }
  
  return (
    <div className="app">
      {/* Header */}
      <header className="header">
        <h1>🗄️ CFC Orders</h1>
        <div className="header-actions">
          <button className="btn-refresh" onClick={loadOrders}>
            ↻ Refresh
          </button>
          <button className="btn-logout" onClick={handleLogout}>
            Logout
          </button>
        </div>
      </header>
      
      {/* Alerts Banner */}
      {alerts.length > 0 && (
        <div className="alerts-banner" onClick={() => setShowAlerts(!showAlerts)}>
          <span className="alert-icon">⚠️</span>
          <span className="alert-count">{alerts.length} alert{alerts.length !== 1 ? 's' : ''} need attention</span>
        </div>
      )}
      
      {/* Alerts Panel */}
      {showAlerts && alerts.length > 0 && (
        <div className="alerts-panel">
          <div className="alerts-header">
            <h2>Active Alerts</h2>
            <button className="btn-logout" onClick={() => setShowAlerts(false)}>Close</button>
          </div>
          {alerts.map(alert => (
            <div key={alert.id} className="alert-item">
              <div className="alert-content">
                <span className="alert-type">{alert.alert_type.replace('_', ' ')}</span>
                <div className="alert-message">{alert.alert_message}</div>
                <div className="alert-time">Order #{alert.order_id}</div>
              </div>
              <button className="alert-resolve" onClick={() => resolveAlert(alert.id)}>
                Resolve
              </button>
            </div>
          ))}
        </div>
      )}
      
      {/* Stats Bar */}
      <div className="stats-bar">
        <div
          className={`stat-card ${statusFilter === null && !showArchived ? 'active' : ''}`}
          style={{background: '#e0e0e0'}}
          onClick={() => { setShowArchived(false); setStatusFilter(null); }}
        >
          <div className="count">{orders.filter(o => o.current_status !== 'complete' && !o.is_complete).length}</div>
          <div className="label">All</div>
        </div>
        <div
          className={`stat-card status-needs-invoice ${statusFilter === 'needs_payment_link' && !showArchived ? 'active' : ''}`}
          onClick={() => { setShowArchived(false); setStatusFilter(statusFilter === 'needs_payment_link' ? null : 'needs_payment_link'); }}
        >
          <div className="count">{statusCounts['needs_payment_link'] || 0}</div>
          <div className="label">Need Invoice</div>
        </div>
        <div
          className={`stat-card status-awaiting-pay ${statusFilter === 'awaiting_payment' && !showArchived ? 'active' : ''}`}
          onClick={() => { setShowArchived(false); setStatusFilter(statusFilter === 'awaiting_payment' ? null : 'awaiting_payment'); }}
        >
          <div className="count">{statusCounts['awaiting_payment'] || 0}</div>
          <div className="label">Awaiting Pay</div>
        </div>
        <div
          className={`stat-card status-needs-order ${statusFilter === 'needs_warehouse_order' && !showArchived ? 'active' : ''}`}
          onClick={() => { setShowArchived(false); setStatusFilter(statusFilter === 'needs_warehouse_order' ? null : 'needs_warehouse_order'); }}
        >
          <div className="count">{statusCounts['needs_warehouse_order'] || 0}</div>
          <div className="label">Need to Order</div>
        </div>
        <div
          className={`stat-card status-at-warehouse ${statusFilter === 'awaiting_warehouse' && !showArchived ? 'active' : ''}`}
          onClick={() => { setShowArchived(false); setStatusFilter(statusFilter === 'awaiting_warehouse' ? null : 'awaiting_warehouse'); }}
        >
          <div className="count">{statusCounts['awaiting_warehouse'] || 0}</div>
          <div className="label">At Warehouse</div>
        </div>
        <div
          className={`stat-card status-needs-bol ${statusFilter === 'needs_bol' && !showArchived ? 'active' : ''}`}
          onClick={() => { setShowArchived(false); setStatusFilter(statusFilter === 'needs_bol' ? null : 'needs_bol'); }}
        >
          <div className="count">{statusCounts['needs_bol'] || 0}</div>
          <div className="label">Need BOL</div>
        </div>
        <div
          className={`stat-card status-ready-ship ${statusFilter === 'awaiting_shipment' && !showArchived ? 'active' : ''}`}
          onClick={() => { setShowArchived(false); setStatusFilter(statusFilter === 'awaiting_shipment' ? null : 'awaiting_shipment'); }}
        >
          <div className="count">{statusCounts['awaiting_shipment'] || 0}</div>
          <div className="label">Ready Ship</div>
        </div>
        <div
          className={`stat-card ${showArchived ? 'active' : ''}`}
          style={{background: showArchived ? '#a5d6a7' : '#c8e6c9'}}
          onClick={() => { setShowArchived(!showArchived); setStatusFilter(null); }}
        >
          <div className="count">{statusCounts['complete'] || 0}</div>
          <div className="label">Archived</div>
        </div>
      </div>
      
      {/* Orders Cards */}
      <div className="orders-container">
        {showArchived && (
          <div className="archived-banner">
            Showing Completed/Archived Orders
          </div>
        )}
        {loading ? (
          <div className="loading">
            <div className="spinner"></div>
            Loading orders...
          </div>
        ) : filteredOrders.length === 0 ? (
          <div className="empty-state">
            {statusFilter ? 'No orders in this status' : 'No orders found'}
          </div>
        ) : (
          <div className="order-cards">
            {filteredOrders.map(order => {
              const shipments = order.shipments || []
              const truncateName = (name, max = 25) => {
                if (!name) return ''
                return name.length > max ? name.substring(0, max) + '...' : name
              }
              
              return (
                <div key={order.order_id} className="order-card">
                  {/* Row 1: Order ID | Customer | Email | Phone */}
                  <div className="order-row1">
                    <span 
                      className="order-id-link" 
                      onClick={() => { setSelectedOrder(order); setAiSummary(null); loadAiSummary(order.order_id); }}
                    >
                      {order.order_id}
                    </span>
                    <span className="order-customer" title={order.company_name || order.customer_name}>
                      {truncateName(order.company_name || order.customer_name)}
                    </span>
                    <span className="order-email" title={order.email}>
                      {order.email || ''}
                    </span>
                    <span className="order-phone">{order.phone || ''}</span>
                  </div>
                  
                  {/* Row 2: Icons | Date | Amount | Shipping | Paid */}
                  <div className="order-row2">
                    <div className="action-btns">
                      <a 
                        href={`https://www.cabinetsforcontractors.net/orders/${order.order_id}/export_single.xlsx`}
                        className="icon-btn download-icon"
                        title="Download Excel"
                        onClick={(e) => e.stopPropagation()}
                      >
                        <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5">
                          <path d="M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4"/>
                          <polyline points="7 10 12 15 17 10"/><line x1="12" y1="15" x2="12" y2="3"/>
                        </svg>
                      </a>
                      <a 
                        href={`https://script.google.com/macros/s/AKfycbzd5BMSeaizOeINTzw70qVzq768S7FMZeZ87NgSOYzc8h6wA4k089srS416Lz66cY7TWQ/exec?orderId=${order.order_id}`}
                        target="_blank" 
                        rel="noopener noreferrer"
                        className="icon-btn sheets-icon"
                        title="Create Supplier Sheet"
                        onClick={(e) => e.stopPropagation()}
                      >
                        <svg width="14" height="14" viewBox="0 0 24 24">
                          <rect x="3" y="3" width="18" height="18" rx="2" fill="#0F9D58"/>
                          <rect x="6" y="7" width="5" height="3" fill="white"/><rect x="13" y="7" width="5" height="3" fill="white"/>
                          <rect x="6" y="11" width="5" height="3" fill="white"/><rect x="13" y="11" width="5" height="3" fill="white"/>
                          <rect x="6" y="15" width="5" height="3" fill="white"/><rect x="13" y="15" width="5" height="3" fill="white"/>
                        </svg>
                      </a>
                    </div>
                    <span className="order-date">{formatDate(order.order_date)}</span>
                    <span className="order-amount">{formatMoney(order.order_total)}</span>
                    <span className="order-shipping">Ship: {order.shipping_cost ? formatMoney(order.shipping_cost) : '-'}</span>
                    <span className={`order-paid ${order.payment_amount ? 'paid' : 'unpaid'}`}>
                      {order.payment_amount ? `Paid: ${formatMoney(order.payment_amount)}` : 'Unpaid'}
                    </span>
                  </div>
                  
                  {/* Shipments */}
                  <div className="shipments">
                    {shipments.length === 0 ? (
                      <div className="shipment-row no-shipments">
                        <span>No shipments - warehouse not assigned</span>
                      </div>
                    ) : (
                      shipments.map(ship => (
                        <div key={ship.shipment_id} className={`shipment-row status-${ship.status?.replace('_', '-') || 'needs-order'}`}>
                          <span className="shipment-warehouse">{ship.warehouse}</span>
                          <select 
                            className="shipment-status-select"
                            value={ship.status || 'needs_order'}
                            onChange={async (e) => {
                              try {
                                await fetch(`${API_URL}/shipments/${ship.shipment_id}?status=${e.target.value}`, { method: 'PATCH' })
                                loadOrders()
                              } catch (err) { console.error('Failed:', err) }
                            }}
                          >
                            <option value="needs_order">Needs Order</option>
                            <option value="at_warehouse">At Warehouse</option>
                            <option value="needs_bol">Needs BOL</option>
                            <option value="ready_ship">Ready Ship</option>
                            <option value="shipped">Shipped</option>
                            <option value="delivered">Delivered</option>
                          </select>
                          <select 
                            className="shipment-method-select"
                            value={ship.ship_method || ''}
                            onChange={async (e) => {
                              try {
                                await fetch(`${API_URL}/shipments/${ship.shipment_id}?ship_method=${e.target.value || ''}`, { method: 'PATCH' })
                                loadOrders()
                              } catch (err) { console.error('Failed:', err) }
                            }}
                          >
                            <option value="">-</option>
                            <option value="LTL">LTL</option>
                            <option value="Pirateship">Pirateship</option>
                            <option value="Pickup">Pickup</option>
                            <option value="BoxTruck">Box Truck</option>
                            <option value="LiDelivery">Li Delivery</option>
                          </select>
                          {ship.ship_method === 'LTL' && (
                            <button 
                              className="rl-quote-btn"
                              onClick={() => loadRlQuoteData(ship.shipment_id)}
                              title={ship.rl_quote_number ? `Quote: ${ship.rl_quote_number}` : 'Get RL Quote'}
                            >
                              {ship.rl_quote_number ? `Q:${ship.rl_quote_number}` : 'RL Quote'}
                            </button>
                          )}
                          <input 
                            type="text" 
                            className="shipment-tracking-input"
                            defaultValue={ship.tracking || ship.pro_number || ''}
                            placeholder="Tracking/PRO"
                            onBlur={async (e) => {
                              const val = e.target.value
                              if (val !== (ship.tracking || ship.pro_number || '')) {
                                try {
                                  await fetch(`${API_URL}/shipments/${ship.shipment_id}?tracking=${encodeURIComponent(val)}`, { method: 'PATCH' })
                                  loadOrders()
                                } catch (err) { console.error('Failed:', err) }
                              }
                            }}
                          />
                        </div>
                      ))
                    )}
                  </div>
                </div>
              )
            })}
          </div>
        )}
      </div>
      
      {/* Order Detail Modal */}
      {selectedOrder && (
        <div className="modal-overlay" onClick={() => setSelectedOrder(null)}>
          <div className="modal" onClick={(e) => e.stopPropagation()}>
            <div className="modal-header">
              <h2>Order #{selectedOrder.order_id}</h2>
              <button className="modal-close" onClick={() => setSelectedOrder(null)}>×</button>
            </div>
            <div className="modal-body">
              <div className="detail-grid">
                <div className="detail-item">
                  <label>Customer</label>
                  <div className="value">{selectedOrder.customer_name}</div>
                </div>
                <div className="detail-item">
                  <label>Company</label>
                  <div className="value">{selectedOrder.company_name || '-'}</div>
                </div>
                <div className="detail-item">
                  <label>Order Date</label>
                  <div className="value">{formatDate(selectedOrder.order_date)}</div>
                </div>
                <div className="detail-item">
                  <label>Days Open</label>
                  <div className="value">{selectedOrder.days_open || 0}</div>
                </div>
                <div className="detail-item">
                  <label>Order Total</label>
                  <div className="value">{formatMoney(selectedOrder.order_total)}</div>
                </div>
                <div className="detail-item">
                  <label>Shipping Cost</label>
                  <div className="value">{formatMoney(selectedOrder.shipping_cost)}</div>
                </div>
                <div className="detail-item">
                  <label>Payment Amount</label>
                  <div className="value">{formatMoney(selectedOrder.payment_amount)}</div>
                </div>
                <div className="detail-item">
                  <label>Status</label>
                  <div className="value">{getStatusLabel(selectedOrder.current_status)}</div>
                </div>
              </div>
              
              <div className="detail-section">
                <h3>Contact</h3>
                <div className="detail-grid">
                  <div className="detail-item">
                    <label>Phone</label>
                    <div className="value">{selectedOrder.phone || '-'}</div>
                  </div>
                  <div className="detail-item">
                    <label>Email</label>
                    <div className="value">{selectedOrder.email || '-'}</div>
                  </div>
                </div>
              </div>
              
              <div className="detail-section">
                <h3>Address</h3>
                <div className="detail-grid">
                  <div className="detail-item">
                    <label>Street</label>
                    <div className="value">{selectedOrder.street || '-'}</div>
                  </div>
                  <div className="detail-item">
                    <label>Suite/Unit</label>
                    <div className="value">{selectedOrder.street2 || '-'}</div>
                  </div>
                  <div className="detail-item">
                    <label>City</label>
                    <div className="value">{selectedOrder.city || '-'}</div>
                  </div>
                  <div className="detail-item">
                    <label>State</label>
                    <div className="value">{selectedOrder.state || '-'}</div>
                  </div>
                  <div className="detail-item">
                    <label>Zip</label>
                    <div className="value">{selectedOrder.zip_code || '-'}</div>
                  </div>
                </div>
              </div>
              
              <div className="detail-section">
                <h3>Warehouse & Shipping</h3>
                <div className="detail-grid">
                  <div className="detail-item">
                    <label>Warehouse 1</label>
                    <div className="value">{selectedOrder.warehouse_1 || '-'}</div>
                  </div>
                  <div className="detail-item">
                    <label>Warehouse 2</label>
                    <div className="value">{selectedOrder.warehouse_2 || '-'}</div>
                  </div>
                  <div className="detail-item">
                    <label>Warehouse 3</label>
                    <div className="value">{selectedOrder.warehouse_3 || '-'}</div>
                  </div>
                  <div className="detail-item">
                    <label>Warehouse 4</label>
                    <div className="value">{selectedOrder.warehouse_4 || '-'}</div>
                  </div>
                  <div className="detail-item">
                    <label>RL Quote #</label>
                    <div className="value">{selectedOrder.rl_quote_no || '-'}</div>
                  </div>
                  <div className="detail-item">
                    <label>PRO Number</label>
                    <div className="value">{selectedOrder.pro_number || '-'}</div>
                  </div>
                  <div className="detail-item">
                    <label>Tracking</label>
                    <div className="value">{selectedOrder.tracking || '-'}</div>
                  </div>
                </div>
              </div>
              
              <div className="detail-section ai-summary-section">
                <h3>
                  AI Summary 
                  <button 
                    className="refresh-btn"
                    onClick={() => loadAiSummary(selectedOrder.order_id, true)}
                    disabled={summaryLoading}
                    title="Refresh Summary"
                  >
                    🔄
                  </button>
                </h3>
                <div className="detail-item">
                  {summaryLoading ? (
                    <div className="summary-loading">Generating summary...</div>
                  ) : aiSummary ? (
                    <div className="value ai-summary" style={{whiteSpace: 'pre-wrap'}}>{aiSummary}</div>
                  ) : (
                    <div className="value">No summary available</div>
                  )}
                </div>
              </div>
              
              <div className="detail-section">
                <h3>Comments</h3>
                <div className="detail-item">
                  <div className="value" style={{whiteSpace: 'pre-wrap'}}>{selectedOrder.comments || 'No comments'}</div>
                </div>
              </div>
              
              <div className="detail-section">
                <h3>Notes</h3>
                <textarea
                  className="notes-input"
                  defaultValue={selectedOrder.notes || ''}
                  placeholder="Add internal notes..."
                  onBlur={(e) => {
                    if (e.target.value !== selectedOrder.notes) {
                      updateOrder(selectedOrder.order_id, { notes: e.target.value })
                    }
                  }}
                />
              </div>
            </div>
          </div>
        </div>
      )}
      
      {/* RL Quote Modal */}
      {rlQuoteModal && (
        <div className="modal-overlay" onClick={() => setRlQuoteModal(null)}>
          <div className="modal rl-quote-modal" onClick={(e) => e.stopPropagation()}>
            <div className="modal-header">
              <h2>RL Carriers Quote - {rlQuoteModal.data.shipment_id}</h2>
              <button className="modal-close" onClick={() => setRlQuoteModal(null)}>×</button>
            </div>
            <div className="modal-body">
              <div className="rl-quote-info">
                <div className="rl-quote-row">
                  <label>Origin (Warehouse):</label>
                  <span className="rl-value">{rlQuoteModal.data.warehouse} - <strong>{rlQuoteModal.data.origin_zip}</strong></span>
                </div>
                <div className="rl-quote-row">
                  <label>Origin ZIP:</label>
                  <span className="rl-value">
                    <strong>{rlQuoteModal.data.origin_zip}</strong>
                    <button className="copy-btn" onClick={() => {navigator.clipboard.writeText(rlQuoteModal.data.origin_zip); }}>📋</button>
                  </span>
                </div>
                <div className="rl-quote-row">
                  <label>Destination:</label>
                  <span className="rl-value">
                    {rlQuoteModal.data.destination.name}, {rlQuoteModal.data.destination.city}, {rlQuoteModal.data.destination.state}
                    <br/><strong>{rlQuoteModal.data.destination.zip}</strong>
                    <button className="copy-btn" onClick={() => {navigator.clipboard.writeText(rlQuoteModal.data.destination.zip); }}>📋</button>
                  </span>
                </div>
                <div className="rl-quote-row">
                  <label>Weight:</label>
                  <span className="rl-value">
                    {rlQuoteModal.data.weight.value ? (
                      <>
                        <strong>{rlQuoteModal.data.weight.value} lbs</strong>
                        <button className="copy-btn" onClick={() => {navigator.clipboard.writeText(String(rlQuoteModal.data.weight.value)); }}>📋</button>
                        <span className="rl-note">({rlQuoteModal.data.weight.note})</span>
                      </>
                    ) : (
                      <span className="rl-warning">⚠️ {rlQuoteModal.data.weight.note || 'Enter weight manually on RL site'}</span>
                    )}
                  </span>
                </div>
                {rlQuoteModal.data.oversized.detected && (
                  <div className="rl-quote-row rl-oversized-warning">
                    <label>⚠️ Oversized Items:</label>
                    <span className="rl-value">
                      Check "Dimensions" box on RL quote!
                      <ul>
                        {rlQuoteModal.data.oversized.items.map((item, i) => (
                          <li key={i}>{item}</li>
                        ))}
                      </ul>
                    </span>
                  </div>
                )}
                <div className="rl-quote-row">
                  <label>Class:</label>
                  <span className="rl-value"><strong>85</strong> (always)</span>
                </div>
              </div>
              
              <div className="rl-quote-actions">
                <button 
                  className="btn btn-primary"
                  onClick={() => {
                    // Open RL in right half of screen - keep it persistent
                    const w = window.screen.width / 2
                    const h = window.screen.height
                    window.open(
                      rlQuoteModal.data.rl_quote_url,
                      'RLQuote',
                      `width=${w},height=${h},left=${w},top=0,resizable=yes,scrollbars=yes`
                    )
                  }}
                >
                  Open RL Quote Page →
                </button>
              </div>
              
              <div className="rl-quote-entry">
                <h4>Enter Quote Results:</h4>
                <div className="rl-quote-inputs">
                  <div className="rl-input-group">
                    <label>Quote Number:</label>
                    <input 
                      type="text" 
                      id="rl-quote-number"
                      defaultValue={rlQuoteModal.data.existing_quote.quote_number || ''}
                      placeholder="e.g., 9680088"
                    />
                  </div>
                  <div className="rl-input-group">
                    <label>Quote Price ($):</label>
                    <input 
                      type="number" 
                      id="rl-quote-price"
                      step="0.01"
                      defaultValue={rlQuoteModal.data.existing_quote.quote_price || ''}
                      placeholder="e.g., 179.38"
                    />
                  </div>
                  <div className="rl-input-group">
                    <label>Customer Price (+$50):</label>
                    <input 
                      type="text" 
                      id="rl-customer-price"
                      readOnly
                      value={rlQuoteModal.data.existing_quote.customer_price ? 
                        `$${rlQuoteModal.data.existing_quote.customer_price.toFixed(2)}` : 
                        'Auto-calculated'
                      }
                      className="rl-calculated"
                    />
                  </div>
                </div>
                <button 
                  className="btn btn-success"
                  onClick={() => {
                    const quoteNum = document.getElementById('rl-quote-number').value
                    const quotePrice = document.getElementById('rl-quote-price').value
                    saveRlQuote(rlQuoteModal.shipmentId, quoteNum, quotePrice)
                  }}
                >
                  Save Quote
                </button>
              </div>
              
              <div className="rl-bol-helper">
                <h4>BOL Helper (copy for RL form):</h4>
                
                <div className="rl-bol-row">
                  <label>Bill To (Section 3):</label>
                  <button className="btn btn-secondary" onClick={() => {
                    navigator.clipboard.writeText('Cabinets For Contactors-Cust Number C00VP1')
                  }}>📋 Company Name</button>
                  <button className="btn btn-secondary" onClick={() => {
                    navigator.clipboard.writeText('185 Stevenson Point')
                  }}>📋 Address</button>
                  <button className="btn btn-secondary" onClick={() => {
                    navigator.clipboard.writeText('30132')
                  }}>📋 ZIP</button>
                </div>
                
                <div className="rl-bol-row">
                  <label>Email Notifications:</label>
                  <button className="btn btn-secondary" onClick={() => {
                    const custEmail = rlQuoteModal.data.destination.email || ''
                    const combo = custEmail ? `${custEmail}, cabinetsforcontractors@gmail.com` : 'cabinetsforcontractors@gmail.com'
                    navigator.clipboard.writeText(combo)
                  }}>📋 Copy Emails</button>
                  <span className="rl-note">{rlQuoteModal.data.destination.email || 'No customer email'} + your email</span>
                </div>
                
                <div className="rl-bol-row">
                  <label>Customer Address:</label>
                  <button className="btn btn-secondary" onClick={() => {
                    const d = rlQuoteModal.data.destination
                    navigator.clipboard.writeText(d.street || '')
                  }}>📋 Street</button>
                  <button className="btn btn-secondary" onClick={() => {
                    const d = rlQuoteModal.data.destination
                    navigator.clipboard.writeText(`${d.city}, ${d.state}`)
                  }}>📋 City/State</button>
                </div>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}

export default App
