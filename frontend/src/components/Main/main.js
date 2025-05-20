import React from 'react';
import { Link } from 'react-router-dom'; // Assuming you're using React Router for navigation
import styles from './Landing.module.css';
import logo from '../../assets/logo.png'; // Import your logo image

const LandingPage = () => {
  return (
    <div className={styles.container}>
      {/* Navigation Bar */}
      <nav className={styles.navbar}>
        <div className={styles.logoContainer}>
          <img src={logo} alt="Sports Club Logo" className={styles.logo} />
          <span className={styles.logoText}>Club Ftc</span>
        </div>
        <ul className={styles.navLinks}>
          <li><Link to="/">Home</Link></li>
          <li><Link to="/about">About</Link></li>
          <li><Link to="/news">News</Link></li>
          <li><Link to="/gallery">Gallery</Link></li>
          <li><Link to="/facilities">Facilities</Link></li>
          <li><Link to="/login" className={styles.loginButton}>Member Login</Link></li>
        </ul>
      </nav>

      {/* Hero Section */}
      <section className={styles.hero}>
        <div className={styles.heroContent}>
          <h1>Welcome to the FTC</h1>
          <p>Your path to fitness, health, and community starts here.</p>
          <div className={styles.heroButtons}>
            <button className={styles.ctaButton}>Join Us Today</button>
            <button className={styles.secondaryButton}>Learn More</button>
          </div>
        </div>
      </section>

      {/* Features Section */}
      <section className={styles.features}>
        <div className={styles.feature}>
          <h2>Training Sessions</h2>
          <p>Join our professional training programs to boost your skills.</p>
        </div>
        <div className={styles.feature}>
          <h2>Health & Nutrition</h2>
          <p>Get personalized health plans and nutrition guidance.</p>
        </div>
        <div className={styles.feature}>
          <h2>Community Events</h2>
          <p>Participate in our exciting community events and tournaments.</p>
        </div>
      </section>

      {/* Testimonials Section */}
      <section className={styles.testimonials}>
        <h2>What Our Members Say</h2>
        <div className={styles.testimonialCards}>
          <div className={styles.testimonialCard}>
            <p>"Joining FTC was the best decision I made for my health!"</p>
            <span>- Alex Johnson</span>
          </div>
          <div className={styles.testimonialCard}>
            <p>"The community events are so much fun and engaging."</p>
            <span>- Sarah Lee</span>
          </div>
          <div className={styles.testimonialCard}>
            <p>"The trainers are professional and very supportive."</p>
            <span>- Michael Brown</span>
          </div>
        </div>
      </section>

      {/* Contact Section */}
      <section className={styles.contact}>
        <h2>Contact Us</h2>
        <p>Have questions? Reach out to us!</p>
        <form className={styles.contactForm}>
          <input type="text" placeholder="Your Name" className={styles.inputField} />
          <input type="email" placeholder="Your Email" className={styles.inputField} />
          <textarea placeholder="Your Message" className={styles.textareaField}></textarea>
          <button type="submit" className={styles.ctaButton}>Send Message</button>
        </form>
      </section>

      {/* Footer */}
      <footer className={styles.footer}>
        <p>&copy; 2025 FTC. All rights reserved.</p>
      </footer>
    </div>
  );
};

export default LandingPage;