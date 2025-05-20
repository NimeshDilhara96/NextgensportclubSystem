import React from 'react';
import './Container.css';

const Container = ({ children, isSidebarOpen }) => {
  return (
    <div className={`container ${!isSidebarOpen ? 'sidebar-closed' : ''}`}>
      <div className="content-wrapper">
        {children}
      </div>
    </div>
  );
};

export default Container; 