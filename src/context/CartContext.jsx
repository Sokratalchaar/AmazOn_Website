import React, { createContext, useState, useContext, useEffect } from 'react';
import { useAuth } from './AuthContext';
import { supabase } from '../lib/supabase';

const CartContext = createContext();

export const useCart = () => useContext(CartContext);

export const CartProvider = ({ children }) => {
  const { user } = useAuth();
  const [cart, setCart] = useState([]);
  const [isInitialized, setIsInitialized] = useState(false);

  // Load cart from Supabase when user changes
  useEffect(() => {
    const loadCart = async () => {
      if (!user) {
        setCart([]);
        return;
      }

      console.log("Loading cart for user:", user.id);

      try {
        const { data, error } = await supabase
          .from('cart')
          .select('*, products(*)')
          .eq('user_id', user.id);

        if (error) {
          console.error("Cart fetch error:", error.message);
        } else if (data) {
          console.log("Cart fetch returned data:", data);
          let formattedCart = data.map(item => ({
            ...item.products,
            quantity: item.quantity
          }));

          setCart(formattedCart);
        }
      } catch (err) {
        console.error("Unexpected error loading cart:", err);
      }
    };

    loadCart();
  }, [user]);

  const addToCart = async (product) => {
    if (!user) {
      alert("Please login to add items to your cart.");
      return;
    }

    setCart((prevCart) => {
      const existing = prevCart.find((item) => item.id === product.id);
      if (existing) {
        return prevCart.map((item) =>
          item.id === product.id ? { ...item, quantity: item.quantity + 1 } : item
        );
      }
      return [...prevCart, { ...product, quantity: 1 }];
    });

    const existing = cart.find(item => item.id === product.id);
    if (existing) {
      const { error } = await supabase
        .from('cart')
        .update({ quantity: existing.quantity + 1 })
        .match({ user_id: user.id, product_id: product.id });
      if (error) console.error("Cart update error:", error.message, error.details, error);
    } else {
      const { error } = await supabase
        .from('cart')
        .insert({ user_id: user.id, product_id: product.id, quantity: 1 });
      if (error) console.error("Cart insert error:", error.message, error.details, error);
    }
  };

  const removeFromCart = async (productId) => {
    setCart((prevCart) => prevCart.filter((item) => item.id !== productId));

    if (user) {
      const { error } = await supabase
        .from('cart')
        .delete()
        .match({ user_id: user.id, product_id: productId });
      if (error) console.error("Cart delete error:", error.message, error.details, error);
    }
  };

  const updateQuantity = async (productId, amount) => {
    let newQty = 1;
    setCart((prevCart) => {
      return prevCart.map((item) => {
        if (item.id === productId) {
          newQty = item.quantity + amount > 0 ? item.quantity + amount : 1;
          return { ...item, quantity: newQty };
        }
        return item;
      });
    });

    if (user) {
      const { error } = await supabase
        .from('cart')
        .update({ quantity: newQty })
        .match({ user_id: user.id, product_id: productId });
      if (error) console.error("Cart update quantity error:", error.message, error.details, error);
    }
  };

  const clearCart = async () => {
    setCart([]);
    if (user) {
      const { error } = await supabase
        .from('cart')
        .delete()
        .eq('user_id', user.id);
      if (error) console.error("Cart clear error:", error.message, error.details, error);
    }
  };

  const totalItems = cart.reduce((sum, item) => sum + item.quantity, 0);
  const totalPrice = cart.reduce((sum, item) => sum + item.price * item.quantity, 0);

  return (
    <CartContext.Provider value={{
      cart,
      addToCart,
      removeFromCart,
      updateQuantity,
      clearCart,
      totalItems,
      totalPrice
    }}>
      {children}
    </CartContext.Provider>
  );
};
