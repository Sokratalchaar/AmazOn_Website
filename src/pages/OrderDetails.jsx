import React, { useState, useEffect } from 'react';
import { useParams, Link, Navigate } from 'react-router-dom';
import { supabase } from '../lib/supabase';
import { useAuth } from '../context/AuthContext';
import { ChevronLeft, Package, Calendar, MapPin, CreditCard, Clock } from 'lucide-react';
import './OrderDetails.css';

const OrderDetails = () => {
  const { id } = useParams();
  const { user } = useAuth();
  const [order, setOrder] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchOrderDetails = async () => {
      if (!user) return;
      try {
        const { data, error } = await supabase
          .from('orders')
          .select(`
            *,
            order_items (
              quantity,
              price,
              products (
                name,
                image,
                price
              )
            )
          `)
          .eq('id', id)
          .single();

        if (error) {
          console.error('Error fetching order details:', error);
          return;
        }

        console.log(`[OrderDetails] Fetched order ${id} with ${data?.order_items?.length || 0} items`);
        setOrder(data);
      } catch (err) {
        console.error('Unexpected error:', err);
      } finally {
        setLoading(false);
      }
    };

    fetchOrderDetails();
  }, [id, user]);

  if (!user) return <Navigate to="/login" />;

  if (loading) {
    return (
      <div className="order-details-loading">
        <div className="loading-spinner-orders"></div>
        <p>Loading order details...</p>
      </div>
    );
  }

  if (!order) {
    return (
      <div className="container order-details-page">
        <div className="error-state">
          <h2>Order not found</h2>
          <p>We couldn't find the order you're looking for.</p>
          <Link to="/my-orders" className="btn btn-primary">Back to My Orders</Link>
        </div>
      </div>
    );
  }

  return (
    <div className="container order-details-page animate-fade-in">
      <div className="breadcrumb">
        <Link to="/my-orders" className="back-link">
          <ChevronLeft size={18} />
          <span>Back to My Orders</span>
        </Link>
      </div>

      <div className="order-details-header">
        <h1>Order Details</h1>
        <div className="order-meta-info">
          <span>Ordered on {new Date(order.created_at).toLocaleDateString()}</span>
          <span className="separator">|</span>
          <span>Order # {order.id}</span>
        </div>
      </div>

      <div className="order-details-grid">
        <div className="details-card">
          <div className="card-section">
            <h3>Shipping Address</h3>
            <p>Test User</p>
            <p>123 Mock Street</p>
            <p>Apt 4B</p>
            <p>Sample City, SC 12345</p>
            <p>United States</p>
          </div>
          <div className="card-section">
            <h3>Payment Method</h3>
            <div className="payment-info">
              <CreditCard size={18} />
              <span>Visa ending in 1234</span>
            </div>
          </div>
          <div className="card-section summary">
            <h3>Order Summary</h3>
            <div className="summary-row">
              <span>Item(s) Subtotal:</span>
              <span>${(Number(order.total) / 1.08).toFixed(2)}</span>
            </div>
            <div className="summary-row">
              <span>Shipping & Handling:</span>
              <span>$0.00</span>
            </div>
            <div className="summary-row">
              <span>Total before tax:</span>
              <span>${(Number(order.total) / 1.08).toFixed(2)}</span>
            </div>
            <div className="summary-row">
              <span>Estimated tax to be collected:</span>
              <span>${(Number(order.total) - (Number(order.total) / 1.08)).toFixed(2)}</span>
            </div>
            <div className="summary-row grand-total">
              <span>Grand Total:</span>
              <span>${Number(order.total).toFixed(2)}</span>
            </div>
          </div>
        </div>

        <div className="items-card">
          <div className="items-header">
            <div className="status-badge">
              <Clock size={16} />
              <span>Preparing for shipment</span>
            </div>
          </div>
          <div className="order-items-list">
            {order.order_items && order.order_items.map((item, idx) => (
              <div key={idx} className="detail-item">
                <div className="detail-item-image">
                  <img src={item.products?.image || 'https://via.placeholder.com/100'} alt={item.products?.name} />
                </div>
                <div className="detail-item-info">
                  <h4>{item.products?.name}</h4>
                  <p className="sold-by">Sold by: Amazeon Mock</p>
                  <p className="item-price">${Number(item.price).toFixed(2)}</p>
                  <div className="item-quantity-badge">Qty: {item.quantity}</div>
                  <div className="item-actions-row">
                    <button className="btn-buy-again">Buy it again</button>
                  </div>
                </div>
              </div>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
};

export default OrderDetails;
