import React, { createContext, useState, useContext, useEffect } from 'react';
import { IMAGE_BASE_URL } from '../config';

const CartContext = createContext();

export const useCart = () => {
  const context = useContext(CartContext);
  if (!context) {
    throw new Error('useCart must be used within a CartProvider');
  }
  return context;
};

export const CartProvider = ({ children }) => {
  const [cartItems, setCartItems] = useState([]);

  useEffect(() => {
    const savedCart = localStorage.getItem('happyCart');
    if (savedCart) {
      setCartItems(JSON.parse(savedCart));
    }
  }, []);

  useEffect(() => {
    localStorage.setItem('happyCart', JSON.stringify(cartItems));
  }, [cartItems]);

  const addToCart = (product, quantity = 1, size = '', color = '') => {
    setCartItems(prevItems => {
      const existingItem = prevItems.find(
        item => item.id === product._id && item.size === size && item.color === color
      );

      if (existingItem) {
        return prevItems.map(item =>
          item.id === product._id && item.size === size && item.color === color
            ? { ...item, quantity: item.quantity + quantity }
            : item
        );
      } else {
        return [
          ...prevItems,
          {
            id: product._id,
            name: product.name,
            price: product.price,
            image: product.images && product.images[0] ? `${IMAGE_BASE_URL}${product.images[0]}` : 'https://via.placeholder.com/300x300?text=Product+Image',
            quantity,
            size,
            color,
            stock: product.stock
          }
        ];
      }
    });
  };

  const removeFromCart = (itemId, size = '', color = '') => {
    setCartItems(prevItems =>
      prevItems.filter(item => 
        !(item.id === itemId && item.size === size && item.color === color)
      )
    );
  };

  const updateQuantity = (itemId, quantity, size = '', color = '') => {
    if (quantity <= 0) {
      removeFromCart(itemId, size, color);
      return;
    }

    setCartItems(prevItems =>
      prevItems.map(item =>
        item.id === itemId && item.size === size && item.color === color
          ? { ...item, quantity }
          : item
      )
    );
  };

  const clearCart = () => {
    setCartItems([]);
  };

  const getCartSubtotal = () => {
    return cartItems.reduce((total, item) => total + item.price * item.quantity, 0);
  };

  const getCartTax = () => {
    return getCartSubtotal() * 0.18;
  };

  const getCartTotalWithTax = () => {
    return getCartSubtotal() + getCartTax();
  };

  const getCartTotal = () => {
    return cartItems.reduce((total, item) => total + item.price * item.quantity, 0);
  };

  const getCartItemsCount = () => {
    return cartItems.reduce((total, item) => total + item.quantity, 0);
  };

  const value = {
    cartItems,
    addToCart,
    removeFromCart,
    updateQuantity,
    clearCart,
    getCartTotal: getCartSubtotal, // This now returns subtotal
    getCartTax, // New method for tax
    getCartTotalWithTax, // New method for total with tax
    getCartItemsCount
  };

  return (
    <CartContext.Provider value={value}>
      {children}
    </CartContext.Provider>
  );
};