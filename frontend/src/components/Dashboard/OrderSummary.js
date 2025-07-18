import React from 'react';
import styles from './OrderSummary.module.css';
import { FaMapMarkerAlt, FaPhone, FaEnvelope, FaInfoCircle, FaBoxOpen } from 'react-icons/fa';

const OrderSummary = ({ order, onClose }) => {
  if (!order) return null;

  return (
    <div className={styles.overlay}>
      <div className={styles.summaryCard}>
        <div className={styles.header}>
          <h2><FaBoxOpen className={styles.headerIcon} /> Order Summary</h2>
          <button className={styles.closeBtn} onClick={onClose}>&times;</button>
        </div>
        <div className={styles.section}>
          <div className={styles.row}><span className={styles.label}>Order ID:</span> <span className={styles.value}>{order._id}</span></div>
          <div className={styles.row}><FaMapMarkerAlt className={styles.icon} /> <span className={styles.label}>Address:</span> <span className={styles.value}>{order.address}</span></div>
          <div className={styles.row}><FaPhone className={styles.icon} /> <span className={styles.label}>Phone:</span> <span className={styles.value}>{order.phone}</span></div>
          <div className={styles.row}><FaEnvelope className={styles.icon} /> <span className={styles.label}>Email:</span> <span className={styles.value}>{order.email}</span></div>
          <div className={styles.row}><FaInfoCircle className={styles.icon} /> <span className={styles.label}>Status:</span> <span className={styles.value}>{order.status}</span></div>
        </div>
        <div className={styles.section}>
          <h4 className={styles.productsTitle}>Products</h4>
          <ul className={styles.productsList}>
            {order.products.map((item, idx) => (
              <li key={idx} className={styles.productItem}>
                <span className={styles.productName}>
                  {item.name || item.product?.name || item.product}
                </span>
                <span className={styles.productQty}>x{item.quantity}</span>
                {item.product?.price && (
                  <span className={styles.productPrice}>${item.product.price}</span>
                )}
              </li>
            ))}
          </ul>
        </div>
        <div className={styles.totalRow}>
          <span className={styles.totalLabel}>Total:</span>
          <span className={styles.totalValue}>${order.total}</span>
        </div>
      </div>
    </div>
  );
};

export default OrderSummary;