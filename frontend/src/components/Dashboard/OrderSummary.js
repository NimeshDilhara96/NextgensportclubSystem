import React from 'react';
import styles from './ClubStore.module.css';

const OrderSummary = ({ order, onClose }) => {
  if (!order) return null;

  return (
    <div className={styles.cartModal}>
      <div className={styles.cartModalContent}>
        <div className={styles.cartHeader}>
          <h2>Order Summary</h2>
          <button className={styles.closeModal} onClick={onClose}>&times;</button>
        </div>
        <div className={styles.orderDetails}>
          <h3>Order ID: {order._id}</h3>
          <div>
            <strong>Address:</strong> {order.address}
          </div>
          <div>
            <strong>Phone:</strong> {order.phone}
          </div>
          <div>
            <strong>Email:</strong> {order.email}
          </div>
          <div>
            <strong>Status:</strong> {order.status}
          </div>
          <div className={styles.cartItems}>
            <h4>Products:</h4>
            <ul>
              {order.products.map((item, idx) => (
                <li key={idx}>
                  Product: {item.product} | Quantity: {item.quantity}
                </li>
              ))}
            </ul>
          </div>
          <div className={styles.cartTotal}>
            <span>Total:</span>
            <span>${order.total}</span>
          </div>
        </div>
      </div>
    </div>
  );
};

export default OrderSummary; 