import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { Eye, EyeOff, Key, Sparkles, Sliders, Trash2, RotateCcw, ExternalLink, LogOut } from 'lucide-react';
import { Modal } from './Modal.jsx';
import { Button } from './Button.jsx';
import { useSettings } from '../../context/SettingsContext.jsx';
import { useChat } from '../../context/ChatContext.jsx';
import { useAuth } from '../../context/AuthContext.jsx';
import { MODELS } from '../../config/constants.js';

function SettingsForm({
  settings,
  updateSettings,
  resetSettings,
  clearAllConversations,
  user,
  logout,
  onClose,
}) {
  const navigate = useNavigate();
  const [localApiKey, setLocalApiKey] = useState(settings.apiKey || '');
  const [showApiKey, setShowApiKey] = useState(false);
  const [localModel, setLocalModel] = useState(settings.selectedModel);
  const [localSystemInstruction, setLocalSystemInstruction] = useState(settings.systemInstruction);
  const [localTemperature, setLocalTemperature] = useState(settings.temperature);
  const [showClearConfirm, setShowClearConfirm] = useState(false);
  const [isSavedFeedback, setIsSavedFeedback] = useState(false);

  const handleSave = () => {
    updateSettings({
      apiKey: localApiKey.trim(),
      selectedModel: localModel,
      systemInstruction: localSystemInstruction,
      temperature: parseFloat(localTemperature),
    });
    setIsSavedFeedback(true);
    setTimeout(() => {
      setIsSavedFeedback(false);
      onClose();
    }, 600);
  };

  const handleReset = () => {
    resetSettings();
    onClose();
  };

  const handleClearHistory = () => {
    clearAllConversations();
    setShowClearConfirm(false);
  };

  const handleLogout = () => {
    onClose();
    logout();
    navigate('/login', { replace: true });
  };

  return (
    <div className="space-y-6 text-sm text-gray-700 dark:text-gray-300">
        {/* User Account & Session */}
        {user && (
          <div className="p-3.5 rounded-xl bg-gray-50 dark:bg-surface-dark-hover border border-gray-200/80 dark:border-surface-dark-border flex items-center justify-between gap-3">
            <div className="flex items-center gap-3 min-w-0">
              <div className="w-9 h-9 rounded-xl bg-gradient-to-tr from-brand-600 to-indigo-600 flex items-center justify-center text-white font-semibold text-sm shrink-0">
                {user.name ? user.name.charAt(0).toUpperCase() : 'U'}
              </div>
              <div className="truncate">
                <p className="font-semibold text-xs text-gray-900 dark:text-white truncate">
                  {user.name}
                </p>
                <p className="text-[11px] text-gray-500 dark:text-gray-400 truncate">{user.email}</p>
              </div>
            </div>
            <Button
              size="sm"
              variant="outline"
              leftIcon={LogOut}
              onClick={handleLogout}
              className="text-red-500 hover:text-red-600 dark:text-red-400 !py-1 !px-2.5 text-xs shrink-0"
            >
              Sign Out
            </Button>
          </div>
        )}

        {/* Gemini API Key */}
        <div className="space-y-2">
          <div className="flex items-center justify-between">
            <label className="flex items-center gap-2 font-medium text-gray-900 dark:text-white">
              <Key className="w-4 h-4 text-brand-500" />
              Google Gemini API Key
            </label>
            <a
              href="https://aistudio.google.com/app/apikey"
              target="_blank"
              rel="noopener noreferrer"
              className="inline-flex items-center gap-1 text-xs text-brand-600 hover:text-brand-500 dark:text-brand-400 hover:underline"
            >
              Get Free API Key <ExternalLink className="w-3 h-3" />
            </a>
          </div>

          <div className="relative">
            <input
              type={showApiKey ? 'text' : 'password'}
              value={localApiKey}
              onChange={(e) => setLocalApiKey(e.target.value)}
              placeholder="Paste your Gemini API key (AIzaSy...)"
              className="w-full px-3.5 py-2.5 pr-10 rounded-xl bg-gray-50 dark:bg-surface-dark-hover border border-gray-300 dark:border-surface-dark-border text-gray-900 dark:text-white placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-brand-500/40 font-mono text-xs"
            />
            <button
              type="button"
              onClick={() => setShowApiKey(!showApiKey)}
              className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-400 hover:text-gray-600 dark:hover:text-gray-200"
              aria-label={showApiKey ? 'Hide API key' : 'Show API key'}
            >
              {showApiKey ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
            </button>
          </div>
          <p className="text-xs text-gray-500 dark:text-gray-400">
            Stored securely in your local browser storage. If not entered, you can define{' '}
            <code className="px-1 py-0.5 rounded bg-gray-100 dark:bg-gray-800 font-mono">VITE_GEMINI_API_KEY</code>{' '}
            or use simulated responses.
          </p>
        </div>

        {/* Model Selection */}
        <div className="space-y-2">
          <label className="flex items-center gap-2 font-medium text-gray-900 dark:text-white">
            <Sparkles className="w-4 h-4 text-brand-500" />
            Active Gemini Model
          </label>
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-2.5">
            {MODELS.map((model) => (
              <div
                key={model.id}
                onClick={() => setLocalModel(model.id)}
                className={`p-3 rounded-xl border cursor-pointer transition-all ${
                  localModel === model.id
                    ? 'border-brand-500 bg-brand-500/10 dark:bg-brand-500/15'
                    : 'border-gray-200 dark:border-surface-dark-border hover:bg-gray-50 dark:hover:bg-surface-dark-hover'
                }`}
              >
                <div className="flex items-center justify-between mb-1">
                  <span className="font-semibold text-xs text-gray-900 dark:text-white">
                    {model.name}
                  </span>
                  <span className="text-[10px] font-medium px-1.5 py-0.5 rounded-full bg-brand-500/20 text-brand-600 dark:text-brand-300">
                    {model.badge}
                  </span>
                </div>
                <p className="text-[11px] text-gray-500 dark:text-gray-400 line-clamp-2 leading-tight">
                  {model.description}
                </p>
              </div>
            ))}
          </div>
        </div>

        {/* Temperature Slider */}
        <div className="space-y-2">
          <div className="flex items-center justify-between">
            <label className="flex items-center gap-2 font-medium text-gray-900 dark:text-white">
              <Sliders className="w-4 h-4 text-brand-500" />
              Creativity / Temperature
            </label>
            <span className="font-mono text-xs font-semibold px-2 py-0.5 rounded bg-gray-100 dark:bg-surface-dark-hover text-brand-600 dark:text-brand-400">
              {localTemperature}
            </span>
          </div>
          <input
            type="range"
            min="0.0"
            max="1.0"
            step="0.1"
            value={localTemperature}
            onChange={(e) => setLocalTemperature(parseFloat(e.target.value))}
            className="w-full accent-brand-500 cursor-pointer"
          />
          <div className="flex justify-between text-[11px] text-gray-400">
            <span>0.0 (Precise & Analytical)</span>
            <span>1.0 (Creative & Exploratory)</span>
          </div>
        </div>

        {/* System Persona / Instructions */}
        <div className="space-y-2">
          <label className="font-medium text-gray-900 dark:text-white block">
            System Instructions (Persona)
          </label>
          <textarea
            rows={3}
            value={localSystemInstruction}
            onChange={(e) => setLocalSystemInstruction(e.target.value)}
            className="w-full px-3.5 py-2.5 rounded-xl bg-gray-50 dark:bg-surface-dark-hover border border-gray-300 dark:border-surface-dark-border text-gray-900 dark:text-white text-xs leading-relaxed focus:outline-none focus:ring-2 focus:ring-brand-500/40 resize-none"
            placeholder="Customize how Ayan AI responds..."
          />
        </div>

        {/* Danger Zone: Clear History */}
        <div className="pt-2 border-t border-gray-200 dark:border-surface-dark-border">
          <div className="flex items-center justify-between">
            <div>
              <p className="font-medium text-xs text-gray-900 dark:text-white">Conversation History</p>
              <p className="text-[11px] text-gray-500 dark:text-gray-400">
                Permanently delete all stored chats from this browser.
              </p>
            </div>
            {showClearConfirm ? (
              <div className="flex items-center gap-2">
                <Button size="sm" variant="danger" onClick={handleClearHistory}>
                  Yes, Delete All
                </Button>
                <Button size="sm" variant="ghost" onClick={() => setShowClearConfirm(false)}>
                  Cancel
                </Button>
              </div>
            ) : (
              <Button
                size="sm"
                variant="outline"
                leftIcon={Trash2}
                onClick={() => setShowClearConfirm(true)}
                className="text-red-500 hover:text-red-600 dark:text-red-400"
              >
                Clear History
              </Button>
            )}
          </div>
        </div>

        {/* Modal Actions */}
        <div className="flex items-center justify-between pt-4 border-t border-gray-200 dark:border-surface-dark-border">
          <Button
            size="sm"
            variant="ghost"
            leftIcon={RotateCcw}
            onClick={handleReset}
          >
            Reset Defaults
          </Button>

          <div className="flex items-center gap-2">
            <Button
              size="sm"
              variant="secondary"
              onClick={onClose}
            >
              Cancel
            </Button>
            <Button size="sm" variant="primary" onClick={handleSave}>
              {isSavedFeedback ? 'Saved!' : 'Save Changes'}
            </Button>
          </div>
        </div>
      </div>
  );
}

export function SettingsModal() {
  const { isSettingsOpen, setIsSettingsOpen, settings, updateSettings, resetSettings } = useSettings();
  const { clearAllConversations } = useChat();
  const { user, logout } = useAuth();

  return (
    <Modal
      isOpen={isSettingsOpen}
      onClose={() => setIsSettingsOpen(false)}
      title="Settings & Configuration"
      maxWidth="max-w-xl"
    >
      {isSettingsOpen && (
        <SettingsForm
          settings={settings}
          updateSettings={updateSettings}
          resetSettings={resetSettings}
          clearAllConversations={clearAllConversations}
          user={user}
          logout={logout}
          onClose={() => setIsSettingsOpen(false)}
        />
      )}
    </Modal>
  );
}

export default SettingsModal;
