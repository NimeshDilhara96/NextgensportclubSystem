import React, { useState } from 'react';
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
  FaUser,
  FaCalendarAlt,
  FaPhone,
  FaEnvelope,
  FaBullseye,
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

  // Sidebar toggle handler
  const toggleSidebar = () => setIsSidebarOpen((prev) => !prev);
  
  // AI Chat States
  const [isChatOpen, setIsChatOpen] = useState(false);
  const [chatMessages, setChatMessages] = useState([
    { type: 'ai', message: 'Hello! I\'m flexi powered by Google Gemini X MommentX. How can I help you with your fitness and health goals today?' }
  ]);
  const [chatInput, setChatInput] = useState('');
  const [isTyping, setIsTyping] = useState(false);
  const [aiError, setAiError] = useState(null);

  // Toggle AI Chat Modal
  const toggleChat = () => setIsChatOpen(prev => !prev);

  // Health Data States - Now from backend HealthData model
  const [todayStats, setTodayStats] = useState({
    water: 0,
    calories: { burned: 0, consumed: 0, target: 2000 },
    steps: { current: 0, target: 10000 },
    workout: { totalMinutes: 0, totalCalories: 0, sessions: [] }
  });

  const [recentWorkouts, setRecentWorkouts] = useState([]);
  const [nutritionPlan, setNutritionPlan] = useState([]);
  const [waterGlasses, setWaterGlasses] = useState([]);

  // AI Workouts States
  const [aiWorkouts, setAiWorkouts] = useState([]);
  const [aiWorkoutLoading, setAiWorkoutLoading] = useState(false);
  const [aiWorkoutError, setAiWorkoutError] = useState(null);
  const [completedAIWorkouts, setCompletedAIWorkouts] = useState({});

  // BMI States
  const [bmi, setBmi] = useState(null);
  const [bmiInput, setBmiInput] = useState({ height: '', weight: '' });

  // Additional Health Tracking States
  const [mood, setMood] = useState('');
  const [energy, setEnergy] = useState(5);
  const [notes, setNotes] = useState('');
  const [stepsInput, setStepsInput] = useState('');
  const [caloriesInput, setCaloriesInput] = useState({ burned: '', consumed: '' });

  // Add new state for workout plan
  const [workoutPlan, setWorkoutPlan] = useState(null);
  const [showGoalModal, setShowGoalModal] = useState(false);
  const [selectedGoal, setSelectedGoal] = useState('');
  const [planLoading, setPlanLoading] = useState(false);

  // Fetch real health data from backend HealthData model
  // (Duplicate fetchTodayHealthData removed to fix redeclaration error)

  // Calculate user's age from DOB
  const calculateAge = (dob) => {
    if (!dob) return 'N/A';
    const birthDate = new Date(dob);
    const today = new Date();
    let age = today.getFullYear() - birthDate.getFullYear();
    const monthDiff = today.getMonth() - birthDate.getMonth();
    if (monthDiff < 0 || (monthDiff === 0 && today.getDate() < birthDate.getDate())) {
      age--;
    }
    return age;
  };

  // Format date for display
  const formatDate = (date) => {
    if (!date) return 'N/A';
    return new Date(date).toLocaleDateString('en-US', {
      year: 'numeric',
      month: 'long',
      day: 'numeric'
    });
  };

  // Initialize default water glasses
  const initializeWaterGlasses = () => {
    return Array.from({length: 8}, (_, i) => ({
      glassNumber: i + 1,
      completed: false
    }));
  };

  // Fetch real health data from backend HealthData model
  const fetchTodayHealthData = React.useCallback(async () => {
    try {
      const userEmail = sessionStorage.getItem('userEmail');
      if (!userEmail) {
        console.error('No user email found');
        setWaterGlasses(initializeWaterGlasses());
        return;
      }

      console.log('Fetching health data for:', userEmail);
      const response = await axios.get(`http://localhost:8070/user/health/today/${userEmail}`);
      
      if (response.data.status === "success") {
        const healthData = response.data.data;
        
        // Update state with real data from HealthData model
        setTodayStats({
          water: healthData.waterIntake?.current || 0,
          calories: {
            burned: healthData.calories?.burned || 0,
            consumed: healthData.calories?.consumed || 0,
            target: healthData.calories?.target || 2000
          },
          steps: {
            current: healthData.steps?.current || 0,
            target: healthData.steps?.target || 10000
          },
          workout: {
            totalMinutes: healthData.workout?.totalMinutes || 0,
            totalCalories: healthData.workout?.totalCalories || 0,
            sessions: healthData.workout?.sessions || []
          }
        });
        
        // Set water glasses state for UI
        setWaterGlasses(healthData.waterIntake?.glasses || initializeWaterGlasses());
        
        // Set other health data
        setBmi(healthData.bmi);
        setMood(healthData.mood || '');
        setEnergy(healthData.energy || 5);
        setNotes(healthData.notes || '');
        
        // Update recent workouts from actual workout sessions
        if (healthData.workout?.sessions) {
          setRecentWorkouts(healthData.workout.sessions.map((session, index) => ({
            id: index + 1,
            name: session.name,
            duration: session.duration,
            calories: session.calories,
            completed: session.completed,
            date: new Date(session.startTime).toISOString().split('T')[0]
          })));
        }
        
        console.log('Health data loaded from HealthData model:', healthData);
      } else {
        console.error('Health data fetch failed:', response.data);
        setWaterGlasses(initializeWaterGlasses());
      }
    } catch (error) {
      console.error('Error fetching health data:', error);
      setWaterGlasses(initializeWaterGlasses());
    }
  }, []);

  // Update water intake - now properly saves to HealthData model
  const updateWaterIntake = async (glassNumber, completed) => {
    try {
      const userEmail = sessionStorage.getItem('userEmail');
      if (!userEmail) {
        console.error('No user email found');
        return;
      }

      const payload = { glassNumber, completed };
      if (bmi) payload.bmi = bmi;

      console.log('Sending water update:', payload);
      const response = await axios.put(`http://localhost:8070/user/health/water/${userEmail}`, payload);
      
      if (response.data.status === "success") {
        // Update local state with data from HealthData model
        setTodayStats(prev => ({
          ...prev,
          water: response.data.data.current
        }));
        
        setWaterGlasses(response.data.data.glasses);
        
        console.log('Water intake updated in HealthData model:', response.data);
      } else {
        console.error('Water update failed:', response.data);
      }
    } catch (error) {
      console.error('Error updating water intake:', error);
      alert('Error updating water intake. Please try again.');
      
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

  // Add workout session - now properly saves to HealthData model
  const addWorkoutSession = async (workoutData) => {
    try {
      const userEmail = sessionStorage.getItem('userEmail');
      if (!userEmail) {
        console.error('No user email found');
        return;
      }

      console.log('Sending workout data:', workoutData);
      const response = await axios.post(`http://localhost:8070/user/health/workout/${userEmail}`, workoutData);
      
      if (response.data.status === "success") {
        // Update local state with data from HealthData model
        setTodayStats(prev => ({
          ...prev,
          workout: {
            totalMinutes: response.data.data.totalMinutes,
            totalCalories: response.data.data.totalCalories,
            sessions: response.data.data.sessions
          }
        }));
        
        // Update recent workouts
        setRecentWorkouts(response.data.data.sessions.map((session, index) => ({
          id: index + 1, // Use index + 1 as ID
          name: session.name,
          duration: session.duration,
          calories: session.calories,
          completed: session.completed,
          date: new Date(session.startTime).toISOString().split('T')[0]
        })));
        
        console.log('Workout added to HealthData model:', response.data);
        alert('Workout session added successfully!');
      } else {
        console.error('Workout add failed:', response.data);
        alert('Failed to add workout. Please try again.');
      }
    } catch (error) {
      console.error('Error adding workout:', error);
      alert('Error adding workout. Please try again.');
      
      // Fallback: Update local state only
      setTodayStats(prev => ({
        ...prev,
        workout: {
          ...prev.workout,
          totalMinutes: prev.workout.totalMinutes + (workoutData.duration || 0),
          totalCalories: prev.workout.totalCalories + (workoutData.calories || 0)
        }
      }));
    }
  };

  // Update steps - new function to save steps to HealthData model
  const updateSteps = async () => {
    try {
      const userEmail = sessionStorage.getItem('userEmail');
      if (!userEmail || !stepsInput) return;

      const response = await axios.put(`http://localhost:8070/user/health/steps/${userEmail}`, {
        steps: parseInt(stepsInput)
      });
      
      if (response.data.status === "success") {
        setTodayStats(prev => ({
          ...prev,
          steps: {
            current: response.data.data.current,
            target: response.data.data.target
          }
        }));
        
        setStepsInput('');
        console.log('Steps updated in HealthData model:', response.data);
      }
    } catch (error) {
      console.error('Error updating steps:', error);
    }
  };

  // Update calories - new function to save calories to HealthData model
  const updateCalories = async () => {
    try {
      const userEmail = sessionStorage.getItem('userEmail');
      if (!userEmail) return;

      const payload = {};
      if (caloriesInput.burned) payload.burned = parseInt(caloriesInput.burned);
      if (caloriesInput.consumed) payload.consumed = parseInt(caloriesInput.consumed);

      if (Object.keys(payload).length === 0) return;

      const response = await axios.put(`http://localhost:8070/user/health/calories/${userEmail}`, payload);
      
      if (response.data.status === "success") {
        setTodayStats(prev => ({
          ...prev,
          calories: {
            burned: response.data.data.burned,
            consumed: response.data.data.consumed,
            target: response.data.data.target
          }
        }));
        
        setCaloriesInput({ burned: '', consumed: '' });
        console.log('Calories updated in HealthData model:', response.data);
      }
    } catch (error) {
      console.error('Error updating calories:', error);
    }
  };

  // Update mood and energy - new function to save to HealthData model
  const updateMoodAndEnergy = async () => {
    try {
      const userEmail = sessionStorage.getItem('userEmail');
      if (!userEmail) return;

      const payload = {};
      if (mood) payload.mood = mood;
      if (energy) payload.energy = energy;
      if (notes) payload.notes = notes;

      if (Object.keys(payload).length === 0) return;

      const response = await axios.put(`http://localhost:8070/user/health/mood/${userEmail}`, payload);
      
      if (response.data.status === "success") {
        console.log('Mood and energy updated in HealthData model:', response.data);
      }
    } catch (error) {
      console.error('Error updating mood and energy:', error);
    }
  };

  // Calculate BMI and save to HealthData model
  const calculateBMI = async () => {
    const heightM = parseFloat(bmiInput.height) / 100;
    const weightKg = parseFloat(bmiInput.weight);
    if (!heightM || !weightKg) {
      alert('Please enter both height and weight');
      return;
    }
    
    const bmiValue = weightKg / (heightM * heightM);
    const bmiResult = bmiValue.toFixed(2);
    setBmi(bmiResult);

    // Save BMI to HealthData model
    try {
      const userEmail = sessionStorage.getItem('userEmail');
      if (!userEmail) {
        console.error('No user email found');
        return;
      }

      console.log('Sending BMI update:', { bmi: parseFloat(bmiResult) });
      const response = await axios.put(`http://localhost:8070/user/health/bmi/${userEmail}`, {
        bmi: parseFloat(bmiResult)
      });
      
      if (response.data.status === "success") {
        console.log('BMI saved to HealthData model:', response.data);
        alert(`BMI calculated and saved: ${bmiResult}`);
      } else {
        console.error('BMI save failed:', response.data);
        alert('Failed to save BMI. Please try again.');
      }
    } catch (error) {
      console.error('Error saving BMI:', error);
      alert('Error saving BMI. Please try again.');
    }
  };

  // Mark workout as completed/incomplete
  const toggleWorkoutComplete = async (workoutId, completed) => {
    try {
      const userEmail = sessionStorage.getItem('userEmail');
      if (!userEmail) {
        console.error('No user email found');
        return;
      }

      console.log('Sending workout completion update:', { workoutId, completed });
      const response = await axios.put(`http://localhost:8070/user/health/workout/complete/${userEmail}`, {
        workoutId,
        completed
      });
      
      if (response.data.status === "success") {
        // Update local state
        setTodayStats(prev => ({
          ...prev,
          workout: {
            totalMinutes: response.data.data.totalMinutes,
            totalCalories: response.data.data.totalCalories,
            sessions: response.data.data.sessions
          }
        }));
        
        // Update recent workouts
        setRecentWorkouts(response.data.data.sessions.map((session, index) => ({
          id: index + 1, // Use index + 1 as ID
          name: session.name,
          duration: session.duration,
          calories: session.calories,
          completed: session.completed,
          date: new Date(session.startTime).toISOString().split('T')[0]
        })));
        
        console.log('Workout completion updated:', response.data);
      } else {
        console.error('Workout completion update failed:', response.data);
        alert('Failed to update workout status. Please try again.');
      }
    } catch (error) {
      console.error('Error updating workout completion:', error);
      alert('Error updating workout status. Please try again.');
    }
  };

  // (Removed unused generatePersonalizedWorkouts function)

  // (Removed unused generateNutritionPlan function)

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

  // Fetch nutrition plan from backend
  const fetchNutritionPlan = async (userEmail) => {
    try {
      console.log("Fetching nutrition plan for:", userEmail);
      // Since we don't have a nutrition plan endpoint yet, let's create a basic one
      const basicNutritionPlan = [
        { 
          id: 1, 
          meal: 'Breakfast', 
          calories: 400, 
          time: '08:00', 
          completed: false,
          items: ['Oatmeal with fruits', 'Greek yogurt', 'Nuts']
        },
        { 
          id: 2, 
          meal: 'Lunch', 
          calories: 600, 
          time: '13:00', 
          completed: false,
          items: ['Grilled chicken', 'Brown rice', 'Vegetables']
        },
        { 
          id: 3, 
          meal: 'Snack', 
          calories: 200, 
          time: '16:00', 
          completed: false,
          items: ['Apple', 'Almonds']
        },
        { 
          id: 4, 
          meal: 'Dinner', 
          calories: 500, 
          time: '19:00', 
          completed: false,
          items: ['Salmon', 'Quinoa', 'Steamed vegetables']
        }
      ];
      
      setNutritionPlan(basicNutritionPlan);
      console.log("Basic nutrition plan set");
    } catch (error) {
      setNutritionPlan([]);
      console.error('Error setting nutrition plan:', error);
    }
  };

  // Generate 7-day workout plan
  const generateWorkoutPlan = async (goal) => {
    try {
      const userEmail = sessionStorage.getItem('userEmail');
      if (!userEmail) {
        console.error('No user email found');
        return;
      }

      setPlanLoading(true);
      console.log('Generating workout plan for goal:', goal);
      
      const response = await axios.post(`http://localhost:8070/user/health/workout-plan/generate/${userEmail}`, {
        goal: goal
      });
      
      if (response.data.status === "success") {
        setWorkoutPlan(response.data.data);
        setShowGoalModal(false);
        setSelectedGoal('');
        console.log('Workout plan generated:', response.data.data);
        alert('7-day workout plan generated successfully!');
      } else {
        console.error('Workout plan generation failed:', response.data);
        alert('Failed to generate workout plan. Please try again.');
      }
    } catch (error) {
      console.error('Error generating workout plan:', error);
      alert('Error generating workout plan. Please try again.');
    } finally {
      setPlanLoading(false);
    }
  };

  // Fetch current workout plan
  const fetchWorkoutPlan = async () => {
    try {
      const userEmail = sessionStorage.getItem('userEmail');
      if (!userEmail) return;

      const response = await axios.get(`http://localhost:8070/user/health/workout-plan/${userEmail}`);
      
      if (response.data.status === "success" && response.data.data) {
        setWorkoutPlan(response.data.data);
        console.log('Workout plan loaded:', response.data.data);
      }
    } catch (error) {
      console.error('Error fetching workout plan:', error);
    }
  };

  // Mark exercise as completed
  const markExerciseComplete = async (dayNumber, exerciseIndex, completed) => {
    try {
      const userEmail = sessionStorage.getItem('userEmail');
      if (!userEmail) {
        console.error('No user email found');
        return;
      }

      console.log('Marking exercise complete:', { dayNumber, exerciseIndex, completed });
      
      const response = await axios.put(`http://localhost:8070/user/health/workout-plan/complete/${userEmail}`, {
        dayNumber,
        exerciseIndex,
        completed
      });
      
      if (response.data.status === "success") {
        // Update local state
        setWorkoutPlan(response.data.data.workoutPlan);
        setTodayStats(prev => ({
          ...prev,
          calories: {
            ...prev.calories,
            burned: response.data.data.calories.burned
          }
        }));
        
        console.log('Exercise completion updated:', response.data);
        
        if (completed) {
          alert('Exercise completed! Calories burned updated.');
        }
      } else {
        console.error('Exercise completion update failed:', response.data);
        alert('Failed to update exercise status. Please try again.');
      }
    } catch (error) {
      console.error('Error updating exercise completion:', error);
      alert('Error updating exercise status. Please try again.');
    }
  };

  // Generate AI Workouts - Fixed implementation
  const generateAIWorkouts = async () => {
    setAiWorkoutLoading(true);
    setAiWorkoutError(null);
    
    try {
      const userEmail = sessionStorage.getItem('userEmail');
      if (!userEmail) {
        throw new Error('No user email found');
      }

      // Get user data for personalization
      const userRes = await axios.get(`http://localhost:8070/user/getByEmail/${userEmail}`);
      if (userRes.data.status !== "success") {
        throw new Error('Failed to fetch user data');
      }

      const user = userRes.data.user;
      const age = calculateAge(user.dob);
      const gender = user.gender;

      // Initialize Gemini AI
      const ai = initializeGemini();
      if (!ai) {
        throw new Error('AI not available');
      }

      // Create personalized prompt
      const prompt = `Create a personalized 7-day workout plan for a ${age}-year-old ${gender} with no equipment needed. 
      
      Requirements:
      - 7 different days with 7 exercises each day
      - Each exercise should include: name, sets, reps, duration (minutes), and estimated calories burned
      - Exercises should be suitable for home workouts with no equipment
      - Vary the intensity and focus areas (cardio, strength, flexibility)
      - Total daily calories should be between 200-400 calories
      - Include rest days or lighter days
      
      User Profile:
      - Age: ${age}
      - Gender: ${gender}
      - Goal: General fitness and health improvement
      
      Please provide the response in this exact JSON format:
      {
        "workouts": [
          {
            "day": "Day 1",
            "dayNumber": 1,
            "focus": "Cardio & Full Body",
            "exercises": [
              {
                "name": "Exercise Name",
                "sets": 3,
                "reps": 15,
                "duration": 2,
                "calories": 8,
                "description": "Brief description of how to do the exercise"
              }
            ],
            "totalCalories": 180,
            "totalDuration": 25
          }
        ]
      }`;

      console.log('Generating AI workout plan...');
      
      const response = await ai.models.generateContent({
        model: "gemini-2.5-flash",
        contents: prompt,
        config: {
          thinkingConfig: {
            thinkingBudget: 0,
          },
        }
      });

      const aiResponse = response.text || response.response?.text;
      
      if (!aiResponse) {
        throw new Error('No response from AI');
      }

      console.log('AI Response:', aiResponse);

      // Try to parse JSON from the response
      let workoutData;
      try {
        // Extract JSON from the response (AI might add extra text)
        const jsonMatch = aiResponse.match(/\{[\s\S]*\}/);
        if (jsonMatch) {
          workoutData = JSON.parse(jsonMatch[0]);
        } else {
          throw new Error('No JSON found in response');
        }
      } catch (parseError) {
        console.error('Failed to parse AI response:', parseError);
        console.log('Raw AI response:', aiResponse);
        
        // Fallback: Create a basic workout plan
        workoutData = {
          workouts: [
            {
              day: "Day 1",
              dayNumber: 1,
              focus: "Cardio & Full Body",
              exercises: [
                { name: "Jumping Jacks", sets: 3, reps: 20, duration: 2, calories: 8, description: "Jump while raising arms and legs" },
                { name: "Push-ups", sets: 3, reps: 10, duration: 2, calories: 5, description: "Standard push-ups on floor" },
                { name: "Squats", sets: 3, reps: 15, duration: 2, calories: 6, description: "Bodyweight squats" },
                { name: "Plank", sets: 3, reps: 30, duration: 1, calories: 4, description: "Hold plank position" },
                { name: "Lunges", sets: 3, reps: 12, duration: 2, calories: 6, description: "Alternating lunges" },
                { name: "Mountain Climbers", sets: 3, reps: 20, duration: 2, calories: 6, description: "Running in plank position" },
                { name: "Burpees", sets: 3, reps: 8, duration: 3, calories: 10, description: "Full burpee with push-up" }
              ],
              totalCalories: 180,
              totalDuration: 25
            },
            {
              day: "Day 2",
              dayNumber: 2,
              focus: "Strength & Core",
              exercises: [
                { name: "Push-ups", sets: 4, reps: 12, duration: 3, calories: 6, description: "Focus on form" },
                { name: "Squats", sets: 4, reps: 18, duration: 3, calories: 7, description: "Deep squats" },
                { name: "Plank", sets: 4, reps: 45, duration: 2, calories: 5, description: "Longer holds" },
                { name: "Lunges", sets: 3, reps: 15, duration: 2, calories: 7, description: "Walking lunges" },
                { name: "Glute Bridges", sets: 3, reps: 20, duration: 2, calories: 5, description: "Lay on back, lift hips" },
                { name: "Bicycle Crunches", sets: 3, reps: 20, duration: 2, calories: 4, description: "Alternating knee to elbow" },
                { name: "Wall Sit", sets: 3, reps: 60, duration: 2, calories: 6, description: "Sit against wall" }
              ],
              totalCalories: 200,
              totalDuration: 25
            }
          ]
        };
      }

      // Transform the data for the frontend
      const transformedWorkouts = workoutData.workouts.map(workout => ({
        workoutName: `${workout.focus} - ${workout.day}`,
        day: workout.day,
        dayNumber: workout.dayNumber,
        duration: workout.totalDuration,
        calories: workout.totalCalories,
        description: `${workout.focus} workout with ${workout.exercises.length} exercises`,
        exercises: workout.exercises
      }));

      setAiWorkouts(transformedWorkouts);
      setCompletedAIWorkouts({});
      
      console.log('AI workouts generated successfully:', transformedWorkouts);
      
    } catch (err) {
      console.error('Error generating AI workouts:', err);
      setAiWorkoutError(`Failed to generate AI workouts: ${err.message}`);
      
      // Fallback workouts
      const fallbackWorkouts = [
        {
          workoutName: "Cardio Blast",
          day: "Day 1",
          duration: 20,
          calories: 180,
          description: "High-intensity cardio workout to get your heart pumping."
        },
        {
          workoutName: "Strength Builder",
          day: "Day 2", 
          duration: 25,
          calories: 200,
          description: "Strength-focused exercises for full body."
        },
        {
          workoutName: "Core Crusher",
          day: "Day 3",
          duration: 15,
          calories: 150,
          description: "Target your core muscles with these exercises."
        }
      ];
      
      setAiWorkouts(fallbackWorkouts);
      setCompletedAIWorkouts({});
    } finally {
      setAiWorkoutLoading(false);
    }
  };

  // Enhanced AI workout completion with calorie tracking
  const toggleAIWorkoutComplete = async (idx) => {
    try {
      const workout = aiWorkouts[idx];
      const isCurrentlyCompleted = completedAIWorkouts[idx];
      
      // Update local state immediately for better UX
      setCompletedAIWorkouts(prev => ({
        ...prev,
        [idx]: !prev[idx]
      }));

      // If marking as completed, add to daily calories burned
      if (!isCurrentlyCompleted && workout.calories) {
        const userEmail = sessionStorage.getItem('userEmail');
        if (userEmail) {
          // Update calories in backend
          const currentBurned = todayStats.calories.burned;
          const newBurned = currentBurned + workout.calories;
          
          await axios.put(`http://localhost:8070/user/health/calories/${userEmail}`, {
            burned: newBurned
          });
          
          // Update local state
          setTodayStats(prev => ({
            ...prev,
            calories: {
              ...prev.calories,
              burned: newBurned
            }
          }));
          
          console.log(`Added ${workout.calories} calories from AI workout completion`);
        }
      }
      
    } catch (error) {
      console.error('Error updating AI workout completion:', error);
      // Revert the state change if there was an error
      setCompletedAIWorkouts(prev => ({
        ...prev,
        [idx]: !prev[idx]
      }));
    }
  };

  // Send chat message (AI or fallback)
  const sendMessage = async () => {
    if (!chatInput.trim()) return;
    const userMessage = chatInput.trim();
    setChatMessages(prev => [...prev, { type: 'user', message: userMessage }]);
    setChatInput('');
    setIsTyping(true);

    try {
      const ai = initializeGemini();
      if (!ai) {
        throw new Error('AI not available');
      }
      const response = await ai.models.generateContent({
        model: "gemini-2.5-flash",
        contents: userMessage,
        config: {
          thinkingConfig: {
            thinkingBudget: 0,
          },
        }
      });
      setChatMessages(prev => [
        ...prev,
        { type: 'ai', message: response.text || "Sorry, I couldn't generate a response." }
      ]);
    } catch (error) {
      setAiError('AI unavailable');
      setChatMessages(prev => [
        ...prev,
        { type: 'ai', message: "Sorry, I'm unable to respond with AI right now. Please try again later." }
      ]);
    } finally {
      setIsTyping(false);
    }
  };

  // Handle key press in chat input
  const handleKeyPress = (e) => {
    if (e.key === 'Enter') {
      e.preventDefault();
      if (!isTyping && chatInput.trim() !== '') {
        sendMessage();
      }
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

  // Fetch user data and health data on mount
  React.useEffect(() => {
    const fetchUserDataAndHealth = async () => {
      try {
        setLoading(true);
        setError(null);
        
        const userEmail = sessionStorage.getItem('userEmail');
        
        if (!userEmail) {
          setError('No user email found. Please log in again.');
          setLoading(false);
          return;
        }

        console.log('Fetching user data for:', userEmail);
        
        // Fetch user data using the correct endpoint
        const userRes = await axios.get(`http://localhost:8070/user/getByEmail/${userEmail}`);
        
        if (userRes.data.status === "success") {
          setUserData(userRes.data.user);
          console.log('User data loaded:', userRes.data.user);
        } else {
          throw new Error('Failed to fetch user data');
        }

        // Fetch health data
        await fetchTodayHealthData();
        
        // Fetch nutrition plan
        await fetchNutritionPlan(userEmail);
        
        // Fetch workout plan
        await fetchWorkoutPlan();
        
        console.log('All data loaded successfully');
        
      } catch (err) {
        console.error('Error loading data:', err);
        setError('Failed to load data. Please check your connection and try again.');
      } finally {
        setLoading(false);
      }
    };

    fetchUserDataAndHealth();
  }, [fetchTodayHealthData]);

  // Main render
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
              <FaTimes className={styles.errorIcon} />
              <h3>Error Loading Data</h3>
              <p>{error}</p>
              <button 
                onClick={() => window.location.reload()} 
                className={styles.retryButton}
              >
                Retry
              </button>
            </div>
          </div>
        </div>
      </>
    );
  }

  // if (error) {
  //   return (
  // Error handling UI removed because 'error' state is no longer used.
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
              
              {/* Today's Stats - Now from HealthData model */}
              <div className={styles.statsGrid}>
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
                    <FaFire />
                  </div>
                  <div className={styles.statInfo}>
                    <h3>{todayStats.calories.burned}</h3>
                    <p>Calories Burned</p>
                    <div className={styles.progress}>
                      <div className={styles.progressBar} style={{width: `${(todayStats.calories.burned / todayStats.calories.target) * 100}%`}}></div>
                    </div>
                    <small>Target: {todayStats.calories.target} cal</small>
                  </div>
                </div>

                <div className={styles.statCard}>
                  <div className={styles.statIcon}>
                    <FaRunning />
                  </div>
                  <div className={styles.statInfo}>
                    <h3>{todayStats.steps.current}</h3>
                    <p>Steps Today</p>
                    <div className={styles.progress}>
                      <div className={styles.progressBar} style={{width: `${(todayStats.steps.current / todayStats.steps.target) * 100}%`}}></div>
                    </div>
                    <small>Target: {todayStats.steps.target} steps</small>
                  </div>
                </div>

                <div className={styles.statCard}>
                  <div className={styles.statIcon}>
                    <FaDumbbell />
                  </div>
                  <div className={styles.statInfo}>
                    <h3>{todayStats.workout.totalMinutes}</h3>
                    <p>Workout Minutes</p>
                    <div className={styles.progress}>
                      <div className={styles.progressBar} style={{width: `${(todayStats.workout.totalMinutes / 60) * 100}%`}}></div>
                    </div>
                    <small>Target: 60 minutes</small>
                  </div>
                </div>
              </div>

              {/* Quick Input Section */}
              <div className={styles.quickInputSection}>
                <h2>Quick Updates</h2>
                
                {/* Steps Input */}
                <div className={styles.inputGroup}>
                  <label>Update Steps:</label>
                  <input
                    type="number"
                    placeholder="Enter steps"
                    value={stepsInput}
                    onChange={(e) => setStepsInput(e.target.value)}
                  />
                  <button onClick={updateSteps}>Update</button>
                </div>

                {/* Calories Input */}
                <div className={styles.inputGroup}>
                  <label>Update Calories:</label>
                  <input
                    type="number"
                    placeholder="Burned"
                    value={caloriesInput.burned}
                    onChange={(e) => setCaloriesInput({...caloriesInput, burned: e.target.value})}
                  />
                  <input
                    type="number"
                    placeholder="Consumed"
                    value={caloriesInput.consumed}
                    onChange={(e) => setCaloriesInput({...caloriesInput, consumed: e.target.value})}
                  />
                  <button onClick={updateCalories}>Update</button>
                </div>

                {/* Mood and Energy */}
                <div className={styles.inputGroup}>
                  <label>Mood & Energy:</label>
                  <select value={mood} onChange={(e) => setMood(e.target.value)}>
                    <option value="">Select mood</option>
                    <option value="excellent">Excellent</option>
                    <option value="good">Good</option>
                    <option value="okay">Okay</option>
                    <option value="bad">Bad</option>
                    <option value="terrible">Terrible</option>
                  </select>
                  <input
                    type="range"
                    min="1"
                    max="10"
                    value={energy}
                    onChange={(e) => setEnergy(parseInt(e.target.value))}
                  />
                  <span>Energy: {energy}/10</span>
                  <button onClick={updateMoodAndEnergy}>Save</button>
                </div>
              </div>

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

              {/* BMI Checker Section */}
              <div className={styles.bmiSection}>
                <h2>BMI Checker</h2>
                <input
                  type="number"
                  placeholder="Height (cm)"
                  value={bmiInput.height}
                  onChange={e => setBmiInput({ ...bmiInput, height: e.target.value })}
                />
                <input
                  type="number"
                  placeholder="Weight (kg)"
                  value={bmiInput.weight}
                  onChange={e => setBmiInput({ ...bmiInput, weight: e.target.value })}
                />
                <button onClick={calculateBMI}>Calculate BMI</button>
                {bmi && <div>Your BMI: {bmi}</div>}
              </div>
            </>
          )}

          {/* Workouts Tab */}
          {activeTab === 'workouts' && (
            <>
              <h1 className={styles.pageTitle}>Full Body Workout Plan</h1>
              <p className={styles.subtitle}>7-day personalized workout plan - No equipment needed!</p>
              
              {/* Generate Plan Button */}
              {!workoutPlan && (
                <div className={styles.generatePlanSection}>
                  <button 
                    className={styles.generatePlanButton}
                    onClick={() => setShowGoalModal(true)}
                    disabled={planLoading}
                  >
                    <FaDumbbell /> Generate 7-Day Workout Plan
                  </button>
                  {planLoading && <span>Generating plan...</span>}
                </div>
              )}

              {/* Workout Plan Display */}
              {workoutPlan && (
                <div className={styles.workoutPlanSection}>
                  <div className={styles.planHeader}>
                    <h2>Your 7-Day {workoutPlan.goal.replace('_', ' ').toUpperCase()} Plan</h2>
                    <div className={styles.planStats}>
                      <span>Day {workoutPlan.currentDay} of 7</span>
                      <span>Total Calories: {workoutPlan.totalCalories}</span>
                      <span>Completed Days: {workoutPlan.days.filter(d => d.completed).length}</span>
                    </div>
                  </div>

                  <div className={styles.planDays}>
                    {workoutPlan.days.map((day, dayIndex) => (
                      <div key={day.day} className={`${styles.planDay} ${day.completed ? styles.completed : ''}`}>
                        <div className={styles.dayHeader}>
                          <h3>Day {day.day}</h3>
                          <span className={styles.dayCalories}>{day.totalCalories} cal</span>
                          {day.completed && <span className={styles.completedBadge}>✓ Completed</span>}
                        </div>

                        <div className={styles.dayExercises}>
                          {day.exercises.map((exercise, exerciseIndex) => (
                            <div key={exerciseIndex} className={`${styles.exerciseItem} ${exercise.completed ? styles.completed : ''}`}>
                              <div className={styles.exerciseInfo}>
                                <h4>{exercise.name}</h4>
                                <p>{exercise.sets} sets × {exercise.reps} reps</p>
                                <span className={styles.exerciseCalories}>{exercise.calories} cal</span>
                              </div>
                              
                              <button
                                onClick={() => markExerciseComplete(day.day, exerciseIndex, !exercise.completed)}
                                className={styles.completeExerciseButton}
                                style={{
                                  background: exercise.completed ? '#4caf50' : '#eee',
                                  color: exercise.completed ? '#fff' : '#333'
                                }}
                              >
                                {exercise.completed ? '✓ Done' : 'Mark Complete'}
                              </button>
                            </div>
                          ))}
                        </div>
                      </div>
                    ))}
                  </div>
                </div>
              )}
              
              {/* Add workout button */}
              <div className={styles.addWorkoutContainer}>
                <button 
                  className={styles.addWorkoutButton}
                  onClick={() => {
                    const newWorkout = {
                      name: "Quick Exercise",
                      duration: 15,
                      calories: 120
                    };
                    addWorkoutSession(newWorkout);
                  }}
                >
                  <FaDumbbell /> Add Quick Workout
                </button>
                <button 
                  className={styles.addWorkoutButton}
                  onClick={generateAIWorkouts}
                  disabled={aiWorkoutLoading}
                >
                  <FaRobot /> Generate AI Exercise Plan
                </button>
                {aiWorkoutLoading && <span>Generating...</span>}
                {aiWorkoutError && <span style={{color: 'red'}}>{aiWorkoutError}</span>}
              </div>
              
              <div className={styles.workouts}>
                {recentWorkouts.map((workout) => (
                  <div key={workout.id} className={`${styles.workoutCard} ${workout.completed ? styles.completed : ''}`}>
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
                    <button
                      onClick={() => toggleWorkoutComplete(workout.id, !workout.completed)}
                      className={styles.completeButton}
                      style={{
                        background: workout.completed ? '#4caf50' : '#eee',
                        color: workout.completed ? '#fff' : '#333',
                        marginTop: '10px',
                        border: 'none',
                        borderRadius: '5px',
                        padding: '5px 10px',
                        cursor: 'pointer'
                      }}
                    >
                      {workout.completed ? 'Completed ✓' : 'Mark as Complete'}
                    </button>
                  </div>
                ))}
                
                {/* AI Workouts */}
                {aiWorkouts.length > 0 && (
                  <div className={styles.workouts}>
                    <h2>AI-Generated Workout Plan</h2>
                    <p className={styles.subtitle}>Personalized workouts created by AI for your fitness level</p>
                    
                    {aiWorkouts.map((workout, idx) => (
                      <div
                        key={idx}
                        className={`${styles.workoutCard} ${completedAIWorkouts[idx] ? styles.completed : ''}`}
                        style={{
                          opacity: completedAIWorkouts[idx] ? 0.6 : 1,
                          textDecoration: completedAIWorkouts[idx] ? 'line-through' : 'none'
                        }}
                      >
                        <div className={styles.workoutHeader}>
                          <div className={styles.workoutIcon}><FaRobot /></div>
                          <div className={styles.workoutInfo}>
                            <h3>{workout.workoutName || workout.name}</h3>
                            <p>{workout.day}</p>
                            {workout.exercises && (
                              <div className={styles.exerciseList}>
                                <small>Exercises: {workout.exercises.map(ex => ex.name).join(', ')}</small>
                              </div>
                            )}
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
                        
                        <div className={styles.workoutDesc}>
                          {workout.description}
                        </div>
                        
                        {workout.exercises && (
                          <div className={styles.exerciseDetails}>
                            <h4>Today's Exercises:</h4>
                            <div className={styles.exerciseGrid}>
                              {workout.exercises.map((exercise, exIdx) => (
                                <div key={exIdx} className={styles.miniExercise}>
                                  <strong>{exercise.name}</strong>
                                  <span>{exercise.sets}×{exercise.reps}</span>
                                  <small>{exercise.calories} cal</small>
                                </div>
                              ))}
                            </div>
                          </div>
                        )}
                        
                        <button
                          onClick={() => toggleAIWorkoutComplete(idx)}
                          className={styles.completeButton}
                          style={{
                            background: completedAIWorkouts[idx] ? '#4caf50' : '#eee',
                            color: completedAIWorkouts[idx] ? '#fff' : '#333',
                            marginTop: '10px',
                            border: 'none',
                            borderRadius: '5px',
                            padding: '8px 16px',
                            cursor: 'pointer',
                            fontWeight: '600',
                            transition: 'all 0.3s ease'
                          }}
                        >
                          {completedAIWorkouts[idx] ? '✓ Completed' : 'Mark as Complete'}
                        </button>
                      </div>
                    ))}
                  </div>
                )}
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
                  <div key={meal.id} className={styles.mealCard}>
                    <div className={styles.mealInfo}>
                      <h3>{meal.meal}</h3>
                      <p>{meal.time}</p>
                      <ul>
                        {meal.items && meal.items.map((item, idx) => (
                          <li key={idx}>{item}</li>
                        ))}
                      </ul>
                    </div>
                    <div className={styles.mealCalories}>
                      <span>{meal.calories} cal</span>
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

      {/* Goal Selection Modal */}
      {showGoalModal && (
        <div className={styles.modalOverlay}>
          <div className={styles.goalModal}>
            <h2>What's your fitness goal?</h2>
            <p>Choose your primary goal to generate a personalized 7-day workout plan:</p>
            
            <div className={styles.goalOptions}>
              <button 
                className={`${styles.goalOption} ${selectedGoal === 'weight_loss' ? styles.selected : ''}`}
                onClick={() => setSelectedGoal('weight_loss')}
              >
                <FaFire />
                <h3>Weight Loss</h3>
                <p>Burn calories and lose weight with cardio-focused exercises</p>
              </button>
              
              <button 
                className={`${styles.goalOption} ${selectedGoal === 'muscle_building' ? styles.selected : ''}`}
                onClick={() => setSelectedGoal('muscle_building')}
              >
                <FaDumbbell />
                <h3>Muscle Building</h3>
                <p>Build strength and muscle with resistance exercises</p>
              </button>
              
              <button 
                className={`${styles.goalOption} ${selectedGoal === 'toning' ? styles.selected : ''}`}
                onClick={() => setSelectedGoal('toning')}
              >
                <FaBullseye />
                <h3>Toning</h3>
                <p>Tone and sculpt your body with balanced exercises</p>
              </button>
              
              <button 
                className={`${styles.goalOption} ${selectedGoal === 'general_fitness' ? styles.selected : ''}`}
                onClick={() => setSelectedGoal('general_fitness')}
              >
                <FaHeartbeat />
                <h3>General Fitness</h3>
                <p>Improve overall fitness and health</p>
              </button>
            </div>
            
            <div className={styles.modalActions}>
              <button 
                className={styles.cancelButton}
                onClick={() => {
                  setShowGoalModal(false);
                  setSelectedGoal('');
                }}
              >
                Cancel
              </button>
              <button 
                className={styles.generateButton}
                onClick={() => generateWorkoutPlan(selectedGoal)}
                disabled={!selectedGoal || planLoading}
              >
                {planLoading ? 'Generating...' : 'Generate Plan'}
              </button>
            </div>
          </div>
        </div>
      )}
    </>
  );
};

export default Health;