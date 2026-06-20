import React, { useEffect, useState } from 'react';
import { Helmet } from 'react-helmet';
import { useParams, useNavigate } from 'react-router-dom';
import { useEmailDetail } from '@/hooks/useEmailDetail';
import { useEmailMapping } from '@/hooks/useEmailMapping';
import { useMappingRules } from '@/hooks/useMappingRules';
import { suggestFieldMappings, matchRules } from '@/utils/emailIntakeUtils';
import EmailViewer from '@/components/EmailViewer';
import MappingEditor from '@/components/MappingEditor';
import { useToast } from '@/components/ui/use-toast';
import { Button } from '@/components/ui/button';
import { ChevronLeft } from 'lucide-react';
import { MAPPING_STATUS } from '@/constants/emailIntakeConstants';

const EmailIntakeReviewPage = () => {
  const { id } = useParams();
  const navigate = useNavigate();
  const { toast } = useToast();
  
  const { email, attachments, mappings, loading: loadingDetail, getEmailDetail } = useEmailDetail();
  const { createMapping, updateMapping, approveMapping, applyMapping, rejectMapping } = useEmailMapping();
  const { rules, getRules } = useMappingRules();

  const [activeMapping, setActiveMapping] = useState(null);

  useEffect(() => {
    getRules();
  }, [getRules]);

  useEffect(() => {
    const load = async () => {
      const data = await getEmailDetail(id);
      if (data && data.mappings && data.mappings.length > 0) {
        // Use existing mapping (prioritize non-rejected)
        const valid = data.mappings.find(m => m.status !== MAPPING_STATUS.REJECTED) || data.mappings[0];
        setActiveMapping(valid);
      } else if (data && data.email && rules.length > 0) {
        // Try to auto-create generic draft from rules
        const matchedRule = matchRules(data.email.inbound_from, data.email.subject, rules);
        if (matchedRule) {
           const initialMap = {
             target_module: matchedRule.default_target?.module,
             target_table: matchedRule.default_target?.table,
             action_type: matchedRule.default_target?.action,
             field_mappings: suggestFieldMappings(data.email, matchedRule)
           };
           // We don't save yet, just preset editor state. 
           // MappingEditor handles "new" vs "existing" via ID presence
           // But here we need to pass an object. If no ID, editor assumes new.
           setActiveMapping(initialMap); 
        }
      }
    };
    if(id && rules) load();
  }, [id, rules, getEmailDetail]);

  const refresh = () => getEmailDetail(id);

  const handleSave = async (mappingData) => {
     let res;
     if (activeMapping?.id) {
        res = await updateMapping(activeMapping.id, mappingData);
     } else {
        res = await createMapping(id, mappingData);
     }

     if (res.success) {
        toast({ title: "Saved", description: "Mapping saved successfully." });
        refresh();
        setActiveMapping(res.result);
     } else {
        toast({ title: "Error", description: res.error.message, variant: "destructive" });
     }
  };

  const handleApprove = async (mappingData) => {
     // First save/update
     let currentId = activeMapping?.id;
     if (!currentId) {
        const createRes = await createMapping(id, mappingData);
        if (!createRes.success) {
           toast({ title: "Error Saving", description: createRes.error.message, variant: "destructive" });
           return;
        }
        currentId = createRes.result.id;
     } else {
        await updateMapping(currentId, mappingData);
     }

     // Then Approve
     const res = await approveMapping(currentId);
     if (res.success) {
        toast({ title: "Approved", description: "Mapping approved." });
        refresh();
        setActiveMapping(res.result);
     } else {
        toast({ title: "Error", description: res.error.message, variant: "destructive" });
     }
  };

  const handleApply = async () => {
     if (!activeMapping?.id) return;
     const res = await applyMapping(activeMapping.id);
     if (res.success) {
        toast({ title: "Applied", description: "Data successfully written to target table." });
        refresh();
        // Redirect or stay? Stay to see result.
     } else {
        toast({ title: "Application Failed", description: res.error.message || "Unknown error", variant: "destructive" });
     }
  };

  const handleReject = async () => {
    if (!activeMapping?.id) {
       toast({ title: "Info", description: "Cannot reject unsaved mapping." });
       return;
    }
    await rejectMapping(activeMapping.id, "Rejected by user in review");
    toast({ title: "Rejected", description: "Mapping rejected." });
    navigate('/email-intake');
  };

  if (loadingDetail) return <div className="p-8 text-white">Loading email details...</div>;

  return (
    <div className="h-[calc(100vh-80px)] flex flex-col">
       <Helmet><title>Review Email - Amazon Seller Operation</title></Helmet>
       
       <div className="flex items-center gap-4 mb-4 px-4 pt-4">
          <Button variant="ghost" onClick={() => navigate('/email-intake')}>
             <ChevronLeft className="w-4 h-4 mr-2" /> Back to Inbox
          </Button>
          <h2 className="text-xl font-bold text-white">Process Email</h2>
       </div>

       <div className="flex-1 flex flex-col lg:flex-row gap-4 px-4 pb-4 overflow-hidden">
          {/* Left Panel: Email Viewer */}
          <div className="w-full lg:w-3/5 h-full overflow-hidden">
             <EmailViewer email={email} attachments={attachments} />
          </div>

          {/* Right Panel: Mapping Editor */}
          <div className="w-full lg:w-2/5 h-full overflow-hidden">
             <MappingEditor 
                email={email}
                mapping={activeMapping}
                onSave={handleSave}
                onApprove={handleApprove}
                onApply={handleApply}
                onReject={handleReject}
             />
          </div>
       </div>
    </div>
  );
};

export default EmailIntakeReviewPage;