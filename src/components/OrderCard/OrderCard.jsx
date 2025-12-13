/**
 * OrderCard.jsx
 * Display a single order with status, customer info, shipments
 */

import { useState } from 'react'
import ShipmentRow from '../Shipping/ShipmentRow'
import { updateOrderStatus } from '../../api/api'
import { STATUS_MAP, STATUS_OPTIONS, STATUS_FIELD_MAP } from '../../utils/constants'
import { formatShortDate, formatCurrency } from '../../utils/formatters'
import { calculateShippingTotals } from '../../utils/shippingCalculations'

const OrderCard = ({ 
  order, 
  onOpenDetail,
  onOpenShippingManager,
  onUpdate 
}) => {
  const [isUpdating, setIsUpdating] = useState(false)
  const status = STATUS_MAP[order.current_status] || STATUS_MAP['needs_payment_link']
  
  // Get customer display info
  const customerName = order.company_name || order.customer_name || 'Unknown'
  const location = order.city && order.state ? `${order.city}, ${order.state}` : ''
  
  // Format order date
  const orderDate = formatShortDate(order.order_date)
  
  // Get warehouses from order
  const warehouses = [
    order.warehouse_1,
    order.warehouse_2,
    order.warehouse_3,
    order.warehouse_4
  ].filter(Boolean)
  
  // Format order total
  const orderTotal = parseFloat(order.order_total || 0)
  const totalDisplay = formatCurrency(orderTotal)
  
  // Handle status change
  const handleStatusChange = async (e) => {
    e.stopPropagation()
    const newStatus = e.target.value
    if (newStatus === order.current_status) return
    
    setIsUpdating(true)
    try {
      const updates = STATUS_FIELD_MAP[newStatus] || {}
      await updateOrderStatus(order.order_id, updates)
      if (onUpdate) onUpdate()
    } catch (err) {
      console.error('Failed to update status:', err)
    }
    setIsUpdating(false)
  }
  
  // Calculate shipping totals
  const shippingTotals = calculateShippingTotals(order.shipments)
  
  return (
    <div className="order-card" style={{ borderLeftColor: status.color }}>
      <div className="order-header">
        <div className="order-id" onClick={() => onOpenDetail(order)}>#{order.order_id}</div>
        {orderDate && <div className="order-date">{orderDate}</div>}
        <select 
          className="status-dropdown"
          value={order.current_status || 'needs_payment_link'}
          onChange={handleStatusChange}
          onClick={(e) => e.stopPropagation()}
          disabled={isUpdating}
          style={{ 
            backgroundColor: status.color + '20', 
            color: status.color,
            borderColor: status.color
          }}
        >
          {STATUS_OPTIONS.map(opt => (
            <option key={opt.value} value={opt.value}>{opt.label}</option>
          ))}
        </select>
        {order.days_open > 0 && (
          <div className="days-open">{order.days_open}d</div>
        )}
      </div>
      
      <div className="order-body" onClick={() => onOpenDetail(order)}>
        <div className="customer-info">
          <div className="customer-name">{customerName}</div>
          {location && <div className="customer-location">{location}</div>}
        </div>
        
        <div className="order-financials">
          {totalDisplay && <div className="order-total">Order: {totalDisplay}</div>}
          
          {/* Shipping cost summary */}
          {shippingTotals && shippingTotals.customerCharge > 0 && (
            <div className="shipping-summary">
              <span className="ship-charge">Ship: ${shippingTotals.customerCharge.toFixed(2)}</span>
              {shippingTotals.profit !== 0 && (
                <span className={`ship-profit ${shippingTotals.profit >= 0 ? 'positive' : 'negative'}`}>
                  ({shippingTotals.profit >= 0 ? '+' : ''}${shippingTotals.profit.toFixed(2)})
                </span>
              )}
            </div>
          )}
          
          {/* Grand total */}
          {totalDisplay && shippingTotals && shippingTotals.customerCharge > 0 && (
            <div className="grand-total">
              Total: ${(orderTotal + shippingTotals.customerCharge).toFixed(2)}
            </div>
          )}
        </div>
        
        {warehouses.length > 0 && (
          <div className="warehouses">
            {warehouses.map((wh, i) => (
              <span key={i} className="warehouse-tag">{wh}</span>
            ))}
          </div>
        )}
      </div>
      
      {/* Shipments section */}
      {order.shipments && order.shipments.length > 0 && (
        <div className="order-shipments">
          {order.shipments.map((shipment, i) => (
            <ShipmentRow 
              key={shipment.shipment_id || i}
              shipment={shipment}
              order={order}
              onOpenShippingManager={onOpenShippingManager}
              onUpdate={onUpdate}
            />
          ))}
        </div>
      )}
      
      {/* Quick actions */}
      <div className="order-actions">
        <button 
          className="btn btn-sm"
          onClick={(e) => {
            e.stopPropagation()
            onOpenDetail(order)
          }}
        >
          Details
        </button>
      </div>
    </div>
  )
}

export default OrderCard
