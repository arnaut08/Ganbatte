import { useState } from 'react';
import { supabase } from '../config/supabase';
import './AuthPage.css';

function AuthPage() {
  const [form, setForm] = useState({ name: '', email: '', password: '' });
  const [mode, setMode] = useState('signin');
  const [message, setMessage] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);

  const handleChange = (event) => {
    setForm((current) => ({ ...current, [event.target.name]: event.target.value }));
  };

  const handleSubmit = async (event) => {
    event.preventDefault();
    if (!supabase) {
      setMessage('Authentication is not configured yet.');
      return;
    }

    setIsSubmitting(true);
    setMessage('');
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
    setIsSubmitting(false);
  };

  return (
    <main className="auth-page">
      <section className="auth-card">
        <p className="auth-kicker">{mode === 'signup' ? 'Start your practice' : 'Welcome back'}</p>
        <h2>{mode === 'signup' ? 'Create your account' : 'Sign in to Ganbatte'}</h2>
        <p className="auth-description">
          {mode === 'signup'
            ? 'Save your progress and practice Japanese with confidence.'
            : 'Continue your Japanese practice where you left off.'}
        </p>
        <form onSubmit={handleSubmit} className="auth-form">
          {mode === 'signup' && (
            <label>
              Name
              <input name="name" value={form.name} onChange={handleChange} required maxLength={40} />
            </label>
          )}
          <label>
            Email
            <input name="email" type="email" value={form.email} onChange={handleChange} required />
          </label>
          <label>
            Password
            <input name="password" type="password" value={form.password} onChange={handleChange} minLength={8} required />
          </label>
          <button type="submit" className="btn btn-primary" disabled={isSubmitting}>
            {isSubmitting ? (mode === 'signup' ? 'Creating account...' : 'Signing in...') : mode === 'signup' ? 'Sign up' : 'Sign in'}
          </button>
        </form>
        {message && <p className="auth-message" role="status">{message}</p>}
        <button
          type="button"
          className="auth-mode-toggle"
          onClick={() => {
            setMode((current) => (current === 'signup' ? 'signin' : 'signup'));
            setMessage('');
          }}
        >
          {mode === 'signup' ? 'Already have an account? Sign in' : 'Need an account? Sign up'}
        </button>
      </section>
    </main>
  );
}

export default AuthPage;
