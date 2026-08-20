import { useState } from 'react';
import { supabase } from '../../config/supabase';

function AuthPage() {
  const [form, setForm] = useState({ name: '', email: '', password: '' });
  const [mode, setMode] = useState('signin');
  const [message, setMessage] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);

  const handleChange = (event) => {
    setForm((current) => ({ ...current, [event.target.name]: event.target.value }));
  };

  const handleSetMode = (nextMode) => {
    if (mode !== nextMode) {
      setMode(nextMode);
      setMessage('');
    }
  };

  const handleSubmit = async (event) => {
    event.preventDefault();
    if (!supabase) {
      setMessage('Authentication is not configured yet.');
      return;
    }

    setIsSubmitting(true);
    setMessage('');

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
        setMessage(error.message);
      } else if (mode === 'signup' && !data.session) {
        setMessage('Account created. Check your email to confirm your account.');
      } else {
        setMessage(mode === 'signup' ? 'Account created successfully.' : 'Signed in successfully.');
      }
    } catch (err) {
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
                : 'border-2 border-transparent text-black/70 hover:text-black'
              }`}
          >
            Sign In
          </button>
          <button
            type="button"
            onClick={() => handleSetMode('signup')}
            className={`py-2 font-mono text-xs font-black uppercase transition-all ${mode === 'signup'
                ? 'border-2 border-black bg-white text-black shadow-[2px_2px_0px_0px_#000000]'
                : 'border-2 border-transparent text-black/70 hover:text-black'
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
          <p className="mt-1 font-sans text-xs font-bold text-black/80">
            {mode === 'signup'
              ? 'Save stats, track kanji mastery, and play 1v1.'
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
                className="h-12 w-full border-2 border-black bg-white px-3.5 font-mono text-sm font-bold text-black shadow-[3px_3px_0px_0px_#000000] placeholder:font-sans placeholder:text-xs placeholder:font-medium placeholder:text-neutral-400 focus-visible:bg-[#f3f9ff] focus:outline-none"
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
              name="email"
              type="email"
              value={form.email}
              onChange={handleChange}
              placeholder="your.email@domain.com"
              required
              className="h-12 w-full border-2 border-black bg-white px-3.5 font-mono text-sm font-bold text-black shadow-[3px_3px_0px_0px_#000000] placeholder:font-sans placeholder:text-xs placeholder:font-medium placeholder:text-neutral-400 focus-visible:bg-[#f3f9ff] focus:outline-none"
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
              name="password"
              type="password"
              value={form.password}
              onChange={handleChange}
              placeholder="••••••••"
              minLength={8}
              required
              className="h-12 w-full border-2 border-black bg-white px-3.5 font-mono text-base font-bold text-black shadow-[3px_3px_0px_0px_#000000] placeholder:font-mono placeholder:text-sm placeholder:text-neutral-400 focus-visible:bg-[#f3f9ff] focus:outline-none"
            />
          </div>

          {message && (
            <div className="border-2 border-black bg-white p-2.5 text-center font-mono text-xs font-black text-black shadow-[2px_2px_0px_0px_#000000]">
              {message}
            </div>
          )}

          {/* Primary Submit Button terminates the card */}
          <div className="pt-2">
            <button
              type="submit"
              disabled={isSubmitting}
              className="w-full border-2 border-black bg-[#A3E636] py-3.5 font-mono text-sm font-black uppercase tracking-wider text-black shadow-[4px_4px_0px_0px_#000000] transition-all hover:bg-[#b5eb5b] active:translate-x-[2px] active:translate-y-[2px] active:shadow-none disabled:opacity-50"
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