import React, { useState, useEffect, useCallback } from 'react';
import SlideNav from '../appnavbar/slidenav';
import { 
  FaHeartbeat, 
  FaDumbbell, 
  FaRunning, 
  FaAppleAlt, 
  FaWater, 
  FaClock, 
  FaChartLine,
  FaRobot,
  FaTimes,
  FaPaperPlane,
  FaFire,
  FaWeight,
  FaStopwatch,
  FaBullseye,
  FaUser,
  FaCalendarAlt,
  FaPhone,
  FaEnvelope
} from 'react-icons/fa';
import styles from './Health.module.css';
import axios from 'axios';
import { GoogleGenAI } from "@google/genai";

const Health = () => {
  const [isSidebarOpen, setIsSidebarOpen] = useState(true);
  const [activeTab, setActiveTab] = useState('overview');
  const [userData, setUserData] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  
  // AI Chat States
  const [isChatOpen, setIsChatOpen] = useState(false);
  const [chatMessages, setChatMessages] = useState([
    { type: 'ai', message: 'Hello! I\'m flexi powered by Google Gemini X MommentX. How can I help you with your fitness and health goals today?' }
  ]);
  const [chatInput, setChatInput] = useState('');
  const [isTyping, setIsTyping] = useState(false);
  const [aiError, setAiError] = useState(null);

  // Health Data States - Now calculated from user data
  const [todayStats, setTodayStats] = useState({
    calories: 0,
    water: 0,
    steps: 0,
    workoutTime: 0
  });

  const [weeklyGoals] = useState({
    workouts: 5,
    calories: 2000,
    water: 8,
    sleep: 8
  });

  const [recentWorkouts, setRecentWorkouts] = useState([]);
  const [nutritionPlan, setNutritionPlan] = useState([]);
  const [userBookings, setUserBookings] = useState([]);
  const [waterGlasses, setWaterGlasses] = useState([]);

  // Calculate user's age from DOB
  const calculateAge = useCallback((dob) => {
    if (!dob) return 'N/A';
    const birthDate = new Date(dob);
    const today = new Date();
    let age = today.getFullYear() - birthDate.getFullYear();
    const monthDiff = today.getMonth() - birthDate.getMonth();
    if (monthDiff < 0 || (monthDiff === 0 && today.getDate() < birthDate.getDate())) {
      age--;
    }
    return age;
  }, []);

  // Format date for display
  const formatDate = (date) => {
    if (!date) return 'N/A';
    return new Date(date).toLocaleDateString('en-US', {
      year: 'numeric',
      month: 'long',
      day: 'numeric'
    });
  };

  // Calculate health stats based on user profile
  const calculateHealthStats = useCallback((user) => {
    if (!user) return { calories: 0, water: 0, steps: 0, workoutTime: 0 };

    const age = calculateAge(user.dob);
    const isActive = user.membershipStatus === 'active';
    const hasBookings = user.bookings && user.bookings.length > 0;

    // Base calculations on user's age, gender, and activity level
    let baseCalories = 1200;
    let baseSteps = 3000;
    let baseWorkout = 0;
    let baseWater = 4;

    // Adjust based on age
    if (age < 30) {
      baseCalories += 600;
      baseSteps += 4000;
    } else if (age < 50) {
      baseCalories += 400;
      baseSteps += 3000;
    } else {
      baseCalories += 200;
      baseSteps += 2000;
    }

    // Adjust based on gender
    if (user.gender === 'Male') {
      baseCalories += 300;
      baseSteps += 1000;
      baseWater += 2;
    } else if (user.gender === 'Female') {
      baseCalories += 100;
      baseSteps += 500;
      baseWater += 1;
    }

    // Adjust based on membership status and activity
    if (isActive) {
      baseCalories += 300;
      baseSteps += 2000;
      baseWorkout = 45;
      baseWater += 2;
    }

    if (hasBookings) {
      baseCalories += 200;
      baseWorkout += 30;
      baseWater += 1;
    }

    // Add some randomness to make it more realistic (±20%)
    const variance = 0.2;
    return {
      calories: Math.round(baseCalories * (1 + (Math.random() - 0.5) * variance)),
      water: Math.min(8, Math.round(baseWater * (1 + (Math.random() - 0.5) * variance))),
      steps: Math.round(baseSteps * (1 + (Math.random() - 0.5) * variance)),
      workoutTime: Math.round(baseWorkout * (1 + (Math.random() - 0.5) * variance))
    };
  }, [calculateAge]);

  // Generate personalized workouts based on user data
  const generatePersonalizedWorkouts = useCallback((user) => {
    if (!user) return [];

    const age = calculateAge(user.dob);

    // Base workouts
    const baseWorkouts = [
      { name: 'Morning Walk', duration: 30, calories: 150, intensity: 'low' },
      { name: 'Cardio Session', duration: 45, calories: 400, intensity: 'medium' },
      { name: 'Strength Training', duration: 60, calories: 350, intensity: 'high' },
      { name: 'Yoga & Stretching', duration: 40, calories: 200, intensity: 'low' },
      { name: 'Swimming', duration: 50, calories: 500, intensity: 'medium' },
      { name: 'Cycling', duration: 60, calories: 450, intensity: 'medium' },
      { name: 'Weight Training', duration: 45, calories: 300, intensity: 'high' },
      { name: 'Pilates', duration: 35, calories: 250, intensity: 'medium' }
    ];

    // Filter based on user profile
    let suitableWorkouts = baseWorkouts;

    if (age > 50) {
      suitableWorkouts = baseWorkouts.filter(w => w.intensity !== 'high');
    }

    if (user.membershipStatus !== 'active') {
      suitableWorkouts = baseWorkouts.filter(w => w.intensity === 'low');
    }

    // Select 3-4 random workouts
    const selectedWorkouts = suitableWorkouts
      .sort(() => 0.5 - Math.random())
      .slice(0, Math.min(4, suitableWorkouts.length));

    return selectedWorkouts.map((workout, index) => ({
      id: index + 1,
      name: workout.name,
      duration: workout.duration,
      calories: workout.calories,
      date: new Date(Date.now() - index * 24 * 60 * 60 * 1000).toISOString().split('T')[0]
    }));
  }, [calculateAge]);

  // Generate personalized nutrition plan based on user data
  const generateNutritionPlan = useCallback((user, todayStats) => {
    if (!user) return [];

    const age = calculateAge(user.dob);
    const targetCalories = todayStats.calories || 2000;
    
    let breakfastCals, lunchCals, snackCals, dinnerCals;

    // Distribute calories based on age and gender
    const ageFactor = age > 50 ? 0.05 : 0;
    
    if (user.gender === 'Male') {
      breakfastCals = Math.round(targetCalories * (0.25 - ageFactor));
      lunchCals = Math.round(targetCalories * 0.35);
      snackCals = Math.round(targetCalories * (0.15 + ageFactor));
      dinnerCals = Math.round(targetCalories * 0.25);
    } else {
      breakfastCals = Math.round(targetCalories * (0.23 - ageFactor));
      lunchCals = Math.round(targetCalories * 0.32);
      snackCals = Math.round(targetCalories * (0.18 + ageFactor));
      dinnerCals = Math.round(targetCalories * 0.27);
    }

    const currentHour = new Date().getHours();

    return [
      { 
        id: 1, 
        meal: 'Breakfast', 
        calories: breakfastCals, 
        time: '08:00', 
        completed: currentHour > 9 
      },
      { 
        id: 2, 
        meal: 'Lunch', 
        calories: lunchCals, 
        time: '13:00', 
        completed: currentHour > 14 
      },
      { 
        id: 3, 
        meal: 'Snack', 
        calories: snackCals, 
        time: '16:00', 
        completed: currentHour > 17 
      },
      { 
        id: 4, 
        meal: 'Dinner', 
        calories: dinnerCals, 
        time: '19:00', 
        completed: currentHour > 20 
      }
    ];
  }, [calculateAge]);

  // Initialize Gemini AI
  const initializeGemini = () => {
    try {
      console.log('Initializing Gemini AI...');
      
      const apiKey = process.env.REACT_APP_GEMINI_API_KEY || 'AIzaSyDqAX9agitzTXAhWvVVNKB-zYTU5kKiQXg';
      const ai = new GoogleGenAI({ apiKey });
      
      console.log('Gemini AI initialized successfully');
      return ai;
    } catch (error) {
      console.error('Error initializing Gemini:', error);
      setAiError(`Failed to initialize AI: ${error.message}`);
      return null;
    }
  };

  // Fetch real health data from backend
  const fetchTodayHealthData = async () => {
    try {
      const userEmail = sessionStorage.getItem('userEmail');
      if (!userEmail) return;

      const response = await axios.get(`http://localhost:8070/health/today/${userEmail}`);
      
      if (response.data.status === "success") {
        const healthData = response.data.data;
        
        // Update state with real data
        setTodayStats({
          calories: healthData.calories.burned,
          water: healthData.waterIntake.current,
          steps: healthData.steps.current,
          workoutTime: healthData.workout.currentMinutes
        });
        
        // Set water glasses state for UI
        setWaterGlasses(healthData.waterIntake.glasses);
        
        console.log('Health data loaded:', healthData);
      }
    } catch (error) {
      console.error('Error fetching health data:', error);
      // If health data doesn't exist, initialize with default water glasses
      setWaterGlasses(Array.from({length: 8}, (_, i) => ({
        glassNumber: i + 1,
        completed: false
      })));
    }
  };

  // Update water intake
  const updateWaterIntake = async (glassNumber, completed) => {
    try {
      const userEmail = sessionStorage.getItem('userEmail');
      if (!userEmail) return;

      const response = await axios.put(`http://localhost:8070/health/water/${userEmail}`, {
        glassNumber,
        completed
      });
      
      if (response.data.status === "success") {
        // Update local state
        setTodayStats(prev => ({
          ...prev,
          water: response.data.data.current
        }));
        
        setWaterGlasses(response.data.data.glasses);
        
        console.log('Water intake updated:', response.data);
      }
    } catch (error) {
      console.error('Error updating water intake:', error);
      
      // Fallback: Update local state only
      setWaterGlasses(prev => prev.map(glass => 
        glass.glassNumber === glassNumber 
          ? { ...glass, completed } 
          : glass
      ));
      
      const newWaterCount = waterGlasses.filter(g => 
        g.glassNumber === glassNumber ? completed : g.completed
      ).length;
      
      setTodayStats(prev => ({
        ...prev,
        water: newWaterCount
      }));
    }
  };

  // Add workout session
  const addWorkoutSession = async (workoutData) => {
    try {
      const userEmail = sessionStorage.getItem('userEmail');
      if (!userEmail) return;

      const response = await axios.post(`http://localhost:8070/health/workout/${userEmail}`, workoutData);
      
      if (response.data.status === "success") {
        // Update local state
        setTodayStats(prev => ({
          ...prev,
          workoutTime: response.data.data.currentMinutes
        }));
        
        console.log('Workout added:', response.data);
      }
    } catch (error) {
      console.error('Error adding workout:', error);
      
      // Fallback: Update local state only
      setTodayStats(prev => ({
        ...prev,
        workoutTime: prev.workoutTime + (workoutData.duration || 0)
      }));
    }
  };

  useEffect(() => {
    const fetchUserData = async () => {
      try {
        const userEmail = sessionStorage.getItem('userEmail');
        if (!userEmail) {
          setError('No user email found. Please log in again.');
          setLoading(false);
          return;
        }

        console.log('Fetching user data for:', userEmail);
        
        // Updated to use /user prefix
        const response = await axios.get(`http://localhost:8070/user/getByEmail/${userEmail}`);
        
        if (response.data.status === "success") {
          const user = response.data.user;
          setUserData(user);
          
          // Calculate personalized health stats
          const calculatedStats = calculateHealthStats(user);
          setTodayStats(calculatedStats);
          
          // Generate personalized content
          setRecentWorkouts(generatePersonalizedWorkouts(user));
          setNutritionPlan(generateNutritionPlan(user, calculatedStats));
          
          console.log('User data loaded successfully:', user);
        } else {
          throw new Error('Failed to fetch user data');
        }
      } catch (error) {
        console.error('Error fetching user data:', error);
        setError('Failed to load user data. Please try again later.');
      }
    };

    const fetchUserBookings = async () => {
      try {
        const userEmail = sessionStorage.getItem('userEmail');
        if (userEmail) {
          // Updated to use /user prefix
          const response = await axios.get(`http://localhost:8070/user/bookings/${userEmail}`);
          if (response.data.status === "success") {
            setUserBookings(response.data.bookings);
          }
        }
      } catch (error) {
        console.error('Error fetching user bookings:', error);
      }
    };

    const loadAllData = async () => {
      setLoading(true);
      await fetchUserData();
      await fetchUserBookings();
      await fetchTodayHealthData();
      setLoading(false);
    };

    loadAllData();
  }, [calculateHealthStats, generateNutritionPlan, generatePersonalizedWorkouts]);

  const toggleSidebar = () => {
    setIsSidebarOpen(!isSidebarOpen);
  };

  const toggleChat = () => {
    setIsChatOpen(!isChatOpen);
    if (!isChatOpen) {
      setAiError(null);
    }
  };

  // Enhanced AI chat with real user data
  const sendMessage = async () => {
    if (!chatInput.trim()) return;

    const userMessage = chatInput.trim();
    setChatInput('');
    setAiError(null);
    
    setChatMessages(prev => [...prev, { type: 'user', message: userMessage }]);
    setIsTyping(true);
    
    try {
      const ai = initializeGemini();
      if (!ai) {
        throw new Error('Gemini AI not initialized');
      }

      // Create comprehensive user profile for AI
      const userAge = calculateAge(userData?.dob);
      const membershipDuration = userData?.joinedDate ? 
        Math.floor((new Date() - new Date(userData.joinedDate)) / (1000 * 60 * 60 * 24)) : 0;

      const healthPrompt = `You are a professional health and fitness assistant for a sports club member.

MEMBER PROFILE:
- Name: ${userData?.name || 'User'}
- Age: ${userAge} years old
- Gender: ${userData?.gender || 'Not specified'}
- Membership Status: ${userData?.membershipStatus || 'inactive'}
- Membership Package: ${userData?.membershipPackage || 'none'}
- Member since: ${formatDate(userData?.joinedDate)} (${membershipDuration} days)
- Contact: ${userData?.contact || 'Not provided'}

TODAY'S HEALTH DATA:
- Calories burned: ${todayStats.calories}
- Water intake: ${todayStats.water}/8 glasses
- Steps taken: ${todayStats.steps.toLocaleString()}
- Workout time: ${todayStats.workoutTime} minutes

RECENT ACTIVITY:
- Recent workouts: ${recentWorkouts.map(w => w.name).join(', ') || 'None'}
- Facility bookings: ${userBookings.length} active bookings
- Sports enrolled: ${userData?.sports?.length || 0} sports

User's question: ${userMessage}

Please provide personalized, helpful health and fitness advice based on this member's profile and current stats. Be encouraging and specific. Keep response to 2-3 sentences.`;

      const response = await ai.models.generateContent({
        model: "gemini-2.5-flash",
        contents: healthPrompt,
        config: {
          thinkingConfig: {
            thinkingBudget: 0,
          },
        }
      });

      const aiMessage = response.text;
      if (!aiMessage || aiMessage.trim().length === 0) {
        throw new Error('Empty response from Gemini');
      }

      setChatMessages(prev => [...prev, { type: 'ai', message: aiMessage }]);
      
    } catch (error) {
      console.error('Gemini API Error:', error);
      
      // Enhanced fallback with real user data
      const generatePersonalizedFallback = () => {
        const userName = userData?.name || 'there';
        const userAge = calculateAge(userData?.dob);
        const question = userMessage.toLowerCase();
        
        if (question.includes('water') || question.includes('hydrat')) {
          return `Hi ${userName}! I'm having technical issues, but I can see you've had ${todayStats.water} glasses of water today. At ${userAge} years old, staying hydrated is crucial for your ${userData?.membershipPackage || 'fitness'} goals!`;
        } else if (question.includes('workout') || question.includes('exercise')) {
          return `${userName}, despite the connection issue, you've done ${todayStats.workoutTime} minutes of exercise today! As a ${userData?.membershipStatus} member, keep up this great routine.`;
        } else if (question.includes('calorie')) {
          return `Hi ${userName}! You've burned ${todayStats.calories} calories today - excellent for someone with ${userData?.membershipPackage || 'your'} membership level!`;
        } else {
          return `Hi ${userName}! Technical difficulties here, but your stats look great: ${todayStats.calories} calories, ${todayStats.steps} steps. Keep up the excellent work with your ${userData?.membershipPackage || 'fitness'} journey!`;
        }
      };
      
      setChatMessages(prev => [...prev, { type: 'ai', message: generatePersonalizedFallback() }]);
      setAiError('Connection Error');
    } finally {
      setIsTyping(false);
    }
  };

  const handleKeyPress = (e) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault();
      sendMessage();
    }
  };

  // Test AI function
  const testAI = async () => {
    console.log('Testing Gemini AI connection...');
    try {
      const ai = initializeGemini();
      if (!ai) {
        alert('Gemini AI initialization failed');
        return;
      }
      
      const response = await ai.models.generateContent({
        model: "gemini-2.5-flash",
        contents: `Hello! I'm testing the connection for ${userData?.name || 'a user'}. Please respond with a friendly fitness greeting.`,
        config: {
          thinkingConfig: {
            thinkingBudget: 0,
          },
        }
      });
      
      alert('Gemini + MommentX AI Test Successful!\n\nResponse: ' + response.text);
      
    } catch (error) {
      console.error('Gemini Test failed:', error);
      alert('Gemini AI Test Failed!\n\nError: ' + error.message);
    }
  };

  if (loading) {
    return (
      <>
        <SlideNav isSidebarOpen={isSidebarOpen} toggleSidebar={toggleSidebar} />
        <div className={`${styles.mainContent} ${isSidebarOpen ? styles.sidebarOpen : ''}`}>
          <div className={styles.container}>
            <div className={styles.loading}>
              <FaHeartbeat className={styles.loadingIcon} />
              <p>Loading your health data...</p>
            </div>
          </div>
        </div>
      </>
    );
  }

  if (error) {
    return (
      <>
        <SlideNav isSidebarOpen={isSidebarOpen} toggleSidebar={toggleSidebar} />
        <div className={`${styles.mainContent} ${isSidebarOpen ? styles.sidebarOpen : ''}`}>
          <div className={styles.container}>
            <div className={styles.error}>
              <p>{error}</p>
            </div>
          </div>
        </div>
      </>
    );
  }

  return (
    <>
      <SlideNav isSidebarOpen={isSidebarOpen} toggleSidebar={toggleSidebar} />
      <div className={`${styles.mainContent} ${isSidebarOpen ? styles.sidebarOpen : ''}`}>
        <div className={styles.container}>
          {/* Tab Navigation */}
          <div className={styles.tabNavigation}>
            <button
              className={`${styles.tabButton} ${activeTab === 'overview' ? styles.activeTab : ''}`}
              onClick={() => setActiveTab('overview')}
            >
              <FaHeartbeat /> Overview
            </button>
            <button
              className={`${styles.tabButton} ${activeTab === 'workouts' ? styles.activeTab : ''}`}
              onClick={() => setActiveTab('workouts')}
            >
              <FaDumbbell /> Workouts
            </button>
            <button
              className={`${styles.tabButton} ${activeTab === 'nutrition' ? styles.activeTab : ''}`}
              onClick={() => setActiveTab('nutrition')}
            >
              <FaAppleAlt /> Nutrition
            </button>
            <button
              className={`${styles.tabButton} ${activeTab === 'progress' ? styles.activeTab : ''}`}
              onClick={() => setActiveTab('progress')}
            >
              <FaChartLine /> Progress
            </button>
          </div>

          {/* Test AI Button */}
          <div style={{ textAlign: 'center', margin: '10px 0' }}>
            <button 
              onClick={testAI} 
              style={{ 
                padding: '10px 20px', 
                background: '#667eea', 
                color: 'white', 
                border: 'none', 
                borderRadius: '5px',
                cursor: 'pointer'
              }}
            >
              Test Gemini AI
            </button>
          </div>

          {/* Overview Tab */}
          {activeTab === 'overview' && (
            <>
              <h1 className={styles.pageTitle}>Health Overview</h1>
              
              {/* User Profile Section */}
              {userData && (
                <div className={styles.userProfile}>
                  <div className={styles.profileHeader}>
                    <div className={styles.profileIcon}>
                      <FaUser />
                    </div>
                    <div className={styles.profileInfo}>
                      <h2>Welcome back, {userData.name}!</h2>
                      <div className={styles.profileDetails}>
                        <span><FaUser /> {calculateAge(userData.dob)} years old, {userData.gender}</span>
                        <span><FaEnvelope /> {userData.email}</span>
                        <span><FaPhone /> {userData.contact}</span>
                        <span><FaCalendarAlt /> Member since {formatDate(userData.joinedDate)}</span>
                      </div>
                      <div className={styles.membershipBadge}>
                        <span className={`${styles.status} ${styles[userData.membershipStatus]}`}>
                          {userData.membershipStatus?.toUpperCase()}
                        </span>
                        <span className={`${styles.package} ${styles[userData.membershipPackage]}`}>
                          {userData.membershipPackage?.toUpperCase()} MEMBER
                        </span>
                      </div>
                    </div>
                  </div>
                </div>
              )}
              
              {/* Today's Stats */}
              <div className={styles.statsGrid}>
                <div className={styles.statCard}>
                  <div className={styles.statIcon}>
                    <FaFire />
                  </div>
                  <div className={styles.statInfo}>
                    <h3>{todayStats.calories}</h3>
                    <p>Calories Burned</p>
                    <div className={styles.progress}>
                      <div className={styles.progressBar} style={{width: `${Math.min(100, (todayStats.calories / weeklyGoals.calories) * 100)}%`}}></div>
                    </div>
                    <small>Target: {weeklyGoals.calories} cal</small>
                  </div>
                </div>

                <div className={styles.statCard}>
                  <div className={styles.statIcon}>
                    <FaWater />
                  </div>
                  <div className={styles.statInfo}>
                    <h3>{todayStats.water}/8</h3>
                    <p>Glasses of Water</p>
                    <div className={styles.progress}>
                      <div className={styles.progressBar} style={{width: `${(todayStats.water / 8) * 100}%`}}></div>
                    </div>
                    <small>Target: 8 glasses</small>
                  </div>
                </div>

                <div className={styles.statCard}>
                  <div className={styles.statIcon}>
                    <FaRunning />
                  </div>
                  <div className={styles.statInfo}>
                    <h3>{todayStats.steps.toLocaleString()}</h3>
                    <p>Steps Today</p>
                    <div className={styles.progress}>
                      <div className={styles.progressBar} style={{width: `${Math.min(100, (todayStats.steps / 10000) * 100)}%`}}></div>
                    </div>
                    <small>Target: 10,000 steps</small>
                  </div>
                </div>

                <div className={styles.statCard}>
                  <div className={styles.statIcon}>
                    <FaStopwatch />
                  </div>
                  <div className={styles.statInfo}>
                    <h3>{todayStats.workoutTime}min</h3>
                    <p>Workout Time</p>
                    <div className={styles.progress}>
                      <div className={styles.progressBar} style={{width: `${Math.min(100, (todayStats.workoutTime / 60) * 100)}%`}}></div>
                    </div>
                    <small>Target: 60 min</small>
                  </div>
                </div>
              </div>

              {/* Weekly Goals */}
              <div className={styles.goalsSection}>
                <h2>Weekly Goals</h2>
                <div className={styles.goalsList}>
                  <div className={styles.goalItem}>
                    <FaBullseye />
                    <span>Complete {weeklyGoals.workouts} workouts this week</span>
                    <div className={styles.goalProgress}>{recentWorkouts.length}/{weeklyGoals.workouts}</div>
                  </div>
                  <div className={styles.goalItem}>
                    <FaFire />
                    <span>Burn {weeklyGoals.calories} calories daily</span>
                    <div className={styles.goalProgress}>{Math.round((todayStats.calories / weeklyGoals.calories) * 100)}%</div>
                  </div>
                  <div className={styles.goalItem}>
                    <FaWater />
                    <span>Drink {weeklyGoals.water} glasses of water daily</span>
                    <div className={styles.goalProgress}>{Math.round((todayStats.water / weeklyGoals.water) * 100)}%</div>
                  </div>
                </div>
              </div>

              {/* User Bookings */}
              {userBookings.length > 0 && (
                <div className={styles.bookingsSection}>
                  <h2>Your Recent Bookings</h2>
                  <div className={styles.bookingsList}>
                    {userBookings.slice(0, 3).map((booking, index) => (
                      <div key={index} className={styles.bookingCard}>
                        <div className={styles.bookingInfo}>
                          <h4>{booking.facilityName}</h4>
                          <p>Status: <span className={`${styles.bookingStatus} ${styles[booking.status]}`}>{booking.status}</span></p>
                          <small>{formatDate(booking.bookedAt)}</small>
                        </div>
                      </div>
                    ))}
                  </div>
                </div>
              )}

              {/* Water Tracking Section */}
              <div className={styles.waterSection}>
                <h2>💧 Daily Water Intake</h2>
                <div className={styles.waterTracker}>
                  <div className={styles.waterProgress}>
                    <span>{todayStats.water}/8 glasses today</span>
                    <div className={styles.progressBar}>
                      <div 
                        className={styles.progressFill} 
                        style={{width: `${(todayStats.water / 8) * 100}%`}}
                      ></div>
                    </div>
                  </div>
                  
                  <div className={styles.waterGlasses}>
                    {waterGlasses.map((glass, index) => (
                      <div 
                        key={glass.glassNumber} 
                        className={`${styles.waterGlass} ${glass.completed ? styles.completed : ''}`}
                        onClick={() => updateWaterIntake(glass.glassNumber, !glass.completed)}
                      >
                        <FaWater />
                        <span>{glass.glassNumber}</span>
                        {glass.completed && <span className={styles.checkMark}>✓</span>}
                      </div>
                    ))}
                  </div>
                </div>
              </div>
            </>
          )}

          {/* Workouts Tab */}
          {activeTab === 'workouts' && (
            <>
              <h1 className={styles.pageTitle}>Personalized Workout Plans</h1>
              <p className={styles.subtitle}>Based on your profile: {calculateAge(userData?.dob)} years old, {userData?.gender}, {userData?.membershipStatus} member</p>
              
              {/* Add workout button */}
              <div className={styles.addWorkoutContainer}>
                <button 
                  className={styles.addWorkoutButton}
                  onClick={() => {
                    // Example workout data
                    const newWorkout = {
                      name: "Quick Exercise",
                      duration: 15,
                      calories: 120
                    };
                    addWorkoutSession(newWorkout);
                    alert("Workout added: 15 minutes, 120 calories");
                  }}
                >
                  <FaDumbbell /> Add Quick Workout
                </button>
              </div>
              
              <div className={styles.workouts}>
                {recentWorkouts.map((workout) => (
                  <div key={workout.id} className={styles.workoutCard}>
                    <div className={styles.workoutHeader}>
                      <div className={styles.workoutIcon}>
                        <FaDumbbell />
                      </div>
                      <div className={styles.workoutInfo}>
                        <h3>{workout.name}</h3>
                        <p>{workout.date}</p>
                      </div>
                    </div>
                    <div className={styles.workoutStats}>
                      <div className={styles.workoutStat}>
                        <FaClock />
                        <span>{workout.duration} min</span>
                      </div>
                      <div className={styles.workoutStat}>
                        <FaFire />
                        <span>{workout.calories} cal</span>
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            </>
          )}

          {/* Nutrition Tab */}
          {activeTab === 'nutrition' && (
            <>
              <h1 className={styles.pageTitle}>Personalized Nutrition Plan</h1>
              <p className={styles.subtitle}>Customized for {userData?.gender}, targeting {todayStats.calories} calories daily</p>
              
              <div className={styles.meals}>
                {nutritionPlan.map((meal) => (
                  <div key={meal.id} className={`${styles.mealCard} ${meal.completed ? styles.completed : ''}`}>
                    <div className={styles.mealInfo}>
                      <h3>{meal.meal}</h3>
                      <p>{meal.time}</p>
                    </div>
                    <div className={styles.mealCalories}>
                      <span>{meal.calories} cal</span>
                    </div>
                    <div className={styles.mealStatus}>
                      {meal.completed ? '✓' : '○'}
                    </div>
                  </div>
                ))}
              </div>
            </>
          )}

          {/* Progress Tab */}
          {activeTab === 'progress' && (
            <>
              <h1 className={styles.pageTitle}>Progress Tracking</h1>
              
              <div className={styles.progressInfo}>
                <div className={styles.membershipInfo}>
                  <h3>Membership Journey</h3>
                  <p>Member since: {formatDate(userData?.joinedDate)}</p>
                  <p>Membership Level: {userData?.membershipPackage}</p>
                  <p>Current Status: {userData?.membershipStatus}</p>
                </div>
              </div>
              
              <div className={styles.progressCharts}>
                <div className={styles.chartCard}>
                  <h3>Weight Progress</h3>
                  <div className={styles.chartPlaceholder}>
                    <FaWeight />
                    <p>Chart will display here</p>
                    <small>Based on your {calculateAge(userData?.dob)} age and {userData?.gender} profile</small>
                  </div>
                </div>
                <div className={styles.chartCard}>
                  <h3>Workout Frequency</h3>
                  <div className={styles.chartPlaceholder}>
                    <FaChartLine />
                    <p>Chart will display here</p>
                    <small>Tracking your {recentWorkouts.length} recent workouts</small>
                  </div>
                </div>
              </div>
            </>
          )}
        </div>

        {/* AI Chat Circle Button */}
        <div className={styles.aiChatButton} onClick={toggleChat}>
          <FaRobot />
          <span className={styles.aiText}>AI</span>
        </div>

        {/* AI Chat Modal */}
        {isChatOpen && (
          <div className={styles.chatModal}>
            <div className={styles.chatHeader}>
              <h3><FaRobot /> Flexi {aiError && '(Limited)'}</h3>
              <button className={styles.closeChat} onClick={toggleChat}>
                <FaTimes />
              </button>
            </div>
            
            {aiError && (
              <div style={{ padding: '10px', background: '#ffeb3b', color: '#333', fontSize: '12px' }}>
                {aiError} - Using personalized fallback responses
              </div>
            )}
            
            <div className={styles.chatMessages}>
              {chatMessages.map((msg, index) => (
                <div key={index} className={`${styles.message} ${styles[msg.type]}`}>
                  {msg.message}
                </div>
              ))}
              {isTyping && (
                <div className={`${styles.message} ${styles.ai} ${styles.typing}`}>
                  <div className={styles.typingDots}>
                    <span></span>
                    <span></span>
                    <span></span>
                  </div>
                </div>
              )}
            </div>
            
            <div className={styles.chatInput}>
              <input
                type="text"
                value={chatInput}
                onChange={(e) => setChatInput(e.target.value)}
                onKeyPress={handleKeyPress}
                placeholder={`Ask me about your health, ${userData?.name}...`}
              />
              <button onClick={sendMessage} disabled={isTyping}>
                <FaPaperPlane />
              </button>
            </div>
          </div>
        )}
      </div>
    </>
  );
};

export default Health;