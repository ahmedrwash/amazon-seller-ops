import React from 'react';
import { Link } from 'react-router-dom';
import { motion } from 'framer-motion';
import { ShoppingCart, BarChart2, TrendingUp, Search } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Helmet } from 'react-helmet';

const Landing = () => {
  return (
    <div className="min-h-screen bg-slate-900 text-white flex flex-col">
      <Helmet>
        <title>Amazon Seller Operation</title>
        <meta name="description" content="Amazon Seller Operation: The professional tool for Amazon FBA sellers to find, validate, and track winning products with precision." />
      </Helmet>

      <nav className="p-6 flex justify-between items-center max-w-7xl mx-auto w-full">
        <div className="flex items-center gap-2">
          <ShoppingCart className="w-6 h-6 text-[hsl(var(--terracotta))]" />
          <span className="font-bold text-xl">Amazon Seller Operation</span>
        </div>
        <Link to="/auth">
          <Button variant="outline" className="border-[hsl(var(--terracotta))] text-[hsl(var(--terracotta))] hover:bg-teal-950">
            Sign In
          </Button>
        </Link>
      </nav>

      <main className="flex-1 flex flex-col items-center justify-center p-6 text-center max-w-5xl mx-auto w-full">
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.5 }}
          className="space-y-8"
        >
          <h1 className="text-5xl md:text-7xl font-extrabold tracking-tight bg-gradient-to-r from-teal-400 to-cyan-500 bg-clip-text text-transparent pb-2">
            Amazon Seller Operation
          </h1>
          <p className="text-xl md:text-2xl text-slate-400 max-w-3xl mx-auto leading-relaxed">
            Stop guessing. Start analyzing. The professional tool for Amazon FBA sellers to find, validate, and track winning products with precision.
          </p>
          
          <div className="pt-8">
            <Link to="/auth">
              <Button size="lg" className="bg-[hsl(var(--terracotta))] hover:bg-[hsl(var(--terracotta))] text-white px-8 py-6 text-lg rounded-full shadow-lg shadow-teal-900/50 transition-all hover:scale-105">
                Get Started Now
              </Button>
            </Link>
          </div>
        </motion.div>

        <motion.div 
          initial={{ opacity: 0, y: 40 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.2, duration: 0.5 }}
          className="grid grid-cols-1 md:grid-cols-3 gap-8 mt-20 w-full"
        >
          <div className="bg-slate-800/50 p-6 rounded-2xl border border-slate-700 backdrop-blur-sm">
            <div className="w-12 h-12 bg-[hsl(var(--terracotta))]/10 rounded-xl flex items-center justify-center mb-4 mx-auto text-[hsl(var(--terracotta))]">
              <Search className="w-6 h-6" />
            </div>
            <h3 className="text-xl font-bold mb-2">Smart Product Selection</h3>
            <p className="text-slate-400">Evaluate demand, competition, and sourcing difficulty with our structured scoring system.</p>
          </div>
          
          <div className="bg-slate-800/50 p-6 rounded-2xl border border-slate-700 backdrop-blur-sm">
            <div className="w-12 h-12 bg-purple-500/10 rounded-xl flex items-center justify-center mb-4 mx-auto text-purple-400">
              <BarChart2 className="w-6 h-6" />
            </div>
            <h3 className="text-xl font-bold mb-2">Profitability Calculator</h3>
            <p className="text-slate-400">Instantly calculate FBA fees, margins, and ROI to ensure your product is financially viable.</p>
          </div>
          
          <div className="bg-slate-800/50 p-6 rounded-2xl border border-slate-700 backdrop-blur-sm">
            <div className="w-12 h-12 bg-amber-500/10 rounded-xl flex items-center justify-center mb-4 mx-auto text-amber-400">
              <TrendingUp className="w-6 h-6" />
            </div>
            <h3 className="text-xl font-bold mb-2">Decision Engine</h3>
            <p className="text-slate-400">Get automated "Strong Winner", "Test", or "Reject" recommendations based on your data.</p>
          </div>
        </motion.div>
      </main>

      <footer className="p-6 text-center text-slate-500 text-sm">
        © {new Date().getFullYear()} Amazon Seller Operation. All rights reserved.
      </footer>
    </div>
  );
};

export default Landing;