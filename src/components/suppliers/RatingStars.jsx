import React from 'react';
import { Star } from 'lucide-react';
import { cn } from '@/lib/utils';

const RatingStars = ({ rating, max = 5, onRate, readonly = false, size = "md" }) => {
  const stars = Array.from({ length: max }, (_, i) => i + 1);
  
  const iconSizes = {
    sm: "w-3 h-3",
    md: "w-4 h-4",
    lg: "w-6 h-6"
  };

  return (
    <div className="flex items-center gap-0.5">
      {stars.map((star) => (
        <button
          key={star}
          type="button"
          onClick={() => !readonly && onRate && onRate(star)}
          className={cn(
            "transition-colors focus:outline-none",
            readonly ? "cursor-default" : "cursor-pointer hover:scale-110"
          )}
          disabled={readonly}
        >
          <Star 
            className={cn(
              iconSizes[size],
              star <= rating 
                ? "fill-yellow-500 text-yellow-500" 
                : "fill-slate-800 text-slate-600"
            )} 
          />
        </button>
      ))}
      {!readonly && rating > 0 && (
        <span className="ml-2 text-sm text-slate-400 font-medium">
          {rating}/{max}
        </span>
      )}
    </div>
  );
};

export default RatingStars;