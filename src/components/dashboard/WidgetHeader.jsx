import React from 'react';
import { RefreshCw, Settings, ChevronDown, ChevronUp } from 'lucide-react';
import { Button } from '@/components/ui/button';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";

const WidgetHeader = ({ 
  title, 
  icon: Icon, 
  onRefresh, 
  lastUpdated, 
  isCollapsed, 
  onToggleCollapse,
  isLoading 
}) => {
  return (
    <div className="flex items-center justify-between p-4 border-b border-slate-800 bg-slate-900/50 rounded-t-lg">
      <div className="flex items-center gap-3">
        {Icon && <Icon className="w-5 h-5 text-[hsl(var(--terracotta))]" />}
        <h3 className="font-semibold text-white">{title}</h3>
      </div>
      
      <div className="flex items-center gap-2">
        {lastUpdated && (
          <span className="text-xs text-slate-500 hidden sm:inline-block">
            Updated {new Date(lastUpdated).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
          </span>
        )}
        
        <Button 
          variant="ghost" 
          size="icon" 
          className="h-8 w-8 text-slate-400 hover:text-white"
          onClick={onRefresh}
          disabled={isLoading}
        >
          <RefreshCw className={`w-4 h-4 ${isLoading ? 'animate-spin' : ''}`} />
        </Button>
        
        <DropdownMenu>
          <DropdownMenuTrigger asChild>
            <Button variant="ghost" size="icon" className="h-8 w-8 text-slate-400 hover:text-white">
              <Settings className="w-4 h-4" />
            </Button>
          </DropdownMenuTrigger>
          <DropdownMenuContent align="end" className="bg-slate-800 border-slate-700 text-slate-200">
            <DropdownMenuItem className="focus:bg-slate-700 cursor-pointer">
              Configure Widget
            </DropdownMenuItem>
            <DropdownMenuItem className="focus:bg-slate-700 cursor-pointer text-red-400">
              Hide Widget
            </DropdownMenuItem>
          </DropdownMenuContent>
        </DropdownMenu>

        <Button 
          variant="ghost" 
          size="icon" 
          className="h-8 w-8 text-slate-400 hover:text-white"
          onClick={onToggleCollapse}
        >
          {isCollapsed ? <ChevronDown className="w-4 h-4" /> : <ChevronUp className="w-4 h-4" />}
        </Button>
      </div>
    </div>
  );
};

export default WidgetHeader;