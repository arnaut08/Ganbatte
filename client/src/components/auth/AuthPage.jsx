import { useRef, useState } from 'react';
import { supabase } from '../../config/supabase';

const getCredentialField = (error) => {
  const errorText = `${error?.code ?? ''} ${error?.message ?? ''}`.toLowerCase();

  if (/user[_ -]?not[_ -]?found|email[_ -]?not[_ -]?found|email does not exist/.test(errorText)) {
    return 'email';
  }

  if (/password[_ -]?incorrect|incorrect password|invalid password/.test(errorText)) {
    return 'password';
  }

  return null;
};

function AuthPage() {
  const [form, setForm] = useState({ name: '', email: '', password: '' });
  const [mode, setMode] = useState('signin');
  const [message, setMessage] = useState('');
  const [messageType, setMessageType] = useState('error'); // 'error' | 'success'
  const [credentialField, setCredentialField] = useState(null);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const emailInputRef = useRef(null);
  const passwordInputRef = useRef(null);

  const handleChange = (event) => {
    const { name, value } = event.target;
    setForm((current) => ({ ...current, [name]: value }));
    if (credentialField === name) {
      setCredentialField(null);
    }
  };

  const handleSetMode = (nextMode) => {
    if (mode !== nextMode) {
      setMode(nextMode);
      setMessage('');
      setCredentialField(null);
    }
  };

  const handleSubmit = async (event) => {
    event.preventDefault();
    if (!supabase) {
      setMessageType('error');
      setMessage('Authentication is not configured yet.');
      return;
    }

    setIsSubmitting(true);
    setMessage('');
    setCredentialField(null);

    try {
      const response = mode === 'signup'
        ? await supabase.auth.signUp({
          email: form.email.trim(),
          password: form.password,
          options: { data: { full_name: form.name.trim() } },
        })
        : await supabase.auth.signInWithPassword({
          email: form.email.trim(),
          password: form.password,
        });

      const { data, error } = response;

      if (error) {
        setMessageType('error');
        const nextCredentialField = getCredentialField(error);
        setCredentialField(nextCredentialField);
        setMessage(error.message);
        if (nextCredentialField === 'email') {
          emailInputRef.current?.focus();
        } else if (nextCredentialField === 'password') {
          passwordInputRef.current?.focus();
        } else if (mode === 'signin') {
          setMessage('Email or password is incorrect. Please check your credentials and try again.');
          emailInputRef.current?.focus();
        }
      } else if (mode === 'signup' && !data.session) {
        setMessageType('success');
        setMessage('Account created. Check your email to confirm your account.');
      } else {
        setMessageType('success');
        setMessage(mode === 'signup' ? 'Account created successfully.' : 'Signed in successfully.');
      }
    } catch (err) {
      setMessageType('error');
      setMessage('An unexpected error occurred. Please try again.');
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <main className="flex items-center justify-center p-4">
      <div className="w-full max-w-md border-2 border-black bg-[#FFDE59] p-6 shadow-[8px_8px_0px_0px_#000000] sm:p-8">

        {/* 1. Mode Switcher Tabs */}
        <div className="mb-6 grid grid-cols-2 gap-1 border-2 border-black bg-black/10 p-1">
          <button
            type="button"
            onClick={() => handleSetMode('signin')}
            className={`py-2 font-mono text-xs font-black uppercase transition-all ${mode === 'signin'
              ? 'border-2 border-black bg-white text-black shadow-[2px_2px_0px_0px_#000000]'
              : 'border-2 border-transparent text-black/70 hover:text-black hover:translate-x-[1px] hover:translate-y-[1px]'
              }`}
          >
            Sign In
          </button>
          <button
            type="button"
            onClick={() => handleSetMode('signup')}
            className={`py-2 font-mono text-xs font-black uppercase transition-all ${mode === 'signup'
              ? 'border-2 border-black bg-white text-black shadow-[2px_2px_0px_0px_#000000]'
              : 'border-2 border-transparent text-black/70 hover:text-black hover:translate-x-[1px] hover:translate-y-[1px]'
              }`}
          >
            Create Account
          </button>
        </div>

        {/* 2. Header */}
        <div className="mb-6 text-center">
          <span className="border border-black bg-black px-2 py-0.5 font-mono text-[10px] font-black uppercase tracking-wider text-[#FFDE59]">
            {mode === 'signup' ? '// NEW CADET REGISTRATION' : '// OPERATOR ACCESS'}
          </span>
          <h1 className="mt-2 text-2xl font-black uppercase tracking-tight text-black sm:text-3xl">
            {mode === 'signup' ? 'Join Ganbatte' : 'Welcome Back'}
          </h1>
          <p className="mt-1 font-mono text-xs font-bold text-black/80">
            {mode === 'signup'
              ? 'Save stats, track kanji mastery, and study together.'
              : 'Continue your daily Japanese practice.'}
          </p>
        </div>

        {/* 3. Form */}
        <form onSubmit={handleSubmit} className="space-y-4">
          {mode === 'signup' && (
            <div className="space-y-1.5">
              <label
                htmlFor="name"
                className="font-mono text-[11px] font-black uppercase tracking-wider text-black"
              >
                DISPLAY NAME
              </label>
              <input
                id="name"
                name="name"
                type="text"
                value={form.name}
                onChange={handleChange}
                placeholder="e.g. Kenji88"
                required
                maxLength={40}
                className="h-12 w-full border-2 border-black bg-white px-3.5 font-mono text-sm font-bold text-black shadow-[3px_3px_0px_0px_#000000] placeholder:font-mono placeholder:text-xs placeholder:text-neutral-400 focus:outline-none focus:bg-[#f3f9ff]"
              />
            </div>
          )}

          <div className="space-y-1.5">
            <label
              htmlFor="email"
              className="font-mono text-[11px] font-black uppercase tracking-wider text-black"
            >
              EMAIL ADDRESS
            </label>
            <input
              id="email"
              ref={emailInputRef}
              name="email"
              type="email"
              value={form.email}
              onChange={handleChange}
              placeholder="your.email@domain.com"
              required
              aria-invalid={credentialField === 'email'}
              className={`h-12 w-full border-2 bg-white px-3.5 font-mono text-sm font-bold text-black placeholder:font-mono placeholder:text-xs placeholder:text-neutral-400 focus:outline-none ${credentialField === 'email'
                  ? 'border-[#FF6B6B] bg-[#fff5f5] shadow-[3px_3px_0px_0px_#FF6B6B]'
                  : 'border-black shadow-[3px_3px_0px_0px_#000000] focus:bg-[#f3f9ff]'
                }`}
            />
          </div>

          <div className="space-y-1.5">
            <div className="flex items-center justify-between">
              <label
                htmlFor="password"
                className="font-mono text-[11px] font-black uppercase tracking-wider text-black"
              >
                PASSWORD
              </label>
              {mode === 'signup' && (
                <span className="font-mono text-[10px] font-bold text-black/60">
                  MIN. 8 CHARS
                </span>
              )}
            </div>
            <input
              id="password"
              ref={passwordInputRef}
              name="password"
              type="password"
              value={form.password}
              onChange={handleChange}
              placeholder="••••••••"
              minLength={8}
              required
              aria-invalid={credentialField === 'password'}
              className={`h-12 w-full border-2 bg-white px-3.5 font-mono text-base font-bold text-black placeholder:font-mono placeholder:text-sm placeholder:text-neutral-400 focus:outline-none ${credentialField === 'password'
                  ? 'border-[#FF6B6B] bg-[#fff5f5] shadow-[3px_3px_0px_0px_#FF6B6B]'
                  : 'border-black shadow-[3px_3px_0px_0px_#000000] focus:bg-[#f3f9ff]'
                }`}
            />
          </div>

          {/* Alert Message Box */}
          {message && (
            <div
              role="alert"
              className="relative border-2 border-black bg-[#1a1f2c] p-3 shadow-[3px_3px_0px_0px_#000000]"
            >
              <div className="flex items-start justify-between gap-2.5">
                <div className="min-w-0 flex-1">
                  {/* Header Tag */}
                  <div className="flex items-center gap-1.5">
                    <span
                      className={`border border-black px-1.5 py-0.2 font-mono text-[9px] font-black uppercase shadow-[1px_1px_0px_0px_#000000] ${messageType === 'error'
                          ? 'bg-[#FF6B6B] text-black'
                          : 'bg-[#A3E636] text-black'
                        }`}
                    >
                      {messageType === 'error' ? '✖ ERROR' : '✔ SUCCESS'}
                    </span>
                    <span className="font-mono text-[10px] font-bold text-neutral-400">
            // AUTH_NOTICE
                    </span>
                  </div>

                  {/* Message Body */}
                  <p className="mt-1.5 font-mono text-xs font-bold leading-relaxed text-white">
                    {message}
                  </p>
                </div>

                {/* Interactive Close Button */}
                <button
                  type="button"
                  onClick={() => setMessage('')}
                  aria-label="Dismiss alert"
                  className="flex h-6 w-6 shrink-0 items-center justify-center border-2 border-black bg-[#252c3d] font-mono text-xs font-black text-neutral-300 shadow-[1.5px_1.5px_0px_0px_#000000] transition-all hover:bg-[#FF6B6B] hover:text-black hover:translate-x-[0.5px] hover:translate-y-[0.5px] active:translate-x-[1.5px] active:translate-y-[1.5px] active:shadow-none"
                >
                  ✕
                </button>
              </div>
            </div>
          )}

          {/* Primary Submit Button */}
          <div className="pt-2">
            <button
              type="submit"
              disabled={isSubmitting}
              className="w-full border-2 border-black bg-[#A3E636] py-3.5 font-mono text-sm font-black uppercase tracking-wider text-black shadow-[4px_4px_0px_0px_#000000] transition-all hover:translate-x-[1px] hover:translate-y-[1px] hover:shadow-[3px_3px_0px_0px_#000000] hover:bg-[#b5eb5b] active:translate-x-[4px] active:translate-y-[4px] active:shadow-none disabled:opacity-50 disabled:pointer-events-none"
            >
              {isSubmitting
                ? (mode === 'signup' ? 'Creating Cadet...' : 'Authenticating...')
                : (mode === 'signup' ? 'Complete Sign Up →' : 'Enter System →')}
            </button>
          </div>
        </form>
      </div>
    </main>
  );
}

export default AuthPage;