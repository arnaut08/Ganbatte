import { useRef, useState } from 'react';
import type { ChangeEvent, FormEvent } from 'react';
import { supabase } from '../../config/supabase';

type AuthMode = 'signin' | 'signup' | 'forgot';
type CredentialField = 'email' | 'password' | null;
type AuthForm = { name: string; email: string; password: string };

type AuthPageProps = {
  onStartSuccessAnimation?: () => void;
  onSuccessComplete?: () => void;
};

const getCredentialField = (error: unknown): CredentialField => {
  const typedError = error as { code?: string; message?: string } | null;
  const errorText = `${typedError?.code ?? ''} ${typedError?.message ?? ''}`.toLowerCase();

  if (/user[_ -]?not[_ -]?found|email[_ -]?not[_ -]?found|email does not exist/.test(errorText)) {
    return 'email';
  }

  if (/password[_ -]?incorrect|incorrect password|invalid password/.test(errorText)) {
    return 'password';
  }

  return null;
};

export default function AuthPage({ onStartSuccessAnimation, onSuccessComplete }: AuthPageProps) {
  const [form, setForm] = useState<AuthForm>({ name: '', email: '', password: '' });
  const [mode, setMode] = useState<AuthMode>('signin');
  const [message, setMessage] = useState('');
  const [messageType, setMessageType] = useState<'error' | 'success'>('error');
  const [credentialField, setCredentialField] = useState<CredentialField>(null);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [isAccessGranted, setIsAccessGranted] = useState(false);

  const emailInputRef = useRef<HTMLInputElement>(null);
  const passwordInputRef = useRef<HTMLInputElement>(null);

  const handleChange = (event: ChangeEvent<HTMLInputElement>) => {
    const { name, value } = event.target;
    setForm((current) => ({ ...current, [name]: value }));
    if (credentialField === name) {
      setCredentialField(null);
    }
  };

  const handleSetMode = (nextMode: AuthMode) => {
    if (mode !== nextMode && !isAccessGranted) {
      setMode(nextMode);
      setMessage('');
      setCredentialField(null);
    }
  };

  const handleSubmit = async (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    if (!supabase) {
      setMessageType('error');
      setMessage('Authentication service not connected.');
      return;
    }

    setIsSubmitting(true);
    setMessage('');
    setCredentialField(null);

    try {
      if (mode === 'forgot') {
        const { error } = await supabase.auth.resetPasswordForEmail(form.email.trim(), {
          redirectTo: `${window.location.origin}`,
        });

        setIsSubmitting(false);
        if (error) {
          setMessageType('error');
          setMessage(error.message);
          setCredentialField('email');
          emailInputRef.current?.focus();
        } else {
          setMessageType('success');
          setMessage('Recovery instructions dispatched. Check your inbox for the reset link.');
        }
        return;
      }

      const response = mode === 'signup'
        ? await supabase.auth.signUp({
          email: form.email.trim(),
          password: form.password,
          options: { data: { full_name: form.name.trim() }, emailRedirectTo: window.location.origin },
        })
        : await supabase.auth.signInWithPassword({
          email: form.email.trim(),
          password: form.password,
        });

      const { data, error } = response;

      if (error) {
        setIsSubmitting(false);
        setMessageType('error');
        const nextCredentialField = getCredentialField(error);
        setCredentialField(nextCredentialField);
        setMessage(error.message);
        if (nextCredentialField === 'email') {
          emailInputRef.current?.focus();
        } else if (nextCredentialField === 'password') {
          passwordInputRef.current?.focus();
        } else if (mode === 'signin') {
          setMessage('Incorrect credentials. Please verify your email and password.');
          emailInputRef.current?.focus();
        }
      } else if (mode === 'signup' && !data.session) {
        setIsSubmitting(false);
        setMessageType('success');
        setMessage('Cadet ID issued. Please check your inbox to confirm your account.');
      } else {
        // Trigger Stamp Animation & lock form
        onStartSuccessAnimation?.();
        setIsAccessGranted(true);
        setMessageType('success');
        setMessage('Credentials verified. Access granted.');

        // Delay to allow the physical stamp slam animation to complete
        setTimeout(() => {
          onSuccessComplete?.();
        }, 1600);
      }
    } catch {
      setIsSubmitting(false);
      setMessageType('error');
      setMessage('An unexpected system error occurred. Please try again.');
    }
  };

  return (
    <main className="flex min-h-[calc(100dvh-80px)] items-center justify-center p-3 pb-20 sm:p-6 sm:pb-28">
      {/* Inline Keyframes for Circular Hanko Slam */}
      <style>{`
        @keyframes hankoStampSlam {
          0% {
            opacity: 0;
            transform: scale(2.8) rotate(-35deg);
          }
          60% {
            opacity: 0.95;
            transform: scale(0.94) rotate(-6deg);
          }
          80% {
            transform: scale(1.03) rotate(-9deg);
          }
          100% {
            opacity: 0.9;
            transform: scale(1) rotate(-8deg);
          }
        }
        .hanko-animate {
          animation: hankoStampSlam 0.42s cubic-bezier(0.2, 1, 0.4, 1) forwards;
        }
      `}</style>

      {/* 1. Physical Passport / ID Card Shell */}
      <div className="relative w-full max-w-2xl border-3 border-black bg-[#F8F7F4] p-5 shadow-[6px_6px_0px_0px_#000] sm:p-8 sm:shadow-[10px_10px_0px_0px_#000] overflow-hidden">

        {/* Background Kanji Watermark */}
        <div className="pointer-events-none absolute -bottom-6 -left-4 select-none font-mono text-7xl sm:text-9xl font-black text-black/[0.04]">
          頑張って
        </div>

        {/* 2. Top ID Header */}
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 border-b-2 border-black pb-4">
          <div className="flex items-center gap-2">
            <span className="border-2 border-black bg-[#FFDE59] px-2 py-0.5 font-mono text-[9px] sm:text-[10px] font-black uppercase text-black shadow-[1.5px_1.5px_0px_0px_#000]">
              PASSPORT ID
            </span>
            <h1 className="font-mono text-lg sm:text-2xl font-black uppercase tracking-tight text-black">
              GANBATTE LEARNER ID
            </h1>
          </div>

          <div className="font-mono text-[9px] sm:text-[10px] font-bold text-neutral-600 text-left sm:text-right">
            <div>ID: <span className="text-black font-black">頑張って-AUTH-SYS-2026</span></div>
            <div>
              STATUS:{' '}
              <span className={`font-black uppercase ${isAccessGranted ? 'text-[#DC2626]' : 'text-black'}`}>
                {isAccessGranted ? 'ACCESS_GRANTED' : mode === 'signup' ? 'CADET_ENROLL' : mode === 'forgot' ? 'RECOVERY_MODE' : 'VERIFY_OPERATOR'}
              </span>
            </div>
          </div>
        </div>

        {/* 3. Main ID Body */}
        <div className="mt-5 grid gap-5 sm:grid-cols-12 sm:gap-6">
          {/* Left: Dynamic Cadet Monogram Badge */}
          <div className="flex flex-col items-center sm:col-span-4">
            <div className="relative flex h-36 w-32 sm:h-44 sm:w-full flex-col items-center justify-between border-2 border-black bg-[#E7E5E0] p-3 shadow-[3px_3px_0px_0px_#000]">
              <div className="flex w-full items-center justify-between border-b border-black/20 pb-1 font-mono text-[8px] font-black text-neutral-600 uppercase">
                <span>CHIP://ID</span>
                <span className={`h-2 w-2 rounded-full border border-black ${isAccessGranted ? 'bg-[#DC2626] animate-pulse' : 'bg-[#FFDE59]'}`} />
              </div>

              <div className="flex h-16 w-16 sm:h-20 sm:w-20 items-center justify-center border-2 border-black bg-[#FFDE59] font-mono text-3xl sm:text-4xl font-black text-black shadow-[2px_2px_0px_0px_#000]">
                {form.name.trim().charAt(0).toUpperCase() || (mode === 'signup' ? '?' : mode === 'forgot' ? '!' : 'OP')}
              </div>

              <span className="border border-black bg-black px-2 py-0.5 font-mono text-[8px] sm:text-[9px] font-black uppercase tracking-wider text-white">
                {mode === 'signup' ? 'NEW_CADET' : mode === 'forgot' ? 'RECOVERY' : 'OPERATOR'}
              </span>
            </div>
            <span className="mt-2 font-mono text-[9px] sm:text-[10px] font-bold tracking-widest text-neutral-500 uppercase text-center">
              CADET IDENTIFIER
            </span>
          </div>

          {/* Right: Forms & Mode Toggle */}
          <div className="sm:col-span-8 space-y-4">
            {/* Mode Switcher Tabs */}
            <div className="grid grid-cols-2 gap-1.5 border-2 border-black bg-[#E7E5E0] p-1">
              <button
                type="button"
                disabled={isAccessGranted}
                onClick={() => handleSetMode('signin')}
                className={`py-1.5 sm:py-2 font-mono text-[11px] sm:text-xs font-black uppercase transition-all ${mode === 'signin'
                  ? 'border-2 border-black bg-white text-black shadow-[2px_2px_0px_0px_#000]'
                  : 'text-neutral-500 hover:text-black cursor-pointer'
                  }`}
              >
                Sign In
              </button>
              <button
                type="button"
                disabled={isAccessGranted}
                onClick={() => handleSetMode('signup')}
                className={`py-1.5 sm:py-2 font-mono text-[11px] sm:text-xs font-black uppercase transition-all ${mode === 'signup'
                  ? 'border-2 border-black bg-white text-black shadow-[2px_2px_0px_0px_#000]'
                  : 'text-neutral-500 hover:text-black cursor-pointer'
                  }`}
              >
                Create Account
              </button>
            </div>

            {/* Form Fields */}
            <form onSubmit={handleSubmit} className="space-y-3">
              {mode === 'signup' && (
                <div className="space-y-1">
                  <label
                    htmlFor="name"
                    className="font-mono text-[10px] font-black uppercase tracking-wider text-black sm:text-[11px]"
                  >
                    CADET NAME
                  </label>
                  <input
                    id="name"
                    name="name"
                    type="text"
                    disabled={isAccessGranted || isSubmitting}
                    value={form.name}
                    onChange={handleChange}
                    placeholder="e.g. Kenji88"
                    required
                    maxLength={40}
                    className="h-10 w-full border-2 border-dashed border-black bg-white px-3 font-mono text-xs font-bold text-black shadow-[2px_2px_0px_0px_#000] placeholder:font-mono placeholder:text-neutral-400 focus:border-solid focus:border-black focus:outline-none sm:text-sm"
                  />
                </div>
              )}

              <div className="space-y-1">
                <label
                  htmlFor="email"
                  className="font-mono text-[10px] font-black uppercase tracking-wider text-black sm:text-[11px]"
                >
                  EMAIL CREDENTIAL
                </label>
                <input
                  id="email"
                  ref={emailInputRef}
                  name="email"
                  type="email"
                  disabled={isAccessGranted || isSubmitting}
                  value={form.email}
                  onChange={handleChange}
                  placeholder="operator@domain.com"
                  required
                  aria-invalid={credentialField === 'email'}
                  className={`h-10 w-full border-2 bg-white px-3 font-mono text-xs font-bold text-black shadow-[2px_2px_0px_0px_#000] placeholder:font-mono placeholder:text-neutral-400 focus:outline-none sm:text-sm ${credentialField === 'email'
                    ? 'border-solid border-[#FF6B6B] bg-[#FFF1F2]'
                    : 'border-dashed border-black focus:border-solid'
                    }`}
                />
              </div>

              {mode !== 'forgot' && (
                <div className="space-y-1">
                  <div className="flex items-center justify-between">
                    <label
                      htmlFor="password"
                      className="font-mono text-[10px] font-black uppercase tracking-wider text-black sm:text-[11px]"
                    >
                      ACCESS CIPHER
                    </label>
                    <div className="flex items-center gap-3">
                      {mode === 'signup' && (
                        <span className="font-mono text-[9px] font-bold text-neutral-500">
                          MIN. 8 CHARS
                        </span>
                      )}
                      {mode === 'signin' && (
                        <button
                          type="button"
                          onClick={() => handleSetMode('forgot')}
                          className="font-mono text-[9px] font-black uppercase text-neutral-600 hover:text-black hover:underline cursor-pointer"
                        >
                          Forgot password?
                        </button>
                      )}
                    </div>
                  </div>
                  <input
                    id="password"
                    ref={passwordInputRef}
                    name="password"
                    type="password"
                    disabled={isAccessGranted || isSubmitting}
                    value={form.password}
                    onChange={handleChange}
                    placeholder="••••••••"
                    minLength={8}
                    required
                    aria-invalid={credentialField === 'password'}
                    className={`h-10 w-full border-2 bg-white px-3 font-mono text-xs font-bold text-black shadow-[2px_2px_0px_0px_#000] placeholder:font-mono placeholder:text-neutral-400 focus:outline-none sm:text-sm ${credentialField === 'password'
                      ? 'border-solid border-[#FF6B6B] bg-[#FFF1F2]'
                      : 'border-dashed border-black focus:border-solid'
                      }`}
                  />
                </div>
              )}

              {/* Passport Rejection / Verification Notice Box */}
              {message && (
                <div
                  role="alert"
                  className={`border-2 border-black p-2.5 shadow-[2px_2px_0px_0px_#000] ${messageType === 'error' ? 'bg-[#FFF1F2]' : 'bg-[#F0FDF4]'
                    }`}
                >
                  <div className="flex items-start justify-between gap-2">
                    <div className="min-w-0 flex-1">
                      <div className="flex items-center gap-1.5">
                        <span
                          className={`border border-black px-1.5 py-0.2 font-mono text-[9px] font-black uppercase ${messageType === 'error' ? 'bg-[#FF6B6B] text-black' : 'bg-[#A3E636] text-black'
                            }`}
                        >
                          {messageType === 'error' ? '✖ ACCESS REJECTED' : '✔ VERIFIED'}
                        </span>
                        <span className="font-mono text-[9px] font-bold text-neutral-500">
                          // PASSPORT_SEC_LOG
                        </span>
                      </div>
                      <p
                        className={`mt-1 font-mono text-[11px] font-black leading-relaxed ${messageType === 'error' ? 'text-[#991b1b]' : 'text-[#166534]'
                          }`}
                      >
                        {message}
                      </p>
                    </div>
                    {!isAccessGranted && (
                      <button
                        type="button"
                        onClick={() => setMessage('')}
                        aria-label="Dismiss notice"
                        className="flex h-5 w-5 shrink-0 cursor-pointer items-center justify-center border-2 border-black bg-white font-mono text-xs font-black text-black hover:bg-[#FF6B6B]"
                      >
                        ✕
                      </button>
                    )}
                  </div>
                </div>
              )}

              {/* Submit CTA Button */}
              <div className="pt-2 space-y-2">
                <button
                  type="submit"
                  disabled={isSubmitting || isAccessGranted}
                  className={`w-full cursor-pointer border-2 border-black py-3 font-mono text-xs font-black uppercase tracking-wider text-black shadow-[3px_3px_0px_0px_#000] transition-all hover:translate-x-[1px] hover:translate-y-[1px] hover:shadow-[2px_2px_0px_0px_#000] active:translate-x-[2px] active:translate-y-[2px] active:shadow-none disabled:cursor-not-allowed disabled:opacity-80 ${mode === 'forgot' ? 'bg-[#FFDE59] hover:bg-[#f6d246]' : 'bg-[#A3E636] hover:bg-[#b5eb5b]'
                    }`}
                >
                  {isAccessGranted
                    ? 'ACCESS GRANTED · REDIRECTING...'
                    : isSubmitting
                      ? mode === 'signup'
                        ? 'REGISTERING CADET...'
                        : mode === 'forgot'
                          ? 'DISPATCHING RECOVERY...'
                          : 'VALIDATING ACCESS...'
                      : mode === 'signup'
                        ? 'ISSUE PASSPORT & SIGN UP →'
                        : mode === 'forgot'
                          ? 'SEND RECOVERY INSTRUCTIONS →'
                          : 'ENTER SYSTEM →'}
                </button>

                {mode === 'forgot' && (
                  <button
                    type="button"
                    onClick={() => handleSetMode('signin')}
                    className="w-full text-center font-mono text-[10px] font-black uppercase text-neutral-600 hover:text-black cursor-pointer pt-1"
                  >
                    ← Return to Sign In
                  </button>
                )}
              </div>
            </form>
          </div>
        </div>

        {/* Circular Japanese Hanko / Verification Seal */}
        {isAccessGranted && (
          <div className="hanko-animate pointer-events-none absolute top-12 right-6 sm:top-8 sm:right-10 z-30 select-none">
            <div className="relative flex h-24 w-24 sm:h-28 sm:w-28 flex-col items-center justify-center rounded-full border-3 border-dashed border-[#DC2626] bg-[#DC2626]/[0.06] p-1 shadow-[0px_0px_1px_1px_#DC2626]">
              {/* Inner Solid Ring */}
              <div className="flex h-full w-full flex-col items-center justify-center rounded-full border-2 border-[#DC2626]">
                <span className="font-mono text-[7px] sm:text-[8px] font-black uppercase tracking-widest text-[#DC2626]">
                  GANBATTE · 2026
                </span>
                <span className="font-serif text-2xl sm:text-3xl font-black leading-none tracking-widest text-[#DC2626]">
                  承認
                </span>
                <span className="mt-0.5 font-mono text-[7px] sm:text-[8px] font-black uppercase tracking-wider text-[#DC2626]">
                  APPROVED
                </span>
              </div>
            </div>
          </div>
        )}
      </div>
    </main>
  );
}