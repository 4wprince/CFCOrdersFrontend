/**
 * OrderCard.jsx
 * Display a single order with status, customer info, and shipments
 */

import ShipmentRow from './ShipmentRow'

const STATUS_MAP = {
  'needs_payment_link': { label: '1-Need Invoice', class: 'needs-invoice' },
  'awaiting_payment': { label: '2-Awaiting Pay', class: 'awaiting-pay' },
  'needs_warehouse_order': { label: '3-Need to Order', class: 'needs-order' },
  'awaiting_warehouse': { label: '4-At Warehouse', class: 'at-warehouse' },
  'needs_bol': { label: '5-Need BOL', class: 'needs-bol' },
  'awaiting_shipment': { label: '6-Ready Ship', class: 'ready-ship' },
  'complete': { label: 'Complete', class: 'complete' }
}

const OrderCard = ({ 
  order, 
  onOpenDetail,
  onOpenShippingManager,
  onUpdate 
}) => {
  const status = STATUS_MAP[order.current_status] || STATUS_MAP['needs_payment_link']
  
  // Get customer display info
  const customerName = order.company_name || order.customer_name || 'Unknown'
  const location = order.city && order.state ? `${order.city}, ${order.state}` : ''
  
  // Get warehouses from order
  const warehouses = [
    order.warehouse_1,
    order.warehouse_2,
    order.warehouse_3,
    order.warehouse_4
  ].filter(Boolean)
  
  // Format order total
  const total = order.order_total 
    ? `$${parseFloat(order.order_total).toLocaleString('en-US', { minimumFractionDigits: 2 })}`
    : ''
  
  return (
    <div className={`order-card status-${status.class}`}>
      <div className="order-header" onClick={() => onOpenDetail(order)}>
        <div className="order-id">#{order.order_id}</div>
        <div className="order-status">{status.label}</div>
        {order.days_open > 0 && (
          <div className="days-open">{order.days_open}d</div>
        )}
      </div>
      
      <div className="order-body" onClick={() => onOpenDetail(order)}>
        <div className="customer-info">
          <div className="customer-name">{customerName}</div>
          {location && <div className="customer-location">{location}</div>}
        </div>
        
        {total && <div className="order-total">{total}</div>}
        
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
