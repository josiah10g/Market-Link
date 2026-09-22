import React from 'react';

export const OrderStatusBadge = ({ status }) => {
  const getBadgeClass = (st) => {
    switch (st?.toLowerCase()) {
      case 'pending':
        return 'badge-pending';
      case 'accepted':
      case 'in_progress':
        return 'badge-progress';
      case 'ready':
        return 'badge-ready';
      case 'completed':
        return 'badge-completed';
      case 'cancelled':
        return 'badge-cancelled';
      default:
        return 'badge-pending';
    }
  };

  const getDotColor = (st) => {
    switch (st?.toLowerCase()) {
      case 'pending':
        return '#F59E0B';
      case 'accepted':
      case 'in_progress':
        return '#3B82F6';
      case 'ready':
        return '#A855F7';
      case 'completed':
        return '#B9FF66';
      case 'cancelled':
        return '#EF4444';
      default:
        return '#8B978F';
    }
  };

  const getDisplayLabel = (st) => {
    const s = st?.toLowerCase();
    if (s === 'in_progress' || s === 'preparing') return 'Preparing';
    if (s === 'pending') return 'Order Placed';
    if (s === 'accepted') return 'Accepted';
    if (s === 'ready') return 'Ready';
    if (s === 'completed') return 'Completed';
    if (s === 'cancelled') return 'Cancelled';
    return st || '';
  };

  return (
    <span className={`badge ${getBadgeClass(status)}`}>
      <span
        style={{
          width: '6px',
          height: '6px',
          borderRadius: '50%',
          backgroundColor: getDotColor(status),
          display: 'inline-block'
        }}
      />
      {getDisplayLabel(status)}
    </span>
  );
};

export default OrderStatusBadge;
