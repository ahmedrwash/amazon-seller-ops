import React from 'react';
import { Search } from 'lucide-react';
import { Input } from "@/components/ui/input";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Button } from "@/components/ui/button";

const TaskFilter = ({ filters, onFilterChange, onReset }) => {
  return (
    <div className="flex flex-col md:flex-row gap-4 mb-6 bg-slate-900/30 p-4 rounded-lg border border-slate-800">
      <div className="relative flex-1 min-w-[200px]">
        <Search className="absolute left-3 top-2.5 h-4 w-4 text-slate-500" />
        <Input
          placeholder="Search tasks..."
          className="pl-9 bg-slate-800 border-slate-700"
          value={filters.search}
          onChange={(e) => onFilterChange('search', e.target.value)}
        />
      </div>
      
      <Select value={filters.dueDate} onValueChange={(val) => onFilterChange('dueDate', val)}>
        <SelectTrigger className="w-full md:w-[150px] bg-slate-800 border-slate-700">
          <SelectValue placeholder="Due Date" />
        </SelectTrigger>
        <SelectContent>
          <SelectItem value="All">Any Date</SelectItem>
          <SelectItem value="Today">Today</SelectItem>
          <SelectItem value="Overdue">Overdue</SelectItem>
        </SelectContent>
      </Select>

      <Select value={filters.status[0] || "All"} onValueChange={(val) => onFilterChange('status', val === "All" ? [] : [val])}>
        <SelectTrigger className="w-full md:w-[150px] bg-slate-800 border-slate-700">
          <SelectValue placeholder="Status" />
        </SelectTrigger>
        <SelectContent>
          <SelectItem value="All">All Statuses</SelectItem>
          <SelectItem value="Open">Open</SelectItem>
          <SelectItem value="In Progress">In Progress</SelectItem>
          <SelectItem value="Done">Done</SelectItem>
        </SelectContent>
      </Select>

      <Select value={filters.priority[0] || "All"} onValueChange={(val) => onFilterChange('priority', val === "All" ? [] : [val])}>
        <SelectTrigger className="w-full md:w-[150px] bg-slate-800 border-slate-700">
          <SelectValue placeholder="Priority" />
        </SelectTrigger>
        <SelectContent>
          <SelectItem value="All">All Priorities</SelectItem>
          <SelectItem value="Critical">Critical</SelectItem>
          <SelectItem value="High">High</SelectItem>
          <SelectItem value="Medium">Medium</SelectItem>
          <SelectItem value="Low">Low</SelectItem>
        </SelectContent>
      </Select>

      <Button variant="ghost" onClick={onReset} className="text-slate-400 hover:text-white">
        Reset
      </Button>
    </div>
  );
};

export default TaskFilter;