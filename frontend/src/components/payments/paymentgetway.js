import React, { useState, useEffect } from "react";
import styles from "./paymentgetway.module.css";

const PaymentGateway = ({
  open,
  onClose,
  amount,
  planName,
  onSuccess,
  onFailure,
  userEmail,
}) => {
  const [loading, setLoading] = useState(false);
  const [card, setCard] = useState({
    number: "",
    name: "",
    expiry: "",
    cvv: "",
  });

  useEffect(() => {
    if (!open) {
      setCard({ number: "", name: "", expiry: "", cvv: "" });
      setLoading(false);
    }
  }, [open]);

  const handleInputChange = (e) => {
    setCard({ ...card, [e.target.name]: e.target.value });
  };

  const handleFakeSuccess = () => {
    setLoading(true);
    setTimeout(() => {
      setLoading(false);
      onSuccess &&
        onSuccess({
          paymentId: "FAKE_PAYMENT_ID_" + Math.floor(Math.random() * 100000),
        });
    }, 1500);
  };

  const handleFakeFailure = () => {
    setLoading(true);
    setTimeout(() => {
      setLoading(false);
      onFailure && onFailure();
    }, 1500);
  };

  if (!open) return null;

  return (
    <div className={styles.overlay} role="dialog" aria-modal="true">
      <div className={styles.modal}>
        <button
          className={styles.close}
          onClick={onClose}
          disabled={loading}
          aria-label="Close"
        >
          ×
        </button>
        <div className={styles.title}>Fake Payment Gateway</div>
        <div className={styles.amount}>
          Amount: <b>{amount ? `LKR ${amount}` : "LKR 500"}</b>
        </div>
        <form
          className={styles.form}
          onSubmit={(e) => e.preventDefault()}
          autoComplete="off"
        >
          <input
            type="text"
            name="number"
            placeholder="Card Number"
            maxLength={16}
            value={card.number}
            onChange={handleInputChange}
            disabled={loading}
            className={styles.input}
            required
            autoComplete="off"
            aria-label="Card Number"
          />
          <input
            type="text"
            name="name"
            placeholder="Cardholder Name"
            value={card.name}
            onChange={handleInputChange}
            disabled={loading}
            className={styles.input}
            required
            autoComplete="off"
            aria-label="Cardholder Name"
          />
          <div className={styles.row}>
            <input
              type="text"
              name="expiry"
              placeholder="MM/YY"
              maxLength={5}
              value={card.expiry}
              onChange={handleInputChange}
              disabled={loading}
              className={styles.input}
              required
              autoComplete="off"
              aria-label="Expiry Date"
            />
            <input
              type="password"
              name="cvv"
              placeholder="CVV"
              maxLength={3}
              value={card.cvv}
              onChange={handleInputChange}
              disabled={loading}
              className={styles.input}
              required
              autoComplete="off"
              aria-label="CVV"
            />
          </div>
        </form>
        {loading ? (
          <div>
            <span className={styles.spinner} aria-live="polite" />
          </div>
        ) : (
          <>
            <button
              className={`${styles.button} ${styles.pay}`}
              onClick={handleFakeSuccess}
              disabled={loading}
              aria-label={`Pay LKR ${amount || 500}`}
            >
              Pay LKR {amount || 500}
            </button>
            <button
              className={`${styles.button} ${styles.fail}`}
              onClick={handleFakeFailure}
              disabled={loading}
              aria-label="Fail Payment"
            >
              Fail Payment
            </button>
          </>
        )}
      </div>
    </div>
  );
};

export default PaymentGateway;

