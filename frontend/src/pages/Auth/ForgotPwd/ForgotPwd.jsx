import { useState, useEffect } from "react";
import { Link, useNavigate } from "react-router-dom";
import { useAppContext } from "@/context/AppContext";
import { userService } from "@/services/api";
import styles from "../auth.module.css";

export default function ForgotPwd (){
    const navigate = useNavigate();
    const { user, isInitialized } = useAppContext();
    const [email, setEmail] = useState("");
    const [submitted, setSubmitted] = useState(false);

    useEffect(() => {
        if (isInitialized && user) navigate("/");
    }, [isInitialized, user, navigate]);

    const handleSubmit = async (e) => {
        e.preventDefault();
        await userService.forgotPassword(email);
        setSubmitted(true);
    };

    return (
        <div className={styles.page}>
            <div className={styles.card}>

                {submitted ? (
                    <div className={styles.confirmation}>
                        <div className={styles.confirmIcon} aria-hidden="true">✓</div>
                        <h1 className={styles.title}>Check your inbox</h1>
                        <p className={styles.subtitle}>
                            If an account exists for{" "}
                            <span className={styles.emailHighlight}>{email}</span>, you will
                            receive a reset link within a few minutes.
                        </p>
                        <p className={styles.switchText} style={{ marginTop: "2rem" }}>
                            <Link to="/login" className={styles.switchLink}>
                              ← Back to sign in  
                            </Link>
                        </p>
                    </div>
                ) : (
                    <>
                        <div className={styles.header}>
                            <h1 className={styles.title}>Forgot your password?</h1>
                            <p className={styles.subtitle}>
                                Enter your email and we'll send you a reset link.
                            </p>
                        </div>

                        <form className={styles.form} onSubmit={handleSubmit} noValidate>
                            <div className={styles.field}>
                                <label className={styles.label} htmlFor="forgot-email">
                                    Email address
                                </label>
                                <input
                                    id="forgot-email"
                                    className={styles.input}
                                    type="email"
                                    name="email"
                                    autoComplete="email"
                                    placeholder="you@example.com"
                                    value={email}
                                    onChange={(e) => setEmail(e.target.value)}
                                    required
                                />
                            </div>

                            <button type="submit" className={styles.submitBtn}>
                                Send reset link
                            </button>
                        </form>

                        <p className={styles.switchText}>
                            Remembered it?{" "}
                            <Link to="/login" className={styles.switchLink}>
                                Back to sign in
                            </Link>
                        </p>
                    </>
                )}
            </div>
        </div>
    );
};