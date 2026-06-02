import { useState, useEffect, useRef } from 'react';
import { useSearchParams, Link } from 'react-router';
import { userService } from '@/services/api';
import styles from "../auth.module.css";

export default function VerifyUser() {
    const [searchParams] = useSearchParams();
    const [status, setStatus] = useState('loading');
    const [resendEmail, setResentEmail] = useState('');
    const [resendMsg, setResendMsg] = useState('');
    const hasVerified = useRef(false);

    useEffect(() => {
        if (hasVerified.current) return;
        hasVerified.current = true;

        const code = searchParams.get('code');
        const verify = async () => {
            if (!code) { setStatus('error'); return; }
            try {
                await userService.verifyEmail(code);
                setStatus('success');
            } catch {
                setStatus('error');
            }
        };
        verify();
    }, [searchParams]);

    const handleResend = async (e) => {
        e.preventDefault();
        try {
            await userService.resendVerification(resendEmail);
            setResendMsg('If an unverified account exists for that email, a new link has been sent.');
        } catch {
            setResendMsg('Something went wrong. Please try again.');
        }
    };

    if (status === 'loading') return (
        <div className={styles.page}>
            <div className={styles.card}>
                <p className={styles.subtitle}>Verifying your email...</p>
            </div>
        </div>
    );

    if (status === 'success') return (
        <div className={styles.page}>
            <div className={styles.card}>
                <div className={styles.confirmation}>
                    <div className={styles.confirmIcon} aria-hidden="true">✓</div>
                    <h1 className={styles.title}>Email verified!</h1>
                    <p className={styles.subtitle}>
                        Your account is now active. You can log in and start playing.
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
                    <h1 className={styles.title}>Verification failed</h1>
                    <p className={styles.subtitle}>This link is invalid or has expired.</p>
                </div>
                <form className={styles.form} onSubmit={handleResend} noValidate>
                    <div className={styles.field}>
                        <label className={styles.label} htmlFor="resend-email">
                            Resend verification email
                        </label>
                        <input
                            id="resend-email"
                            className={styles.input}
                            type="email"
                            value={resendEmail}
                            onChange={(e) => setResentEmail(e.target.value)}
                            placeholder="your@email.com"
                            required
                        />
                    </div>
                    <button className={styles.submitBtn} type="submit">Resend link</button>
                </form>
                {resendMsg && <p className={styles.errorMsg}>{resendMsg}</p>}
                <p className={styles.switchText}>
                    <Link to="/login" className={styles.switchLink}>Back to login</Link>
                </p>
            </div>
        </div>
    );
}