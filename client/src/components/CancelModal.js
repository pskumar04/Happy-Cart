import React, { useState } from 'react';
import axios from 'axios';
import { API_URL } from '../config';
import { toast } from 'react-toastify';

const CancelModal = ({ isOpen, onClose, order, onCancelSubmitted }) => {
  const [reason, setReason] = useState('');
  const [loading, setLoading] = useState(false);

  const handleSubmit = async (e) => {
    e.preventDefault();
    
    if (!reason.trim()) {
      toast.error('Please provide a cancellation reason');
      return;
    }

    setLoading(true);

    try {
      await axios.post(`${API_URL}/order-requests/${order._id}/cancel`, {
        reason
      });

      toast.success('Order cancelled successfully!');
      onCancelSubmitted();
      onClose();
      setReason('');
    } catch (error) {
      toast.error(error.response?.data?.message || 'Error cancelling order');
    } finally {
      setLoading(false);
    }
  };

  if (!isOpen) return null;

  return (
    <div style={{
      position: 'fixed',
      top: 0,
      left: 0,
      right: 0,
      bottom: 0,
      background: 'rgba(0,0,0,0.5)',
      display: 'flex',
      alignItems: 'center',
      justifyContent: 'center',
      zIndex: 1000
    }}>
      <div style={{
        background: 'white',
        padding: '2rem',
        borderRadius: '15px',
        width: '90%',
        maxWidth: '500px',
        boxShadow: '0 10px 30px rgba(0,0,0,0.3)'
      }}>
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '1rem' }}>
          <h2 style={{ margin: 0, color: '#e74c3c' }}>
            Cancel Order
          </h2>
          <button
            onClick={onClose}
            style={{
              background: 'none',
              border: 'none',
              fontSize: '1.5rem',
              cursor: 'pointer',
              color: '#666'
            }}
          >
            ×
          </button>
        </div>

        <p style={{ marginBottom: '1.5rem', color: '#666' }}>
          Order #: {order.orderNumber}
        </p>

        <form onSubmit={handleSubmit}>
          <div style={{ marginBottom: '1.5rem' }}>
            <label style={{ display: 'block', marginBottom: '0.5rem', fontWeight: '600' }}>
              Cancellation Reason:
            </label>
            <select
              value={reason}
              onChange={(e) => setReason(e.target.value)}
              style={{ width: '100%', padding: '0.75rem', border: '2px solid #e1e8ed', borderRadius: '8px' }}
              required
            >
              <option value="">Select a reason</option>
              <option value="Changed Mind">Changed Mind</option>
              <option value="Found Better Price">Found Better Price</option>
              <option value="Shipping Too Long">Shipping Too Long</option>
              <option value="Ordered by Mistake">Ordered by Mistake</option>
              <option value="Payment Issue">Payment Issue</option>
              <option value="Other">Other</option>
            </select>
          </div>

          <div style={{ display: 'flex', gap: '1rem', justifyContent: 'flex-end' }}>
            <button
              type="button"
              onClick={onClose}
              disabled={loading}
              style={{
                padding: '0.75rem 1.5rem',
                background: 'transparent',
                color: '#667eea',
                border: '2px solid #667eea',
                borderRadius: '8px',
                cursor: loading ? 'not-allowed' : 'pointer',
                opacity: loading ? 0.6 : 1
              }}
            >
              Keep Order
            </button>
            <button
              type="submit"
              disabled={loading}
              style={{
                padding: '0.75rem 1.5rem',
                background: loading ? '#ccc' : '#e74c3c',
                color: 'white',
                border: 'none',
                borderRadius: '8px',
                cursor: loading ? 'not-allowed' : 'pointer',
                opacity: loading ? 0.6 : 1
              }}
            >
              {loading ? 'Cancelling...' : 'Confirm Cancellation'}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};

export default CancelModal;