import React from 'react';
import { PackageOpen } from 'lucide-react';
import { Button } from '@/components/ui/button';

const WidgetEmptyState = ({ message = "No data available", actionLabel, onAction, icon: Icon = PackageOpen }) => {
  return (
    <div className="flex flex-col items-center justify-center py-12 px-4 text-center">
      <div className="bg-slate-800 p-4 rounded-full mb-4">
        <Icon className="w-8 h-8 text-slate-500" />
      </div>
      <p className="text-slate-400 mb-6">{message}</p>
      {actionLabel && onAction && (
        <Button 
          variant="outline" 
          className="border-slate-700 hover:bg-slate-800 text-slate-300"
          onClick={onAction}
        >
          {actionLabel}
        </Button>
      )}
    </div>
  );
};

export default WidgetEmptyState;