import React, { useState, useEffect } from 'react';
import ProductCard from '../components/ProductCard';
import { supabase } from '../lib/supabase';
import './Home.css';

const Home = ({ searchTerm }) => {
  const [products, setProducts] = useState([]);
  const [allProducts, setAllProducts] = useState([]);
  const [priceFilter, setPriceFilter] = useState('all');

  useEffect(() => {
    const fetchProducts = async () => {
      try {
        const { data, error } = await supabase.from('products').select('*');
        if (error) throw error;
        setAllProducts(data || []);
        setProducts(data || []);
      } catch (error) {
        console.error('Error fetching products:', error);
      }
    };
    fetchProducts();
  }, []);

  useEffect(() => {
    let filtered = allProducts;

    if (searchTerm) {
      filtered = filtered.filter(product => 
        product.name?.toLowerCase().includes(searchTerm.toLowerCase()) ||
        product.description?.toLowerCase().includes(searchTerm.toLowerCase()) ||
        product.category?.toLowerCase().includes(searchTerm.toLowerCase())
      );
    }

    if (priceFilter !== 'all') {
      const [min, max] = priceFilter.split('-').map(Number);
      filtered = filtered.filter(product => {
        if (max) {
          return product.price >= min && product.price <= max;
        } else {
          return product.price >= min;
        }
      });
    }

    setProducts(filtered);
  }, [searchTerm, priceFilter]);

  return (
    <div className="container home-page">
      <aside className="sidebar">
        <div className="filter-section">
          <h3>Filter by Price</h3>
          <div className="filter-group">
            <label>
              <input 
                type="radio" 
                name="price" 
                value="all" 
                checked={priceFilter === 'all'} 
                onChange={(e) => setPriceFilter(e.target.value)} 
              />
              All Prices
            </label>
            <label>
              <input 
                type="radio" 
                name="price" 
                value="0-50" 
                checked={priceFilter === '0-50'} 
                onChange={(e) => setPriceFilter(e.target.value)} 
              />
              Under $50
            </label>
            <label>
              <input 
                type="radio" 
                name="price" 
                value="50-200" 
                checked={priceFilter === '50-200'} 
                onChange={(e) => setPriceFilter(e.target.value)} 
              />
              $50 to $200
            </label>
            <label>
              <input 
                type="radio" 
                name="price" 
                value="200-500" 
                checked={priceFilter === '200-500'} 
                onChange={(e) => setPriceFilter(e.target.value)} 
              />
              $200 to $500
            </label>
            <label>
              <input 
                type="radio" 
                name="price" 
                value="500-" 
                checked={priceFilter === '500-'} 
                onChange={(e) => setPriceFilter(e.target.value)} 
              />
              $500 & Above
            </label>
          </div>
        </div>
      </aside>

      <main className="main-content">
        <div className="results-header">
          <span className="results-count">
            {products.length} {products.length === 1 ? 'result' : 'results'} 
            {searchTerm && ` for "${searchTerm}"`}
          </span>
        </div>

        {products.length > 0 ? (
          <div className="product-grid">
            {products.map(product => (
              <ProductCard key={product.id} product={product} />
            ))}
          </div>
        ) : (
          <div className="no-results">
            <h2>No products found</h2>
            <p>Try adjusting your search or filters.</p>
          </div>
        )}
      </main>
    </div>
  );
};

export default Home;
