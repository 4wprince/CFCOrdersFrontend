/**
 * App.jsx - Main Application
 * v5.10.4 - No login required, X-Admin-Token header fix
 */

import { useState, useEffect } from 'react'
import StatusBar from './components/StatusBar'
import OrderCard from './components/OrderCard'
import ShippingManager from './components/ShippingManager'
import OrderComments from './components/OrderComments'

import { API_URL } from './config'

const ADMIN_TOKEN = 'CFC2026'

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
  // Data state
  const [orders, setOrders] = useState([])
  const [loading, setLoading] = useState(true)

  // Filter state
  const [statusFilter, setStatusFilter] = useState(null)
  const [showArchived, setShowArchived] = useState(false)

  // Modal state
  const [selectedOrder, setSelectedOrder] = useState(null)
  const [shippingModal, setShippingModal] = useState(null)

  // Comprehensive AI Summary state
  const [comprehensiveSummary, setComprehensiveSummary] = useState('')
  const [summaryLoading, setSummaryLoading] = useState(false)

  // Load orders on mount
  useEffect(() => {
    loadOrders()
  }, [])

  // === DATA LOADING ===

  const loadOrders = async () => {
    setLoading(true)
    try {
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

  // === FILTERING ===

  const getFilteredOrders = () => {
    let filtered = orders

    if (statusFilter) {
      filtered = filtered.filter(o => o.current_status === statusFilter)
    } else if (showArchived) {
      filtered = filtered.filter(o => o.current_status === 'complete')
    } else {
      filtered = filtered.filter(o => o.current_status !== 'complete')
    }

    return filtered
  }

  // === STATUS UPDATES ===

  const updateOrderStatus = async (orderId, field, value) => {
    try {
      await fetch(`${API_URL}/orders/${orderId}`, {
        method: 'PATCH',
        headers: {
          'Content-Type': 'application/json',
          'X-Admin-Token': ADMIN_TOKEN
        },
        body: JSON.stringify({ [field]: value })
      })
      loadOrders()
    } catch (err) {
      console.error('Failed to update order:', err)
    }
  }

  // === MODALS ===

  const openOrderDetail = (order) => {
    setSelectedOrder(order)
    setComprehensiveSummary('')
  }

  const closeOrderDetail = () => {
    setSelectedOrder(null)
    setComprehensiveSummary('')
  }

  const openShippingManager = (shipment, order) => {
    setShippingModal({
      shipment,
      orderId: order?.order_id || shipment.order_id,
      customerInfo: {
        name: order?.company_name || order?.customer_name || '',
        street: order?.street || '',
        city: order?.city || '',
        state: order?.state || '',
        zip: order?.zip_code || '',
        phone: order?.phone || '',
        email: order?.email || ''
      }
    })
  }

  const closeShippingManager = () => {
    setShippingModal(null)
    loadOrders()
  }

  // === COMPREHENSIVE AI SUMMARY ===

  const generateComprehensiveSummary = async () => {
    if (!selectedOrder) return

    setSummaryLoading(true)
    setComprehensiveSummary('')

    try {
      const res = await fetch(`${API_URL}/orders/${selectedOrder.order_id}/comprehensive-summary`, {
        method: 'POST'
      })
      const data = await res.json()

      if (data.summary) {
        setComprehensiveSummary(data.summary)
      } else if (data.detail) {
        setComprehensiveSummary(`Error: ${data.detail}`)
      }
    } catch (err) {
      console.error('Failed to generate summary:', err)
      setComprehensiveSummary('Failed to generate summary. Please try again.')
    }

    setSummaryLoading(false)
  }

  // === HELPER: Format Address ===

  const formatAddress = (order) => {
    const parts = []
    if (order.street) parts.push(order.street)

    const cityStateZip = []
    if (order.city) cityStateZip.push(order.city)
    if (order.state) {
      if (order.zip_code) {
        cityStateZip.push(`${order.state} ${order.zip_code}`)
      } else {
        cityStateZip.push(order.state)
      }
    } else if (order.zip_code) {
      cityStateZip.push(order.zip_code)
    }

    if (cityStateZip.length > 0) {
      parts.push(cityStateZip.join(', '))
    }

    return parts.join(', ')
  }

  // === RENDER ===

  if (loading && orders.length === 0) {
    return <div className="loading">Loading orders...</div>
  }

  const filteredOrders = getFilteredOrders()

  return (
    <div className="app">
      {/* Header */}
      <header className="app-header">
        <h1>CFC Orders</h1>
        <div className="header-actions">
          <button onClick={loadOrders} disabled={loading}>
            {loading ? 'Loading...' : 'Refresh'}
          </button>
        </div>
      </header>

      {/* Status Filter Bar */}
      <StatusBar
        orders={orders}
        activeFilter={statusFilter}
        onFilterChange={setStatusFilter}
        showArchived={showArchived}
        onToggleArchived={setShowArchived}
      />

      {/* Orders Grid */}
      <main className="orders-grid">
        {loading ? (
          <div className="loading">Loading orders...</div>
        ) : filteredOrders.length === 0 ? (
          <div className="empty">No orders found</div>
        ) : (
          filteredOrders.map(order => (
            <OrderCard
              key={order.order_id}
              order={order}
              onOpenDetail={openOrderDetail}
              onOpenShippingManager={(shipment) => openShippingManager(shipment, order)}
              onUpdate={loadOrders}
            />
          ))
        )}
      </main>

      {/* Order Detail Modal */}
      {selectedOrder && (
        <div className="modal-overlay" onClick={closeOrderDetail}>
          <div
            className="modal order-detail-modal"
            onClick={(e) => e.stopPropagation()}
            style={{
              maxHeight: '90vh',
              display: 'flex',
              flexDirection: 'column',
              width: '420px',
              maxWidth: '95vw'
            }}
          >
            <div className="modal-header" style={{
              display: 'flex',
              justifyContent: 'space-between',
              alignItems: 'center',
              padding: '16px 20px',
              backgroundColor: '#f8f9fa',
              borderBottom: '1px solid #e0e0e0'
            }}>
              <h2 style={{ margin: 0, fontSize: '20px' }}>Order #{selectedOrder.order_id}</h2>
              <div style={{ display: 'flex', alignItems: 'center', gap: '16px' }}>
                <span style={{ fontSize: '18px', fontWeight: 'bold', color: '#28a745' }}>
                  ${parseFloat(selectedOrder.order_total || 0).toFixed(2)}
                </span>
                <button
                  className="modal-close"
                  onClick={closeOrderDetail}
                  style={{
                    width: '28px',
                    height: '28px',
                    borderRadius: '50%',
                    border: 'none',
                    backgroundColor: '#eee',
                    cursor: 'pointer',
                    fontSize: '18px',
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center'
                  }}
                >×</button>
              </div>
            </div>

            <div className="modal-body" style={{
              flex: 1,
              display: 'flex',
              flexDirection: 'column',
              overflow: 'hidden',
              padding: '16px'
            }}>
              <div style={{
                border: '1px solid #e0e0e0',
                borderRadius: '6px',
                padding: '12px 14px',
                marginBottom: '12px',
                backgroundColor: '#fff'
              }}>
                <div style={{ fontSize: '12px', fontWeight: 'bold', color: '#666', marginBottom: '4px' }}>
                  Order Details - <span style={{ color: '#333', fontWeight: 'normal' }}>{selectedOrder.company_name || selectedOrder.customer_name}</span>
                </div>

                <div style={{ fontSize: '11px', color: '#666', marginBottom: '8px' }}>
                  {formatAddress(selectedOrder)}
                </div>

                <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '8px' }}>
                  <span style={{ fontSize: '13px', color: '#333' }}>
                    Date: {new Date(selectedOrder.order_date).toLocaleDateString()}
                  </span>
                  <span style={{ fontSize: '13px', color: '#333' }}>
                    Days Open: <strong>{selectedOrder.days_open}</strong>
                  </span>
                </div>

                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                  <span style={{ fontSize: '13px', color: '#333' }}>
                    Status: {STATUS_MAP[selectedOrder.current_status]?.label || selectedOrder.current_status}
                  </span>
                  <button
                    onClick={generateComprehensiveSummary}
                    disabled={summaryLoading}
                    style={{
                      padding: '5px 10px',
                      backgroundColor: summaryLoading ? '#ccc' : '#28a745',
                      color: 'white',
                      border: 'none',
                      borderRadius: '4px',
                      cursor: summaryLoading ? 'not-allowed' : 'pointer',
                      fontSize: '11px',
                      fontWeight: '500'
                    }}
                  >
                    {summaryLoading ? 'Generating...' : 'Generate AI Summary'}
                  </button>
                </div>
              </div>

              <div style={{ flex: 1, display: 'flex', flexDirection: 'column', minHeight: '250px' }}>
                <h3 style={{ margin: '0 0 8px 0', fontSize: '12px', fontWeight: 'bold', color: '#666' }}>
                  AI Analysis
                </h3>

                <div style={{
                  flex: 1,
                  backgroundColor: '#f8f9fa',
                  borderRadius: '6px',
                  padding: '14px',
                  overflow: 'auto',
                  minHeight: '220px'
                }}>
                  {summaryLoading ? (
                    <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', height: '100%' }}>
                      <div style={{ textAlign: 'center' }}>
                        <div style={{
                          width: '36px',
                          height: '36px',
                          border: '3px solid #e0e0e0',
                          borderTop: '3px solid #28a745',
                          borderRadius: '50%',
                          animation: 'spin 1s linear infinite',
                          margin: '0 auto 12px'
                        }}></div>
                        <p style={{ color: '#666', margin: 0, fontSize: '13px' }}>Generating comprehensive analysis...</p>
                      </div>
                    </div>
                  ) : comprehensiveSummary ? (
                    <div style={{ whiteSpace: 'pre-wrap', lineHeight: '1.6', fontSize: '13px' }}>
                      {comprehensiveSummary}
                    </div>
                  ) : (
                    <div style={{
                      display: 'flex',
                      flexDirection: 'column',
                      alignItems: 'center',
                      justifyContent: 'center',
                      height: '100%',
                      color: '#999'
                    }}>
                      <p style={{ margin: 0, textAlign: 'center', fontSize: '13px', lineHeight: '1.6' }}>
                        Click "Generate AI Summary" above to create<br/>
                        a comprehensive AI analysis of this order<br/>
                        including all history and communications.
                      </p>
                    </div>
                  )}
                </div>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Shipping Manager Modal */}
      {shippingModal && (
        <div className="modal-overlay shipping-modal-overlay" onClick={closeShippingManager}>
          <div className="modal shipping-modal" onClick={(e) => e.stopPropagation()}>
            <div className="modal-header">
              <h2>Shipping - {shippingModal.shipment.warehouse}</h2>
              <button className="modal-close" onClick={closeShippingManager}>×</button>
            </div>
            <div className="modal-body">
              <ShippingManager
                shipment={shippingModal.shipment}
                orderId={shippingModal.orderId}
                customerInfo={shippingModal.customerInfo}
                onClose={closeShippingManager}
                onUpdate={loadOrders}
              />
            </div>
          </div>
        </div>
      )}

      <style>{`
        @keyframes spin {
          0% { transform: rotate(0deg); }
          100% { transform: rotate(360deg); }
        }
      `}</style>
    </div>
  )
}

export default App
