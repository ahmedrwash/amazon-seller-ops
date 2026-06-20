import React, { useState } from 'react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from '@/components/ui/card';
import { Label } from '@/components/ui/label';
import { Upload, FileText, Send } from 'lucide-react';
import { useToast } from '@/components/ui/use-toast';
import { supabase } from '@/lib/customSupabaseClient';

const ManualEmailImport = () => {
  const { toast } = useToast();
  const [loading, setLoading] = useState(false);
  const [formData, setFormData] = useState({
    from: '',
    subject: '',
    body: '',
    date: new Date().toISOString().slice(0, 16) // Format for datetime-local
  });

  const handleChange = (e) => {
    const { name, value } = e.target;
    setFormData(prev => ({ ...prev, [name]: value }));
  };

  const handleFileUpload = async (e) => {
    const file = e.target.files[0];
    if (!file) return;

    if (!file.name.endsWith('.eml') && !file.name.endsWith('.txt')) {
      toast({
        title: "Invalid Format",
        description: "Please upload .eml or .txt files only.",
        variant: "destructive"
      });
      return;
    }

    const reader = new FileReader();
    reader.onload = (event) => {
      const text = event.target.result;
      // Very basic parsing attempt
      const subjectMatch = text.match(/^Subject: (.+)$/m);
      const fromMatch = text.match(/^From: (.+)$/m);
      const dateMatch = text.match(/^Date: (.+)$/m);
      
      // Split header and body (first double newline)
      const parts = text.split(/\r?\n\r?\n/);
      const body = parts.slice(1).join('\n\n') || text;

      setFormData(prev => ({
        ...prev,
        subject: subjectMatch ? subjectMatch[1] : prev.subject,
        from: fromMatch ? fromMatch[1] : prev.from,
        body: body.substring(0, 5000) // Limit preview size
      }));
      
      toast({
        title: "File Loaded",
        description: "Email content extracted. Please review before importing.",
      });
    };
    reader.readAsText(file);
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setLoading(true);

    try {
      const { error } = await supabase
        .from('inbound_emails')
        .insert([{
          inbound_from: formData.from,
          subject: formData.subject,
          body_text: formData.body,
          status: 'pending', // Will trigger AI processing if configured
          received_at: new Date(formData.date).toISOString(),
          metadata: { source: 'manual_import' }
        }]);

      if (error) throw error;

      toast({
        title: "Import Successful",
        description: "Email has been added to the processing queue.",
      });

      // Reset form
      setFormData({
        from: '',
        subject: '',
        body: '',
        date: new Date().toISOString().slice(0, 16)
      });

    } catch (error) {
      console.error('Import failed:', error);
      toast({
        title: "Import Failed",
        description: error.message,
        variant: "destructive"
      });
    } finally {
      setLoading(false);
    }
  };

  return (
    <Card className="bg-slate-900 border-slate-800">
      <CardHeader>
        <CardTitle className="text-white flex items-center gap-2">
          <FileText className="w-5 h-5 text-[hsl(var(--terracotta))]" />
          Manual Email Import
        </CardTitle>
        <CardDescription>
          Manually add an email or upload an .eml file to test your processing rules.
        </CardDescription>
      </CardHeader>
      <CardContent>
        <form onSubmit={handleSubmit} className="space-y-4">
          
          <div className="grid w-full max-w-sm items-center gap-1.5 mb-6">
            <Label htmlFor="email-file" className="text-slate-300">Upload .eml File (Optional)</Label>
            <div className="flex gap-2">
              <Input 
                id="email-file" 
                type="file" 
                accept=".eml,.txt" 
                className="bg-slate-950 border-slate-700 text-slate-300" 
                onChange={handleFileUpload}
              />
            </div>
            <p className="text-xs text-slate-500">Parsing is basic. Review fields below after upload.</p>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label htmlFor="from" className="text-slate-300">From Sender</Label>
              <Input 
                id="from" 
                name="from"
                value={formData.from}
                onChange={handleChange}
                placeholder="customer@example.com" 
                required 
                className="bg-slate-950 border-slate-700 text-white placeholder:text-slate-500"
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="date" className="text-slate-300">Received Date</Label>
              <Input 
                id="date" 
                name="date"
                type="datetime-local"
                value={formData.date}
                onChange={handleChange}
                required 
                className="bg-slate-950 border-slate-700 text-white"
              />
            </div>
          </div>

          <div className="space-y-2">
            <Label htmlFor="subject" className="text-slate-300">Subject</Label>
            <Input 
              id="subject" 
              name="subject"
              value={formData.subject}
              onChange={handleChange}
              placeholder="Order Inquiry #12345" 
              required 
              className="bg-slate-950 border-slate-700 text-white placeholder:text-slate-500"
            />
          </div>

          <div className="space-y-2">
            <Label htmlFor="body" className="text-slate-300">Email Body</Label>
            <Textarea 
              id="body" 
              name="body"
              value={formData.body}
              onChange={handleChange}
              placeholder="Paste email content here..." 
              required 
              className="min-h-[200px] bg-slate-950 border-slate-700 text-white placeholder:text-slate-500 font-mono text-sm"
            />
          </div>
          
          <div className="pt-2">
            <Button type="submit" className="w-full bg-[hsl(var(--terracotta))] hover:bg-[hsl(var(--terracotta))] text-white" disabled={loading}>
              {loading ? (
                <span className="flex items-center gap-2">Processing...</span>
              ) : (
                <span className="flex items-center gap-2"><Send className="w-4 h-4" /> Import Email</span>
              )}
            </Button>
          </div>
        </form>
      </CardContent>
    </Card>
  );
};

export default ManualEmailImport;