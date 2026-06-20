import React from 'react';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter, DialogDescription } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { AlertTriangle, ExternalLink } from 'lucide-react';
import { useNavigate } from 'react-router-dom';

const ComplianceGatingModal = ({ 
  isOpen, 
  onClose, 
  incompleteItems = [], 
  productMarketplaceId,
  productId 
}) => {
  const navigate = useNavigate();

  const handleViewCompliance = () => {
    onClose();
    if (productId) {
       navigate(`/products/${productId}?tab=compliance`);
    } else {
       navigate('/compliance');
    }
  };

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="bg-slate-900 border-red-900/50 text-slate-200 max-w-md">
        <DialogHeader>
          <div className="flex items-center gap-2 text-red-500 mb-2">
            <AlertTriangle className="h-6 w-6" />
            <DialogTitle>Action Required</DialogTitle>
          </div>
          <DialogDescription className="text-slate-300">
            Cannot move to <strong>Listing</strong> stage. All compliance requirements must be completed first.
          </DialogDescription>
        </DialogHeader>

        <div className="py-4">
          <p className="text-sm font-medium mb-2 text-slate-400">Incomplete Items ({incompleteItems.length}):</p>
          <div className="bg-slate-950/50 rounded-md border border-slate-800 p-3 max-h-48 overflow-y-auto space-y-2">
            {incompleteItems.map(item => (
              <div key={item.id} className="flex items-start justify-between text-sm">
                <span className="text-slate-300">{item.requirement}</span>
                <span className="text-xs px-2 py-0.5 rounded-full bg-red-500/10 text-red-400 border border-red-500/20 whitespace-nowrap ml-2">
                  {item.status}
                </span>
              </div>
            ))}
          </div>
        </div>

        <DialogFooter className="gap-2 sm:gap-0">
          <Button variant="outline" onClick={onClose} className="border-slate-700 hover:bg-slate-800 text-slate-300">
            Cancel
          </Button>
          <Button onClick={handleViewCompliance} className="bg-red-600 hover:bg-red-700 text-white">
            <ExternalLink className="w-4 h-4 mr-2" />
            Resolve Issues
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
};

export default ComplianceGatingModal;