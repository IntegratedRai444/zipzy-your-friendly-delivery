import React, { useState, useEffect } from 'react';
import { useNavigate, useSearchParams } from 'react-router-dom';
import { useAuth } from '@/contexts/AuthContext';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { toast } from 'sonner';
import { Package, Mail, Lock, ArrowRight, Shield, Eye, EyeOff, ArrowLeft, HeartHandshake, User } from 'lucide-react';
import { z } from 'zod';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";

const emailSchema = z.string().email('Please enter a valid email address');
const passwordSchema = z.string().min(6, 'Password must be at least 6 characters');

type AuthMode = 'login' | 'signup' | 'forgot' | 'reset';

const Auth: React.FC = () => {
  const navigate = useNavigate();
  const [searchParams] = useSearchParams();
  const { user, signIn, signUp, signInWithGoogle, resetPassword, updatePassword, setIsPartner } = useAuth();
  const [mode, setMode] = useState<AuthMode>('login');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [loading, setLoading] = useState(false);
  const [googleLoading, setGoogleLoading] = useState(false);
  const [showPartnerModal, setShowPartnerModal] = useState(false);
  const [isProcessingAuth, setIsProcessingAuth] = useState(false);

  useEffect(() => {
    // Check if this is a password reset callback
    const resetMode = searchParams.get('mode');
    if (resetMode === 'reset') {
      setMode('reset');
    }
  }, [searchParams]);

  useEffect(() => {
    // Only auto-redirect if NOT showing the partner selection modal AND not currently processing a login
    if (user && mode !== 'reset' && !showPartnerModal && !isProcessingAuth) {
      navigate('/');
    }
  }, [user, navigate, mode, showPartnerModal, isProcessingAuth]);

  const validateEmail = () => {
    try {
      emailSchema.parse(email);
      return true;
    } catch (err) {
      if (err instanceof z.ZodError) {
        toast.error(err.errors[0].message);
      }
      return false;
    }
  };

  const validateForm = () => {
    if (!validateEmail()) return false;

    try {
      passwordSchema.parse(password);
    } catch (err) {
      if (err instanceof z.ZodError) {
        toast.error(err.errors[0].message);
        return false;
      }
    }

    if ((mode === 'signup' || mode === 'reset') && password !== confirmPassword) {
      toast.error('Passwords do not match');
      return false;
    }

    return true;
  };

  const handlePartnerChoice = (choice: boolean) => {
    setIsPartner(choice);
    setShowPartnerModal(false);
    navigate('/');
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (mode === 'forgot') {
      if (!validateEmail()) return;
      
      setLoading(true);
      setIsProcessingAuth(true);
      const { error } = await resetPassword(email);
      setLoading(false);
      setIsProcessingAuth(false);

      if (error) {
        toast.error(error.message);
        return;
      }

      toast.success('Password reset email sent! Check your inbox.');
      setMode('login');
      return;
    }

    if (mode === 'reset') {
      try {
        passwordSchema.parse(password);
      } catch (err) {
        if (err instanceof z.ZodError) {
          toast.error(err.errors[0].message);
          return;
        }
      }

      if (password !== confirmPassword) {
        toast.error('Passwords do not match');
        return;
      }

      setLoading(true);
      setIsProcessingAuth(true);
      const { error } = await updatePassword(password);
      setLoading(false);
      setIsProcessingAuth(false);

      if (error) {
        toast.error(error.message);
        return;
      }

      toast.success('Password updated successfully!');
      navigate('/');
      return;
    }

    if (!validateForm()) return;

    setLoading(true);
    setIsProcessingAuth(true);

    if (mode === 'login') {
      const { error } = await signIn(email.trim(), password);
      
      if (error) {
        setLoading(false);
        setIsProcessingAuth(false);
        if (error.message.includes('Invalid login credentials')) {
          toast.error('Invalid email or password');
        } else {
          toast.error(error.message);
        }
        return;
      }

      setShowPartnerModal(true);
      setIsProcessingAuth(false);
      toast.success('Welcome back!');
    } else {
      const { error } = await signUp(email.trim(), password);
      
      if (error) {
        setLoading(false);
        setIsProcessingAuth(false);
        if (error.message.includes('already registered')) {
          toast.error('This email is already registered. Please login instead.');
          setMode('login');
        } else {
          toast.error(error.message);
        }
        return;
      }

      setShowPartnerModal(true);
      setIsProcessingAuth(false);
      toast.success('Account created successfully!');
    }
  };

  const handleGoogleLogin = async () => {
    setGoogleLoading(true);
    const { error } = await signInWithGoogle();
    setGoogleLoading(false);
    
    if (error) {
      toast.error(error.message);
    }
  };

  const getTitle = () => {
    switch (mode) {
      case 'login': return 'Welcome Back';
      case 'signup': return 'Create Account';
      case 'forgot': return 'Forgot Password';
      case 'reset': return 'Reset Password';
    }
  };

  const getSubtitle = () => {
    switch (mode) {
      case 'login': return 'Enter your credentials to access your account';
      case 'signup': return 'Sign up to request items or become a partner';
      case 'forgot': return 'Enter your email to receive a reset link';
      case 'reset': return 'Enter your new password';
    }
  };

  return (
    <div className="min-h-screen bg-background flex">
      {/* Partner Selection Modal */}
      <Dialog open={showPartnerModal} onOpenChange={setShowPartnerModal}>
        <DialogContent className="sm:max-w-md bg-background/95 backdrop-blur-xl border-border/50">
          <DialogHeader>
            <DialogTitle className="text-2xl font-display font-bold text-center">Become a Zipzy Partner</DialogTitle>
            <DialogDescription className="text-center text-muted-foreground pt-2">
              Earn rewards by helping others with deliveries or small campus tasks.
            </DialogDescription>
          </DialogHeader>
          <div className="grid grid-cols-1 gap-4 py-6">
            <Button 
              onClick={() => handlePartnerChoice(true)}
              className="h-20 flex flex-col items-center justify-center gap-2 group hover:scale-[1.02] transition-all"
            >
              <HeartHandshake className="w-6 h-6 group-hover:animate-pulse" />
              <div className="flex flex-col">
                <span className="font-bold">Become Partner</span>
                <span className="text-xs font-normal opacity-70">I want to deliver and earn</span>
              </div>
            </Button>
            <Button 
              variant="outline"
              onClick={() => handlePartnerChoice(false)}
              className="h-20 flex flex-col items-center justify-center gap-2 hover:bg-muted/50 hover:scale-[1.02] transition-all"
            >
              <User className="w-6 h-6" />
              <div className="flex flex-col">
                <span className="font-bold">Continue as User</span>
                <span className="text-xs font-normal opacity-70">I just want to request items</span>
              </div>
            </Button>
          </div>
        </DialogContent>
      </Dialog>

      {/* Left Panel - Branding */}
      <div className="hidden lg:flex lg:w-1/2 bg-foreground relative overflow-hidden">
        {/* Abstract shapes */}
        <div className="absolute inset-0">
          <div className="absolute top-20 left-20 w-64 h-64 rounded-full bg-primary/20 blur-3xl" />
          <div className="absolute bottom-40 right-10 w-80 h-80 rounded-full bg-primary/10 blur-3xl" />
        </div>
        
        <div className="relative z-10 flex flex-col justify-between p-12 text-background">
          <div className="flex items-center gap-3">
            <div className="p-2 bg-primary rounded-xl">
              <Package className="w-6 h-6 text-primary-foreground" />
            </div>
            <span className="text-2xl font-display font-bold">Zipzy</span>
          </div>
          
          <div className="space-y-6">
            <h1 className="text-4xl md:text-5xl font-display font-bold leading-tight">
              Want it <span className="italic">there</span>,<br />
              but <span className="italic text-primary">can't</span> go?
            </h1>
            <p className="text-lg text-background/70 max-w-md">
              Someone else is already heading there. They can buy it and bring it for you.
            </p>
          </div>
          
          <div className="flex items-center gap-4 text-sm text-background/60">
            <Shield className="w-5 h-5" />
            <span>Your data is encrypted and secure</span>
          </div>
        </div>
      </div>

      {/* Right Panel - Auth Form */}
      <div className="flex-1 flex items-center justify-center p-8">
        <div className="w-full max-w-md space-y-8">
          {/* Mobile Logo */}
          <div className="lg:hidden flex items-center justify-center gap-3 mb-8">
            <div className="p-2 bg-primary rounded-xl">
              <Package className="w-6 h-6 text-primary-foreground" />
            </div>
            <span className="text-2xl font-display font-bold">Zipzy</span>
          </div>

          {/* Back button for forgot/reset */}
          {(mode === 'forgot' || mode === 'reset') && (
            <button
              type="button"
              onClick={() => setMode('login')}
              className="flex items-center gap-2 text-sm text-muted-foreground hover:text-foreground transition-colors"
            >
              <ArrowLeft className="w-4 h-4" />
              Back to login
            </button>
          )}

          <div className="text-center space-y-2">
            <h2 className="text-3xl font-display font-bold">{getTitle()}</h2>
            <p className="text-muted-foreground">{getSubtitle()}</p>
          </div>

          {/* Mode Toggle - Only for login/signup */}
          {(mode === 'login' || mode === 'signup') && (
            <div className="flex bg-muted rounded-xl p-1">
              <button
                type="button"
                onClick={() => setMode('login')}
                className={`flex-1 py-2.5 text-sm font-medium rounded-lg transition-all ${
                  mode === 'login' 
                    ? 'bg-background text-foreground shadow-sm' 
                    : 'text-muted-foreground hover:text-foreground'
                }`}
              >
                Login
              </button>
              <button
                type="button"
                onClick={() => setMode('signup')}
                className={`flex-1 py-2.5 text-sm font-medium rounded-lg transition-all ${
                  mode === 'signup' 
                    ? 'bg-background text-foreground shadow-sm' 
                    : 'text-muted-foreground hover:text-foreground'
                }`}
              >
                Sign Up
              </button>
            </div>
          )}

          <form onSubmit={handleSubmit} className="space-y-5">
            {/* Email field - not shown for reset */}
            {mode !== 'reset' && (
              <div className="space-y-2">
                <Label htmlFor="email">Email</Label>
                <div className="relative">
                  <Mail className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-muted-foreground" />
                  <Input
                    id="email"
                    type="email"
                    placeholder="you@example.com"
                    value={email}
                    onChange={(e) => setEmail(e.target.value)}
                    className="pl-11 h-12"
                    required
                  />
                </div>
              </div>
            )}

            {/* Password field - not shown for forgot */}
            {mode !== 'forgot' && (
              <div className="space-y-2">
                <Label htmlFor="password">
                  {mode === 'reset' ? 'New Password' : 'Password'}
                </Label>
                <div className="relative">
                  <Lock className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-muted-foreground" />
                  <Input
                    id="password"
                    type={showPassword ? 'text' : 'password'}
                    placeholder="••••••••"
                    value={password}
                    onChange={(e) => setPassword(e.target.value)}
                    className="pl-11 pr-11 h-12"
                    required
                  />
                  <button
                    type="button"
                    onClick={() => setShowPassword(!showPassword)}
                    className="absolute right-3 top-1/2 -translate-y-1/2 text-muted-foreground hover:text-foreground transition-colors"
                  >
                    {showPassword ? <EyeOff className="w-5 h-5" /> : <Eye className="w-5 h-5" />}
                  </button>
                </div>
              </div>
            )}

            {/* Confirm password - signup and reset only */}
            {(mode === 'signup' || mode === 'reset') && (
              <div className="space-y-2">
                <Label htmlFor="confirmPassword">Confirm Password</Label>
                <div className="relative">
                  <Lock className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-muted-foreground" />
                  <Input
                    id="confirmPassword"
                    type={showPassword ? 'text' : 'password'}
                    placeholder="••••••••"
                    value={confirmPassword}
                    onChange={(e) => setConfirmPassword(e.target.value)}
                    className="pl-11 h-12"
                    required
                  />
                </div>
              </div>
            )}

            {/* Forgot password link */}
            {mode === 'login' && (
              <div className="text-right">
                <button
                  type="button"
                  onClick={() => setMode('forgot')}
                  className="text-sm text-primary hover:underline"
                >
                  Forgot password?
                </button>
              </div>
            )}

            <Button 
              type="submit" 
              className="w-full h-12 text-base font-medium"
              disabled={loading}
            >
              {loading ? (
                <div className="animate-spin rounded-full h-5 w-5 border-b-2 border-primary-foreground" />
              ) : (
                <>
                  {mode === 'login' && 'Login'}
                  {mode === 'signup' && 'Create Account'}
                  {mode === 'forgot' && 'Send Reset Link'}
                  {mode === 'reset' && 'Update Password'}
                  <ArrowRight className="ml-2 w-5 h-5" />
                </>
              )}
            </Button>
          </form>

          {/* Google OAuth - only for login/signup */}
          {(mode === 'login' || mode === 'signup') && (
            <>
              <div className="relative">
                <div className="absolute inset-0 flex items-center">
                  <span className="w-full border-t border-border" />
                </div>
                <div className="relative flex justify-center text-xs uppercase">
                  <span className="bg-background px-2 text-muted-foreground">Or continue with</span>
                </div>
              </div>

              <Button
                type="button"
                variant="outline"
                className="w-full h-12 text-base font-medium"
                onClick={handleGoogleLogin}
                disabled={googleLoading}
              >
                {googleLoading ? (
                  <div className="animate-spin rounded-full h-5 w-5 border-b-2 border-foreground" />
                ) : (
                  <>
                    <svg className="w-5 h-5 mr-2" viewBox="0 0 24 24">
                      <path
                        fill="currentColor"
                        d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z"
                      />
                      <path
                        fill="currentColor"
                        d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z"
                      />
                      <path
                        fill="currentColor"
                        d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l2.85-2.22.81-.62z"
                      />
                      <path
                        fill="currentColor"
                        d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z"
                      />
                    </svg>
                    Continue with Google
                  </>
                )}
              </Button>
            </>
          )}

          <p className="text-center text-xs text-muted-foreground">
            By continuing, you agree to our{' '}
            <a href="#" className="underline hover:text-foreground">Terms of Service</a>
            {' '}and{' '}
            <a href="#" className="underline hover:text-foreground">Privacy Policy</a>
          </p>
        </div>
      </div>
    </div>
  );
};

export default Auth;
