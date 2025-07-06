import { useState } from "react";
import axios from "axios";
import { Link, useNavigate } from "react-router-dom";
import styles from "./login.module.css";
import logo from '../../assets/logo.png';

const useLogin = () => {
    const [data, setData] = useState({ email: "", password: "" });
    const [error, setError] = useState("");
    const [successMessage, setSuccessMessage] = useState("");
    const [isLoading, setIsLoading] = useState(false);
    const [showAlternativeOptions, setShowAlternativeOptions] = useState(false);
    const [biometricSessionId, setBiometricSessionId] = useState(null);
    const [isPolling, setIsPolling] = useState(false);
    
    // OTP related states
    const [otpSessionId, setOtpSessionId] = useState(null);
    const [otp, setOtp] = useState("");
    const [otpSent, setOtpSent] = useState(false);
    const [remainingTime, setRemainingTime] = useState(0);
    
    // Forgot Password states
    const [showForgotPassword, setShowForgotPassword] = useState(false);
    const [forgotEmail, setForgotEmail] = useState("");
    const [resetSessionId, setResetSessionId] = useState(null);
    const [resetOtp, setResetOtp] = useState("");
    const [resetOtpSent, setResetOtpSent] = useState(false);
    const [otpVerified, setOtpVerified] = useState(false);
    const [newPassword, setNewPassword] = useState("");
    const [confirmPassword, setConfirmPassword] = useState("");
    const [resetRemainingTime, setResetRemainingTime] = useState(0);
    
    const navigate = useNavigate();

    const handleChange = ({ currentTarget: input }) => {
        setData(prevData => ({ ...prevData, [input.name]: input.value }));
    };

    const handleOtpChange = ({ currentTarget: input }) => {
        setOtp(input.value);
    };

    const handleForgotEmailChange = ({ currentTarget: input }) => {
        setForgotEmail(input.value);
    };

    const handleResetOtpChange = ({ currentTarget: input }) => {
        setResetOtp(input.value);
    };

    const handleNewPasswordChange = ({ currentTarget: input }) => {
        setNewPassword(input.value);
    };

    const handleConfirmPasswordChange = ({ currentTarget: input }) => {
        setConfirmPassword(input.value);
    };

    // Regular login with password
    const handleSubmit = async (e) => {
        e.preventDefault();
        setIsLoading(true);
        setError("");
        setSuccessMessage("");

        try {
            const response = await axios.post('http://localhost:8070/user/login', {
                email: data.email,
                password: data.password,
            });

            if (response.data.token) {
                // Store user data in sessionStorage
                sessionStorage.setItem('userEmail', data.email);
                sessionStorage.setItem('token', response.data.token);
                sessionStorage.setItem('userId', response.data.user.id);
                sessionStorage.setItem('userName', response.data.user.name);
                sessionStorage.setItem('userRole', response.data.user.role);
                sessionStorage.setItem('membershipStatus', response.data.user.membershipStatus);
                
                setSuccessMessage('Login successful! Redirecting...');
                setError('');
                
                setTimeout(() => {
                    navigate("/dashboard");
                }, 1500);
            } else {
                setError('Login failed - Invalid response');
                setSuccessMessage('');
            }
        } catch (error) {
            console.error('Login error:', error);
            if (error.response?.status === 403) {
                setError('Your account has been blocked. Please contact the administrator.');
            } else {
                setError(error.response?.data?.message || 'Invalid email or password');
            }
            setSuccessMessage('');
        } finally {
            setIsLoading(false);
        }
    };

    // Send combined authentication options (OTP + Biometric)
    const handleSendAuthOptions = async () => {
        if (!data.email) {
            setError('Please enter your email address first');
            return;
        }

        setIsLoading(true);
        setError("");
        setSuccessMessage("");

        try {
            const response = await axios.post('http://localhost:8070/biometric/send-auth-options', {
                email: data.email
            });

            if (response.data.otpSessionId && response.data.biometricSessionId) {
                setOtpSessionId(response.data.otpSessionId);
                setBiometricSessionId(response.data.biometricSessionId);
                setOtpSent(true);
                setRemainingTime(response.data.expiresIn);
                setSuccessMessage(`🎉 Authentication options sent to ${data.email}! Check your email for both biometric link and 6-digit code.`);
                setShowAlternativeOptions(false);
                
                // Start countdown timer for OTP
                startCountdown(response.data.expiresIn);
                
                // Start polling for biometric authentication
                startPollingBiometricStatus(response.data.biometricSessionId);
            }
        } catch (error) {
            console.error('Send auth options error:', error);
            setError(error.response?.data?.message || 'Failed to send authentication options');
        } finally {
            setIsLoading(false);
        }
    };

    // Verify OTP (unchanged)
    const handleVerifyOtp = async (e) => {
        e.preventDefault();
        if (!otp || otp.length !== 6) {
            setError('Please enter the 6-digit verification code');
            return;
        }

        setIsLoading(true);
        setError("");
        setSuccessMessage("");

        try {
            const response = await axios.post('http://localhost:8070/biometric/verify-otp', {
                sessionId: otpSessionId,
                otp: otp
            });

            if (response.data.token) {
                // Store user data in sessionStorage
                sessionStorage.setItem('userEmail', response.data.user.email);
                sessionStorage.setItem('token', response.data.token);
                sessionStorage.setItem('userId', response.data.user.id);
                sessionStorage.setItem('userName', response.data.user.name);
                sessionStorage.setItem('userRole', response.data.user.role);
                sessionStorage.setItem('membershipStatus', response.data.user.membershipStatus);
                
                setSuccessMessage('🎉 Verification successful! Logging you in...');
                setError('');
                
                setTimeout(() => {
                    navigate("/dashboard");
                }, 1500);
            }
        } catch (error) {
            console.error('Verify OTP error:', error);
            setError(error.response?.data?.message || 'Invalid verification code');
        } finally {
            setIsLoading(false);
        }
    };

    // Start countdown timer
    const startCountdown = (seconds) => {
        const interval = setInterval(() => {
            setRemainingTime(prev => {
                if (prev <= 1) {
                    clearInterval(interval);
                    return 0;
                }
                return prev - 1;
            });
        }, 1000);
    };

    // Format remaining time
    const formatTime = (seconds) => {
        const mins = Math.floor(seconds / 60);
        const secs = seconds % 60;
        return `${mins}:${secs.toString().padStart(2, '0')}`;
    };

    // Poll for biometric authentication status (unchanged)
    const startPollingBiometricStatus = (sessionId) => {
        setIsPolling(true);
        
        const pollInterval = setInterval(async () => {
            try {
                const response = await axios.get(`http://localhost:8070/biometric/check-status/${sessionId}`);
                
                if (response.data.status === 'completed') {
                    clearInterval(pollInterval);
                    setIsPolling(false);
                    
                    // Store user data from biometric authentication
                    sessionStorage.setItem('userEmail', response.data.user.email);
                    sessionStorage.setItem('token', response.data.token);
                    sessionStorage.setItem('userId', response.data.user.id);
                    sessionStorage.setItem('userName', response.data.user.name);
                    sessionStorage.setItem('userRole', response.data.user.role);
                    
                    setSuccessMessage('🎉 Biometric authentication successful! Logging you in...');
                    setError('');
                    setBiometricSessionId(null);
                    
                    setTimeout(() => {
                        navigate("/dashboard");
                    }, 2000);
                    
                } else if (response.data.status === 'expired') {
                    clearInterval(pollInterval);
                    setIsPolling(false);
                    setError('Biometric login session expired. Please try again.');
                    setBiometricSessionId(null);
                    setSuccessMessage('');
                }
            } catch (error) {
                console.error('Polling error:', error);
                if (error.response?.status === 404 || error.response?.status === 500) {
                    clearInterval(pollInterval);
                    setIsPolling(false);
                    setError('Error checking biometric status. Please try again.');
                    setBiometricSessionId(null);
                    setSuccessMessage('');
                }
            }
        }, 2000);

        // Stop polling after 10 minutes
        setTimeout(() => {
            clearInterval(pollInterval);
            setIsPolling(false);
            if (biometricSessionId) {
                setError('Biometric login timeout. Please try again.');
                setBiometricSessionId(null);
                setSuccessMessage('');
            }
        }, 600000);
    };

    const cancelBiometricLogin = () => {
        setIsPolling(false);
        setBiometricSessionId(null);
        setShowAlternativeOptions(false);
        setSuccessMessage('');
        setError('');
    };

    const cancelOtpLogin = () => {
        setOtpSent(false);
        setOtpSessionId(null);
        setOtp("");
        setShowAlternativeOptions(false);
        setSuccessMessage('');
        setError('');
        setRemainingTime(0);
        setIsPolling(false);
        setBiometricSessionId(null);
    };

    const resetToLogin = () => {
        setShowAlternativeOptions(false);
        setBiometricSessionId(null);
        setOtpSessionId(null);
        setOtpSent(false);
        setOtp("");
        setIsPolling(false);
        setSuccessMessage('');
        setError('');
        setRemainingTime(0);
    };

    // Forgot Password - Send Reset OTP
    const handleSendResetOtp = async (e) => {
        e.preventDefault();
        if (!forgotEmail) {
            setError('Please enter your email address');
            return;
        }

        setIsLoading(true);
        setError("");
        setSuccessMessage("");

        try {
            const response = await axios.post('http://localhost:8070/forgot-password/send-reset-otp', {
                email: forgotEmail
            });

            if (response.data.sessionId) {
                setResetSessionId(response.data.sessionId);
                setResetOtpSent(true);
                setResetRemainingTime(response.data.expiresIn);
                setSuccessMessage(`🎉 Password reset code sent to ${forgotEmail}! Check your email for the 6-digit verification code.`);
                
                // Start countdown timer
                startResetCountdown(response.data.expiresIn);
            }
        } catch (error) {
            console.error('Send reset OTP error:', error);
            setError(error.response?.data?.message || 'Failed to send password reset code');
        } finally {
            setIsLoading(false);
        }
    };

    // Verify Reset OTP
    const handleVerifyResetOtp = async (e) => {
        e.preventDefault();
        if (!resetOtp || resetOtp.length !== 6) {
            setError('Please enter the 6-digit verification code');
            return;
        }

        setIsLoading(true);
        setError("");
        setSuccessMessage("");

        try {
            const response = await axios.post('http://localhost:8070/forgot-password/verify-reset-otp', {
                sessionId: resetSessionId,
                otp: resetOtp
            });

            if (response.data.verified) {
                setOtpVerified(true);
                setSuccessMessage('🎉 Code verified! Now create your new password.');
            }
        } catch (error) {
            console.error('Verify reset OTP error:', error);
            setError(error.response?.data?.message || 'Invalid verification code');
        } finally {
            setIsLoading(false);
        }
    };

    // Reset Password
    const handleResetPassword = async (e) => {
        e.preventDefault();
        if (!newPassword || newPassword.length < 6) {
            setError('Password must be at least 6 characters long');
            return;
        }
        if (newPassword !== confirmPassword) {
            setError('Passwords do not match');
            return;
        }

        setIsLoading(true);
        setError("");
        setSuccessMessage("");

        try {
            await axios.post('http://localhost:8070/forgot-password/reset-password', {
                sessionId: resetSessionId,
                newPassword: newPassword
            });

            setSuccessMessage('🎉 Password reset successful! You can now login with your new password.');
            
            // Reset all forgot password states
            setTimeout(() => {
                resetForgotPasswordStates();
            }, 2000);
        } catch (error) {
            console.error('Reset password error:', error);
            setError(error.response?.data?.message || 'Failed to reset password');
        } finally {
            setIsLoading(false);
        }
    };

    // Start reset countdown timer
    const startResetCountdown = (seconds) => {
        const interval = setInterval(() => {
            setResetRemainingTime(prev => {
                if (prev <= 1) {
                    clearInterval(interval);
                    return 0;
                }
                return prev - 1;
            });
        }, 1000);
    };

    // Reset forgot password states
    const resetForgotPasswordStates = () => {
        setShowForgotPassword(false);
        setForgotEmail("");
        setResetSessionId(null);
        setResetOtp("");
        setResetOtpSent(false);
        setOtpVerified(false);
        setNewPassword("");
        setConfirmPassword("");
        setResetRemainingTime(0);
        setSuccessMessage('');
        setError('');
    };

    return { 
        data, 
        error, 
        successMessage, 
        isLoading,
        showAlternativeOptions,
        biometricSessionId,
        isPolling,
        otpSessionId,
        otp,
        otpSent,
        remainingTime,
        showForgotPassword,
        forgotEmail,
        resetOtp,
        resetOtpSent,
        otpVerified,
        newPassword,
        confirmPassword,
        resetRemainingTime,
        handleChange, 
        handleSubmit,
        handleSendAuthOptions,
        handleVerifyOtp,
        handleOtpChange,
        handleForgotEmailChange,
        handleResetOtpChange,
        handleNewPasswordChange,
        handleConfirmPasswordChange,
        setShowAlternativeOptions,
        setShowForgotPassword,
        cancelBiometricLogin,
        cancelOtpLogin,
        resetToLogin,
        formatTime,
        handleSendResetOtp,
        handleVerifyResetOtp,
        handleResetPassword,
        resetForgotPasswordStates
    };
};

const Login = () => {
    const { 
        data, 
        error, 
        successMessage, 
        isLoading,
        showAlternativeOptions,
        biometricSessionId,
        isPolling,
        otp,
        otpSent,
        remainingTime,
        showForgotPassword,
        forgotEmail,
        resetOtp,
        resetOtpSent,
        otpVerified,
        newPassword,
        confirmPassword,
        resetRemainingTime,
        handleChange, 
        handleSubmit,
        handleSendAuthOptions,
        handleVerifyOtp,
        handleOtpChange,
        handleForgotEmailChange,
        handleResetOtpChange,
        handleNewPasswordChange,
        handleConfirmPasswordChange,
        setShowAlternativeOptions,
        setShowForgotPassword,
        cancelBiometricLogin,
        cancelOtpLogin,
        resetToLogin,
        formatTime,
        handleSendResetOtp,
        handleVerifyResetOtp,
        handleResetPassword,
        resetForgotPasswordStates
    } = useLogin();

    return (
        <div className={styles.login_container}>
            <div className={styles.login_form_container}>
                <div className={styles.left}>
                    {!showForgotPassword ? (
                        <form className={styles.form_container} onSubmit={otpSent ? handleVerifyOtp : handleSubmit}>
                            <h1>Login to Your Account</h1>
                            
                            <input
                                type="email"
                                placeholder="Email"
                                name="email"
                                onChange={handleChange}
                                value={data.email}
                                required
                                className={styles.input}
                                disabled={isLoading || isPolling || otpSent}
                            />
                            
                            {!showAlternativeOptions && !biometricSessionId && !otpSent && (
                                <input
                                    type="password"
                                    placeholder="Password"
                                    name="password"
                                    onChange={handleChange}
                                    value={data.password}
                                    required
                                    className={styles.input}
                                    disabled={isLoading || isPolling}
                                />
                            )}

                            {otpSent && (
                                <div className={styles.otp_section}>
                                    <p>Enter the 6-digit verification code from your email:</p>
                                    <input
                                        type="text"
                                        placeholder="000000"
                                        name="otp"
                                        onChange={handleOtpChange}
                                        value={otp}
                                        maxLength="6"
                                        className={styles.input}
                                        disabled={isLoading}
                                        style={{ textAlign: 'center', fontSize: '18px', letterSpacing: '2px' }}
                                    />
                                    {remainingTime > 0 && (
                                        <p style={{ fontSize: '14px', color: '#666' }}>
                                            Code expires in: <strong>{formatTime(remainingTime)}</strong>
                                        </p>
                                    )}
                                    <div style={{ fontSize: '12px', color: '#4285f4', marginTop: '10px' }}>
                                        💡 <strong>Tip:</strong> Check your email for both the 6-digit code and biometric login link!
                                    </div>
                                </div>
                            )}
                            
                            {error && <div className={styles.error_msg}>{error}</div>}
                            {successMessage && <div className={styles.success_msg}>{successMessage}</div>}
                            
                            {!biometricSessionId && !isPolling && !otpSent && !showAlternativeOptions && (
                                <>
                                    <button 
                                        type="submit" 
                                        className={styles.green_btn}
                                        disabled={isLoading}
                                    >
                                        {isLoading ? 'Signing In...' : 'Sign In'}
                                    </button>
                                    
                                    <div className={styles.divider}>
                                        <span>OR</span>
                                    </div>
                                    
                                    <button 
                                        type="button" 
                                        className={styles.alternative_btn}
                                        onClick={() => setShowAlternativeOptions(true)}
                                        disabled={isLoading}
                                    >
                                        🔄 Try Another Way
                                    </button>
                                    
                                    {/* Forgot Password Link */}
                                    <div className={styles.forgot_password_link}>
                                        <button 
                                            type="button" 
                                            className={styles.link_btn}
                                            onClick={() => setShowForgotPassword(true)}
                                            disabled={isLoading}
                                        >
                                            🔑 Forgot Password?
                                        </button>
                                    </div>
                                </>
                            )}

                            {showAlternativeOptions && !biometricSessionId && !otpSent && (
                                <div className={styles.alternative_options}>
                                    <h3>Secure Login Options</h3>
                                    <p>Get both biometric link and verification code in one email:</p>
                                    
                                    <div className={styles.auth_options}>
                                        <button 
                                            type="button" 
                                            className={styles.combined_auth_btn}
                                            onClick={handleSendAuthOptions}
                                            disabled={isLoading}
                                            style={{
                                                background: 'linear-gradient(135deg, #667eea 0%, #764ba2 50%, #34a853 100%)',
                                                color: 'white',
                                                padding: '15px 20px',
                                                borderRadius: '8px',
                                                border: 'none',
                                                width: '100%',
                                                cursor: 'pointer',
                                                fontSize: '14px',
                                                fontWeight: '600',
                                                display: 'flex',
                                                flexDirection: 'column',
                                                alignItems: 'center',
                                                gap: '5px'
                                            }}
                                        >
                                            <span style={{ fontSize: '18px' }}>🔐📧</span>
                                            <strong>Send Both Options</strong>
                                            <small style={{ fontSize: '11px', opacity: '0.9' }}>
                                                Biometric link + 6-digit code in one email
                                            </small>
                                        </button>
                                    </div>
                                    
                                    <button 
                                        type="button" 
                                        className={styles.cancel_btn}
                                        onClick={() => setShowAlternativeOptions(false)}
                                        disabled={isLoading}
                                    >
                                        ← Back to Password Login
                                    </button>
                                </div>
                            )}

                            {otpSent && (
                                <div className={styles.otp_actions}>
                                    <button 
                                        type="submit" 
                                        className={styles.green_btn}
                                        disabled={isLoading || otp.length !== 6}
                                    >
                                        {isLoading ? 'Verifying...' : 'Verify Code'}
                                    </button>
                                    <button 
                                        type="button" 
                                        className={styles.cancel_btn}
                                        onClick={cancelOtpLogin}
                                        disabled={isLoading}
                                    >
                                        Cancel
                                    </button>
                                </div>
                            )}
                            
                            {isPolling && (
                                <div className={styles.polling_section}>
                                    <div className={styles.spinner}></div>
                                    <p><strong>🔄 Waiting for biometric authentication...</strong></p>
                                    <p>📱 Check your email for the biometric login link</p>
                                    <p>💡 Or use the 6-digit code above for instant access</p>
                                    <button 
                                        type="button" 
                                        className={styles.cancel_btn}
                                        onClick={cancelBiometricLogin}
                                    >
                                        Cancel
                                    </button>
                                </div>
                            )}

                            {(showAlternativeOptions || biometricSessionId || otpSent) && (
                                <div className={styles.back_to_login}>
                                    <button 
                                        type="button" 
                                        className={styles.link_btn}
                                        onClick={resetToLogin}
                                        disabled={isLoading || isPolling}
                                    >
                                        ← Back to Password Login
                                    </button>
                                </div>
                            )}
                        </form>
                    ) : (
                        /* Forgot Password Form */
                        <div className={styles.form_container}>
                            <h1>Reset Password</h1>
                            
                            {!resetOtpSent ? (
                                /* Step 1: Enter Email */
                                <form onSubmit={handleSendResetOtp}>
                                    <p style={{ color: '#666', fontSize: '14px', textAlign: 'center', margin: '0 0 20px 0' }}>
                                        Enter your email address and we'll send you a verification code to reset your password.
                                    </p>
                                    
                                    <input
                                        type="email"
                                        placeholder="Enter your email"
                                        name="forgotEmail"
                                        onChange={handleForgotEmailChange}
                                        value={forgotEmail}
                                        required
                                        className={styles.input}
                                        disabled={isLoading}
                                    />
                                    
                                    {error && <div className={styles.error_msg}>{error}</div>}
                                    {successMessage && <div className={styles.success_msg}>{successMessage}</div>}
                                    
                                    <button 
                                        type="submit" 
                                        className={styles.green_btn}
                                        disabled={isLoading}
                                    >
                                        {isLoading ? 'Sending...' : 'Send Reset Code'}
                                    </button>
                                    
                                    <button 
                                        type="button" 
                                        className={styles.cancel_btn}
                                        onClick={resetForgotPasswordStates}
                                        disabled={isLoading}
                                    >
                                        ← Back to Login
                                    </button>
                                </form>
                            ) : !otpVerified ? (
                                /* Step 2: Verify OTP */
                                <form onSubmit={handleVerifyResetOtp}>
                                    <p style={{ color: '#666', fontSize: '14px', textAlign: 'center', margin: '0 0 20px 0' }}>
                                        Enter the 6-digit verification code sent to <strong>{forgotEmail}</strong>
                                    </p>
                                    
                                    <input
                                        type="text"
                                        placeholder="000000"
                                        name="resetOtp"
                                        onChange={handleResetOtpChange}
                                        value={resetOtp}
                                        maxLength="6"
                                        className={styles.input}
                                        disabled={isLoading}
                                        style={{ textAlign: 'center', fontSize: '18px', letterSpacing: '2px' }}
                                    />
                                    
                                    {resetRemainingTime > 0 && (
                                        <p style={{ fontSize: '14px', color: '#666', textAlign: 'center' }}>
                                            Code expires in: <strong>{formatTime(resetRemainingTime)}</strong>
                                        </p>
                                    )}
                                    
                                    {error && <div className={styles.error_msg}>{error}</div>}
                                    {successMessage && <div className={styles.success_msg}>{successMessage}</div>}
                                    
                                    <button 
                                        type="submit" 
                                        className={styles.green_btn}
                                        disabled={isLoading || resetOtp.length !== 6}
                                    >
                                        {isLoading ? 'Verifying...' : 'Verify Code'}
                                    </button>
                                    
                                    <button 
                                        type="button" 
                                        className={styles.cancel_btn}
                                        onClick={resetForgotPasswordStates}
                                        disabled={isLoading}
                                    >
                                        Cancel
                                    </button>
                                </form>
                            ) : (
                                /* Step 3: Set New Password */
                                <form onSubmit={handleResetPassword}>
                                    <p style={{ color: '#666', fontSize: '14px', textAlign: 'center', margin: '0 0 20px 0' }}>
                                        Create your new password. Make it strong and secure!
                                    </p>
                                    
                                    <input
                                        type="password"
                                        placeholder="New Password (min 6 characters)"
                                        name="newPassword"
                                        onChange={handleNewPasswordChange}
                                        value={newPassword}
                                        required
                                        className={styles.input}
                                        disabled={isLoading}
                                        minLength="6"
                                    />
                                    
                                    <input
                                        type="password"
                                        placeholder="Confirm New Password"
                                        name="confirmPassword"
                                        onChange={handleConfirmPasswordChange}
                                        value={confirmPassword}
                                        required
                                        className={styles.input}
                                        disabled={isLoading}
                                        minLength="6"
                                    />
                                    
                                    {error && <div className={styles.error_msg}>{error}</div>}
                                    {successMessage && <div className={styles.success_msg}>{successMessage}</div>}
                                    
                                    <button 
                                        type="submit" 
                                        className={styles.green_btn}
                                        disabled={isLoading || !newPassword || !confirmPassword}
                                    >
                                        {isLoading ? 'Resetting...' : 'Reset Password'}
                                    </button>
                                    
                                    <button 
                                        type="button" 
                                        className={styles.cancel_btn}
                                        onClick={resetForgotPasswordStates}
                                        disabled={isLoading}
                                    >
                                        Cancel
                                    </button>
                                </form>
                            )}
                        </div>
                    )}
                </div>
                
                <div className={styles.right}>
                    <img src={logo} alt="logo" />
                    <h1>New Here?</h1>
                    <Link to="/signup">
                        <button type="button" className={styles.white_btn}>
                            Sign Up
                        </button>
                    </Link>
                </div>
            </div>
            
            {/* MommentX Security Branding - Bottom Right */}
            <div className={styles.security_branding}>
                <a href="https://momentx.com" target="_blank" rel="noopener noreferrer">
                    <span className={styles.security_icon}>🔒</span>
                    <span className={styles.security_text}>Secured by</span>
                    <span className={styles.security_brand}>MommentX</span>
                </a>
            </div>
        </div>
    );
};

export default Login;
