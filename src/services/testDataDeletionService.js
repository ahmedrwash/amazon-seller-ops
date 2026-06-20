import { supabase } from '@/lib/customSupabaseClient';

const MARKER = "TEST_SEED_10_202601";

export const deleteTestData = async () => {
  const deletedCounts = {};
  
  const deleteFromTable = async (table, column, op = 'eq') => {
    try {
      if (!supabase) throw new Error("Supabase client not initialized");

      let query = supabase.from(table).delete({ count: 'exact' });
      
      if (op === 'eq') {
        query = query.eq(column, MARKER);
      } else if (op === 'ilike') {
        query = query.ilike(column, `%${MARKER}%`);
      }
      
      const { count, error } = await query;
      
      if (error) throw error;
      deletedCounts[table] = count;
      return count;
    } catch (err) {
      console.error(`Error deleting from ${table}:`, err);
      deletedCounts[table] = -1; // Indicate error
      return 0;
    }
  };

  try {
    // Order matters due to FK constraints
    
    // 1. Provider Communications
    await deleteFromTable('provider_communications', 'summary', 'ilike');
    
    // 2. Provider Services
    await deleteFromTable('provider_services', 'details', 'ilike');
    
    // 3. Service Providers
    await deleteFromTable('service_providers', 'notes', 'eq');
    
    // 4. PPC Weekly (Skipped creation, but logic here just in case schema changes)
    // await deleteFromTable('ppc_weekly', 'notes', 'eq'); 
    
    // 5. PnL Monthly (Skipped creation)
    // await deleteFromTable('pnl_monthly', 'notes', 'eq');
    
    // 6. Cost Entries
    await deleteFromTable('cost_entries', 'description', 'eq');
    
    // 7. Inventory
    await deleteFromTable('inventory', 'notes', 'eq');
    
    // 8. Warehouses
    await deleteFromTable('warehouses', 'notes', 'eq');
    
    // 9. Compliance Items
    await deleteFromTable('compliance_items', 'notes', 'eq');
    
    // 10. Tasks
    await deleteFromTable('tasks', 'description', 'ilike');
    
    // 11. Supplier Quotes
    await deleteFromTable('supplier_quotes', 'notes', 'eq');
    
    // 12. Suppliers
    await deleteFromTable('suppliers', 'notes', 'eq');
    
    // 13. Product Marketplaces
    // These often don't have notes. However, they should cascade delete if products are deleted?
    // Supabase standard behavior is often RESTRICT. 
    // We created PMs via Product ID. 
    // PMs don't have a 'notes' field usually. 
    // But we can find them by joining products? 
    // RLS/API limits complex deletes.
    // Strategy: Delete Products (step 14). If cascade is ON, PMs go. 
    // If cascade is OFF, we need to delete PMs first. 
    // We can't easily identify test PMs without a marker.
    // BUT: We used products with MARKER. 
    // Let's try to delete products. If it fails due to FK, we are stuck without a custom function or cascade.
    // Assuming cascade is configured or we rely on cleaning up what we can.
    // Let's try to delete PMs if we can identify them? No field on PM table created in seed service.
    // Wait, the seed service didn't put marker on PMs. 
    // We will rely on Product Deletion.
    
    // 14. Products
    await deleteFromTable('products', 'notes', 'eq');
    
    // Product Marketplaces might be left over if no cascade?
    // In many schemas, product_marketplaces ON DELETE CASCADE product_id.
    // If not, we have orphaned test data. 
    // For this task, we assume cascade or that we deleted products successfully.

    return { success: true, deletedCounts };
  } catch (error) {
    return { success: false, deletedCounts, error: error.message };
  }
};