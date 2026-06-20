import React from 'react';
import { useNavigate } from 'react-router-dom';
import { 
  MoreHorizontal, Eye, Edit, MessageSquare, FileText, Trash 
} from 'lucide-react';
import { Button } from '@/components/ui/button';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';

const ProviderTable = ({ providers, loading }) => {
  const navigate = useNavigate();

  if (loading) {
      return (
        <div className="bg-slate-800 rounded-lg border border-slate-700 p-10 text-center">
            <div className="animate-pulse flex flex-col items-center">
                <div className="h-4 w-48 bg-slate-700 rounded mb-4"></div>
                <div className="h-3 w-32 bg-slate-700 rounded"></div>
            </div>
        </div>
      );
  }

  if (!providers || providers.length === 0) {
    return <div className="text-center py-10 text-slate-400 bg-slate-800 rounded-lg border border-slate-700">No providers found.</div>;
  }

  return (
    <div className="bg-slate-800 rounded-lg border border-slate-700 overflow-hidden">
      <div className="overflow-x-auto">
        <table className="w-full text-left">
          <thead className="bg-slate-900 text-slate-300 uppercase text-xs font-semibold">
            <tr>
              <th className="px-6 py-3">Provider Name</th>
              <th className="px-6 py-3">Type</th>
              <th className="px-6 py-3">Status</th>
              <th className="px-6 py-3">Rating</th>
              <th className="px-6 py-3">Marketplaces</th>
              <th className="px-6 py-3">Created</th>
              <th className="px-6 py-3 text-right">Actions</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-slate-700">
            {providers.map((provider) => (
              <tr key={provider.id} className="hover:bg-slate-700/50 transition-colors">
                <td className="px-6 py-4">
                  <div className="font-medium text-white">{provider.provider_name}</div>
                  <div className="text-sm text-slate-400">{provider.primary_contact_email}</div>
                </td>
                <td className="px-6 py-4 text-slate-300">{provider.provider_type}</td>
                <td className="px-6 py-4">
                  <span className={`inline-flex px-2 py-1 text-xs font-bold rounded-full
                    ${provider.status === 'Active' ? 'bg-green-500/10 text-green-400' :
                      provider.status === 'Lead' ? 'bg-blue-500/10 text-blue-400' :
                      'bg-slate-500/10 text-slate-400'}`}>
                    {provider.status}
                  </span>
                </td>
                <td className="px-6 py-4 text-yellow-500">
                  {'★'.repeat(provider.internal_rating || 0)}{'☆'.repeat(5 - (provider.internal_rating || 0))}
                </td>
                <td className="px-6 py-4 text-slate-300 text-sm">
                  {provider.provider_services?.flatMap(s => s.marketplaces).slice(0, 3).join(', ') || '-'}
                </td>
                <td className="px-6 py-4 text-slate-400 text-sm">
                  {new Date(provider.created_at).toLocaleDateString()}
                </td>
                <td className="px-6 py-4 text-right">
                  <DropdownMenu>
                    <DropdownMenuTrigger asChild>
                      <Button variant="ghost" className="h-8 w-8 p-0 text-slate-400 hover:text-white">
                        <MoreHorizontal className="h-4 w-4" />
                      </Button>
                    </DropdownMenuTrigger>
                    <DropdownMenuContent align="end" className="bg-slate-800 border-slate-700 text-slate-200">
                      <DropdownMenuLabel>Actions</DropdownMenuLabel>
                      <DropdownMenuItem onClick={() => navigate(`/providers/${provider.id}`)}>
                        <Eye className="mr-2 h-4 w-4" /> View Details
                      </DropdownMenuItem>
                      <DropdownMenuItem onClick={() => navigate(`/providers/${provider.id}`)}>
                        <Edit className="mr-2 h-4 w-4" /> Edit Profile
                      </DropdownMenuItem>
                    </DropdownMenuContent>
                  </DropdownMenu>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
};

export default ProviderTable;