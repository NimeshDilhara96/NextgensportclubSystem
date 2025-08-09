import React, { useState } from "react";
import { Link, useNavigate } from "react-router-dom";
import axios from "axios";
import styles from "./AddUser.module.css";
import logo from '../../assets/logo.png';

function AddUser() {
  const navigate = useNavigate();

  const [name, setName] = useState("");
  const [dob, setDob] = useState("");
  const [age, setAge] = useState("");
  const [gender, setGender] = useState("Male");
  const [email, setEmail] = useState("");
  const [contact, setContact] = useState("");
  const [password, setPassword] = useState("");
  const [termsAgreed, setTermsAgreed] = useState(false);
  const [role, setRole] = useState("member");

  const [errors, setErrors] = useState({
    name: "",
    email: "",
    contact: "",
    password: "",
    dob: "",
    terms: ""
  });

  const [isCheckingEmail, setIsCheckingEmail] = useState(false);
  const [otpStep, setOtpStep] = useState(false); // true if waiting for OTP
  const [otp, setOtp] = useState("");
  const [otpSessionId, setOtpSessionId] = useState(null);
  const [otpError, setOtpError] = useState("");
  const [otpSuccess, setOtpSuccess] = useState("");
  const [isVerifyingOtp, setIsVerifyingOtp] = useState(false);
  const [otpTimer, setOtpTimer] = useState(0);
  const [isRegistering, setIsRegistering] = useState(false);

  const calculateAge = (birthDate) => {
    const today = new Date();
    const birth = new Date(birthDate);
    let age = today.getFullYear() - birth.getFullYear();
    const monthDiff = today.getMonth() - birth.getMonth();
    
    if (monthDiff < 0 || (monthDiff === 0 && today.getDate() < birth.getDate())) {
      age--;
    }
    
    return age;
  };

  const checkEmailExists = async (email) => {
    try {
      setIsCheckingEmail(true);
      const response = await axios.post("http://localhost:8070/auth/check-email", { email });
      return response.data.exists;
    } catch (error) {
      console.error("Error checking email:", error);
      return false;
    } finally {
      setIsCheckingEmail(false);
    }
  };

  const debounceEmailCheck = async (email) => {
    if (!email || !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) return;
    
    const exists = await checkEmailExists(email);
    if (exists) {
      setErrors(prev => ({
        ...prev,
        email: "This email is already registered. Please use a different email."
      }));
    }
  };

  const handleEmailChange = (e) => {
    const newEmail = e.target.value;
    setEmail(newEmail);
    
    setErrors(prev => ({
      ...prev,
      email: ""
    }));

    const timeoutId = setTimeout(() => {
      debounceEmailCheck(newEmail);
    }, 500);

    return () => clearTimeout(timeoutId);
  };

  const validateForm = () => {
    const newErrors = {};

    // Name validation
    if (!name.trim()) {
      newErrors.name = "Name is required.";
    } else if (name.length < 2) {
      newErrors.name = "Name must be at least 2 characters long.";
    } else if (!/^[a-zA-Z\s]*$/.test(name)) {
      newErrors.name = "Name can only contain letters and spaces.";
    }

    // Date of Birth validation
    if (!dob) {
      newErrors.dob = "Date of Birth is required.";
    } else {
      const userAge = calculateAge(dob);
      if (userAge < 13) {
        newErrors.dob = "You must be at least 13 years old to register.";
      } else if (userAge > 120) {
        newErrors.dob = "Please enter a valid date of birth.";
      }
    }

    // Email validation
    if (!email) {
      newErrors.email = "Email is required.";
    } else if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) {
      newErrors.email = "Please enter a valid email address.";
    }

    // Contact validation
    if (!contact) {
      newErrors.contact = "Contact number is required.";
    } else if (!/^\d{10}$/.test(contact)) {
      newErrors.contact = "Please enter a valid 10-digit contact number.";
    }

    // Password validation
    if (!password) {
      newErrors.password = "Password is required.";
    } else if (password.length < 8) {
      newErrors.password = "Password must be at least 8 characters long.";
    } else if (!/(?=.*[a-z])(?=.*[A-Z])(?=.*\d)/.test(password)) {
      newErrors.password = "Password must contain at least one uppercase letter, one lowercase letter, and one number.";
    }

    // Terms agreement validation
    if (!termsAgreed) {
      newErrors.terms = "Please agree to the terms and conditions.";
    }

    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  // Send OTP to email for verification
  const handleSendOtp = async (e) => {
    e.preventDefault();
    setOtpError("");
    setOtpSuccess("");
    if (!validateForm()) return;
    setIsCheckingEmail(true);
    try {
      const response = await axios.post("http://localhost:8070/auth/send-verification-otp", { email });
      setOtpSessionId(response.data.sessionId);
      setOtpStep(true);
      setOtpSuccess(`Verification code sent to ${email}`);
      // Start OTP timer
      startOtpCountdown(response.data.expiresIn || 300);
    } catch (err) {
      setOtpError(err.response?.data?.message || "Failed to send verification code");
      setOtpStep(false);
    } finally {
      setIsCheckingEmail(false);
    }
  };

  // OTP countdown timer
  const startOtpCountdown = (seconds) => {
    setOtpTimer(seconds);
    const interval = setInterval(() => {
      setOtpTimer((prev) => {
        if (prev <= 1) {
          clearInterval(interval);
          return 0;
        }
        return prev - 1;
      });
    }, 1000);
  };

  // Verify OTP
  const handleVerifyOtp = async (e) => {
    e.preventDefault();
    setOtpError("");
    setOtpSuccess("");
    if (!otp || otp.length !== 6) {
      setOtpError("Please enter the 6-digit verification code");
      return;
    }
    setIsVerifyingOtp(true);
    try {
      await axios.post("http://localhost:8070/auth/verify-otp", { sessionId: otpSessionId, otp });
      setOtpSuccess("Email verified! You can now complete registration.");
      setOtpStep(false);
      // Now allow registration
      await handleRegister();
    } catch (err) {
      setOtpError(err.response?.data?.message || "Failed to verify OTP");
    } finally {
      setIsVerifyingOtp(false);
    }
  };

  // Register user after OTP verification
  const handleRegister = async () => {
    setIsRegistering(true);
    try {
      const newUser = { 
        name, 
        dob, 
        age: calculateAge(dob), 
        gender, 
        email, 
        contact, 
        password, 
        role 
      };
      await axios.post("http://localhost:8070/auth/signup", newUser);
      alert("User registered successfully");
      navigate("/login");
    } catch (err) {
      const errorMessage = err.response?.data?.message || 
                          err.response?.data || 
                          "Error registering user";
      setErrors(prev => ({ ...prev, email: errorMessage }));
    } finally {
      setIsRegistering(false);
    }
  };

  function handleGoogleSignUp() {
    alert("Google Sign-Up Coming Soon!");
  }

  return (
    <div className={styles.signup_container}>
      <div className={styles.signup_form_container}>
        <div className={styles.left}>
          <div className={styles.welcome_logo_container}>
            <div className={styles.welcome_logo}>
              <img src={logo} alt="Club FTC" />
            </div>
            <br/>
            <br/>
            <h1>Welcome Back</h1>
          </div>
          <Link to="/login">
            <button type="button" className={styles.white_btn}>Sign in</button>
          </Link>
        </div>

        <div className={styles.right}>
          {!otpStep ? (
            <form className={styles.form_container} onSubmit={handleSendOtp}>
              <div className={styles.form_group}>
                <label htmlFor="name">Name</label>
                <input 
                  type="text" 
                  id="name" 
                  className={styles.form_control} 
                  placeholder="Enter your full name" 
                  value={name} 
                  onChange={(e) => setName(e.target.value)} 
                  required 
                />
                {errors.name && <div className={styles.error_message}>{errors.name}</div>}
              </div>

              <div className={styles.form_group}>
                <label htmlFor="dob">Date of Birth</label>
                <input 
                  type="date" 
                  id="dob" 
                  className={styles.form_control} 
                  value={dob} 
                  onChange={(e) => {
                    setDob(e.target.value);
                    setAge(calculateAge(e.target.value));
                  }}
                  required 
                />
                {errors.dob && <div className={styles.error_message}>{errors.dob}</div>}
              </div>

              <div className={styles.form_group}>
                <label htmlFor="age">Age</label>
                <input 
                  type="number" 
                  id="age" 
                  className={styles.form_control} 
                  placeholder="Calculated Age" 
                  value={age} 
                  readOnly 
                />
              </div>

              <div className={styles.form_group}>
                <label htmlFor="gender">Gender</label>
                <select 
                  id="gender" 
                  className={styles.form_select} 
                  value={gender} 
                  onChange={(e) => setGender(e.target.value)}
                >
                  <option value="Male">Male</option>
                  <option value="Female">Female</option>
                  <option value="Other">Other</option>
                </select>
              </div>

              <div className={styles.form_group}>
                <label htmlFor="email">Email</label>
                <input 
                  type="email" 
                  id="email" 
                  className={`${styles.form_control} ${isCheckingEmail ? styles.checking : ''}`}
                  placeholder="Enter your email" 
                  value={email} 
                  onChange={handleEmailChange}
                  required 
                />
                {isCheckingEmail && <div className={styles.checking_message}>Checking email availability...</div>}
                {errors.email && <div className={styles.error_message}>{errors.email}</div>}
              </div>

              <div className={styles.form_group}>
                <label htmlFor="contact">Contact Number</label>
                <input 
                  type="tel" 
                  id="contact" 
                  className={styles.form_control} 
                  placeholder="Enter your contact number" 
                  value={contact} 
                  onChange={(e) => setContact(e.target.value)} 
                  required 
                />
                {errors.contact && <div className={styles.error_message}>{errors.contact}</div>}
              </div>

              <div className={styles.form_group}>
                <label htmlFor="password">Password</label>
                <input 
                  type="password" 
                  id="password" 
                  className={styles.form_control} 
                  placeholder="Enter your password" 
                  value={password} 
                  onChange={(e) => setPassword(e.target.value)} 
                  required 
                />
                {errors.password && <div className={styles.error_message}>{errors.password}</div>}
              </div>

              <div className={styles.form_group}>
                <label htmlFor="role">Role</label>
                <select 
                  id="role" 
                  className={styles.form_select} 
                  value={role} 
                  onChange={(e) => setRole(e.target.value)}
                >
                  <option value="member">Member</option>
                 
                </select>
              </div>

              <div className="or_separator">or</div>
              
              <button 
                type="button" 
                className={styles.google_btn} 
                onClick={handleGoogleSignUp}
              >
                <svg 
                  xmlns="http://www.w3.org/2000/svg" 
                  width="24" 
                  height="24" 
                  viewBox="0 0 24 24" 
                  className="mr-2"
                >
                  <path fill="#4285F4" d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.75h3.57c2.08-1.92 3.28-4.74 3.28-8.07z"/>
                  <path fill="#34A853" d="M12 23c2.97 0 5.46-1 7.28-2.69l-3.57-2.75c-.99.69-2.26 1.1-3.71 1.1-2.87 0-5.3-1.94-6.16-4.54H2.18v2.84C4 20.2 7.7 23 12 23z"/>
                  <path fill="#FBBC05" d="M5.84 14.12c-.22-.66-.35-1.36-.35-2.12s.13-1.46.35-2.12V7.04H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.96l2.66-2.84z"/>
                  <path fill="#EA4335" d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.46 1.05 14.97 0 12 0 7.7 0 4 2.8 2.18 6.04l2.66 2.84c.86-2.6 3.29-4.54 6.16-4.54z"/>
                </svg>
                Continue with Google
              </button>

              <div className={styles.form_group}>
                <label>
                  <input 
                    type="checkbox" 
                    checked={termsAgreed} 
                    onChange={(e) => setTermsAgreed(e.target.checked)} 
                  />
                  I agree to the terms and conditions
                </label>
                {errors.terms && <div className={styles.error_message}>{errors.terms}</div>}
              </div>
              <button type="submit" className={styles.btn_primary} disabled={isCheckingEmail || isRegistering}>
                {isCheckingEmail || isRegistering ? "Processing..." : "Sign up"}
              </button>
              {otpError && <div className={styles.error_message}>{otpError}</div>}
              {otpSuccess && <div className={styles.success_message}>{otpSuccess}</div>}
            </form>
          ) : (
            <form className={styles.form_container} onSubmit={handleVerifyOtp}>
              <div className={styles.form_group}>
                <label htmlFor="otp">Enter the 6-digit verification code sent to your email</label>
                <input
                  type="text"
                  id="otp"
                  className={styles.form_control}
                  placeholder="000000"
                  value={otp}
                  onChange={(e) => setOtp(e.target.value)}
                  maxLength={6}
                  required
                  style={{ textAlign: 'center', fontSize: '18px', letterSpacing: '2px' }}
                  disabled={isVerifyingOtp}
                />
                {otpTimer > 0 && (
                  <div className={styles.checking_message}>
                    Code expires in: <strong>{Math.floor(otpTimer/60)}:{(otpTimer%60).toString().padStart(2,'0')}</strong>
                  </div>
                )}
                {otpError && <div className={styles.error_message}>{otpError}</div>}
                {otpSuccess && <div className={styles.success_message}>{otpSuccess}</div>}
              </div>
              <button type="submit" className={styles.btn_primary} disabled={isVerifyingOtp || otp.length !== 6}>
                {isVerifyingOtp ? "Verifying..." : "Verify Code"}
              </button>
              <button type="button" className={styles.google_btn} onClick={() => { setOtpStep(false); setOtp(""); setOtpError(""); setOtpSuccess(""); }}>
                ← Back to Signup
              </button>
            </form>
          )}
        </div>
      </div>
    </div>
  );
}

export default AddUser;
