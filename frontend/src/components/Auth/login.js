import { useState } from "react";
import axios from "axios";
import { Link, useNavigate } from "react-router-dom";
import styles from "./login.module.css";
import logo from '../../assets/logo.png';

const useLogin = () => {
    const [data, setData] = useState({ email: "", password: "" });
    const [error, setError] = useState("");
    const [successMessage, setSuccessMessage] = useState("");
    const navigate = useNavigate();

    const handleChange = ({ currentTarget: input }) => {
        setData(prevData => ({ ...prevData, [input.name]: input.value }));
    };

    const handleSubmit = async (e) => {
        e.preventDefault();
        try {
            // Change this URL to match your blocking-checking route
            const response = await axios.post('http://localhost:8070/user/login', {
                email: data.email,
                password: data.password,
            });

            if (response.data.token) {
                // Store token AND membership status
                sessionStorage.setItem('userEmail', data.email);
                sessionStorage.setItem('token', response.data.token);
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
            setError(error.response?.data?.message || 'Invalid email or password');
            setSuccessMessage('');
        }
    };

    return { data, error, successMessage, handleChange, handleSubmit };
};

const Login = () => {
    const { data, error, successMessage, handleChange, handleSubmit } = useLogin();

    return (
        <div className={styles.login_container}>
            <div className={styles.login_form_container}>
                <div className={styles.left}>
                    <form className={styles.form_container} onSubmit={handleSubmit}>
                        <h1>Login to Your Account</h1>
                        <input
                            type="email"
                            placeholder="Email"
                            name="email"
                            onChange={handleChange}
                            value={data.email}
                            required
                            className={styles.input}
                        />
                        <input
                            type="password"
                            placeholder="Password"
                            name="password"
                            onChange={handleChange}
                            value={data.password}
                            required
                            className={styles.input}
                        />
                        {error && <div className={styles.error_msg}>{error}</div>}
                        {successMessage && <div className={styles.success_msg}>{successMessage}</div>}
                        <button type="submit" className={styles.green_btn}>
                            Sign In
                        </button>
                    </form>
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
        </div>
    );
};

export default Login;
