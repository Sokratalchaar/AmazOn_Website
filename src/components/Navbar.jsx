import React, { useState, useEffect, useRef } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { ShoppingCart, Search, Store, User, LogOut, Package } from 'lucide-react';
import { supabase } from '../lib/supabase';
import { useCart } from '../context/CartContext';
import { useAuth } from '../context/AuthContext';
import './Navbar.css';

const Navbar = ({ onSearch }) => {
  const { totalItems } = useCart();
  const { user, isAdmin, logout } = useAuth();
  const [searchTerm, setSearchTerm] = useState('');
  const [allProducts, setAllProducts] = useState([]);
  const [suggestions, setSuggestions] = useState([]);
  const [showSuggestions, setShowSuggestions] = useState(false);
  const [dropdownOpen, setDropdownOpen] = useState(false);
  const navigate = useNavigate();
  const searchRef = useRef(null);

  useEffect(() => {
    const fetchProducts = async () => {
      try {
        const { data, error } = await supabase.from('products').select('id, name, category, image');
        if (error) throw error;
        setAllProducts(data || []);
      } catch (err) {
        console.error('Error fetching products for suggestions:', err);
      }
    };
    fetchProducts();
  }, []);

  useEffect(() => {
    const handleClickOutside = (event) => {
      if (searchRef.current && !searchRef.current.contains(event.target)) {
        setShowSuggestions(false);
      }
    };
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  useEffect(() => {
    if (searchTerm.trim().length > 0) {
      const filtered = allProducts.filter(p => 
        p.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
        p.category.toLowerCase().includes(searchTerm.toLowerCase())
      ).slice(0, 6);
      setSuggestions(filtered);
      setShowSuggestions(true);
    } else {
      setSuggestions([]);
      setShowSuggestions(false);
    }

    // Trigger main search in real-time
    const timer = setTimeout(() => {
      if (onSearch) onSearch(searchTerm);
    }, 150);

    return () => clearTimeout(timer);
  }, [searchTerm, allProducts, onSearch]);

  const handleSearch = (e) => {
    if (e) e.preventDefault();
    setShowSuggestions(false);
    if (onSearch) {
      onSearch(searchTerm);
    }
    navigate('/');
  };

  const handleSuggestionClick = (productId) => {
    setShowSuggestions(false);
    navigate(`/products/${productId}`);
  };

  const toggleDropdown = () => setDropdownOpen(!dropdownOpen);

  return (
    <header className="navbar">
      <div className="container navbar-container">
        <Link to="/" className="nav-brand">
          <Store size={28} />
          <span>Amaze</span>on
        </Link>

        <form className="nav-search" onSubmit={handleSearch} ref={searchRef}>
          <div className="search-input-wrapper">
            <input
              type="text"
              placeholder="Search products..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              onFocus={() => searchTerm.trim().length > 0 && setShowSuggestions(true)}
            />
            {showSuggestions && suggestions.length > 0 && (
              <div className="search-suggestions">
                {suggestions.map((product) => (
                  <div 
                    key={product.id} 
                    className="suggestion-item"
                    onClick={() => handleSuggestionClick(product.id)}
                  >
                    <div className="suggestion-image">
                      <img src={product.image || 'https://via.placeholder.com/40'} alt="" />
                    </div>
                    <div className="suggestion-info">
                      <p className="suggestion-name">{product.name}</p>
                      <p className="suggestion-category">{product.category}</p>
                    </div>
                  </div>
                ))}
                <div 
                  className="suggestion-item search-more"
                  onClick={handleSearch}
                >
                  <Search size={14} />
                  <span>Search for "{searchTerm}"</span>
                </div>
              </div>
            )}
          </div>
          <button type="submit">
            <Search size={20} />
          </button>
        </form>

        <div className="nav-actions">
          <Link to="/" className="nav-link products-link">Products</Link>
          
          <div className="profile-container">
            {user ? (
              <div className="profile-dropdown-wrapper">
                <button className="profile-trigger" onClick={toggleDropdown}>
                  <div className="profile-avatar">
                    <User size={20} />
                  </div>
                  <span className="profile-name">
                    {user.email.split('@')[0]}
                  </span>
                </button>

                {dropdownOpen && (
                  <>
                    <div className="dropdown-overlay" onClick={() => setDropdownOpen(false)}></div>
                    <div className="profile-dropdown">
                      <div className="dropdown-header">
                        <p className="user-email">{user.email}</p>
                        <p className="user-role">{isAdmin ? 'Administrator' : 'Customer'}</p>
                      </div>
                      
                      <div className="dropdown-divider"></div>
                      
                      <Link to="/my-orders" className="dropdown-item" onClick={() => setDropdownOpen(false)}>
                        <ShoppingCart size={16} /> My Orders
                      </Link>

                      {isAdmin && (
                        <>
                          <Link to="/admin" className="dropdown-item" onClick={() => setDropdownOpen(false)}>
                            <Store size={16} /> Admin Dashboard
                          </Link>
                          <Link to="/admin/orders" className="dropdown-item" onClick={() => setDropdownOpen(false)}>
                            <ShoppingCart size={16} /> All Orders (Admin)
                          </Link>
                        </>
                      )}

                      <div className="dropdown-divider"></div>
                      
                      <button className="dropdown-item logout-item" onClick={() => { logout(); setDropdownOpen(false); }}>
                        <LogOut size={16} /> Logout
                      </button>
                    </div>
                  </>
                )}
              </div>
            ) : (
              <Link to="/login" className="login-link">
                <User size={20} />
                <span>Login</span>
              </Link>
            )}
          </div>

          <Link to="/checkout" className="nav-cart">
            <div className="cart-icon-wrapper">
              <ShoppingCart size={24} />
              <span className="cart-count">{totalItems}</span>
            </div>
            <span className="cart-text">Cart</span>
          </Link>
        </div>
      </div>
    </header>
  );
};

export default Navbar;
