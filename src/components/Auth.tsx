import React, { useState } from 'react';
import { supabase } from '../lib/supabase';
import { Mail, Lock, User, LogIn, UserPlus } from 'lucide-react';
import './Auth.css';

const Auth: React.FC = () => {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [username, setUsername] = useState('');
  const [isSignUp, setIsSignUp] = useState(false);
  const [loading, setLoading] = useState(false);
  const [message, setMessage] = useState<{ type: 'success' | 'error'; text: string } | null>(null);

  const handleAuth = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setMessage(null);

    try {
      if (isSignUp) {
        const { data, error } = await supabase.auth.signUp({
          email,
          password,
          options: {
            data: {
              username: username || email.split('@')[0],
            },
          },
        });

        if (error) throw error;

        if (data?.user?.identities?.length === 0) {
          setMessage({ type: 'error', text: 'This email is already registered. Please sign in.' });
        } else {
          setMessage({ type: 'success', text: 'Success! Check your email to confirm your account.' });
          setEmail('');
          setPassword('');
          setUsername('');
        }
      } else {
        const { error } = await supabase.auth.signInWithPassword({
          email,
          password,
        });

        if (error) throw error;
      }
    } catch (error: any) {
      setMessage({ type: 'error', text: error.message || 'An error occurred' });
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="auth-page">
      <div className="auth-container">
        <div className="auth-header">
          <h1 className="auth-logo">⚡ Pitch Up</h1>
          <p className="auth-tagline">2 minutes. Your voice. Real moments.</p>
        </div>

        <form className="auth-form" onSubmit={handleAuth}>
          <h2 className="auth-title">{isSignUp ? 'Create Account' : 'Welcome Back'}</h2>

          {message && (
            <div className={`auth-message ${message.type}`}>
              {message.text}
            </div>
          )}

          <div className="input-group">
            <div className="input-icon">
              <Mail size={20} />
            </div>
            <input
              type="email"
              placeholder="Email address"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              required
              className="auth-input"
            />
          </div>

          {isSignUp && (
            <div className="input-group">
              <div className="input-icon">
                <User size={20} />
              </div>
              <input
                type="text"
                placeholder="Username"
                value={username}
                onChange={(e) => setUsername(e.target.value)}
                className="auth-input"
              />
            </div>
          )}

          <div className="input-group">
            <div className="input-icon">
              <Lock size={20} />
            </div>
            <input
              type="password"
              placeholder="Password"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              required
              minLength={6}
              className="auth-input"
            />
          </div>

          <button type="submit" className="auth-button" disabled={loading}>
            {loading ? (
              <span>Loading...</span>
            ) : (
              <>
                {isSignUp ? <UserPlus size={20} /> : <LogIn size={20} />}
                <span>{isSignUp ? 'Sign Up' : 'Sign In'}</span>
              </>
            )}
          </button>

          <button
            type="button"
            className="auth-switch"
            onClick={() => {
              setIsSignUp(!isSignUp);
              setMessage(null);
            }}
          >
            {isSignUp
              ? 'Already have an account? Sign in'
              : "Don't have an account? Sign up"}
          </button>
        </form>

        <div className="auth-footer">
          <p>By continuing, you agree to capture authentic moments</p>
        </div>
      </div>
    </div>
  );
};

export default Auth;