import React, { useState } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import { ShieldCheck, Truck, CreditCard, Banknote, ArrowLeft, CheckCircle2 } from 'lucide-react';
import Navbar from '../components/Navbar';
import { useCart } from '../context/CartContext';
import { useAuth } from '../context/AuthContext';
import { useToast } from '../context/ToastContext';
import api from '../api/axios';

export const Checkout = () => {
  const { items, activeVendor, totalAmount, clearCart } = useCart();
  const { user } = useAuth();
  const navigate = useNavigate();
  const toast = useToast();

  const [deliveryAddress, setDeliveryAddress] = useState('Plot 204, Garki II, Abuja');
  const [notes, setNotes] = useState('');
  const [paymentMethod, setPaymentMethod] = useState('paystack');
  const [loading, setLoading] = useState(false);
  const [loadingMessage, setLoadingMessage] = useState('Processing Order...');
  const [error, setError] = useState('');

  if (items.length === 0) {
    return (
      <div style={{ minHeight: '100vh', display: 'flex', flexDirection: 'column' }}>
        <Navbar />
        <main className="container" style={{ padding: '4rem 0', textAlign: 'center' }}>
          <p style={{ color: 'var(--muted)', marginBottom: '1.5rem' }}>No items in cart to checkout.</p>
          <Link to="/products" className="btn btn-primary">Return to Catalog</Link>
        </main>
      </div>
    );
  }

  // Paystack popup integration
  const triggerPaystackPopup = (orderCode, onPaymentSuccess, onCancel) => {
    const paystackKey = import.meta.env.VITE_PAYSTACK_PUBLIC_KEY || 'pk_test_30623a31c6ff96452292f74112e8b2b9f36f6d8a';

    if (typeof window.PaystackPop !== 'undefined') {
      const handler = window.PaystackPop.setup({
        key: paystackKey,
        email: user?.email || 'customer@marketlink.ng',
        amount: Math.round(totalAmount * 100), // In kobo
        currency: 'NGN',
        ref: 'ML-' + Date.now() + '-' + Math.floor(Math.random() * 1000),
        metadata: {
          custom_fields: [
            {
              display_name: 'Customer Name',
              variable_name: 'customer_name',
              value: user?.name || 'Customer'
            },
            {
              display_name: 'Vendor Store',
              variable_name: 'vendor_store',
              value: activeVendor?.business_name || 'MarketLink Vendor'
            }
          ]
        },
        callback: function (response) {
          onPaymentSuccess(response.reference);
        },
        onClose: function () {
          onCancel();
        }
      });
      handler.openIframe();
    } else {
      // If Paystack script was blocked by an ad-blocker or offline, prompt fallback reference
      const simulatedRef = 'TEST_REF_' + Date.now();
      const confirmed = window.confirm(
        `Paystack popup script could not be loaded directly (e.g. ad-blocker or offline).\n\nWould you like to complete payment in Sandbox/Dev mode with simulated reference "${simulatedRef}"?`
      );
      if (confirmed) {
        onPaymentSuccess(simulatedRef);
      } else {
        onCancel();
      }
    }
  };

  const handlePlaceOrder = async (e) => {
    e.preventDefault();
    setError('');

    if (!deliveryAddress.trim()) {
      setError('Please provide a valid Abuja delivery or pickup address.');
      return;
    }

    if (paymentMethod === 'paystack') {
      const vendorId = Number(activeVendor?.id || activeVendor?.vendor_id || items[0]?.vendor_id);
      if (!vendorId || isNaN(vendorId)) {
        setError('Unable to identify vendor for this order. Please try refreshing your cart.');
        return;
      }

      // Step 1: Open Paystack payment modal first
      setLoading(true);
      setLoadingMessage('Opening Paystack secure payment window...');

      triggerPaystackPopup(
        null,
        async (paystackRef) => {
          // Payment succeeded in Paystack modal! Now atomically place order and verify
          try {
            setLoading(true);
            setLoadingMessage('Verifying payment and generating order...');

            const orderPayload = {
              vendor_id: vendorId,
              items: items.map((it) => ({
                product_id: Number(it.product_id || it.id),
                quantity: Number(it.quantity)
              })),
              delivery_address: deliveryAddress,
              notes: notes.trim() || undefined,
              payment_method: 'paystack',
              payment_reference: paystackRef
            };

            const { data } = await api.post('/orders', orderPayload);

            if (data.success) {
              clearCart();
              toast.success(`Payment verified! Order #${data.data.order_code} confirmed.`);
              navigate('/orders?new_order=' + data.data.order_code);
            }
          } catch (err) {
            console.error('Order creation error post-payment:', err);
            const serverMsg = err.response?.data?.message || err.message || 'Payment received, but error finalizing order.';
            setError(`${serverMsg} (Ref: ${paystackRef})`);
            toast.error(serverMsg);
          } finally {
            setLoading(false);
          }
        },
        () => {
          // User closed Paystack modal without completing
          setLoading(false);
          toast.info('Payment cancelled. You can retry when ready.');
        }
      );
    } else {
      const vendorId = Number(activeVendor?.id || activeVendor?.vendor_id || items[0]?.vendor_id);
      if (!vendorId || isNaN(vendorId)) {
        setError('Unable to identify vendor for this order. Please try refreshing your cart.');
        return;
      }

      // Standard Pay on Delivery flow
      try {
        setLoading(true);
        setLoadingMessage('Processing Order...');

        const orderPayload = {
          vendor_id: vendorId,
          items: items.map((it) => ({
            product_id: Number(it.product_id || it.id),
            quantity: Number(it.quantity)
          })),
          delivery_address: deliveryAddress,
          notes: notes.trim() || undefined,
          payment_method: 'pay_on_delivery'
        };

        const { data } = await api.post('/orders', orderPayload);

        if (data.success) {
          clearCart();
          toast.success(`Order #${data.data.order_code} placed successfully!`);
          navigate('/orders?new_order=' + data.data.order_code);
        }
      } catch (err) {
        console.error('Order checkout error:', err);
        setError(err.response?.data?.message || 'Checkout failed. Please try again.');
      } finally {
        setLoading(false);
      }
    }
  };

  return (
    <div style={{ minHeight: '100vh', display: 'flex', flexDirection: 'column' }}>
      <Navbar />

      <main style={{ flexGrow: 1, padding: '2.5rem 0 4rem' }}>
        <div className="container">
          <Link to="/cart" style={{ display: 'inline-flex', alignItems: 'center', gap: '0.4rem', fontSize: '0.8125rem', color: 'var(--muted)', marginBottom: '1.5rem' }}>
            <ArrowLeft size={14} /> Back to Cart
          </Link>

          <div style={{ marginBottom: '2rem' }}>
            <h1 className="heading-display" style={{ fontSize: '2rem', color: 'var(--ink)' }}>
              Confirm & Place Order
            </h1>
            <p style={{ color: 'var(--muted)', fontSize: '0.875rem' }}>
              Fulfilling from <strong style={{ color: 'var(--lime)' }}>{activeVendor?.business_name}</strong>
            </p>
          </div>

          {error && (
            <div style={{ padding: '0.9rem', backgroundColor: 'var(--status-cancelled-bg)', border: '1px solid rgba(239, 68, 68, 0.3)', color: 'var(--status-cancelled)', borderRadius: 'var(--radius)', fontSize: '0.875rem', marginBottom: '1.5rem' }}>
              {error}
            </div>
          )}

          <form onSubmit={handlePlaceOrder}>
            <div
              style={{
                display: 'grid',
                gridTemplateColumns: '1.5fr 1fr',
                gap: '2.5rem',
                alignItems: 'flex-start'
              }}
              className="responsive-hero-grid"
            >
              {/* Left Column: Delivery & Payment Details */}
              <div style={{ display: 'flex', flexDirection: 'column', gap: '1.5rem' }}>
                {/* Delivery Information */}
                <div className="card" style={{ padding: '1.5rem' }}>
                  <h3 style={{ fontSize: '1.05rem', fontWeight: 600, color: 'var(--ink)', marginBottom: '1rem', display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
                    <Truck size={17} color="var(--lime)" /> Delivery Address
                  </h3>

                  <div className="form-group">
                    <label className="form-label">Street Address & Area (Abuja)</label>
                    <textarea
                      value={deliveryAddress}
                      onChange={(e) => setDeliveryAddress(e.target.value)}
                      rows={3}
                      placeholder="e.g. Plot 204, Shehu Shagari Way, Garki II, Abuja"
                      className="form-input"
                      required
                    />
                  </div>

                  <div className="form-group" style={{ marginBottom: 0 }}>
                    <label className="form-label">Special Delivery / Prep Instructions (Optional)</label>
                    <input
                      type="text"
                      value={notes}
                      onChange={(e) => setNotes(e.target.value)}
                      placeholder="e.g. Extra pepper sauce, or fabric measurements ready"
                      className="form-input"
                    />
                  </div>
                </div>

                {/* Payment Selection */}
                <div className="card" style={{ padding: '1.5rem' }}>
                  <h3 style={{ fontSize: '1.05rem', fontWeight: 600, color: 'var(--ink)', marginBottom: '1rem', display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
                    <CreditCard size={17} color="var(--lime)" /> Payment Method
                  </h3>

                  <div style={{ display: 'flex', flexDirection: 'column', gap: '0.75rem' }}>
                    {/* Paystack Option */}
                    <label
                      style={{
                        display: 'flex',
                        alignItems: 'center',
                        justifyContent: 'space-between',
                        padding: '0.85rem 1rem',
                        backgroundColor: paymentMethod === 'paystack' ? 'var(--surface-2)' : 'transparent',
                        border: '1px solid',
                        borderColor: paymentMethod === 'paystack' ? 'var(--lime)' : 'var(--line)',
                        borderRadius: 'var(--radius)',
                        cursor: 'pointer'
                      }}
                    >
                      <div style={{ display: 'flex', alignItems: 'center', gap: '0.75rem' }}>
                        <input
                          type="radio"
                          name="payment"
                          value="paystack"
                          checked={paymentMethod === 'paystack'}
                          onChange={() => setPaymentMethod('paystack')}
                          style={{ accentColor: 'var(--lime)' }}
                        />
                        <div>
                          <div style={{ fontSize: '0.875rem', fontWeight: 600, color: 'var(--ink)', display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
                            <span>Pay with Paystack</span>
                            <span style={{ fontSize: '0.6875rem', padding: '0.15rem 0.45rem', backgroundColor: 'var(--lime-soft)', color: 'var(--lime)', borderRadius: '3px', fontWeight: 600 }}>
                              Instant
                            </span>
                          </div>
                          <div style={{ fontSize: '0.75rem', color: 'var(--muted)' }}>
                            Cards, Bank Transfer, USSD, or Apple Pay
                          </div>
                        </div>
                      </div>
                      <CreditCard size={18} color={paymentMethod === 'paystack' ? 'var(--lime)' : 'var(--muted)'} />
                    </label>

                    {/* Pay on Delivery Option */}
                    <label
                      style={{
                        display: 'flex',
                        alignItems: 'center',
                        justifyContent: 'space-between',
                        padding: '0.85rem 1rem',
                        backgroundColor: paymentMethod === 'pay_on_delivery' ? 'var(--surface-2)' : 'transparent',
                        border: '1px solid',
                        borderColor: paymentMethod === 'pay_on_delivery' ? 'var(--lime)' : 'var(--line)',
                        borderRadius: 'var(--radius)',
                        cursor: 'pointer'
                      }}
                    >
                      <div style={{ display: 'flex', alignItems: 'center', gap: '0.75rem' }}>
                        <input
                          type="radio"
                          name="payment"
                          value="pay_on_delivery"
                          checked={paymentMethod === 'pay_on_delivery'}
                          onChange={() => setPaymentMethod('pay_on_delivery')}
                          style={{ accentColor: 'var(--lime)' }}
                        />
                        <div>
                          <div style={{ fontSize: '0.875rem', fontWeight: 600, color: 'var(--ink)' }}>
                            Pay on Delivery / Pickup
                          </div>
                          <div style={{ fontSize: '0.75rem', color: 'var(--muted)' }}>
                            Pay cash or transfer upon inspection of items
                          </div>
                        </div>
                      </div>
                      <Banknote size={18} color="var(--lime)" />
                    </label>
                  </div>
                </div>
              </div>

              {/* Right Column: Order Review Summary */}
              <div className="card" style={{ padding: '1.5rem' }}>
                <h3 style={{ fontSize: '1.05rem', fontWeight: 600, color: 'var(--ink)', marginBottom: '1rem' }}>
                  Review Order Items
                </h3>

                <div style={{ display: 'flex', flexDirection: 'column', gap: '0.75rem', marginBottom: '1.25rem', maxHeight: '220px', overflowY: 'auto' }}>
                  {items.map((item) => (
                    <div key={item.product_id} style={{ display: 'flex', justifyContent: 'space-between', fontSize: '0.8125rem' }}>
                      <span style={{ color: 'var(--ink)' }}>
                        {item.name} × {item.quantity}
                      </span>
                      <span style={{ color: 'var(--muted)', fontWeight: 500 }}>
                        ₦{(item.price * item.quantity).toLocaleString()}
                      </span>
                    </div>
                  ))}
                </div>

                <div style={{ borderTop: '1px solid var(--line)', paddingTop: '1rem', marginBottom: '1.5rem' }}>
                  <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '0.8125rem', color: 'var(--muted)', marginBottom: '0.5rem' }}>
                    <span>Subtotal</span>
                    <span>₦{totalAmount.toLocaleString()}</span>
                  </div>
                  <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '0.8125rem', color: 'var(--muted)', marginBottom: '0.75rem' }}>
                    <span>Delivery fee</span>
                    <span style={{ color: 'var(--lime)' }}>Free (Promo)</span>
                  </div>
                  <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', borderTop: '1px solid var(--line)', paddingTop: '0.75rem' }}>
                    <span style={{ fontWeight: 600, color: 'var(--ink)' }}>Total Payable</span>
                    <span style={{ fontFamily: 'var(--font-serif)', fontSize: '1.35rem', fontWeight: 600, color: 'var(--lime)' }}>
                      ₦{totalAmount.toLocaleString()}
                    </span>
                  </div>
                </div>

                <button
                  type="submit"
                  disabled={loading}
                  className="btn btn-primary"
                  style={{ width: '100%', padding: '0.85rem', fontSize: '0.9375rem' }}
                >
                  {loading ? 'Processing Order...' : paymentMethod === 'paystack' ? `Pay ₦${totalAmount.toLocaleString()} with Paystack` : `Place Order (₦${totalAmount.toLocaleString()})`}
                </button>

                <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '0.4rem', marginTop: '1rem', color: 'var(--muted)', fontSize: '0.75rem' }}>
                  <ShieldCheck size={14} color="var(--lime)" />
                  <span>Secured by Paystack & atomic inventory lock</span>
                </div>
              </div>
            </div>
          </form>
        </div>
      </main>

      {/* Full-screen Loading Overlay for Checkout / Payment */}
      {loading && (
        <div
          style={{
            position: 'fixed',
            inset: 0,
            backgroundColor: 'rgba(11, 15, 14, 0.88)',
            backdropFilter: 'blur(8px)',
            display: 'flex',
            flexDirection: 'column',
            alignItems: 'center',
            justifyContent: 'center',
            zIndex: 9999,
            gap: '1.25rem'
          }}
        >
          <div style={{ position: 'relative', width: '56px', height: '56px' }}>
            <div
              style={{
                position: 'absolute',
                inset: 0,
                border: '3px solid rgba(185, 255, 102, 0.15)',
                borderRadius: '50%'
              }}
            />
            <div
              style={{
                position: 'absolute',
                inset: 0,
                border: '3px solid transparent',
                borderTopColor: 'var(--lime)',
                borderRightColor: 'rgba(185, 255, 102, 0.5)',
                borderRadius: '50%',
                animation: 'marketLinkSpin 0.75s cubic-bezier(0.4, 0, 0.2, 1) infinite',
                boxShadow: '0 0 20px rgba(185, 255, 102, 0.3)'
              }}
            />
          </div>

          <div style={{ textAlign: 'center' }}>
            <h3 style={{ fontSize: '1.2rem', fontWeight: 600, color: 'var(--ink)', marginBottom: '0.35rem' }}>
              {loadingMessage}
            </h3>
            <p style={{ fontSize: '0.8125rem', color: 'var(--muted)', margin: 0 }}>
              Please do not refresh or close this window
            </p>
          </div>
        </div>
      )}
    </div>
  );
};

export default Checkout;

