import { useState, useEffect } from "react";
import { Link, useNavigate } from "react-router-dom";
import { useAppContext } from "@/context/AppContext";
import styles from "../auth.module.css";
import pageStyles from "./Login.module.css";

export default function Login() {
    const navigate = useNavigate();
    const { login, user, isInitialized } = useAppContext();

    const [form, setForm] = useState({ identifier: "", password: "" });
    const [showPassword, setShowPassword] = useState(false);
    const [error, setError] = useState("");
    const [loading, setLoading] = useState(false);

    useEffect(() => {
        if (isInitialized && user) navigate("/");
    }, [isInitialized, user, navigate])

    const handleChange = (e) => {
        setForm((prev) => ({ ...prev, [e.target.name]: e.target.value }));
    };

    const handleSubmit = async (e) => {
        e.preventDefault();
        setError("");
        setLoading(true);
        try {
            await login(form.identifier, form.password);
            navigate("/");
        } catch (err) {
            setError(err.message);
        } finally {
            setLoading(false);
        }
    };

    return (
        <div className={styles.page}>
            <div className={styles.card}>

                <div className={styles.header}>
                    <h1 className={styles.title}>Welcome back!</h1>
                    <p className={styles.subtitle}>Sign in to your account to continue</p>
                </div>

                <form className={styles.form} onSubmit={handleSubmit} noValidate>
                    <div className={styles.field}>
                        <label className={styles.label} htmlFor="login-identifier">
                            Username or Email
                        </label>
                        <input
                            id="login-identifier"
                            className={styles.input}
                            type="text"
                            name="identifier"
                            autoComplete="username"
                            placeholder="Username or Email"
                            value={form.identifier}
                            onChange={handleChange}
                            required
                        />
                    </div>

                    <div className={styles.field}>
                        <div className={styles.labelRow}>
                            <label className={styles.label} htmlFor="login-password">
                                Password
                            </label>
                            <Link to ="/forgot-password" className={pageStyles.forgotLink}>
                                Forgot password?
                            </Link>
                        </div>
                        <div className={styles.inputWrapper}>
                            <input
                                id="login-password"
                                className={styles.input}
                                type={showPassword ? "text" : "password"}
                                name="password"
                                autoComplete="current-password"
                                placeholder="********"
                                value={form.password}
                                onChange={handleChange}
                                required
                            />
                            <button
                                type="button"
                                className={styles.revealBtn}
                                onClick={() => setShowPassword((v) => !v)}
                                aria-label={showPassword ? "Hide password" : "Show password"}
                            >
                                {showPassword ? "Hide" : "Show"}
                            </button>
                        </div>
                    </div>

                    {error && <p className={styles.errorMsg} role="alert">{error}</p>}

                    <button type="submit" className={styles.submitBtn} disabled={loading}>
                        {loading ? "Signing in..." : "Sign in"}
                    </button>
                </form>

                <p className={styles.switchText}>
                    Don't have an account?{" "}
                    <Link to="/register" className={styles.switchLink}>
                        Create one
                    </Link>
                </p>
            </div>
        </div>
    );
}