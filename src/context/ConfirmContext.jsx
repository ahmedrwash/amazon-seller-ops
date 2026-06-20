import React, { createContext, useContext, useState, useCallback } from 'react';
import ConfirmDialog from '@/components/ui/ConfirmDialog';

const ConfirmContext = createContext();

export const useConfirm = () => {
  const context = useContext(ConfirmContext);
  if (!context) {
    throw new Error('useConfirm must be used within a ConfirmProvider');
  }
  return context;
};

export const ConfirmProvider = ({ children }) => {
  const [options, setOptions] = useState({
    isOpen: false,
    title: '',
    description: '',
    confirmText: 'Confirm',
    cancelText: 'Cancel',
    variant: 'default',
    onConfirm: () => {},
    onCancel: () => {}
  });

  const confirm = useCallback(({ 
    title = 'Are you sure?', 
    description = 'This action cannot be undone.', 
    confirmText = 'Confirm', 
    cancelText = 'Cancel',
    variant = 'default' 
  }) => {
    return new Promise((resolve) => {
      setOptions({
        isOpen: true,
        title,
        description,
        confirmText,
        cancelText,
        variant,
        onConfirm: () => {
          setOptions(prev => ({ ...prev, isOpen: false }));
          resolve(true);
        },
        onCancel: () => {
          setOptions(prev => ({ ...prev, isOpen: false }));
          resolve(false);
        }
      });
    });
  }, []);

  const close = useCallback(() => {
    setOptions(prev => ({ ...prev, isOpen: false }));
  }, []);

  return (
    <ConfirmContext.Provider value={{ confirm }}>
      {children}
      <ConfirmDialog
        open={options.isOpen}
        onOpenChange={close}
        title={options.title}
        description={options.description}
        confirmText={options.confirmText}
        cancelText={options.cancelText}
        variant={options.variant}
        onConfirm={options.onConfirm}
        onCancel={options.onCancel}
      />
    </ConfirmContext.Provider>
  );
};