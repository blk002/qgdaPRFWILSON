import React, { useState } from 'react';
import { supabase } from '../lib/supabaseClient';
import { matchesLocalTestCredentials } from '../lib/localTestAuth';
import { useStore } from '../store/useStore';
import {
  Shield, Mail, Lock, Loader2, AlertCircle, LogIn, UserPlus,
  CheckCircle2, RefreshCw, Eye, EyeOff, BrainCircuit, Target, Dumbbell, Calendar
} from 'lucide-react';
import { Toaster, toast } from 'sonner';

const PILLARS = [
  {
    icon: Calendar,
    title: 'Ciclo adaptativo e ritmo real',
    desc: 'Organize blocos diários com aceleração de videoaulas e previsão de fechamento do edital.'
  },
  {
    icon: BrainCircuit,
    title: 'Revisões inteligentes FSRS',
    desc: 'Memorização espaçada integrada às questões resolvidas e erros do Raio-X Caveira.'
  },
  {
    icon: Target,
    title: 'Simulados e diagnóstico por bloco',
    desc: 'Acompanhe nota líquida padrão Cebraspe e identifique exatamente onde estão os gargalos.'
  },
  {
    icon: Dumbbell,
    title: 'Preparação física para o TAF',
    desc: 'Calculadora oficial de índices e evolução registrada até o dia da prova física.'
  }
];

function getInitialUrlFeedback() {
  if (typeof window === 'undefined') return null;
  const hash = window.location.hash || '';
  const search = window.location.search || '';
  if (hash.includes('error_description=') || search.includes('error_description=')) {
    const params = new URLSearchParams(hash.replace('#', '?') || search);
    const desc = decodeURIComponent(params.get('error_description') || 'O link de confirmação expirou ou é inválido.');
    return {
      type: 'error',
      title: 'Link de confirmação expirado ou inválido',
      message: `${desc} Digite seu e-mail abaixo e clique em "Reenviar e-mail de confirmação".`,
      showResend: true
    };
  }
  if (hash.includes('type=signup') || search.includes('type=signup')) {
    return {
      type: 'success',
      title: 'E-mail confirmado com sucesso!',
      message: 'Sua conta foi ativada. Digite seu e-mail e senha para entrar no QG.',
      showResend: false
    };
  }
  return null;
}

export default function Login() {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [loading, setLoading] = useState(false);
  const [resending, setResending] = useState(false);
  const [isSignUp, setIsSignUp] = useState(false);
  const [feedback, setFeedback] = useState(getInitialUrlFeedback);

  const translateAuthError = (error, targetEmail) => {
    const rawMsg = (error?.message || '').toLowerCase();
    if (rawMsg.includes('email not confirmed')) {
      return {
        type: 'warning',
        title: 'Confirmação de e-mail pendente',
        message: `A conta (${targetEmail}) já foi criada, mas falta confirmar o e-mail. Verifique sua caixa de entrada ou spam e clique no link de ativação antes de entrar.`,
        showResend: true
      };
    }
    if (rawMsg.includes('invalid login credentials')) {
      return {
        type: 'error',
        title: 'E-mail ou senha incorretos',
        message: 'Confira os dados digitados. Se ainda não possui cadastro com este e-mail, mude para a aba "Criar conta".',
        showResend: false
      };
    }
    if (rawMsg.includes('user already registered') || rawMsg.includes('already been registered')) {
      return {
        type: 'info',
        title: 'Este e-mail já está cadastrado',
        message: `A conta ${targetEmail} já existe. Mudamos para a aba Entrar — digite sua senha ou reenvie o link de confirmação se ainda não ativou.`,
        showResend: true
      };
    }
    if (rawMsg.includes('rate limit') || rawMsg.includes('security purposes') || error?.status === 429) {
      return {
        type: 'warning',
        title: 'Limite temporário de envios atingido',
        message: 'Muitas solicitações seguidas para este e-mail. Verifique sua caixa de entrada e spam, ou aguarde alguns minutos.',
        showResend: false
      };
    }
    if (rawMsg.includes('password should be at least') || rawMsg.includes('weak_password')) {
      return {
        type: 'error',
        title: 'Senha muito curta',
        message: 'A senha precisa ter pelo menos 6 caracteres.',
        showResend: false
      };
    }
    if (rawMsg.includes('invalid email') || rawMsg.includes('unable to validate email')) {
      return {
        type: 'error',
        title: 'E-mail inválido',
        message: 'Verifique se o endereço de e-mail foi digitado corretamente (sem espaços extras).',
        showResend: false
      };
    }
    return {
      type: 'error',
      title: 'Erro na autenticação',
      message: error?.message || 'Não foi possível concluir a operação. Tente novamente.',
      showResend: false
    };
  };

  const handleResendConfirmation = async () => {
    const cleanEmail = email.trim().toLowerCase();
    if (!cleanEmail) {
      toast.error('Digite seu e-mail no campo acima primeiro.');
      return;
    }
    setResending(true);
    try {
      const redirectUrl = `${window.location.origin}${window.location.pathname}`;
      const { error } = await supabase.auth.resend({
        type: 'signup',
        email: cleanEmail,
        options: { emailRedirectTo: redirectUrl }
      });
      if (error) throw error;
      const msg = `Novo link enviado para ${cleanEmail}. Verifique a caixa de entrada e a pasta Spam.`;
      toast.success(msg);
      setFeedback({
        type: 'success',
        title: 'E-mail de confirmação reenviado',
        message: msg,
        showResend: false
      });
    } catch (error) {
      const translated = translateAuthError(error, cleanEmail);
      toast.error(translated.message);
      setFeedback(translated);
    } finally {
      setResending(false);
    }
  };

  const handleAuth = async (e) => {
    e.preventDefault();
    const cleanEmail = email.trim().toLowerCase();
    setFeedback(null);

    if (!cleanEmail) {
      toast.error('Digite um e-mail válido.');
      return;
    }

    if (password.length < 6) {
      const msg = 'A senha deve ter pelo menos 6 caracteres.';
      toast.error(msg);
      setFeedback({
        type: 'error',
        title: 'Senha muito curta',
        message: msg,
        showResend: false
      });
      return;
    }

    setLoading(true);

    try {
      if (isSignUp) {
        const redirectUrl = `${window.location.origin}${window.location.pathname}`;
        const { data, error } = await supabase.auth.signUp({
          email: cleanEmail,
          password,
          options: { emailRedirectTo: redirectUrl }
        });
        if (error) throw error;

        if (data?.user && Array.isArray(data.user.identities) && data.user.identities.length === 0) {
          setIsSignUp(false);
          const infoObj = {
            type: 'info',
            title: 'Este e-mail já possui cadastro',
            message: `A conta ${cleanEmail} já foi registrada. Se já confirmou o e-mail, clique em "Entrar". Caso contrário, reenvie o link abaixo.`,
            showResend: true
          };
          setFeedback(infoObj);
          toast.info(infoObj.title);
          return;
        }

        if (data?.session) {
          toast.success('Conta criada com sucesso! Bem-vindo ao QG.');
          return;
        }

        setIsSignUp(false);
        const successObj = {
          type: 'success',
          title: 'Conta criada — confirme seu e-mail',
          message: `Enviamos um link de ativação para ${cleanEmail}. Abra sua caixa de entrada (ou spam), confirme e faça login.`,
          showResend: true
        };
        setFeedback(successObj);
        toast.success('Conta criada! Verifique seu e-mail para confirmar.');
      } else {
        if (matchesLocalTestCredentials(cleanEmail, password)) {
          await useStore.getState().signInLocalTest();
          toast.success('Login na conta local de teste realizado (salvo apenas neste navegador).');
          return;
        }
        const { error } = await supabase.auth.signInWithPassword({
          email: cleanEmail,
          password
        });
        if (error) throw error;
        toast.success('Login realizado com sucesso!');
      }
    } catch (error) {
      const translated = translateAuthError(error, cleanEmail);
      if (translated.title === 'Este e-mail já está cadastrado') {
        setIsSignUp(false);
      }
      setFeedback(translated);
      toast.error(translated.title);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-slate-950 text-slate-100 relative overflow-hidden flex items-center justify-center p-4 sm:p-6 lg:p-10">
      <Toaster position="top-right" richColors closeButton />
      <div className="fixed inset-0 tactical-grid pointer-events-none opacity-80" />

      <div className="relative z-10 w-full max-w-5xl grid grid-cols-1 lg:grid-cols-12 rounded-2xl border border-slate-800 bg-slate-900 overflow-hidden shadow-2xl shadow-black/40">
        {/* Coluna Esquerda: Identidade Institucional PRF (Desktop) */}
        <div className="hidden lg:flex lg:col-span-6 flex-col justify-between p-10 bg-slate-950/70 border-r border-slate-800">
          <div className="space-y-8">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 rounded-xl bg-sky-500/10 border border-sky-500/25 flex items-center justify-center">
                <Shield className="w-5 h-5 text-sky-400" />
              </div>
              <div>
                <span className="font-display text-lg font-bold tracking-wide text-white block leading-none">
                  QG DA PRF
                </span>
                <span className="text-xs text-slate-400">Centro de Comando para Aprovação</span>
              </div>
            </div>

            <div className="space-y-3">
              <h1 className="font-display text-3xl font-bold text-white leading-tight">
                Disciplina diária, revisão inteligente e foco total na aprovação.
              </h1>
              <p className="text-sm text-slate-400 leading-relaxed max-w-md">
                Centralize seu ciclo de estudos, revisões espaçadas, diagnóstico de questões e preparação para o TAF em um único painel sincronizado na nuvem.
              </p>
            </div>

            <div className="divide-y divide-slate-800/80 border-t border-slate-800/80 pt-2">
              {PILLARS.map((item) => {
                const Icon = item.icon;
                return (
                  <div key={item.title} className="py-3.5 flex items-start gap-3.5">
                    <div className="w-8 h-8 rounded-lg bg-slate-900 border border-slate-800 flex items-center justify-center shrink-0 mt-0.5">
                      <Icon className="w-4 h-4 text-sky-400" />
                    </div>
                    <div className="min-w-0">
                      <h2 className="text-sm font-semibold text-slate-100 leading-snug">{item.title}</h2>
                      <p className="text-xs text-slate-400 mt-0.5 leading-relaxed">{item.desc}</p>
                    </div>
                  </div>
                );
              })}
            </div>
          </div>

          <div className="pt-6 border-t border-slate-800/80 flex items-center justify-between text-xs text-slate-500">
            <span>Sincronização em nuvem PC e Mobile</span>
            <span className="text-amber-400/90 font-medium">Polícia Rodoviária Federal</span>
          </div>
        </div>

        {/* Coluna Direita: Formulário de Acesso */}
        <div className="lg:col-span-6 p-6 sm:p-10 flex flex-col justify-center bg-slate-900">
          {/* Header compacto no mobile */}
          <div className="flex items-center gap-3 mb-6 lg:hidden">
            <div className="w-10 h-10 rounded-xl bg-sky-500/10 border border-sky-500/25 flex items-center justify-center shrink-0">
              <Shield className="w-5 h-5 text-sky-400" />
            </div>
            <div>
              <h1 className="font-display text-xl font-bold text-white leading-none">QG DA PRF</h1>
              <p className="text-xs text-slate-400 mt-0.5">Centro de Comando para Aprovação</p>
            </div>
          </div>

          <div className="mb-6">
            <h2 className="font-display text-2xl font-bold text-white">
              {isSignUp ? 'Criar conta' : 'Acessar sua conta'}
            </h2>
            <p className="text-sm text-slate-400 mt-1">
              {isSignUp
                ? 'Cadastre seu e-mail para sincronizar estudos e revisões na nuvem.'
                : 'Entre com seu e-mail e senha para continuar de onde parou.'}
            </p>
          </div>

          {/* Controle segmentado limpo */}
          <div className="grid grid-cols-2 gap-1 p-1 bg-slate-950 border border-slate-800 rounded-xl mb-6">
            <button
              type="button"
              onClick={() => { setIsSignUp(false); setFeedback(null); }}
              className={`h-10 rounded-lg text-sm font-semibold transition-colors flex items-center justify-center gap-2 cursor-pointer ${
                !isSignUp
                  ? 'bg-slate-850 text-white border border-slate-700'
                  : 'text-slate-400 hover:text-slate-200 border border-transparent'
              }`}
            >
              <LogIn className="w-4 h-4" />
              <span>Entrar</span>
            </button>
            <button
              type="button"
              onClick={() => { setIsSignUp(true); setFeedback(null); }}
              className={`h-10 rounded-lg text-sm font-semibold transition-colors flex items-center justify-center gap-2 cursor-pointer ${
                isSignUp
                  ? 'bg-slate-850 text-white border border-slate-700'
                  : 'text-slate-400 hover:text-slate-200 border border-transparent'
              }`}
            >
              <UserPlus className="w-4 h-4" />
              <span>Criar conta</span>
            </button>
          </div>

          {feedback && (
            <div
              className={`mb-5 p-3.5 rounded-xl border text-left ${
                feedback.type === 'success'
                  ? 'bg-emerald-950/50 border-emerald-500/35 text-emerald-200'
                  : feedback.type === 'warning' || feedback.type === 'info'
                    ? 'bg-amber-950/50 border-amber-500/35 text-amber-200'
                    : 'bg-red-950/50 border-red-500/35 text-red-200'
              }`}
            >
              <div className="flex items-start gap-2.5">
                {feedback.type === 'success' ? (
                  <CheckCircle2 className="w-4 h-4 text-emerald-400 shrink-0 mt-0.5" />
                ) : (
                  <AlertCircle className="w-4 h-4 text-amber-400 shrink-0 mt-0.5" />
                )}
                <div className="space-y-1 flex-1 min-w-0">
                  <p className="text-xs font-semibold">{feedback.title}</p>
                  <p className="text-xs leading-relaxed opacity-90">{feedback.message}</p>
                  {feedback.showResend && (
                    <button
                      type="button"
                      disabled={resending}
                      onClick={handleResendConfirmation}
                      className="mt-2 inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-white/10 hover:bg-white/15 text-white text-xs font-semibold transition-colors cursor-pointer"
                    >
                      <RefreshCw className={`w-3.5 h-3.5 ${resending ? 'animate-spin' : ''}`} />
                      <span>{resending ? 'Reenviando...' : 'Reenviar confirmação'}</span>
                    </button>
                  )}
                </div>
              </div>
            </div>
          )}

          <form onSubmit={handleAuth} className="space-y-4">
            <div className="space-y-1.5">
              <label htmlFor="login-email" className="block text-xs font-medium text-slate-300">
                E-mail
              </label>
              <div className="relative">
                <Mail className="absolute left-3.5 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-500 pointer-events-none" />
                <input
                  id="login-email"
                  type="email"
                  required
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  placeholder="voce@exemplo.com"
                  className="w-full h-11 bg-slate-950 border border-slate-800 hover:border-slate-700 focus:border-sky-500 rounded-xl pl-10 pr-4 text-sm text-white placeholder:text-slate-600 outline-none transition-colors"
                />
              </div>
            </div>

            <div className="space-y-1.5">
              <div className="flex items-center justify-between">
                <label htmlFor="login-password" className="block text-xs font-medium text-slate-300">
                  Senha
                </label>
                {isSignUp && <span className="text-xs text-slate-500">Mínimo de 6 caracteres</span>}
              </div>
              <div className="relative">
                <Lock className="absolute left-3.5 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-500 pointer-events-none" />
                <input
                  id="login-password"
                  type={showPassword ? 'text' : 'password'}
                  required
                  minLength={6}
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  placeholder="••••••••"
                  className="w-full h-11 bg-slate-950 border border-slate-800 hover:border-slate-700 focus:border-sky-500 rounded-xl pl-10 pr-11 text-sm text-white placeholder:text-slate-600 outline-none transition-colors"
                />
                <button
                  type="button"
                  onClick={() => setShowPassword(!showPassword)}
                  aria-label={showPassword ? 'Ocultar senha' : 'Mostrar senha'}
                  className="absolute right-2 top-1/2 -translate-y-1/2 w-8 h-8 flex items-center justify-center rounded-lg text-slate-500 hover:text-slate-300 transition-colors cursor-pointer"
                  tabIndex={-1}
                >
                  {showPassword ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                </button>
              </div>
            </div>

            <button
              type="submit"
              disabled={loading}
              className="w-full h-11 mt-2 rounded-xl bg-sky-500 hover:bg-sky-400 disabled:bg-slate-800 disabled:text-slate-500 text-slate-950 font-semibold text-sm transition-colors flex items-center justify-center gap-2 cursor-pointer"
            >
              {loading ? (
                <Loader2 className="w-4 h-4 animate-spin" />
              ) : isSignUp ? (
                <>
                  <UserPlus className="w-4 h-4" />
                  <span>Criar conta</span>
                </>
              ) : (
                <>
                  <LogIn className="w-4 h-4" />
                  <span>Entrar no QG</span>
                </>
              )}
            </button>
          </form>

          <div className="mt-5 pt-5 border-t border-slate-800/80 text-center">
            <button
              type="button"
              onClick={() => { setIsSignUp(!isSignUp); setFeedback(null); }}
              className="text-xs font-medium text-slate-400 hover:text-sky-400 transition-colors cursor-pointer"
            >
              {isSignUp ? 'Já possui conta? Entrar agora' : 'Ainda não tem conta? Criar cadastro'}
            </button>
            <p className="text-xs text-slate-500 mt-3 leading-relaxed">
              Ao criar uma conta, confirme o link de ativação enviado ao seu e-mail (verifique também o Spam).
            </p>
          </div>
        </div>
      </div>
    </div>
  );
}
