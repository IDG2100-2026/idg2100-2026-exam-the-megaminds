import { Component } from 'react';

export default class ErrorBoundary extends Component {
    constructor(props) {
        super(props);
        this.state = { hasError: false, error: null };
    }

    static getDerivedStateFromError(error) {
        return { hasError: true, error };
    }

    componentDidCatch(error) {
        import('@/services/api').then(({ adminService }) => {
            adminService.logError({
                message: error.message,
                stack: error.stack,
                url: window.location.href,
                userAgent: navigator.userAgent
            });
        }).catch(() => {});
    }

    render() {
        if (this.state.hasError) {
            return (
                <div style={{
                    display: 'flex', flexDirection: 'column', alignItems: 'center',
                    justifyContent: 'center', minHeight: '60vh', gap: '16px', padding: '40px',
                    color: 'var(--theme-text, #E8E8E8)'
                }}>
                    <h2 style={{ fontSize: '24px', margin: 0 }}>Something went wrong</h2>
                    <p style={{ color: 'var(--theme-text-secondary, #B0B0B0)', margin: 0 }}>
                        {this.state.error?.message || 'An unexpected error occurred'}
                    </p>
                    <button
                        onClick={() => window.location.reload()}
                        style={{
                            background: 'var(--theme-accent, #5CB856)', color: 'white',
                            border: 'none', padding: '10px 24px', borderRadius: '8px',
                            cursor: 'pointer', fontWeight: '600'
                        }}
                    >
                        Reload Page
                    </button>
                </div>
            );
        }
        return this.props.children;
    }
}
