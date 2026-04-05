import { Component } from 'react';
import type { ReactNode } from 'react';

interface Props {
  children: ReactNode;
}

interface State {
  hasError: boolean;
  message: string;
}

export default class ErrorBoundary extends Component<Props, State> {
  state: State = {
    hasError: false,
    message: '',
  };

  static getDerivedStateFromError(error: unknown): State {
    return {
      hasError: true,
      message: error instanceof Error ? error.message : 'Đã xảy ra lỗi runtime.',
    };
  }

  componentDidCatch(error: unknown, info: unknown) {
    console.error('Frontend runtime error:', error, info);
  }

  private handleReload = () => {
    window.location.reload();
  };

  render() {
    if (!this.state.hasError) {
      return this.props.children;
    }

    return (
      <div className="flex min-h-screen items-center justify-center bg-slate-950 px-4 text-slate-100">
        <div className="w-full max-w-xl rounded-3xl border border-rose-400/30 bg-rose-500/10 p-6">
          <p className="text-sm font-semibold text-rose-200">Ứng dụng gặp lỗi hiển thị</p>
          <p className="mt-3 text-sm leading-6 text-rose-100">{this.state.message}</p>
          <button
            className="mt-5 rounded-full border border-rose-300/40 px-4 py-2 text-sm font-semibold text-rose-100 hover:bg-rose-500/20"
            onClick={this.handleReload}
          >
            Tải lại trang
          </button>
        </div>
      </div>
    );
  }
}
