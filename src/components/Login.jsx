import React, { useState } from 'react';
import { supabase } from '../lib/supabaseClient';
import { useStore } from '../store/useStore';
import { Shield, Mail, Lock, Loader2, AlertCircle, LogIn, UserPlus } from 'lucide-react';
import { toast } from 'sonner';

export default function Login() {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [loading, setLoading] = useState(false);
  const [isSignUp, setIsSignUp] = useState(false);
  const { setSession } = useStore();

  const handleAuth = async (e) => {
    e.preventDefault();
    setLoading(true);

    try {
      if (isSignUp) {
        const { data, error } = await supabase.auth.signUp({ email, password });
        if (error) throw error;
        toast.success('Conta criada! Verifique seu e-mail para confirmar (se necessário) ou faça login.');
        setIsSignUp(false);
      } else {
        const { data, error } = await supabase.auth.signInWithPassword({ email, password });
        if (error) throw error;
        toast.success('Login realizado com sucesso!');
        // O listener no App.jsx cuidará de atualizar o store
      }
    } catch (error) {
      toast.error(error.message || 'Erro na autenticação');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-slate-950 flex items-center justify-center p-4 relative overflow-hidden">
      {/* Background Decor */}
      <div className="absolute top-0 left-0 w-full h-full opacity-20 pointer-events-none">
        <div className="absolute top-[-10%] left-[-10%] w-[40%] h-[40%] bg-blue-600 rounded-full blur-[120px]"></div>
        <div className="absolute bottom-[-10%] right-[-10%] w-[40%] h-[40%] bg-indigo-600 rounded-full blur-[120px]"></div>
      </div>

      <div className="w-full max-w-md bg-slate-900/50 backdrop-blur-xl rounded-3xl border border-slate-800 p-8 shadow-2xl relative z-10">
        <div className="text-center mb-8">
          <div className="inline-flex items-center justify-center p-4 bg-blue-600/20 rounded-2xl mb-4 border border-blue-500/30">
            <Shield className="w-10 h-10 text-blue-500" />
          </div>
          <h1 className="text-3xl font-black text-white uppercase tracking-tighter">QG DA PRF</h1>
          <p className="text-slate-400 text-sm mt-2 font-medium">Sua aprovação começa aqui. Sincronize seu progresso na nuvem.</p>
        </div>

        <form onSubmit={handleAuth} className="space-y-4">
          <div className="space-y-1.5">
            <label className="text-[10px] font-black text-slate-500 uppercase tracking-widest ml-1">E-mail Operacional</label>
            <div className="relative">
              <Mail className="absolute left-4 top-1/2 -translate-y-1/2 w-5 h-5 text-slate-500" />
              <input 
                type="email" 
                required
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                placeholder="exemplo@gmail.com"
                className="w-full bg-slate-950 border border-slate-800 rounded-xl py-3.5 pl-12 pr-4 text-white placeholder:text-slate-700 focus:ring-2 focus:ring-blue-600 outline-none transition-all font-medium"
              />
            </div>
          </div>

          <div className="space-y-1.5">
            <label className="text-[10px] font-black text-slate-500 uppercase tracking-widest ml-1">Senha de Acesso</label>
            <div className="relative">
              <Lock className="absolute left-4 top-1/2 -translate-y-1/2 w-5 h-5 text-slate-500" />
              <input 
                type="password" 
                required
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                placeholder="••••••••"
                className="w-full bg-slate-950 border border-slate-800 rounded-xl py-3.5 pl-12 pr-4 text-white placeholder:text-slate-700 focus:ring-2 focus:ring-blue-600 outline-none transition-all font-medium"
              />
            </div>
          </div>

          <button 
            type="submit" 
            disabled={loading}
            className="w-full bg-blue-600 hover:bg-blue-700 disabled:bg-slate-800 text-white font-black py-4 rounded-xl shadow-lg shadow-blue-600/20 transition-all flex items-center justify-center gap-2 mt-6 uppercase tracking-widest text-sm"
          >
            {loading ? (
              <Loader2 className="w-5 h-5 animate-spin" />
            ) : isSignUp ? (
              <><UserPlus className="w-5 h-5" /> Criar Conta de Recruta</>
            ) : (
              <><LogIn className="w-5 h-5" /> Entrar no QG</>
            )}
          </button>
        </form>

        <div className="mt-8 text-center">
          <button 
            onClick={() => setIsSignUp(!isSignUp)}
            className="text-xs font-bold text-slate-500 hover:text-blue-400 transition-colors uppercase tracking-widest"
          >
            {isSignUp ? 'Já tem uma conta? Faça Login' : 'Ainda não é recruta? Cadastre-se'}
          </button>
        </div>

        <div className="mt-8 pt-6 border-t border-slate-800/50 flex items-start gap-3">
          <AlertCircle className="w-5 h-5 text-slate-600 shrink-0" />
          <p className="text-[10px] text-slate-600 font-bold leading-relaxed uppercase">
            Atenção: Seus dados locais serão sincronizados com sua conta assim que você fizer o login pela primeira vez.
          </p>
        </div>
      </div>
    </div>
  );
}
