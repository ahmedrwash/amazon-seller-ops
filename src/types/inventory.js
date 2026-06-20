export const createEmptyInventory = () => ({
  product_marketplace_id: '',
  warehouse_id: '',
  on_hand: 0,
  inbound: 0,
  reserved: 0,
  reorder_point: 0,
  reorder_quantity: 0,
  notes: ''
});

export const createEmptyWarehouse = () => ({
  name: '',
  type: 'Own Warehouse',
  marketplace_id: '',
  address: '',
  city: '',
  country: '',
  contact_name: '',
  contact_email: '',
  contact_phone: '',
  capacity: 0,
  notes: '',
  is_active: true
});

export const createEmptyShipment = () => ({
  product_marketplace_id: '',
  from_warehouse_id: '',
  to_warehouse_id: '',
  quantity: 0,
  shipment_date: null,
  expected_arrival_date: null,
  carrier: '',
  tracking_number: '',
  status: 'Draft',
  notes: ''
});

export const createEmptyReorderAlert = (inventoryId = '') => ({
  inventory_id: inventoryId,
  alert_type: 'Low Stock',
  threshold_value: 0,
  current_value: 0,
  status: 'Active',
  notes: ''
});

export const createEmptyInventoryMovement = (inventoryId = '') => ({
  inventory_id: inventoryId,
  movement_type: 'Adjustment',
  quantity: 0,
  reference_id: '',
  notes: ''
});

export const validateInventory = (inventory) => {
  const errors = {};
  if (!inventory.product_marketplace_id) errors.product_marketplace_id = 'Product is required';
  if (!inventory.warehouse_id) errors.warehouse_id = 'Warehouse is required';
  if (inventory.on_hand < 0) errors.on_hand = 'On hand quantity cannot be negative';
  if (inventory.reserved < 0) errors.reserved = 'Reserved quantity cannot be negative';
  if (inventory.reorder_point < 0) errors.reorder_point = 'Reorder point cannot be negative';
  return errors;
};

export const validateWarehouse = (warehouse) => {
  const errors = {};
  if (!warehouse.name) errors.name = 'Warehouse name is required';
  if (!warehouse.type) errors.type = 'Warehouse type is required';
  if (warehouse.contact_email && !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(warehouse.contact_email)) {
    errors.contact_email = 'Invalid email address';
  }
  return errors;
};

export const validateShipment = (shipment) => {
  const errors = {};
  if (!shipment.product_marketplace_id) errors.product_marketplace_id = 'Product is required';
  if (!shipment.to_warehouse_id) errors.to_warehouse_id = 'Destination warehouse is required';
  if (shipment.quantity <= 0) errors.quantity = 'Quantity must be greater than 0';
  if (shipment.from_warehouse_id === shipment.to_warehouse_id && shipment.from_warehouse_id) {
    errors.to_warehouse_id = 'Cannot ship to the same warehouse';
  }
  return errors;
};

export const validateReorderAlert = (alert) => {
  const errors = {};
  if (!alert.inventory_id) errors.inventory_id = 'Inventory item is required';
  if (!alert.alert_type) errors.alert_type = 'Alert type is required';
  return errors;
};

export const validateInventoryMovement = (movement) => {
  const errors = {};
  if (!movement.inventory_id) errors.inventory_id = 'Inventory item is required';
  if (!movement.movement_type) errors.movement_type = 'Movement type is required';
  if (movement.quantity <= 0 && movement.movement_type !== 'Adjustment') errors.quantity = 'Quantity must be greater than 0';
  // Note: For adjustments, could be negative, but usually we ask for absolute amount and handle logic. 
  // For 'Stock Out', logic usually subtracts.
  return errors;
};