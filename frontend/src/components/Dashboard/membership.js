import React, { useEffect, useState } from 'react';
import './membership.css';
import SlideNav from '../appnavbar/slidenav';
import axios from 'axios';
import PaymentGateway from '../payments/paymentgetway';

const Membership = () => {
  const [isSidebarOpen, setSidebarOpen] = useState(true);
  const [memberships, setMemberships] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [message, setMessage] = useState('');
  const [currentMembership, setCurrentMembership] = useState('');
  const [showPayment, setShowPayment] = useState(false);
  const [selectedPlan, setSelectedPlan] = useState(null);
  const [membershipEnd, setMembershipEnd] = useState(null);

  const toggleSidebar = () => {
    setSidebarOpen(!isSidebarOpen);
  };

  // Fetch membership plans
  useEffect(() => {
    const fetchMemberships = async () => {
      try {
        setLoading(true);
        const res = await axios.get('http://localhost:8070/memberships');
        if (res.data.status === 'success') {
          setMemberships(res.data.memberships);
        } else {
          setError('Failed to load membership plans');
        }
      } catch (err) {
        setError('Failed to load membership plans');
      } finally {
        setLoading(false);
      }
    };
    fetchMemberships();
  }, []);

  // Fetch user's current membership info
  const fetchUserMembership = async () => {
    const userEmail = sessionStorage.getItem('userEmail');
    if (!userEmail) return;
    try {
      const res = await axios.get(`http://localhost:8070/user/getByEmail/${userEmail}`);
      if (res.data.status === 'success') {
        setCurrentMembership(res.data.user.membershipPackage);
        setMembershipEnd(res.data.user.membershipEnd);
      }
    } catch (err) {
      // ignore
    }
  };

  useEffect(() => {
    fetchUserMembership();
    // eslint-disable-next-line
  }, []);

  const handleSelectPlan = (planName) => {
    setMessage('');
    const plan = memberships.find((p) => p.name === planName);
    setSelectedPlan(plan);
    setShowPayment(true);
  };

  const handlePaymentSuccess = async (payment) => {
    setShowPayment(false);
    const userEmail = sessionStorage.getItem('userEmail');
    if (!userEmail || !selectedPlan) return;
    try {
      await axios.post('http://localhost:8070/memberships/purchase', {
        userEmail,
        membershipName: selectedPlan.name,
        paymentId: payment.paymentId // Pass this to backend
      });
      setMessage(`Successfully purchased the ${selectedPlan.name} membership!`);
      await fetchUserMembership();
    } catch (err) {
      setMessage(err.response?.data?.message || 'Failed to purchase membership.');
    }
    setSelectedPlan(null);
  };

  const handlePaymentFailure = () => {
    setShowPayment(false);
    setMessage('Payment failed! Please try again.');
    setSelectedPlan(null);
  };

  return (
    <div className="dashboard-container">
      <SlideNav 
        isSidebarOpen={isSidebarOpen} 
        toggleSidebar={toggleSidebar}
      />
      <div className={`container ${!isSidebarOpen ? 'sidebar-closed' : ''}`}>
        <div className="membership-wrapper">
          <div className="membership-content">
            <h1 className="page-title">Choose Your Membership Plan</h1>
            <p className="subtitle">Select the perfect membership that fits your fitness journey</p>
            <div style={{ marginBottom: 16 }}>
              <b>Your current membership:</b>{" "}
              {currentMembership
                ? currentMembership.charAt(0).toUpperCase() + currentMembership.slice(1)
                : "Free"}
              {membershipEnd && (
                <span style={{ marginLeft: 16 }}>
                  <b>Next payment date:</b> {new Date(membershipEnd).toLocaleDateString()}
                </span>
              )}
            </div>
            {loading ? (
              <div>Loading membership plans...</div>
            ) : error ? (
              <div style={{ color: 'red' }}>{error}</div>
            ) : (
              <div className="membership-cards">
                {memberships.map((plan) => {
                  const isCurrent = currentMembership && plan.name.toLowerCase() === currentMembership.toLowerCase();
                  // Set period label: Premium is annual, others are monthly
                  let periodLabel = '';
                  if (plan.name.toLowerCase() === 'premium') {
                    periodLabel = '/year';
                  } else {
                    periodLabel = '/month';
                  }
                  return (
                    <React.Fragment key={plan._id}>
                      <div
                        className={`membership-card ${plan.name.toLowerCase() === 'premium' ? 'premium-card' : ''} ${plan.name.toLowerCase() === 'big' ? 'big-card' : ''} ${isCurrent ? 'current-plan' : ''}`}
                      >
                        {plan.name.toLowerCase() === 'premium' && (
                          <div className="ribbon-badge">Most Popular</div>
                        )}
                        <div className="card-header">
                          <h2 style={{ position: 'relative', zIndex: 1 }}>{plan.name}</h2>
                          <div className="price">
                            <span className="amount">LKR {plan.price}</span>
                            <span className="period">{periodLabel}</span>
                          </div>
                        </div>
                        <div className="card-content">
                          <ul>
                            {plan.features.map((feature, index) => (
                              <li key={index}>{feature}</li>
                            ))}
                          </ul>
                          <button
                            className="select-plan-btn"
                            onClick={() => handleSelectPlan(plan.name)}
                            disabled={isCurrent}
                          >
                            {isCurrent ? 'Current Plan' : 'Select Plan'}
                          </button>
                        </div>
                      </div>
                    </React.Fragment>
                  );
                })}
              </div>
            )}
            {message && <div style={{ marginTop: 20, color: message.startsWith('Successfully') ? 'green' : 'red' }}>{message}</div>}
            <PaymentGateway
              open={showPayment}
              onClose={() => setShowPayment(false)}
              amount={selectedPlan?.price}
              planName={selectedPlan?.name}
              userEmail={sessionStorage.getItem('userEmail')}
              onSuccess={handlePaymentSuccess} // <-- This will receive the payment object
              onFailure={handlePaymentFailure}
            />
          </div>
        </div>
      </div>
    </div>
  );
};

export default Membership;
