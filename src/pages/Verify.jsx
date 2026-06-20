import React, { useEffect } from 'react';
import { Link, Navigate } from 'react-router-dom';
import { motion } from 'framer-motion';
import { Mail, ArrowLeft, RefreshCw } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { useAuth } from '@/context/AuthContext';

const Verify = () => {
  const { user, checkEmailVerified, loading } = useAuth();

  // If user is not logged in, they can't verify
  if (!loading && !user) {
    return <Navigate to="/auth" replace />;
  }

  // If already verified, go to app
  if (!loading && user && checkEmailVerified()) {
    return <Navigate to="/app" replace />;
  }

  return (
    <div className="min-h-screen bg-slate-900 flex items-center justify-center p-4">
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        className="max-w-md w-full bg-slate-800 p-8 rounded-xl border border-slate-700 text-center space-y-6"
      >
        <div className="w-16 h-16 bg-[hsl(var(--terracotta))]/10 rounded-full flex items-center justify-center mx-auto">
          <Mail className="w-8 h-8 text-[hsl(var(--terracotta))]" />
        </div>
        
        <div>
          <h2 className="text-2xl font-bold text-white mb-2">Check your email</h2>
          <p className="text-slate-400">
            We've sent a verification link to 
            <br />
            <span className="text-white font-medium">{user?.email}</span>
          </p>
        </div>

        <div className="bg-slate-900/50 p-4 rounded-lg border border-slate-700 text-sm text-slate-300">
          <p>Click the link in the email to verify your account. Once verified, you can access the dashboard.</p>
        </div>

        <div className="flex flex-col gap-3">
          <Button 
            variant="outline" 
            className="w-full border-slate-600 hover:bg-slate-700 text-slate-200"
            onClick={() => window.location.reload()}
          >
            <RefreshCw className="w-4 h-4 mr-2" />
            I've Verified My Email
          </Button>

          <Link to="/auth">
            <Button variant="ghost" className="w-full text-slate-400 hover:text-white">
              <ArrowLeft className="w-4 h-4 mr-2" />
              Back to Sign In
            </Button>
          </Link>
        </div>
      </motion.div>
    </div>
  );
};

export default Verify;