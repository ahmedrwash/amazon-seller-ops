import React, { useState, useEffect } from 'react';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { createEmptyListingBrief, validateListingBrief } from '@/types/listings';
import SEOScoreIndicator from './SEOScoreIndicator';
import { calculateSEOScore } from '@/utils/listingUtils';

const ListingBriefModal = ({ isOpen, onClose, onSave, initialBrief, loading }) => {
  const [formData, setFormData] = useState(createEmptyListingBrief());
  const [errors, setErrors] = useState({});
  const [seo, setSeo] = useState({ score: 0, recommendations: [] });

  useEffect(() => {
    if (isOpen) {
      setFormData(initialBrief || createEmptyListingBrief());
      setErrors({});
    }
  }, [isOpen, initialBrief]);

  useEffect(() => {
    const analysis = calculateSEOScore(formData.title, formData.bullets, formData.description, formData.keywords);
    setSeo(analysis);
  }, [formData]);

  const handleChange = (field, value) => {
    setFormData(prev => ({ ...prev, [field]: value }));
    if (errors[field]) setErrors(prev => ({ ...prev, [field]: null }));
  };

  const handleBulletChange = (index, value) => {
    const newBullets = [...formData.bullets];
    newBullets[index] = value;
    handleChange('bullets', newBullets);
  };

  const handleKeywordChange = (value) => {
    // Simple comma separated for now
    const keywords = value.split(',').map(k => k.trim()).filter(k => k);
    handleChange('keywords', keywords);
  };

  const handleSave = () => {
    const validationErrors = validateListingBrief(formData);
    if (Object.keys(validationErrors).length > 0) {
      setErrors(validationErrors);
      return;
    }
    // inject calculated SEO score
    onSave({ ...formData, seo_score: seo.score });
  };

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="bg-slate-900 border-slate-700 text-slate-200 max-w-3xl max-h-[90vh] overflow-y-auto">
        <DialogHeader className="flex flex-row justify-between items-center pr-8">
          <DialogTitle>{initialBrief ? 'Edit Listing Brief' : 'Create Listing Brief'}</DialogTitle>
          <SEOScoreIndicator score={seo.score} recommendations={seo.recommendations} />
        </DialogHeader>

        <div className="space-y-6 py-4">
          <div className="space-y-2">
            <div className="flex justify-between">
              <Label htmlFor="title">Title <span className="text-red-500">*</span></Label>
              <span className="text-xs text-slate-500">{formData.title.length}/200</span>
            </div>
            <Input 
              id="title" 
              value={formData.title} 
              onChange={(e) => handleChange('title', e.target.value)} 
              className="bg-slate-800 border-slate-700"
              maxLength={200}
            />
            {errors.title && <p className="text-red-500 text-xs">{errors.title}</p>}
          </div>

          <div className="space-y-3">
             <Label>Bullet Points <span className="text-red-500">*</span></Label>
             {formData.bullets.map((bullet, idx) => (
                <div key={idx} className="relative">
                   <div className="absolute right-2 top-2 text-xs text-slate-500">{bullet.length}/500</div>
                   <Textarea 
                      value={bullet} 
                      onChange={(e) => handleBulletChange(idx, e.target.value)}
                      placeholder={`Bullet ${idx + 1}`}
                      className="bg-slate-800 border-slate-700 min-h-[60px]"
                      maxLength={500}
                   />
                </div>
             ))}
             {errors.bullets && <p className="text-red-500 text-xs">{errors.bullets}</p>}
          </div>

          <div className="space-y-2">
             <div className="flex justify-between">
               <Label htmlFor="description">Description <span className="text-red-500">*</span></Label>
               <span className="text-xs text-slate-500">{formData.description.length}/2000</span>
             </div>
             <Textarea 
               id="description" 
               value={formData.description} 
               onChange={(e) => handleChange('description', e.target.value)} 
               className="bg-slate-800 border-slate-700 min-h-[150px]"
               maxLength={2000}
             />
             {errors.description && <p className="text-red-500 text-xs">{errors.description}</p>}
          </div>

          <div className="space-y-2">
             <Label htmlFor="keywords">Keywords (comma separated)</Label>
             <Input 
               id="keywords" 
               defaultValue={formData.keywords.join(', ')} 
               onChange={(e) => handleKeywordChange(e.target.value)} 
               className="bg-slate-800 border-slate-700"
               placeholder="keyword1, keyword2, keyword3"
             />
          </div>
        </div>

        <DialogFooter>
          <Button variant="outline" onClick={onClose} className="border-slate-600 hover:bg-slate-800 text-slate-300">Cancel</Button>
          <Button onClick={handleSave} disabled={loading} className="bg-[hsl(var(--terracotta))] hover:bg-[hsl(var(--terracotta))] text-white">
            {loading ? 'Saving...' : 'Save Draft'}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
};

export default ListingBriefModal;