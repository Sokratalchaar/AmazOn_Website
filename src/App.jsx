import React, { useState, useEffect } from 'react';
import { BrowserRouter as Router, Routes, Route, Navigate, useNavigate, useLocation } from 'react-router-dom';
import Navbar from './components/Navbar';
import Home from './pages/Home';
import Checkout from './pages/Checkout';
import Admin from './pages/Admin';
import Login from './pages/Login';
import Register from './pages/Register';
import MyOrders from './pages/MyOrders';
import AdminOrders from './pages/AdminOrders';
import OrderDetails from './pages/OrderDetails';
import ProductDetails from './pages/ProductDetails';
import { CartProvider } from './context/CartContext';
import { AuthProvider, useAuth } from './context/AuthContext';
import './App.css';

const ProtectedAdminRoute = ({ children }) => {
  const { isAdmin } = useAuth();
  if (!isAdmin) {
    return <Navigate to="/" />;
  }
  return children;
};

// Track whether the page originally booted up with active Google OAuth credentials in the URL
let initialHasAuthParams = false;

const stripAuthParamsFromURL = () => {
  const hasAuthParams = 
    (window.location.hash && (window.location.hash.includes('access_token=') || window.location.hash.includes('id_token='))) ||
    (window.location.search && (window.location.search.includes('code=') || window.location.search.includes('error=') || window.location.search.includes('access_token=')));

  if (hasAuthParams) {
    initialHasAuthParams = true;
    // Wipe credentials immediately from the address bar synchronously on boot,
    // ensuring the browser history stack never records the dirty URL.
    window.history.replaceState(null, '', window.location.pathname);
  }
};
stripAuthParamsFromURL();

const AuthCallbackHandler = () => {
  const { user, isAdmin, loading } = useAuth();
  const navigate = useNavigate();

  useEffect(() => {
    if (initialHasAuthParams) {
      if (user) {
        const targetRoute = isAdmin ? '/admin' : '/';
        // Cleanly redirect the successful login to the homepage/dashboard
        navigate(targetRoute, { replace: true });
        initialHasAuthParams = false;
      } else if (!loading) {
        // Safe Fallback Redirect: If the auth load finished but user remains null,
        // it means the OAuth callback is stale, expired, or already consumed.
        // We cleanly redirect them to the home page to avoid rendering a broken screen.
        navigate('/', { replace: true });
        initialHasAuthParams = false;
      }
    }
  }, [user, isAdmin, loading, navigate]);

  return null;
};

function App() {
  const [searchTerm, setSearchTerm] = useState('');

  return (
    <AuthProvider>
      <CartProvider>
        <Router>
          <AuthCallbackHandler />
          <div className="app">
            <Navbar onSearch={setSearchTerm} />
            <Routes>
              <Route path="/" element={<Home searchTerm={searchTerm} />} />
              <Route path="/checkout" element={<Checkout />} />
              <Route path="/login" element={<Login />} />
              <Route path="/register" element={<Register />} />
              <Route path="/admin" element={
                <ProtectedAdminRoute>
                  <Admin />
                </ProtectedAdminRoute>
              } />
              <Route path="/admin/orders" element={
                <ProtectedAdminRoute>
                  <AdminOrders />
                </ProtectedAdminRoute>
              } />
              <Route path="/my-orders" element={<MyOrders />} />
              <Route path="/orders/:id" element={<OrderDetails />} />
              <Route path="/products/:id" element={<ProductDetails />} />
              {/* Fallback route to redirect unmatched paths cleanly to the homepage */}
              <Route path="*" element={<Navigate to="/" replace />} />
            </Routes>
            
            <footer className="footer">
            <div className="container">
              <p>&copy; {new Date().getFullYear()} Amazeon Mock. All rights reserved.</p>
            </div>
          </footer>
        </div>
        </Router>
      </CartProvider>
    </AuthProvider>
  );
}

export default App;
