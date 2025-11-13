import React, { useState } from 'react';
import { Link, useNavigate, useLocation } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import { useCart } from '../context/CartContext';
import './Navbar.css'; // Make sure to import the CSS file

const Navbar = () => {
  const { user, logout } = useAuth();
  const { getCartItemsCount } = useCart();
  const navigate = useNavigate();
  const location = useLocation();
  const [isMenuOpen, setIsMenuOpen] = useState(false);

  const handleLogout = () => {
    logout();
    navigate('/');
    closeMenu();
  };

  const toggleMenu = () => {
    setIsMenuOpen(!isMenuOpen);
  };

  const closeMenu = () => {
    setIsMenuOpen(false);
  };

  return (
    <nav className="navbar">
      <div className="nav-container">
        {/* Logo */}
        <Link to="/" className="logo" onClick={closeMenu}>
          <span className="logo-icon">🛒</span>
          Happy Cart
        </Link>
        
        {/* Hamburger Menu Icon */}
        <div className="nav-toggle" onClick={toggleMenu}>
          <span className={`hamburger-line ${isMenuOpen ? 'active' : ''}`}></span>
          <span className={`hamburger-line ${isMenuOpen ? 'active' : ''}`}></span>
          <span className={`hamburger-line ${isMenuOpen ? 'active' : ''}`}></span>
        </div>

        {/* Navigation Links */}
        <div className={`nav-menu ${isMenuOpen ? 'active' : ''}`}>
          <Link 
            to="/" 
            className={`nav-link ${location.pathname === '/' ? 'active' : ''}`}
            onClick={closeMenu}
          >
            Home
          </Link>
          
          <Link 
            to="/products?bestseller=true" 
            className={`nav-link ${location.search.includes('bestseller=true') ? 'active' : ''}`}
            onClick={closeMenu}
          >
            Best Sellers
          </Link>
          
          <Link 
            to="/products" 
            className={`nav-link ${location.pathname === '/products' && !location.search.includes('bestseller=true') ? 'active' : ''}`}
            onClick={closeMenu}
          >
            Explore
          </Link>
          
          {user ? (
            <>
              {/* User Greeting */}
              <div className="nav-user-greeting">
                Hello, {user.name}
              </div>

              {/* Supplier Dashboard */}
              {user.role === 'supplier' && (
                <Link 
                  to="/supplier-dashboard" 
                  className={`nav-link ${location.pathname === '/supplier-dashboard' ? 'active' : ''}`}
                  onClick={closeMenu}
                >
                  Dashboard
                </Link>
              )}

              {/* Customer Orders */}
              {user.role === 'customer' && (
                <Link 
                  to="/my-orders" 
                  className={`nav-link ${location.pathname === '/my-orders' ? 'active' : ''}`}
                  onClick={closeMenu}
                >
                  My Orders
                </Link>
              )}

              {/* Cart */}
              <Link 
                to="/cart" 
                className="nav-link cart-link"
                onClick={closeMenu}
              >
                <span className="cart-icon">🛒</span>
                {getCartItemsCount() > 0 && (
                  <span className="cart-count">{getCartItemsCount()}</span>
                )}
              </Link>

              {/* Logout */}
              <button 
                onClick={handleLogout}
                className="logout-btn"
              >
                Logout
              </button>
            </>
          ) : (
            <>
              {/* Login/Signup for non-authenticated users */}
              <Link 
                to="/login" 
                className={`nav-link ${location.pathname === '/login' ? 'active' : ''}`}
                onClick={closeMenu}
              >
                Sign In
              </Link>
              
              <Link 
                to="/register" 
                className={`nav-link ${location.pathname === '/register' ? 'active' : ''}`}
                onClick={closeMenu}
              >
                Sign Up
              </Link>
              
              {/* Cart for guests */}
              <Link 
                to="/cart" 
                className="nav-link cart-link"
                onClick={closeMenu}
              >
                <span className="cart-icon">🛒</span>
                {getCartItemsCount() > 0 && (
                  <span className="cart-count">{getCartItemsCount()}</span>
                )}
              </Link>
            </>
          )}
        </div>

        {/* Overlay for mobile when menu is open */}
        {isMenuOpen && <div className="nav-overlay" onClick={closeMenu}></div>}
      </div>
    </nav>
  );
};

export default Navbar;