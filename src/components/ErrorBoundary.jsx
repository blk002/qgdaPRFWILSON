import React from 'react';
import { AlertTriangle, RefreshCw } from 'lucide-react';

export default class ErrorBoundary extends React.Component {
  constructor(props) {
    super(props);
    this.state = { hasError: false, error: null };
  }

  static getDerivedStateFromError(error) {
    return { hasError: true, error };
  }

  componentDidCatch(error, errorInfo) {
    console.error("ErrorBoundary pegou um erro:", error, errorInfo);
  }

  handleReload = () => {
    window.location.reload();
  };

  render() {
    if (this.state.hasError) {
      return (
        <div className="min-h-screen bg-slate-950 text-white flex items-center justify-center p-4">
          <div className="absolute inset-0 bg-[radial-gradient(ellipse_at_top_right,_var(--tw-gradient-stops))] from-blue-900/20 via-slate-950 to-slate-950 -z-10"></div>
          <div className="w-full max-w-md bg-slate-900/60 backdrop-blur-xl border border-slate-800/80 rounded-3xl p-8 text-center shadow-[0_0_50px_rgba(30,58,138,0.15)]">
            <div className="inline-flex p-4 rounded-2xl bg-amber-500/10 border border-amber-500/20 text-amber-500 mb-6">
              <AlertTriangle className="w-10 h-10" />
            </div>
            <h1 className="text-2xl font-black uppercase tracking-tight mb-2">Algo deu errado</h1>
            <p className="text-slate-400 text-sm mb-6 leading-relaxed">
              Ocorreu um erro inesperado no aplicativo. Seus dados estão salvos em nuvem e seguros.
            </p>
            <div className="bg-slate-950/50 border border-slate-800/50 rounded-xl p-4 mb-6 text-left overflow-x-auto max-h-32 text-xs font-mono text-slate-500">
              {this.state.error?.toString()}
            </div>
            <button
              onClick={this.handleReload}
              className="w-full flex items-center justify-center gap-2 bg-gradient-to-r from-blue-600 to-indigo-600 hover:from-blue-500 hover:to-indigo-500 active:scale-95 transition-all text-white font-black text-xs uppercase tracking-wider py-4 px-6 rounded-2xl shadow-lg shadow-blue-500/10"
            >
              <RefreshCw className="w-4 h-4" />
              Recarregar Aplicativo
            </button>
          </div>
        </div>
      );
    }

    return this.props.children;
  }
}
