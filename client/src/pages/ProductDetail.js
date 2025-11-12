import React, { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { useCart } from '../context/CartContext';
import { useAuth } from '../context/AuthContext';
import axios from 'axios';
import { API_URL, IMAGE_BASE_URL } from '../config';
import { toast } from 'react-toastify';

const ProductDetail = () => {
  const { id } = useParams();
  const navigate = useNavigate();
  const { addToCart } = useCart();
  const { user } = useAuth();
  
  const [product, setProduct] = useState(null);
  const [loading, setLoading] = useState(true);
  const [selectedSize, setSelectedSize] = useState('');
  const [selectedColor, setSelectedColor] = useState('');
  const [quantity, setQuantity] = useState(1);
  const [addingToCart, setAddingToCart] = useState(false);

  useEffect(() => {
    fetchProduct();
  }, [id]);

  const fetchProduct = async () => {
    try {
      setLoading(true);
      const response = await axios.get(`${API_URL}/products/${id}`);
      setProduct(response.data);
      
      // Set default size and color if available
      if (response.data.sizes && response.data.sizes.length > 0) {
        setSelectedSize(response.data.sizes[0]);
      }
      if (response.data.colors && response.data.colors.length > 0) {
        setSelectedColor(response.data.colors[0]);
      }
    } catch (error) {
      console.error('Error fetching product:', error);
      toast.error('Failed to load product');
    } finally {
      setLoading(false);
    }
  };

  // Function to get available stock for selected size
  const getAvailableStock = () => {
    if (!product || !product.sizeStock) return 0;
    
    // If sizeStock is a string, parse it
    let sizeStockObj;
    try {
      if (typeof product.sizeStock === 'string') {
        sizeStockObj = JSON.parse(product.sizeStock);
      } else {
        sizeStockObj = product.sizeStock;
      }
    } catch (error) {
      console.error('Error parsing sizeStock:', error);
      return product.stock || 0;
    }
    
    return sizeStockObj[selectedSize] || product.stock || 0;
  };

  const handleAddToCart = async () => {
    if (!user) {
      toast.error('Please login to add items to cart');
      navigate('/login');
      return;
    }

    if (!selectedSize && product.sizes && product.sizes.length > 0) {
      toast.error('Please select a size');
      return;
    }

    const availableStock = getAvailableStock();
    if (quantity > availableStock) {
      toast.error(`Only ${availableStock} items available in stock`);
      return;
    }

    if (quantity <= 0) {
      toast.error('Please select a valid quantity');
      return;
    }

    setAddingToCart(true);
    try {
      // Add to cart
      addToCart(product, quantity, selectedSize, selectedColor);
      
      // Update stock in backend (reduce stock when added to cart)
      await updateProductStock(quantity);
      
      toast.success('Product added to cart!');
    } catch (error) {
      console.error('Error adding to cart:', error);
      toast.error('Failed to add product to cart');
    } finally {
      setAddingToCart(false);
    }
  };

  const updateProductStock = async (qty) => {
    try {
      const token = localStorage.getItem('token');
      if (!token) return;

      // Calculate new stock
      const availableStock = getAvailableStock();
      const newStock = Math.max(0, availableStock - qty);

      // Update size-specific stock
      let updatedSizeStock = {};
      try {
        if (typeof product.sizeStock === 'string') {
          updatedSizeStock = JSON.parse(product.sizeStock);
        } else if (product.sizeStock) {
          updatedSizeStock = { ...product.sizeStock };
        }
      } catch (error) {
        console.error('Error parsing sizeStock for update:', error);
        return;
      }

      // Update the specific size stock
      if (selectedSize) {
        updatedSizeStock[selectedSize] = newStock;
      }

      // Calculate total stock
      const totalStock = Object.values(updatedSizeStock).reduce((sum, stock) => sum + parseInt(stock || 0), 0);

      // Update product in backend
      const updateData = {
        stock: totalStock,
        sizeStock: updatedSizeStock
      };

      await axios.put(`${API_URL}/products/${product._id}`, updateData, {
        headers: {
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json'
        }
      });

      // Update local state to reflect the change
      setProduct(prev => ({
        ...prev,
        stock: totalStock,
        sizeStock: updatedSizeStock
      }));

    } catch (error) {
      console.error('Error updating product stock:', error);
      // Don't show error to user as cart addition was successful
    }
  };

  const handleBuyNow = async () => {
    if (!user) {
      toast.error('Please login to buy products');
      navigate('/login');
      return;
    }

    if (!selectedSize && product.sizes && product.sizes.length > 0) {
      toast.error('Please select a size');
      return;
    }

    const availableStock = getAvailableStock();
    if (quantity > availableStock) {
      toast.error(`Only ${availableStock} items available in stock`);
      return;
    }

    setAddingToCart(true);
    try {
      // Add to cart
      addToCart(product, quantity, selectedSize, selectedColor);
      
      // Update stock in backend
      await updateProductStock(quantity);
      
      // Navigate to checkout
      navigate('/checkout');
    } catch (error) {
      console.error('Error in buy now:', error);
      toast.error('Failed to process order');
    } finally {
      setAddingToCart(false);
    }
  };

  if (loading) {
    return (
      <div style={{ textAlign: 'center', padding: '4rem 2rem' }}>
        <div>Loading product...</div>
      </div>
    );
  }

  if (!product) {
    return (
      <div style={{ textAlign: 'center', padding: '4rem 2rem' }}>
        <h2>Product not found</h2>
        <p>The product you're looking for doesn't exist.</p>
        <button 
          onClick={() => navigate('/products')}
          className="cta-button"
        >
          Back to Products
        </button>
      </div>
    );
  }

  const availableStock = getAvailableStock();
  const isOutOfStock = availableStock <= 0;

  return (
    <div style={{ padding: '2rem', maxWidth: '1200px', margin: '0 auto' }}>
      <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '3rem' }}>
        {/* Product Images */}
        <div>
          <div style={{ 
            background: 'white', 
            borderRadius: '15px',
            overflow: 'hidden',
            boxShadow: '0 5px 15px rgba(0,0,0,0.1)'
          }}>
            <img
              src={product.images && product.images[0] ? `${IMAGE_BASE_URL}${product.images[0]}` : 'https://via.placeholder.com/500x500?text=Product+Image'}
              alt={product.name}
              style={{
                width: '100%',
                height: '500px',
                objectFit: 'cover'
              }}
            />
          </div>
          
          {/* Additional Images */}
          {product.images && product.images.length > 1 && (
            <div style={{ display: 'flex', gap: '1rem', marginTop: '1rem', overflowX: 'auto' }}>
              {product.images.map((image, index) => (
                <img
                  key={index}
                  src={`${IMAGE_BASE_URL}${image}`}
                  alt={`${product.name} ${index + 1}`}
                  style={{
                    width: '80px',
                    height: '80px',
                    objectFit: 'cover',
                    borderRadius: '8px',
                    cursor: 'pointer'
                  }}
                />
              ))}
            </div>
          )}
        </div>

        {/* Product Details */}
        <div>
          <div style={{ 
            background: 'white', 
            padding: '2rem', 
            borderRadius: '15px',
            boxShadow: '0 5px 15px rgba(0,0,0,0.1)'
          }}>
            <h1 style={{ margin: '0 0 1rem 0', fontSize: '2rem', color: '#333' }}>
              {product.name}
            </h1>
            
            {product.isBestSeller && (
              <div style={{
                display: 'inline-block',
                background: '#e67e22',
                color: 'white',
                padding: '0.25rem 0.75rem',
                borderRadius: '20px',
                fontSize: '0.8rem',
                fontWeight: 'bold',
                marginBottom: '1rem'
              }}>
                🔥 BEST SELLER
              </div>
            )}

            {/* Price */}
            <div style={{ marginBottom: '1.5rem' }}>
              {product.originalPrice && product.originalPrice !== product.price ? (
                <div style={{ display: 'flex', alignItems: 'center', gap: '1rem' }}>
                  <span style={{ fontSize: '2rem', fontWeight: 'bold', color: '#e74c3c' }}>
                    ${product.price}
                  </span>
                  <span style={{ fontSize: '1.2rem', color: '#666', textDecoration: 'line-through' }}>
                    ${product.originalPrice}
                  </span>
                  <span style={{ 
                    background: '#27ae60', 
                    color: 'white', 
                    padding: '0.25rem 0.5rem', 
                    borderRadius: '4px',
                    fontSize: '0.8rem',
                    fontWeight: 'bold'
                  }}>
                    Save ${(product.originalPrice - product.price).toFixed(2)}
                  </span>
                </div>
              ) : (
                <span style={{ fontSize: '2rem', fontWeight: 'bold', color: '#333' }}>
                  ${product.price}
                </span>
              )}
            </div>

            {/* Stock Information */}
            <div style={{ marginBottom: '1.5rem' }}>
              <p style={{ 
                color: isOutOfStock ? '#e74c3c' : '#27ae60', 
                fontWeight: 'bold',
                margin: 0 
              }}>
                {isOutOfStock ? 'Out of Stock' : `In Stock: ${availableStock} available`}
              </p>
            </div>

            {/* Description */}
            <div style={{ marginBottom: '2rem' }}>
              <p style={{ lineHeight: '1.6', color: '#666', margin: 0 }}>
                {product.description}
              </p>
            </div>

            {/* Size Selection */}
            {product.sizes && product.sizes.length > 0 && (
              <div style={{ marginBottom: '1.5rem' }}>
                <label style={{ display: 'block', marginBottom: '0.5rem', fontWeight: 'bold' }}>
                  Size:
                </label>
                <div style={{ display: 'flex', gap: '0.5rem', flexWrap: 'wrap' }}>
                  {product.sizes.map((size) => {
                    // Get stock for this size
                    let sizeStock = 0;
                    try {
                      if (typeof product.sizeStock === 'string') {
                        const parsed = JSON.parse(product.sizeStock);
                        sizeStock = parsed[size] || 0;
                      } else if (product.sizeStock) {
                        sizeStock = product.sizeStock[size] || 0;
                      }
                    } catch (error) {
                      sizeStock = product.stock || 0;
                    }

                    const isSizeOutOfStock = sizeStock <= 0;
                    
                    return (
                      <button
                        key={size}
                        onClick={() => !isSizeOutOfStock && setSelectedSize(size)}
                        style={{
                          padding: '0.75rem 1.5rem',
                          border: selectedSize === size ? '2px solid #3498db' : '1px solid #e1e8ed',
                          background: isSizeOutOfStock ? '#f8f9fa' : (selectedSize === size ? '#3498db' : 'white'),
                          color: isSizeOutOfStock ? '#999' : (selectedSize === size ? 'white' : '#333'),
                          borderRadius: '8px',
                          cursor: isSizeOutOfStock ? 'not-allowed' : 'pointer',
                          fontWeight: '600'
                        }}
                        disabled={isSizeOutOfStock}
                      >
                        {size}
                        {isSizeOutOfStock && ' (Out)'}
                      </button>
                    );
                  })}
                </div>
              </div>
            )}

            {/* Color Selection */}
            {product.colors && product.colors.length > 0 && (
              <div style={{ marginBottom: '1.5rem' }}>
                <label style={{ display: 'block', marginBottom: '0.5rem', fontWeight: 'bold' }}>
                  Color:
                </label>
                <div style={{ display: 'flex', gap: '0.5rem', flexWrap: 'wrap' }}>
                  {product.colors.map((color) => (
                    <button
                      key={color}
                      onClick={() => setSelectedColor(color)}
                      style={{
                        padding: '0.75rem 1.5rem',
                        border: selectedColor === color ? '2px solid #3498db' : '1px solid #e1e8ed',
                        background: selectedColor === color ? '#3498db' : 'white',
                        color: selectedColor === color ? 'white' : '#333',
                        borderRadius: '8px',
                        cursor: 'pointer',
                        fontWeight: '600'
                      }}
                    >
                      {color}
                    </button>
                  ))}
                </div>
              </div>
            )}

            {/* Quantity Selection */}
            <div style={{ marginBottom: '2rem' }}>
              <label style={{ display: 'block', marginBottom: '0.5rem', fontWeight: 'bold' }}>
                Quantity:
              </label>
              <div style={{ display: 'flex', alignItems: 'center', gap: '1rem' }}>
                <button
                  onClick={() => setQuantity(prev => Math.max(1, prev - 1))}
                  disabled={quantity <= 1 || isOutOfStock}
                  style={{
                    padding: '0.5rem 1rem',
                    border: '1px solid #e1e8ed',
                    background: 'white',
                    borderRadius: '4px',
                    cursor: quantity <= 1 || isOutOfStock ? 'not-allowed' : 'pointer'
                  }}
                >
                  -
                </button>
                <span style={{ 
                  padding: '0.5rem 1rem', 
                  border: '1px solid #e1e8ed',
                  borderRadius: '4px',
                  minWidth: '50px',
                  textAlign: 'center',
                  display: 'inline-block'
                }}>
                  {quantity}
                </span>
                <button
                  onClick={() => setQuantity(prev => Math.min(availableStock, prev + 1))}
                  disabled={quantity >= availableStock || isOutOfStock}
                  style={{
                    padding: '0.5rem 1rem',
                    border: '1px solid #e1e8ed',
                    background: 'white',
                    borderRadius: '4px',
                    cursor: quantity >= availableStock || isOutOfStock ? 'not-allowed' : 'pointer'
                  }}
                >
                  +
                </button>
              </div>
            </div>

            {/* Action Buttons */}
            <div style={{ display: 'flex', gap: '1rem' }}>
              <button
                onClick={handleAddToCart}
                disabled={isOutOfStock || addingToCart}
                style={{
                  flex: 1,
                  padding: '1rem 2rem',
                  background: isOutOfStock || addingToCart ? '#ccc' : '#3498db',
                  color: 'white',
                  border: 'none',
                  borderRadius: '8px',
                  fontSize: '1.1rem',
                  fontWeight: 'bold',
                  cursor: isOutOfStock || addingToCart ? 'not-allowed' : 'pointer'
                }}
              >
                {addingToCart ? 'Adding...' : (isOutOfStock ? 'Out of Stock' : 'Add to Cart')}
              </button>
              
              <button
                onClick={handleBuyNow}
                disabled={isOutOfStock || addingToCart}
                style={{
                  flex: 1,
                  padding: '1rem 2rem',
                  background: isOutOfStock || addingToCart ? '#ccc' : '#e74c3c',
                  color: 'white',
                  border: 'none',
                  borderRadius: '8px',
                  fontSize: '1.1rem',
                  fontWeight: 'bold',
                  cursor: isOutOfStock || addingToCart ? 'not-allowed' : 'pointer'
                }}
              >
                {addingToCart ? 'Processing...' : 'Buy Now'}
              </button>
            </div>

            {/* Product Details */}
            <div style={{ marginTop: '2rem', paddingTop: '1rem', borderTop: '1px solid #e1e8ed' }}>
              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '1rem', fontSize: '0.9rem' }}>
                <div>
                  <strong>Category:</strong> {product.category}
                </div>
                <div>
                  <strong>Subcategory:</strong> {product.subcategory}
                </div>
                <div>
                  <strong>Supplier:</strong> {product.supplier?.name || 'Unknown'}
                </div>
                <div>
                  <strong>Total Stock:</strong> {product.stock}
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default ProductDetail;