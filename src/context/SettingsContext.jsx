import React, { createContext, useContext, useState } from 'react';
import { storageService } from '../services/storageService';
import { DEFAULT_MODEL_ID, DEFAULT_SYSTEM_INSTRUCTION } from '../config/constants.js';

const SettingsContext = createContext(null);

export function SettingsProvider({ children }) {
  const initialSaved = storageService.getSettings();

  // Automatically migrate deprecated gemini-2.5-flash to gemini-3.8-flash
  const effectiveModel =
    initialSaved.selectedModel === 'gemini-2.5-flash' || !initialSaved.selectedModel
      ? DEFAULT_MODEL_ID
      : initialSaved.selectedModel;

  const [settings, setSettings] = useState({
    apiKey: initialSaved.apiKey || '',
    selectedModel: effectiveModel,
    systemInstruction: initialSaved.systemInstruction || DEFAULT_SYSTEM_INSTRUCTION,
    temperature: typeof initialSaved.temperature === 'number' ? initialSaved.temperature : 0.7,
  });

  const [isSettingsOpen, setIsSettingsOpen] = useState(false);

  const updateSettings = (updates) => {
    setSettings((prev) => {
      const merged = { ...prev, ...updates };
      storageService.saveSettings(merged);
      return merged;
    });
  };

  const resetSettings = () => {
    const defaults = {
      apiKey: '',
      selectedModel: DEFAULT_MODEL_ID,
      systemInstruction: DEFAULT_SYSTEM_INSTRUCTION,
      temperature: 0.7,
    };
    setSettings(defaults);
    storageService.saveSettings(defaults);
  };

  return (
    <SettingsContext.Provider
      value={{
        settings,
        apiKey: settings.apiKey,
        selectedModel: settings.selectedModel,
        systemInstruction: settings.systemInstruction,
        temperature: settings.temperature,
        updateSettings,
        resetSettings,
        isSettingsOpen,
        setIsSettingsOpen,
      }}
    >
      {children}
    </SettingsContext.Provider>
  );
}

export function useSettings() {
  const context = useContext(SettingsContext);
  if (!context) {
    throw new Error('useSettings must be used within a SettingsProvider');
  }
  return context;
}
