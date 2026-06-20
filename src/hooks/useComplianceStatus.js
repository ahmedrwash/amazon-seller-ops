import { useMemo } from 'react';
import { calculateComplianceStatus, isItemOverdue } from '@/utils/complianceUtils';

export const useComplianceStatus = (items = []) => {
  const status = useMemo(() => calculateComplianceStatus(items), [items]);

  const stats = useMemo(() => {
    let overdue = 0;
    let missing = 0;
    let inProgress = 0;
    let complete = 0;
    let waived = 0;
    let na = 0;

    items.forEach(item => {
      if (item.status === 'Missing') missing++;
      if (item.status === 'In Progress') inProgress++;
      if (item.status === 'Complete') complete++;
      if (item.status === 'Waived') waived++;
      if (item.status === 'N/A') na++;
      
      if (isItemOverdue(item.due_date) && item.status !== 'Complete' && item.status !== 'Waived' && item.status !== 'N/A') {
        overdue++;
      }
    });

    return {
      overdueCount: overdue,
      missingCount: missing,
      inProgressCount: inProgress,
      completeCount: complete,
      waivedCount: waived,
      naCount: na,
      totalCount: items.length
    };
  }, [items]);

  return { status, ...stats };
};