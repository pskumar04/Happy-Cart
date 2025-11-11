import React, { useState } from 'react';
import axios from 'axios';
import { API_URL, IMAGE_BASE_URL } from '../config';
import { toast } from 'react-toastify';

const ReturnModal = ({ isOpen, onClose, order, type = 'return', onRequestSubmitted }) => {
  const [selectedItems, setSelectedItems] = useState({});
  const [reason, setReason] = useState('');
  const [exchangeDetails, setExchangeDetails] = useState({});
  const [loading, setLoading] = useState(false);

  const handleItemSelect = (itemId, quantity) => {
    setSelectedItems(prev => ({
      ...prev,
      [itemId]: prev[itemId] ? 0 : quantity // Toggle selection
    }));
  };

  const handleExchangeDetailChange = (itemId, field, value) => {
    setExchangeDetails(prev => ({
      ...prev,
      [itemId]: {
        ...prev[itemId],
        [field]: value
      }
    }));
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    
    const selectedItemIds = Object.keys(selectedItems).filter(itemId => selectedItems[itemId] > 0);
    
    if (selectedItemIds.length === 0) {
      toast.error('Please select at least one item');
      return;
    }

    if (!reason.trim()) {
      toast.error('Please provide a reason');
      return;
    }

    setLoading(true);

    try {
      const endpoint = type === 'return' 
        ? `${API_URL}/order-requests/${order._id}/return`
        : `${API_URL}/order-requests/${order._id}/exchange`;

      const items = selectedItemIds.map(itemId => {
        const item = order.items.find(i => i._id === itemId);
        const requestItem = {
          productId: item.product._id,
          quantity: selectedItems[itemId]
        };

        if (type === 'exchange') {
          requestItem.exchangeSize = exchangeDetails[itemId]?.size || item.size;
          requestItem.exchangeColor = exchangeDetails[itemId]?.color || item.color;
        }

        return requestItem;
      });

      await axios.post(endpoint, {
        items,
        reason
      });

      toast.success(`${type === 'return' ? 'Return' : 'Exchange'} request submitted successfully!`);
      onRequestSubmitted();
      onClose();
      setSelectedItems({});
      setReason('');
      setExchangeDetails({});
    } catch (error) {
      toast.error(error.response?.data?.message || `Error submitting ${type} request`);
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
        maxWidth: '600px',
        maxHeight: '80vh',
        overflow: 'auto',
        boxShadow: '0 10px 30px rgba(0,0,0,0.3)'
      }}>
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '1rem' }}>
          <h2 style={{ margin: 0 }}>
            Request {type === 'return' ? 'Return' : 'Exchange'}
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
          {/* Select Items */}
          <div style={{ marginBottom: '1.5rem' }}>
            <label style={{ display: 'block', marginBottom: '0.5rem', fontWeight: '600' }}>
              Select Items to {type === 'return' ? 'Return' : 'Exchange'}:
            </label>
            <div style={{ maxHeight: '200px', overflow: 'auto', border: '1px solid #e1e8ed', borderRadius: '8px', padding: '1rem' }}>
              {order.items.map(item => (
                <div key={item._id} style={{ 
                  display: 'flex', 
                  alignItems: 'center', 
                  padding: '0.5rem 0',
                  borderBottom: '1px solid #f0f0f0'
                }}>
                  <input
                    type="checkbox"
                    checked={!!selectedItems[item._id]}
                    onChange={() => handleItemSelect(item._id, item.quantity)}
                    style={{ marginRight: '1rem' }}
                  />
                  <img 
                    src={item.product.images && item.product.images[0] ? `${IMAGE_BASE_URL}${item.product.images[0]}` : 'https://via.placeholder.com/50x50'} 
                    alt={item.product.name}
                    style={{ width: '50px', height: '50px', objectFit: 'cover', borderRadius: '4px', marginRight: '1rem' }}
                  />
                  <div style={{ flex: 1 }}>
                    <div style={{ fontWeight: '600' }}>{item.product.name}</div>
                    <div style={{ fontSize: '0.9rem', color: '#666' }}>
                      Qty: {item.quantity} | Size: {item.size} | Color: {item.color}
                    </div>
                  </div>
                </div>
              ))}
            </div>
          </div>

          {/* Exchange Details */}
          {type === 'exchange' && Object.keys(selectedItems).filter(id => selectedItems[id] > 0).length > 0 && (
            <div style={{ marginBottom: '1.5rem' }}>
              <label style={{ display: 'block', marginBottom: '0.5rem', fontWeight: '600' }}>
                Exchange Preferences:
              </label>
              {order.items.filter(item => selectedItems[item._id]).map(item => (
                <div key={item._id} style={{ marginBottom: '1rem', padding: '1rem', background: '#f8f9fa', borderRadius: '8px' }}>
                  <div style={{ fontWeight: '600', marginBottom: '0.5rem' }}>{item.product.name}</div>
                  <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '0.5rem' }}>
                    <div>
                      <label>New Size:</label>
                      <select
                        value={exchangeDetails[item._id]?.size || item.size}
                        onChange={(e) => handleExchangeDetailChange(item._id, 'size', e.target.value)}
                        style={{ width: '100%', padding: '0.5rem', border: '1px solid #e1e8ed', borderRadius: '4px' }}
                      >
                        <option value="S">S</option>
                        <option value="M">M</option>
                        <option value="L">L</option>
                        <option value="XL">XL</option>
                      </select>
                    </div>
                    <div>
                      <label>New Color:</label>
                      <select
                        value={exchangeDetails[item._id]?.color || item.color}
                        onChange={(e) => handleExchangeDetailChange(item._id, 'color', e.target.value)}
                        style={{ width: '100%', padding: '0.5rem', border: '1px solid #e1e8ed', borderRadius: '4px' }}
                      >
                        <option value="Black">Black</option>
                        <option value="White">White</option>
                        <option value="Blue">Blue</option>
                        <option value="Red">Red</option>
                        <option value="Green">Green</option>
                      </select>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          )}

          {/* Reason */}
          <div style={{ marginBottom: '1.5rem' }}>
            <label style={{ display: 'block', marginBottom: '0.5rem', fontWeight: '600' }}>
              Reason for {type === 'return' ? 'Return' : 'Exchange'}:
            </label>
            <select
              value={reason}
              onChange={(e) => setReason(e.target.value)}
              style={{ width: '100%', padding: '0.75rem', border: '2px solid #e1e8ed', borderRadius: '8px' }}
              required
            >
              <option value="">Select a reason</option>
              <option value="Wrong Size">Wrong Size</option>
              <option value="Wrong Color">Wrong Color</option>
              <option value="Product Damaged">Product Damaged</option>
              <option value="Not as Described">Not as Described</option>
              <option value="Changed Mind">Changed Mind</option>
              <option value="Quality Issues">Quality Issues</option>
              <option value="Other">Other</option>
            </select>
          </div>

          {/* Buttons */}
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
              Cancel
            </button>
            <button
              type="submit"
              disabled={loading || Object.keys(selectedItems).filter(id => selectedItems[id] > 0).length === 0}
              style={{
                padding: '0.75rem 1.5rem',
                background: loading ? '#ccc' : '#667eea',
                color: 'white',
                border: 'none',
                borderRadius: '8px',
                cursor: loading ? 'not-allowed' : 'pointer',
                opacity: (loading || Object.keys(selectedItems).filter(id => selectedItems[id] > 0).length === 0) ? 0.6 : 1
              }}
            >
              {loading ? 'Submitting...' : `Submit ${type === 'return' ? 'Return' : 'Exchange'} Request`}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};

export default ReturnModal;