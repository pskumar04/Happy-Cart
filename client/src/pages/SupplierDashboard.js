// import React, { useState, useEffect } from 'react';
// import { useAuth } from '../context/AuthContext';
// import axios from 'axios';
// import { toast } from 'react-toastify';
// import SupplierReturnRequests from '../components/SupplierReturnRequests';

// const SupplierDashboard = () => {
//   const { user } = useAuth();
//   const [products, setProducts] = useState([]);
//   const [orders, setOrders] = useState([]);
//   const [showProductForm, setShowProductForm] = useState(false);
//   const [editingProduct, setEditingProduct] = useState(null);
//   const [loading, setLoading] = useState(true);
//   const [uploadingImages, setUploadingImages] = useState(false);
//   const [activeTab, setActiveTab] = useState('orders');

//   const [productForm, setProductForm] = useState({
//     name: '',
//     description: '',
//     price: '',
//     originalPrice: '',
//     category: 'men',
//     subcategory: 'shirts',
//     stock: '',
//     sizes: ['S', 'M', 'L', 'XL'],
//     colors: ['Black', 'White', 'Blue'],
//     images: [],
//     isBestSeller: false
//   });

//   // Add this state variable
//   const [orderStats, setOrderStats] = useState({
//     total: 0,
//     pending: 0,
//     confirmed: 0,
//     packed: 0,
//     shipped: 0,
//     delivered: 0
//   });

//   const [selectedImages, setSelectedImages] = useState([]);
//   const [imagePreviews, setImagePreviews] = useState([]);

//   useEffect(() => {
//     if (user && user.role === 'supplier') {
//       fetchProducts();
//       fetchOrders();
//     }
//   }, [user]);

//   // Add this function to calculate statistics
//   const calculateOrderStats = (orders) => {
//     const stats = {
//       total: orders.length,
//       pending: 0,
//       confirmed: 0,
//       packed: 0,
//       shipped: 0,
//       delivered: 0
//     };

//     orders.forEach(order => {
//       if (stats.hasOwnProperty(order.status)) {
//         stats[order.status]++;
//       }
//     });

//     return stats;
//   };

//   const fetchProducts = async () => {
//     try {
//       const response = await axios.get('http://localhost:5000/api/products');
//       const supplierProducts = response.data.products.filter(
//         product => product.supplier && product.supplier._id === user.id
//       );
//       setProducts(supplierProducts);
//     } catch (error) {
//       console.error('Error fetching products:', error);
//       toast.error('Failed to load products');
//     } finally {
//       setLoading(false);
//     }
//   };

//   const fetchOrders = async () => {
//     try {
//       const response = await axios.get('http://localhost:5000/api/orders/supplier-orders');
//       setOrders(response.data);
//       setOrderStats(calculateOrderStats(response.data));
//     } catch (error) {
//       console.error('Error fetching orders:', error);
//       toast.error('Failed to load orders');
//     }
//   };

//   // Add this function in the SupplierDashboard component
//   const validateOrderStatusChange = (currentStatus, newStatus) => {
//     const statusFlow = ['pending', 'confirmed', 'packed', 'shipped', 'delivered'];
//     const currentIndex = statusFlow.indexOf(currentStatus);
//     const newIndex = statusFlow.indexOf(newStatus);

//     // Cannot go backwards
//     if (newIndex < currentIndex) {
//       toast.error(`Cannot change status from ${currentStatus} to ${newStatus}. Order progression must be sequential.`);
//       return false;
//     }

//     // Must move step by step
//     if (newIndex > currentIndex + 1) {
//       const nextStatus = statusFlow[currentIndex + 1];
//       toast.error(`Please mark the order as ${nextStatus} first before moving to ${newStatus}.`);
//       return false;
//     }

//     // Cannot change delivered orders
//     if (currentStatus === 'delivered') {
//       toast.error('This order has been delivered and cannot be modified.');
//       return false;
//     }

//     return true;
//   };

//   // Handle image selection
//   const handleImageSelect = (e) => {
//     const files = Array.from(e.target.files);

//     // Validate file types and size
//     const validFiles = files.filter(file => {
//       if (!file.type.startsWith('image/')) {
//         toast.error(`${file.name} is not an image file`);
//         return false;
//       }
//       if (file.size > 5 * 1024 * 1024) {
//         toast.error(`${file.name} is too large (max 5MB)`);
//         return false;
//       }
//       return true;
//     });

//     if (validFiles.length + selectedImages.length > 5) {
//       toast.error('Maximum 5 images allowed');
//       return;
//     }

//     setSelectedImages(prev => [...prev, ...validFiles]);

//     // Create previews
//     validFiles.forEach(file => {
//       const reader = new FileReader();
//       reader.onload = (e) => {
//         setImagePreviews(prev => [...prev, e.target.result]);
//       };
//       reader.readAsDataURL(file);
//     });
//   };

//   // Remove selected image
//   const removeImage = (index) => {
//     setSelectedImages(prev => prev.filter((_, i) => i !== index));
//     setImagePreviews(prev => prev.filter((_, i) => i !== index));
//   };

//   const handleProductSubmit = async (e) => {
//     e.preventDefault();
//     try {
//       // Validate required fields
//       if (!productForm.name || !productForm.description || !productForm.price || !productForm.originalPrice || !productForm.stock) {
//         toast.error('Please fill all required fields');
//         return;
//       }

//       if (selectedImages.length === 0 && !editingProduct) {
//         toast.error('Please select at least one product image');
//         return;
//       }

//       setUploadingImages(true);

//       const formData = new FormData();
//       formData.append('name', productForm.name);
//       formData.append('description', productForm.description);
//       formData.append('price', productForm.price);
//       formData.append('originalPrice', productForm.originalPrice);
//       formData.append('category', productForm.category);
//       formData.append('subcategory', productForm.subcategory);
//       formData.append('stock', productForm.stock);
//       formData.append('isBestSeller', productForm.isBestSeller);

//       // Append sizes and colors as JSON strings
//       formData.append('sizes', JSON.stringify(productForm.sizes));
//       formData.append('colors', JSON.stringify(productForm.colors));

//       // Append images
//       selectedImages.forEach(image => {
//         formData.append('images', image);
//       });

//       console.log('Submitting product with images...');

//       if (editingProduct) {
//         await axios.put(`http://localhost:5000/api/products/${editingProduct._id}`, productForm);
//         toast.success('Product updated successfully');
//       } else {
//         await axios.post('http://localhost:5000/api/products', formData, {
//           headers: {
//             'Content-Type': 'multipart/form-data'
//           }
//         });
//         toast.success('Product added successfully');
//       }

//       // Reset form
//       setShowProductForm(false);
//       setEditingProduct(null);
//       setProductForm({
//         name: '',
//         description: '',
//         price: '',
//         originalPrice: '',
//         category: 'men',
//         subcategory: 'shirts',
//         stock: '',
//         sizes: ['S', 'M', 'L', 'XL'],
//         colors: ['Black', 'White', 'Blue'],
//         images: [],
//         isBestSeller: false
//       });
//       setSelectedImages([]);
//       setImagePreviews([]);

//       fetchProducts();
//     } catch (error) {
//       console.error('Error saving product:', error);
//       toast.error(error.response?.data?.message || 'Error saving product. Please check the console for details.');
//     } finally {
//       setUploadingImages(false);
//     }
//   };

//   const handleEditProduct = (product) => {
//     setEditingProduct(product);
//     setProductForm({
//       name: product.name,
//       description: product.description,
//       price: product.price.toString(),
//       originalPrice: product.originalPrice.toString(),
//       category: product.category,
//       subcategory: product.subcategory || 'shirts',
//       stock: product.stock.toString(),
//       sizes: product.sizes || ['S', 'M', 'L', 'XL'],
//       colors: product.colors || ['Black', 'White', 'Blue'],
//       images: product.images || [],
//       isBestSeller: product.isBestSeller || false
//     });
//     setImagePreviews(product.images || []);
//     setSelectedImages([]);
//     setShowProductForm(true);
//   };

//   const handleDeleteProduct = async (productId) => {
//     if (window.confirm('Are you sure you want to delete this product?')) {
//       try {
//         await axios.delete(`http://localhost:5000/api/products/${productId}`);
//         toast.success('Product deleted successfully');
//         fetchProducts();
//       } catch (error) {
//         toast.error('Error deleting product');
//       }
//     }
//   };

//   // Update the updateOrderStatus function
//   const updateOrderStatus = async (orderId, newStatus) => {
//     try {
//       const order = orders.find(o => o._id === orderId);

//       if (!order) {
//         toast.error('Order not found');
//         return;
//       }

//       // Validate status change
//       if (!validateOrderStatusChange(order.status, newStatus)) {
//         return;
//       }

//       await axios.put(`http://localhost:5000/api/orders/${orderId}/status`, { status: newStatus });
//       toast.success(`Order status updated to ${newStatus}`);
//       fetchOrders();
//     } catch (error) {
//       console.error('Error updating order status:', error);
//       toast.error('Error updating order status');
//     }
//   };

//   if (!user || user.role !== 'supplier') {
//     return (
//       <div style={{ textAlign: 'center', padding: '2rem' }}>
//         <h2>Access Denied</h2>
//         <p>Only suppliers can access this dashboard.</p>
//       </div>
//     );
//   }

//   if (loading) {
//     return <div style={{ textAlign: 'center', padding: '2rem' }}>Loading...</div>;
//   }

//   return (
//     <div style={{ padding: '2rem', maxWidth: '1200px', margin: '0 auto' }}>
//       <h1>Supplier Dashboard</h1>
//       <p>Welcome, {user?.name}</p>

//       <div style={{ marginBottom: '2rem' }}>
//         <button
//           onClick={() => setShowProductForm(!showProductForm)}
//           className="cta-button"
//         >
//           {showProductForm ? 'Cancel' : 'Add New Product'}
//         </button>
//       </div>

      

//       {showProductForm && (
//         <div style={{
//           background: 'white',
//           padding: '2rem',
//           borderRadius: '10px',
//           marginBottom: '2rem',
//           boxShadow: '0 2px 10px rgba(0,0,0,0.1)'
//         }}>
//           <h2>{editingProduct ? 'Edit Product' : 'Add New Product'}</h2>
//           <form onSubmit={handleProductSubmit}>
//             {/* Product Images Upload Section */}
//             <div className="form-group">
//               <label>Product Images *</label>
//               <div style={{ marginBottom: '1rem' }}>
//                 <input
//                   type="file"
//                   multiple
//                   accept="image/*"
//                   onChange={handleImageSelect}
//                   style={{ marginBottom: '1rem' }}
//                   disabled={uploadingImages}
//                 />
//                 <p style={{ fontSize: '0.9rem', color: '#666', margin: '0' }}>
//                   Select up to 5 images (JPEG, PNG, GIF). Max 5MB per image.
//                 </p>
//               </div>

//               {/* Image Previews */}
//               {(imagePreviews.length > 0 || selectedImages.length > 0) && (
//                 <div style={{ display: 'flex', flexWrap: 'wrap', gap: '1rem', marginBottom: '1rem' }}>
//                   {imagePreviews.map((preview, index) => (
//                     <div key={index} style={{ position: 'relative', width: '100px', height: '100px' }}>
//                       <img
//                         src={preview}
//                         alt={`Preview ${index + 1}`}
//                         style={{
//                           width: '100%',
//                           height: '100%',
//                           objectFit: 'cover',
//                           borderRadius: '8px',
//                           border: '2px solid #e1e8ed'
//                         }}
//                       />
//                       <button
//                         type="button"
//                         onClick={() => removeImage(index)}
//                         style={{
//                           position: 'absolute',
//                           top: '-8px',
//                           right: '-8px',
//                           background: '#ff4757',
//                           color: 'white',
//                           border: 'none',
//                           borderRadius: '50%',
//                           width: '24px',
//                           height: '24px',
//                           cursor: 'pointer',
//                           fontSize: '12px'
//                         }}
//                       >
//                         ×
//                       </button>
//                     </div>
//                   ))}
//                 </div>
//               )}
//             </div>

//             <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '1rem' }}>
//               <div className="form-group">
//                 <label>Product Name *</label>
//                 <input
//                   type="text"
//                   value={productForm.name}
//                   onChange={(e) => setProductForm({ ...productForm, name: e.target.value })}
//                   required
//                   placeholder="Enter product name"
//                 />
//               </div>

//               <div className="form-group">
//                 <label>Category *</label>
//                 <select
//                   value={productForm.category}
//                   onChange={(e) => setProductForm({ ...productForm, category: e.target.value })}
//                   required
//                 >
//                   <option value="men">Men</option>
//                   <option value="women">Women</option>
//                   <option value="children">Children</option>
//                 </select>
//               </div>
//             </div>

            // <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '1rem' }}>
            //   <div className="form-group">
            //     <label>Subcategory *</label>
            //     <select
            //       value={productForm.subcategory}
            //       onChange={(e) => setProductForm({ ...productForm, subcategory: e.target.value })}
            //       required
            //     >
            //       <option value="shirts">Shirts</option>
            //       <option value="pants">Pants</option>
            //       <option value="dresses">Dresses</option>
            //       <option value="shoes">Shoes</option>
            //       <option value="accessories">Accessories</option>
            //     </select>
            //   </div>

            //   <div className="form-group">
            //     <label>Best Seller</label>
            //     <div style={{ marginTop: '0.5rem' }}>
            //       <input
            //         type="checkbox"
            //         checked={productForm.isBestSeller}
            //         onChange={(e) => setProductForm({ ...productForm, isBestSeller: e.target.checked })}
            //         style={{ marginRight: '0.5rem' }}
            //       />
            //       Mark as Best Seller
            //     </div>
            //   </div>
            // </div>

            // <div className="form-group">
            //   <label>Description *</label>
            //   <textarea
            //     value={productForm.description}
            //     onChange={(e) => setProductForm({ ...productForm, description: e.target.value })}
            //     required
            //     style={{ width: '100%', padding: '12px', border: '2px solid #e1e8ed', borderRadius: '8px' }}
            //     rows="3"
            //     placeholder="Enter product description"
            //   />
            // </div>

            // <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr 1fr', gap: '1rem' }}>
            //   <div className="form-group">
            //     <label>Price ($) *</label>
            //     <input
            //       type="number"
            //       step="0.01"
            //       min="0"
            //       value={productForm.price}
            //       onChange={(e) => setProductForm({ ...productForm, price: e.target.value })}
            //       required
            //       placeholder="0.00"
            //     />
            //   </div>

            //   <div className="form-group">
            //     <label>Original Price ($) *</label>
            //     <input
            //       type="number"
            //       step="0.01"
            //       min="0"
            //       value={productForm.originalPrice}
            //       onChange={(e) => setProductForm({ ...productForm, originalPrice: e.target.value })}
            //       required
            //       placeholder="0.00"
            //     />
            //   </div>

            //   <div className="form-group">
            //     <label>Stock *</label>
            //     <input
            //       type="number"
            //       min="0"
            //       value={productForm.stock}
            //       onChange={(e) => setProductForm({ ...productForm, stock: e.target.value })}
            //       required
            //       placeholder="0"
            //     />
            //   </div>
            // </div>

//             <button
//               type="submit"
//               className="submit-btn"
//               style={{ marginTop: '1rem' }}
//               disabled={uploadingImages}
//             >
//               {uploadingImages ? 'Uploading Images...' : (editingProduct ? 'Update Product' : 'Add Product')}
//             </button>
//           </form>
//         </div>
//       )}

//       {/* Rest of the dashboard code remains the same */}
//       <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '2rem' }}>
//         {/* Products Section */}
//         <div>
//           <h2>Your Products ({products.length})</h2>
//           {products.length === 0 ? (
//             <p>No products yet. Add your first product!</p>
//           ) : (
//             products.map(product => (
//               <div key={product._id} style={{
//                 background: 'white',
//                 padding: '1rem',
//                 marginBottom: '1rem',
//                 borderRadius: '8px',
//                 boxShadow: '0 2px 5px rgba(0,0,0,0.1)'
//               }}>
//                 {product.images && product.images.length > 0 && (
//                   <img
//                     src={`http://localhost:5000${product.images[0]}`}
//                     alt={product.name}
//                     style={{
//                       width: '100%',
//                       height: '150px',
//                       objectFit: 'cover',
//                       borderRadius: '8px',
//                       marginBottom: '0.5rem'
//                     }}
//                   />
//                 )}
//                 <h4>{product.name}</h4>
//                 <p>Category: {product.category} | Price: ${product.price} | Stock: {product.stock}</p>
//                 {product.isBestSeller && <span style={{ color: '#ff6b00', fontWeight: 'bold' }}>★ Best Seller</span>}
//                 <div style={{ marginTop: '0.5rem' }}>
//                   <button
//                     onClick={() => handleEditProduct(product)}
//                     style={{
//                       marginRight: '0.5rem',
//                       padding: '0.25rem 0.5rem',
//                       background: '#667eea',
//                       color: 'white',
//                       border: 'none',
//                       borderRadius: '4px',
//                       cursor: 'pointer'
//                     }}
//                   >
//                     Edit
//                   </button>
//                   <button
//                     onClick={() => handleDeleteProduct(product._id)}
//                     style={{
//                       padding: '0.25rem 0.5rem',
//                       background: '#ff4757',
//                       color: 'white',
//                       border: 'none',
//                       borderRadius: '4px',
//                       cursor: 'pointer'
//                     }}
//                   >
//                     Delete
//                   </button>
//                 </div>
//               </div>
//             ))
//           )}
//         </div>

//         {/* // Add this statistics section in the JSX (before the orders section) */}
//         <div style={{
//           background: 'white',
//           padding: '1.5rem',
//           borderRadius: '10px',
//           marginBottom: '2rem',
//           boxShadow: '0 2px 10px rgba(0,0,0,0.1)'
//         }}>
//           <h3>Order Statistics</h3>
//           <div style={{
//             display: 'grid',
//             gridTemplateColumns: 'repeat(auto-fit, minmax(150px, 1fr))',
//             gap: '1rem',
//             marginTop: '1rem'
//           }}>
//             <div style={{ textAlign: 'center', padding: '1rem', background: '#f8f9fa', borderRadius: '8px' }}>
//               <div style={{ fontSize: '2rem', fontWeight: 'bold', color: '#667eea' }}>{orderStats.total}</div>
//               <div style={{ color: '#666' }}>Total Orders</div>
//             </div>
//             <div style={{ textAlign: 'center', padding: '1rem', background: '#fff3cd', borderRadius: '8px' }}>
//               <div style={{ fontSize: '2rem', fontWeight: 'bold', color: '#856404' }}>{orderStats.pending}</div>
//               <div style={{ color: '#666' }}>Pending</div>
//             </div>
//             <div style={{ textAlign: 'center', padding: '1rem', background: '#d1ecf1', borderRadius: '8px' }}>
//               <div style={{ fontSize: '2rem', fontWeight: 'bold', color: '#0c5460' }}>{orderStats.confirmed}</div>
//               <div style={{ color: '#666' }}>Confirmed</div>
//             </div>
//             <div style={{ textAlign: 'center', padding: '1rem', background: '#d4edda', borderRadius: '8px' }}>
//               <div style={{ fontSize: '2rem', fontWeight: 'bold', color: '#155724' }}>{orderStats.packed}</div>
//               <div style={{ color: '#666' }}>Packed</div>
//             </div>
//             <div style={{ textAlign: 'center', padding: '1rem', background: '#cce7ff', borderRadius: '8px' }}>
//               <div style={{ fontSize: '2rem', fontWeight: 'bold', color: '#004085' }}>{orderStats.shipped}</div>
//               <div style={{ color: '#666' }}>Shipped</div>
//             </div>
//             <div style={{ textAlign: 'center', padding: '1rem', background: '#d1f7d1', borderRadius: '8px' }}>
//               <div style={{ fontSize: '2rem', fontWeight: 'bold', color: '#155724' }}>{orderStats.delivered}</div>
//               <div style={{ color: '#666' }}>Delivered</div>
//             </div>
//           </div>
//         </div>

//         {/* Orders Section */}
//         <div>
//           <h2>Orders ({orders.length})</h2>
//           {orders.length === 0 ? (
//             <p>No orders yet.</p>
//           ) : (
//             orders.map(order => (
//               <div key={order._id} style={{
//                 background: 'white',
//                 padding: '1rem',
//                 marginBottom: '1rem',
//                 borderRadius: '8px',
//                 boxShadow: '0 2px 5px rgba(0,0,0,0.1)'
//               }}>
//                 <h4>Order #{order.orderNumber}</h4>
//                 <p>Status:
//                   {/* // In the orders.map section, replace the select dropdown with this: */}
//                   <select
//                     value={order.status}
//                     onChange={(e) => updateOrderStatus(order._id, e.target.value)}
//                     style={{
//                       marginLeft: '0.5rem',
//                       padding: '0.25rem 0.5rem',
//                       border: '1px solid #e1e8ed',
//                       borderRadius: '4px',
//                       background: order.status === 'delivered' ? '#f8f9fa' : 'white',
//                       color: order.status === 'delivered' ? '#666' : '#333'
//                     }}
//                     disabled={order.status === 'delivered'}
//                   >
//                     <option value="pending" disabled={order.status !== 'pending'}>Pending</option>
//                     <option value="confirmed" disabled={order.status !== 'pending' && order.status !== 'confirmed'}>Confirmed</option>
//                     <option value="packed" disabled={order.status !== 'confirmed' && order.status !== 'packed'}>Packed</option>
//                     <option value="shipped" disabled={order.status !== 'packed' && order.status !== 'shipped'}>Shipped</option>
//                     <option value="delivered" disabled={order.status !== 'shipped' && order.status !== 'delivered'}>Delivered</option>
//                   </select>
//                 </p>
//                 <p>Total: ${order.totalAmount}</p>
//                 <p>Customer: {order.customer?.name}</p>
//               </div>
//             ))
//           )}
//         </div>
//       </div>
//     </div>
//   );
// };

// export default SupplierDashboard;


import React, { useState, useEffect } from 'react';
import { useAuth } from '../context/AuthContext';
import axios from 'axios';
import { API_URL, IMAGE_BASE_URL } from '../config';
import { toast } from 'react-toastify';
import SupplierReturnRequests from '../components/SupplierReturnRequests';

const SupplierDashboard = () => {
  const { user } = useAuth();
  const [products, setProducts] = useState([]);
  const [orders, setOrders] = useState([]);
  const [showProductForm, setShowProductForm] = useState(false);
  const [editingProduct, setEditingProduct] = useState(null);
  const [loading, setLoading] = useState(true);
  const [uploadingImages, setUploadingImages] = useState(false);
  const [activeTab, setActiveTab] = useState('orders'); // Default to orders tab
  const [selectedOrder, setSelectedOrder] = useState(null);
  const [orderDetailsModal, setOrderDetailsModal] = useState(false);

  const [customSizes, setCustomSizes] = useState(['S', 'M', 'L', 'XL']);
  const [sizeStock, setSizeStock] = useState({
    'S': 0,
    'M': 0, 
    'L': 0,
    'XL': 0
  });
  const [customColors, setCustomColors] = useState(['Black', 'White', 'Blue']);

  const [earnings, setEarnings] = useState({
    summary: {
      totalEarnings: 0,
      totalOrders: 0,
      pendingEarnings: 0,
      availableEarnings: 0
    },
    monthlyEarnings: []
  });

  const [productForm, setProductForm] = useState({
    name: '',
    description: '',
    price: '',
    originalPrice: '',
    category: 'men',
    subcategory: 'shirts',
    stock: '',
    sizes: ['S', 'M', 'L', 'XL'],
    colors: ['Black', 'White', 'Blue'],
    images: [],
    isBestSeller: false,
    supplierCost: ''
  });

  const [selectedImages, setSelectedImages] = useState([]);
  const [imagePreviews, setImagePreviews] = useState([]);

  // Calculate order stats
  const calculateOrderStats = (orders) => {
    const stats = {
      total: orders.length,
      pending: 0,
      confirmed: 0,
      packed: 0,
      shipped: 0,
      delivered: 0,
      cancelled: 0 
    };

    orders.forEach(order => {
      if (stats.hasOwnProperty(order.status)) {
        stats[order.status]++;
      }
    });

    return stats;
  };

  const [orderStats, setOrderStats] = useState(calculateOrderStats(orders));

  // Status color helper function
  const getStatusColor = (status) => {
    const colors = {
      pending: '#f39c12',
      confirmed: '#3498db',
      packed: '#9b59b6',
      shipped: '#e67e22',
      delivered: '#27ae60',
      cancelled: '#e74c3c'
    };
    return colors[status] || '#95a5a6';
  };

  useEffect(() => {
    if (user && user.role === 'supplier') {
      fetchProducts();
      fetchOrders();
      fetchEarnings();
    }
  }, [user]);

  const fetchEarnings = async () => {
    try {
      const token = localStorage.getItem('token');
      const response = await axios.get(`${API_URL}/orders/supplier/earnings-summary`, {
        headers: { Authorization: `Bearer ${token}` }
      });
      
      if (response.data.summary) {
        setEarnings(response.data);
      } else {
        setEarnings({
          summary: {
            totalEarnings: response.data.totalEarnings || 0,
            totalOrders: response.data.totalOrders || 0,
            pendingEarnings: response.data.pendingEarnings || 0,
            availableEarnings: response.data.availableEarnings || 0
          },
          monthlyEarnings: response.data.monthlyEarnings || []
        });
      }
    } catch (error) {
      console.error('Error fetching earnings:', error);
      toast.error('Failed to load earnings data');
      setEarnings({
        summary: {
          totalEarnings: 0,
          totalOrders: 0,
          pendingEarnings: 0,
          availableEarnings: 0
        },
        monthlyEarnings: []
      });
    }
  };

  const handleOrderClick = (order) => {
    setSelectedOrder(order);
    setOrderDetailsModal(true);
  };

  const fetchProducts = async () => {
    try {
      const response = await axios.get(`${API_URL}/products`);
      const supplierProducts = response.data.products.filter(
        product => product.supplier && product.supplier._id === user.id
      );
      setProducts(supplierProducts);
    } catch (error) {
      console.error('Error fetching products:', error);
      toast.error('Failed to load products');
    } finally {
      setLoading(false);
    }
  };

  const fetchOrders = async () => {
    try {
      const response = await axios.get(`${API_URL}/orders/supplier-orders`);
      setOrders(response.data);
      setOrderStats(calculateOrderStats(response.data));
    } catch (error) {
      console.error('Error fetching orders:', error);
      toast.error('Failed to load orders');
    }
  };

  // Handle image selection
  const handleImageSelect = (e) => {
    const files = Array.from(e.target.files);
    
    const validFiles = files.filter(file => {
      if (!file.type.startsWith('image/')) {
        toast.error(`${file.name} is not an image file`);
        return false;
      }
      if (file.size > 5 * 1024 * 1024) {
        toast.error(`${file.name} is too large (max 5MB)`);
        return false;
      }
      return true;
    });

    if (validFiles.length + selectedImages.length > 5) {
      toast.error('Maximum 5 images allowed');
      return;
    }

    setSelectedImages(prev => [...prev, ...validFiles]);

    validFiles.forEach(file => {
      const reader = new FileReader();
      reader.onload = (e) => {
        setImagePreviews(prev => [...prev, e.target.result]);
      };
      reader.readAsDataURL(file);
    });
  };

  const removeImage = (index) => {
    setSelectedImages(prev => prev.filter((_, i) => i !== index));
    setImagePreviews(prev => prev.filter((_, i) => i !== index));
  };

  const handleProductSubmit = async (e) => {
    e.preventDefault();
    try {
      if (!productForm.name || !productForm.description || !productForm.price || !productForm.originalPrice) {
        toast.error('Please fill all required fields');
        return;
      }

      const hasEmptyStock = customSizes.some(size => {
        const stockValue = sizeStock[size];
        return stockValue === undefined || stockValue === null || stockValue === '';
      });
      
      if (hasEmptyStock) {
        toast.error('Please enter stock for all sizes');
        return;
      }

      if (selectedImages.length === 0 && !editingProduct) {
        toast.error('Please select at least one product image');
        return;
      }

      setUploadingImages(true);

      const formData = new FormData();
      formData.append('name', productForm.name);
      formData.append('description', productForm.description);
      formData.append('price', productForm.price);
      formData.append('originalPrice', productForm.originalPrice);
      formData.append('category', productForm.category);
      formData.append('subcategory', productForm.subcategory);
      formData.append('isBestSeller', productForm.isBestSeller);
      
      formData.append('sizes', JSON.stringify(customSizes));
      formData.append('colors', JSON.stringify(customColors));
      formData.append('sizeStock', JSON.stringify(sizeStock));

      const totalStock = Object.values(sizeStock).reduce((sum, stock) => sum + parseInt(stock || 0), 0);
      formData.append('stock', totalStock.toString());

      selectedImages.forEach(image => {
        formData.append('images', image);
      });

      console.log('Submitting product with data:', {
        name: productForm.name,
        sizes: customSizes,
        colors: customColors,
        sizeStock: sizeStock,
        totalStock: totalStock
      });

      const token = localStorage.getItem('token');
      const config = {
        headers: {
          'Content-Type': 'multipart/form-data',
          'Authorization': `Bearer ${token}`
        }
      };

      if (editingProduct) {
        // await axios.put(`${API_URL}/products/${editingProduct._id}`, formData, config);
        const response = await axios.put(`${API_URL}/products/${editingProduct._id}`, formData, config);
        toast.success('Product updated successfully');
      } else {
        // await axios.post(`${API_URL}/products`, formData, config);
        const response = await axios.post(`${API_URL}/products`, formData, config);
        toast.success('Product added successfully');
      }
      
      setShowProductForm(false);
      setEditingProduct(null);
      setProductForm({
        name: '',
        description: '',
        price: '',
        originalPrice: '',
        category: 'men',
        subcategory: 'shirts',
        stock: '',
        sizes: ['S', 'M', 'L', 'XL'],
        colors: ['Black', 'White', 'Blue'],
        images: [],
        isBestSeller: false
      });
      setCustomSizes(['S', 'M', 'L', 'XL']);
      setCustomColors(['Black', 'White', 'Blue']);
      setSizeStock({
        'S': 0,
        'M': 0, 
        'L': 0,
        'XL': 0
      });
      setSelectedImages([]);
      setImagePreviews([]);
      
      fetchProducts();
    } catch (error) {
      console.error('Error saving product:', error);
      // toast.error(error.response?.data?.message || 'Error saving product. Please check the console for details.');
      const errorMessage = error.response?.data?.message || error.response?.data?.error || 'Error saving product';
      toast.error(errorMessage);
    } finally {
      setUploadingImages(false);
    }
  };

  const handleEditProduct = (product) => {
    console.log('Editing product:', product);
    console.log('Product sizes:', product.sizes);
    console.log('Product colors:', product.colors);
    console.log('Product sizeStock:', product.sizeStock);

    setEditingProduct(product);
    
    let productSizes = ['S', 'M', 'L', 'XL'];
    let productColors = ['Black', 'White', 'Blue'];
    
    try {
      if (product.sizes) {
        if (typeof product.sizes === 'string') {
          productSizes = JSON.parse(product.sizes);
        } else if (Array.isArray(product.sizes)) {
          productSizes = product.sizes;
        }
      }
      
      if (product.colors) {
        if (typeof product.colors === 'string') {
          productColors = JSON.parse(product.colors);
        } else if (Array.isArray(product.colors)) {
          productColors = product.colors;
        }
      }
    } catch (error) {
      console.error('Error parsing sizes/colors:', error);
    }

    const initialSizeStock = {};
    
    try {
      if (product.sizeStock) {
        if (typeof product.sizeStock === 'string') {
          const parsedSizeStock = JSON.parse(product.sizeStock);
          productSizes.forEach(size => {
            initialSizeStock[size] = parsedSizeStock[size] || 0;
          });
        } else if (typeof product.sizeStock === 'object') {
          productSizes.forEach(size => {
            initialSizeStock[size] = product.sizeStock[size] || 0;
          });
        }
      } else {
        productSizes.forEach(size => {
          initialSizeStock[size] = product.stock || 0;
        });
      }
    } catch (error) {
      console.error('Error parsing sizeStock:', error);
      productSizes.forEach(size => {
        initialSizeStock[size] = product.stock || 0;
      });
    }

    console.log('Processed sizes:', productSizes);
    console.log('Processed colors:', productColors);
    console.log('Processed sizeStock:', initialSizeStock);

    setCustomSizes(productSizes);
    setCustomColors(productColors);
    setSizeStock(initialSizeStock);
    
    setProductForm({
      name: product.name,
      description: product.description,
      price: product.price.toString(),
      originalPrice: product.originalPrice.toString(),
      category: product.category,
      subcategory: product.subcategory || 'shirts',
      stock: product.stock.toString(),
      sizes: productSizes,
      colors: productColors,
      images: product.images || [],
      isBestSeller: product.isBestSeller || false,
      supplierCost: product.supplierCost ? product.supplierCost.toString() : '0.00'
    });
    
    setImagePreviews(product.images ? product.images.map(img => `${IMAGE_BASE_URL}${img}`) : []);
    setSelectedImages([]);
    setShowProductForm(true);
  };

  const handleDeleteProduct = async (productId) => {
    if (window.confirm('Are you sure you want to delete this product?')) {
      try {
        await axios.delete(`${API_URL}/products/${productId}`);
        toast.success('Product deleted successfully');
        fetchProducts();
      } catch (error) {
        toast.error('Error deleting product');
      }
    }
  };

  const validateOrderStatusChange = (currentStatus, newStatus) => {
    const statusFlow = ['pending', 'confirmed', 'packed', 'shipped', 'delivered'];
    const currentIndex = statusFlow.indexOf(currentStatus);
    const newIndex = statusFlow.indexOf(newStatus);

    if (newIndex < currentIndex) {
      toast.error(`Cannot change status from ${currentStatus} to ${newStatus}. Order progression must be sequential.`);
      return false;
    }

    if (newIndex > currentIndex + 1) {
      const nextStatus = statusFlow[currentIndex + 1];
      toast.error(`Please mark the order as ${nextStatus} first before moving to ${newStatus}.`);
      return false;
    }

    if (currentStatus === 'delivered') {
      toast.error('This order has been delivered and cannot be modified.');
      return false;
    }

    return true;
  };

  const updateOrderStatus = async (orderId, newStatus) => {
    try {
      const order = orders.find(o => o._id === orderId);
      
      if (!order) {
        toast.error('Order not found');
        return;
      }

      if (!validateOrderStatusChange(order.status, newStatus)) {
        return;
      }

      // Get the token from localStorage
      const token = localStorage.getItem('token');
      console.log('Updating order status - Token:', token); // Debug line

      if (!token) {
        toast.error('Please login again');
        return;
      }

      const response = await axios.put(
        `${API_URL}/orders/${orderId}/status`, 
        { status: newStatus },
        {
          headers: {
            'Authorization': `Bearer ${token}`,
            'Content-Type': 'application/json'
          }
        }
      );

      toast.success(`Order status updated to ${newStatus}`);
      fetchOrders(); // Refresh the orders list
      
    } catch (error) {
      console.error('Error updating order status:', error);
      
      if (error.response?.status === 401) {
        toast.error('Session expired. Please login again.');
        localStorage.removeItem('token');
        window.location.href = '/login';
      } else {
        toast.error(error.response?.data?.message || 'Error updating order status');
      }
    }
  };

  if (!user || user.role !== 'supplier') {
    return (
      <div style={{ textAlign: 'center', padding: '2rem' }}>
        <h2>Access Denied</h2>
        <p>Only suppliers can access this dashboard.</p>
      </div>
    );
  }

  if (loading) {
    return <div style={{ textAlign: 'center', padding: '2rem' }}>Loading...</div>;
  }

  return (
    <div style={{ padding: '2rem', maxWidth: '1200px', margin: '0 auto' }}>
      <h1>Supplier Dashboard</h1>
      <p>Welcome, {user?.name}</p>

      {/* Tab Navigation */}
      <div style={{ borderBottom: '1px solid #e1e8ed', marginBottom: '2rem' }}>
        <div style={{ display: 'flex', gap: '0' }}>
          <button
            onClick={() => setActiveTab('orders')}
            style={{
              padding: '1rem 2rem',
              background: activeTab === 'orders' ? '#3498db' : 'transparent',
              color: activeTab === 'orders' ? 'white' : '#333',
              border: 'none',
              borderBottom: activeTab === 'orders' ? '3px solid #3498db' : '3px solid transparent',
              cursor: 'pointer',
              fontWeight: '600'
            }}
          >
            Orders
          </button>
          <button
            onClick={() => setActiveTab('returns')}
            style={{
              padding: '1rem 2rem',
              background: activeTab === 'returns' ? '#3498db' : 'transparent',
              color: activeTab === 'returns' ? 'white' : '#333',
              border: 'none',
              borderBottom: activeTab === 'returns' ? '3px solid #3498db' : '3px solid transparent',
              cursor: 'pointer',
              fontWeight: '600'
            }}
          >
            Return Requests
          </button>
          <button
            onClick={() => setActiveTab('earnings')}
            style={{
              padding: '1rem 2rem',
              background: activeTab === 'earnings' ? '#3498db' : 'transparent',
              color: activeTab === 'earnings' ? 'white' : '#333',
              border: 'none',
              borderBottom: activeTab === 'earnings' ? '3px solid #3498db' : '3px solid transparent',
              cursor: 'pointer',
              fontWeight: '600'
            }}
          >
            Earnings
          </button>
          <button
            onClick={() => setActiveTab('products')}
            style={{
              padding: '1rem 2rem',
              background: activeTab === 'products' ? '#3498db' : 'transparent',
              color: activeTab === 'products' ? 'white' : '#333',
              border: 'none',
              borderBottom: activeTab === 'products' ? '3px solid #3498db' : '3px solid transparent',
              cursor: 'pointer',
              fontWeight: '600'
            }}
          >
            Products
          </button>
        </div>
      </div>

      {/* Order Details Modal */}
      {orderDetailsModal && selectedOrder && (
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
          zIndex: 1000,
          padding: '2rem'
        }}>
          <div style={{
            background: 'white',
            padding: '2rem',
            borderRadius: '10px',
            width: '90%',
            maxWidth: '800px',
            maxHeight: '80vh',
            overflowY: 'auto',
            boxShadow: '0 10px 30px rgba(0,0,0,0.3)'
          }}>
            {/* Modal Header */}
            <div style={{
              display: 'flex',
              justifyContent: 'space-between',
              alignItems: 'center',
              marginBottom: '1.5rem',
              paddingBottom: '1rem',
              borderBottom: '2px solid #e1e8ed'
            }}>
              <div>
                <h2 style={{ margin: 0, color: '#333' }}>Order Details</h2>
                <p style={{ margin: '0.5rem 0 0 0', color: '#666' }}>
                  #{selectedOrder.orderNumber}
                </p>
              </div>
              <button
                onClick={() => setOrderDetailsModal(false)}
                style={{
                  background: 'transparent',
                  border: 'none',
                  fontSize: '1.5rem',
                  cursor: 'pointer',
                  color: '#666',
                  padding: '0.5rem'
                }}
              >
                ×
              </button>
            </div>

            {/* Order Information */}
            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '2rem', marginBottom: '2rem' }}>
              <div>
                <h3 style={{ color: '#667eea', marginBottom: '1rem' }}>Customer Information</h3>
                <div style={{ background: '#f8f9fa', padding: '1rem', borderRadius: '8px' }}>
                  <p style={{ margin: '0.5rem 0' }}>
                    <strong>Name:</strong> {selectedOrder.customer?.name || 'N/A'}
                  </p>
                  <p style={{ margin: '0.5rem 0' }}>
                    <strong>Email:</strong> {selectedOrder.customer?.email || 'N/A'}
                  </p>
                  <p style={{ margin: '0.5rem 0' }}>
                    <strong>Phone:</strong> {selectedOrder.customer?.phone || 'N/A'}
                  </p>
                  <p style={{ margin: '0.5rem 0' }}>
                    <strong>Order Date:</strong> {new Date(selectedOrder.createdAt).toLocaleDateString()}
                  </p>
                </div>
              </div>

              <div>
                <h3 style={{ color: '#667eea', marginBottom: '1rem' }}>Order Summary</h3>
                <div style={{ background: '#f8f9fa', padding: '1rem', borderRadius: '8px' }}>
                  <p style={{ margin: '0.5rem 0' }}>
                    <strong>Status:</strong> 
                    <span style={{
                      display: 'inline-block',
                      padding: '0.25rem 0.75rem',
                      background: getStatusColor(selectedOrder.status),
                      color: 'white',
                      borderRadius: '20px',
                      fontSize: '0.8rem',
                      fontWeight: 'bold',
                      marginLeft: '0.5rem',
                      textTransform: 'capitalize'
                    }}>
                      {selectedOrder.status}
                    </span>
                  </p>
                  <p style={{ margin: '0.5rem 0' }}>
                    <strong>Total Amount:</strong> ${selectedOrder.totalAmount}
                  </p>
                  {selectedOrder.expectedDelivery && (
                    <p style={{ margin: '0.5rem 0' }}>
                      <strong>Expected Delivery:</strong> {new Date(selectedOrder.expectedDelivery).toLocaleDateString()}
                    </p>
                  )}
                  {selectedOrder.deliveredAt && (
                    <p style={{ margin: '0.5rem 0' }}>
                      <strong>Delivered On:</strong> {new Date(selectedOrder.deliveredAt).toLocaleDateString()}
                    </p>
                  )}
                </div>
              </div>
            </div>

            {/* Shipping Address */}
            {selectedOrder.shippingAddress && (
              <div style={{ marginBottom: '2rem' }}>
                <h3 style={{ color: '#667eea', marginBottom: '1rem' }}>Shipping Address</h3>
                <div style={{ background: '#f8f9fa', padding: '1rem', borderRadius: '8px' }}>
                  <p style={{ margin: '0.5rem 0' }}>
                    <strong>Address:</strong> {selectedOrder.shippingAddress.street}
                  </p>
                  <p style={{ margin: '0.5rem 0' }}>
                    <strong>City:</strong> {selectedOrder.shippingAddress.city}
                  </p>
                  <p style={{ margin: '0.5rem 0' }}>
                    <strong>State:</strong> {selectedOrder.shippingAddress.state}
                  </p>
                  <p style={{ margin: '0.5rem 0' }}>
                    <strong>ZIP Code:</strong> {selectedOrder.shippingAddress.zipCode}
                  </p>
                  <p style={{ margin: '0.5rem 0' }}>
                    <strong>Country:</strong> {selectedOrder.shippingAddress.country}
                  </p>
                </div>
              </div>
            )}

            {/* Order Items */}
            <div style={{ marginBottom: '2rem' }}>
              <h3 style={{ color: '#667eea', marginBottom: '1rem' }}>Order Items</h3>
              <div style={{ display: 'flex', flexDirection: 'column', gap: '1rem' }}>
                {selectedOrder.items.map((item, index) => (
                  <div key={index} style={{
                    display: 'flex',
                    alignItems: 'center',
                    padding: '1rem',
                    background: 'white',
                    border: '2px solid #e1e8ed',
                    borderRadius: '8px',
                    gap: '1rem'
                  }}>
                    <img
                      src={item.product?.images?.[0] ? `${IMAGE_BASE_URL}${item.product.images[0]}` : 'https://via.placeholder.com/80x80?text=No+Image'}
                      alt={item.product?.name}
                      style={{
                        width: '80px',
                        height: '80px',
                        objectFit: 'cover',
                        borderRadius: '8px'
                      }}
                    />
                    <div style={{ flex: 1 }}>
                      <h4 style={{ margin: '0 0 0.5rem 0', color: '#333' }}>
                        {item.product?.name || 'Product not available'}
                      </h4>
                      <div style={{ display: 'flex', flexWrap: 'wrap', gap: '1rem', fontSize: '0.9rem', color: '#666' }}>
                        <span><strong>Quantity:</strong> {item.quantity}</span>
                        <span><strong>Price:</strong> ${item.product?.price || item.price}</span>
                        {item.size && <span><strong>Size:</strong> {item.size}</span>}
                        {item.color && <span><strong>Color:</strong> {item.color}</span>}
                        {item.supplierEarnings > 0 && (
                          <span style={{ color: '#27ae60', fontWeight: 'bold' }}>
                            <strong>Your Earnings:</strong> ${item.supplierEarnings.toFixed(2)}
                          </span>
                        )}
                      </div>
                    </div>
                    <div style={{ textAlign: 'right' }}>
                      <div style={{ fontSize: '1.2rem', fontWeight: 'bold', color: '#333' }}>
                        ${((item.product?.price || item.price) * item.quantity).toFixed(2)}
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            </div>

            {/* Order Tracking */}
            {selectedOrder.tracking && selectedOrder.tracking.length > 0 && (
              <div>
                <h3 style={{ color: '#667eea', marginBottom: '1rem' }}>Order Tracking</h3>
                <div style={{ display: 'flex', flexDirection: 'column', gap: '0.5rem' }}>
                  {selectedOrder.tracking.map((track, index) => (
                    <div key={index} style={{
                      padding: '1rem',
                      background: '#f8f9fa',
                      borderLeft: `4px solid ${getStatusColor(track.status)}`,
                      borderRadius: '4px'
                    }}>
                      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                        <div>
                          <strong style={{ textTransform: 'capitalize' }}>
                            {track.status}
                          </strong>
                          <p style={{ margin: '0.25rem 0 0 0', color: '#666' }}>
                            {track.description}
                          </p>
                        </div>
                        <div style={{ color: '#999', fontSize: '0.8rem' }}>
                          {new Date(track.timestamp).toLocaleString()}
                        </div>
                      </div>
                      {track.trackingNumber && (
                        <div style={{ marginTop: '0.5rem', padding: '0.5rem', background: '#e8f4fd', borderRadius: '4px' }}>
                          <strong>Tracking:</strong> {track.trackingNumber} 
                          {track.carrier && ` via ${track.carrier}`}
                          {track.estimatedDelivery && ` • Est. Delivery: ${new Date(track.estimatedDelivery).toLocaleDateString()}`}
                        </div>
                      )}
                    </div>
                  ))}
                </div>
              </div>
            )}

            {/* Modal Footer */}
            <div style={{
              marginTop: '2rem',
              paddingTop: '1rem',
              borderTop: '2px solid #e1e8ed',
              display: 'flex',
              justifyContent: 'flex-end',
              gap: '1rem'
            }}>
              <button
                onClick={() => setOrderDetailsModal(false)}
                style={{
                  padding: '0.75rem 1.5rem',
                  background: '#667eea',
                  color: 'white',
                  border: 'none',
                  borderRadius: '8px',
                  cursor: 'pointer',
                  fontWeight: '600'
                }}
              >
                Close
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Orders Tab Content */}
      {activeTab === 'orders' && (
        <div>
          {/* Order Stats */}
          <div style={{ 
            display: 'grid', 
            gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))', 
            gap: '1rem',
            marginBottom: '2rem'
          }}>
            <div style={{ background: '#e8f4fd', padding: '1rem', borderRadius: '8px', textAlign: 'center' }}>
              <h3 style={{ margin: '0', color: '#3498db' }}>Total</h3>
              <p style={{ fontSize: '2rem', fontWeight: 'bold', margin: '0.5rem 0 0 0' }}>{orderStats.total}</p>
            </div>
            <div style={{ background: '#fff8e1', padding: '1rem', borderRadius: '8px', textAlign: 'center' }}>
              <h3 style={{ margin: '0', color: '#f39c12' }}>Pending</h3>
              <p style={{ fontSize: '2rem', fontWeight: 'bold', margin: '0.5rem 0 0 0' }}>{orderStats.pending}</p>
            </div>
            <div style={{ background: '#e8f4fd', padding: '1rem', borderRadius: '8px', textAlign: 'center' }}>
              <h3 style={{ margin: '0', color: '#3498db' }}>Confirmed</h3>
              <p style={{ fontSize: '2rem', fontWeight: 'bold', margin: '0.5rem 0 0 0' }}>{orderStats.confirmed}</p>
            </div>
            <div style={{ background: '#f3e8fd', padding: '1rem', borderRadius: '8px', textAlign: 'center' }}>
              <h3 style={{ margin: '0', color: '#9b59b6' }}>Packed</h3>
              <p style={{ fontSize: '2rem', fontWeight: 'bold', margin: '0.5rem 0 0 0' }}>{orderStats.packed}</p>
            </div>
            <div style={{ background: '#ffe8d9', padding: '1rem', borderRadius: '8px', textAlign: 'center' }}>
              <h3 style={{ margin: '0', color: '#e67e22' }}>Shipped</h3>
              <p style={{ fontSize: '2rem', fontWeight: 'bold', margin: '0.5rem 0 0 0' }}>{orderStats.shipped}</p>
            </div>
            <div style={{ background: '#e8f8ef', padding: '1rem', borderRadius: '8px', textAlign: 'center' }}>
              <h3 style={{ margin: '0', color: '#27ae60' }}>Delivered</h3>
              <p style={{ fontSize: '2rem', fontWeight: 'bold', margin: '0.5rem 0 0 0' }}>{orderStats.delivered}</p>
            </div>
          </div>

          {/* Orders List */}
          <div>
            <h2>Orders ({orders.length})</h2>
            {orders.length === 0 ? (
              <p>No orders yet.</p>
            ) : (
              orders.map(order => (
                <div key={order._id} style={{
                  background: 'white',
                  padding: '1rem',
                  marginBottom: '1rem',
                  borderRadius: '8px',
                  boxShadow: '0 2px 5px rgba(0,0,0,0.1)',
                  borderLeft: order.status === 'cancelled' ? '4px solid #e74c3c' : 'none',
                  cursor: 'pointer',
                  transition: 'all 0.3s ease'
                }}
                onClick={() => handleOrderClick(order)}
                onMouseOver={(e) => {
                  e.currentTarget.style.transform = 'translateY(-2px)';
                  e.currentTarget.style.boxShadow = '0 4px 15px rgba(0,0,0,0.15)';
                }}
                onMouseOut={(e) => {
                  e.currentTarget.style.transform = 'translateY(0)';
                  e.currentTarget.style.boxShadow = '0 2px 5px rgba(0,0,0,0.1)';
                }}
                >
                  <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start' }}>
                    <div>
                      <h4 style={{ 
                        margin: '0 0 0.5rem 0', 
                        color: order.status === 'cancelled' ? '#e74c3c' : '#333',
                        textDecoration: 'underline'
                      }}>
                        Order #{order.orderNumber}
                        {order.status === 'cancelled' && (
                          <span style={{ 
                            background: '#e74c3c', 
                            color: 'white', 
                            padding: '0.25rem 0.5rem', 
                            borderRadius: '4px', 
                            fontSize: '0.8rem',
                            marginLeft: '0.5rem'
                          }}>
                            CANCELLED
                          </span>
                        )}
                      </h4>
                      <p style={{ margin: '0.25rem 0', color: '#666' }}>
                        Customer: {order.customer?.name}
                      </p>
                      <p style={{ margin: '0.25rem 0', color: '#666' }}>
                        Date: {new Date(order.createdAt).toLocaleDateString()}
                      </p>
                      {order.status === 'cancelled' && order.cancelReason && (
                        <p style={{ margin: '0.25rem 0', color: '#e74c3c', fontStyle: 'italic' }}>
                          Reason: {order.cancelReason}
                        </p>
                      )}
                    </div>
                    <div style={{ textAlign: 'right' }}>
                      <p style={{ margin: '0 0 0.5rem 0', fontWeight: 'bold' }}>
                        Total: ${order.totalAmount}
                      </p>
                      {order.status !== 'cancelled' ? (
                        <select
                          value={order.status}
                          onChange={(e) => updateOrderStatus(order._id, e.target.value)}
                          style={{ 
                            padding: '0.25rem 0.5rem',
                            border: '1px solid #e1e8ed',
                            borderRadius: '4px',
                            background: order.status === 'delivered' ? '#f8f9fa' : 'white',
                            color: order.status === 'delivered' ? '#666' : '#333'
                          }}
                          disabled={order.status === 'delivered'}
                          onClick={(e) => e.stopPropagation()}
                        >
                          <option value="pending" disabled={order.status !== 'pending'}>Pending</option>
                          <option value="confirmed" disabled={order.status !== 'pending' && order.status !== 'confirmed'}>Confirmed</option>
                          <option value="packed" disabled={order.status !== 'confirmed' && order.status !== 'packed'}>Packed</option>
                          <option value="shipped" disabled={order.status !== 'packed' && order.status !== 'shipped'}>Shipped</option>
                          <option value="delivered" disabled={order.status !== 'shipped' && order.status !== 'delivered'}>Delivered</option>
                        </select>
                      ) : (
                        <div style={{ 
                          background: '#e74c3c', 
                          color: 'white', 
                          padding: '0.25rem 0.75rem', 
                          borderRadius: '4px',
                          fontSize: '0.9rem'
                        }}>
                          Cancelled
                        </div>
                      )}
                    </div>
                  </div>
                </div>
              ))
            )}
          </div>
        </div>
      )}

      {/* Returns Tab Content */}
      {activeTab === 'returns' && (
        <SupplierReturnRequests />
      )}

      {/* Earnings Tab Content */}
      {activeTab === 'earnings' && (
        <div>
          {/* Earnings Summary Cards */}
          <div style={{ 
            display: 'grid', 
            gridTemplateColumns: 'repeat(auto-fit, minmax(250px, 1fr))', 
            gap: '1.5rem',
            marginBottom: '2rem'
          }}>
            <div style={{
              background: 'linear-gradient(135deg, #667eea 0%, #764ba2 100%)',
              color: 'white',
              padding: '1.5rem',
              borderRadius: '10px',
              boxShadow: '0 4px 15px rgba(0,0,0,0.1)'
            }}>
              <h3 style={{ margin: '0 0 1rem 0', fontSize: '1rem', opacity: 0.9 }}>Total Earnings</h3>
              <div style={{ fontSize: '2rem', fontWeight: 'bold' }}>
                ${earnings.summary.totalEarnings?.toFixed(2) || '0.00'}
              </div>
              <p style={{ margin: '0.5rem 0 0 0', opacity: 0.8, fontSize: '0.9rem' }}>
                From {earnings.summary.totalOrders} orders
              </p>
            </div>

            <div style={{
              background: 'linear-gradient(135deg, #f093fb 0%, #f5576c 100%)',
              color: 'white',
              padding: '1.5rem',
              borderRadius: '10px',
              boxShadow: '0 4px 15px rgba(0,0,0,0.1)'
            }}>
              <h3 style={{ margin: '0 0 1rem 0', fontSize: '1rem', opacity: 0.9 }}>Available Balance</h3>
              <div style={{ fontSize: '2rem', fontWeight: 'bold' }}>
                ${earnings.summary.availableEarnings?.toFixed(2) || '0.00'}
              </div>
              <p style={{ margin: '0.5rem 0 0 0', opacity: 0.8, fontSize: '0.9rem' }}>
                From delivered orders
              </p>
            </div>

            <div style={{
              background: 'linear-gradient(135deg, #4facfe 0%, #00f2fe 100%)',
              color: 'white',
              padding: '1.5rem',
              borderRadius: '10px',
              boxShadow: '0 4px 15px rgba(0,0,0,0.1)'
            }}>
              <h3 style={{ margin: '0 0 1rem 0', fontSize: '1rem', opacity: 0.9 }}>Pending Clearance</h3>
              <div style={{ fontSize: '2rem', fontWeight: 'bold' }}>
                ${earnings.summary.pendingEarnings?.toFixed(2) || '0.00'}
              </div>
              <p style={{ margin: '0.5rem 0 0 0', opacity: 0.8, fontSize: '0.9rem' }}>
                From active orders
              </p>
            </div>
          </div>

          {/* Monthly Earnings Chart */}
          <div style={{
            background: 'white',
            padding: '1.5rem',
            borderRadius: '10px',
            boxShadow: '0 2px 10px rgba(0,0,0,0.1)',
            marginBottom: '2rem'
          }}>
            <h3>Monthly Earnings</h3>
            {earnings.monthlyEarnings.length === 0 ? (
              <p style={{ textAlign: 'center', padding: '2rem', color: '#666' }}>
                No earnings data available yet
              </p>
            ) : (
              <div style={{ display: 'grid', gap: '1rem' }}>
                {earnings.monthlyEarnings.map((month, index) => {
                  const monthNames = ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec'];
                  const monthName = monthNames[month._id.month - 1];
                  const year = month._id.year;
                  
                  return (
                    <div key={index} style={{
                      display: 'flex',
                      justifyContent: 'space-between',
                      alignItems: 'center',
                      padding: '1rem',
                      background: '#f8f9fa',
                      borderRadius: '8px'
                    }}>
                      <div>
                        <strong>{monthName} {year}</strong>
                        <div style={{ fontSize: '0.9rem', color: '#666' }}>
                          {month.orders} order{month.orders !== 1 ? 's' : ''}
                        </div>
                      </div>
                      <div style={{ fontSize: '1.2rem', fontWeight: 'bold', color: '#27ae60' }}>
                        ${month.earnings.toFixed(2)}
                      </div>
                    </div>
                  );
                })}
              </div>
            )}
          </div>

          {/* Recent Orders with Earnings */}
          <div style={{
            background: 'white',
            padding: '1.5rem',
            borderRadius: '10px',
            boxShadow: '0 2px 10px rgba(0,0,0,0.1)'
          }}>
            <h3>Recent Orders with Earnings</h3>
            {orders.filter(order => 
              order.items.some(item => item.supplierEarnings > 0)
            ).length === 0 ? (
              <p style={{ textAlign: 'center', padding: '2rem', color: '#666' }}>
                No orders with earnings yet
              </p>
            ) : (
              <div style={{ display: 'grid', gap: '1rem' }}>
                {orders
                  .filter(order => order.items.some(item => item.supplierEarnings > 0))
                  .slice(0, 10)
                  .map(order => {
                    const orderEarnings = order.items.reduce((total, item) => total + (item.supplierEarnings || 0), 0);
                    
                    return (
                      <div key={order._id} style={{
                        display: 'flex',
                        justifyContent: 'space-between',
                        alignItems: 'center',
                        padding: '1rem',
                        border: '1px solid #e1e8ed',
                        borderRadius: '8px',
                        cursor: 'pointer'
                      }}
                      onClick={() => handleOrderClick(order)}
                      >
                        <div>
                          <strong>Order #{order.orderNumber}</strong>
                          <div style={{ fontSize: '0.9rem', color: '#666' }}>
                            {new Date(order.createdAt).toLocaleDateString()} • {order.customer?.name}
                          </div>
                        </div>
                        <div style={{ textAlign: 'right' }}>
                          <div style={{ fontSize: '1.2rem', fontWeight: 'bold', color: '#27ae60' }}>
                            +${orderEarnings.toFixed(2)}
                          </div>
                          <div style={{ fontSize: '0.9rem', color: '#666' }}>
                            Total: ${order.totalAmount}
                          </div>
                        </div>
                      </div>
                    );
                  })}
              </div>
            )}
          </div>
        </div>
      )}

      {/* Products Tab Content */}
      {activeTab === 'products' && (
        <div>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '2rem' }}>
            <h2>My Products ({products.length})</h2>
            <button
              onClick={() => {
                setEditingProduct(null);
                setProductForm({
                  name: '',
                  description: '',
                  price: '',
                  originalPrice: '',
                  category: 'men',
                  subcategory: 'shirts',
                  stock: '',
                  sizes: ['S', 'M', 'L', 'XL'],
                  colors: ['Black', 'White', 'Blue'],
                  images: [],
                  isBestSeller: false,
                  supplierCost: ''
                });
                setCustomSizes(['S', 'M', 'L', 'XL']);
                setCustomColors(['Black', 'White', 'Blue']);
                setSizeStock({
                  'S': 0,
                  'M': 0, 
                  'L': 0,
                  'XL': 0
                });
                setSelectedImages([]);
                setImagePreviews([]);
                setShowProductForm(true);
              }}
              style={{
                padding: '0.75rem 1.5rem',
                background: '#3498db',
                color: 'white',
                border: 'none',
                borderRadius: '8px',
                cursor: 'pointer',
                fontWeight: '600'
              }}
            >
              Add New Product
            </button>
          </div>

          {showProductForm && (
            <div style={{
              background: 'white',
              padding: '2rem',
              borderRadius: '10px',
              boxShadow: '0 2px 10px rgba(0,0,0,0.1)',
              marginBottom: '2rem'
            }}>
              <h3>{editingProduct ? 'Edit Product' : 'Add New Product'}</h3>
              <form onSubmit={handleProductSubmit}>
                <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '1rem', marginBottom: '1rem' }}>
                  <div>
                    <label style={{ display: 'block', marginBottom: '0.5rem', fontWeight: 'bold' }}>Product Name *</label>
                    <input
                      type="text"
                      value={productForm.name}
                      onChange={(e) => setProductForm({...productForm, name: e.target.value})}
                      style={{ width: '100%', padding: '0.75rem', border: '1px solid #e1e8ed', borderRadius: '4px' }}
                      required
                    />
                  </div>
                  <div>
                    <label style={{ display: 'block', marginBottom: '0.5rem', fontWeight: 'bold' }}>Price *</label>
                    <input
                      type="number"
                      step="0.01"
                      value={productForm.price}
                      onChange={(e) => setProductForm({...productForm, price: e.target.value})}
                      style={{ width: '100%', padding: '0.75rem', border: '1px solid #e1e8ed', borderRadius: '4px' }}
                      required
                    />
                  </div>
                </div>

                <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '1rem', marginBottom: '1rem' }}>
                  <div>
                    <label style={{ display: 'block', marginBottom: '0.5rem', fontWeight: 'bold' }}>Original Price *</label>
                    <input
                      type="number"
                      step="0.01"
                      value={productForm.originalPrice}
                      onChange={(e) => setProductForm({...productForm, originalPrice: e.target.value})}
                      style={{ width: '100%', padding: '0.75rem', border: '1px solid #e1e8ed', borderRadius: '4px' }}
                      required
                    />
                  </div>
                  <div>
                    <label style={{ display: 'block', marginBottom: '0.5rem', fontWeight: 'bold' }}>Supplier Cost</label>
                    <input
                      type="number"
                      step="0.01"
                      value={productForm.supplierCost}
                      onChange={(e) => setProductForm({...productForm, supplierCost: e.target.value})}
                      style={{ width: '100%', padding: '0.75rem', border: '1px solid #e1e8ed', borderRadius: '4px' }}
                      placeholder="0.00"
                    />
                  </div>
                </div>

                <div style={{ marginBottom: '1rem' }}>
                  <label style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', fontWeight: 'bold' }}>
                    <input
                      type="checkbox"
                      checked={productForm.isBestSeller}
                      onChange={(e) => setProductForm({...productForm, isBestSeller: e.target.checked})}
                      style={{ width: '18px', height: '18px' }}
                    />
                    Mark as Best Seller
                  </label>
                </div>

                <div style={{ marginBottom: '1rem' }}>
                  <label style={{ display: 'block', marginBottom: '0.5rem', fontWeight: 'bold' }}>Description *</label>
                  <textarea
                    value={productForm.description}
                    onChange={(e) => setProductForm({...productForm, description: e.target.value})}
                    style={{ width: '100%', padding: '0.75rem', border: '1px solid #e1e8ed', borderRadius: '4px', minHeight: '100px' }}
                    required
                  />
                </div>

                <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '1rem', marginBottom: '1rem' }}>
                  <div>
                    <label style={{ display: 'block', marginBottom: '0.5rem', fontWeight: 'bold' }}>Category</label>
                    <select
                      value={productForm.category}
                      onChange={(e) => setProductForm({...productForm, category: e.target.value})}
                      style={{ width: '100%', padding: '0.75rem', border: '1px solid #e1e8ed', borderRadius: '4px' }}
                    >
                      <option value="men">Men</option>
                      <option value="women">Women</option>
                      <option value="kids">Kids</option>
                    </select>
                  </div>
                  <div>
                    <label style={{ display: 'block', marginBottom: '0.5rem', fontWeight: 'bold' }}>Subcategory</label>
                    <select
                      value={productForm.subcategory}
                      onChange={(e) => setProductForm({...productForm, subcategory: e.target.value})}
                      style={{ width: '100%', padding: '0.75rem', border: '1px solid #e1e8ed', borderRadius: '4px' }}
                    >
                      <option value="shirts">Shirts</option>
                      <option value="pants">Pants</option>
                      <option value="shoes">Shoes</option>
                      <option value="accessories">Accessories</option>
                    </select>
                  </div>
                </div>

                {/* Sizes and Stock Management */}
                <div style={{ marginBottom: '1rem' }}>
                  <label style={{ display: 'block', marginBottom: '0.5rem', fontWeight: 'bold' }}>Sizes & Stock</label>
                  <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(100px, 1fr))', gap: '1rem' }}>
                    {customSizes.map((size, index) => (
                      <div key={index}>
                        <label style={{ display: 'block', marginBottom: '0.25rem', fontSize: '0.9rem' }}>Size {size}</label>
                        <input
                          type="number"
                          value={sizeStock[size] || 0}
                          onChange={(e) => setSizeStock({...sizeStock, [size]: parseInt(e.target.value) || 0})}
                          style={{ width: '100%', padding: '0.5rem', border: '1px solid #e1e8ed', borderRadius: '4px' }}
                          min="0"
                        />
                      </div>
                    ))}
                  </div>
                </div>

                {/* Image Upload */}
                <div style={{ marginBottom: '1rem' }}>
                  <label style={{ display: 'block', marginBottom: '0.5rem', fontWeight: 'bold' }}>Product Images *</label>
                  <input
                    type="file"
                    multiple
                    accept="image/*"
                    onChange={handleImageSelect}
                    style={{ marginBottom: '1rem' }}
                  />
                  <div style={{ display: 'flex', gap: '1rem', flexWrap: 'wrap' }}>
                    {imagePreviews.map((preview, index) => (
                      <div key={index} style={{ position: 'relative' }}>
                        <img
                          src={preview}
                          alt={`Preview ${index}`}
                          style={{ width: '100px', height: '100px', objectFit: 'cover', borderRadius: '8px' }}
                        />
                        <button
                          type="button"
                          onClick={() => removeImage(index)}
                          style={{
                            position: 'absolute',
                            top: '-5px',
                            right: '-5px',
                            background: '#e74c3c',
                            color: 'white',
                            border: 'none',
                            borderRadius: '50%',
                            width: '20px',
                            height: '20px',
                            cursor: 'pointer'
                          }}
                        >
                          ×
                        </button>
                      </div>
                    ))}
                  </div>
                </div>

                <div style={{ display: 'flex', gap: '1rem' }}>
                  <button
                    type="submit"
                    disabled={uploadingImages}
                    style={{
                      padding: '0.75rem 1.5rem',
                      background: uploadingImages ? '#95a5a6' : '#27ae60',
                      color: 'white',
                      border: 'none',
                      borderRadius: '8px',
                      cursor: uploadingImages ? 'not-allowed' : 'pointer',
                      fontWeight: '600'
                    }}
                  >
                    {uploadingImages ? 'Uploading...' : (editingProduct ? 'Update Product' : 'Add Product')}
                  </button>
                  <button
                    type="button"
                    onClick={() => setShowProductForm(false)}
                    style={{
                      padding: '0.75rem 1.5rem',
                      background: '#95a5a6',
                      color: 'white',
                      border: 'none',
                      borderRadius: '8px',
                      cursor: 'pointer'
                    }}
                  >
                    Cancel
                  </button>
                </div>
              </form>
            </div>
          )}

          {/* Products List */}
          <div style={{ display: 'grid', gap: '1rem' }}>
            {products.length === 0 ? (
              <p>No products yet. Add your first product!</p>
            ) : (
              products.map(product => (
                <div key={product._id} style={{
                  background: 'white',
                  padding: '1rem',
                  borderRadius: '8px',
                  boxShadow: '0 2px 5px rgba(0,0,0,0.1)',
                  display: 'flex',
                  gap: '1rem'
                }}>
                  <img
                    src={product.images && product.images.length > 0 ? `${IMAGE_BASE_URL}${product.images[0]}` : 'https://via.placeholder.com/100x100?text=No+Image'}
                    alt={product.name}
                    style={{ width: '100px', height: '100px', objectFit: 'cover', borderRadius: '8px' }}
                  />
                  <div style={{ flex: 1 }}>
                    <h4 style={{ margin: '0 0 0.5rem 0' }}>{product.name}</h4>
                    <p style={{ margin: '0.25rem 0', color: '#666' }}>{product.description}</p>
                    <div style={{ display: 'flex', gap: '1rem', fontSize: '0.9rem', color: '#666', flexWrap: 'wrap' }}>
                      <span><strong>Price:</strong> ${product.price}</span>
                      {product.originalPrice && (
                        <span style={{ textDecoration: 'line-through', color: '#999' }}>
                          <strong>Original:</strong> ${product.originalPrice}
                        </span>
                      )}
                      <span><strong>Stock:</strong> {product.stock}</span>
                      <span><strong>Category:</strong> {product.category}</span>
                      {product.supplierCost && (
                        <span><strong>Cost:</strong> ${product.supplierCost}</span>
                      )}
                      {product.isBestSeller && (
                        <span style={{ color: '#e67e22', fontWeight: 'bold' }}>🔥 Best Seller</span>
                      )}
                    </div>
                  </div>
                  <div style={{ display: 'flex', gap: '0.5rem', alignItems: 'flex-start' }}>
                    <button
                      onClick={() => handleEditProduct(product)}
                      style={{
                        padding: '0.5rem 1rem',
                        background: '#3498db',
                        color: 'white',
                        border: 'none',
                        borderRadius: '4px',
                        cursor: 'pointer'
                      }}
                    >
                      Edit
                    </button>
                    <button
                      onClick={() => handleDeleteProduct(product._id)}
                      style={{
                        padding: '0.5rem 1rem',
                        background: '#e74c3c',
                        color: 'white',
                        border: 'none',
                        borderRadius: '4px',
                        cursor: 'pointer'
                      }}
                    >
                      Delete
                    </button>
                  </div>
                </div>
              ))
            )}
          </div>
        </div>
      )}
    </div>
  );
};

export default SupplierDashboard;