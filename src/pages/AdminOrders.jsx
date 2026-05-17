import React, { useState, useEffect } from 'react';
import { useAuth } from '../context/AuthContext';
import { supabase } from '../lib/supabase';
import { Navigate } from 'react-router-dom';
import { Package, User as UserIcon, Calendar, DollarSign, Hash, RefreshCw, AlertCircle } from 'lucide-react';
import './AdminOrders.css';

const AdminOrders = () => {
  const { isAdmin, user } = useAuth();
  const [orders, setOrders] = useState([]);
  const [loading, setLoading] = useState(true);
  const [fetchError, setFetchError] = useState(null);

  const fetchAllOrders = async () => {
    setLoading(true);
    setFetchError(null);
    try {
      console.log('[AdminOrders] Fetching all orders with nested items...');
      
      // Step 1: Fetch orders with nested items and products
      const { data, error } = await supabase
        .from('orders')
        .select(`
          *,
          order_items (
            *,
            products (*)
          )
        `)
        .order('created_at', { ascending: false });

      if (error) {
        console.error('[AdminOrders] Primary Fetch Error:', error);
        setFetchError(error.message);
        return;
      }

      console.log(`[AdminOrders] Fetched ${data?.length || 0} orders.`);
      
      // Step 2: Check if any items are missing (common RLS or relationship issue)
      const anyItemsFound = data?.some(order => order.order_items && order.order_items.length > 0);
      
      if (data && data.length > 0 && !anyItemsFound) {
        console.warn('[AdminOrders] Nested items missing. Attempting fallback direct fetch...');
        
        const orderIds = data.map(o => o.id);
        const { data: fallbackItems, error: fallbackError } = await supabase
          .from('order_items')
          .select('*, products(*)')
          .in('order_id', orderIds);
          
        console.log("ORDERS RAW:", data);
        console.log("ORDER ITEMS RAW:", fallbackItems);

        if (!fallbackError && fallbackItems) {
          console.log(`[AdminOrders] Fallback fetch successful. Found ${fallbackItems.length} items.`);
          
          // Map items back to orders
          const itemsByOrderId = {};
          fallbackItems.forEach(item => {
            if (!itemsByOrderId[item.order_id]) itemsByOrderId[item.order_id] = [];
            itemsByOrderId[item.order_id].push(item);
          });
          
          const mergedData = data.map(order => ({
            ...order,
            order_items: itemsByOrderId[order.id] || []
          }));
          
          console.log("MERGED RESULT:", mergedData);
          setOrders(mergedData);
          return;
        } else {
          console.error('[AdminOrders] Fallback fetch failed:', fallbackError);
          console.log("MERGED RESULT:", data); // Even if it failed, log the "result" which is just orders
        }
      }

      setOrders(data || []);
    } catch (err) {
      console.error('[AdminOrders] Unexpected error:', err);
      setFetchError(err.message);
    } finally {
      setLoading(false);
    }
  };

  const updateOrderStatus = async (orderId, newStatus) => {
    try {
      const { error } = await supabase
        .from('orders')
        .update({ order_status: newStatus })
        .eq('id', orderId);

      if (error) throw error;
      
      // Update local state to reflect change instantly
      setOrders(prev => prev.map(o => o.id === orderId ? { ...o, order_status: newStatus } : o));
    } catch (err) {
      console.error('[AdminOrders] Status update failed:', err);
      alert(`Failed to update status: ${err.message}`);
    }
  };

  useEffect(() => {
    if (isAdmin) {
      fetchAllOrders();
    } else {
      setLoading(false);
    }
  }, [isAdmin]);

  if (!isAdmin) {
    return <Navigate to="/" />;
  }

  if (loading) {
    return (
      <div className="admin-loading-container">
        <div className="loading-spinner-orders"></div>
        <p>Loading all orders...</p>
      </div>
    );
  }

  const totalItemsSold = orders.reduce(
    (sum, o) => sum + (o.order_items?.reduce((s, i) => s + i.quantity, 0) || 0),
    0
  );

  return (
    <div className="admin-orders-page animate-fade-in">
      <div className="admin-orders-container">
        <div className="admin-header">
          <div>
            <h1>Admin Dashboard</h1>
            <p>Manage and track all customer orders</p>
          </div>
          <button
            className="refresh-btn"
            onClick={fetchAllOrders}
            title="Refresh orders"
          >
            <RefreshCw size={16} /> Refresh Orders
          </button>
        </div>

        {fetchError && (
          <div className="fetch-error-banner">
            <AlertCircle size={20} />
            <span><strong>System Notice:</strong> {fetchError}</span>
          </div>
        )}

        <div className="orders-metrics">
          <div className="metric-card">
            <div className="metric-icon"><Package size={26} /></div>
            <div className="metric-info">
              <h3>Total Orders</h3>
              <p className="metric-value">{orders.length}</p>
            </div>
          </div>
          <div className="metric-card">
            <div className="metric-icon revenue"><DollarSign size={26} /></div>
            <div className="metric-info">
              <h3>Total Revenue</h3>
              <p className="metric-value">
                ${orders.reduce((sum, o) => sum + Number(o.total), 0).toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
              </p>
            </div>
          </div>
          <div className="metric-card">
            <div className="metric-icon items-sold"><Hash size={26} /></div>
            <div className="metric-info">
              <h3>Items Sold</h3>
              <p className="metric-value">{totalItemsSold}</p>
            </div>
          </div>
        </div>

        <div className="admin-orders-list">
          {orders.length === 0 ? (
            <div className="empty-state">
              <Package size={64} strokeWidth={1} color="#cbd5e1" />
              <p>No customer orders found in the system.</p>
            </div>
          ) : (
            orders.map(order => {
              const items = order.order_items || [];
              const totalUnits = items.reduce((sum, i) => sum + i.quantity, 0);
              
              return (
                <div key={order.id} className="admin-order-card">
                  <div className="admin-order-header">
                    <div className="header-main">
                      <div className="order-id-badge">
                        <span>#{order.id.split('-')[0].toUpperCase()}</span>
                      </div>
                      <div className="order-user">
                        <UserIcon size={16} />
                        <span>
                          {order.user_email || `User: ${order.user_id?.split('-')[0]}...`}
                        </span>
                      </div>
                      
                      <div className="status-control-container">
                        <select 
                          className={`status-select ${order.order_status?.toLowerCase() || 'pending'}`}
                          value={order.order_status || 'Pending'}
                          onChange={(e) => updateOrderStatus(order.id, e.target.value)}
                        >
                          <option value="Pending">Pending</option>
                          <option value="Processing">Processing</option>
                          <option value="Shipped">Shipped</option>
                          <option value="Delivered">Delivered</option>
                          <option value="Cancelled">Cancelled</option>
                        </select>
                      </div>
                    </div>
                    <div className="header-meta">
                      <div className="order-date">
                        <span>{new Date(order.created_at).toLocaleDateString(undefined, {
                          year: 'numeric',
                          month: 'long',
                          day: 'numeric',
                          hour: '2-digit',
                          minute: '2-digit'
                        })}</span>
                      </div>
                      <div className="order-total-highlight">
                        ${Number(order.total).toFixed(2)}
                      </div>
                    </div>
                  </div>

                  <div className="admin-order-body">
                    <div className="items-section">
                      <h4>
                        Order Items ({items.length}) 
                        <span className="total-items-badge">
                          {totalUnits} unit{totalUnits !== 1 ? 's' : ''} total
                        </span>
                      </h4>
                      
                      {items.length > 0 ? (
                        <div className="admin-items-grid">
                          <div className="grid-header">
                            <span>Product</span>
                            <span>Unit Price</span>
                            <span>Quantity</span>
                            <span>Subtotal</span>
                          </div>
                          {items.map((item, idx) => (
                            <div key={item.id || idx} className="grid-row">
                              <div className="product-col">
                                <div className="product-content-wrapper">
                                  {item.products?.image ? (
                                    <img
                                      src={item.products.image}
                                      alt={item.products?.name || ''}
                                      className="tiny-img"
                                      onError={(e) => { 
                                        e.target.onerror = null;
                                        e.target.src = 'https://via.placeholder.com/100?text=No+Image';
                                      }}
                                    />
                                  ) : (
                                    <div className="tiny-img-placeholder">
                                      <Package size={24} />
                                    </div>
                                  )}
                                  <div className="product-meta-data">
                                    <span className="product-name-text">
                                      {item.products?.name || `Product ${(item.product_id || '').split('-')[0]}`}
                                    </span>
                                    {item.products?.category && (
                                      <span className="product-category-text">{item.products.category}</span>
                                    )}
                                  </div>
                                </div>
                              </div>
                              <div className="unit-price-col">
                                <span>${Number(item.price).toFixed(2)}</span>
                              </div>
                              <div className="quantity-col">
                                <span className="qty-badge">x{item.quantity}</span>
                              </div>
                              <div className="subtotal-col">
                                <span>${(Number(item.price) * item.quantity).toFixed(2)}</span>
                              </div>
                            </div>
                          ))}
                        </div>
                      ) : (
                        <div className="no-items-msg">
                          <AlertCircle size={20} />
                          <p>Data integrity warning: No items associated with this order.</p>
                        </div>
                      )}
                    </div>
                  </div>
                </div>
              );
            })
          )}
        </div>
      </div>
    </div>
  );
};

export default AdminOrders;
