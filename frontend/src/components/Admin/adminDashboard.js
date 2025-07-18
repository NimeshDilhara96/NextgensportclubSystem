import React, { useState, useEffect, useRef } from 'react';
import { Link } from 'react-router-dom';
import AdminSlideNav from './AdminSlideNav';
import { getMemberCount } from './adminMemberManagement';
import { FaUsers, FaRunning, FaBuilding, FaCalendarCheck, FaShoppingBag, FaBell, FaChartLine, FaMoneyBillWave } from 'react-icons/fa';
import { Bar } from 'react-chartjs-2';
import { Chart, BarElement, CategoryScale, LinearScale, Tooltip, Legend } from 'chart.js';
import './adminDashboard.css';
import jsPDF from 'jspdf';
import html2canvas from 'html2canvas';

Chart.register(BarElement, CategoryScale, LinearScale, Tooltip, Legend);

const AdminDashboard = () => {
    const [stats, setStats] = useState({
        totalSports: 0,
        totalFacilities: 0,
        totalMembers: 0,
        totalBookings: 0,
        totalRevenue: 0,
        totalOrders: 0
    });
    
    const [loading, setLoading] = useState(true);
    const [recentActivities, setRecentActivities] = useState([]);
    const [showPaymentsModal, setShowPaymentsModal] = useState(false);
    const [allPayments, setAllPayments] = useState([]);
    const [dashboardPayments, setDashboardPayments] = useState([]);
    const summaryRef = useRef();

    useEffect(() => {
        const fetchStats = async () => {
            try {
                setLoading(true);

                // Fetch payments
                const paymentsRes = await fetch('http://localhost:8070/payments');
                const paymentsData = await paymentsRes.json();
                const payments = paymentsData.payments || [];
                setDashboardPayments(payments); // <-- Add this line

                // Calculate totals
                const membershipPayments = payments.filter(p => p.type === 'membership' && p.status === 'success');
                const storePayments = payments.filter(p => p.type === 'store' && p.status === 'success');

                const revenueTotal = payments
                    .filter(p => p.status === 'success')
                    .reduce((sum, p) => sum + (p.amount || 0), 0);

                const ordersCount = storePayments.length;
                const memberCount = await getMemberCount();

                // You can fetch real counts for sports/facilities/bookings if needed
                const sportCount = 6;
                const facilityCount = 4;
                const bookingsCount = 28;

                setStats({
                    totalSports: sportCount,
                    totalFacilities: facilityCount,
                    totalMembers: memberCount,
                    totalBookings: bookingsCount,
                    totalRevenue: revenueTotal,
                    totalOrders: ordersCount
                });

                // Optionally, update recentActivities with payment info
                setRecentActivities([
                    ...storePayments.slice(0, 3).map(p => ({
                        id: p._id,
                        type: 'order',
                        action: 'Store purchase',
                        name: p.userEmail,
                        time: new Date(p.date).toLocaleString()
                    })),
                    ...membershipPayments.slice(0, 3).map(p => ({
                        id: p._id,
                        type: 'member',
                        action: 'Membership payment',
                        name: p.userEmail,
                        time: new Date(p.date).toLocaleString()
                    }))
                ]);

                setLoading(false);
            } catch (error) {
                console.error('Error fetching dashboard stats:', error);
                setLoading(false);
            }
        };

        fetchStats();
    }, []);

    // Format currency for display
    const formatCurrency = (amount) => {
        return new Intl.NumberFormat('en-LK', {
            style: 'currency',
            currency: 'LKR',
            minimumFractionDigits: 0
        }).format(amount);
    };

    const fetchAllPayments = async () => {
        try {
            const res = await fetch('http://localhost:8070/payments');
            const data = await res.json();
            setAllPayments(data.payments || []);
            setShowPaymentsModal(true);
        } catch (err) {
            alert('Failed to fetch payments');
        }
    };

    // Prepare monthly revenue data for the current year
const getMonthlyRevenueData = () => {
    const months = [
        'Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun',
        'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec'
    ];
    const monthlyRevenue = Array(12).fill(0);

    dashboardPayments.forEach(payment => {
        if (payment.status === 'success') {
            const date = new Date(payment.date);
            const year = date.getFullYear();
            const currentYear = new Date().getFullYear();
            if (year === currentYear) {
                const month = date.getMonth();
                monthlyRevenue[month] += payment.amount || 0;
            }
        }
    });

    return {
        labels: months,
        datasets: [
            {
                label: 'Revenue (LKR)',
                data: monthlyRevenue,
                backgroundColor: 'rgba(76, 175, 80, 0.7)'
            }
        ]
    };
};

// Download Payments Table as PDF
const downloadPaymentsPDF = async () => {
    const tableElement = document.getElementById('payments-table');
    if (!tableElement) return;
    const canvas = await html2canvas(tableElement);
    const imgData = canvas.toDataURL('image/png');
    const pdf = new jsPDF('l', 'mm', 'a4');
    pdf.text('All Payments', 10, 10);
    pdf.addImage(imgData, 'PNG', 10, 20, 270, 0);
    pdf.save('payments.pdf');
};

    return (
        <div className="admin-dashboard">
            <AdminSlideNav />
            <div className="main-content">
                <div className="dashboard-header">
                    <h1 className="dashboard-title">Admin Dashboard</h1>
                    <div className="dashboard-actions">
                        <button className="refresh-btn">
                            <span>Refresh Data</span>
                        </button>
                        <div className="date-display">
                            {new Date().toLocaleDateString('en-US', { weekday: 'long', year: 'numeric', month: 'long', day: 'numeric' })}
                        </div>
                    </div>
                </div>
                
                {/* Main Stats Cards */}
                <div className="stats-container">
                    <div className="stat-card">
                        <div className="stat-icon members">
                            <FaUsers />
                        </div>
                        <div className="stat-content">
                            <h3>Total Members</h3>
                            <div className="stat-number">{loading ? '...' : stats.totalMembers}</div>
                        </div>
                        <Link to="/admin/member-management" className="stat-link">View Members</Link>
                    </div>
                    
                    <div className="stat-card">
                        <div className="stat-icon sports">
                            <FaRunning />
                        </div>
                        <div className="stat-content">
                            <h3>Total Sports</h3>
                            <div className="stat-number">{loading ? '...' : stats.totalSports}</div>
                        </div>
                        <Link to="/admin/sports" className="stat-link">Manage Sports</Link>
                    </div>
                    
                    <div className="stat-card">
                        <div className="stat-icon facilities">
                            <FaBuilding />
                        </div>
                        <div className="stat-content">
                            <h3>Total Facilities</h3>
                            <div className="stat-number">{loading ? '...' : stats.totalFacilities}</div>
                        </div>
                        <Link to="/admin/facilities" className="stat-link">Manage Facilities</Link>
                    </div>
                    
                    <div className="stat-card">
                        <div className="stat-icon bookings">
                            <FaCalendarCheck />
                        </div>
                        <div className="stat-content">
                            <h3>Total Bookings</h3>
                            <div className="stat-number">{loading ? '...' : stats.totalBookings}</div>
                        </div>
                        <Link to="/admin/bookings" className="stat-link">View Bookings</Link>
                    </div>
                </div>
                
                {/* Revenue & Orders Section */}
                <div className="revenue-section">
                    <div className="revenue-card">
                        <div className="revenue-header">
                            <h2><FaChartLine /> Revenue Overview</h2>
                            <div className="revenue-period">
                                <select defaultValue="monthly">
                                    <option value="weekly">Weekly</option>
                                    <option value="monthly">Monthly</option>
                                    <option value="yearly">Yearly</option>
                                </select>
                            </div>
                        </div>
                        
                        <div className="revenue-stats">
                            <div className="revenue-stat">
                                <div className="revenue-icon">
                                    <FaMoneyBillWave />
                                </div>
                                <div className="revenue-info">
                                    <h3>Total Revenue</h3>
                                    <p className="revenue-amount">{loading ? '...' : formatCurrency(stats.totalRevenue)}</p>
                                    <p className="revenue-change positive">+12.5% from last period</p>
                                </div>
                            </div>
                            
                            <div className="revenue-stat">
                                <div className="revenue-icon">
                                    <FaShoppingBag />
                                </div>
                                <div className="revenue-info">
                                    <h3>Total Orders</h3>
                                    <p className="revenue-amount">{loading ? '...' : stats.totalOrders}</p>
                                    <p className="revenue-change positive">+5.8% from last period</p>
                                </div>
                            </div>
                        </div>
                        
                        <div className="chart-placeholder" id="revenue-chart">
                            {dashboardPayments.length > 0 ? (
                                <Bar
                                    data={getMonthlyRevenueData()}
                                    options={{
                                        responsive: true,
                                        plugins: {
                                            legend: { display: false },
                                            tooltip: { callbacks: { label: ctx => `LKR ${ctx.parsed.y}` } }
                                        },
                                        scales: {
                                            y: { beginAtZero: true, ticks: { callback: v => `LKR ${v}` } }
                                        }
                                    }}
                                    height={220}
                                />
                            ) : (
                                <div className="chart-message">No payment data for this year.</div>
                            )}
                        </div>

                        {/* Move the View Payments button here */}
                        <div style={{ marginTop: 24, textAlign: 'right' }}>
                            <button
                                className="action-button view-payments"
                                onClick={fetchAllPayments}
                                style={{ padding: '8px 20px', fontWeight: 600 }}
                            >
                                View Payments
                            </button>
                        </div>
                    </div>
                </div>
                
                {/* Recent Activities & Quick Actions Section */}
                <div className="dashboard-bottom">
                    <div className="recent-activities">
                        <div className="panel-header">
                            <h2><FaBell /> Recent Activities</h2>
                            <Link to="/admin/activities" className="view-all">View All</Link>
                        </div>
                        
                        {loading ? (
                            <div className="loading-activities">Loading activities...</div>
                        ) : (
                            <ul className="activity-list">
                                {recentActivities.map(activity => (
                                    <li key={activity.id} className={`activity-item ${activity.type}`}>
                                        <div className="activity-icon"></div>
                                        <div className="activity-content">
                                            <p className="activity-text">
                                                <strong>{activity.action}</strong>: {activity.name}
                                            </p>
                                            <p className="activity-time">{activity.time}</p>
                                        </div>
                                    </li>
                                ))}
                            </ul>
                        )}
                    </div>
                    
                    <div className="quick-actions">
                        <div className="panel-header">
                            <h2>Quick Actions</h2>
                        </div>
                        
                        <div className="action-buttons">
                            <Link to="/admin/member-management" className="action-button add-member">
                                Add New Member
                            </Link>
                            <Link to="/admin/facilities" className="action-button manage-booking">
                                Manage Bookings
                            </Link>
                            <Link to="/admin/create-post" className="action-button create-post">
                                Create Post
                            </Link>
                            <Link to="/admin/club-store" className="action-button view-orders">
                                View Orders
                            </Link>
                            <Link to="#" className="action-button view-payments" onClick={fetchAllPayments}>
                                View Payments
                            </Link>
                        </div>
                    </div>
                </div>
            </div>

            {showPaymentsModal && (
  <div className="modal-overlay" onClick={() => setShowPaymentsModal(false)}>
    <div className="modal-content" onClick={e => e.stopPropagation()}>
      <h2>All Payments</h2>
      <button className="close-modal" onClick={() => setShowPaymentsModal(false)}>Close</button>
      <button className="download-btn" onClick={downloadPaymentsPDF}>Download PDF</button>
      <table className="payments-table" id="payments-table">
        <thead>
          <tr>
            <th>User Email</th>
            <th>Type</th>
            <th>Plan/Order</th>
            <th>Amount</th>
            <th>Status</th>
            <th>Date</th>
          </tr>
        </thead>
        <tbody>
          {allPayments.map(payment => (
            <tr key={payment._id}>
              <td>{payment.userEmail}</td>
              <td>{payment.type}</td>
              <td>{payment.planName}</td>
              <td>{formatCurrency(payment.amount)}</td>
              <td>{payment.status}</td>
              <td>{new Date(payment.date).toLocaleString()}</td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  </div>
)}

<div id="admin-summary-pdf" ref={summaryRef}>
  <div className="revenue-section">
    {/* ...revenue stats and chart... */}
  </div>
</div>

        </div>
    );
};

export default AdminDashboard;
