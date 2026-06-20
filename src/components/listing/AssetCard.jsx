import React from 'react';
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Eye, Edit, Trash2, Check, X } from 'lucide-react';
import AssetTypeBadge from './AssetTypeBadge';
import AssetStatusBadge from './AssetStatusBadge';

const AssetCard = ({ asset, onEdit, onDelete, onApprove, onReject }) => {
  const isVideo = asset.asset_type === 'Video';

  return (
    <Card className="bg-slate-900 border-slate-700 overflow-hidden hover:border-[hsl(var(--terracotta))]/50 transition-colors group">
       <div className="relative aspect-square bg-slate-950 flex items-center justify-center">
          {isVideo ? (
             <video src={asset.file_url} className="w-full h-full object-cover" controls />
          ) : (
             <img src={asset.file_url} alt={asset.file_name} className="w-full h-full object-cover" />
          )}
          
          <div className="absolute top-2 left-2">
             <AssetTypeBadge type={asset.asset_type} />
          </div>
          <div className="absolute top-2 right-2">
             <AssetStatusBadge status={asset.status} />
          </div>

          <div className="absolute inset-0 bg-black/60 opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center gap-2">
             <Button variant="secondary" size="icon" onClick={() => window.open(asset.file_url, '_blank')}>
                <Eye className="w-4 h-4" />
             </Button>
             <Button variant="secondary" size="icon" onClick={() => onEdit && onEdit(asset)}>
                <Edit className="w-4 h-4" />
             </Button>
             <Button variant="destructive" size="icon" onClick={() => onDelete && onDelete(asset.id)}>
                <Trash2 className="w-4 h-4" />
             </Button>
          </div>
       </div>
       <CardContent className="p-3">
          <div className="flex justify-between items-center mb-2">
             <p className="text-xs text-slate-500 truncate max-w-[150px]" title={asset.file_name}>
                {asset.file_name}
             </p>
             <span className="text-[10px] text-slate-600">
                {new Date(asset.created_at).toLocaleDateString()}
             </span>
          </div>
          
          {asset.status === 'Pending' && (
             <div className="flex gap-2 mt-2">
                <Button size="sm" className="w-full bg-emerald-600 hover:bg-emerald-700 h-7 text-xs" onClick={() => onApprove && onApprove(asset)}>
                   <Check className="w-3 h-3 mr-1" /> Approve
                </Button>
                <Button size="sm" variant="outline" className="w-full h-7 text-xs border-red-900/50 text-red-500 hover:bg-red-900/10" onClick={() => onReject && onReject(asset)}>
                   <X className="w-3 h-3 mr-1" /> Reject
                </Button>
             </div>
          )}
       </CardContent>
    </Card>
  );
};

export default AssetCard;