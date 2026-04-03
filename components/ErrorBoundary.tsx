/*
 * Copyright 2026 Jeffrey Guntly (JX Holdings, LLC)
 *
 * Licensed under the Apache License, Version 2.0 (the "License");
 * you may not use this file except in compliance with the License.
 * You may obtain a copy of the License at
 *
 *     http://www.apache.org/licenses/LICENSE-2.0
 *
 * Unless required by applicable law or agreed to in writing, software
 * distributed under the License is distributed on an "AS IS" BASIS,
 * WITHOUT WARRANTIES OR CONDITIONS OF ANY KIND, either express or implied.
 * See the License for the specific language governing permissions and
 * limitations under the License.
 */

import React from 'react';

interface Props {
  children: React.ReactNode;
}

interface State {
  hasError: boolean;
  error: Error | null;
}

/**
 * Top-level error boundary. Catches unhandled render errors and shows
 * a recovery UI instead of a blank screen.
 */
export class ErrorBoundary extends React.Component<Props, State> {
  constructor(props: Props) {
    super(props);
    this.state = { hasError: false, error: null };
  }

  static getDerivedStateFromError(error: Error): State {
    return { hasError: true, error };
  }

  componentDidCatch(error: Error, info: React.ErrorInfo) {
    console.error('Uncaught render error:', error, info.componentStack);
  }

  handleReset = () => {
    this.setState({ hasError: false, error: null });
  };

  render() {
    if (!this.state.hasError) return this.props.children;

    return (
      <div className="min-h-screen flex flex-col items-center justify-center gap-4 p-6 bg-white text-slate-800">
        <h1 className="text-2xl font-black">Something went wrong</h1>
        <p className="text-sm opacity-60 max-w-sm text-center">
          An unexpected error occurred. Your data is safe — try reloading the page.
        </p>
        {this.state.error && (
          <pre className="text-xs bg-slate-100 rounded p-3 max-w-md overflow-auto opacity-70">
            {this.state.error.message}
          </pre>
        )}
        <div className="flex gap-3 mt-2">
          <button
            onClick={this.handleReset}
            className="px-4 py-2 rounded-md bg-emerald-600 text-white text-sm font-bold"
          >
            Try again
          </button>
          <button
            onClick={() => window.location.reload()}
            className="px-4 py-2 rounded-md bg-slate-200 text-slate-700 text-sm font-bold"
          >
            Reload page
          </button>
        </div>
      </div>
    );
  }
}
