import React, { useState } from 'react';
import { motion } from 'framer-motion';
import { Settings, RotateCcw } from 'lucide-react';
import { useSettingsContext } from '@/context/SettingsContext';
import { Button } from '@/components/ui/button';
import { useToast } from '@/components/ui/use-toast';

const GlobalSettingsPanel = () => {
  const { settings, updateSettings, resetSettings } = useSettingsContext();
  const { toast } = useToast();
  const [isExpanded, setIsExpanded] = useState(false);

  const handleChange = (field, value) => {
    updateSettings({
      ...settings,
      [field]: parseFloat(value) || 0
    });
  };

  const handleReset = () => {
    resetSettings();
    toast({
      title: 'Settings Reset',
      description: 'Global settings have been reset to defaults',
    });
  };

  // Calculate example fees for $30 product
  const examplePrice = 30;
  const exampleAmazonFees = (examplePrice * settings.referralFeePct / 100) + settings.fbaFulfillmentFee;
  const examplePPC = examplePrice * settings.ppcPctOfPrice / 100;

  return (
    <motion.div
      initial={{ opacity: 0, y: -20 }}
      animate={{ opacity: 1, y: 0 }}
      className="bg-slate-800 rounded-lg p-6 shadow-lg border border-slate-700"
    >
      <div 
        className="flex items-center justify-between cursor-pointer"
        onClick={() => setIsExpanded(!isExpanded)}
      >
        <div className="flex items-center gap-2">
          <Settings className="w-5 h-5 text-[hsl(var(--terracotta))]" />
          <h2 className="text-xl font-semibold text-white">Global Settings</h2>
        </div>
        <Button
          variant="ghost"
          size="sm"
          onClick={(e) => {
            e.stopPropagation();
            handleReset();
          }}
          className="text-amber-400 hover:text-amber-300 hover:bg-slate-700"
        >
          <RotateCcw className="w-4 h-4 mr-2" />
          Reset Defaults
        </Button>
      </div>

      {isExpanded && (
        <motion.div
          initial={{ opacity: 0, height: 0 }}
          animate={{ opacity: 1, height: 'auto' }}
          className="mt-6 grid grid-cols-1 md:grid-cols-3 gap-6"
        >
          <div>
            <label className="block text-sm font-medium text-slate-300 mb-2">
              Referral Fee (%)
            </label>
            <input
              type="number"
              min="0"
              max="100"
              step="0.1"
              value={settings.referralFeePct}
              onChange={(e) => handleChange('referralFeePct', e.target.value)}
              className="w-full px-3 py-2 bg-slate-700 border border-slate-600 rounded-md text-white focus:outline-none focus:ring-2 focus:ring-[hsl(var(--terracotta))]"
            />
            <p className="text-xs text-slate-400 mt-1">
              Amazon's commission on each sale
            </p>
          </div>

          <div>
            <label className="block text-sm font-medium text-slate-300 mb-2">
              FBA Fulfillment Fee ($)
            </label>
            <input
              type="number"
              min="0"
              step="0.1"
              value={settings.fbaFulfillmentFee}
              onChange={(e) => handleChange('fbaFulfillmentFee', e.target.value)}
              className="w-full px-3 py-2 bg-slate-700 border border-slate-600 rounded-md text-white focus:outline-none focus:ring-2 focus:ring-[hsl(var(--terracotta))]"
            />
            <p className="text-xs text-slate-400 mt-1">
              Amazon's fulfillment cost per unit
            </p>
          </div>

          <div>
            <label className="block text-sm font-medium text-slate-300 mb-2">
              PPC Cost (% of Price)
            </label>
            <input
              type="number"
              min="0"
              max="100"
              step="0.1"
              value={settings.ppcPctOfPrice}
              onChange={(e) => handleChange('ppcPctOfPrice', e.target.value)}
              className="w-full px-3 py-2 bg-slate-700 border border-slate-600 rounded-md text-white focus:outline-none focus:ring-2 focus:ring-[hsl(var(--terracotta))]"
            />
            <p className="text-xs text-slate-400 mt-1">
              Advertising cost as % of selling price
            </p>
          </div>

          <div className="md:col-span-3 bg-slate-900 rounded-lg p-4 border border-slate-700">
            <h3 className="text-sm font-semibold text-[hsl(var(--terracotta))] mb-3">Example Calculation (Product priced at ${examplePrice})</h3>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4 text-sm">
              <div>
                <p className="text-slate-400">Amazon Fees:</p>
                <p className="text-white font-mono">
                  (${examplePrice} × {settings.referralFeePct}%) + ${settings.fbaFulfillmentFee} = <span className="text-amber-400">${exampleAmazonFees.toFixed(2)}</span>
                </p>
              </div>
              <div>
                <p className="text-slate-400">PPC Cost:</p>
                <p className="text-white font-mono">
                  ${examplePrice} × {settings.ppcPctOfPrice}% = <span className="text-amber-400">${examplePPC.toFixed(2)}</span>
                </p>
              </div>
            </div>
          </div>
        </motion.div>
      )}
    </motion.div>
  );
};

export default GlobalSettingsPanel;