import React, { useState, useEffect } from 'react';
import { useParams, Link, useNavigate } from 'react-router-dom';
import { supabase } from '../lib/supabase';
import { useCart } from '../context/CartContext';
import { ShoppingCart, ArrowLeft, Star, ShieldCheck, Truck, Zap } from 'lucide-react';
import './ProductDetails.css';

const ProductDetails = () => {
  const { id } = useParams();
  const navigate = useNavigate();
  const [product, setProduct] = useState(null);
  const [reviews, setReviews] = useState([]);
  const [loading, setLoading] = useState(true);
  const { addToCart } = useCart();
  const [added, setAdded] = useState(false);

  useEffect(() => {
    const fetchData = async () => {
      try {
        const [productRes, reviewsRes] = await Promise.all([
          supabase.from('products').select('*').eq('id', id).single(),
          supabase.from('reviews').select('*').eq('product_id', id).order('created_at', { ascending: false })
        ]);

        if (productRes.error) throw productRes.error;
        setProduct(productRes.data);
        setReviews(reviewsRes.data || []);
      } catch (err) {
        console.error('Error fetching product details:', err);
      } finally {
        setLoading(false);
      }
    };

    fetchData();
  }, [id]);

  const handleAddToCart = () => {
    if (product) {
      addToCart(product);
      setAdded(true);
      setTimeout(() => setAdded(false), 2000);
    }
  };

  const handleBuyNow = () => {
    if (product) {
      addToCart(product);
      navigate('/checkout');
    }
  };

  const avgRating = reviews.length > 0 
    ? reviews.reduce((acc, r) => acc + r.rating, 0) / reviews.length 
    : (product?.rating || 0);

  if (loading) {
    return (
      <div className="product-details-loading">
        <div className="spinner"></div>
        <p>Loading product details...</p>
      </div>
    );
  }

  if (!product) {
    return (
      <div className="container product-not-found">
        <h2>Product not found</h2>
        <Link to="/" className="btn btn-primary">Back to Shopping</Link>
      </div>
    );
  }

  return (
    <div className="container product-details-page animate-fade-in">
      <Link to="/" className="back-link-details">
        <ArrowLeft size={18} /> Back to results
      </Link>

      <div className="product-details-grid">
        <div className="product-image-section">
          <img src={product.image} alt={product.name} />
        </div>

        <div className="product-info-section">
          <h1 className="product-title-large">{product.name}</h1>
          <div className="product-rating">
            <div className="stars">
              {[1, 2, 3, 4, 5].map((s) => (
                <Star 
                  key={s} 
                  size={16} 
                  fill={s <= Math.floor(avgRating) ? "#FF9900" : "none"} 
                  color="#FF9900" 
                />
              ))}
            </div>
            <span className="rating-count">{reviews.length} ratings</span>
          </div>

          <div className="divider"></div>

          <div className="price-tag">
            <span className="currency">$</span>
            <span className="amount">{Math.floor(product.price)}</span>
            <span className="decimals">{(product.price % 1).toFixed(2).substring(2)}</span>
          </div>

          <p className="product-description-text">{product.description || 'No description available for this premium item.'}</p>

          <ul className="product-highlights">
            <li>High-quality materials and craftsmanship</li>
            <li>Designed for durability and long-term use</li>
            <li>Available in multiple colors and sizes</li>
            <li>Best-seller in its category</li>
          </ul>
        </div>

        <div className="product-purchase-card">
          <div className="purchase-price">${product.price.toFixed(2)}</div>
          <div className="delivery-info">
            <Truck size={18} />
            <span>FREE delivery Wednesday, May 15</span>
          </div>
          
          <div className={`stock-status-large ${product.stock <= 0 ? 'out' : (product.stock <= 5 ? 'low' : 'in')}`}>
            {product.stock <= 0 ? 'Out of Stock' : (product.stock <= 5 ? `Only ${product.stock} left in stock - order soon.` : 'In Stock')}
          </div>
          
          <div className="purchase-buttons">
            <button 
              className={`btn-add-to-cart ${added ? 'added' : ''} ${product.stock <= 0 ? 'disabled' : ''}`} 
              onClick={handleAddToCart}
              disabled={added || product.stock <= 0}
            >
              {added ? 'Added to Cart!' : (
                product.stock <= 0 ? 'Out of Stock' : (
                  <>
                    <ShoppingCart size={18} /> Add to Cart
                  </>
                )
              )}
            </button>
            
            <button 
              className={`btn-buy-now ${product.stock <= 0 ? 'disabled' : ''}`}
              onClick={handleBuyNow}
              disabled={product.stock <= 0}
            >
              <Zap size={18} /> Buy Now
            </button>
          </div>
          
          <div className="secure-transaction">
            <ShieldCheck size={16} />
            <span>Secure transaction</span>
          </div>
        </div>
      </div>

      <div className="product-reviews-section">
        <div className="divider"></div>
        <h2>Customer Reviews</h2>
        {reviews.length === 0 ? (
          <p className="no-reviews-msg">No reviews yet. Be the first to share your thoughts!</p>
        ) : (
          <div className="reviews-list">
            {reviews.map((review) => (
              <div key={review.id} className="review-item-card">
                <div className="review-header">
                  <div className="user-avatar-small">
                    {(review.user_id || 'U').charAt(0).toUpperCase()}
                  </div>
                  <span className="review-user-email">Verified Customer</span>
                </div>
                <div className="review-rating-row">
                  {[1, 2, 3, 4, 5].map((s) => (
                    <Star 
                      key={s} 
                      size={14} 
                      fill={s <= review.rating ? "#FF9900" : "none"} 
                      color="#FF9900" 
                    />
                  ))}
                  <span className="review-date">
                    Reviewed on {new Date(review.created_at).toLocaleDateString()}
                  </span>
                </div>
                <p className="review-comment">{review.comment}</p>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
};

export default ProductDetails;
