import React from 'react';
import './membership.css';
import SlideNav from '../appnavbar/slidenav';

const Membership = () => {
  const [isSidebarOpen, setSidebarOpen] = React.useState(true);

  const toggleSidebar = () => {
    setSidebarOpen(!isSidebarOpen);
  };

  const memberships = [
    {
      type: "Light",
      price: "$29.99",
      period: "/month",
      features: [
        "Access to basic gym equipment",
        "2 group classes per month",
        "Basic fitness tracking",
        "Locker room access",
        "Standard support"
      ]
    },
    {
      type: "Big",
      price: "$49.99",
      period: "/month",
      features: [
        "Full gym access",
        "Unlimited group classes",
        "Advanced fitness tracking",
        "Personal locker",
        "Priority support",
        "1 personal training session/month",
        "Nutrition consultation"
      ],
      recommended: true
    },
    {
      type: "Premium",
      price: "$89.99",
      period: "/month",
      features: [
        "24/7 gym access",
        "Unlimited group classes",
        "Premium fitness tracking",
        "Luxury locker room",
        "VIP support",
        "4 personal training sessions/month",
        "Monthly nutrition plan",
        "Spa access",
        "Guest passes"
      ]
    }
  ];

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
            <div className="membership-cards">
              {memberships.map((plan) => (
                <div 
                  key={plan.type} 
                  className={`membership-card ${plan.recommended ? 'recommended' : ''}`}
                >
                  {plan.recommended && (
                    <div className="recommended-badge">Most Popular</div>
                  )}
                  <div className="card-header">
                    <h2>{plan.type}</h2>
                    <div className="price">
                      <span className="amount">{plan.price}</span>
                      <span className="period">{plan.period}</span>
                    </div>
                  </div>
                  <div className="card-content">
                    <ul>
                      {plan.features.map((feature, index) => (
                        <li key={index}>{feature}</li>
                      ))}
                    </ul>
                    <button className="select-plan-btn">
                      Select Plan
                    </button>
                  </div>
                </div>
              ))}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default Membership;
