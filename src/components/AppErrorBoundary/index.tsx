import React, { Component, type ErrorInfo, type ReactNode } from 'react';
import type { CSSProperties } from 'react';
import { reportError } from 'src/monitoring/reportError';

interface Props {
    children: ReactNode;
}

interface State {
    hasError: boolean;
}

class AppErrorBoundary extends Component<Props, State> {
    override state: State = { hasError: false };

    static getDerivedStateFromError(): State {
        return { hasError: true };
    }

    override componentDidCatch(error: unknown, errorInfo: ErrorInfo): void {
        reportError(error, {
            source: 'AppErrorBoundary',
            operation: `render failure: ${errorInfo.componentStack.trim() || 'unknown component'}`,
        });
    }

    handleReload = (): void => {
        if (typeof window !== 'undefined') {
            window.location.reload();
        }
    };

    override render() {
        if (!this.state.hasError) {
            return this.props.children;
        }

        return (
            <div role="alert" style={styles.container}>
                <h1 style={styles.title}>Something went wrong</h1>
                <p style={styles.message}>
                    The application could not render this view. Reload to try again.
                </p>
                <button
                    aria-label="Reload application"
                    onClick={this.handleReload}
                    style={styles.button}
                    type="button"
                >
                    <span style={styles.buttonText}>Reload application</span>
                </button>
            </div>
        );
    }
}

const styles: Record<'container' | 'title' | 'message' | 'button' | 'buttonText', CSSProperties> = {
    container: {
        alignItems: 'center',
        backgroundColor: '#ffffff',
        display: 'flex',
        flex: 1,
        justifyContent: 'center',
        padding: 28,
    },
    title: {
        color: '#17172a',
        fontSize: 20,
        fontWeight: '800',
        textAlign: 'center',
    },
    message: {
        color: '#686879',
        fontSize: 14,
        marginTop: 10,
        maxWidth: 360,
        textAlign: 'center',
    },
    button: {
        backgroundColor: '#635bff',
        borderRadius: 8,
        marginTop: 18,
        padding: '11px 16px',
    },
    buttonText: {
        color: '#ffffff',
        fontSize: 14,
        fontWeight: '800',
    },
};

export default AppErrorBoundary;
