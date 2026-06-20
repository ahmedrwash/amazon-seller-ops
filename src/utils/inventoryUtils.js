import { STATUS_COLORS, ALERT_TYPE_COLORS, SHIPMENT_STATUS_COLORS, WAREHOUSE_TYPE_COLORS, MOVEMENT_TYPE_COLORS } from '@/constants/inventoryConstants';

export const calculateAvailable = (onHand, reserved) => {
  return Math.max(0, (parseInt(onHand) || 0) - (parseInt(reserved) || 0));
};

export const calculateInventoryStatus = (onHand, reserved, reorderPoint) => {
  const available = calculateAvailable(onHand, reserved);
  if (available <= 0) return 'Out of Stock';
  if (available <= reorderPoint) return 'Low Stock';
  // Simple logic for overstock: if > 3x reorder point (placeholder logic)
  if (reorderPoint > 0 && available > reorderPoint * 4) return 'Overstock';
  return 'In Stock';
};

export const calculateInventoryHealth = (inventoryItems = []) => {
  if (!inventoryItems || inventoryItems.length === 0) return 'Unknown';
  
  const totalItems = inventoryItems.length;
  let outOfStock = 0;
  let lowStock = 0;

  inventoryItems.forEach(item => {
    const status = calculateInventoryStatus(item.on_hand, item.reserved, item.reorder_point);
    if (status === 'Out of Stock') outOfStock++;
    if (status === 'Low Stock') lowStock++;
  });

  const healthyPercentage = ((totalItems - outOfStock - lowStock) / totalItems) * 100;

  if (outOfStock > totalItems * 0.1 || healthyPercentage < 60) return 'Critical'; // Red
  if (lowStock > totalItems * 0.2 || healthyPercentage < 80) return 'Warning'; // Amber
  return 'Healthy'; // Green
};

export const isLowStock = (onHand, reserved, reorderPoint) => {
  const available = calculateAvailable(onHand, reserved);
  return available > 0 && available <= reorderPoint;
};

export const isOutOfStock = (onHand, reserved) => {
  return calculateAvailable(onHand, reserved) <= 0;
};

export const isOverstock = (onHand, reserved, reorderPoint) => {
  if (!reorderPoint) return false;
  return calculateAvailable(onHand, reserved) > reorderPoint * 4;
};

export const calculateWarehouseUtilization = (currentUnits, capacity) => {
  if (!capacity || capacity <= 0) return 0;
  const util = (currentUnits / capacity) * 100;
  return Math.min(100, Math.round(util));
};

export const getInventoryStatusColor = (status) => {
  return STATUS_COLORS[status] || STATUS_COLORS['Discontinued'];
};

export const getAlertTypeColor = (type) => {
  return ALERT_TYPE_COLORS[type] || ALERT_TYPE_COLORS['Low Stock'];
};

export const getShipmentStatusColor = (status) => {
  return SHIPMENT_STATUS_COLORS[status] || SHIPMENT_STATUS_COLORS['Draft'];
};

export const getWarehouseTypeColor = (type) => {
  return WAREHOUSE_TYPE_COLORS[type] || WAREHOUSE_TYPE_COLORS['Own Warehouse'];
};

export const getMovementTypeColor = (type) => {
  return MOVEMENT_TYPE_COLORS[type] || MOVEMENT_TYPE_COLORS['Adjustment'];
};