import React from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { AlertTriangle, CheckCircle2 } from 'lucide-react';
import { updateCycleMetadata } from '@/utils/cycleMetadataUtils';
import { supabase } from '@/lib/supabase';
import { useToast } from '@/components/ui/use-toast';

const CHECKLIST_ITEMS = {
  'Lead': ['Initial Outreach Sent', 'Website Researched', 'Contact Info Verified'],
  'Shortlisted': ['Capabilities Deck Received', 'Discovery Call Completed', 'Fit Confirmed'],
  'Evaluation': ['Reference Check Done', 'Scorecard Completed', 'Pricing Analyzed'],
  'Contracting': ['NDA Signed', 'Contract Reviewed', 'Terms Agreed'],
  'Active': ['Onboarding Completed', 'System Access Granted', 'First Payment Made']
};

const CycleOverviewTab = ({ provider, metadata, refetch, canEdit }) => {
  const { toast } = useToast();
  const currentChecklist = CHECKLIST_ITEMS[provider.status] || [];
  const checkedItems = metadata?.checklist?.[provider.status] || [];

  const toggleChecklistItem = async (item) => {
    if (!canEdit) return;

    const newChecked = checkedItems.includes(item) 
       ? checkedItems.filter(i => i !== item)
       : [...checkedItems, item];
    
    const newMetadata = {
       ...metadata,
       checklist: {
          ...metadata?.checklist,
          [provider.status]: newChecked
       }
    };

    try {
       const newNotes = updateCycleMetadata(provider.notes, newMetadata);
       const { error } = await supabase.from('service_providers').update({ notes: newNotes }).eq('id', provider.id);
       if (error) throw error;
       refetch();
    } catch (e) {
       toast({ variant: "destructive", title: "Update failed", description: e.message });
    }
  };

  return (
    <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
      <Card className="bg-slate-800 border-slate-700">
        <CardHeader>
           <CardTitle className="text-white flex items-center gap-2">
              <CheckCircle2 className="w-5 h-5 text-[hsl(var(--terracotta))]" />
              Stage Checklist ({provider.status})
           </CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
           {currentChecklist.map(item => (
              <div key={item} className="flex items-center space-x-3 bg-slate-900/50 p-3 rounded border border-slate-800">
                 <input 
                    type="checkbox" 
                    checked={checkedItems.includes(item)}
                    onChange={() => toggleChecklistItem(item)}
                    disabled={!canEdit}
                    className="w-5 h-5 rounded border-slate-600 bg-slate-800 text-[hsl(var(--terracotta))] focus:ring-[hsl(var(--terracotta))]/50"
                 />
                 <span className={`text-sm ${checkedItems.includes(item) ? 'text-slate-400 line-through' : 'text-slate-200'}`}>
                    {item}
                 </span>
              </div>
           ))}
           {currentChecklist.length === 0 && <p className="text-slate-500 text-sm">No specific checklist for this stage.</p>}
        </CardContent>
      </Card>

      <Card className="bg-slate-800 border-slate-700">
         <CardHeader>
            <CardTitle className="text-white flex items-center gap-2">
               <AlertTriangle className="w-5 h-5 text-orange-400" />
               Risk & Governance
            </CardTitle>
         </CardHeader>
         <CardContent className="space-y-4 text-sm text-slate-300">
            <div className="grid grid-cols-2 gap-4">
               <div className="bg-slate-900/50 p-3 rounded">
                  <p className="text-slate-500 text-xs uppercase mb-1">Internal Rating</p>
                  <p className="text-xl font-bold text-yellow-400">{provider.internal_rating || 0}/5</p>
               </div>
               <div className="bg-slate-900/50 p-3 rounded">
                  <p className="text-slate-500 text-xs uppercase mb-1">Risk Level</p>
                  <p className={`text-xl font-bold ${provider.risk_level === 'High' ? 'text-red-400' : 'text-green-400'}`}>
                     {provider.risk_level || 'Unknown'}
                  </p>
               </div>
            </div>
            <div className="pt-2">
               <p className="text-slate-500 text-xs mb-1">Contract Status</p>
               <p className="text-white">{metadata?.contractStatus || 'Not contracted'}</p>
            </div>
         </CardContent>
      </Card>
    </div>
  );
};

export default CycleOverviewTab;