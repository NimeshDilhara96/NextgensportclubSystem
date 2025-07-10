import React, { useState, useEffect } from 'react';
import SlideNav from '../appnavbar/slidenav';
import { FaShoppingCart, FaTag, FaSearch, FaFilter, FaStar } from 'react-icons/fa';
import styles from './ClubStore.module.css';
import axios from 'axios';
import Logo from '../../assets/logo.png';

const ClubStore = () => {
  const [isSidebarOpen, setIsSidebarOpen] = useState(false);
  const [products, setProducts] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [cart, setCart] = useState([]);
  const [categories, setCategories] = useState([]);
  const [selectedCategory, setSelectedCategory] = useState('all');
  const [searchQuery, setSearchQuery] = useState('');
  const [showCartModal, setShowCartModal] = useState(false);

  // Check if sidebar should be open by default on larger screens
  useEffect(() => {
    const checkScreenSize = () => {
      if (window.innerWidth > 768) {
        setIsSidebarOpen(true);
      }
    };
    
    // Set initial state
    checkScreenSize();
    
    // Update on resize
    window.addEventListener('resize', checkScreenSize);
    return () => window.removeEventListener('resize', checkScreenSize);
  }, []);

  useEffect(() => {
    const fetchUserData = async () => {
      try {
        const userEmail = sessionStorage.getItem('userEmail');
        if (userEmail) {
          await axios.get(`http://localhost:8070/user/getByEmail/${userEmail}`);
        }
      } catch (error) {
        console.error('Error fetching user data:', error);
      }
    };

    const fetchProducts = async () => {
      try {
        setLoading(true);
        const response = await axios.get('http://localhost:8070/products');
        
        // Access the products array from the response
        if (response.data.success && response.data.products) {
          setProducts(response.data.products);
          
          // Extract unique categories
          const uniqueCategories = [...new Set(response.data.products
            .map(product => product.category)
            .filter(category => category))]; // Filter out null/undefined categories
          setCategories(uniqueCategories);
        } else {
          setError('Invalid product data received.');
        }
      } catch (error) {
        console.error('Error fetching products:', error);
        setError('Failed to load products. Please try again later.');
      } finally {
        setLoading(false);
      }
    };

    const savedCart = localStorage.getItem('clubStoreCart');
    if (savedCart) {
      setCart(JSON.parse(savedCart));
    }

    fetchUserData();
    fetchProducts();
  }, []);

  useEffect(() => {
    localStorage.setItem('clubStoreCart', JSON.stringify(cart));
  }, [cart]);

  const addToCart = (product) => {
    const existingItemIndex = cart.findIndex(item => item._id === product._id);
    
    if (existingItemIndex >= 0) {
      const updatedCart = [...cart];
      updatedCart[existingItemIndex] = {
        ...updatedCart[existingItemIndex],
        quantity: updatedCart[existingItemIndex].quantity + 1
      };
      setCart(updatedCart);
    } else {
      setCart([...cart, { ...product, quantity: 1 }]);
    }
  };

  const removeFromCart = (productId) => {
    setCart(cart.filter(item => item._id !== productId));
  };

  const updateCartItemQuantity = (productId, newQuantity) => {
    if (newQuantity < 1) return;
    
    setCart(cart.map(item => 
      item._id === productId ? { ...item, quantity: newQuantity } : item
    ));
  };

  const calculateTotal = () => {
    return cart.reduce((total, item) => total + (item.price * item.quantity), 0).toFixed(2);
  };

  const toggleSidebar = () => {
    setIsSidebarOpen(!isSidebarOpen);
  };

  const filteredProducts = products.filter(product => {
    const matchesCategory = selectedCategory === 'all' || product.category === selectedCategory;
    const matchesSearch = product.name.toLowerCase().includes(searchQuery.toLowerCase()) || 
                          product.description.toLowerCase().includes(searchQuery.toLowerCase());
    return matchesCategory && matchesSearch;
  });

  // Add this helper function at the top of your component
  const formatPrice = (price) => {
    return typeof price === 'number' ? price.toFixed(2) : '0.00';
  };

  const handleCheckout = () => {
    // Save current cart to session for order processing
    sessionStorage.setItem('checkoutCart', JSON.stringify(cart));
    
    // Clear local cart
    setCart([]);
    localStorage.removeItem('clubStoreCart');
    
    // Display confirmation
    alert('Thank you for your order! Your items will be available for pickup at the club.');
    setShowCartModal(false);
  };

  return (
    <div className={styles.pageWrapper}>
      <SlideNav 
        isSidebarOpen={isSidebarOpen} 
        toggleSidebar={toggleSidebar} 
      />
      <div 
        className={`${styles.mainContent} ${isSidebarOpen ? styles.sidebarOpen : styles.sidebarClosed}`}
      >
        <div className={styles.container}>
          <div className={styles.storeHeader}>
            <h1 className={styles.pageTitle}>Club Store</h1>
            <div className={styles.cartIconContainer} onClick={(e) => {
              e.stopPropagation();
              setShowCartModal(!showCartModal);
            }}>
              <FaShoppingCart className={styles.cartIcon} />
              {cart.length > 0 && <span className={styles.cartBadge}>{cart.reduce((sum, item) => sum + item.quantity, 0)}</span>}
            </div>
          </div>

          <div className={styles.filterSection}>
            <div className={styles.searchBar}>
              <FaSearch className={styles.searchIcon} />
              <input
                type="text"
                placeholder="Search products..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className={styles.searchInput}
              />
            </div>

            <div className={styles.categoryFilter}>
              <FaFilter className={styles.filterIcon} />
              <select 
                value={selectedCategory} 
                onChange={(e) => setSelectedCategory(e.target.value)}
                className={styles.categorySelect}
              >
                <option value="all">All Categories</option>
                {categories.map(category => (
                  <option key={category} value={category}>{category}</option>
                ))}
              </select>
            </div>
          </div>
          
          {loading && <div className={styles.loading}>Loading products...</div>}
          {error && <div className={styles.error}>{error}</div>}
          
          <div className={styles.productsGrid}>
            {filteredProducts.length === 0 && !loading ? (
              <div className={styles.noProducts}>No products found matching your criteria.</div>
            ) : (
              filteredProducts.map((product) => (
                <div key={product._id} className={styles.productCard}>
                  <div className={styles.productImageContainer}>
                    <img 
                      src={product.image ? `http://localhost:8070/${product.image}` : Logo}
                      alt={product.name} 
                      className={styles.productImage}
                    />
                    <span className={styles.productCategory}>
                      <FaTag /> {product.category}
                    </span>
                  </div>

                  <div className={styles.productInfo}>
                    <h3>{product.name}</h3>
                    <div className={styles.productRating}>
                      {[...Array(5)].map((_, i) => (
                        <FaStar 
                          key={i} 
                          className={i < Math.floor(product.rating || 0) ? styles.starFilled : styles.starEmpty} 
                        />
                      ))}
                      <span className={styles.reviewCount}>({product.reviewCount || 0})</span>
                    </div>
                    <p className={styles.productDescription}>{product.description}</p>
                  </div>

                  <div className={styles.productFooter}>
                    <div className={styles.productPrice}>${formatPrice(product.price)}</div>
                    <button 
                      className={styles.addToCartBtn}
                      onClick={() => addToCart(product)}
                    >
                      Add to Cart
                    </button>
                  </div>
                </div>
              ))
            )}
          </div>

          {!loading && filteredProducts.length === 0 && (
  <div className={styles.emptyProductsContainer}>
    <FaShoppingCart className={styles.emptyProductsIcon} />
    <h3>No products available</h3>
    <p>Check back soon for new items in our club store!</p>
  </div>
)}

          {showCartModal && (
            <div className={styles.cartModal}>
              <div className={styles.cartModalContent}>
                <div className={styles.cartHeader}>
                  <h2>Your Cart</h2>
                  <button className={styles.closeModal} onClick={() => setShowCartModal(false)}>&times;</button>
                </div>

                {cart.length === 0 ? (
                  <div className={styles.emptyCart}>Your cart is empty</div>
                ) : (
                  <>
                    <div className={styles.cartItems}>
                      {cart.map(item => (
                        <div key={item._id} className={styles.cartItem}>
                          <img 
                            src={item.image ? `http://localhost:8070/${item.image}` : Logo}
                            alt={item.name} 
                            className={styles.cartItemImage}
                          />
                          <div className={styles.cartItemDetails}>
                            <h4>{item.name}</h4>
                            <p className={styles.cartItemPrice}>${formatPrice(item.price)}</p>
                          </div>
                          <div className={styles.cartItemQuantity}>
                            <button 
                              onClick={() => updateCartItemQuantity(item._id, item.quantity - 1)}
                              disabled={item.quantity <= 1}
                            >-</button>
                            <span>{item.quantity}</span>
                            <button onClick={() => updateCartItemQuantity(item._id, item.quantity + 1)}>+</button>
                          </div>
                          <button 
                            className={styles.removeItemBtn}
                            onClick={() => removeFromCart(item._id)}
                          >
                            &times;
                          </button>
                        </div>
                      ))}
                    </div>
                    <div className={styles.cartFooter}>
                      <div className={styles.cartTotal}>
                        <span>Total:</span>
                        <span>${calculateTotal()}</span>
                      </div>
                      <button onClick={handleCheckout} className={styles.checkoutBtn}>Proceed to Checkout</button>
                    </div>
                  </>
                )}
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

export default ClubStore;