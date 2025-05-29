import React, { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import styles from './Landing.module.css';
import logo from '../../assets/logo.png';

const LandingPage = () => {
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);
  const [scrolled, setScrolled] = useState(false);

  // Handle scrolling effects
  useEffect(() => {
    const handleScroll = () => {
      if (window.scrollY > 50) {
        setScrolled(true);
      } else {
        setScrolled(false);
      }
    };

    window.addEventListener('scroll', handleScroll);
    
    return () => {
      window.removeEventListener('scroll', handleScroll);
    };
  }, []);

  // Toggle mobile menu
  const toggleMobileMenu = () => {
    setMobileMenuOpen(!mobileMenuOpen);
  };

  // Close mobile menu when clicking outside
  const closeMobileMenu = () => {
    setMobileMenuOpen(false);
  };

  // Prevent body scrolling when mobile menu is open
  useEffect(() => {
    if (mobileMenuOpen) {
      document.body.style.overflow = 'hidden';
    } else {
      document.body.style.overflow = 'auto';
    }

    return () => {
      document.body.style.overflow = 'auto';
    };
  }, [mobileMenuOpen]);

  return (
    <div className={styles.container}>
      {/* Navigation Bar */}
      <nav className={`${styles.navbar} ${scrolled ? styles.scrolled : ''}`}>
        <div className={styles.logoContainer}>
          <img src={logo} alt="Sports Club Logo" className={styles.logo} />
          <span className={styles.logoText}>Club FTC</span>
        </div>
        
        {/* Mobile Menu Toggle */}
        <div 
          className={`${styles.menuIcon} ${mobileMenuOpen ? styles.active : ''}`} 
          onClick={toggleMobileMenu}
        >
          <span></span>
          <span></span>
          <span></span>
        </div>
        
        <ul className={`${styles.navLinks} ${mobileMenuOpen ? styles.active : ''}`}>
          <li><Link to="/" onClick={closeMobileMenu}>Home</Link></li>
          <li><Link to="/about" onClick={closeMobileMenu}>About</Link></li>
          <li><Link to="/news" onClick={closeMobileMenu}>News</Link></li>
          <li><Link to="/gallery" onClick={closeMobileMenu}>Gallery</Link></li>
          <li><Link to="/facilities" onClick={closeMobileMenu}>Facilities</Link></li>
          <li><Link to="/login" className={styles.loginButton} onClick={closeMobileMenu}>Member Login</Link></li>
        </ul>
      </nav>

      <div 
        className={`${styles.menuOverlay} ${mobileMenuOpen ? styles.active : ''}`} 
        onClick={closeMobileMenu}
      ></div>

      {/* Hero Section - Improved */}
      <section className={styles.hero}>
        <div className={styles.heroContent}>
          <h1 className={styles.animatedTitle}>
            <span>Welcome to</span>
            <span className={styles.highlight}> FTC</span>
          </h1>
          <p className={styles.heroSubtitle}>Your path to fitness, health, and community starts here.</p>
          <div className={styles.heroButtons}>
            <button className={styles.ctaButton}>
              Join Us Today
              <i className={styles.buttonIcon}>→</i>
            </button>
            <button className={styles.secondaryButton}>
              Learn More
              <i className={styles.buttonIcon}>↓</i>
            </button>
          </div>
        </div>
        <div className={styles.heroOverlay}></div>
      </section>

      {/* Features Section - Improved */}
      <section className={styles.featuresSection}>
        <div className={styles.sectionHeader}>
          <h2>What We Offer</h2>
          <p>Discover our premium services designed for your success</p>
        </div>
        
        <div className={styles.features}>
          <div className={styles.feature}>
            <div className={styles.featureIcon}>
              <i>🏋️</i>
            </div>
            <h3>Training Sessions</h3>
            <p>Join our professional training programs to boost your skills and achieve your fitness goals.</p>
            <button type="button" className={styles.featureLink}>Learn More</button>
          </div>
          
          <div className={styles.feature}>
            <div className={styles.featureIcon}>
              <i>🥗</i>
            </div>
            <h3>Health & Nutrition</h3>
            <p>Get personalized health plans and nutrition guidance from certified experts.</p>
            <button type="button" className={styles.featureLink}>Learn More</button>
          </div>
          
          <div className={styles.feature}>
            <div className={styles.featureIcon}>
              <i>🏆</i>
            </div>
            <h3>Community Events</h3>
            <p>Participate in our exciting community events, tournaments and social gatherings.</p>
            <button type="button" className={styles.featureLink}>Learn More</button>
          </div>
        </div>
      </section>

      {/* Testimonials Section - Improved */}
      <section className={styles.testimonialsSection}>
        <div className={styles.sectionHeader}>
          <h2>What Our Members Say</h2>
          <p>Real stories from our community</p>
        </div>
        
        <div className={styles.testimonialCards}>
          <div className={styles.testimonialCard}>
            <div className={styles.testimonialQuote}>❝</div>
            <p>Joining FTC was the best decision I made for my health! The trainers are incredible and the community is so supportive.</p>
            <div className={styles.testimonialAuthor}>
              <div className={styles.authorAvatar}>AJ</div>
              <div className={styles.authorInfo}>
                <h4>Alex Johnson</h4>
                <p>Member since 2023</p>
              </div>
            </div>
            <div className={styles.testimonialStars}>★★★★★</div>
          </div>
          
          <div className={styles.testimonialCard}>
            <div className={styles.testimonialQuote}>❝</div>
            <p>The community events are so much fun and engaging. I've made great friends and improved my fitness tremendously.</p>
            <div className={styles.testimonialAuthor}>
              <div className={styles.authorAvatar}>SL</div>
              <div className={styles.authorInfo}>
                <h4>Sarah Lee</h4>
                <p>Member since 2022</p>
              </div>
            </div>
            <div className={styles.testimonialStars}>★★★★★</div>
          </div>
          
          <div className={styles.testimonialCard}>
            <div className={styles.testimonialQuote}>❝</div>
            <p>The trainers are professional and very supportive. The facilities are always clean and well-maintained.</p>
            <div className={styles.testimonialAuthor}>
              <div className={styles.authorAvatar}>MB</div>
              <div className={styles.authorInfo}>
                <h4>Michael Brown</h4>
                <p>Member since 2021</p>
              </div>
            </div>
            <div className={styles.testimonialStars}>★★★★★</div>
          </div>
        </div>
        
        <div className={styles.testimonialDots}>
          <span className={`${styles.dot} ${styles.active}`}></span>
          <span className={styles.dot}></span>
          <span className={styles.dot}></span>
        </div>
      </section>

      {/* Contact Section - Improved */}
      <section className={styles.contactSection}>
        <div className={styles.contactContent}>
          <div className={styles.contactInfo}>
            <h2>Get In Touch</h2>
            <p>Have questions or ready to start your fitness journey? Reach out to us!</p>
            
            <div className={styles.contactDetails}>
              <div className={styles.contactItem}>
                <span className={styles.contactIcon}>📍</span>
                <p>123 Fitness Street, Sportsville</p>
              </div>
              <div className={styles.contactItem}>
                <span className={styles.contactIcon}>📱</span>
                <p>(123) 456-7890</p>
              </div>
              <div className={styles.contactItem}>
                <span className={styles.contactIcon}>✉️</span>
                <p>info@ftcclub.com</p>
              </div>
            </div>
          </div>
          
          <form className={styles.contactForm}>
            <div className={styles.formGroup}>
              <input type="text" placeholder="Your Name" className={styles.inputField} required />
            </div>
            <div className={styles.formGroup}>
              <input type="email" placeholder="Your Email" className={styles.inputField} required />
            </div>
            <div className={styles.formGroup}>
              <textarea placeholder="Your Message" className={styles.textareaField} required></textarea>
            </div>
            <button type="submit" className={styles.submitButton}>
              Send Message
              <span className={styles.buttonArrow}>→</span>
            </button>
          </form>
        </div>
      </section>

      {/* Footer */}
      <footer className={styles.footer}>
        <p>&copy; 2025 FTC v2.1. All rights reserved.</p>
        <p>Powered by MommentX</p>
      </footer>
    </div>
  );
};

export default LandingPage;