import React, { useState, useEffect } from 'react';
import { supabase } from '../lib/supabase';
import { useAuth } from '../context/AuthContext';
import { useCart } from '../context/CartContext';
import { Link, useNavigate } from 'react-router-dom';
import { Package, Calendar, ShoppingBag, ChevronRight, Eye, Truck, Archive, ArchiveRestore, Star } from 'lucide-react';
import './MyOrders.css';

const MyOrders = () => {
  const { user } = useAuth();
  const { addToCart } = useCart();
  const navigate = useNavigate();
  const [orders, setOrders] = useState([]);
  const [loading, setLoading] = useState(true);
  const [activeTab, setActiveTab] = useState('orders'); // 'orders' or 'archived'
  const [addingToCart, setAddingToCart] = useState(null);
  const [selectedProduct, setSelectedProduct] = useState(null);
  const [showReviewModal, setShowReviewModal] = useState(false);
  const [reviewRating, setReviewRating] = useState(5);
  const [reviewComment, setReviewComment] = useState('');
  const [submittingReview, setSubmittingReview] = useState(false);
  const [reviewError, setReviewError] = useState(null);

  useEffect(() => {
    if (user) {
      fetchOrders();
    } else {
      setLoading(false);
      setOrders([]);
    }
  }, [user, activeTab]);

  const fetchOrders = async () => {
    setLoading(true);
    try {
      const isArchived = activeTab === 'archived';
      const { data, error } = await supabase
        .from('orders')
        .select(`
          *,
          order_items (
            *,
            products (*)
          )
        `)
        .eq('user_id', user?.id)
        .eq('is_archived', isArchived)
        .order('created_at', { ascending: false });

      if (error) throw error;
      setOrders(data || []);
    } catch (error) {
      console.error('Error fetching orders:', error.message);
    } finally {
      setLoading(false);
    }
  };

  const handleArchiveOrder = async (orderId, shouldArchive) => {
    try {
      const { error } = await supabase
        .from('orders')
        .update({ is_archived: shouldArchive })
        .eq('id', orderId);

      if (error) throw error;
      
      // Refresh list
      fetchOrders();
    } catch (error) {
      console.error('Error updating order archive status:', error.message);
      alert('Failed to update order status');
    }
  };

  const handleBuyAgain = (product) => {
    if (!product) return;
    setAddingToCart(product.id);
    addToCart(product);
    setTimeout(() => setAddingToCart(null), 2000);
  };

  const setReviewProductHandler = (item) => {
    setSelectedProduct(item);
    setShowReviewModal(true);
    setReviewRating(5);
    setReviewComment('');
    setReviewError(null);
  };

  const handleSubmitReview = async () => {
    if (!reviewRating) {
      setReviewError('Please select a rating');
      return;
    }
    
    setSubmittingReview(true);
    setReviewError(null);
    
    try {
      const { error } = await supabase
        .from('reviews')
        .upsert({
          user_id: user.id,
          product_id: selectedProduct?.products?.id,
          rating: reviewRating,
          comment: reviewComment,
          created_at: new Date().toISOString()
        }, { onConflict: 'user_id,product_id' });

      if (error) throw error;
      
      setShowReviewModal(false);
      setSelectedProduct(null);
    } catch (error) {
      console.error('Error submitting review:', error.message);
      setReviewError('Failed to submit review. Please try again.');
    } finally {
      setSubmittingReview(false);
    }
  };

  if (!user) {
    return (
      <div className="my-orders-page animate-fade-in">
        <div className="container">
          <div className="orders-wrapper">
            <div className="empty-orders-card">
              <Package size={64} color="#e2e8f0" />
              <h2>Please sign in to view your orders</h2>
              <p>You need to be logged in to access your order history.</p>
              <Link to="/login" className="btn btn-primary">Sign In</Link>
            </div>
          </div>
        </div>
      </div>
    );
  }

  return (
    <>
      <div className="my-orders-page animate-fade-in">
      <div className="container">
        <div className="orders-wrapper">
          <div className="orders-header-section">
            <h1>Your Orders</h1>
            <div className="orders-tabs">
              <button 
                className={`tab-btn ${activeTab === 'orders' ? 'active' : ''}`}
                onClick={() => setActiveTab('orders')}
              >
                Orders
              </button>
              <button 
                className={`tab-btn ${activeTab === 'archived' ? 'active' : ''}`}
                onClick={() => setActiveTab('archived')}
              >
                Cancelled/Archived
              </button>
            </div>
          </div>

          {loading ? (
            <div className="orders-loading-container">
              <div className="loading-spinner-orders"></div>
              <p>Loading your order history...</p>
            </div>
          ) : orders.length === 0 ? (
            <div className="empty-orders-card">
              <Package size={64} color="#e2e8f0" />
              <h2>No {activeTab === 'archived' ? 'archived' : ''} orders found</h2>
              <p>You haven't placed any orders yet. Once you do, they'll appear here.</p>
              <Link to="/" className="btn btn-primary">Start Shopping</Link>
            </div>
          ) : (
            <div className="orders-list">
              {orders.map(order => (
                <div key={order.id} className="order-card-modern">
                  <div className="order-card-header">
                    <div className="order-header-main">
                      <div className="header-meta">
                        <div className="meta-item">
                          <span className="meta-label">ORDER PLACED</span>
                          <span className="meta-value">
                            {new Date(order.created_at).toLocaleDateString(undefined, { 
                              year: 'numeric', 
                              month: 'long', 
                              day: 'numeric' 
                            })}
                          </span>
                        </div>
                        <div className="meta-item">
                          <span className="meta-label">TOTAL</span>
                          <span className="meta-value total-price-bold">${Number(order.total).toFixed(2)}</span>
                        </div>
                        <div className="meta-item SHIP-TO">
                          <span className="meta-label">SHIP TO</span>
                          <span className="meta-value user-name">{user?.email?.split('@')[0] || 'Customer'}</span>
                        </div>
                      </div>
                      <div className="header-order-id">
                        <span className="meta-label">ORDER # {order.id.split('-')[0].toUpperCase()}</span>
                        <div className="header-actions-top">
                          <Link to={`/orders/${order.id}`} className="link-details">View order details</Link>
                          <span className="action-divider">|</span>
                          <button 
                            className="btn-text-action"
                            onClick={() => handleArchiveOrder(order.id, activeTab === 'orders')}
                          >
                            {activeTab === 'orders' ? 'Archive order' : 'Restore order'}
                          </button>
                        </div>
                      </div>
                    </div>
                  </div>
                  
                  <div className="order-card-body">
                    <div className="delivery-status">
                      <div className={`status-indicator-badge ${order.order_status?.toLowerCase() || 'pending'}`}>
                        {order.order_status || 'Pending'}
                      </div>
                      <h2 className="status-title">
                        {order.order_status === 'Delivered' ? 'Delivered' : 
                         order.order_status === 'Shipped' ? 'In Transit' :
                         order.order_status === 'Processing' ? 'Preparing for shipment' :
                         order.order_status === 'Cancelled' ? 'Cancelled' :
                         'Order Received'}
                      </h2>
                      <p className="status-subtitle">
                        {order.order_status === 'Delivered' ? 'Delivered successfully' : 
                         order.order_status === 'Shipped' ? 'Your order has shipped and is on its way' :
                         order.order_status === 'Processing' ? 'We are preparing your order' :
                         order.order_status === 'Cancelled' ? 'This order has been cancelled' :
                         'Your order is pending approval'}
                      </p>
                    </div>

                    <div className="order-items-grid">
                      {order.order_items.map((item, idx) => (
                        <div key={idx} className="order-product-row">
                          <div className="product-image-large" onClick={() => navigate(`/products/${item.products?.id}`)}>
                            <img 
                              src={item.products?.image || 'https://via.placeholder.com/150'} 
                              alt={item.products?.name} 
                            />
                          </div>
                          <div className="product-details-main">
                            <Link to={`/products/${item.products?.id}`} className="product-title-link">
                              {item.products?.name || 'Premium Item'}
                            </Link>
                            <div className="product-specs">
                              <span className="spec-item">Quantity: <strong>{item.quantity}</strong></span>
                              <span className="spec-item">Price: <strong>${Number(item.price).toFixed(2)}</strong></span>
                            </div>
                            <div className="product-subtotal-row">
                              Subtotal: <span className="subtotal-val">${(item.quantity * item.price).toFixed(2)}</span>
                            </div>
                            <div className="product-buttons-group">
                              <button 
                                className={`btn-action-primary ${addingToCart === item.products?.id ? 'adding' : ''}`}
                                onClick={() => handleBuyAgain(item.products)}
                                disabled={addingToCart === item.products?.id}
                              >
                                <ShoppingBag size={16} /> 
                                {addingToCart === item.products?.id ? 'Added!' : 'Buy it again'}
                              </button>
                              <button 
                                className="btn-action-secondary"
                                onClick={() => navigate(`/products/${item.products?.id}`)}
                              >
                                <Eye size={16} /> View item
                              </button>
                            </div>
                          </div>
                          <div className="product-review-prompt">
                            <button 
                              className="btn-write-review"
                              onClick={(e) => {
                                e.stopPropagation();
                                setReviewProductHandler(item);
                              }}
                            >
                              Write a product review
                            </button>
                          </div>
                        </div>
                      ))}
                    </div>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      </div>
    </div>

      {showReviewModal && selectedProduct && (
        <div className="review-modal-overlay" onClick={() => setShowReviewModal(false)}>
          <div className="review-modal" onClick={(e) => e.stopPropagation()}>
            <h2 className="status-title">Write a product review</h2>
            <p className="review-product-name">{selectedProduct.products?.name || 'Unknown Product'}</p>
            
            <div className="rating-selector">
              {[1, 2, 3, 4, 5].map((s) => (
                <button 
                  key={s} 
                  className="star" 
                  onClick={() => setReviewRating(s)}
                >
                  <Star 
                    size={32} 
                    fill={s <= reviewRating ? "#FF9900" : "none"} 
                    color="#FF9900" 
                  />
                </button>
              ))}
            </div>

            <textarea 
              placeholder="What did you like or dislike? What was the product used for?"
              value={reviewComment}
              onChange={(e) => setReviewComment(e.target.value)}
            />

            {reviewError && <div className="error-msg">{reviewError}</div>}

            <div className="modal-actions">
              <button className="btn-cancel" onClick={() => setShowReviewModal(false)}>Cancel</button>
              <button className="btn-submit" onClick={handleSubmitReview} disabled={submittingReview}>
                {submittingReview ? 'Submitting...' : 'Submit Review'}
              </button>
            </div>
          </div>
        </div>
      )}
    </>
  );
};

export default MyOrders;
