import React, { useState, useEffect, useCallback } from 'react';
import { useNavigate } from 'react-router-dom';
import axios from 'axios';
import styles from './billing.module.css';
import SlideNav from '../appnavbar/slidenav';
import Container from '../common/Container';
import logo from '../../assets/logo.png';

const Billing = () => {
  const [isSidebarOpen, setSidebarOpen] = useState(true);
  const [isLoading, setIsLoading] = useState(true);
  const [userData, setUserData] = useState({
    name: '',
    email: '',
    membershipType: 'free',
    membershipStatus: 'inactive',
    nextPayment: 'N/A',
    membershipStart: 'N/A',
    membershipEnd: 'N/A',
  });
  const [billingHistory, setBillingHistory] = useState([]);
  const [currentInvoice, setCurrentInvoice] = useState(null);
  const [billingStats, setBillingStats] = useState({
    totalPaid: 0,
    pendingAmount: 0,
    nextPaymentAmount: 0,
    paymentCount: 0
  });
  const [serverError, setServerError] = useState(false);
  const navigate = useNavigate();

  // Updated membership pricing
  const getMembershipPrice = useCallback((membershipType) => {
    switch (membershipType?.toLowerCase()) {
      case 'big': 
        return 2500; // Monthly Big plan
      case 'premium': 
        return 25000; // Annual Premium plan  
      case 'free':
        return 0;
      default: 
        return 0;
    }
  }, []);

  const getBillingCycle = useCallback((membershipType) => {
    switch (membershipType?.toLowerCase()) {
      case 'big':
        return 'Monthly';
      case 'premium':
        return 'Annual';
      case 'free':
        return 'Free';
      default:
        return 'N/A';
    }
  }, []);

  const calculateNextPaymentAmount = useCallback((membershipType, membershipEnd, membershipStatus) => {
    if (!membershipEnd || membershipType === 'free' || membershipStatus !== 'active') {
      return 0;
    }
    
    const endDate = new Date(membershipEnd);
    const now = new Date();
    
    // If membership has expired or expires soon (within 7 days), show renewal amount
    const daysUntilExpiry = Math.ceil((endDate - now) / (1000 * 60 * 60 * 24));
    
    if (daysUntilExpiry <= 7) {
      return getMembershipPrice(membershipType);
    }
    
    return 0;
  }, [getMembershipPrice]);

  const fetchBillingData = useCallback(async () => {
    try {
      setIsLoading(true);
      const userEmail = sessionStorage.getItem('userEmail');
      
      if (!userEmail) {
        navigate('/login');
        return;
      }

      // Fetch user data
      const userResponse = await axios.get(`http://localhost:8070/user/getByEmail/${userEmail}`);
      
      if (userResponse.data.status === 'success') {
        const user = userResponse.data.user;
        const membershipType = user.membershipPackage || 'free';
        const membershipStatus = user.membershipStatus || 'inactive';
        
        setUserData({
          name: user.name || 'User',
          email: user.email || userEmail,
          membershipType: membershipType,
          membershipStatus: membershipStatus,
          nextPayment: user.membershipEnd ? new Date(user.membershipEnd).toLocaleDateString() : 'N/A',
          membershipStart: user.membershipStart ? new Date(user.membershipStart).toLocaleDateString() : 'N/A',
          membershipEnd: user.membershipEnd ? new Date(user.membershipEnd).toLocaleDateString() : 'N/A',
        });

        // Fetch payment history
        try {
          const paymentsResponse = await axios.get(`http://localhost:8070/payments/user/${userEmail}`);
          
          if (paymentsResponse.data.status === 'success') {
            const payments = paymentsResponse.data.payments || [];
            const sortedPayments = payments.sort((a, b) => new Date(b.date || b.createdAt) - new Date(a.date || a.createdAt));
            
            setBillingHistory(sortedPayments);
            setCurrentInvoice(sortedPayments[0] || null);

            // Calculate billing stats
            const successfulPayments = payments.filter(p => p.status === 'success');
            const pendingPayments = payments.filter(p => p.status === 'pending');
            
            setBillingStats({
              totalPaid: successfulPayments.reduce((sum, p) => sum + (p.amount || 0), 0),
              pendingAmount: pendingPayments.reduce((sum, p) => sum + (p.amount || 0), 0),
              nextPaymentAmount: calculateNextPaymentAmount(membershipType, user.membershipEnd, membershipStatus),
              paymentCount: successfulPayments.length
            });
          }
        } catch (paymentError) {
          console.error('Error fetching payments:', paymentError);
          setBillingHistory([]);
        }
      }
    } catch (error) {
      console.error('Error fetching billing data:', error);
      if (!error.response) {
        setServerError(true);
      }
    } finally {
      setIsLoading(false);
    }
  }, [navigate, calculateNextPaymentAmount]);

  useEffect(() => {
    fetchBillingData();
  }, [fetchBillingData]);

  const getPaymentStatusColor = (status) => {
    switch (status?.toLowerCase()) {
      case 'success': return '#16a34a';
      case 'pending': return '#ea580c';
      case 'failed': return '#dc2626';
      default: return '#64748b';
    }
  };

  const getPaymentStatusIcon = (status) => {
    switch (status?.toLowerCase()) {
      case 'success': return 'fas fa-check-circle';
      case 'pending': return 'fas fa-clock';
      case 'failed': return 'fas fa-times-circle';
      default: return 'fas fa-question-circle';
    }
  };

  const formatPaymentDate = (payment) => {
    const date = new Date(payment.date || payment.createdAt);
    return isNaN(date.getTime()) ? new Date() : date;
  };

  const downloadInvoice = (payment) => {
    const invoiceDate = formatPaymentDate(payment);
    const invoiceData = `
NEXTGEN SPORT CLUB
Professional Billing Invoice
===============================================

Invoice Number: ${payment.paymentId}
Invoice Date: ${invoiceDate.toLocaleDateString()}
Due Date: ${invoiceDate.toLocaleDateString()}

BILL TO:
${userData.name}
${userData.email}

SERVICES:
Description: ${payment.planName} 
Plan Type: ${payment.type || 'membership'}
Billing Cycle: ${getBillingCycle(payment.planName)}

PAYMENT DETAILS:
Amount: Rs. ${payment.amount?.toLocaleString()}
Status: ${payment.status?.toUpperCase()}
Payment Method: Credit Card

TOTAL: Rs. ${payment.amount?.toLocaleString()}

Thank you for choosing NextGen Sport Club!

For questions about this invoice, please contact:
Email: billing@nextgensportclub.com
Phone: +94 11 234 5678

===============================================
NextGen Sport Club
Professional Fitness & Sports Solutions
www.nextgensportclub.com
`;

    const blob = new Blob([invoiceData], { type: 'text/plain' });
    const url = window.URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `NextGen-Invoice-${payment.paymentId}.txt`;
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    window.URL.revokeObjectURL(url);
  };

  if (serverError) {
    return (
      <div className={styles.loadingContainer}>
        <img src={logo} alt="NextGen Sport Club Logo" style={{ width: 140, marginBottom: 24 }} />
        <h2 style={{ color: '#dc2626', marginBottom: 12, fontWeight: 700 }}>Service Unavailable</h2>
        <p style={{ color: '#64748b', fontSize: 18 }}>
          Our billing system is temporarily unavailable.<br />
          Please try again in a few moments.
        </p>
      </div>
    );
  }

  if (isLoading) {
    return (
      <div className={styles.loadingContainer}>
        <img src={logo} alt="NextGen Sport Club Logo" style={{ width: 120, marginBottom: 20 }} />
        <div className={styles.loadingSpinner}></div>
        <p className={styles.loadingText}>Loading billing information...</p>
      </div>
    );
  }

  return (
    <>
      <SlideNav isSidebarOpen={isSidebarOpen} toggleSidebar={() => setSidebarOpen(!isSidebarOpen)} />
      <Container isSidebarOpen={isSidebarOpen}>
        <div className={styles.billingContainer}>
          {/* Header */}
          <div className={styles.header}>
            <div className={styles.headerTitle}>
              <h1>💳 Billing & Payments</h1>
              <p className={styles.headerDate}>
                {new Date().toLocaleDateString('en-US', { 
                  weekday: 'long', year: 'numeric', month: 'long', day: 'numeric' 
                })}
              </p>
            </div>
            <div className={styles.headerActions}>
              <button className={styles.actionButton} onClick={() => navigate('/membership')}>
                <i className="fas fa-upgrade"></i> Upgrade Plan
              </button>
            </div>
          </div>

          {/* Account Overview */}
          <div className={styles.accountOverview}>
            <div className={styles.overviewHeader}>
              <h2 className={styles.overviewTitle}>
                Account Overview for <span className={styles.userName}>{userData.name}</span>
              </h2>
              <p className={styles.overviewSubtitle}>
                Comprehensive billing management and payment tracking
              </p>
            </div>
            <div className={styles.accountInfo}>
              <div className={styles.infoItem}>
                <span className={styles.infoLabel}>Current Plan</span>
                <span className={`${styles.infoBadge} ${styles[userData.membershipType]}`}>
                  {userData.membershipType === 'big' ? 'Big Plan' : 
                   userData.membershipType === 'premium' ? 'Premium Plan' : 'Free Plan'}
                </span>
              </div>
              <div className={styles.infoItem}>
                <span className={styles.infoLabel}>Account Status</span>
                <span className={`${styles.infoBadge} ${styles[userData.membershipStatus]}`}>
                  {userData.membershipStatus}
                </span>
              </div>
              <div className={styles.infoItem}>
                <span className={styles.infoLabel}>Next Billing Date</span>
                <span className={styles.infoValue}>
                  {userData.nextPayment !== 'N/A' ? userData.nextPayment : 'No active subscription'}
                </span>
              </div>
            </div>
          </div>

          {/* Billing Statistics - Removed Plan Value Card */}
          <div className={styles.statsGrid}>
            <div className={`${styles.statCard} ${styles.statCard1}`}>
              <div className={styles.statIcon}>💰</div>
              <div className={styles.statDetails}>
                <h3>Total Payments</h3>
                <p className={styles.statValue}>Rs. {billingStats.totalPaid.toLocaleString()}</p>
                <span className={`${styles.statTrend} ${styles.positive}`}>
                  <i className="fas fa-check"></i>
                  {billingStats.paymentCount} successful payments
                </span>
              </div>
            </div>

            <div className={`${styles.statCard} ${styles.statCard2}`}>
              <div className={styles.statIcon}>⏰</div>
              <div className={styles.statDetails}>
                <h3>Outstanding Balance</h3>
                <p className={styles.statValue}>Rs. {billingStats.pendingAmount.toLocaleString()}</p>
                <span className={`${styles.statTrend} ${billingStats.pendingAmount > 0 ? styles.negative : styles.positive}`}>
                  {billingStats.pendingAmount > 0 ? 'Payment required' : 'Account current'}
                </span>
              </div>
            </div>

            <div className={`${styles.statCard} ${styles.statCard3}`}>
              <div className={styles.statIcon}>📅</div>
              <div className={styles.statDetails}>
                <h3>Next Payment Due</h3>
                <p className={styles.statValue}>Rs. {billingStats.nextPaymentAmount.toLocaleString()}</p>
                <span className={styles.statTrend}>
                  {billingStats.nextPaymentAmount > 0 ? 'Renewal required' : 'No payment due'}
                </span>
              </div>
            </div>
          </div>

          {/* Main Content Grid */}
          <div className={styles.contentGrid}>
            {/* Current Invoice */}
            <div className={styles.card}>
              <div className={styles.cardHeader}>
                <h2>📄 Latest Invoice</h2>
                {currentInvoice && (
                  <button className={styles.cardAction} onClick={() => downloadInvoice(currentInvoice)}>
                    <i className="fas fa-download"></i> Download
                  </button>
                )}
              </div>
              <div className={styles.cardContent}>
                {!currentInvoice ? (
                  <div className={styles.emptyState}>
                    <i className="fas fa-file-invoice-dollar"></i>
                    <p>No invoices available</p>
                    <button className={styles.actionButton} onClick={() => navigate('/membership')}>
                      Start Subscription
                    </button>
                  </div>
                ) : (
                  <div className={styles.invoiceDetails}>
                    <div className={styles.invoiceHeader}>
                      <h4>Invoice #{currentInvoice.paymentId}</h4>
                      <span className={styles.invoiceDate}>
                        {formatPaymentDate(currentInvoice).toLocaleDateString()}
                      </span>
                    </div>
                    <div className={styles.invoiceBody}>
                      <div className={styles.invoiceItem}>
                        <span>Service:</span>
                        <span>{currentInvoice.planName} </span>
                      </div>
                      <div className={styles.invoiceItem}>
                        <span>Amount:</span>
                        <span>Rs. {currentInvoice.amount?.toLocaleString()}</span>
                      </div>
                      <div className={styles.invoiceItem}>
                        <span>Status:</span>
                        <span 
                          className={styles.statusBadge}
                          style={{ 
                            color: getPaymentStatusColor(currentInvoice.status),
                            backgroundColor: `${getPaymentStatusColor(currentInvoice.status)}15`
                          }}
                        >
                          <i className={getPaymentStatusIcon(currentInvoice.status)}></i>
                          {currentInvoice.status}
                        </span>
                      </div>
                      <div className={styles.invoiceItem}>
                        <span>Billing Cycle:</span>
                        <span>{getBillingCycle(currentInvoice.planName)}</span>
                      </div>
                    </div>
                  </div>
                )}
              </div>
            </div>

            {/* Payment History - Removed Make Payment Button */}
            <div className={styles.card}>
              <div className={styles.cardHeader}>
                <h2>📋 Payment History</h2>
              </div>
              <div className={styles.cardContent}>
                {billingHistory.length === 0 ? (
                  <div className={styles.emptyState}>
                    <i className="fas fa-history"></i>
                    <p>No payment history</p>
                    <button className={styles.actionButton} onClick={() => navigate('/membership')}>
                      Make First Payment
                    </button>
                  </div>
                ) : (
                  <div className={styles.paymentHistory}>
                    {billingHistory.map((payment, index) => {
                      const paymentDate = formatPaymentDate(payment);
                      return (
                        <div key={index} className={styles.paymentItem}>
                          <div className={styles.paymentDate}>
                            <div className={styles.dateDay}>{paymentDate.getDate()}</div>
                            <div className={styles.dateMonth}>
                              {paymentDate.toLocaleDateString('en-US', { month: 'short' })}
                            </div>
                            <div className={styles.dateYear}>{paymentDate.getFullYear()}</div>
                          </div>
                          <div className={styles.paymentDetails}>
                            <h4>{payment.planName} </h4>
                            <p>Invoice: {payment.paymentId}</p>
                            <p>Type: {getBillingCycle(payment.planName)}</p>
                          </div>
                          <div className={styles.paymentAmount}>
                            <span className={styles.amount}>Rs. {payment.amount?.toLocaleString()}</span>
                            <span 
                              className={styles.paymentStatus}
                              style={{ color: getPaymentStatusColor(payment.status) }}
                            >
                              <i className={getPaymentStatusIcon(payment.status)}></i>
                              {payment.status}
                            </span>
                          </div>
                          <div className={styles.paymentActions}>
                            <button 
                              className={styles.downloadBtn}
                              onClick={() => downloadInvoice(payment)}
                              title="Download Invoice"
                            >
                              <i className="fas fa-download"></i>
                            </button>
                            {payment.status === 'failed' && (
                              <button 
                                className={styles.retryBtn}
                                onClick={() => navigate('/payment-gateway')}
                                title="Retry Payment"
                              >
                                <i className="fas fa-redo"></i>
                              </button>
                            )}
                          </div>
                        </div>
                      );
                    })}
                  </div>
                )}
              </div>
            </div>

            {/* Subscription Details */}
            <div className={styles.card}>
              <div className={styles.cardHeader}>
                <h2>🎯 Subscription Details</h2>
                <button className={styles.cardAction} onClick={() => navigate('/membership')}>
                  <i className="fas fa-edit"></i> Manage
                </button>
              </div>
              <div className={styles.cardContent}>
                {userData.membershipType === 'free' ? (
                  <div className={styles.emptyState}>
                    <i className="fas fa-user-plus"></i>
                    <p>No active subscription</p>
                    <button className={styles.actionButton} onClick={() => navigate('/membership')}>
                      Choose Plan
                    </button>
                  </div>
                ) : (
                  <div className={styles.membershipDetails}>
                    <div className={styles.membershipHeader}>
                      <h4>
                        {userData.membershipType === 'big' ? 'Big Plan' : 'Premium Plan'}
                      </h4>
                      <span className={`${styles.membershipBadge} ${styles[userData.membershipStatus]}`}>
                        {userData.membershipStatus}
                      </span>
                    </div>
                    <div className={styles.membershipInfo}>
                      <div className={styles.membershipItem}>
                        <i className="fas fa-calendar-check"></i>
                        <span>Started: {userData.membershipStart}</span>
                      </div>
                      <div className={styles.membershipItem}>
                        <i className="fas fa-calendar-times"></i>
                        <span>Expires: {userData.membershipEnd}</span>
                      </div>
                      <div className={styles.membershipItem}>
                        <i className="fas fa-money-bill-wave"></i>
                        <span>Price: Rs. {getMembershipPrice(userData.membershipType).toLocaleString()}</span>
                      </div>
                      <div className={styles.membershipItem}>
                        <i className="fas fa-sync-alt"></i>
                        <span>Billing: {getBillingCycle(userData.membershipType)}</span>
                      </div>
                      <div className={styles.membershipItem}>
                        <i className="fas fa-credit-card"></i>
                        <span>Payment Method: Credit Card</span>
                      </div>
                    </div>
                  </div>
                )}
              </div>
            </div>
          </div>
        </div>
      </Container>
    </>
  );
};

export default Billing;