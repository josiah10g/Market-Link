import React from 'react';

export class ErrorBoundary extends React.Component {
  constructor(props) {
    super(props);
    this.state = { hasError: false, error: null, errorInfo: null };
  }

  static getDerivedStateFromError(error) {
    return { hasError: true, error };
  }

  componentDidCatch(error, errorInfo) {
    console.error('Unhandled Application Error:', error, errorInfo);
    this.setState({ errorInfo });
  }

  render() {
    if (this.state.hasError) {
      return (
        <div
          style={{
            minHeight: '100vh',
            display: 'flex',
            flexDirection: 'column',
            alignItems: 'center',
            justifyContent: 'center',
            backgroundColor: '#0B0F0E',
            color: '#EDEFEC',
            padding: '2rem',
            textAlign: 'center',
            fontFamily: 'system-ui, sans-serif'
          }}
        >
          <div style={{ maxWidth: '600px', backgroundColor: '#121816', border: '1px solid #EF4444', borderRadius: '8px', padding: '2rem' }}>
            <h2 style={{ color: '#EF4444', marginBottom: '1rem', fontSize: '1.4rem' }}>Application Error</h2>
            <p style={{ color: '#8B978F', marginBottom: '1.5rem', fontSize: '0.9rem' }}>
              Something failed to load in the application. Details below:
            </p>
            <pre
              style={{
                backgroundColor: '#171F1C',
                padding: '1rem',
                borderRadius: '6px',
                color: '#B9FF66',
                fontSize: '0.8rem',
                textAlign: 'left',
                overflowX: 'auto',
                marginBottom: '1.5rem'
              }}
            >
              {this.state.error?.toString() || 'Unknown error'}
            </pre>
            <button
              onClick={() => {
                localStorage.clear();
                window.location.reload();
              }}
              style={{
                backgroundColor: '#B9FF66',
                color: '#0B0F0E',
                border: 'none',
                padding: '0.6rem 1.2rem',
                fontWeight: 600,
                borderRadius: '4px',
                cursor: 'pointer'
              }}
            >
              Clear Cache & Reload
            </button>
          </div>
        </div>
      );
    }

    return this.props.children;
  }
}

export default ErrorBoundary;
