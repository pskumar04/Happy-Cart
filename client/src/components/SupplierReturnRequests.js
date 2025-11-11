// components/SupplierReturnRequests.js
import React, { useState, useEffect } from 'react';
import axios from 'axios';
import { API_URL, IMAGE_BASE_URL } from '../config';
import { toast } from 'react-toastify';

const SupplierReturnRequests = () => {
  const [returnRequests, setReturnRequests] = useState([]);
  const [loading, setLoading] = useState(true);
  const [selectedRequest, setSelectedRequest] = useState(null);
  const [actionModal, setActionModal] = useState({ isOpen: false, action: '' });

  useEffect(() => {
    fetchReturnRequests();
  }, []);

  const fetchReturnRequests = async () => {
    try {
      const token = localStorage.getItem('token');
      const response = await axios.get(`${API_URL}/orders/supplier/return-requests`, {
        headers: { Authorization: `Bearer ${token}` }
      });
      
      console.log('Return requests:', response.data);
      
      // Transform the data to match component expectations
      const transformedRequests = response.data.map(request => ({
        ...request,
        // Ensure items is an object with the expected properties
        items: {
          ...request.items,
          // Map itemStatus to the correct field
          itemStatus: request.items.itemStatus || 'return_requested'
        },
        productInfo: {
          name: request.productInfo?.name || 'Unknown Product',
          images: request.productInfo?.images || [],
          price: request.productInfo?.price || 0
        }
      }));
      
      setReturnRequests(transformedRequests);
    } catch (error) {
      console.error('Error fetching return requests:', error);
      
      // More specific error handling
      if (error.response?.status === 404) {
        toast.error('Return requests endpoint not found');
      } else if (error.response?.status === 403) {
        toast.error('Access denied to return requests');
      } else {
        toast.error('Failed to load return requests');
      }
      
      setReturnRequests([]);
    } finally {
      setLoading(false);
    }
  };

  const handleStatusUpdate = async (orderId, itemId, status, notes = '') => {
    try {
      const token = localStorage.getItem('token');
      await axios.put(`${API_URL}/orders/update-item-status/${orderId}/${itemId}`, {
        status,
        adminNotes: notes
      }, {
        headers: { Authorization: `Bearer ${token}` }
      });
      
      toast.success(`Request ${status.replace('_', ' ')} successfully`);
      fetchReturnRequests(); // Refresh the list
      setActionModal({ isOpen: false, action: '' });
    } catch (error) {
      console.error('Error updating status:', error);
      toast.error('Error updating status');
    }
  };

  const getStatusColor = (status) => {
    const colors = {
      return_requested: '#e67e22',
      exchange_requested: '#3498db',
      return_approved: '#27ae60',
      exchange_approved: '#27ae60',
      return_rejected: '#e74c3c',
      exchange_rejected: '#e74c3c',
      refund_processed: '#9b59b6',
      completed: '#2ecc71'
    };
    return colors[status] || '#95a5a6';
  };

  const getStatusText = (status) => {
    const statusMap = {
      return_requested: 'Return Requested',
      exchange_requested: 'Exchange Requested',
      return_approved: 'Return Approved',
      exchange_approved: 'Exchange Approved',
      return_rejected: 'Return Rejected',
      exchange_rejected: 'Exchange Rejected',
      refund_processed: 'Refund Processed',
      completed: 'Completed'
    };
    return statusMap[status] || status.replace('_', ' ');
  };

  if (loading) {
    return <div style={{ textAlign: 'center', padding: '2rem' }}>Loading return requests...</div>;
  }

  return (
    <div style={{ padding: '2rem', maxWidth: '1200px', margin: '0 auto' }}>
      <h1>Return & Exchange Requests ({returnRequests.length})</h1>

      {returnRequests.length === 0 ? (
        <div style={{ 
          textAlign: 'center', 
          padding: '4rem 2rem', 
          background: 'white', 
          borderRadius: '10px',
          boxShadow: '0 2px 10px rgba(0,0,0,0.1)'
        }}>
          <h3>No Return Requests</h3>
          <p>You don't have any return or exchange requests at the moment.</p>
        </div>
      ) : (
        <div style={{ display: 'grid', gap: '1.5rem' }}>
          {returnRequests.map((request, index) => (
            <div key={request._id || index} style={{
              background: 'white',
              borderRadius: '10px',
              boxShadow: '0 2px 10px rgba(0,0,0,0.1)',
              padding: '1.5rem',
              borderLeft: `4px solid ${getStatusColor(request.items?.itemStatus)}`
            }}>
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: '1rem' }}>
                <div>
                  <h3 style={{ margin: 0, color: '#333' }}>Order #{request.orderNumber}</h3>
                  <p style={{ margin: '0.5rem 0', color: '#666' }}>
                    Requested on: {new Date(request.createdAt).toLocaleDateString()}
                  </p>
                  <p style={{ margin: '0.25rem 0', color: '#666' }}>
                    Customer: {request.customer?.name || 'N/A'}
                  </p>
                </div>
                
                <div style={{ textAlign: 'right' }}>
                  <div style={{
                    display: 'inline-block',
                    padding: '0.5rem 1rem',
                    background: getStatusColor(request.items?.itemStatus),
                    color: 'white',
                    borderRadius: '20px',
                    fontSize: '0.9rem',
                    fontWeight: 'bold',
                    textTransform: 'capitalize',
                    marginBottom: '0.5rem'
                  }}>
                    {getStatusText(request.items?.itemStatus)}
                  </div>
                  <p style={{ margin: '0.25rem 0', fontWeight: 'bold' }}>
                    Total: ${request.productInfo?.price * request.items?.quantity}
                  </p>
                </div>
              </div>

              {/* Product Details */}
              <div style={{ 
                background: '#f8f9fa', 
                padding: '1rem', 
                borderRadius: '8px',
                marginBottom: '1rem'
              }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: '1rem' }}>
                  <img 
                    src={request.productInfo?.images?.[0] 
                      ? `${IMAGE_BASE_URL}${request.productInfo.images[0]}` 
                      : 'https://via.placeholder.com/80x80?text=No+Image'
                    }
                    alt={request.productInfo?.name}
                    style={{
                      width: '80px',
                      height: '80px',
                      objectFit: 'cover',
                      borderRadius: '8px'
                    }}
                  />
                  <div style={{ flex: 1 }}>
                    <h4 style={{ margin: '0 0 0.5rem 0', color: '#333' }}>
                      {request.productInfo?.name}
                    </h4>
                    <p style={{ margin: '0.25rem 0', color: '#666' }}>
                      Quantity: {request.items?.quantity} | Price: ${request.productInfo?.price}
                    </p>
                    {request.items?.size && (
                      <p style={{ margin: '0.25rem 0', color: '#666' }}>
                        Size: {request.items.size}
                      </p>
                    )}
                    {request.items?.color && (
                      <p style={{ margin: '0.25rem 0', color: '#666' }}>
                        Color: {request.items.color}
                      </p>
                    )}
                  </div>
                </div>
              </div>

              {/* Reason and Notes */}
              <div style={{ marginBottom: '1rem' }}>
                {(request.items?.returnReason || request.items?.exchangeReason) && (
                  <p style={{ margin: '0.5rem 0' }}>
                    <strong>Reason:</strong> {request.items.returnReason || request.items.exchangeReason}
                  </p>
                )}
                {(request.items?.returnNotes || request.items?.exchangeNotes) && (
                  <p style={{ margin: '0.5rem 0' }}>
                    <strong>Customer Notes:</strong> {request.items.returnNotes || request.items.exchangeNotes}
                  </p>
                )}
                {request.items?.adminNotes && (
                  <p style={{ margin: '0.5rem 0', color: '#666', fontStyle: 'italic' }}>
                    <strong>Your Notes:</strong> {request.items.adminNotes}
                  </p>
                )}
              </div>

              {/* Action Buttons - Only show for pending requests */}
              {['return_requested', 'exchange_requested'].includes(request.items?.itemStatus) && (
                <div style={{ display: 'flex', gap: '1rem', flexWrap: 'wrap' }}>
                  <button
                    onClick={() => {
                      setSelectedRequest(request);
                      setActionModal({ isOpen: true, action: 'approve' });
                    }}
                    style={{
                      padding: '0.75rem 1.5rem',
                      background: '#27ae60',
                      color: 'white',
                      border: 'none',
                      borderRadius: '8px',
                      cursor: 'pointer',
                      fontWeight: '600',
                      fontSize: '0.9rem',
                      transition: 'all 0.3s ease'
                    }}
                    onMouseOver={(e) => e.target.style.background = '#219a52'}
                    onMouseOut={(e) => e.target.style.background = '#27ae60'}
                  >
                    Approve {request.items.itemStatus.includes('return') ? 'Return' : 'Exchange'}
                  </button>
                  <button
                    onClick={() => {
                      setSelectedRequest(request);
                      setActionModal({ isOpen: true, action: 'reject' });
                    }}
                    style={{
                      padding: '0.75rem 1.5rem',
                      background: '#e74c3c',
                      color: 'white',
                      border: 'none',
                      borderRadius: '8px',
                      cursor: 'pointer',
                      fontWeight: '600',
                      fontSize: '0.9rem',
                      transition: 'all 0.3s ease'
                    }}
                    onMouseOver={(e) => e.target.style.background = '#c0392b'}
                    onMouseOut={(e) => e.target.style.background = '#e74c3c'}
                  >
                    Reject {request.items.itemStatus.includes('return') ? 'Return' : 'Exchange'}
                  </button>
                </div>
              )}

              {/* Show current status for processed requests */}
              {!['return_requested', 'exchange_requested'].includes(request.items?.itemStatus) && (
                <div style={{ 
                  background: '#e8f4fd', 
                  padding: '1rem', 
                  borderRadius: '8px',
                  border: '1px solid #bee5eb'
                }}>
                  <p style={{ margin: 0, color: '#0c5460', fontWeight: '600' }}>
                    Request Status: {getStatusText(request.items?.itemStatus)}
                  </p>
                  {request.items?.statusUpdateDate && (
                    <p style={{ margin: '0.5rem 0 0 0', color: '#666', fontSize: '0.9rem' }}>
                      Updated on: {new Date(request.items.statusUpdateDate).toLocaleDateString()}
                    </p>
                  )}
                </div>
              )}
            </div>
          ))}
        </div>
      )}

      {/* Action Modal */}
      {actionModal.isOpen && selectedRequest && (
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
            borderRadius: '10px',
            width: '90%',
            maxWidth: '500px',
            boxShadow: '0 10px 30px rgba(0,0,0,0.3)'
          }}>
            <h3 style={{ margin: '0 0 1rem 0', color: '#333' }}>
              {actionModal.action === 'approve' ? 'Approve' : 'Reject'} {' '}
              {selectedRequest.items?.itemStatus?.includes('return') ? 'Return' : 'Exchange'}
            </h3>
            
            <div style={{ marginBottom: '1.5rem' }}>
              <p style={{ margin: '0 0 1rem 0', color: '#666' }}>
                Are you sure you want to {actionModal.action} this request?
              </p>
              
              <div style={{ background: '#f8f9fa', padding: '1rem', borderRadius: '8px' }}>
                <p style={{ margin: '0 0 0.5rem 0', fontWeight: '600' }}>
                  Order #{selectedRequest.orderNumber}
                </p>
                <p style={{ margin: '0 0 0.5rem 0', color: '#666' }}>
                  Product: {selectedRequest.productInfo?.name}
                </p>
                <p style={{ margin: '0', color: '#666' }}>
                  Customer: {selectedRequest.customer?.name || 'N/A'}
                </p>
              </div>
            </div>

            <div style={{ margin: '1.5rem 0' }}>
              <label style={{ display: 'block', marginBottom: '0.5rem', fontWeight: '600', color: '#333' }}>
                Notes (Optional):
              </label>
              <textarea
                id="adminNotes"
                rows="3"
                style={{
                  width: '100%',
                  padding: '0.75rem',
                  border: '2px solid #e1e8ed',
                  borderRadius: '8px',
                  resize: 'vertical',
                  fontFamily: 'inherit',
                  fontSize: '1rem'
                }}
                placeholder="Add any notes for the customer..."
              />
            </div>

            <div style={{ display: 'flex', gap: '1rem', justifyContent: 'flex-end' }}>
              <button
                onClick={() => setActionModal({ isOpen: false, action: '' })}
                style={{
                  padding: '0.75rem 1.5rem',
                  background: 'transparent',
                  color: '#667eea',
                  border: '2px solid #667eea',
                  borderRadius: '8px',
                  cursor: 'pointer',
                  fontWeight: '600',
                  transition: 'all 0.3s ease'
                }}
                onMouseOver={(e) => {
                  e.target.style.background = '#667eea';
                  e.target.style.color = 'white';
                }}
                onMouseOut={(e) => {
                  e.target.style.background = 'transparent';
                  e.target.style.color = '#667eea';
                }}
              >
                Cancel
              </button>
              <button
                onClick={() => {
                  const notes = document.getElementById('adminNotes').value;
                  const newStatus = actionModal.action === 'approve' 
                    ? (selectedRequest.items?.itemStatus?.includes('return') ? 'return_approved' : 'exchange_approved')
                    : (selectedRequest.items?.itemStatus?.includes('return') ? 'return_rejected' : 'exchange_rejected');
                  
                  handleStatusUpdate(selectedRequest._id, selectedRequest.items?._id, newStatus, notes);
                }}
                style={{
                  padding: '0.75rem 1.5rem',
                  background: actionModal.action === 'approve' ? '#27ae60' : '#e74c3c',
                  color: 'white',
                  border: 'none',
                  borderRadius: '8px',
                  cursor: 'pointer',
                  fontWeight: '600',
                  transition: 'all 0.3s ease'
                }}
                onMouseOver={(e) => e.target.style.opacity = '0.9'}
                onMouseOut={(e) => e.target.style.opacity = '1'}
              >
                Confirm {actionModal.action === 'approve' ? 'Approve' : 'Reject'}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default SupplierReturnRequests;