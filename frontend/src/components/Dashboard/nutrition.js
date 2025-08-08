import React, { useState, useEffect, useCallback } from 'react';
import styles from './Nutrition.module.css';
import { GoogleGenAI } from "@google/genai";
import axios from 'axios';

const PLACEHOLDER_IMAGE = '/images/placeholder-meal.jpg';

// Update to accept userData prop from Health component
const Nutrition = ({ userData }) => {
    const [query, setQuery] = useState('');
    const [recipes, setRecipes] = useState([]);
    const [mealPlan, setMealPlan] = useState(null);
    const [loading, setLoading] = useState(false);
    const [error, setError] = useState(null);
    const [progress, setProgress] = useState(0);
    const [healthConditions, setHealthConditions] = useState({
        diabetic: false,
        highCholesterol: false,
        lowSugar: false,
        hypertension: false,
        glutenFree: false
    });
    // Add this state for email preference
    const [sendEmailAutomatically, setSendEmailAutomatically] = useState(true);
    const athleteOptions = {
        isAthlete: false
    };

    // Initialize Gemini AI
    const initializeGemini = useCallback(() => {
        try {
            console.log('Initializing Gemini AI...');
            
            const apiKey = process.env.REACT_APP_GEMINI_API_KEY || 'AIzaSyDqAX9agitzTXAhWvVVNKB-zYTU5kKiQXg';
            const ai = new GoogleGenAI({ apiKey });
            
            console.log('Gemini AI initialized successfully');
            return ai;
        } catch (error) {
            console.error('Error initializing Gemini:', error);
            setError(`Failed to initialize AI: ${error.message}`);
            return null;
        }
    }, []);

    // Add this before the generateMeal function to ensure variety
    const ensureMealVariety = (mealType, existingMeals = []) => {
        // Force the AI to generate different meals by adding variety constraints
        const existingMealNames = existingMeals
            .filter(meal => meal.type === mealType.toLowerCase())
            .map(meal => meal.recipe.label);
        
        let varietyPrompt = '';
        if (existingMealNames.length > 0) {
            varietyPrompt = `\nIMPORTANT: Do NOT generate any of these meals that were already suggested: ${existingMealNames.join(', ')}. Create something completely different.`;
        }
        
        return varietyPrompt;
    };

    // Generate a single meal - Updated to fix variety issues
    const generateMeal = useCallback(async (mealType, cuisine = 'Sri Lankan', existingMeals = []) => {
        // Add variety constraint
        const varietyPrompt = ensureMealVariety(mealType, existingMeals);
        
        try {
            const ai = initializeGemini();
            if (!ai) throw new Error('Gemini AI not available');

            // Create restrictions string
            const restrictions = Object.entries(healthConditions)
                .filter(([_, isChecked]) => isChecked)
                .map(([condition]) => {
                    switch(condition) {
                        case 'diabetic': return 'low glycemic index, no sugar';
                        case 'highCholesterol': return 'low cholesterol, low fat';
                        case 'lowSugar': return 'no added sugar, low carbs';
                        case 'hypertension': return 'low sodium';
                        case 'glutenFree': return 'gluten free';
                        default: return '';
                    }
                })
                .filter(Boolean)
                .join(', ');

            // Modify the prompt to force creativity and variety
            const prompt = `Generate a unique, authentic, and specific Sri Lankan ${mealType} meal${restrictions ? ` suitable for people with ${restrictions}` : ''}. 
DO NOT return generic meals. Give me a specific Sri Lankan dish with a detailed name.
Return ONLY a JSON object with this exact structure:
{
    "label": "specific Sri Lankan dish name",
    "calories": number,
    "protein": number,
    "fat": number,
    "carbs": number,
    "fiber": number,
    "isCompliant": true,
    "healthNotes": ["note about why this meal is suitable for the specified conditions"]
}${varietyPrompt}

IMPORTANT: Each meal MUST have a unique specific Sri Lankan name, NOT generic terms like "Sri Lankan Breakfast".`;

            // Use a different model to improve results
            const response = await ai.models.generateContent({
                model: "gemini-pro",  // Changed from gemini-2.5-flash to gemini-pro for better results
                contents: prompt,
                generationConfig: {
                    temperature: 0.9,  // Increase temperature for more creative results
                    topK: 40,
                    topP: 0.95,
                    maxOutputTokens: 1024,
                }
            });

            const text = response.text || response.response?.text;
            
            if (!text) {
                throw new Error('No response from AI');
            }

            // Parse JSON from response
            let mealData;
            try {
                const jsonMatch = text.match(/\{[\s\S]*\}/);
                mealData = jsonMatch ? JSON.parse(jsonMatch[0]) : null;
            } catch (parseError) {
                console.error('Failed to parse AI response:', parseError, text);
                throw new Error('Failed to parse Gemini response');
            }

            if (!mealData || !mealData.label) {
                throw new Error('Invalid meal data received');
            }

            // Verify meal name is specific and not generic
            if (mealData.label.includes('Sri Lankan') || 
                mealData.label === 'Breakfast' || 
                mealData.label === 'Lunch' || 
                mealData.label === 'Dinner') {
                throw new Error('Generated meal name is too generic');
            }

            // Cache the generated meal
            const mealDataFormatted = {
                type: mealType.toLowerCase(),
                recipe: {
                    label: mealData.label,
                    calories: mealData.calories || 0,
                    totalNutrients: {
                        PROCNT: { quantity: mealData.protein || 0 },
                        FAT: { quantity: mealData.fat || 0 },
                        CHOCDF: { quantity: mealData.carbs || 0 },
                        FIBTG: { quantity: mealData.fiber || 0 }
                    },
                    ingredients: mealData.ingredients || [],
                    instructions: mealData.instructions || '',
                    healthNotes: mealData.healthNotes || [],
                    isCompliant: mealData.isCompliant !== undefined ? mealData.isCompliant : true,
                    image: `/images/sri-lankan/${mealData.label.toLowerCase().replace(/\s+/g, '-')}.jpg`
                }
            };
            
            return mealDataFormatted;
        } catch (error) {
            console.error(`Error generating ${mealType}:`, error);
            
            // Create a more interesting fallback meal based on mealType
            const fallbackMeals = {
                breakfast: [
                    { name: "Kiribath with Lunu Miris", calories: 320, protein: 8, fat: 12, carbs: 45 },
                    { name: "Appam with Coconut Milk", calories: 280, protein: 5, fat: 9, carbs: 42 },
                    { name: "Pol Roti with Seeni Sambol", calories: 340, protein: 7, fat: 14, carbs: 48 }
                ],
                lunch: [
                    { name: "Rice and Ambul Thiyal", calories: 450, protein: 22, fat: 15, carbs: 60 },
                    { name: "Lamprais", calories: 520, protein: 25, fat: 18, carbs: 65 },
                    { name: "Parippu and Red Rice", calories: 380, protein: 16, fat: 8, carbs: 62 }
                ],
                dinner: [
                    { name: "Kottu Roti", calories: 420, protein: 18, fat: 16, carbs: 55 },
                    { name: "Polos Curry with Rice", calories: 380, protein: 10, fat: 12, carbs: 58 },
                    { name: "Isso Wade", calories: 350, protein: 20, fat: 15, carbs: 30 }
                ]
            };
            
            // Select a random fallback meal based on meal type
            const fallbackType = mealType.toLowerCase();
            const fallbackOptions = fallbackMeals[fallbackType] || fallbackMeals.breakfast;
            const fallbackMeal = fallbackOptions[Math.floor(Math.random() * fallbackOptions.length)];
            
            return {
                type: mealType.toLowerCase(),
                recipe: {
                    label: fallbackMeal.name,
                    calories: fallbackMeal.calories,
                    totalNutrients: {
                        PROCNT: { quantity: fallbackMeal.protein },
                        FAT: { quantity: fallbackMeal.fat },
                        CHOCDF: { quantity: fallbackMeal.carbs },
                        FIBTG: { quantity: 5 }
                    },
                    ingredients: ['Rice', 'Spices', 'Vegetables'],
                    instructions: 'Traditional Sri Lankan preparation',
                    healthNotes: ['Traditional Sri Lankan dish with balanced nutrients'],
                    isCompliant: true,
                    image: `/images/sri-lankan/${fallbackMeal.name.toLowerCase().replace(/\s+/g, '-')}.jpg`
                }
            };
        }
    }, [initializeGemini, healthConditions]);

    // Generate weekly meal plan using Gemini
    const generateWeeklyMealPlan = useCallback(async () => {
        setLoading(true);
        setError(null);
        setProgress(0);
        
        try {
            const mealTypes = ['Breakfast', 'Lunch', 'Dinner'];
            const weeklyPlan = [];

            console.log('Starting meal plan generation with Gemini...');

            // Track all generated meals to ensure variety
            const allGeneratedMeals = [];

            // Generate meals for the week in parallel
            for (let day = 0; day < 7; day++) {
                const dayMeals = {};
                setProgress((day / 7) * 100);

                // Generate all meals for the day in parallel
                const mealPromises = mealTypes.map(async mealType => {
                    try {
                        // Pass existing meals to ensure variety
                        const meal = await generateMeal(mealType, 'Sri Lankan', allGeneratedMeals);
                        
                        // Add to the collection of generated meals
                        allGeneratedMeals.push({ type: mealType.toLowerCase(), recipe: meal.recipe });
                        
                        return { type: mealType.toLowerCase(), meal };
                    } catch (error) {
                        console.error(`Failed to generate ${mealType}:`, error);
                        return {
                            type: mealType.toLowerCase(),
                            meal: {
                                type: mealType.toLowerCase(),
                                recipe: {
                                    label: `Sri Lankan ${mealType}`,
                                    calories: 300,
                                    totalNutrients: {
                                        PROCNT: { quantity: 15 },
                                        FAT: { quantity: 10 },
                                        CHOCDF: { quantity: 45 },
                                        FIBTG: { quantity: 5 }
                                    },
                                    ingredients: ['Rice', 'Curry', 'Vegetables'],
                                    instructions: 'Traditional Sri Lankan preparation',
                                    image: '/images/placeholder-meal.jpg'
                                }
                            }
                        };
                    }
                });

                // Wait for all meals of the day to be generated
                const meals = await Promise.all(mealPromises);
                meals.forEach(({ type, meal }) => {
                    dayMeals[type] = meal;
                });

                weeklyPlan.push({ day, meals: dayMeals });
                
                // Small delay between days to avoid rate limits
                if (day < 6) await new Promise(resolve => setTimeout(resolve, 500));
            }

            setProgress(100);
            setMealPlan(weeklyPlan);
            console.log('Meal plan generated successfully:', weeklyPlan);

            // Automatically send email if the user has chosen this option
            if (sendEmailAutomatically && userData?.email) {
                try {
                    await sendMealPlanEmail(weeklyPlan, userData);
                } catch (emailError) {
                    console.error('Error sending email:', emailError);
                    // Don't show error to user since the meal plan was generated successfully
                    // Just log it for debugging
                }
            } else if (userData?.email) {
                // Ask the user if they want to send an email
                const confirmSend = window.confirm("Would you like to receive this meal plan via email?");
                if (confirmSend) {
                    try {
                        await sendMealPlanEmail(weeklyPlan, userData);
                    } catch (emailError) {
                        console.error('Error sending email:', emailError);
                        alert("There was an error sending the email. Please try again.");
                    }
                }
            }

        } catch (error) {
            console.error('Error generating meal plan:', error);
            setError('Error generating meal plan. Please try again.');
        } finally {
            setLoading(false);
            setProgress(0);
        }
    }, [generateMeal, userData, sendEmailAutomatically]);

    // Search recipes using Gemini
    const searchRecipes = async (e) => {
        e.preventDefault();
        if (!query.trim()) return;

        setLoading(true);
        setError(null);

        try {
            const genAI = initializeGemini();
            if (!genAI) throw new Error('Gemini AI not available');

            const model = genAI.getGenerativeModel({ model: "gemini-pro" });

            const prompt = `Find 5 Sri Lankan recipes related to "${query}". Return ONLY a JSON array with this structure:
[
    {
        "label": "dish name",
        "calories": number,
        "protein": number,
        "fat": number,
        "carbs": number
    }
]

Make sure all recipes are authentic Sri Lankan cuisine.`;

            const result = await model.generateContent(prompt);
            const response = await result.response;
            const text = response.text();

            // Parse JSON from response
            let recipesData;
            try {
                const jsonMatch = text.match(/\[[\s\S]*\]/);
                recipesData = jsonMatch ? JSON.parse(jsonMatch[0]) : [];
                
                if (!recipesData || !Array.isArray(recipesData) || recipesData.length === 0) {
                    throw new Error('No recipes found');
                }
            } catch (parseError) {
                console.error('Failed to parse recipes response:', parseError);
                throw new Error('Failed to parse recipes response');
            }

            const formattedRecipes = recipesData.map(recipe => ({
                recipe: {
                    label: recipe.label,
                    calories: recipe.calories || 0,
                    totalNutrients: {
                        PROCNT: { quantity: recipe.protein || 0 },
                        FAT: { quantity: recipe.fat || 0 },
                        CHOCDF: { quantity: recipe.carbs || 0 },
                        FIBTG: { quantity: recipe.fiber || 0 }
                    },
                    ingredients: recipe.ingredients || [],
                    instructions: recipe.instructions || '',
                    yield: 1,
                    image: `/images/sri-lankan/${recipe.label.toLowerCase().replace(/\s+/g, '-')}.jpg`
                }
            }));

            setRecipes(formattedRecipes);

        } catch (error) {
            console.error('Error searching recipes:', error);
            if (error.message.includes('quota') || error.message.includes('429')) {
                setError('API rate limit exceeded. Please wait a moment and try again.');
            } else if (error.message.includes('No recipes found')) {
                setError(`No recipes found for "${query}". Please try a different search term.`);
            } else {
                setError('Error searching recipes. Please try again.');
            }
        } finally {
            setLoading(false);
        }
    };

    // Update the sendMealPlanEmail function to match health.js implementation
    const sendMealPlanEmail = async (mealPlanData, user) => {
        if (!mealPlanData || !user?.email) {
            console.error('Missing meal plan data or user email');
            return;
        }
        
        try {      
            const userEmail = user.email;
            console.log('Sending meal plan to email:', userEmail);
            
            // Make sure we're using the exact endpoint from health.js
            const response = await axios.post('http://localhost:8070/notify/ai-meal-plan', {
                email: userEmail,
                name: user.name || 'Valued Member',
                mealPlan: mealPlanData
            });
            
            console.log('Email API response:', response);
            
            if (response.status === 200) {
                // Show success toast/notification
                console.log(`Meal plan sent to: ${userEmail}`);
                alert(`Your meal plan has been sent to: ${userEmail}`);
            } else {
                console.error('Failed to send meal plan to email:', response);
            }
        } catch (error) {
            console.error('Error sending meal plan:', error);
            console.error('Error details:', error.message);
        }
    };

    // Update the DietaryRestrictions component
    const DietaryRestrictions = () => (
        <div className={styles.dietaryRestrictions}>
            <h4>🏥 Dietary Restrictions & Health Conditions</h4>
            <div className={styles.restrictionsGrid}>
                {Object.entries(healthConditions).map(([condition, isChecked]) => (
                    <label 
                        key={condition} 
                        className={styles.restrictionLabel}
                        style={{
                            backgroundColor: isChecked ? '#e8f5e9' : '#f8f9fa',
                            borderColor: isChecked ? '#4caf50' : 'transparent',
                            color: isChecked ? '#2e7d32' : '#34495e'
                        }}
                    >
                        <input
                            type="checkbox"
                            checked={isChecked}
                            onChange={() => setHealthConditions(prev => ({
                                ...prev,
                                [condition]: !prev[condition]
                            }))}
                        />
                        {condition.charAt(0).toUpperCase() + condition.slice(1).replace(/([A-Z])/g, ' $1')}
                    </label>
                ))}
            </div>
            
            {/* Add email preference option */}
            <div className={styles.emailPreference}>
                <label 
                    className={styles.emailPreferenceLabel}
                    style={{
                        display: "flex",
                        alignItems: "center",
                        marginTop: "10px",
                        fontSize: "14px",
                        cursor: "pointer"
                    }}
                >
                    <input
                        type="checkbox"
                        checked={sendEmailAutomatically}
                        onChange={() => setSendEmailAutomatically(prev => !prev)}
                        style={{ marginRight: "8px" }}
                    />
                    Automatically send meal plan to my email
                </label>
            </div>
        </div>
    );

    // Remove the automatic generation when component mounts
    useEffect(() => {
        // If user data is available, use it to set health conditions
        if (userData && userData.healthConditions) {
            // Map user health data to our health conditions if available
            const userHealthConditions = userData.healthConditions;
            setHealthConditions(prev => ({
                ...prev,
                diabetic: userHealthConditions.diabetes || false,
                highCholesterol: userHealthConditions.cholesterol || false,
                hypertension: userHealthConditions.hypertension || false,
                // Add other mappings as needed
            }));
        }
        
        // Remove the automatic call to generateWeeklyMealPlan here
        // This way it only generates when the user clicks the button
    }, [userData]);

    return (
        <div className={styles.container}>
            <h2 className={styles.title}>AI-Powered Sri Lankan Nutrition Planner</h2>
            
            {error && (
              <div className={styles.error}>
                <span>{error}</span>
                <button 
                  onClick={() => setError(null)} 
                  style={{marginLeft: '10px', background: 'none', border: 'none', cursor: 'pointer'}}
                >
                  ✕
                </button>
              </div>
            )}
            
            <DietaryRestrictions />
            
            <div className={styles.buttonContainer}>
                <button 
                    onClick={generateWeeklyMealPlan} 
                    className={styles.generateButton}
                    disabled={loading}
                    aria-label="Generate new meal plan"
                >
                    {loading ? 'Generating with AI...' : 'Generate New Meal Plan'}
                </button>
                
                {/* Email button removed - now automatically sends email after generation */}
            </div>

            {loading && (
                <div className={styles.loading}>
                    <div>🤖 AI is creating your personalized Sri Lankan meal plan...</div>
                    <div className={styles.progressBar}>
                        <div className={styles.progressFill} style={{ width: `${progress}%` }} />
                    </div>
                    <div>{Math.round(progress)}% complete</div>
                </div>
            )}

            {mealPlan && (
                <div className={styles.mealPlanContainer}>
                    <h3>🍽️ Your AI-Generated 7-Day Sri Lankan Meal Plan</h3>
                    <DietaryRestrictions />
                    {mealPlan.map((day) => (
                        <div key={day.day} className={styles.dayCard}>
                            <h4>Day {day.day + 1}</h4>
                            <div className={styles.mealsGrid}>
                                {Object.entries(day.meals).map(([mealType, meal]) => (
                                    <div key={mealType} className={styles.meal}>
                                        <h5>{mealType.charAt(0).toUpperCase() + mealType.slice(1)}</h5>
                                        
                                        {/* Replace the existing img with this improved version */}
                                        <div className={styles.imageContainer}>
                                            <img 
                                                src={PLACEHOLDER_IMAGE}
                                                alt="Loading"
                                                className={styles.placeholderImage}
                                            />
                                            <img 
                                                src={meal.recipe.image} 
                                                alt={meal.recipe.label}
                                                className={styles.mealImage}
                                                onError={(e) => {
                                                    e.target.style.display = 'none';
                                                    e.target.previousSibling.style.opacity = '1';
                                                }}
                                                onLoad={(e) => {
                                                    e.target.style.opacity = '1';
                                                    e.target.previousSibling.style.opacity = '0';
                                                }}
                                                loading="lazy"
                                            />
                                        </div>
                                        
                                        <p className={styles.mealTitle}>{meal.recipe.label}</p>
                                        <div className={styles.nutritionInfo}>
                                            <p>Calories: <span>{Math.round(meal.recipe.calories)}</span></p>
                                            <p>Protein: <span>{Math.round(meal.recipe.totalNutrients.PROCNT.quantity)}g</span></p>
                                            <p>Fat: <span>{Math.round(meal.recipe.totalNutrients.FAT.quantity)}g</span></p>
                                            <p>Carbs: <span>{Math.round(meal.recipe.totalNutrients.CHOCDF.quantity)}g</span></p>
                                        </div>
                                        {meal.recipe.healthNotes && meal.recipe.healthNotes.length > 0 && (
                                            <div className={styles.healthNotes}>
                                              <strong>Health Notes:</strong>
                                              <ul>
                                                {meal.recipe.healthNotes.map((note, idx) => <li key={idx}>{note}</li>)}
                                              </ul>
                                            </div>
                                        )}
                                        {Object.keys(healthConditions).some(condition => healthConditions[condition]) && (
                                            <div className={`${styles.complianceBadge} ${meal.recipe.isCompliant ? '' : styles.warning}`}>
                                                {meal.recipe.isCompliant ? '✓ Safe to eat' : '⚠️ Check with doctor'}
                                            </div>
                                        )}

                                        {/* Add athlete notes and badge if applicable */}
                                        {meal.recipe.athleteNotes && meal.recipe.athleteNotes.length > 0 && athleteOptions.isAthlete && (
                                            <div className={styles.athleteNotes}>
                                                <strong>🏋️‍♂️ Athlete Notes:</strong>
                                                <ul>
                                                    {meal.recipe.athleteNotes.map((note, idx) => <li key={idx}>{note}</li>)}
                                                </ul>
                                            </div>
                                        )}

                                        {meal.recipe.isAthleteOptimized && (
                                            <div className={styles.athleteBadge}>
                                                🏆 Athlete Optimized
                                            </div>
                                        )}
                                    </div>
                                ))}
                            </div>
                        </div>
                    ))}
                </div>
            )}

            <div className={styles.searchContainer}>
                <form onSubmit={searchRecipes} className={styles.searchForm}>
                    <input
                        type="text"
                        value={query}
                        onChange={(e) => setQuery(e.target.value)}
                        placeholder="Search for Sri Lankan recipes using AI..."
                        className={styles.searchInput}
                    />
                    <button type="submit" className={styles.searchButton} disabled={loading}>
                        🔍 AI Search
                    </button>
                </form>
            </div>

            <div className={styles.recipesGrid}>
                {recipes.map((hit, index) => (
                    <div key={index} className={styles.recipeCard}>
                        <div className={styles.imageContainer}>
                            <img 
                                src={PLACEHOLDER_IMAGE}
                                alt="Loading"
                                className={styles.placeholderImage}
                            />
                            <img 
                                src={hit.recipe.image} 
                                alt={hit.recipe.label}
                                className={styles.recipeImage}
                                onError={(e) => {
                                    e.target.style.display = 'none';
                                    e.target.previousSibling.style.opacity = '1';
                                }}
                                onLoad={(e) => {
                                    e.target.style.opacity = '1';
                                    e.target.previousSibling.style.opacity = '0';
                                }}
                                loading="lazy"
                            />
                        </div>
                        <h3 className={styles.recipeTitle}>{hit.recipe.label}</h3>
                        <div className={styles.recipeInfo}>
                            <p>Calories: {Math.round(hit.recipe.calories)}</p>
                            <p>Protein: {Math.round(hit.recipe.totalNutrients.PROCNT.quantity)}g</p>
                        </div>
                        {hit.recipe.ingredients && (
                            <div style={{ padding: '10px 0' }}>
                                <strong>Ingredients:</strong>
                                <p style={{ fontSize: '12px' }}>{hit.recipe.ingredients.slice(0, 3).join(', ')}...</p>
                            </div>
                        )}
                    </div>
                ))}
            </div>

            {recipes.length === 0 && !loading && (
                <div className={styles.noResults}>
                    🤖 Use AI to search for Sri Lankan recipes!
                </div>
            )}
        </div>
    );
};

export default Nutrition;