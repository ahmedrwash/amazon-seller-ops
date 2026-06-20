import React, { useState } from 'react';
import { Card, CardHeader, CardTitle, CardContent } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { formatEmailDate } from '@/utils/emailIntakeUtils';
import { Paperclip, FileText, Code } from 'lucide-react';
import { ScrollArea } from '@/components/ui/scroll-area';

const EmailViewer = ({ email, attachments = [] }) => {
  const [viewMode, setViewMode] = useState('text'); // text | html

  if (!email) {
    return (
      <Card className="h-full flex items-center justify-center text-slate-500">
        Select an email to view details
      </Card>
    );
  }

  return (
    <div className="space-y-4 h-full flex flex-col">
      <Card className="flex-shrink-0 bg-slate-900 border-slate-800">
        <CardHeader className="pb-3">
           <div className="flex justify-between items-start">
              <div>
                 <CardTitle className="text-xl text-white mb-2">{email.subject || '(No Subject)'}</CardTitle>
                 <div className="text-sm text-slate-400 space-y-1">
                    <p><span className="font-semibold text-slate-300">From:</span> {email.inbound_from}</p>
                    {email.inbound_to && <p><span className="font-semibold text-slate-300">To:</span> {email.inbound_to}</p>}
                    <p><span className="font-semibold text-slate-300">Date:</span> {formatEmailDate(email.received_at)}</p>
                 </div>
              </div>
              <Badge variant="outline" className={
                email.status === 'Processed' ? 'border-green-500 text-green-400' : 
                email.status === 'Rejected' ? 'border-red-500 text-red-400' : 'text-slate-400'
              }>
                 {email.status}
              </Badge>
           </div>
        </CardHeader>
      </Card>

      {attachments.length > 0 && (
         <Card className="flex-shrink-0 bg-slate-900 border-slate-800 p-3">
            <h4 className="text-xs font-semibold text-slate-400 uppercase mb-2 flex items-center">
               <Paperclip className="w-3 h-3 mr-1" /> Attachments ({attachments.length})
            </h4>
            <div className="flex flex-wrap gap-2">
               {attachments.map(att => (
                  <a 
                    key={att.id} 
                    href={att.file_url} 
                    target="_blank" 
                    rel="noreferrer"
                    className="flex items-center gap-2 px-3 py-2 bg-slate-800 rounded text-sm text-blue-400 hover:text-blue-300 hover:bg-slate-700 transition-colors"
                  >
                     <FileText className="w-4 h-4" />
                     <span className="truncate max-w-[150px]">{att.file_name}</span>
                  </a>
               ))}
            </div>
         </Card>
      )}

      <Card className="flex-1 overflow-hidden bg-slate-900 border-slate-800 flex flex-col">
         <div className="flex justify-end p-2 border-b border-slate-800 bg-slate-900/50">
            <div className="flex bg-slate-800 rounded-md p-0.5">
               <Button 
                  size="sm" 
                  variant={viewMode === 'text' ? 'secondary' : 'ghost'} 
                  className="h-7 text-xs"
                  onClick={() => setViewMode('text')}
               >
                  Text
               </Button>
               <Button 
                  size="sm" 
                  variant={viewMode === 'html' ? 'secondary' : 'ghost'} 
                  className="h-7 text-xs"
                  onClick={() => setViewMode('html')}
               >
                  <Code className="w-3 h-3 mr-1" /> HTML
               </Button>
            </div>
         </div>
         <ScrollArea className="flex-1 p-4">
            {viewMode === 'text' ? (
               <pre className="whitespace-pre-wrap text-sm text-slate-300 font-sans leading-relaxed">
                  {email.body_text || 'No text content.'}
               </pre>
            ) : (
               <div className="prose prose-invert max-w-none text-sm">
                  {email.body_html ? (
                      <div dangerouslySetInnerHTML={{ __html: email.body_html }} />
                  ) : (
                      <p className="text-slate-500">No HTML content available.</p>
                  )}
               </div>
            )}
         </ScrollArea>
      </Card>
    </div>
  );
};

export default EmailViewer;