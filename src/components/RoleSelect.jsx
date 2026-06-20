import React from 'react';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { ROLES } from '@/constants/roleConstants';
import RoleBadge from './RoleBadge';

export default function RoleSelect({ value, onChange, disabled }) {
  return (
    <Select value={value} onValueChange={onChange} disabled={disabled}>
      <SelectTrigger className="w-[140px] h-8 bg-slate-800 border-slate-700">
        <SelectValue placeholder="Select Role" />
      </SelectTrigger>
      <SelectContent>
        {Object.values(ROLES).map(role => (
          <SelectItem key={role} value={role}>
            <div className="flex items-center gap-2">
               <span>{role}</span>
            </div>
          </SelectItem>
        ))}
      </SelectContent>
    </Select>
  );
}