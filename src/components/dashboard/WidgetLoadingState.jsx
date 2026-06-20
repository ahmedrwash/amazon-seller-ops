import React from 'react';

const WidgetLoadingState = () => {
  return (
    <div className="p-4 space-y-4 animate-pulse">
      {[1, 2, 3, 4].map((i) => (
        <div key={i} className="flex items-center justify-between">
          <div className="flex items-center gap-4 w-full">
            <div className="w-8 h-8 rounded bg-slate-800" />
            <div className="space-y-2 flex-1">
              <div className="h-4 bg-slate-800 rounded w-3/4" />
              <div className="h-3 bg-slate-800 rounded w-1/2" />
            </div>
            <div className="w-16 h-6 bg-slate-800 rounded" />
          </div>
        </div>
      ))}
    </div>
  );
};

export default WidgetLoadingState;