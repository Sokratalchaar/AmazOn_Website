import React, { useState } from 'react';
import { BrowserRouter as Router, Routes, Route } from 'react-router-dom';
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
import { Navigate } from 'react-router-dom';
import './App.css';

const ProtectedAdminRoute = ({ children }) => {
  const { isAdmin } = useAuth();
  if (!isAdmin) {
    return <Navigate to="/" />;
  }
  return children;
};

function App() {
  const [searchTerm, setSearchTerm] = useState('');

  return (
    <AuthProvider>
      <CartProvider>
        <Router>
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
