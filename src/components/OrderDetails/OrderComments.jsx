/**
 * OrderComments.jsx
 * Display and edit internal notes for an order
 */

import { useState } from 'react'
import { updateOrder, generateAISummary } from '../../api/api'

const OrderComments = ({ order, onUpdate }) => {
  const [notes, setNotes] = useState(order.notes || '')
  const [isEditing, setIsEditing] = useState(false)
  const [isSaving, setIsSaving] = useState(false)
  const [isRefreshingSummary, setIsRefreshingSummary] = useState(false)

  const handleSave = async () => {
    setIsSaving(true)
    try {
      // 1) Save internal notes
      await updateOrder(order.order_id, { notes })

      // 2) Force-regenerate AI summary after notes are saved
      await generateAISummary(order.order_id, true)

      // 3) Close editor and let parent re-fetch updated order
      setIsEditing(false)
      if (onUpdate) onUpdate()
    } catch (err) {
      console.error('Failed to save notes or refresh summary:', err)
    } finally {
      setIsSaving(false)
    }
  }

  const handleRefreshSummary = async () => {
    setIsRefreshingSummary(true)
    try {
      await generateAISummary(order.order_id, true)
      if (onUpdate) onUpdate()
    } catch (err) {
      console.error('Failed to refresh summary:', err)
    } finally {
      setIsRefreshingSummary(false)
    }
  }

  return (
    <div className="order-comments">
      {/* Customer Comments (from B2BWave - read only) */}
      {order.comments && (
        <div className="comments-section">
          <h4>Customer Comments</h4>
          <p className="customer-comments">{order.comments}</p>
        </div>
      )}

      {/* Internal Notes (editable) */}
      <div className="comments-section">
        <div className="section-header">
          <h4>Internal Notes</h4>
          {!isEditing && (
            <button
              className="btn btn-sm btn-secondary"
              onClick={() => setIsEditing(true)}
            >
              {notes ? 'Edit' : 'Add Note'}
            </button>
          )}
        </div>

        {isEditing ? (
          <div className="notes-editor">
            <textarea
              value={notes}
              onChange={(e) => setNotes(e.target.value)}
              placeholder="Add internal notes... (e.g., 'Combine with order 5124', 'Customer called - rush order')"
              rows={4}
            />
            <div className="editor-actions">
              <button
                className="btn btn-sm btn-success"
                onClick={handleSave}
                disabled={isSaving}
              >
                {isSaving ? 'Saving...' : 'Save'}
              </button>
              <button
                className="btn btn-sm btn-secondary"
                onClick={() => {
                  setNotes(order.notes || '')
                  setIsEditing(false)
                }}
                disabled={isSaving}
              >
                Cancel
              </button>
            </div>
          </div>
        ) : (
          notes && <p className="internal-notes">{notes}</p>
        )}
      </div>

      {/* AI Summary */}
      <div className="comments-section">
        <div className="section-header">
          <h4>AI Summary</h4>
          <button
            className="btn btn-sm btn-secondary"
            onClick={handleRefreshSummary}
            disabled={isRefreshingSummary}
          >
            {isRefreshingSummary ? 'Refreshing...' : 'Refresh'}
          </button>
        </div>
        {order.ai_summary ? (
          <pre className="ai-summary">{order.ai_summary}</pre>
        ) : (
          <p className="no-summary">No AI summary yet. Click Refresh to generate.</p>
        )}
      </div>
    </div>
  )
}

export default OrderComments
