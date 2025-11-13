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
          <ul className="nav-links">
            <li>
              <Link 
                to="/" 
                className={`nav-link ${location.pathname === '/' ? 'active' : ''}`}
                onClick={closeMenu}
              >
                Home
              </Link>
            </li>
            
            <li>
              <Link 
                to="/products?bestseller=true" 
                className={`nav-link ${location.search.includes('bestseller=true') ? 'active' : ''}`}
                onClick={closeMenu}
              >
                Best Sellers
              </Link>
            </li>
            
            <li>
              <Link 
                to="/products" 
                className={`nav-link ${location.pathname === '/products' && !location.search.includes('bestseller=true') ? 'active' : ''}`}
                onClick={closeMenu}
              >
                Explore
              </Link>
            </li>
            
            {user ? (
              <>
                <li className="nav-user-greeting">
                  Hello, {user.name}
                </li>

                {/* Supplier Dashboard */}
                {user.role === 'supplier' && (
                  <li>
                    <Link 
                      to="/supplier-dashboard" 
                      className={`nav-link ${location.pathname === '/supplier-dashboard' ? 'active' : ''}`}
                      onClick={closeMenu}
                    >
                      Dashboard
                    </Link>
                  </li>
                )}

                {/* Customer Orders */}
                {user.role === 'customer' && (
                  <li>
                    <Link 
                      to="/my-orders" 
                      className={`nav-link ${location.pathname === '/my-orders' ? 'active' : ''}`}
                      onClick={closeMenu}
                    >
                      My Orders
                    </Link>
                  </li>
                )}

                {/* Cart */}
                <li>
                  <Link 
                    to="/cart" 
                    className="nav-link cart-link"
                    onClick={closeMenu}
                  >
                    <span className="cart-icon">🛒</span>
                    Cart
                    {getCartItemsCount() > 0 && (
                      <span className="cart-count">{getCartItemsCount()}</span>
                    )}
                  </Link>
                </li>

                {/* Logout */}
                <li>
                  <button 
                    onClick={handleLogout}
                    className="logout-btn"
                  >
                    Logout
                  </button>
                </li>
              </>
            ) : (
              <>
                {/* Login/Signup for non-authenticated users */}
                <li>
                  <Link 
                    to="/login" 
                    className={`nav-link ${location.pathname === '/login' ? 'active' : ''}`}
                    onClick={closeMenu}
                  >
                    Sign In
                  </Link>
                </li>
                
                <li>
                  <Link 
                    to="/register" 
                    className={`nav-link ${location.pathname === '/register' ? 'active' : ''}`}
                    onClick={closeMenu}
                  >
                    Sign Up
                  </Link>
                </li>
                
                {/* Cart for guests */}
                <li>
                  <Link 
                    to="/cart" 
                    className="nav-link cart-link"
                    onClick={closeMenu}
                  >
                    <span className="cart-icon">🛒</span>
                    Cart
                    {getCartItemsCount() > 0 && (
                      <span className="cart-count">{getCartItemsCount()}</span>
                    )}
                  </Link>
                </li>
              </>
            )}
          </ul>
        </div>

        {/* Overlay for mobile when menu is open */}
        {isMenuOpen && <div className="nav-overlay" onClick={closeMenu}></div>}
      </div>
    </nav>
  );
};

export default Navbar;