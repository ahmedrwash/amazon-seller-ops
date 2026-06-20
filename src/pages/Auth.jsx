import React, { useState } from 'react';
import { Navigate } from 'react-router-dom';
import { motion } from 'framer-motion';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { useAuth } from '@/context/AuthContext';
import { AlertCircle, Eye, EyeOff, Loader2, WifiOff } from 'lucide-react';
import { useToast } from '@/components/ui/use-toast';
import { getFriendlyErrorMessage } from '@/utils/networkUtils';

const Auth = () => {
  const { signIn, signUp, signInWithGoogle, user, checkEmailVerified } = useAuth();
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const { toast } = useToast();

  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [fullName, setFullName] = useState('');

  if (user && typeof checkEmailVerified === 'function' && checkEmailVerified()) {
    return <Navigate to="/dashboard" replace />;
  }
  if (user && typeof checkEmailVerified === 'function' && !checkEmailVerified()) {
    return <Navigate to="/verify" replace />;
  }

  const handleSignIn = async (e) => {
    e.preventDefault();
    setError('');
    setIsLoading(true);
    try {
      await signIn(email, password);
    } catch (err) {
      const message = err.message || 'Failed to sign in';
      setError(message);
      toast({ variant: 'destructive', title: 'Authentication Error', description: message });
    } finally {
      setIsLoading(false);
    }
  };

  const handleSignUp = async (e) => {
    e.preventDefault();
    setError('');
    if (password !== confirmPassword) { setError("Passwords don't match"); return; }
    if (password.length < 8) { setError('Password must be at least 8 characters'); return; }
    setIsLoading(true);
    try {
      await signUp(email, password, fullName);
      toast({ title: 'Account created!', description: 'Please check your email to verify your account.' });
    } catch (err) {
      let errorMessage = err.message || 'Failed to sign up';
      if (errorMessage.includes('Signups not allowed')) {
        errorMessage = 'Email signups are currently disabled. Please use Google Sign In.';
      }
      setError(errorMessage);
      toast({ variant: 'destructive', title: 'Signup Failed', description: errorMessage });
    } finally {
      setIsLoading(false);
    }
  };

  const handleGoogleSignIn = async () => {
    try {
      await signInWithGoogle();
    } catch (err) {
      const message = getFriendlyErrorMessage(err);
      setError(message);
      toast({ variant: 'destructive', title: 'Google Sign In Error', description: message });
    }
  };

  const inputClass = "bg-white border-[hsl(var(--border))] text-[hsl(var(--cinder))] placeholder:text-slate-400";

  return (
    <div className="min-h-screen bg-[hsl(var(--parchment))] flex items-center justify-center p-4">
      <motion.div
        initial={{ opacity: 0, y: 16 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.3 }}
        className="w-full max-w-md"
      >
        <div className="text-center mb-8">
          <div className="inline-flex items-center justify-center w-14 h-14 rounded-2xl bg-[hsl(var(--cinder))] mb-4">
            <span className="font-heading font-bold text-white text-lg">AS</span>
          </div>
          <h1 className="font-heading text-3xl text-[hsl(var(--cinder))]">Amazon Seller Ops</h1>
          <p className="text-slate-500 mt-1 text-sm">Sign in to access your control center</p>
        </div>

        <div className="bg-white rounded-2xl border border-[hsl(var(--border))] shadow-sm overflow-hidden">
          <div className="p-6">
            <Tabs defaultValue="signin" className="w-full">
              <TabsList className="grid w-full grid-cols-2 mb-6 bg-[hsl(var(--stone-light))] rounded-xl">
                <TabsTrigger value="signin" className="rounded-lg data-[state=active]:bg-white data-[state=active]:text-[hsl(var(--cinder))] data-[state=active]:shadow-sm">Sign In</TabsTrigger>
                <TabsTrigger value="signup" className="rounded-lg data-[state=active]:bg-white data-[state=active]:text-[hsl(var(--cinder))] data-[state=active]:shadow-sm">Sign Up</TabsTrigger>
              </TabsList>

              {error && (
                <div className="bg-red-50 border border-red-200 rounded-lg p-3 mb-5 flex items-start gap-2 text-red-600 text-sm">
                  {error.includes('connect') ? <WifiOff className="w-4 h-4 mt-0.5 shrink-0" /> : <AlertCircle className="w-4 h-4 mt-0.5 shrink-0" />}
                  <span>{error}</span>
                </div>
              )}

              <TabsContent value="signin">
                <form onSubmit={handleSignIn} className="space-y-4">
                  <div className="space-y-2">
                    <Label htmlFor="email-signin" className="text-[hsl(var(--cinder))] font-medium text-sm">Email</Label>
                    <Input id="email-signin" type="email" placeholder="name@example.com" value={email} onChange={(e) => setEmail(e.target.value)} required className={inputClass} />
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="password-signin" className="text-[hsl(var(--cinder))] font-medium text-sm">Password</Label>
                    <div className="relative">
                      <Input id="password-signin" type={showPassword ? 'text' : 'password'} placeholder="••••••••" value={password} onChange={(e) => setPassword(e.target.value)} required className={`${inputClass} pr-10`} />
                      <button type="button" onClick={() => setShowPassword(!showPassword)} className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-400 hover:text-[hsl(var(--cinder))]">
                        {showPassword ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                      </button>
                    </div>
                  </div>
                  <Button type="submit" className="w-full bg-[hsl(var(--terracotta))] hover:opacity-90 text-white font-medium h-11" disabled={isLoading}>
                    {isLoading && <Loader2 className="w-4 h-4 animate-spin mr-2" />}
                    Sign In
                  </Button>
                </form>
              </TabsContent>

              <TabsContent value="signup">
                <form onSubmit={handleSignUp} className="space-y-4">
                  <div className="space-y-2">
                    <Label htmlFor="name-signup" className="text-[hsl(var(--cinder))] font-medium text-sm">Full Name (Optional)</Label>
                    <Input id="name-signup" type="text" placeholder="John Doe" value={fullName} onChange={(e) => setFullName(e.target.value)} className={inputClass} />
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="email-signup" className="text-[hsl(var(--cinder))] font-medium text-sm">Email</Label>
                    <Input id="email-signup" type="email" placeholder="name@example.com" value={email} onChange={(e) => setEmail(e.target.value)} required className={inputClass} />
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="password-signup" className="text-[hsl(var(--cinder))] font-medium text-sm">Password</Label>
                    <div className="relative">
                      <Input id="password-signup" type={showPassword ? 'text' : 'password'} placeholder="Min 8 chars" value={password} onChange={(e) => setPassword(e.target.value)} required minLength={8} className={`${inputClass} pr-10`} />
                      <button type="button" onClick={() => setShowPassword(!showPassword)} className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-400 hover:text-[hsl(var(--cinder))]">
                        {showPassword ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                      </button>
                    </div>
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="confirm-password" className="text-[hsl(var(--cinder))] font-medium text-sm">Confirm Password</Label>
                    <Input id="confirm-password" type="password" placeholder="••••••••" value={confirmPassword} onChange={(e) => setConfirmPassword(e.target.value)} required className={inputClass} />
                  </div>
                  <Button type="submit" className="w-full bg-[hsl(var(--terracotta))] hover:opacity-90 text-white font-medium h-11" disabled={isLoading}>
                    {isLoading && <Loader2 className="w-4 h-4 animate-spin mr-2" />}
                    Create Account
                  </Button>
                </form>
              </TabsContent>

              <div className="relative my-5">
                <div className="absolute inset-0 flex items-center">
                  <span className="w-full border-t border-[hsl(var(--border))]" />
                </div>
                <div className="relative flex justify-center text-xs uppercase">
                  <span className="bg-white px-2 text-slate-400 tracking-wider">Or continue with</span>
                </div>
              </div>

              <Button type="button" variant="outline" onClick={handleGoogleSignIn} className="w-full border-[hsl(var(--border))] text-[hsl(var(--cinder))] hover:bg-[hsl(var(--stone-light))] h-11">
                <svg className="w-5 h-5 mr-2" viewBox="0 0 24 24">
                  <path d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z" fill="#4285F4" />
                  <path d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z" fill="#34A853" />
                  <path d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l2.85-2.26z" fill="#FBBC05" />
                  <path d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z" fill="#EA4335" />
                </svg>
                Continue with Google
              </Button>
            </Tabs>
          </div>
        </div>

        <p className="text-center text-xs text-slate-400 mt-6">Care in Every Detail · LARTIA Operations Platform</p>
      </motion.div>
    </div>
  );
};

export default Auth;
