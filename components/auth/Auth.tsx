import * as React from 'react';
import { supabase } from '../../services/supabase';
import { useAuth } from '../../contexts/AuthContext';
import { BrandingSettings } from '../../types';

const BrandHeader: React.FC<{ branding: BrandingSettings | null }> = ({ branding }) => (
    <div className="inline-block mb-4 h-16 flex items-center justify-center">
      {branding?.logoUrl ? (
        <img src={branding.logoUrl} alt={`${branding.companyName || 'Company'} Logo`} className="max-h-16 object-contain" />
      ) : (
        <span className="font-bold text-2xl text-slate-100">{branding?.companyName || 'GPTPayroll'}</span>
      )}
    </div>
  );

export const Auth: React.FC = () => {
  const { branding } = useAuth();
  const [isLoginView, setIsLoginView] = React.useState(true);
  const [loading, setLoading] = React.useState(false);
  const [error, setError] = React.useState<string | null>(null);
  const [message, setMessage] = React.useState<string | null>(null);
  const formRef = React.useRef<HTMLFormElement>(null);

  const handleSubmit = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    setLoading(true);
    setError(null);
    setMessage(null);
    
    const formData = new FormData(e.currentTarget);
    const email = formData.get('email') as string;
    const password = formData.get('password') as string;

    try {
      if (isLoginView) {
        const { error } = await supabase.auth.signInWithPassword({ email, password });
        if (error) throw error;
        setMessage('Login successful! Redirecting...');
        // onAuthStateChange will handle redirect
      } else {
        const { error } = await supabase.auth.signUp({ 
            email, 
            password,
            options: {
                emailRedirectTo: window.location.origin
            }
        });
        if (error) throw error;
        setMessage('Check your email for the confirmation link!');
      }
    } catch (error: any) {
      setError(error.error_description || error.message);
    } finally {
      setLoading(false);
    }
  }

  return (
    <div className="flex items-center justify-center min-h-screen bg-slate-900">
      <div className="w-full max-w-md p-8 space-y-8 bg-slate-800 rounded-2xl shadow-2xl">
        <div className="text-center">
          <BrandHeader branding={branding} />
          <h2 className="text-3xl font-extrabold text-white">
            {isLoginView ? 'Sign in to your account' : 'Create a new account'}
          </h2>
          <p className="mt-2 text-sm text-slate-400">
            or{' '}
            <button
              onClick={() => {
                setIsLoginView(!isLoginView);
                setError(null);
                setMessage(null);
                formRef.current?.reset();
              }}
              className="font-medium text-emerald-500 hover:text-emerald-400"
            >
              {isLoginView ? 'create an account' : 'sign in to your account'}
            </button>
          </p>
        </div>
        <form ref={formRef} onSubmit={handleSubmit} className="mt-8 space-y-6">
          <div className="rounded-md shadow-sm">
            <div>
              <label htmlFor="email-address" className="sr-only">Email address</label>
              <input
                id="email-address"
                name="email"
                type="email"
                autoComplete="email"
                required
                className="appearance-none relative block w-full px-3 py-3 border border-slate-600 bg-slate-700 text-slate-100 placeholder-slate-400 focus:outline-none focus:ring-emerald-500 focus:border-emerald-500 focus:z-10 sm:text-sm rounded-t-md"
                placeholder="Email address"
              />
            </div>
            <div>
              <label htmlFor="password" className="sr-only">Password</label>
              <input
                id="password"
                name="password"
                type="password"
                autoComplete="current-password"
                required
                minLength={6}
                className="appearance-none relative block w-full px-3 py-3 border border-slate-600 bg-slate-700 text-slate-100 placeholder-slate-400 focus:outline-none focus:ring-emerald-500 focus:border-emerald-500 focus:z-10 sm:text-sm rounded-b-md"
                placeholder="Password (min. 6 characters)"
              />
            </div>
          </div>

          {error && <p className="text-sm text-center text-red-400 px-2">{error}</p>}
          {message && !error && <p className="text-sm text-center text-green-400 px-2">{message}</p>}

          <div>
            <button
              type="submit"
              disabled={loading}
              className="group relative w-full flex justify-center py-3 px-4 border border-transparent text-sm font-medium rounded-md text-white bg-emerald-600 hover:bg-emerald-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-offset-slate-800 focus:ring-emerald-500 disabled:bg-slate-600 disabled:cursor-not-allowed"
            >
              {loading ? 'Processing...' : (isLoginView ? 'Sign In' : 'Sign Up')}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};