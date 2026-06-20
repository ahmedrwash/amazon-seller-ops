import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { ProviderType, ProviderStatus, RiskLevel, Marketplace, PricingModel } from '@/types/serviceProviders';
import { useCreateProvider } from '@/hooks/useServiceProviders';
import { useToast } from '@/components/ui/use-toast';
import { Loader2, Plus, Trash } from 'lucide-react';

const steps = ['Basic Info', 'Services', 'Details'];

const ProviderWizard = () => {
  const navigate = useNavigate();
  const { createProvider, loading } = useCreateProvider();
  const { toast } = useToast();
  const [currentStep, setCurrentStep] = useState(0);

  const [formData, setFormData] = useState({
    provider_name: '',
    company_legal_name: '',
    provider_type: ProviderType.MANUFACTURER,
    website: '',
    primary_contact_name: '',
    primary_contact_email: '',
    primary_contact_phone: '',
    preferred_channel: 'Email',
    about: '',
    status: ProviderStatus.LEAD,
    internal_rating: 3,
    risk_level: RiskLevel.MEDIUM,
    notes: '',
    services: [] // { service_area: '', details: '', pricing_model: '', marketplaces: [] }
  });

  const handleInputChange = (e) => {
    const { name, value } = e.target;
    setFormData(prev => ({ ...prev, [name]: value }));
  };

  const handleServiceChange = (index, field, value) => {
    const updatedServices = [...formData.services];
    updatedServices[index] = { ...updatedServices[index], [field]: value };
    setFormData(prev => ({ ...prev, services: updatedServices }));
  };

  const addService = () => {
    setFormData(prev => ({
      ...prev,
      services: [...prev.services, { service_area: '', details: '', pricing_model: PricingModel.FIXED, marketplaces: [] }]
    }));
  };

  const removeService = (index) => {
    const updated = formData.services.filter((_, i) => i !== index);
    setFormData(prev => ({ ...prev, services: updated }));
  };

  const validateStep = () => {
    if (currentStep === 0) {
      if (!formData.provider_name || !formData.primary_contact_email) {
        toast({ title: "Required Fields", description: "Provider Name and Contact Email are required.", variant: "destructive" });
        return false;
      }
    }
    return true;
  };

  const nextStep = () => {
    if (validateStep()) setCurrentStep(prev => prev + 1);
  };

  const prevStep = () => setCurrentStep(prev => prev - 1);

  const handleSubmit = async () => {
    const { data, error } = await createProvider(formData);
    if (error) {
      toast({ title: "Error", description: error.message, variant: "destructive" });
    } else {
      toast({ title: "Success", description: "Provider created successfully!" });
      navigate(`/providers/${data.id}`);
    }
  };

  return (
    <div className="max-w-3xl mx-auto bg-slate-800 p-8 rounded-lg border border-slate-700">
      <div className="flex justify-between mb-8">
        {steps.map((label, idx) => (
          <div key={label} className={`flex items-center ${idx <= currentStep ? 'text-[hsl(var(--terracotta))]' : 'text-slate-500'}`}>
            <div className={`w-8 h-8 rounded-full flex items-center justify-center border-2 mr-2 ${idx <= currentStep ? 'border-teal-400 bg-teal-400/10' : 'border-slate-600'}`}>
              {idx + 1}
            </div>
            <span className="hidden sm:inline font-medium">{label}</span>
          </div>
        ))}
      </div>

      {currentStep === 0 && (
        <div className="space-y-4">
          <div className="grid grid-cols-2 gap-4">
            <div>
              <Label>Provider Name *</Label>
              <Input name="provider_name" value={formData.provider_name} onChange={handleInputChange} className="bg-slate-900 text-white border-slate-600" />
            </div>
            <div>
              <Label>Legal Name</Label>
              <Input name="company_legal_name" value={formData.company_legal_name} onChange={handleInputChange} className="bg-slate-900 text-white border-slate-600" />
            </div>
          </div>
          <div className="grid grid-cols-2 gap-4">
            <div>
              <Label>Type</Label>
              <select name="provider_type" value={formData.provider_type} onChange={handleInputChange} className="w-full h-10 px-3 rounded-md bg-slate-900 text-white border border-slate-600">
                {Object.values(ProviderType).map(t => <option key={t} value={t}>{t}</option>)}
              </select>
            </div>
            <div>
              <Label>Website</Label>
              <Input name="website" value={formData.website} onChange={handleInputChange} className="bg-slate-900 text-white border-slate-600" />
            </div>
          </div>
          <div className="grid grid-cols-2 gap-4">
            <div>
              <Label>Contact Email *</Label>
              <Input name="primary_contact_email" type="email" value={formData.primary_contact_email} onChange={handleInputChange} className="bg-slate-900 text-white border-slate-600" />
            </div>
            <div>
              <Label>Contact Phone</Label>
              <Input name="primary_contact_phone" value={formData.primary_contact_phone} onChange={handleInputChange} className="bg-slate-900 text-white border-slate-600" />
            </div>
          </div>
        </div>
      )}

      {currentStep === 1 && (
        <div className="space-y-4">
          {formData.services.map((service, index) => (
            <div key={index} className="p-4 bg-slate-900 rounded border border-slate-700 relative">
              <Button variant="ghost" size="sm" className="absolute top-2 right-2 text-red-400 hover:text-red-300" onClick={() => removeService(index)}>
                <Trash className="w-4 h-4" />
              </Button>
              <div className="grid grid-cols-2 gap-4 mb-2">
                <div>
                  <Label>Service Area</Label>
                  <Input value={service.service_area} onChange={(e) => handleServiceChange(index, 'service_area', e.target.value)} className="bg-slate-800 text-white" />
                </div>
                <div>
                  <Label>Pricing Model</Label>
                  <select value={service.pricing_model} onChange={(e) => handleServiceChange(index, 'pricing_model', e.target.value)} className="w-full h-10 px-3 rounded-md bg-slate-800 text-white border border-slate-700">
                    {Object.values(PricingModel).map(m => <option key={m} value={m}>{m}</option>)}
                  </select>
                </div>
              </div>
              <div>
                <Label>Details</Label>
                <Input value={service.details} onChange={(e) => handleServiceChange(index, 'details', e.target.value)} className="bg-slate-800 text-white" />
              </div>
            </div>
          ))}
          <Button onClick={addService} variant="outline" className="w-full border-dashed border-slate-600 text-slate-400 hover:text-white">
            <Plus className="w-4 h-4 mr-2" /> Add Service
          </Button>
        </div>
      )}

      {currentStep === 2 && (
        <div className="space-y-4">
          <div className="grid grid-cols-2 gap-4">
            <div>
              <Label>Status</Label>
              <select name="status" value={formData.status} onChange={handleInputChange} className="w-full h-10 px-3 rounded-md bg-slate-900 text-white border border-slate-600">
                {Object.values(ProviderStatus).map(s => <option key={s} value={s}>{s}</option>)}
              </select>
            </div>
            <div>
              <Label>Risk Level</Label>
              <select name="risk_level" value={formData.risk_level} onChange={handleInputChange} className="w-full h-10 px-3 rounded-md bg-slate-900 text-white border border-slate-600">
                {Object.values(RiskLevel).map(r => <option key={r} value={r}>{r}</option>)}
              </select>
            </div>
          </div>
          <div>
            <Label>Internal Rating (1-5)</Label>
            <input 
              type="range" min="1" max="5" 
              name="internal_rating"
              value={formData.internal_rating} 
              onChange={handleInputChange}
              className="w-full accent-teal-500"
            />
            <div className="text-center text-yellow-500 font-bold">{formData.internal_rating} Stars</div>
          </div>
          <div>
            <Label>Notes</Label>
            <Textarea 
              name="notes" 
              value={formData.notes} 
              onChange={handleInputChange} 
              className="bg-slate-900 text-white border-slate-600 min-h-[100px]"
            />
          </div>
        </div>
      )}

      <div className="mt-8 flex justify-between">
        <Button variant="outline" onClick={prevStep} disabled={currentStep === 0} className="border-slate-600 text-white hover:bg-slate-700">
          Back
        </Button>
        {currentStep < steps.length - 1 ? (
          <Button onClick={nextStep} className="bg-[hsl(var(--terracotta))] hover:bg-[hsl(var(--terracotta))] text-white">Next</Button>
        ) : (
          <Button onClick={handleSubmit} disabled={loading} className="bg-green-600 hover:bg-green-700 text-white">
            {loading ? <Loader2 className="mr-2 h-4 w-4 animate-spin" /> : 'Create Provider'}
          </Button>
        )}
      </div>
    </div>
  );
};

export default ProviderWizard;