import { supabase } from '@/lib/customSupabaseClient';

const MARKER = "TEST_SEED_10_202601";

const getRandomItem = (array) => array[Math.floor(Math.random() * array.length)];

export const seedTestData = async (userId) => {
  const results = {};
  const errors = [];
  const log = (module, count) => {
    results[module] = count;
  };

  try {
    if (!supabase) throw new Error("Supabase client not initialized");

    // 1. Marketplaces
    const marketplacesData = [
      { code: 'US', name: 'United States', region: 'North America', currency: 'USD', active: true, created_by: userId },
      { code: 'UK', name: 'United Kingdom', region: 'Europe', currency: 'GBP', active: true, created_by: userId },
      { code: 'KSA', name: 'Saudi Arabia', region: 'Middle East', currency: 'SAR', active: true, created_by: userId },
      { code: 'UAE', name: 'United Arab Emirates', region: 'Middle East', currency: 'AED', active: true, created_by: userId },
    ];
    
    // Using upsert based on code to avoid duplicates if they exist, but we really just want to ensure they exist for FKs
    const { data: mps, error: mpError } = await supabase
      .from('marketplaces')
      .upsert(marketplacesData, { onConflict: 'code' })
      .select('id, code');

    if (mpError) throw new Error(`Marketplaces error: ${mpError.message}`);
    log('marketplaces', mps.length);

    // 2. Products
    const productsData = Array(10).fill(0).map((_, i) => ({
      product_name: `Test Product ${i + 1} (${MARKER})`,
      brand: 'Test Brand',
      main_category: 'Test Category',
      status: 'Active',
      created_by: userId,
      owner_id: userId,
      notes: MARKER
    }));

    const { data: products, error: prodError } = await supabase
      .from('products')
      .insert(productsData)
      .select('id');

    if (prodError) throw new Error(`Products error: ${prodError.message}`);
    log('products', products.length);

    // 3. Product Marketplaces
    if (!products?.length || !mps?.length) throw new Error("Skipping PMs due to missing parents");
    
    const pmData = products.map((prod, i) => ({
      product_id: prod.id,
      marketplace_id: getRandomItem(mps).id,
      stage: 'Research',
      priority: 'Medium',
      owner: userId // Legacy field? schema has owner (uuid) and owner_id (uuid), using owner based on schema dump
    }));

    const { data: pms, error: pmError } = await supabase
      .from('product_marketplaces')
      .insert(pmData)
      .select('id');

    if (pmError) throw new Error(`Product Marketplaces error: ${pmError.message}`);
    log('product_marketplaces', pms.length);

    // 4. Tasks
    const tasksData = Array(10).fill(0).map((_, i) => ({
      title: `Test Task ${i + 1}`,
      description: `Auto-generated test task ${MARKER}`,
      status: 'Open',
      priority: 'Medium',
      created_by: userId,
      owner_id: userId,
      due_date: new Date().toISOString()
    }));

    const { data: tasks, error: taskError } = await supabase
      .from('tasks')
      .insert(tasksData)
      .select('id');
      
    if (taskError) throw new Error(`Tasks error: ${taskError.message}`);
    log('tasks', tasks.length);

    // 5. Compliance Items
    if (!pms?.length) throw new Error("Skipping Compliance due to missing PMs");
    
    const complianceData = Array(10).fill(0).map((_, i) => ({
      product_marketplace_id: getRandomItem(pms).id,
      requirement: `Test Requirement ${i + 1}`,
      status: 'Pending',
      created_by: userId,
      owner_id: userId,
      notes: MARKER
    }));

    const { data: compItems, error: compError } = await supabase
      .from('compliance_items')
      .insert(complianceData)
      .select('id');

    if (compError) throw new Error(`Compliance error: ${compError.message}`);
    log('compliance_items', compItems.length);

    // 6. Suppliers
    const supplierData = Array(10).fill(0).map((_, i) => ({
      name: `Test Supplier ${i + 1} (${MARKER})`,
      status: 'Active',
      created_by: userId,
      owner_id: userId,
      notes: MARKER
    }));

    const { data: suppliers, error: suppError } = await supabase
      .from('suppliers')
      .insert(supplierData)
      .select('id');

    if (suppError) throw new Error(`Suppliers error: ${suppError.message}`);
    log('suppliers', suppliers.length);

    // 7. Supplier Quotes
    if (!suppliers?.length || !products?.length) throw new Error("Skipping Quotes due to missing parents");

    const quotesData = Array(10).fill(0).map((_, i) => ({
      supplier_id: getRandomItem(suppliers).id,
      product_id: getRandomItem(products).id,
      unit_cost: 10.50,
      moq: 100,
      status: 'Draft',
      notes: MARKER
    }));

    const { data: quotes, error: quoteError } = await supabase
      .from('supplier_quotes')
      .insert(quotesData)
      .select('id');

    if (quoteError) throw new Error(`Quotes error: ${quoteError.message}`);
    log('supplier_quotes', quotes.length);

    // 8. Warehouses
    const whData = [
      { name: `Test Warehouse A (${MARKER})`, type: '3PL', created_by: userId, notes: MARKER },
      { name: `Test Warehouse B (${MARKER})`, type: 'Own', created_by: userId, notes: MARKER }
    ];

    const { data: whs, error: whError } = await supabase
      .from('warehouses')
      .insert(whData)
      .select('id');

    if (whError) throw new Error(`Warehouses error: ${whError.message}`);
    log('warehouses', whs.length);

    // 9. Inventory
    if (!whs?.length || !pms?.length) throw new Error("Skipping Inventory due to missing parents");

    const invData = Array(10).fill(0).map((_, i) => ({
      warehouse_id: getRandomItem(whs).id,
      product_marketplace_id: getRandomItem(pms).id,
      on_hand: 100,
      created_by: userId,
      owner_id: userId,
      notes: MARKER
    }));

    const { data: inv, error: invError } = await supabase
      .from('inventory')
      .insert(invData)
      .select('id');

    if (invError) throw new Error(`Inventory error: ${invError.message}`);
    log('inventory', inv.length);

    // 10. Cost Entries
    const costData = Array(10).fill(0).map((_, i) => ({
      product_marketplace_id: getRandomItem(pms).id,
      cost_type: 'Test Fee',
      amount: 50.00,
      period: new Date().toISOString(),
      created_by: userId,
      updated_by: userId,
      // cost_entries uses description, not notes usually, but checks schema
      description: MARKER
    }));

    const { data: costs, error: costError } = await supabase
      .from('cost_entries')
      .insert(costData)
      .select('id');

    if (costError) throw new Error(`Cost Entries error: ${costError.message}`);
    log('cost_entries', costs.length);

    // 11. PnL Monthly
    // Skipped as per previous logic (no marker field)
    console.warn("Skipping PnL Monthly seeding - no text field for MARKER in schema.");
    results['pnl_monthly'] = 0;


    // 12. PPC Weekly
    // Skipped as per previous logic (no marker field)
    console.warn("Skipping PPC Weekly seeding - no text field for MARKER in schema.");
    results['ppc_weekly'] = 0;


    // 13. Service Providers
    const provData = Array(10).fill(0).map((_, i) => ({
      provider_name: `Test Provider ${i + 1} (${MARKER})`,
      status: 'Active',
      created_by: userId,
      notes: MARKER
    }));

    const { data: provs, error: provError } = await supabase
      .from('service_providers')
      .insert(provData)
      .select('id');

    if (provError) throw new Error(`Providers error: ${provError.message}`);
    log('service_providers', provs.length);

    // 14. Provider Services
    if (!provs?.length) throw new Error("Skipping Services due to missing Providers");
    
    const servData = Array(10).fill(0).map((_, i) => ({
      provider_id: getRandomItem(provs).id,
      service_area: 'Logistics',
      details: `Test Service Details ${MARKER}`,
      pricing_model: 'Fixed'
    }));

    const { data: servs, error: servError } = await supabase
      .from('provider_services')
      .insert(servData)
      .select('id');

    if (servError) throw new Error(`Provider Services error: ${servError.message}`);
    log('provider_services', servs.length);

    // 15. Provider Comms
    const commData = Array(10).fill(0).map((_, i) => ({
      provider_id: getRandomItem(provs).id,
      channel: 'Email',
      subject: 'Test Subject',
      summary: `Test Summary ${MARKER}`,
      status: 'Open',
      created_by: userId
    }));

    const { data: comms, error: commError } = await supabase
      .from('provider_communications')
      .insert(commData)
      .select('id');

    if (commError) throw new Error(`Provider Comms error: ${commError.message}`);
    log('provider_communications', comms.length);

    return { success: true, results };

  } catch (error) {
    console.error("Seeding error:", error);
    return { success: false, results, error: error.message };
  }
};