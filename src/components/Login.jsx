import React, { useState, useEffect } from 'react';
import { supabase } from '../lib/supabaseClient';
import { Shield, Mail, Lock, Loader2, AlertCircle, LogIn, UserPlus, CheckCircle2, RefreshCw, Eye, EyeOff } from 'lucide-react';
import { Toaster, toast } from 'sonner';

export default function Login() {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [loading, setLoading] = useState(false);
  const [resending, setResending] = useState(false);
  const [isSignUp, setIsSignUp] = useState(false);
  const [feedback, setFeedback] = useState(null);

  useEffect(() => {
    // Detecta erros ou confirmações vindos de links de confirmação de e-mail na URL
    const hash = window.location.hash || '';
    const search = window.location.search || '';
    if (hash.includes('error_description=') || search.includes('error_description=')) {
      const params = new URLSearchParams(hash.replace('#', '?') || search);
      const desc = decodeURIComponent(params.get('error_description') || 'O link de confirmação expirou ou é inválido.');
      setFeedback({
        type: 'error',
        title: 'Link de confirmação expirado ou inválido',
        message: `${desc} Digite seu e-mail abaixo e clique em "Reenviar e-mail de confirmação".`,
        showResend: true
      });
    } else if (hash.includes('type=signup') || search.includes('type=signup')) {
      setFeedback({
        type: 'success',
        title: 'E-mail confirmado com sucesso!',
        message: 'Sua conta foi ativada. Digite seu e-mail e senha para entrar no QG.',
        showResend: false
      });
    }
  }, []);

  const translateAuthError = (error, targetEmail) => {
    const rawMsg = (error?.message || '').toLowerCase();
    if (rawMsg.includes('email not confirmed')) {
      return {
        type: 'warning',
        title: 'Confirmação de e-mail pendente',
        message: `A conta (${targetEmail}) já foi criada, mas falta confirmar o e-mail! Abra seu Gmail (olhe também na pasta Spam / Lixo Eletrônico) e clique no link de confirmação. Depois, clique em "Entrar no QG".`,
        showResend: true
      };
    }
    if (rawMsg.includes('invalid login credentials')) {
      return {
        type: 'error',
        title: 'E-mail ou senha incorretos',
        message: 'Verifique se digitou a senha corretamente. Se você ainda não criou a conta com este e-mail, clique em "Ainda não é recruta? Cadastre-se" logo abaixo.',
        showResend: false
      };
    }
    if (rawMsg.includes('user already registered') || rawMsg.includes('already been registered')) {
      return {
        type: 'info',
        title: 'Este e-mail já está cadastrado!',
        message: `O e-mail ${targetEmail} já possui conta. Mudamos para a tela de Login: digite sua senha e clique em "Entrar no QG" (ou reenvie o e-mail de confirmação se ainda não tiver ativado).`,
        showResend: true
      };
    }
    if (rawMsg.includes('rate limit') || rawMsg.includes('security purposes') || error?.status === 429) {
      return {
        type: 'warning',
        title: 'Limite de tentativas de e-mail atingido',
        message: 'Muitas solicitações seguidas para este e-mail. Verifique sua Caixa de Entrada e a pasta Spam (o link já pode ter sido enviado), ou aguarde alguns minutos antes de tentar reenviar.',
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
        options: {
          emailRedirectTo: redirectUrl
        }
      });
      if (error) throw error;
      const msg = `Novo link enviado para ${cleanEmail}! Verifique a Caixa de Entrada e a pasta Spam.`;
      toast.success(msg);
      setFeedback({
        type: 'success',
        title: 'E-mail de confirmação reenviado!',
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
          options: {
            emailRedirectTo: redirectUrl
          }
        });
        if (error) throw error;

        // Quando o e-mail já existe no Supabase e a confirmação de e-mail está ativa,
        // o Supabase retorna identities = [] sem disparar erro.
        if (data?.user && Array.isArray(data.user.identities) && data.user.identities.length === 0) {
          setIsSignUp(false);
          const infoObj = {
            type: 'info',
            title: 'Este e-mail já possui cadastro!',
            message: `A conta ${cleanEmail} já foi registrada anteriormente. Se você já confirmou seu e-mail, clique em "Entrar no QG". Se não recebeu o link de ativação, clique abaixo para reenviar.`,
            showResend: true
          };
          setFeedback(infoObj);
          toast.info(infoObj.title);
          return;
        }

        // Se o Supabase já retornou sessão direta (caso confirmação de e-mail esteja desativada)
        if (data?.session) {
          toast.success('Conta criada com sucesso! Bem-vindo ao QG!');
          return;
        }

        // Caso padrão: conta criada aguardando confirmação por e-mail
        setIsSignUp(false);
        const successObj = {
          type: 'success',
          title: 'Conta criada! Confirme seu e-mail para ativar',
          message: `Enviamos um link de confirmação para ${cleanEmail}. Abra seu e-mail (verifique também a pasta Spam / Lixo Eletrônico), clique no link de ativação e depois clique em "Entrar no QG".`,
          showResend: true
        };
        setFeedback(successObj);
        toast.success('Conta criada! Verifique seu e-mail para confirmar.');
      } else {
        const { error } = await supabase.auth.signInWithPassword({
          email: cleanEmail,
          password
        });
        if (error) throw error;
        toast.success('Login realizado com sucesso!');
        // O listener no App.jsx cuidará de atualizar o store
      }
    } catch (error) {
      const translated = translateAuthError(error, cleanEmail);
      if (translated.title === 'Este e-mail já está cadastrado!') {
        setIsSignUp(false);
      }
      setFeedback(translated);
      toast.error(translated.title);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-slate-950 flex items-center justify-center p-4 relative overflow-hidden">
      <Toaster position="top-right" richColors closeButton />
      {/* Background Decor */}
      <div className="absolute top-0 left-0 w-full h-full opacity-20 pointer-events-none">
        <div className="absolute top-[-10%] left-[-10%] w-[40%] h-[40%] bg-blue-600 rounded-full blur-[120px]"></div>
        <div className="absolute bottom-[-10%] right-[-10%] w-[40%] h-[40%] bg-indigo-600 rounded-full blur-[120px]"></div>
      </div>

      <div className="w-full max-w-md bg-slate-900/50 backdrop-blur-xl rounded-3xl border border-slate-800 p-8 shadow-2xl relative z-10">
        <div className="text-center mb-6">
          <div className="inline-flex items-center justify-center p-4 bg-blue-600/20 rounded-2xl mb-4 border border-blue-500/30">
            <Shield className="w-10 h-10 text-blue-500" />
          </div>
          <h1 className="text-3xl font-black text-white uppercase tracking-tighter">QG DA PRF</h1>
          <p className="text-slate-400 text-sm mt-2 font-medium">
            {isSignUp
              ? 'Crie sua conta de recruta para salvar seu progresso na nuvem.'
              : 'Sua aprovação começa aqui. Sincronize seu progresso na nuvem.'}
          </p>
        </div>

        {/* Seletor Visível de Modo: Entrar vs Criar Conta */}
        <div className="grid grid-cols-2 gap-2 p-1 bg-slate-950/90 border border-slate-800 rounded-2xl mb-6">
          <button
            type="button"
            onClick={() => { setIsSignUp(false); setFeedback(null); }}
            className={`py-2.5 rounded-xl text-xs font-black uppercase tracking-wider transition-all flex items-center justify-center gap-1.5 ${
              !isSignUp
                ? 'bg-blue-600 text-white shadow-lg shadow-blue-600/20'
                : 'text-slate-400 hover:text-white'
            }`}
          >
            <LogIn className="w-4 h-4" /> Entrar
          </button>
          <button
            type="button"
            onClick={() => { setIsSignUp(true); setFeedback(null); }}
            className={`py-2.5 rounded-xl text-xs font-black uppercase tracking-wider transition-all flex items-center justify-center gap-1.5 ${
              isSignUp
                ? 'bg-emerald-600 text-white shadow-lg shadow-emerald-600/20'
                : 'text-slate-400 hover:text-white'
            }`}
          >
            <UserPlus className="w-4 h-4" /> Criar Conta
          </button>
        </div>

        {/* Alerta Visual de Sucesso / Erro / Confirmação */}
        {feedback && (
          <div
            className={`mb-5 p-4 rounded-2xl border text-left transition-all ${
              feedback.type === 'success'
                ? 'bg-emerald-950/60 border-emerald-500/40 text-emerald-200'
                : feedback.type === 'warning' || feedback.type === 'info'
                ? 'bg-amber-950/60 border-amber-500/40 text-amber-200'
                : 'bg-red-950/60 border-red-500/40 text-red-200'
            }`}
          >
            <div className="flex items-start gap-2.5">
              {feedback.type === 'success' ? (
                <CheckCircle2 className="w-5 h-5 text-emerald-400 shrink-0 mt-0.5" />
              ) : (
                <AlertCircle className="w-5 h-5 text-amber-400 shrink-0 mt-0.5" />
              )}
              <div className="space-y-1.5 flex-1">
                <p className="text-xs font-black uppercase tracking-wide">{feedback.title}</p>
                <p className="text-xs leading-relaxed opacity-90">{feedback.message}</p>
                {feedback.showResend && (
                  <button
                    type="button"
                    disabled={resending}
                    onClick={handleResendConfirmation}
                    className="mt-2 inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-white/10 hover:bg-white/20 text-white text-[11px] font-bold uppercase tracking-wider transition-all"
                  >
                    <RefreshCw className={`w-3.5 h-3.5 ${resending ? 'animate-spin' : ''}`} />
                    {resending ? 'Reenviando...' : 'Reenviar e-mail de confirmação'}
                  </button>
                )}
              </div>
            </div>
          </div>
        )}

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
            <label className="text-[10px] font-black text-slate-500 uppercase tracking-widest ml-1">
              Senha de Acesso {isSignUp && <span className="text-slate-600">(mín. 6 caracteres)</span>}
            </label>
            <div className="relative">
              <Lock className="absolute left-4 top-1/2 -translate-y-1/2 w-5 h-5 text-slate-500" />
              <input 
                type={showPassword ? 'text' : 'password'}
                required
                minLength={6}
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                placeholder="••••••••"
                className="w-full bg-slate-950 border border-slate-800 rounded-xl py-3.5 pl-12 pr-12 text-white placeholder:text-slate-700 focus:ring-2 focus:ring-blue-600 outline-none transition-all font-medium"
              />
              <button
                type="button"
                onClick={() => setShowPassword(!showPassword)}
                className="absolute right-4 top-1/2 -translate-y-1/2 text-slate-500 hover:text-slate-300 transition-colors"
                tabIndex={-1}
              >
                {showPassword ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
              </button>
            </div>
          </div>

          <button 
            type="submit" 
            disabled={loading}
            className={`w-full ${
              isSignUp
                ? 'bg-emerald-600 hover:bg-emerald-700 shadow-emerald-600/20'
                : 'bg-blue-600 hover:bg-blue-700 shadow-blue-600/20'
            } disabled:bg-slate-800 text-white font-black py-4 rounded-xl shadow-lg transition-all flex items-center justify-center gap-2 mt-6 uppercase tracking-widest text-sm`}
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

        <div className="mt-6 text-center">
          <button 
            type="button"
            onClick={() => { setIsSignUp(!isSignUp); setFeedback(null); }}
            className="text-xs font-bold text-slate-400 hover:text-blue-400 transition-colors uppercase tracking-widest"
          >
            {isSignUp ? 'Já tem uma conta? Faça Login' : 'Ainda não é recruta? Cadastre-se'}
          </button>
        </div>

        <div className="mt-6 pt-5 border-t border-slate-800/50 flex items-start gap-3">
          <AlertCircle className="w-5 h-5 text-slate-600 shrink-0" />
          <p className="text-[10px] text-slate-500 font-bold leading-relaxed uppercase">
            Ao criar uma nova conta, verifique o link de ativação enviado para o seu e-mail (inclusive na pasta Spam).
          </p>
        </div>
      </div>
    </div>
  );
}
