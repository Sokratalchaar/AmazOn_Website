import React, { useState } from 'react';
import { Link } from 'react-router-dom';
import { Minus, Plus, Trash2, CreditCard } from 'lucide-react';
import { useCart } from '../context/CartContext';
import { useAuth } from '../context/AuthContext';
import { supabase } from '../lib/supabase';
import './Checkout.css';

const Checkout = () => {
  const { cart, updateQuantity, removeFromCart, totalItems, totalPrice, clearCart } = useCart();
  const { user } = useAuth();
  const [checkoutComplete, setCheckoutComplete] = useState(false);
  const [isProcessing, setIsProcessing] = useState(false);

  const handleCheckout = async () => {
    if (cart.length === 0) return;
    
    if (!user || !user.id) {
      console.error("Checkout aborted: user or user.id is missing.", user);
      alert("Please login to proceed to checkout");
      return;
    }

    setIsProcessing(true);
    try {
      // 1. Fetch fresh session and user
      const { data: { user: authUser } } = await supabase.auth.getUser();
      
      if (!authUser || !authUser.id) {
        throw new Error("Session expired. Please login again.");
      }
      
      // 2. Prepare items for RPC
      const orderItems = cart.map(item => ({
        product_id: item.id,
        quantity: item.quantity,
        price: item.price
      }));

      // 3. Call atomic RPC function
      const { data, error } = await supabase.rpc('place_order', {
        p_user_id: authUser.id,
        p_total: totalPrice * 1.08,
        p_items: orderItems
      });

      if (error) {
        if (error.message.includes('Insufficient stock')) {
          // Extract product ID if possible or just show generic message
          throw new Error('Some items in your cart are no longer available in the requested quantity. Please check stock levels.');
        }
        throw error;
      }

      console.log("ORDER PLACED SUCCESSFULLY:", data);

      // 4. Clear cart
      await clearCart();
      setCheckoutComplete(true);
    } catch (error) {
      console.error("Checkout failed details:", error);
      alert(`Checkout failed: ${error.message || 'Please try again.'}`);
    } finally {
      setIsProcessing(false);
    }
  };

  if (checkoutComplete) {
    return (
      <div className="container checkout-page">
        <div className="empty-cart animate-fade-in">
          <h2>Thank you for your order!</h2>
          <p style={{marginBottom: '20px'}}>Your mock order has been successfully placed.</p>
          <Link to="/" className="btn btn-primary">Continue Shopping</Link>
        </div>
      </div>
    );
  }

  if (cart.length === 0) {
    return (
      <div className="container checkout-page">
        <div className="empty-cart">
          <h2>Your Amazon Cart is empty.</h2>
          <p style={{marginBottom: '20px'}}>Your Shopping Cart lives to serve. Give it purpose — fill it with groceries, clothing, household supplies, electronics, and more.</p>
          <Link to="/" className="btn btn-primary">Continue Shopping</Link>
        </div>
      </div>
    );
  }

  return (
    <div className="container checkout-page animate-fade-in">
      <h1>Shopping Cart</h1>
      
      <div className="checkout-container">
        <div className="cart-section">
          {cart.map((item) => (
            <div key={item.id} className="cart-item">
              <img src={item.image} alt={item.name} className="cart-item-image" />
              <div className="cart-item-details">
                <h3 className="cart-item-title">{item.name}</h3>
                <div className="cart-item-price">${item.price.toFixed(2)}</div>
                <p style={{color: '#067D62', fontSize: '14px', marginBottom: '15px'}}>In Stock</p>
                
                <div className="cart-item-actions">
                  <div className="quantity-controls">
                    <button 
                      className="quantity-btn" 
                      onClick={() => updateQuantity(item.id, -1)}
                      disabled={item.quantity <= 1}
                    >
                      <Minus size={16} />
                    </button>
                    <span className="quantity-display">{item.quantity}</span>
                    <button 
                      className="quantity-btn" 
                      onClick={() => updateQuantity(item.id, 1)}
                    >
                      <Plus size={16} />
                    </button>
                  </div>
                  <span style={{color: '#ddd'}}>|</span>
                  <button 
                    className="delete-btn" 
                    onClick={() => removeFromCart(item.id)}
                  >
                    Delete
                  </button>
                </div>
              </div>
            </div>
          ))}
        </div>
        
        <div className="summary-section">
          <div className="summary-card">
            <h2>Order Summary</h2>
            <div className="summary-row">
              <span>Items ({totalItems}):</span>
              <span>${totalPrice.toFixed(2)}</span>
            </div>
            <div className="summary-row">
              <span>Shipping & handling:</span>
              <span>$0.00</span>
            </div>
            <div className="summary-row">
              <span>Total before tax:</span>
              <span>${totalPrice.toFixed(2)}</span>
            </div>
            <div className="summary-row">
              <span>Estimated tax to be collected:</span>
              <span>${(totalPrice * 0.08).toFixed(2)}</span>
            </div>
            
            <div className="summary-row total">
              <span>Order total:</span>
              <span>${(totalPrice * 1.08).toFixed(2)}</span>
            </div>
            
            <button className="btn btn-primary checkout-btn" onClick={handleCheckout} disabled={isProcessing}>
              <CreditCard size={20} />
              {isProcessing ? 'Processing...' : 'Proceed to Checkout'}
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};

export default Checkout;
