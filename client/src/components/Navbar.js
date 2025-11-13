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
        <Link to="/" className="nav-logo" onClick={closeMenu}>
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
              {/* <li>Hello, {user.name}</li> */}
              <Link 
                to="/profile" 
                style={{
                  color: 'white',
                  textDecoration: 'none',
                  fontWeight: '600',
                  padding: '0.5rem 1rem',
                  borderRadius: '5px',
                  transition: 'background 0.3s ease'
                }}
                onMouseOver={(e) => e.target.style.background = 'rgba(255,255,255,0.2)'}
                onMouseOut={(e) => e.target.style.background = 'transparent'}
              >
                Hello {user?.name}
              </Link>
              {user.role === 'supplier' && (
                <li><Link to="/supplier-dashboard">Dashboard</Link></li>
              )}
              {user.role === 'customer' && (
                <li><Link to="/my-orders">My Orders</Link></li>
              )}
              <li>
                <Link to="/cart" className="cart-icon">
                  🛒
                  {getCartItemsCount() > 0 && (
                    <span className="cart-count">{getCartItemsCount()}</span>
                  )}
                </Link>
              </li>
              <li>
                <button 
                  onClick={handleLogout}
                  style={{
                    background: 'none',
                    border: 'none',
                    color: 'white',
                    cursor: 'pointer'
                  }}
                >
                  Logout
                </button>
              </li>
            </>
          ) : (
            <>
              <li><Link to="/login">Sign In</Link></li>
              <li><Link to="/register">Sign Up</Link></li>
              <li>
                <Link to="/cart" className="cart-icon">
                  🛒
                  {getCartItemsCount() > 0 && (
                    <span className="cart-count">{getCartItemsCount()}</span>
                  )}
                </Link>
              </li>
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