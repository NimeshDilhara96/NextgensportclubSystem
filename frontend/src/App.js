import './App.css';
import Signup from './components/Auth/signup';  // Import Signup component
import Login from "./components/Auth/login";
import AdminLogin from './components/Admin/AdminLogin';  // Add this import
import LandingPage from './components/Main/main';
import Dashboard from './components/Dashboard/Dashboard';
import Membership from './components/Dashboard/membership'; // Add this import
import Community from './components/Dashboard/PostsCommunity';
import SportsFacilities from './components/Dashboard/SportsFacilities';  // Add this import
import Profile from './components/Myprofile/profile';
import AdminDashboard from './components/Admin/adminDashboard';  // Add this import
import AdminMemberManagement from './components/Admin/adminMemberManagement';
import CreatePost from './components/Admin/CreatePost';
import AddSport from './components/Admin/AddSport';  // Add this import
import AddFacility from './components/Admin/AddFacility';
import Event from './components/Dashboard/Event';  // Add this import
import ClubStore from './components/Dashboard/clubstore';

import { BrowserRouter as Router, Routes, Route, Navigate } from "react-router-dom";

// Updated ProtectedRoute component
const ProtectedRoute = ({ children }) => {
  const isAuthenticated = sessionStorage.getItem('token');
  
  if (!isAuthenticated) {
    return <Navigate to="/login" />;
  }
  return children;
};

// Admin Protected Route component
const AdminProtectedRoute = ({ children }) => {
  const isAdminAuthenticated = sessionStorage.getItem('adminToken');
  
  if (!isAdminAuthenticated) {
    return <Navigate to="/admin/login" />;
  }
  return children;
};

// Public Route component
const PublicRoute = ({ children }) => {
  const isAuthenticated = sessionStorage.getItem('token');
  
  if (isAuthenticated) {
    return <Navigate to="/dashboard" />;
  }
  return children;
};

function App() {
  return (
    <Router>
      <div>
        <Routes>
          {/* Public routes */}
          <Route path="/" element={<LandingPage />} />  {/* This is your default route */}
          <Route path="/signup" element={
            <PublicRoute>
              <Signup />
            </PublicRoute>
          } />  {/* Show Signup on the root path */}
          <Route path="/login" element={
            <PublicRoute>
              <Login />
            </PublicRoute>
          } />
          <Route path="/SlideNav" exact element={<Login />} />
          
          {/* Admin routes */}
          <Route path="/admin/login" element={<AdminLogin />} />
          <Route path="/admin/dashboard" element={
            <AdminProtectedRoute>
              <AdminDashboard />
            </AdminProtectedRoute>
          } />

          <Route path="/admin/member-management" element={
            <AdminProtectedRoute>
              <AdminMemberManagement />
            </AdminProtectedRoute>
          } />

          <Route path="/admin/create-post" element={
            <AdminProtectedRoute>
              <CreatePost />
            </AdminProtectedRoute>
          } />
         
          <Route path="/admin/add-sport" element={
            <AdminProtectedRoute>
              <AddSport />
            </AdminProtectedRoute>
          } />

          <Route path="/admin/facilities" element={
            <AdminProtectedRoute>
              <AddFacility />
            </AdminProtectedRoute>
          } />
          
          
          {/* Protected User routes with SlideNav */}
          <Route path="/profile" element={
            <ProtectedRoute>
              <Profile />
            </ProtectedRoute>
          } />
          
          <Route path="/dashboard" element={
            <ProtectedRoute>
              <Dashboard />
            </ProtectedRoute>
          } />
          
          <Route path="/membership" element={
            <ProtectedRoute>
              <Membership />
            </ProtectedRoute>
          } />
          
          <Route path="/community" element={
            <ProtectedRoute>
              <Community />
            </ProtectedRoute>
          } />
          
          <Route path="/facilities" element={
            <ProtectedRoute>
              <SportsFacilities/>
            </ProtectedRoute>
          } />
          
          <Route path="/training" element={
            <ProtectedRoute>
              <div>Training Page</div>
            </ProtectedRoute>
          } />
          
          <Route path="/events" element={
            <ProtectedRoute>
              <Event />
            </ProtectedRoute>
          } />
          
          <Route path="/store" element={
            <ProtectedRoute>
              <ClubStore />
            </ProtectedRoute>
          } />
          
          <Route path="/health" element={
            <ProtectedRoute>
              <div>Health Page</div>
            </ProtectedRoute>
          } />
          
          <Route path="/settings" element={
            <ProtectedRoute>
              <div>Settings Page</div>
            </ProtectedRoute>
          } />

          {/* Catch all route */}
          <Route path="*" element={<Navigate to="/" replace />} />
        </Routes>
      </div>
    </Router>
  );
}

export default App;
