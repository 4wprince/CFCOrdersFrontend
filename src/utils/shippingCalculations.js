/**
 * shippingCalculations.js - Shipping Cost Calculations
 * Calculate shipping totals, profit, etc.
 */

/**
 * Calculate shipping totals from shipments array
 * Returns null if no shipments
 */
export function calculateShippingTotals(shipments) {
  if (!shipments || shipments.length === 0) return null
  
  let quotedTotal = 0
  let customerChargeTotal = 0
  let actualCostTotal = 0
  let allQuoted = true
  
  shipments.forEach(s => {
    // Customer charge (what we charge)
    if (s.rl_customer_price) {
      customerChargeTotal += parseFloat(s.rl_customer_price)
    } else if (s.li_customer_price) {
      customerChargeTotal += parseFloat(s.li_customer_price)
    } else if (s.customer_price) {
      customerChargeTotal += parseFloat(s.customer_price)
    } else if (s.ps_quote_price) {
      customerChargeTotal += parseFloat(s.ps_quote_price)
    } else if (s.ship_method === 'Pickup') {
      // No charge for pickup
    } else {
      allQuoted = false
    }
    
    // Our cost (what we pay)
    if (s.rl_quote_price) {
      quotedTotal += parseFloat(s.rl_quote_price)
    } else if (s.li_quote_price) {
      quotedTotal += parseFloat(s.li_quote_price)
    } else if (s.quote_price) {
      quotedTotal += parseFloat(s.quote_price)
    } else if (s.ps_quote_price) {
      quotedTotal += parseFloat(s.ps_quote_price)
    }
  })
  
  return {
    quoted: quotedTotal,
    customerCharge: customerChargeTotal,
    actualCost: actualCostTotal,
    profit: customerChargeTotal - quotedTotal,
    actualProfit: actualCostTotal > 0 ? customerChargeTotal - actualCostTotal : null,
    allQuoted
  }
}

/**
 * Get carrier info from tracking number
 */
export function getCarrierFromTracking(trackingNumber, shipMethod) {
  if (shipMethod === 'LTL') {
    return {
      carrier: 'RL Carriers',
      trackingUrl: `https://www.rlcarriers.com/freight/shipping/shipment-tracing?pro=${trackingNumber}`
    }
  }
  
  if (trackingNumber.startsWith('1Z')) {
    return {
      carrier: 'UPS',
      trackingUrl: `https://www.ups.com/track?tracknum=${trackingNumber}`
    }
  }
  
  if (trackingNumber.length === 22 || trackingNumber.length === 26) {
    return {
      carrier: 'USPS',
      trackingUrl: `https://tools.usps.com/go/TrackConfirmAction?tLabels=${trackingNumber}`
    }
  }
  
  return {
    carrier: 'Freight',
    trackingUrl: ''
  }
}
