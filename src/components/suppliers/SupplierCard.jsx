import React from 'react';
import { Link } from 'react-router-dom';
import { Card, CardContent, CardFooter, CardHeader } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Mail, Phone, Globe, Edit, Trash2 } from 'lucide-react';
import RatingStars from './RatingStars';

const SupplierCard = ({ supplier, onEdit, onDelete }) => {
  return (
    <Card className="bg-slate-900 border-slate-700 hover:border-[hsl(var(--terracotta))]/50 transition-colors">
      <CardHeader className="flex flex-row items-start justify-between pb-2">
        <div>
          <h3 className="font-bold text-lg text-slate-100 truncate pr-2" title={supplier.name}>
             <Link to={`/suppliers/${supplier.id}`} className="hover:text-[hsl(var(--terracotta))] hover:underline">
               {supplier.name}
             </Link>
          </h3>
          <p className="text-sm text-slate-400 flex items-center gap-2">
             {supplier.country}
          </p>
        </div>
        <div className="flex items-center gap-1">
           <Button variant="ghost" size="icon" className="h-8 w-8 text-slate-500 hover:text-white" onClick={() => onEdit(supplier)}>
              <Edit className="h-4 w-4" />
           </Button>
        </div>
      </CardHeader>
      
      <CardContent className="space-y-4 pb-4">
        <RatingStars rating={supplier.rating} readonly />
        
        <div className="space-y-2 text-sm text-slate-300">
           {supplier.contact_name && <p className="font-medium">{supplier.contact_name}</p>}
           
           <div className="flex flex-col gap-1.5">
             {supplier.email && (
               <div className="flex items-center gap-2 text-slate-400 text-xs">
                 <Mail className="h-3 w-3" /> <span className="truncate">{supplier.email}</span>
               </div>
             )}
             {supplier.phone && (
               <div className="flex items-center gap-2 text-slate-400 text-xs">
                 <Phone className="h-3 w-3" /> <span>{supplier.phone}</span>
               </div>
             )}
             {supplier.website && (
               <div className="flex items-center gap-2 text-slate-400 text-xs">
                 <Globe className="h-3 w-3" /> <a href={supplier.website} target="_blank" rel="noopener noreferrer" className="hover:text-[hsl(var(--terracotta))] truncate max-w-[180px]">{supplier.website}</a>
               </div>
             )}
           </div>
        </div>

        <div className="grid grid-cols-2 gap-2 pt-2 border-t border-slate-800">
           <div className="text-center p-2 bg-slate-800/50 rounded">
              <span className="block text-xl font-bold text-slate-200">{supplier.supplier_quotes?.[0]?.count || 0}</span>
              <span className="text-[10px] text-slate-500 uppercase tracking-wider">Quotes</span>
           </div>
           <div className="text-center p-2 bg-slate-800/50 rounded">
              <span className="block text-xl font-bold text-slate-200">{supplier.supplier_samples?.[0]?.count || 0}</span>
              <span className="text-[10px] text-slate-500 uppercase tracking-wider">Samples</span>
           </div>
        </div>
      </CardContent>
    </Card>
  );
};

export default SupplierCard;