import React from 'react';
import { PackageSearch } from 'lucide-react';

export const LoadingState = ({ message = 'Loading content...' }) => (
  <div style={{ textAlign: 'center', padding: '3.5rem 1rem', color: 'var(--muted)', display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center' }}>
    <div style={{ position: 'relative', width: '40px', height: '40px', marginBottom: '1.25rem' }}>
      <div
        style={{
          position: 'absolute',
          inset: 0,
          border: '2.5px solid rgba(185, 255, 102, 0.15)',
          borderRadius: '50%',
        }}
      />
      <div
        style={{
          position: 'absolute',
          inset: 0,
          border: '2.5px solid transparent',
          borderTopColor: 'var(--lime)',
          borderRightColor: 'rgba(185, 255, 102, 0.4)',
          borderRadius: '50%',
          animation: 'marketLinkSpin 0.75s cubic-bezier(0.4, 0, 0.2, 1) infinite',
          boxShadow: '0 0 15px rgba(185, 255, 102, 0.2)'
        }}
      />
    </div>
    <p style={{ fontSize: '0.875rem', fontWeight: 500, color: 'var(--ink)', letterSpacing: '0.01em', opacity: 0.9 }}>{message}</p>
    <style>{`
      @keyframes marketLinkSpin {
        to { transform: rotate(360deg); }
      }
    `}</style>
  </div>
);

export const EmptyState = ({ title = 'No items found', description = 'Check back later or adjust your filters.', action }) => (
  <div
    style={{
      textAlign: 'center',
      padding: '3.5rem 1.5rem',
      backgroundColor: 'var(--surface)',
      border: '1px solid var(--line)',
      borderRadius: 'var(--radius)',
      margin: '1.5rem 0'
    }}
  >
    <div
      style={{
        width: '48px',
        height: '48px',
        borderRadius: '50%',
        backgroundColor: 'var(--surface-2)',
        border: '1px solid var(--line)',
        color: 'var(--muted)',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        margin: '0 auto 1.25rem'
      }}
    >
      <PackageSearch size={22} color="var(--muted)" />
    </div>
    <h3 style={{ fontSize: '1.1rem', fontWeight: 600, color: 'var(--ink)', marginBottom: '0.4rem' }}>{title}</h3>
    <p style={{ fontSize: '0.875rem', color: 'var(--muted)', maxWidth: '400px', margin: '0 auto 1.5rem' }}>{description}</p>
    {action && <div>{action}</div>}
  </div>
);

export const ErrorState = ({ message = 'Failed to load data', onRetry }) => (
  <div
    style={{
      textAlign: 'center',
      padding: '2.5rem 1.5rem',
      backgroundColor: 'var(--surface)',
      border: '1px solid rgba(239, 68, 68, 0.3)',
      borderRadius: 'var(--radius)',
      margin: '1.5rem 0'
    }}
  >
    <p style={{ color: 'var(--status-cancelled)', fontSize: '0.9rem', marginBottom: '1rem' }}>{message}</p>
    {onRetry && (
      <button onClick={onRetry} className="btn btn-outline" style={{ fontSize: '0.8125rem', padding: '0.4rem 0.9rem' }}>
        Try Again
      </button>
    )}
  </div>
);
