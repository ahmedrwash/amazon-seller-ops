import { useState, useCallback } from 'react';
import { supabase } from '@/lib/customSupabaseClient';
import { useToast } from '@/components/ui/use-toast';
import { useAuth } from '@/context/AuthContext';

export const useInventoryMovements = () => {
  const [movements, setMovements] = useState([]);
  const [loading, setLoading] = useState(false);
  const { toast } = useToast();
  const { user } = useAuth();

  const fetchMovements = useCallback(async (inventoryId) => {
    if (!inventoryId) return;
    setLoading(true);
    try {
      const { data, error } = await supabase
        .from('inventory_movements')
        .select('*')
        .eq('inventory_id', inventoryId)
        .order('created_at', { ascending: false });

      if (error) throw error;
      setMovements(data || []);
    } catch (err) {
      console.error(err);
      toast({ title: 'Error', description: 'Failed to fetch movements', variant: 'destructive' });
    } finally {
      setLoading(false);
    }
  }, [toast]);

  const createMovement = async (data) => {
    setLoading(true);
    try {
      // 1. Record movement
      const { data: movement, error: movError } = await supabase
        .from('inventory_movements')
        .insert([{ ...data, created_by: user.id }])
        .select()
        .single();

      if (movError) throw movError;

      // 2. Update Inventory On Hand
      // Logic: if Stock In/Return/Recount(Positive) -> Add, if Stock Out/Damage -> Subtract.
      // Adjustment can be +/- or set absolute.
      // Here we assume quantity passed is the DELTA. Except Recount which might imply absolute.
      // For simplicity in this robust hook, we assume the caller calculated the delta or we do it here.
      // Let's assume 'quantity' in movement is the amount CHANGED.
      // NOTE: Task says "Show current stock levels before/after adjustment".
      // Let's rely on the DB trigger or manual update. Here manual update.
      
      // Fetch current inventory
      const { data: inv } = await supabase.from('inventory').select('on_hand').eq('id', data.inventory_id).single();
      
      let newOnHand = (inv?.on_hand || 0);
      if (data.movement_type === 'Recount') {
         // Special case: quantity is the NEW total? Or delta? 
         // Usually Recount implies "I counted X", so delta = X - old. 
         // But let's assume for this simple implementation that movement.quantity is always the signed delta (+/-).
         // The Modal logic should calculate the delta.
         newOnHand += data.quantity; 
      } else {
         newOnHand += data.quantity;
      }
      
      const { error: invError } = await supabase
         .from('inventory')
         .update({ on_hand: newOnHand, last_counted_at: new Date(), last_counted_by: user.id })
         .eq('id', data.inventory_id);

      if (invError) throw invError;

      // Update movement record with snapshot
      await supabase
         .from('inventory_movements')
         .update({ previous_on_hand: inv?.on_hand, new_on_hand: newOnHand })
         .eq('id', movement.id);

      toast({ title: 'Success', description: 'Stock adjusted' });
      return movement;
    } catch (err) {
      console.error(err);
      toast({ title: 'Error', description: 'Failed to record movement', variant: 'destructive' });
      return null;
    } finally {
      setLoading(false);
    }
  };

  return { movements, loading, fetchMovements, createMovement };
};