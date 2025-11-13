import React, { useEffect } from 'react'; // Added useEffect import
import { BrowserRouter as Router, Routes, Route } from 'react-router-dom';
import { ToastContainer } from 'react-toastify';
import 'react-toastify/dist/ReactToastify.css';
import './App.css';

// Components
import Navbar from './components/Navbar';
import Footer from './components/Footer';
import CustomerProfile from './components/CustomerProfile';

// Pages
import Home from './pages/Home';
import Products from './pages/Products';
import ProductDetail from './pages/ProductDetail';
import Cart from './pages/Cart';
import Login from './pages/Login';
import Register from './pages/Register';
import SupplierDashboard from './pages/SupplierDashboard';
import CustomerOrders from './pages/CustomerOrders';
import Checkout from './pages/Checkout';
import OrderSuccess from './pages/OrderSuccess';

// Context
import { AuthProvider } from './context/AuthContext';
import { CartProvider } from './context/CartContext';

function App() {
  useEffect(() => {
    // Handle body scroll when menu is open
    const handleBodyScroll = () => {
      if (window.innerWidth <= 768) {
        const isMenuOpen = document.querySelector('.nav-menu.active');
        if (isMenuOpen) {
          document.body.classList.add('menu-open');
        } else {
          document.body.classList.remove('menu-open');
        }
      } else {
        // Always remove menu-open class on larger screens
        document.body.classList.remove('menu-open');
      }
    };

    // Initial check
    handleBodyScroll();

    // Listen for resize events
    window.addEventListener('resize', handleBodyScroll);

    // Also check when clicking anywhere (for overlay clicks)
    document.addEventListener('click', handleBodyScroll);

    return () => {
      window.removeEventListener('resize', handleBodyScroll);
      document.removeEventListener('click', handleBodyScroll);
      document.body.classList.remove('menu-open');
    };
  }, []);

  return (
    <AuthProvider>
      <CartProvider>
        <Router>
          <div className="App">
            <Navbar />
            <main>
              <Routes>
                <Route path="/" element={<Home />} />
                <Route path="/products" element={<Products />} />
                <Route path="/product/:id" element={<ProductDetail />} />
                <Route path="/profile" element={<CustomerProfile />} />
                <Route path="/cart" element={<Cart />} />
                <Route path="/checkout" element={<Checkout />} />
                <Route path="/order-success" element={<OrderSuccess />} />
                <Route path="/login" element={<Login />} />
                <Route path="/register" element={<Register />} />
                <Route path="/supplier-dashboard" element={<SupplierDashboard />} />
                <Route path="/my-orders" element={<CustomerOrders />} />
              </Routes>
            </main>
            <Footer />
            <ToastContainer position="bottom-right" />
          </div>
        </Router>
      </CartProvider>
    </AuthProvider>
  );
}

export default App;