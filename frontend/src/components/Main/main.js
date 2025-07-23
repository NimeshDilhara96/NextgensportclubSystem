import React, { useState, useEffect } from 'react';
import { Link, useLocation } from 'react-router-dom';
import styles from './Landing.module.css';
import logo from '../../assets/logo.png';
import mommentxLogo from '../../assets/momex.jpg';

const LandingPage = () => {
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);
  const [scrolled, setScrolled] = useState(false);
  const location = useLocation();

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

  // Check for hash in URL on page load and scroll to section
  useEffect(() => {
    if (location.hash === '#news') {
      const newsSection = document.getElementById('news');
      if (newsSection) {
        setTimeout(() => {
          newsSection.scrollIntoView({ behavior: 'smooth' });
        }, 300);
      }
    }
  }, [location]);

  // Toggle mobile menu
  const toggleMobileMenu = () => {
    setMobileMenuOpen(!mobileMenuOpen);
  };

  // Close mobile menu when clicking outside
  const closeMobileMenu = () => {
    setMobileMenuOpen(false);
  };

  // Handle news link click - scroll if on home page, navigate if elsewhere
  const handleNewsClick = (e) => {
    if (location.pathname === '/') {
      e.preventDefault();
      const newsSection = document.getElementById('news');
      if (newsSection) {
        newsSection.scrollIntoView({ behavior: 'smooth' });
      }
      closeMobileMenu();
    }
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
      {/* SEO-optimized Navigation Bar */}
      <nav className={`${styles.navbar} ${scrolled ? styles.scrolled : ''}`} role="navigation" aria-label="Main navigation">
        <div className={styles.logoContainer}>
          <img src={logo} alt="FTC Sports Club - Premium Fitness and Training Center" className={styles.logo} />
          <span className={styles.logoText}>Club FTC</span>
        </div>
        
        {/* Mobile Menu Toggle */}
        <button 
          className={`${styles.menuIcon} ${mobileMenuOpen ? styles.active : ''}`} 
          onClick={toggleMobileMenu}
          aria-label="Toggle mobile menu"
          aria-expanded={mobileMenuOpen}
        >
          <span></span>
          <span></span>
          <span></span>
        </button>
        
        <ul className={`${styles.navLinks} ${mobileMenuOpen ? styles.active : ''}`} role="menubar">
          <li role="none"><Link to="/" onClick={closeMobileMenu} role="menuitem">Home</Link></li>
          <li role="none"><Link to="/about" onClick={closeMobileMenu} role="menuitem">About</Link></li>
          <li role="none"><Link to="/#news" onClick={handleNewsClick} role="menuitem">News</Link></li>
          <li role="none"><Link to="/gallery" onClick={closeMobileMenu} role="menuitem">Gallery</Link></li>
          <li role="none"><Link to="/facilities" onClick={closeMobileMenu} role="menuitem">Facilities</Link></li>
          <li role="none"><Link to="/login" className={styles.loginButton} onClick={closeMobileMenu} role="menuitem">Member Login</Link></li>
        </ul>
      </nav>

      <div 
        className={`${styles.menuOverlay} ${mobileMenuOpen ? styles.active : ''}`} 
        onClick={closeMobileMenu}
        aria-hidden="true"
      ></div>

      {/* Hero Section - Professional & SEO Optimized */}
      <section className={styles.hero} role="banner" aria-label="Welcome to FTC">
        <div className={styles.heroContent}>
          <h1 className={styles.animatedTitle}>
            <span>Professional Fitness &</span>
            <span className={styles.highlight}> Training Center</span>
          </h1>
          <p className={styles.heroSubtitle}>Elevate your performance with industry-leading facilities, expert coaching, and comprehensive wellness programs designed for serious athletes and fitness enthusiasts.</p>
          <div className={styles.heroButtons}>
            <button
              className={styles.ctaButton}
              onClick={() => window.location.href = '/signup'}
              type="button"
              aria-label="Join FTC membership program"
            >
              Join Our Community
              <span className={styles.buttonIcon} aria-hidden="true">→</span>
            </button>
            <button className={styles.secondaryButton} aria-label="Learn more about our services">
              Explore Services
              <span className={styles.buttonIcon} aria-hidden="true">↓</span>
            </button>
          </div>
        </div>
        <div className={styles.heroOverlay} aria-hidden="true"></div>
      </section>

      {/* Services Section - Professional Focus */}
      <section className={styles.featuresSection} aria-labelledby="services-heading">
        <div className={styles.sectionHeader}>
          <h2 id="services-heading">Our Professional Services</h2>
          <p>Comprehensive fitness solutions tailored for peak performance and sustainable results</p>
        </div>
        
        <div className={styles.features}>
          <article className={styles.feature}>
            <div className={styles.featureIcon} aria-hidden="true">
              <span>🏋️</span>
            </div>
            <h3>Elite Training Programs</h3>
            <p>Structured, science-based training methodologies designed by certified professionals to maximize your athletic potential and achieve measurable results.</p>
            <button type="button" className={styles.featureLink} aria-label="Learn more about training programs">Explore Programs</button>
          </article>
          
          <article className={styles.feature}>
            <div className={styles.featureIcon} aria-hidden="true">
              <span>📊</span>
            </div>
            <h3>Performance Analytics</h3>
            <p>Advanced monitoring systems and personalized assessments to track progress, optimize performance, and ensure continuous improvement in your fitness journey.</p>
            <button type="button" className={styles.featureLink} aria-label="Learn more about performance analytics">View Analytics</button>
          </article>
          
          <article className={styles.feature}>
            <div className={styles.featureIcon} aria-hidden="true">
              <span>🏆</span>
            </div>
            <h3>Corporate Wellness</h3>
            <p>Professional corporate fitness programs and team-building activities designed to enhance workplace productivity and employee well-being.</p>
            <button type="button" className={styles.featureLink} aria-label="Learn more about corporate wellness">Corporate Solutions</button>
          </article>
        </div>
      </section>

      {/* Testimonials Section - Professional Focus */}
      <section className={styles.testimonialsSection} aria-labelledby="testimonials-heading">
        <div className={styles.sectionHeader}>
          <h2 id="testimonials-heading">Client Success Stories</h2>
          <p>Proven results from our professional training programs</p>
        </div>
        
        <div className={styles.testimonialCards}>
          <article className={styles.testimonialCard}>
            <div className={styles.testimonialQuote} aria-hidden="true">❝</div>
            <blockquote>
              <p>The systematic approach and professional expertise at FTC transformed my training regimen. The measurable improvements in my performance metrics exceeded all expectations.</p>
            </blockquote>
            <div className={styles.testimonialAuthor}>
              <div className={styles.authorAvatar} aria-hidden="true">AJ</div>
              <div className={styles.authorInfo}>
                <h4>Alex Johnson</h4>
                <p>Corporate Executive</p>
              </div>
            </div>
            <div className={styles.testimonialStars} aria-label="5 star rating">★★★★★</div>
          </article>
          
          <article className={styles.testimonialCard}>
            <div className={styles.testimonialQuote} aria-hidden="true">❝</div>
            <blockquote>
              <p>FTC's data-driven approach and professional environment provided the structure I needed to achieve my fitness goals efficiently and sustainably.</p>
            </blockquote>
            <div className={styles.testimonialAuthor}>
              <div className={styles.authorAvatar} aria-hidden="true">SL</div>
              <div className={styles.authorInfo}>
                <h4>Sarah Lee</h4>
                <p>Business Owner</p>
              </div>
            </div>
            <div className={styles.testimonialStars} aria-label="5 star rating">★★★★★</div>
          </article>
          
          <article className={styles.testimonialCard}>
            <div className={styles.testimonialQuote} aria-hidden="true">❝</div>
            <blockquote>
              <p>The professionalism and expertise of the training staff, combined with state-of-the-art facilities, makes FTC the premier choice for serious fitness enthusiasts.</p>
            </blockquote>
            <div className={styles.testimonialAuthor}>
              <div className={styles.authorAvatar} aria-hidden="true">MB</div>
              <div className={styles.authorInfo}>
                <h4>Michael Brown</h4>
                <p>Professional Athlete</p>
              </div>
            </div>
            <div className={styles.testimonialStars} aria-label="5 star rating">★★★★★</div>
          </article>
        </div>
        
        <div className={styles.testimonialDots} role="tablist" aria-label="Testimonial navigation">
          <button className={`${styles.dot} ${styles.active}`} role="tab" aria-selected="true" aria-label="View testimonial 1"></button>
          <button className={styles.dot} role="tab" aria-selected="false" aria-label="View testimonial 2"></button>
          <button className={styles.dot} role="tab" aria-selected="false" aria-label="View testimonial 3"></button>
        </div>
      </section>

      {/* News Section - Professional Updates */}
      <section id="news" className={styles.newsSection} aria-labelledby="news-heading">
        <div className={styles.sectionHeader}>
          <h2 id="news-heading">Industry News & Updates</h2>
          <p>Stay informed with the latest developments in fitness technology and professional training methodologies</p>
        </div>
        
        <div className={styles.newsGrid}>
          <article className={styles.newsCard}>
            <div className={styles.newsImage}>
              <div className={styles.newsDate}>
                <span className={styles.day}>15</span>
                <span className={styles.month}>May</span>
              </div>
            </div>
            <div className={styles.newsContent}>
              <div className={styles.newsTag}>Program Launch</div>
              <h3>Advanced Performance Training Program</h3>
              <p>Introducing our new high-intensity performance training program designed for serious athletes seeking competitive advantage through scientific training methodologies.</p>
              <Link to="/news/performance-program" className={styles.newsLink} aria-label="Read more about Advanced Performance Training Program">
                Read More <span aria-hidden="true">→</span>
              </Link>
            </div>
          </article>
          
          <article className={styles.newsCard}>
            <div className={styles.newsImage}>
              <div className={styles.newsDate}>
                <span className={styles.day}>10</span>
                <span className={styles.month}>May</span>
              </div>
            </div>
            <div className={styles.newsContent}>
              <div className={styles.newsTag}>Facility Upgrade</div>
              <h3>State-of-the-Art Recovery Center</h3>
              <p>Our new recovery and rehabilitation center features cutting-edge equipment including cryotherapy chambers, infrared saunas, and advanced physiotherapy facilities.</p>
              <Link to="/news/recovery-center" className={styles.newsLink} aria-label="Read more about State-of-the-Art Recovery Center">
                Read More <span aria-hidden="true">→</span>
              </Link>
            </div>
          </article>
          
          <article className={styles.newsCard}>
            <div className={styles.newsImage}>
              <div className={styles.newsDate}>
                <span className={styles.day}>03</span>
                <span className={styles.month}>May</span>
              </div>
            </div>
            <div className={styles.newsContent}>
              <div className={styles.newsTag}>Recognition</div>
              <h3>Industry Excellence Award 2024</h3>
              <p>FTC has been recognized as the leading professional fitness facility in the region, acknowledging our commitment to excellence in training and member satisfaction.</p>
              <Link to="/news/excellence-award" className={styles.newsLink} aria-label="Read more about Industry Excellence Award 2024">
                Read More <span aria-hidden="true">→</span>
              </Link>
            </div>
          </article>
        </div>
        
        <div className={styles.newsViewAll}>
          <Link to="/news" className={styles.viewAllLink} aria-label="View all news and updates">
            View All Updates <span className={styles.viewAllIcon} aria-hidden="true">→</span>
          </Link>
        </div>
      </section>

      {/* Contact Section - Professional */}
      <section className={styles.contactSection} aria-labelledby="contact-heading">
        <div className={styles.contactContent}>
          <div className={styles.contactInfo}>
            <h2 id="contact-heading">Connect With Our Team</h2>
            <p>Ready to elevate your fitness journey? Our professional team is here to discuss your goals and create a customized training solution.</p>
            
            <div className={styles.contactDetails}>
              <div className={styles.contactItem}>
                <span className={styles.contactIcon} aria-hidden="true">📍</span>
                <div>
                  <h4>Location</h4>
                  <p>123 Professional Drive, Business District</p>
                </div>
              </div>
              <div className={styles.contactItem}>
                <span className={styles.contactIcon} aria-hidden="true">📱</span>
                <div>
                  <h4>Phone</h4>
                  <p>(123) 356-7890</p>
                </div>
              </div>
              <div className={styles.contactItem}>
                <span className={styles.contactIcon} aria-hidden="true">✉️</span>
                <div>
                  <h4>Email</h4>
                  <p>info@ftcprofessional.com</p>
                </div>
              </div>
            </div>
          </div>
          
          <form className={styles.contactForm} aria-label="Contact form">
            <div className={styles.formGroup}>
              <label htmlFor="name" className={styles.visuallyHidden}>Full Name</label>
              <input 
                id="name"
                type="text" 
                placeholder="Full Name" 
                className={styles.inputField} 
                required 
                aria-required="true"
              />
            </div>
            <div className={styles.formGroup}>
              <label htmlFor="email" className={styles.visuallyHidden}>Email Address</label>
              <input 
                id="email"
                type="email" 
                placeholder="Email Address" 
                className={styles.inputField} 
                required 
                aria-required="true"
              />
            </div>
            <div className={styles.formGroup}>
              <label htmlFor="message" className={styles.visuallyHidden}>Message</label>
              <textarea 
                id="message"
                placeholder="Tell us about your fitness goals and how we can help" 
                className={styles.textareaField} 
                required 
                aria-required="true"
              ></textarea>
            </div>
            <button type="submit" className={styles.submitButton} aria-label="Send message">
              Send Message
              <span className={styles.buttonArrow} aria-hidden="true">→</span>
            </button>
          </form>
        </div>
      </section>

     {/* Professional Footer */}
      <footer className={styles.footer}>
        <div className={styles.footerContent}>
          {/* Optional Navigation Links */}
          <div className={styles.footerLinks}>
            <Link to="/" className={styles.footerLink}>Home</Link>
            <Link to="/about" className={styles.footerLink}>About</Link>
            <Link to="/facilities" className={styles.footerLink}>Facilities</Link>
            <Link to="/gallery" className={styles.footerLink}>Gallery</Link>
            <Link to="/contact" className={styles.footerLink}>Contact</Link>
          </div>

          {/* Social Links (Optional) */}
          <div className={styles.socialLinks}>
            <a href="https://facebook.com" target="_blank" rel="noopener noreferrer" className={styles.socialLink} aria-label="Facebook">
              <span>📘</span>
            </a>
            <a href="https://instagram.com" target="_blank" rel="noopener noreferrer" className={styles.socialLink} aria-label="Instagram">
              <span>📷</span>
            </a>
            <a href="https://twitter.com" target="_blank" rel="noopener noreferrer" className={styles.socialLink} aria-label="Twitter">
              <span>🐦</span>
            </a>
            <a
              href="https://linkedin.com"
              target="_blank"
              rel="noopener noreferrer"
              className={styles.socialLink}
              aria-label="LinkedIn"
            >
              <span>💼</span>
            </a>
          </div>

          <div className={styles.footerDivider}></div>

          {/* Main Branding */}
          <div className={styles.footerBranding}>
            <div className={styles.brandingItem}>
              <img src={logo} alt="Club FTC - Premium Fitness Center" className={styles.clubLogo} />
              <div className={styles.brandingText}>
                <h4>Club FTC</h4>
                <p>Premium Fitness & Training Center</p>
              </div>
            </div>
            
            <div className={styles.brandingDivider}>×</div>
            
            <div className={styles.brandingItem}>
              <img src={mommentxLogo} alt="MommentX - Web Development" className={styles.mommentxLogo} />
              <div className={styles.brandingText}>
                <h4>MommentX</h4>
                <p>Digital Solutions & Development</p>
              </div>
            </div>
          </div>

          {/* Footer Info */}
          <div className={styles.footerInfo}>
            <p>© {new Date().getFullYear()} Club FTC. All rights reserved.</p>
            <p>
              Designed & Developed by <strong>Nimeshdilhara96</strong> | 
              Professional web solutions for modern businesses
            </p>
          </div>
        </div>
      </footer>
    </div>
  );
};

export default LandingPage;