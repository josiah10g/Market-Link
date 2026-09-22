import React, { createContext, useContext, useState, useEffect } from 'react';

const CartContext = createContext();

export const CartProvider = ({ children }) => {
  const [items, setItems] = useState(() => {
    try {
      const saved = localStorage.getItem('marketlink_cart');
      return saved ? JSON.parse(saved) : [];
    } catch {
      return [];
    }
  });

  const [activeVendor, setActiveVendor] = useState(() => {
    try {
      const saved = localStorage.getItem('marketlink_cart_vendor');
      if (saved) return JSON.parse(saved);
      const cartItems = JSON.parse(localStorage.getItem('marketlink_cart') || '[]');
      if (cartItems.length > 0 && cartItems[0].vendor_id) {
        return { id: cartItems[0].vendor_id, business_name: 'Storefront' };
      }
      return null;
    } catch {
      return null;
    }
  });

  useEffect(() => {
    localStorage.setItem('marketlink_cart', JSON.stringify(items));
    if (items.length === 0) {
      localStorage.removeItem('marketlink_cart_vendor');
      setActiveVendor(null);
    } else if (activeVendor) {
      localStorage.setItem('marketlink_cart_vendor', JSON.stringify(activeVendor));
    }
  }, [items, activeVendor]);

  /**
   * Add item to cart. Enforces SINGLE VENDOR rule.
   * If adding from a different vendor, returns a prompt object for UI resolution.
   */
  const addToCart = (product, vendorInfo, quantity = 1) => {
    if (activeVendor && activeVendor.id !== product.vendor_id) {
      return {
        success: false,
        mismatch: true,
        currentVendor: activeVendor.business_name,
        newVendor: vendorInfo.business_name || 'Another vendor',
        pendingProduct: product,
        pendingVendor: vendorInfo,
        pendingQuantity: quantity
      };
    }

    // Set vendor if cart was empty
    if (!activeVendor) {
      setActiveVendor({
        id: product.vendor_id,
        business_name: vendorInfo.business_name || 'Vendor'
      });
    }

    setItems((prev) => {
      const existing = prev.find((item) => item.product_id === product.id);
      if (existing) {
        return prev.map((item) =>
          item.product_id === product.id
            ? { ...item, quantity: item.quantity + quantity }
            : item
        );
      }
      return [
        ...prev,
        {
          product_id: product.id,
          name: product.name,
          price: Number(product.price),
          image_url: product.image_url,
          lead_time: product.lead_time,
          stock_quantity: product.stock_quantity,
          vendor_id: product.vendor_id,
          quantity
        }
      ];
    });

    return { success: true };
  };

  const updateQuantity = (productId, newQuantity) => {
    if (newQuantity <= 0) {
      removeFromCart(productId);
      return;
    }
    setItems((prev) =>
      prev.map((item) =>
        item.product_id === productId ? { ...item, quantity: newQuantity } : item
      )
    );
  };

  const removeFromCart = (productId) => {
    setItems((prev) => {
      const updated = prev.filter((item) => item.product_id !== productId);
      if (updated.length === 0) {
        setActiveVendor(null);
      }
      return updated;
    });
  };

  const clearCart = () => {
    setItems([]);
    setActiveVendor(null);
    localStorage.removeItem('marketlink_cart');
    localStorage.removeItem('marketlink_cart_vendor');
  };

  // Replace cart when user agrees to switch vendor
  const switchVendorAndAdd = (product, vendorInfo, quantity = 1) => {
    clearCart();
    setActiveVendor({
      id: product.vendor_id,
      business_name: vendorInfo.business_name || 'Vendor'
    });
    setItems([
      {
        product_id: product.id,
        name: product.name,
        price: Number(product.price),
        image_url: product.image_url,
        lead_time: product.lead_time,
        stock_quantity: product.stock_quantity,
        vendor_id: product.vendor_id,
        quantity
      }
    ]);
  };

  const totalAmount = items.reduce((sum, item) => sum + item.price * item.quantity, 0);
  const totalItemCount = items.reduce((sum, item) => sum + item.quantity, 0);

  return (
    <CartContext.Provider
      value={{
        items,
        activeVendor,
        addToCart,
        updateQuantity,
        removeFromCart,
        clearCart,
        switchVendorAndAdd,
        totalAmount,
        totalItemCount
      }}
    >
      {children}
    </CartContext.Provider>
  );
};

export const useCart = () => useContext(CartContext);
