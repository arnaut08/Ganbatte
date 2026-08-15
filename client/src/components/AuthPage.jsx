import { useState } from 'react';
import { supabase } from '../config/supabase';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';

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

  const toggleMode = () => {
    setMode((current) => (current === 'signup' ? 'signin' : 'signup'));
    setMessage('');
  };

  return (
    <main className="flex min-h-[calc(100vh-64px)] items-center justify-center p-4">
      <Card className="w-full max-w-md border-border">
        <CardHeader className="space-y-2 text-center">
          <p className="text-xs font-bold uppercase tracking-wider text-primary">
            {mode === 'signup' ? 'Start your practice' : 'Welcome back'}
          </p>
          <CardTitle className="text-2xl">
            {mode === 'signup' ? 'Create your account' : 'Sign in to Ganbatte'}
          </CardTitle>
          <CardDescription>
            {mode === 'signup'
              ? 'Save your progress and practice Japanese with confidence.'
              : 'Continue your Japanese practice where you left off.'}
          </CardDescription>
        </CardHeader>

        <form onSubmit={handleSubmit}>
          <CardContent className="space-y-4 pt-0">
            {mode === 'signup' && (
              <div className="space-y-2">
                <Label htmlFor="name">Name</Label>
                <Input
                  id="name"
                  name="name"
                  value={form.name}
                  onChange={handleChange}
                  required
                  maxLength={40}
                />
              </div>
            )}
            <div className="space-y-2">
              <Label htmlFor="email">Email</Label>
              <Input
                id="email"
                name="email"
                type="email"
                value={form.email}
                onChange={handleChange}
                required
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="password">Password</Label>
              <Input
                id="password"
                name="password"
                type="password"
                value={form.password}
                onChange={handleChange}
                minLength={8}
                required
              />
            </div>
          </CardContent>

          <CardFooter className="flex flex-col gap-3 pt-2">
            <Button type="submit" className="w-full" disabled={isSubmitting}>
              {isSubmitting
                ? (mode === 'signup' ? 'Creating account...' : 'Signing in...')
                : (mode === 'signup' ? 'Sign up' : 'Sign in')}
            </Button>
            {message && (
              <p className="text-center text-sm text-accent" role="status">
                {message}
              </p>
            )}
            <Button
              type="button"
              variant="link"
              className="text-sm"
              onClick={toggleMode}
            >
              {mode === 'signup' ? 'Already have an account? Sign in' : 'Need an account? Sign up'}
            </Button>
          </CardFooter>
        </form>
      </Card>
    </main>
  );
}

export default AuthPage;
