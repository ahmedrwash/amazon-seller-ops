import React, { createContext, useContext } from 'react';
import { useSettings } from '@/hooks/useLocalStorage';
import { createDefaultSettings } from '@/types/product';

const SettingsContext = createContext();

export const useSettingsContext = () => {
  const context = useContext(SettingsContext);
  if (!context) {
    throw new Error('useSettingsContext must be used within SettingsProvider');
  }
  return context;
};

export const SettingsProvider = ({ children }) => {
  const [settings, setSettings] = useSettings(createDefaultSettings());

  const updateSettings = (newSettings) => {
    setSettings(newSettings);
  };

  const resetSettings = () => {
    setSettings(createDefaultSettings());
  };

  return (
    <SettingsContext.Provider value={{ settings, updateSettings, resetSettings }}>
      {children}
    </SettingsContext.Provider>
  );
};