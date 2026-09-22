import React from 'react';
import { useNavigate } from 'react-router-dom';
import { ShoppingBag, Clock, Package } from 'lucide-react';
import { useCart } from '../context/CartContext';
import { useAuth } from '../context/AuthContext';
import { useToast } from '../context/ToastContext';

export const ProductCard = ({ product, onVendorMismatch }) => {
  const { addToCart } = useCart();
  const { user } = useAuth();
  const navigate = useNavigate();
  const toast = useToast();

  const handleAdd = () => {
    if (!user) {
      toast.info('Please log in or sign up to add items to your cart.');
      navigate('/login');
      return;
    }

    if (user.role !== 'customer') {
      toast.info('Cart ordering is reserved for customer accounts.');
      return;
    }

    const result = addToCart(product, {
      id: product.vendor_id,
      business_name: product.business_name || 'Vendor'
    });

    if (!result.success && result.mismatch) {
      if (onVendorMismatch) {
        onVendorMismatch(result);
      } else {
        toast.error(
          `Your cart contains items from ${result.currentVendor}. Please clear or complete your existing order before ordering from another vendor.`
        );
      }
    } else if (result.success) {
      toast.success(`Added ${product.name} to cart`);
    }
  };

  const handleOrderNow = () => {
    if (!user) {
      toast.info('Please log in to place an order.');
      navigate('/login');
      return;
    }

    if (user.role !== 'customer') {
      toast.info('Ordering is reserved for customer accounts.');
      return;
    }

    const result = addToCart(product, {
      id: product.vendor_id,
      business_name: product.business_name || 'Vendor'
    });

    if (!result.success && result.mismatch) {
      if (onVendorMismatch) {
        onVendorMismatch(result);
      } else {
        toast.error(
          `Your cart contains items from ${result.currentVendor}. Please clear or complete your existing order before ordering from another vendor.`
        );
      }
    } else if (result.success) {
      navigate('/checkout');
    }
  };

  const isOutOfStock = product.stock_quantity <= 0;

  return (
    <div
      className="card-hoverable"
      style={{
        backgroundColor: 'var(--surface)',
        border: '1px solid var(--line)',
        borderRadius: 'var(--radius)',
        overflow: 'hidden',
        display: 'flex',
        flexDirection: 'column',
        height: '100%',
      }}
    >
      {/* Product Image */}
      <div
        className="img-zoom-parent"
        style={{
          width: '100%',
          height: '160px',
          backgroundColor: 'var(--surface-2)',
          position: 'relative',
        }}
      >
        {product.image_url ? (
          <img
            src={product.image_url}
            alt={product.name}
            style={{
              width: '100%',
              height: '100%',
              objectFit: 'cover'
            }}
          />
        ) : (
          <div
            style={{
              width: '100%',
              height: '100%',
              display: 'flex',
              flexDirection: 'column',
              gap: '0.35rem',
              alignItems: 'center',
              justifyContent: 'center',
              color: 'var(--muted)',
              fontSize: '0.75rem',
              backgroundColor: 'var(--surface-2)'
            }}
          >
            <Package size={26} strokeWidth={1.5} color="var(--line-light)" />
            <span>Product</span>
          </div>
        )}

        {/* Lead time pill on image matching mockup */}
        {product.lead_time && (
          <span
            style={{
              position: 'absolute',
              bottom: '8px',
              right: '8px',
              backgroundColor: 'rgba(11, 15, 14, 0.85)',
              backdropFilter: 'blur(4px)',
              color: 'var(--ink)',
              fontSize: '0.6875rem',
              padding: '0.2rem 0.5rem',
              borderRadius: 'var(--radius)',
              display: 'flex',
              alignItems: 'center',
              gap: '0.25rem',
              border: '1px solid var(--line)'
            }}
          >
            <Clock size={11} color="var(--lime)" />
            {product.lead_time}
          </span>
        )}
      </div>

      {/* Product Body */}
      <div style={{ padding: '1rem', display: 'flex', flexDirection: 'column', flexGrow: 1 }}>
        {/* Vendor attribution if present */}
        {product.business_name && (
          <span style={{ fontSize: '0.75rem', color: 'var(--muted)', marginBottom: '0.25rem' }}>
            {product.business_name}
          </span>
        )}

        <h4 style={{ fontSize: '0.9375rem', fontWeight: 600, color: 'var(--ink)', marginBottom: '0.35rem' }}>
          {product.name}
        </h4>

        {product.description && (
          <p
            style={{
              fontSize: '0.8125rem',
              color: 'var(--muted)',
              marginBottom: '0.75rem',
              display: '-webkit-box',
              WebkitLineClamp: 2,
              WebkitBoxOrient: 'vertical',
              overflow: 'hidden',
              lineHeight: 1.4
            }}
          >
            {product.description}
          </p>
        )}

        {/* Bottom Details & Buttons pushed to bottom */}
        <div style={{ marginTop: 'auto', paddingTop: '0.5rem' }}>
          <div
            style={{
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'space-between',
              marginBottom: '0.75rem'
            }}
          >
            <span
              style={{
                fontFamily: 'var(--font-serif)',
                fontSize: '1.1rem',
                fontWeight: 600,
                color: 'var(--ink)'
              }}
            >
              ₦{Number(product.price).toLocaleString()}
            </span>

            {isOutOfStock ? (
              <span style={{ fontSize: '0.75rem', color: 'var(--status-cancelled)' }}>Out of stock</span>
            ) : product.stock_quantity <= 5 ? (
              <span style={{ fontSize: '0.75rem', color: 'var(--status-pending)' }}>
                {product.stock_quantity} left
              </span>
            ) : null}
          </div>

          <div style={{ display: 'flex', flexDirection: 'column', gap: '0.45rem' }}>
            {/* Order Now button directly on top */}
            <button
              onClick={handleOrderNow}
              disabled={isOutOfStock}
              className="btn btn-primary"
              style={{
                width: '100%',
                padding: '0.52rem',
                fontSize: '0.8125rem',
                fontWeight: 600
              }}
            >
              {isOutOfStock ? 'Sold Out' : 'Order Now'}
            </button>

            {/* Add to Cart button below */}
            <button
              onClick={handleAdd}
              disabled={isOutOfStock}
              className="btn btn-outline"
              style={{
                width: '100%',
                padding: '0.52rem',
                fontSize: '0.8125rem',
                backgroundColor: isOutOfStock ? 'transparent' : 'var(--surface-2)',
                borderColor: 'var(--line)'
              }}
            >
              <ShoppingBag size={14} />
              {isOutOfStock ? 'Sold Out' : 'Add to Cart'}
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};

export default ProductCard;
