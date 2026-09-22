import React from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { Trash2, Plus, Minus, ArrowRight, ShoppingBag } from 'lucide-react';
import Navbar from '../components/Navbar';
import { EmptyState } from '../components/StateIndicators';
import { useCart } from '../context/CartContext';

export const Cart = () => {
  const { items, activeVendor, updateQuantity, removeFromCart, clearCart, totalAmount } = useCart();
  const navigate = useNavigate();

  if (items.length === 0) {
    return (
      <div style={{ minHeight: '100vh', display: 'flex', flexDirection: 'column' }}>
        <Navbar />
        <main className="container" style={{ flexGrow: 1, padding: '3rem 0' }}>
          <EmptyState
            title="Your cart is empty"
            description="Explore local vendors in Abuja and add items or services to your order."
            action={
              <Link to="/products" className="btn btn-primary" style={{ padding: '0.65rem 1.25rem' }}>
                Browse Products
              </Link>
            }
          />
        </main>
      </div>
    );
  }

  return (
    <div style={{ minHeight: '100vh', display: 'flex', flexDirection: 'column' }}>
      <Navbar />

      <main style={{ flexGrow: 1, padding: '2.5rem 0 4rem' }}>
        <div className="container">
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-end', marginBottom: '2rem' }}>
            <div>
              <div style={{ fontSize: '0.75rem', color: 'var(--lime)', fontWeight: 600, textTransform: 'uppercase', letterSpacing: '0.05em', marginBottom: '0.25rem' }}>
                Shopping Cart
              </div>
              <h1 className="heading-display" style={{ fontSize: '2rem', color: 'var(--ink)' }}>
                Order from {activeVendor?.business_name || 'Vendor'}
              </h1>
            </div>
            <button
              onClick={clearCart}
              className="btn btn-ghost"
              style={{ color: 'var(--status-cancelled)', fontSize: '0.8125rem' }}
            >
              Clear Cart
            </button>
          </div>

          <div
            style={{
              display: 'grid',
              gridTemplateColumns: '1.6fr 1fr',
              gap: '2.5rem',
              alignItems: 'flex-start'
            }}
          >
            {/* Left Items Table / List */}
            <div style={{ display: 'flex', flexDirection: 'column', gap: '1rem' }}>
              {items.map((item) => (
                <div
                  key={item.product_id}
                  className="card"
                  style={{
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'space-between',
                    gap: '1rem',
                    padding: '1rem 1.25rem'
                  }}
                >
                  <div style={{ display: 'flex', alignItems: 'center', gap: '1rem' }}>
                    <div
                      style={{
                        width: '60px',
                        height: '60px',
                        borderRadius: 'var(--radius)',
                        backgroundColor: 'var(--surface-2)',
                        overflow: 'hidden',
                        flexShrink: 0
                      }}
                    >
                      {item.image_url ? (
                        <img src={item.image_url} alt={item.name} style={{ width: '100%', height: '100%', objectFit: 'cover' }} />
                      ) : (
                        <div style={{ width: '100%', height: '100%', display: 'flex', alignItems: 'center', justifyContent: 'center', color: 'var(--muted)', fontSize: '0.75rem' }}>
                          No img
                        </div>
                      )}
                    </div>
                    <div>
                      <h4 style={{ fontSize: '0.9375rem', fontWeight: 600, color: 'var(--ink)', marginBottom: '0.2rem' }}>
                        {item.name}
                      </h4>
                      <div style={{ fontSize: '0.75rem', color: 'var(--muted)', marginBottom: '0.3rem' }}>
                        ₦{item.price.toLocaleString()} each
                      </div>
                      {item.lead_time && (
                        <span style={{ fontSize: '0.6875rem', color: 'var(--lime)' }}>
                          Prep time: {item.lead_time}
                        </span>
                      )}
                    </div>
                  </div>

                  {/* Quantity and Actions */}
                  <div style={{ display: 'flex', alignItems: 'center', gap: '1.5rem' }}>
                    <div
                      style={{
                        display: 'flex',
                        alignItems: 'center',
                        backgroundColor: 'var(--surface-2)',
                        border: '1px solid var(--line)',
                        borderRadius: 'var(--radius)',
                        overflow: 'hidden'
                      }}
                    >
                      <button
                        onClick={() => updateQuantity(item.product_id, item.quantity - 1)}
                        style={{
                          background: 'none',
                          border: 'none',
                          color: 'var(--ink)',
                          padding: '0.35rem 0.6rem',
                          cursor: 'pointer'
                        }}
                      >
                        <Minus size={13} />
                      </button>
                      <span style={{ padding: '0 0.5rem', fontSize: '0.8125rem', fontWeight: 600 }}>
                        {item.quantity}
                      </span>
                      <button
                        onClick={() => updateQuantity(item.product_id, item.quantity + 1)}
                        style={{
                          background: 'none',
                          border: 'none',
                          color: 'var(--ink)',
                          padding: '0.35rem 0.6rem',
                          cursor: 'pointer'
                        }}
                      >
                        <Plus size={13} />
                      </button>
                    </div>

                    <div style={{ minWidth: '90px', textAlign: 'right' }}>
                      <div style={{ fontFamily: 'var(--font-serif)', fontSize: '1rem', fontWeight: 600, color: 'var(--ink)' }}>
                        ₦{(item.price * item.quantity).toLocaleString()}
                      </div>
                    </div>

                    <button
                      onClick={() => removeFromCart(item.product_id)}
                      style={{
                        background: 'none',
                        border: 'none',
                        color: 'var(--muted)',
                        cursor: 'pointer',
                        padding: '0.25rem'
                      }}
                      title="Remove item"
                    >
                      <Trash2 size={16} />
                    </button>
                  </div>
                </div>
              ))}
            </div>

            {/* Right Summary Card */}
            <div className="card" style={{ padding: '1.5rem' }}>
              <h3 style={{ fontSize: '1.1rem', fontWeight: 600, color: 'var(--ink)', marginBottom: '1.25rem' }}>
                Order Summary
              </h3>

              <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '0.875rem', color: 'var(--muted)', marginBottom: '0.75rem' }}>
                <span>Subtotal ({items.reduce((s, i) => s + i.quantity, 0)} items)</span>
                <span style={{ color: 'var(--ink)' }}>₦{totalAmount.toLocaleString()}</span>
              </div>

              <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '0.875rem', color: 'var(--muted)', marginBottom: '1.25rem' }}>
                <span>Delivery / Service fee</span>
                <span style={{ color: 'var(--lime)', fontSize: '0.8125rem' }}>Calculated at checkout</span>
              </div>

              <div style={{ borderTop: '1px solid var(--line)', paddingTop: '1rem', marginBottom: '1.5rem', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                <span style={{ fontWeight: 600, color: 'var(--ink)' }}>Estimated Total</span>
                <span style={{ fontFamily: 'var(--font-serif)', fontSize: '1.4rem', fontWeight: 600, color: 'var(--lime)' }}>
                  ₦{totalAmount.toLocaleString()}
                </span>
              </div>

              <button
                onClick={() => navigate('/checkout')}
                className="btn btn-primary"
                style={{ width: '100%', padding: '0.8rem', fontSize: '0.9375rem' }}
              >
                Proceed to Checkout <ArrowRight size={16} />
              </button>

              <div style={{ textAlign: 'center', marginTop: '1rem' }}>
                <Link to="/products" style={{ fontSize: '0.8125rem', color: 'var(--muted)' }}>
                  ← Continue Shopping
                </Link>
              </div>
            </div>
          </div>
        </div>
      </main>
    </div>
  );
};

export default Cart;
