import { useState } from 'react';
import { useSearchParams, Link } from 'react-router';
import { userService } from '@/services/api';
import styles from '../auth.module.css';

export default function ResetPassword() {
    const [searchParams] = useSearchParams();
    const code = searchParams.get('code');

    const [pwd, setPwd] = useState('');
    const [confirmPwd, setConfirmPwd] = useState('');
    const [showPwd, setShowPwd] = useState(false);
    const [status, setStatus] = useState('idle'); // 'idle' | 'success'
    const [errorMsg, setErrorMsg] = useState('');
    
    if (!code) {
        return (
            <div className={styles.page}>
                <div className={styles.card}>
                    <div className={styles.header}>
                        <h1 className={styles.title}>Invalid link</h1>
                        <p className={styles.subtitle}>
                            This reset link is missing its verification code.
                        </p>
                    </div>
                    <p className={styles.switchText}>
                        <Link to="/forgot-password" className={styles.switchLink}>
                            Request a new link
                        </Link>
                    </p>
                </div>
            </div>
        );
    }

    if (status === 'success') {
        return (
            <div className={styles.page}>
                <div className={styles.card}>
                    <div className={styles.confirmation}>
                        <div className={styles.confirmIcon} aria-hidden='true'>✓</div>
                        <h1 className={styles.title}>Password updated!</h1>
                        <p className={styles.subtitle}>
                            Your password has been changed. You can now log in with your new password.
                        </p>
                        <p className={styles.switchText}>
                            <Link to="/login" className={styles.switchLink}>Go to login</Link>
                        </p>
                    </div>
                </div>
            </div>
        );
    }

    const handleSubmit = async (e) => {
        e.preventDefault();
        setErrorMsg('');
    
        if (pwd !== confirmPwd) {
            setErrorMsg('Passwords do not match');
            return;
        }

        try {
            await userService.resetPassword(code, pwd);
            setStatus('success');
        } catch (err) {
            setErrorMsg(err.message || 'Something went wrong. The link may have expired.');
        }
    };

    return (
        <div className={styles.page}>
            <div className={styles.card}>
                <div className={styles.header}>
                    <h1 className={styles.title}>Reset your password</h1>
                    <p className={styles.subtitle}>Enter a new password for your account.</p>
                </div>

                <form className={styles.form} onSubmit={handleSubmit} noValidate>
                    <div className={styles.field}>
                        <label className={styles.label} htmlFor='new-pwd'>
                            New password
                        </label>
                        <div className={styles.inputWrapper}>
                            <input
                                id='new-pwd'
                                className={styles.input}
                                type={showPwd ? 'text' : 'password'}
                                value={pwd}
                                onChange={(e) => setPwd(e.target.value)}
                                autoComplete='new-password'
                                placeholder='Min. 8 characters with letters and numbers'
                                required
                            />
                            <button
                                type='button'
                                className={styles.revealBtn}
                                onClick={() => setShowPwd((v) => !v)}
                            >
                                {showPwd ? 'Hide' : 'Show'}
                            </button>
                        </div>
                    </div>

                    <div className={styles.field}>
                        <label className={styles.label} htmlFor='confirm-pwd'>
                            Confirm password
                        </label>
                        <input
                            id='confirm-pwd'
                            className={styles.input}
                            type={showPwd ? 'text' : 'password'}
                            value={confirmPwd}
                            onChange={(e) => setConfirmPwd(e.target.value)}
                            autoComplete='new-password'
                            placeholder='Repeat your new password'
                            required
                        />
                    </div>

                    {errorMsg && <p className={styles.errorMsg}>{errorMsg}</p>}

                    <button type='submit' className={styles.submitBtn}>
                        Set new password
                    </button>
                </form>

                <p className={styles.switchText}>
                    <Link to='/login' className={styles.switchLink}>Back to login</Link>
                </p>
            </div>
        </div>
    );
    
}