import React, { useState } from 'react';


function Sidebar() {
  const [isOpen, setIsOpen] = useState(false);

  const toggleSidebar = () => {
    setIsOpen(!isOpen);
  };

  return (
    <div>
      {/* Button to toggle the sidebar */}
      <button
        className="btn btn-primary"
        onClick={toggleSidebar}
        style={{
          position: 'absolute',
          top: '20px',
          left: '20px',
          zIndex: '1',
        }}
      >
        ☰
      </button>

      {/* Sidebar */}
      <div
        className={`sidebar ${isOpen ? 'open' : ''}`}
        style={{
          position: 'fixed',
          top: '0',
          left: '0',
          height: '100%',
          width: '250px',
          backgroundColor: '#343a40',
          color: 'white',
          transition: 'transform 0.3s ease',
          transform: isOpen ? 'translateX(0)' : 'translateX(-100%)',
        }}
      >
        <div className="p-3">
          <h4>My Sidebar</h4>
          <ul className="nav flex-column">
            <li className="nav-item">
              <a className="nav-link text-white" href="#home">
                Home
              </a>
            </li>
            <li className="nav-item">
              <a className="nav-link text-white" href="/add">
                Profile
              </a>
            </li>
            <li className="nav-item">
              <a className="nav-link text-white" href="#contact">
                Contact
              </a>
            </li>
          </ul>
        </div>
      </div>

      {/* Main content */}
      <div
        className="main-content"
        style={{
          marginLeft: isOpen ? '250px' : '0',
          transition: 'margin-left 0.3s ease',
          padding: '20px',
        }}
      >
        <h2>Main Content</h2>
        <p>This is the content area. Click on the button to open/close the sidebar.</p>
      </div>
    </div>
  );
}

export default Sidebar;
