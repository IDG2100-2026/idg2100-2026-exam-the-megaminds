import { useState, useEffect } from "react";
import { Link, useNavigate } from "react-router-dom";
import { useAppContext } from "@/context/AppContext";
import { userService } from "@/services/api";
import styles from "../auth.module.css";
import pageStyles from "./Register.module.css";

export default function Register() {
    const navigate = useNavigate();
    const { user, isInitialized } = useAppContext();
    const [registered, setRegistered] = useState(false);

    const [form, setForm] = useState({
        username: "",
        email: "",
        password: "",
        confirm: "",
        dob: "",
    });
    const [showPassword, setShowPassword] = useState(false);
    const [agreedToTerms, setAgreedToTerms] = useState(false);
    const [error, setError] = useState("");
    const [loading, setLoading] = useState(false);

    useEffect(() => {
        if (isInitialized && user) navigate("/");
    }, [isInitialized, user, navigate]);

    const handleChange = (e) => {
        setForm((prev) => ({ ...prev, [e.target.name]: e.target.value }));
    };

    const passwordMismatch = 
        form.confirm.length > 0 && form.password !== form.confirm;

    const eighteenYearsAgo = new Date();
    eighteenYearsAgo.setFullYear(eighteenYearsAgo.getFullYear() - 18);
    const eighteenYearsAgoStr = eighteenYearsAgo.toISOString().split("T")[0];

    const dobError = 
        form.dob.length > 0 && new Date(form.dob) > eighteenYearsAgo;
    
    const handleSubmit = async (e) => {
        e.preventDefault();
        if (passwordMismatch || dobError) return;

        setError("");
        setLoading(true);
        try {
            const age = new Date().getFullYear() - new Date(form.dob).getFullYear();
            await userService.register(form.username, form.email, form.password, age);
            setRegistered(true);
        } catch (err) {
            setError(err.message);
        } finally {
            setLoading(false);
        }
    };

    if (registered) return (
        <div className={styles.page}>
            <div className={styles.card}>
                <div className={styles.confirmation}>
                    <div className={styles.confirmIcon} aria-hidden="true">✓</div>
                    <h1 className={styles.title}>Check your inbox</h1>
                    <p className={styles.subtitle}>
                        We sent a verification link to{" "}
                        <span className={styles.emailHighlight}>{form.email}</span>.
                        Click it to activate your account before logging in.
                    </p>
                    <p className={styles.switchText}>
                        <Link to="/login" className={styles.switchLink}>Go to login</Link>
                    </p>
                </div>
            </div>
        </div>
    );

    return (
        <div className={styles.page}>
            <div className={styles.card}>

                <div className={styles.header}>
                    <h1 className={styles.title}>Create an account</h1>
                    <p className={styles.subtitle}>
                        Join the Spanish Poker Dice platform
                    </p>
                </div>

                <form className={styles.form} onSubmit={handleSubmit} noValidate>
                    <div className={styles.field}>
                        <label className={styles.label} htmlFor="reg-username">
                            Username
                        </label>
                        <input
                            id="reg-username"
                            className={styles.input}
                            type="text"
                            name="username"
                            autoComplete="username"
                            placeholder="Username"
                            value={form.username}
                            onChange={handleChange}
                            required
                        />
                    </div>

                    <div className={styles.field}>
                        <label className={styles.label} htmlFor="reg-email">
                            Email address
                        </label>
                        <input
                            id="reg-email"
                            className={styles.input}
                            type="email"
                            name="email"
                            autoComplete="email"
                            placeholder="you@example.com"
                            value={form.email}
                            onChange={handleChange}
                            required
                        />
                    </div>

                    <div className={styles.field}>
                        <div className={styles.labelRow}>
                            <label className={styles.label} htmlFor="reg-password">
                                Password
                            </label>
                        </div>
                        <div className={styles.inputWrapper}>
                            <input
                                id="reg-password"
                                className={styles.input}
                                type={showPassword ? "text" : "password"}
                                name="password"
                                autoComplete="new-password"
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

                    <div className={styles.field}>
                        <label className={styles.label} htmlFor="reg-confirm">
                            Confirm password
                        </label>
                        <input
                            id="reg-confirm"
                            className={`${styles.input} ${passwordMismatch ? pageStyles.inputError : ""}`}
                            type={showPassword ? "text" : "password"}
                            name="confirm"
                            autoComplete="new-password"
                            placeholder="********"
                            value={form.confirm}
                            onChange={handleChange}
                            required
                        />
                        {passwordMismatch && (
                            <p className={styles.errorMsg} role="alert">
                                Passwords do not match
                            </p>
                        )}
                    </div>

                    <div className={styles.field}>
                        <label className={styles.label} htmlFor="reg-dob">
                            Date of birth
                        </label>
                        <input
                            id="reg-dob"
                            className={`${styles.input} ${dobError ? pageStyles.inputError : ""}`}
                            type="date"
                            name="dob"
                            value={form.dob}
                            onChange={handleChange}
                            max={eighteenYearsAgoStr}
                            required
                        />
                        {dobError && (
                            <p className={styles.errorMsg} role="alert">
                                You must be 18 or older to register
                            </p>
                        )}
                    </div>

                    <div className={pageStyles.checkboxField}>
                        <input
                            id="reg-terms"
                            className={pageStyles.checkbox}
                            type="checkbox"
                            checked={agreedToTerms}
                            onChange={(e) => setAgreedToTerms(e.target.checked)}
                            required
                        />
                        <label htmlFor="reg-terms" className={pageStyles.checkboxLabel}>
                            I agree to the{" "}
                            <Link to="/terms" className={styles.switchLink}>
                                Terms & Conditions
                            </Link>{" "}
                            and{" "}
                            <Link to="/privacy" className={styles.switchLink}>
                                Privacy Policy
                            </Link>
                        </label>
                    </div>

                    {error && <p className={styles.errorMsg} role="alert">{error}</p>}

                    <button
                        type="submit"
                        className={styles.submitBtn}
                        disabled={loading || passwordMismatch || dobError || !agreedToTerms}
                    >
                        {loading ? "Creating account..." : "Create account"}
                    </button>
                </form>

                <p className={styles.switchText}>
                    Already have an account?{" "}
                    <Link to="/login" className={styles.switchLink}>
                        Sign in
                    </Link>
                </p>
            </div>
        </div>
    );
}