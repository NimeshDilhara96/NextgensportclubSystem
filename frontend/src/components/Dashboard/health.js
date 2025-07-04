import React, { useState, useEffect } from 'react';
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
  FaBullseye
} from 'react-icons/fa';
import styles from './Health.module.css';
import axios from 'axios';

const Health = () => {
  const [isSidebarOpen, setIsSidebarOpen] = useState(true);
  const [activeTab, setActiveTab] = useState('overview'); // 'overview', 'workouts', 'nutrition', 'progress'
  const [userData, setUserData] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  
  // AI Chat States
  const [isChatOpen, setIsChatOpen] = useState(false);
  const [chatMessages, setChatMessages] = useState([
    { type: 'ai', message: 'Hello! I\'m your AI health assistant. How can I help you today?' }
  ]);
  const [chatInput, setChatInput] = useState('');
  const [isTyping, setIsTyping] = useState(false);

  // Health Data States
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

  useEffect(() => {
    const fetchUserData = async () => {
      try {
        const userEmail = sessionStorage.getItem('userEmail');
        if (userEmail) {
          const response = await axios.get(`http://localhost:8070/user/getByEmail/${userEmail}`);
          if (response.data.status === "success") {
            setUserData(response.data.user);
          }
        }
      } catch (error) {
        console.error('Error fetching user data:', error);
      }
    };

    const fetchHealthData = async () => {
      try {
        setLoading(true);
        // Simulate API calls for health data
        // In real app, these would be actual API calls
        setTodayStats({
          calories: 1850,
          water: 6,
          steps: 8500,
          workoutTime: 45
        });

        setRecentWorkouts([
          { id: 1, name: 'Morning Cardio', duration: 30, calories: 300, date: '2025-01-04' },
          { id: 2, name: 'Strength Training', duration: 45, calories: 400, date: '2025-01-03' },
          { id: 3, name: 'Yoga Session', duration: 60, calories: 200, date: '2025-01-02' }
        ]);

        setNutritionPlan([
          { id: 1, meal: 'Breakfast', calories: 400, time: '08:00', completed: true },
          { id: 2, meal: 'Lunch', calories: 600, time: '13:00', completed: true },
          { id: 3, meal: 'Snack', calories: 200, time: '16:00', completed: false },
          { id: 4, meal: 'Dinner', calories: 800, time: '19:00', completed: false }
        ]);
      } catch (error) {
        console.error('Error fetching health data:', error);
        setError('Failed to load health data. Please try again later.');
      } finally {
        setLoading(false);
      }
    };

    fetchUserData();
    fetchHealthData();
  }, []);

  const toggleSidebar = () => {
    setIsSidebarOpen(!isSidebarOpen);
  };

  const toggleChat = () => {
    setIsChatOpen(!isChatOpen);
  };

  const sendMessage = async () => {
    if (!chatInput.trim()) return;

    const userMessage = chatInput;
    setChatInput('');
    
    // Add user message to chat
    setChatMessages(prev => [...prev, { type: 'user', message: userMessage }]);
    
    setIsTyping(true);
    
    // Simulate AI response
    setTimeout(() => {
      const aiResponses = [
        "That's a great question! Based on your current fitness level, I recommend...",
        "For optimal health results, try incorporating more protein in your diet.",
        "Your workout routine looks good! Consider adding more cardio for better results.",
        "Remember to stay hydrated and get adequate sleep for recovery.",
        "I suggest tracking your progress weekly to stay motivated!"
      ];
      
      const randomResponse = aiResponses[Math.floor(Math.random() * aiResponses.length)];
      
      setChatMessages(prev => [...prev, { type: 'ai', message: randomResponse }]);
      setIsTyping(false);
    }, 2000);
  };

  const handleKeyPress = (e) => {
    if (e.key === 'Enter') {
      sendMessage();
    }
  };

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

          {/* Overview Tab */}
          {activeTab === 'overview' && (
            <>
              <h1 className={styles.pageTitle}>Health Overview</h1>
              
              {loading && <div className={styles.loading}>Loading health data...</div>}
              {error && <div className={styles.error}>{error}</div>}
              
              {/* User Info */}
              {userData && (
                <div className={styles.userInfo}>
                  <p>Welcome, {userData.firstName || 'User'}!</p>
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
                      <div className={styles.progressBar} style={{width: `${(todayStats.calories / 2000) * 100}%`}}></div>
                    </div>
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
                      <div className={styles.progressBar} style={{width: `${(todayStats.steps / 10000) * 100}%`}}></div>
                    </div>
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
                      <div className={styles.progressBar} style={{width: `${(todayStats.workoutTime / 60) * 100}%`}}></div>
                    </div>
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
                    <div className={styles.goalProgress}>3/{weeklyGoals.workouts}</div>
                  </div>
                  <div className={styles.goalItem}>
                    <FaFire />
                    <span>Burn {weeklyGoals.calories} calories daily</span>
                    <div className={styles.goalProgress}>85%</div>
                  </div>
                  <div className={styles.goalItem}>
                    <FaWater />
                    <span>Drink {weeklyGoals.water} glasses of water daily</span>
                    <div className={styles.goalProgress}>75%</div>
                  </div>
                </div>
              </div>
            </>
          )}

          {/* Workouts Tab */}
          {activeTab === 'workouts' && (
            <>
              <h1 className={styles.pageTitle}>Workout Plans</h1>
              
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
              <h1 className={styles.pageTitle}>Nutrition Plan</h1>
              
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
              
              <div className={styles.progressCharts}>
                <div className={styles.chartCard}>
                  <h3>Weight Progress</h3>
                  <div className={styles.chartPlaceholder}>
                    <FaWeight />
                    <p>Chart will display here</p>
                  </div>
                </div>
                <div className={styles.chartCard}>
                  <h3>Workout Frequency</h3>
                  <div className={styles.chartPlaceholder}>
                    <FaChartLine />
                    <p>Chart will display here</p>
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
              <h3><FaRobot /> AI Health Assistant</h3>
              <button className={styles.closeChat} onClick={toggleChat}>
                <FaTimes />
              </button>
            </div>
            
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
                placeholder="Ask me about health, nutrition, or workouts..."
              />
              <button onClick={sendMessage}>
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