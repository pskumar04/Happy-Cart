import React, { useState, useEffect } from 'react';
import { useParams, Link } from 'react-router-dom';
import axios from 'axios';
import { API_URL, IMAGE_BASE_URL } from '../config';
import { useCart } from '../context/CartContext';
import { toast } from 'react-toastify';

const ProductDetail = () => {
  const { id } = useParams();
  const [product, setProduct] = useState(null);
  const [loading, setLoading] = useState(true);
  const [selectedSize, setSelectedSize] = useState('');
  const [selectedColor, setSelectedColor] = useState('');
  const [quantity, setQuantity] = useState(1);
  const [availableStock, setAvailableStock] = useState(0);
  
  const { addToCart } = useCart();

  useEffect(() => {
    fetchProduct();
  }, [id]);

  useEffect(() => {
    // Update available stock when size changes
    if (product && product.sizeStock && selectedSize) {
      const stock = product.sizeStock[selectedSize] || 0;
      setAvailableStock(stock);
      // Reset quantity if it exceeds available stock
      if (quantity > stock) {
        setQuantity(1);
      }
    } else if (product) {
      setAvailableStock(product.stock || 0);
    }
  }, [selectedSize, product, quantity]);

  // Function to parse data that might be JSON strings
  const parseProductData = (productData) => {
    let sizes = [];
    let colors = [];
    let sizeStock = {};

    try {
      // Parse sizes - handle both array and JSON string
      if (typeof productData.sizes === 'string') {
        sizes = JSON.parse(productData.sizes);
      } else if (Array.isArray(productData.sizes)) {
        sizes = productData.sizes;
      } else {
        sizes = ['S', 'M', 'L', 'XL']; // Default fallback
      }

      // Parse colors - handle both array and JSON string
      if (typeof productData.colors === 'string') {
        colors = JSON.parse(productData.colors);
      } else if (Array.isArray(productData.colors)) {
        colors = productData.colors;
      } else {
        colors = ['Black', 'White', 'Blue']; // Default fallback
      }

      // Parse sizeStock - handle both object and JSON string
      if (typeof productData.sizeStock === 'string') {
        sizeStock = JSON.parse(productData.sizeStock);
      } else if (productData.sizeStock && typeof productData.sizeStock === 'object') {
        sizeStock = productData.sizeStock;
      } else {
        // Create default sizeStock based on sizes
        sizes.forEach(size => {
          sizeStock[size] = productData.stock || 0;
        });
      }
    } catch (error) {
      console.error('Error parsing product data:', error);
      // Fallback to default values
      sizes = ['S', 'M', 'L', 'XL'];
      colors = ['Black', 'White', 'Blue'];
      sizes.forEach(size => {
        sizeStock[size] = productData.stock || 0;
      });
    }

    return {
      ...productData,
      sizes,
      colors,
      sizeStock
    };
  };

  const fetchProduct = async () => {
    try {
      const response = await axios.get(`${API_URL}/products/${id}`);
      const productData = response.data;
      console.log('Raw product data received:', productData);
      
      // Parse the product data to ensure proper format
      const processedProduct = parseProductData(productData);
      console.log('Processed product data:', processedProduct);
      
      setProduct(processedProduct);
      
      // Set default selections
      if (processedProduct.sizes && processedProduct.sizes.length > 0) {
        setSelectedSize(processedProduct.sizes[0]);
      }
      if (processedProduct.colors && processedProduct.colors.length > 0) {
        setSelectedColor(processedProduct.colors[0]);
      }
    } catch (error) {
      console.error('Error fetching product:', error);
      toast.error('Product not found');
    } finally {
      setLoading(false);
    }
  };

  const handleAddToCart = () => {
    if (!selectedSize && product.sizes && product.sizes.length > 0) {
      toast.error('Please select a size');
      return;
    }

    addToCart(product, quantity, selectedSize, selectedColor);
    toast.success('Product added to cart!');
  };

  // Function to render star ratings
  const renderStars = (rating) => {
    const stars = [];
    const fullStars = Math.floor(rating);
    const hasHalfStar = rating % 1 !== 0;

    for (let i = 0; i < fullStars; i++) {
      stars.push(<span key={i} style={{ color: '#ffc107', fontSize: '1.2rem' }}>★</span>);
    }
    
    if (hasHalfStar) {
      stars.push(<span key="half" style={{ color: '#ffc107', fontSize: '1.2rem' }}>★</span>);
    }
    
    const emptyStars = 5 - Math.ceil(rating);
    for (let i = 0; i < emptyStars; i++) {
      stars.push(<span key={`empty-${i}`} style={{ color: '#e0e0e0', fontSize: '1.2rem' }}>★</span>);
    }
    
    return stars;
  };

  if (loading) {
    return <div style={{ textAlign: 'center', padding: '2rem' }}>Loading product...</div>;
  }

  if (!product) {
    return <div style={{ textAlign: 'center', padding: '2rem' }}>Product not found</div>;
  }

  // Get current available stock
  const currentStock = product.sizeStock && selectedSize ? 
    (product.sizeStock[selectedSize] || 0) : product.stock;

  // Check if sizes array exists and has items
  const hasSizes = product.sizes && Array.isArray(product.sizes) && product.sizes.length > 0;
  
  // Check if colors array exists and has items
  const hasColors = product.colors && Array.isArray(product.colors) && product.colors.length > 0;

  return (
    <div style={{ 
      maxWidth: '1200px', 
      margin: '2rem auto', 
      padding: '0 2rem' 
    }}>
      <div style={{ 
        display: 'grid', 
        gridTemplateColumns: '1fr 1fr', 
        gap: '3rem',
        background: 'white',
        borderRadius: '15px',
        padding: '2rem',
        boxShadow: '0 5px 15px rgba(0,0,0,0.1)'
      }}>
        {/* Product Images */}
        <div>
          <img 
            src={product.images && product.images[0] ? `${IMAGE_BASE_URL}${product.images[0]}` : 'https://via.placeholder.com/500x500?text=Product+Image'} 
            alt={product.name}
            style={{
              width: '100%',
              height: '400px',
              objectFit: 'cover',
              borderRadius: '10px'
            }}
          />
        </div>

        {/* Product Info */}
        <div>
          <h1 style={{ fontSize: '2rem', marginBottom: '1rem' }}>{product.name}</h1>
          <p style={{ color: '#666', marginBottom: '1.5rem' }}>{product.description}</p>
          
          {/* Product Rating */}
          <div style={{ marginBottom: '1.5rem' }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', marginBottom: '0.5rem' }}>
              {renderStars(product.ratings?.average || 0)}
              <span style={{ color: '#666', fontSize: '0.9rem' }}>
                ({product.ratings?.count || 0} reviews)
              </span>
            </div>
          </div>
          
          <div style={{ display: 'flex', alignItems: 'center', gap: '1rem', marginBottom: '1.5rem' }}>
            <span style={{ fontSize: '2rem', fontWeight: 'bold', color: '#667eea' }}>
              ${product.price}
            </span>
            {product.originalPrice > product.price && (
              <span style={{ 
                fontSize: '1.2rem', 
                color: '#999', 
                textDecoration: 'line-through' 
              }}>
                ${product.originalPrice}
              </span>
            )}
          </div>

          {/* Size Selection - MANDATORY - SHOW AS BOXES */}
          {hasSizes && (
            <div style={{ marginBottom: '1.5rem' }}>
              <h3 style={{ marginBottom: '0.5rem' }}>
                Size: <span style={{ color: '#ff4757' }}>*</span>
              </h3>
              <div style={{ display: 'flex', gap: '0.5rem', flexWrap: 'wrap' }}>
                {product.sizes.map(size => {
                  const sizeStock = product.sizeStock ? product.sizeStock[size] : 0;
                  const isOutOfStock = sizeStock === 0;
                  
                  return (
                    <button
                      key={size}
                      onClick={() => !isOutOfStock && setSelectedSize(size)}
                      disabled={isOutOfStock}
                      style={{
                        padding: '0.75rem 1.5rem',
                        border: `2px solid ${
                          isOutOfStock ? '#ccc' : 
                          selectedSize === size ? '#667eea' : '#e1e8ed'
                        }`,
                        background: isOutOfStock ? '#f8f9fa' : 
                                  selectedSize === size ? '#667eea' : 'white',
                        color: isOutOfStock ? '#999' : 
                              selectedSize === size ? 'white' : '#333',
                        borderRadius: '8px',
                        cursor: isOutOfStock ? 'not-allowed' : 'pointer',
                        fontWeight: '600',
                        fontSize: '1rem',
                        minWidth: '60px',
                        transition: 'all 0.3s ease'
                      }}
                    >
                      {size}
                    </button>
                  );
                })}
              </div>
              {selectedSize && product.sizeStock && (
                <p style={{ color: '#666', fontSize: '0.9rem', marginTop: '0.5rem' }}>
                  Available: {product.sizeStock[selectedSize]} in stock
                </p>
              )}
              {!selectedSize && (
                <p style={{ color: '#ff4757', fontSize: '0.9rem', marginTop: '0.5rem' }}>
                  Please select a size
                </p>
              )}
            </div>
          )}

          {/* Color Selection - SHOW AS DROPDOWN */}
          {hasColors && (
            <div style={{ marginBottom: '1.5rem' }}>
              <h3 style={{ marginBottom: '0.5rem' }}>Color:</h3>
              <select
                value={selectedColor}
                onChange={(e) => setSelectedColor(e.target.value)}
                style={{
                  width: '100%',
                  maxWidth: '300px',
                  padding: '0.75rem',
                  border: '2px solid #e1e8ed',
                  borderRadius: '8px',
                  fontSize: '1rem',
                  background: 'white',
                  cursor: 'pointer'
                }}
              >
                <option value="">Select Color</option>
                {product.colors.map(color => (
                  <option key={color} value={color}>
                    {color}
                  </option>
                ))}
              </select>
            </div>
          )}

          {/* Quantity Selection */}
          <div style={{ marginBottom: '1.5rem' }}>
            <h3 style={{ marginBottom: '0.5rem' }}>Quantity:</h3>
            <div style={{ display: 'flex', alignItems: 'center', gap: '1rem' }}>
              <button
                onClick={() => setQuantity(Math.max(1, quantity - 1))}
                disabled={quantity <= 1}
                style={{
                  padding: '0.5rem 1rem',
                  border: `2px solid ${quantity <= 1 ? '#ccc' : '#e1e8ed'}`,
                  background: quantity <= 1 ? '#f8f9fa' : 'white',
                  color: quantity <= 1 ? '#999' : '#333',
                  borderRadius: '5px',
                  cursor: quantity <= 1 ? 'not-allowed' : 'pointer',
                  fontSize: '1.2rem',
                  width: '45px',
                  height: '45px',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center'
                }}
              >
                -
              </button>
              <span style={{ 
                fontSize: '1.2rem', 
                fontWeight: 'bold', 
                minWidth: '30px', 
                textAlign: 'center',
                padding: '0.5rem 1rem',
                border: '2px solid #e1e8ed',
                borderRadius: '5px'
              }}>
                {quantity}
              </span>
              <button
                onClick={() => setQuantity(Math.min(currentStock, quantity + 1))}
                disabled={quantity >= currentStock}
                style={{
                  padding: '0.5rem 1rem',
                  border: `2px solid ${quantity >= currentStock ? '#ccc' : '#e1e8ed'}`,
                  background: quantity >= currentStock ? '#f8f9fa' : 'white',
                  color: quantity >= currentStock ? '#999' : '#333',
                  borderRadius: '5px',
                  cursor: quantity >= currentStock ? 'not-allowed' : 'pointer',
                  fontSize: '1.2rem',
                  width: '45px',
                  height: '45px',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center'
                }}
              >
                +
              </button>
              <span style={{ color: '#666', fontSize: '0.9rem' }}>
                {currentStock} available
              </span>
            </div>
          </div>

          {/* Add to Cart Button */}
          <button
            onClick={handleAddToCart}
            disabled={currentStock === 0 || (hasSizes && !selectedSize)}
            style={{
              width: '100%',
              padding: '1rem',
              background: (currentStock === 0 || (hasSizes && !selectedSize)) ? '#ccc' : '#667eea',
              color: 'white',
              border: 'none',
              borderRadius: '8px',
              fontSize: '1.1rem',
              fontWeight: 'bold',
              cursor: (currentStock === 0 || (hasSizes && !selectedSize)) ? 'not-allowed' : 'pointer',
              marginBottom: '1rem'
            }}
          >
            {currentStock === 0 ? 'Out of Stock' : 
             (hasSizes && !selectedSize) ? 'Select Size to Add to Cart' : 'Add to Cart'}
          </button>

          <Link to="/products">
            <button
              style={{
                width: '100%',
                padding: '1rem',
                background: 'transparent',
                color: '#667eea',
                border: '2px solid #667eea',
                borderRadius: '8px',
                fontSize: '1.1rem',
                fontWeight: 'bold',
                cursor: 'pointer'
              }}
            >
              Continue Shopping
            </button>
          </Link>
        </div>
      </div>

      {/* Supplier Information Section */}
      {product.supplier && (
        <div style={{
          background: 'white',
          borderRadius: '15px',
          padding: '2rem',
          marginTop: '2rem',
          boxShadow: '0 5px 15px rgba(0,0,0,0.1)'
        }}>
          <h2 style={{ marginBottom: '1.5rem', color: '#333' }}>Supplier Information</h2>
          
          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '2rem' }}>
            <div>
              <h3 style={{ marginBottom: '1rem', color: '#667eea' }}>Supplier Details</h3>
              <div style={{ display: 'flex', alignItems: 'center', gap: '1rem', marginBottom: '1rem' }}>
                <div style={{
                  width: '60px',
                  height: '60px',
                  background: '#667eea',
                  borderRadius: '50%',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  color: 'white',
                  fontWeight: 'bold',
                  fontSize: '1.5rem'
                }}>
                  {product.supplier.name?.charAt(0).toUpperCase() || 'S'}
                </div>
                <div>
                  <h4 style={{ margin: '0 0 0.25rem 0' }}>{product.supplier.name}</h4>
                  <p style={{ margin: 0, color: '#666' }}>{product.supplier.logisticsName}</p>
                </div>
              </div>
            </div>

            <div>
              <h3 style={{ marginBottom: '1rem', color: '#667eea' }}>Contact & Address</h3>
              {product.supplier.address ? (
                <div>
                  <p style={{ margin: '0.25rem 0' }}>
                    <strong>Address:</strong> {product.supplier.address.street}, {product.supplier.address.city}
                  </p>
                  <p style={{ margin: '0.25rem 0' }}>
                    {product.supplier.address.state}, {product.supplier.address.zipCode}, {product.supplier.address.country}
                  </p>
                </div>
              ) : (
                <p style={{ color: '#666' }}>Address information not available</p>
              )}
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default ProductDetail;