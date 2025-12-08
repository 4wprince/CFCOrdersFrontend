/**
 * CustomerAddress.jsx
 * Shared component for copying customer address fields
 * Used by both RLQuoteHelper and PirateshipHelper
 */

const CopyButton = ({ text, label }) => {
  if (!text) return null
  
  const handleCopy = () => {
    navigator.clipboard.writeText(text)
  }
  
  return (
    <div className="copy-row">
      <span className="copy-label">{label}:</span>
      <span className="copy-value">{text}</span>
      <button className="copy-btn" onClick={handleCopy} title="Copy">📋</button>
    </div>
  )
}

const CustomerAddress = ({ destination, title = "Ship To (Customer)" }) => {
  if (!destination) return null
  
  return (
    <div className="address-section">
      <h4>{title}</h4>
      <CopyButton label="Company/Name" text={destination.name} />
      <CopyButton label="Street" text={destination.street} />
      <CopyButton label="City" text={destination.city} />
      <CopyButton label="State" text={destination.state} />
      <CopyButton label="ZIP" text={destination.zip} />
      <CopyButton label="Phone" text={destination.phone} />
      <CopyButton label="Email" text={destination.email} />
    </div>
  )
}

// Static billing address for CFC
const BillToAddress = () => {
  const billTo = {
    company: 'Cabinets For Contactors-Cust Number C00VP1',
    street: '185 Stevenson Point',
    city: 'DALLAS',
    state: 'GA',
    zip: '30132',
    email: 'cabinetsforcontractors@gmail.com',
    phone: '(770) 990-4885'
  }
  
  return (
    <div className="address-section bill-to">
      <h4>Bill To (Section 3 - Always Same)</h4>
      <CopyButton label="Company" text={billTo.company} />
      <CopyButton label="Street" text={billTo.street} />
      <CopyButton label="City" text={billTo.city} />
      <CopyButton label="State" text={billTo.state} />
      <CopyButton label="ZIP" text={billTo.zip} />
      <CopyButton label="Email" text={billTo.email} />
      <CopyButton label="Phone" text={billTo.phone} />
    </div>
  )
}

export { CustomerAddress, BillToAddress, CopyButton }
export default CustomerAddress
