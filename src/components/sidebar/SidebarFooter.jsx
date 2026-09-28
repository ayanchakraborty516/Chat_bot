import React from 'react';
import { useNavigate } from 'react-router-dom';
import { Settings, Sun, Moon, Cpu, LogOut } from 'lucide-react';
import { useTheme } from '../../context/ThemeContext';
import { useSettings } from '../../context/SettingsContext';
import { useAuth } from '../../context/AuthContext';
import { MODELS } from '../../config/constants.js';

export function SidebarFooter() {
  const navigate = useNavigate();
  const { isDark, toggleTheme } = useTheme();
  const { selectedModel, setIsSettingsOpen } = useSettings();
  const { user, logout } = useAuth();

  const activeModel = MODELS.find((m) => m.id === selectedModel) || MODELS[0];

  const handleLogout = () => {
    logout();
    navigate('/login', { replace: true });
  };

  return (
    <div className="p-3 border-t border-gray-200/80 dark:border-surface-dark-border space-y-2 shrink-0 select-none bg-gray-50/50 dark:bg-surface-dark-card/50">
      {/* Authenticated User Profile & Logout */}
      {user && (
        <div className="flex items-center justify-between p-2 rounded-xl bg-white dark:bg-surface-dark-card border border-gray-200/60 dark:border-surface-dark-border text-xs">
          <div className="flex items-center gap-2 min-w-0">
            <div className="w-7 h-7 rounded-lg bg-gradient-to-tr from-brand-600 to-indigo-600 flex items-center justify-center text-white font-semibold text-[11px] shrink-0">
              {user.name ? user.name.charAt(0).toUpperCase() : 'U'}
            </div>
            <div className="truncate">
              <p className="font-semibold text-[11px] text-gray-900 dark:text-gray-100 truncate">
                {user.name || 'User'}
              </p>
              <p className="text-[10px] text-gray-400 truncate">{user.email}</p>
            </div>
          </div>
          <button
            type="button"
            onClick={handleLogout}
            className="p-1.5 text-gray-400 hover:text-red-500 dark:hover:text-red-400 rounded-lg hover:bg-gray-100 dark:hover:bg-surface-dark-hover transition-colors"
            title="Sign out"
            aria-label="Sign out"
          >
            <LogOut className="w-3.5 h-3.5" />
          </button>
        </div>
      )}

      {/* Model Indicator & Quick Settings */}
      <div
        onClick={() => setIsSettingsOpen(true)}
        className="flex items-center justify-between p-2 rounded-xl bg-white dark:bg-surface-dark-card border border-gray-200/60 dark:border-surface-dark-border cursor-pointer hover:border-brand-500/50 transition-all text-xs"
        title="Click to change model settings"
      >
        <div className="flex items-center gap-2 min-w-0">
          <div className="w-6 h-6 rounded-lg bg-brand-500/15 flex items-center justify-center text-brand-600 dark:text-brand-300">
            <Cpu className="w-3.5 h-3.5" />
          </div>
          <div className="truncate">
            <p className="font-semibold text-[11px] text-gray-900 dark:text-gray-100 truncate">
              {activeModel.name}
            </p>
            <p className="text-[10px] text-gray-400 truncate">Google Gemini API</p>
          </div>
        </div>

        <button
          type="button"
          onClick={(e) => {
            e.stopPropagation();
            setIsSettingsOpen(true);
          }}
          className="p-1 text-gray-400 hover:text-gray-600 dark:hover:text-gray-200 rounded"
          aria-label="Settings"
        >
          <Settings className="w-3.5 h-3.5" />
        </button>
      </div>

      {/* Bottom controls: Theme switch + Creator branding */}
      <div className="flex items-center justify-between px-1 text-[11px] text-gray-400 dark:text-gray-500">
        <span className="truncate">Ayan AI Assistant</span>

        <button
          type="button"
          onClick={toggleTheme}
          className="flex items-center gap-1.5 px-2 py-1 rounded-lg hover:bg-gray-200/60 dark:hover:bg-surface-dark-hover text-gray-600 dark:text-gray-300 transition-colors"
          aria-label="Toggle theme"
        >
          {isDark ? (
            <>
              <Sun className="w-3.5 h-3.5 text-amber-400" />
              <span>Light</span>
            </>
          ) : (
            <>
              <Moon className="w-3.5 h-3.5 text-slate-600" />
              <span>Dark</span>
            </>
          )}
        </button>
      </div>
    </div>
  );
}

export default SidebarFooter;
