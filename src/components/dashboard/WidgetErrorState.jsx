import React from 'react';
import { AlertTriangle, RefreshCw } from 'lucide-react';
import { Button } from '@/components/ui/button';

const WidgetErrorState = ({ message, onRetry }) => {
  return (
    <div className="flex flex-col items-center justify-center py-12 px-4 text-center">
      <div className="bg-red-500/10 p-4 rounded-full mb-4">
        <AlertTriangle className="w-8 h-8 text-red-500" />
      </div>
      <p className="text-red-400 mb-2">Unable to load data</p>
      <p className="text-sm text-slate-500 mb-6">{message}</p>
      {onRetry && (
        <Button 
          variant="outline" 
          className="border-red-500/30 hover:bg-red-500/10 text-red-400"
          onClick={onRetry}
        >
          <RefreshCw className="w-4 h-4 mr-2" />
          Try Again
        </Button>
      )}
    </div>
  );
};

export default WidgetErrorState;