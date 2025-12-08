/**
 * StatusBar.jsx
 * Top status filter buttons with counts
 */

const STATUS_MAP = {
  'needs_payment_link': { label: '1-Need Invoice', class: 'needs-invoice' },
  'awaiting_payment': { label: '2-Awaiting Pay', class: 'awaiting-pay' },
  'needs_warehouse_order': { label: '3-Need to Order', class: 'needs-order' },
  'awaiting_warehouse': { label: '4-At Warehouse', class: 'at-warehouse' },
  'needs_bol': { label: '5-Need BOL', class: 'needs-bol' },
  'awaiting_shipment': { label: '6-Ready Ship', class: 'ready-ship' },
  'complete': { label: 'Complete', class: 'complete' }
}

const StatusBar = ({ orders, activeFilter, onFilterChange, showArchived, onToggleArchived }) => {
  // Count orders by status
  const counts = {}
  Object.keys(STATUS_MAP).forEach(key => {
    counts[key] = orders.filter(o => o.current_status === key).length
  })
  
  // Active orders (not complete)
  const activeCount = orders.filter(o => o.current_status !== 'complete').length
  const completeCount = counts['complete'] || 0
  
  return (
    <div className="status-bar">
      <div className="status-filters">
        <button 
          className={`filter-btn ${!activeFilter ? 'active' : ''}`}
          onClick={() => onFilterChange(null)}
        >
          All Active ({activeCount})
        </button>
        
        {Object.entries(STATUS_MAP).filter(([key]) => key !== 'complete').map(([key, value]) => (
          <button 
            key={key}
            className={`filter-btn status-${value.class} ${activeFilter === key ? 'active' : ''}`}
            onClick={() => onFilterChange(key)}
          >
            {value.label} ({counts[key] || 0})
          </button>
        ))}
      </div>
      
      <div className="archive-toggle">
        <label>
          <input 
            type="checkbox"
            checked={showArchived}
            onChange={(e) => onToggleArchived(e.target.checked)}
          />
          Show Complete ({completeCount})
        </label>
      </div>
    </div>
  )
}

export default StatusBar
