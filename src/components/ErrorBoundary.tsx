import { Component, type ErrorInfo, type ReactNode } from 'react';

interface Props {
  children: ReactNode;
}

interface State {
  hasError: boolean;
}

class ErrorBoundary extends Component<Props, State> {
  constructor(props: Props) {
    super(props);
    this.state = { hasError: false };
  }

  static getDerivedStateFromError(): State {
    return { hasError: true };
  }

  componentDidCatch(error: Error, errorInfo: ErrorInfo) {
    console.error('ErrorBoundary caught:', error, errorInfo);
  }

  render() {
    if (this.state.hasError) {
      return (
        <div style={{
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          height: '100vh',
          fontFamily: 'var(--font-display, "Bangers", cursive)',
          color: 'var(--comic-red, #ED1C24)',
          fontSize: '2rem',
          textAlign: 'center',
          padding: '2rem',
        }}>
          Something went wrong. Please refresh the page.
        </div>
      );
    }

    return this.props.children;
  }
}

export default ErrorBoundary;
