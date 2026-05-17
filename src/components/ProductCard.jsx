import React, { useState, useEffect } from 'react';
import { Star, ShoppingCart } from 'lucide-react';
import { useCart } from '../context/CartContext';
import { Link } from 'react-router-dom';
import { supabase } from '../lib/supabase';
import './ProductCard.css';

const ProductCard = ({ product }) => {
  const { addToCart } = useCart();
  const [ratingData, setRatingData] = useState({ avg: 0, count: 0 });

  useEffect(() => {
    const fetchRating = async () => {
      try {
        const { data, error } = await supabase
          .from('reviews')
          .select('rating')
          .eq('product_id', product.id);
        
        if (error) throw error;
        
        if (data && data.length > 0) {
          const avg = data.reduce((acc, curr) => acc + curr.rating, 0) / data.length;
          setRatingData({ avg, count: data.length });
        } else {
          setRatingData({ avg: 0, count: 0 });
        }
      } catch (err) {
        console.error('Error fetching rating:', err);
      }
    };
    fetchRating();
  }, [product.id]);

  const handleAddToCart = (e) => {
    e.preventDefault();
    e.stopPropagation();
    addToCart(product);
  };

  const renderStars = () => {
    const stars = [];
    const displayRating = ratingData.count > 0 ? ratingData.avg : (product.rating || 4);
    for (let i = 0; i < 5; i++) {
      stars.push(
        <Star 
          key={i} 
          size={16} 
          fill={i < Math.floor(displayRating) ? "#FF9900" : "none"} 
          color={i < Math.floor(displayRating) ? "#FF9900" : "#ccc"} 
        />
      );
    }
    return stars;
  };

  const getStockUI = () => {
    if (product.stock <= 0) return <span className="stock-msg out">Out of Stock</span>;
    if (product.stock <= 5) return <span className="stock-msg low">Only {product.stock} left in stock - order soon.</span>;
    return <span className="stock-msg in">In Stock</span>;
  };

  return (
    <div className={`product-card animate-fade-in ${product.stock <= 0 ? 'out-of-stock-card' : ''}`}>
      <Link to={`/products/${product.id}`} className="product-card-link">
        <div className="product-image-container">
          <img src={product.image} alt={product.name} className="product-image" loading="lazy" />
          {product.stock <= 0 && <div className="out-of-stock-overlay">Out of Stock</div>}
        </div>
        <div className="product-info">
          <h3 className="product-title line-clamp-2">{product.name}</h3>
          
          <div className="product-rating">
            {renderStars()}
            <span className="rating-text">{ratingData.count > 0 ? ratingData.count : 'No reviews yet'}</span>
          </div>
          
          <div className="product-price">
            <span>$</span>
            {Math.floor(product.price)}
            <span>.{(product.price % 1).toFixed(2).substring(2)}</span>
          </div>

          <div className="product-stock-status">
            {getStockUI()}
          </div>
          
          <p className="product-description line-clamp-2">{product.description}</p>
          
          <button 
            className={`btn btn-primary add-to-cart-btn ${product.stock <= 0 ? 'disabled' : ''}`} 
            onClick={handleAddToCart}
            disabled={product.stock <= 0}
          >
            <ShoppingCart size={18} />
            {product.stock <= 0 ? 'Out of Stock' : 'Add to Cart'}
          </button>
        </div>
      </Link>
    </div>
  );
};

export default ProductCard;
