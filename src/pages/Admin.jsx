import React, { useState, useEffect } from 'react';
import { Edit2, Trash2, Plus, Package, ShoppingBag } from 'lucide-react';
import { supabase } from '../lib/supabase';
import './Admin.css';

const Admin = () => {
  const [activeTab, setActiveTab] = useState('products');
  const [products, setProducts] = useState([]);
  const [orders, setOrders] = useState([]);
  
  // Product Modal State
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [editingProduct, setEditingProduct] = useState(null);
  const [formData, setFormData] = useState({
    name: '', price: '', description: '', image: '', category: '', stock: 0
  });

  const fetchProducts = async () => {
    try {
      const { data, error } = await supabase.from('products').select('*').order('created_at', { ascending: false });
      if (error) throw error;
      setProducts(data || []);
    } catch (error) {
      console.error('Error fetching products:', error);
    }
  };

  const fetchOrders = async () => {
    try {
      const { data, error } = await supabase
        .from('orders')
        .select('*, order_items(*, products(name))')
        .order('created_at', { ascending: false });
      if (error) throw error;
      setOrders(data || []);
    } catch (error) {
      console.error('Error fetching orders:', error);
    }
  };

  useEffect(() => {
    if (activeTab === 'products') {
      fetchProducts();
    } else {
      fetchOrders();
    }
  }, [activeTab]);

  const handleOpenModal = (product = null) => {
    if (product) {
      setEditingProduct(product);
      setFormData({
        name: product.name || product.title,
        price: product.price,
        description: product.description,
        image: product.image,
        category: product.category,
        stock: product.stock || 0
      });
    } else {
      setEditingProduct(null);
      setFormData({ name: '', price: '', description: '', image: '', category: '', stock: 0 });
    }
    setIsModalOpen(true);
  };

  const handleCloseModal = () => {
    setIsModalOpen(false);
    setEditingProduct(null);
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    try {
      const dataToSave = {
        ...formData,
        price: parseFloat(formData.price),
        stock: parseInt(formData.stock)
      };

      if (editingProduct) {
        const { error } = await supabase
          .from('products')
          .update(dataToSave)
          .eq('id', editingProduct.id);
        if (error) throw error;
      } else {
        const { error } = await supabase
          .from('products')
          .insert([dataToSave]);
        if (error) throw error;
      }
      fetchProducts();
      handleCloseModal();
    } catch (error) {
      console.error('Error saving product:', error.message || error, error.details);
      alert(`Failed to save product: ${error.message || error.toString()}`);
    }
  };

  const handleDelete = async (id) => {
    if (window.confirm('Are you sure you want to delete this product?')) {
      try {
        const { error } = await supabase
          .from('products')
          .delete()
          .eq('id', id);
        if (error) throw error;
        fetchProducts();
      } catch (error) {
        console.error('Error deleting product:', error);
        alert('Failed to delete product');
      }
    }
  };

  const getStockStatus = (stock) => {
    if (stock <= 0) return { label: 'Out of Stock', class: 'status-out' };
    if (stock <= 5) return { label: `Low Stock: ${stock} left`, class: 'status-low' };
    return { label: `In Stock: ${stock}`, class: 'status-in' };
  };

  return (
    <div className="container admin-page animate-fade-in">
      {isModalOpen ? (
        <div className="admin-form-container animate-fade-in">
          <div className="admin-header">
            <h2>{editingProduct ? 'Edit Product' : 'Add New Product'}</h2>
          </div>
          <form onSubmit={handleSubmit} className="admin-form">
            <div className="form-group">
              <label>Name</label>
              <input required type="text" value={formData.name} onChange={e => setFormData({...formData, name: e.target.value})} />
            </div>
            <div className="form-grid">
              <div className="form-group">
                <label>Price ($)</label>
                <input required type="number" step="0.01" value={formData.price} onChange={e => setFormData({...formData, price: e.target.value})} />
              </div>
              <div className="form-group">
                <label>Stock Quantity</label>
                <input required type="number" value={formData.stock} onChange={e => setFormData({...formData, stock: e.target.value})} />
              </div>
            </div>
            <div className="form-group">
              <label>Category</label>
              <input required type="text" value={formData.category} onChange={e => setFormData({...formData, category: e.target.value})} />
            </div>
            <div className="form-group">
              <label>Image URL</label>
              <input required type="url" value={formData.image} onChange={e => setFormData({...formData, image: e.target.value})} />
            </div>
            <div className="form-group">
              <label>Description</label>
              <textarea required rows="5" value={formData.description} onChange={e => setFormData({...formData, description: e.target.value})}></textarea>
            </div>
            <div className="form-actions">
              <button type="button" className="btn btn-outline" onClick={handleCloseModal}>Cancel</button>
              <button type="submit" className="btn btn-primary">Save Product</button>
            </div>
          </form>
        </div>
      ) : (
        <>
          <div className="admin-header">
            <h1>Admin Dashboard</h1>
            {activeTab === 'products' && (
              <button className="btn btn-primary" onClick={() => handleOpenModal()}>
                <Plus size={18} /> Add New Product
              </button>
            )}
          </div>

          <div style={{ display: 'flex', gap: '20px', marginBottom: '30px' }}>
            <button 
              className={`btn ${activeTab === 'products' ? 'btn-primary' : 'btn-outline'}`}
              onClick={() => setActiveTab('products')}
            >
              <ShoppingBag size={18} /> Products
            </button>
            <button 
              className={`btn ${activeTab === 'orders' ? 'btn-primary' : 'btn-outline'}`}
              onClick={() => setActiveTab('orders')}
            >
              <Package size={18} /> Orders
            </button>
          </div>

          {activeTab === 'products' ? (
            <div className="admin-list">
              {products.map(product => {
                const stockStatus = getStockStatus(product.stock);
                return (
                  <div key={product.id} className="admin-item">
                    <img src={product.image} alt={product.name} className="admin-item-img" />
                    <div className="admin-item-info">
                      <div className="admin-item-title">{product.name}</div>
                      <div className="admin-item-meta">
                        <span className="admin-item-price">${product.price}</span>
                        <span className={`stock-badge ${stockStatus.class}`}>{stockStatus.label}</span>
                      </div>
                    </div>
                    <div className="admin-actions">
                      <button className="btn btn-outline" onClick={() => handleOpenModal(product)}>
                        <Edit2 size={16} />
                      </button>
                      <button className="btn btn-outline" style={{ color: 'var(--danger)', borderColor: 'var(--danger)' }} onClick={() => handleDelete(product.id)}>
                        <Trash2 size={16} />
                      </button>
                    </div>
                  </div>
                );
              })}
              {products.length === 0 && <div style={{ padding: '20px', textAlign: 'center' }}>No products found.</div>}
            </div>
          ) : (
            <div className="admin-list">
              {orders.map(order => (
                <div key={order.id} className="admin-item" style={{ flexDirection: 'column', alignItems: 'flex-start', gap: '10px' }}>
                  <div style={{ display: 'flex', justifyContent: 'space-between', width: '100%', borderBottom: '1px solid var(--border)', paddingBottom: '10px' }}>
                    <div><strong>Order ID:</strong> {order.id.substring(0, 8)}...</div>
                    <div><strong>Total:</strong> ${order.total}</div>
                    <div><strong>Date:</strong> {new Date(order.created_at).toLocaleString()}</div>
                  </div>
                  <div style={{ width: '100%' }}>
                    <strong style={{ fontSize: '14px', color: 'var(--text-light)' }}>Items:</strong>
                    <ul style={{ listStyleType: 'none', padding: 0, marginTop: '5px' }}>
                      {order.order_items?.map(item => (
                        <li key={item.id} style={{ display: 'flex', justifyContent: 'space-between', fontSize: '14px', marginBottom: '4px' }}>
                          <span>{item.quantity}x {item.products?.name || item.products?.title || 'Unknown Product'}</span>
                          <span>${item.price}</span>
                        </li>
                      ))}
                    </ul>
                  </div>
                </div>
              ))}
              {orders.length === 0 && <div style={{ padding: '20px', textAlign: 'center' }}>No orders found.</div>}
            </div>
          )}
        </>
      )}
    </div>
  );
};

export default Admin;
