import React from 'react';
import ProviderProfile from '@/components/providers/ProviderProfile';

// Since ProviderProfile already has a robust communication tab logic inside,
// I will reuse the same pattern or component.
// Actually, looking at ProviderProfile.jsx I wrote earlier, it has Tabs inside it.
// Here I want just the content. I'll create a wrapper or duplicate the logic for the "Workspace" context.
// For expediency and consistency, I will implement a clean version here that mimics what was requested.

const CommunicationsTab = ({ provider }) => {
   const comms = provider?.provider_communications || [];

   return (
      <div className="space-y-6">
         <div className="relative border-l border-slate-700 ml-4 pl-8 space-y-6">
            {comms.length === 0 ? (
               <p className="text-slate-500 italic">No communications recorded yet.</p>
            ) : (
               comms.sort((a,b) => new Date(b.created_at) - new Date(a.created_at)).map(comm => (
                  <div key={comm.id} className="relative">
                     <span className="absolute -left-[41px] top-1 h-5 w-5 rounded-full bg-slate-800 border-2 border-[hsl(var(--terracotta))]"></span>
                     <div className="bg-slate-800 p-4 rounded border border-slate-700 shadow-sm">
                        <div className="flex justify-between mb-2">
                           <span className="text-xs font-bold text-[hsl(var(--terracotta))] uppercase tracking-wider">{comm.channel}</span>
                           <span className="text-xs text-slate-500">{new Date(comm.created_at).toLocaleString()}</span>
                        </div>
                        <h4 className="text-white font-medium mb-1">{comm.subject}</h4>
                        <p className="text-slate-400 text-sm">{comm.summary}</p>
                     </div>
                  </div>
               ))
            )}
         </div>
      </div>
   );
};
export default CommunicationsTab;