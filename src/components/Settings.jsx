import React, { useState } from 'react';

export default function Settings({
  darkMode,
  onThemeToggle,
  connectedDevice,
  onDisconnect,
  onRenameDevice,
  onResetSettings,
}) {
  const [showRenameInput, setShowRenameInput] = useState(false);
  const [newName, setNewName] = useState(connectedDevice?.name || '');

  const handleRename = () => {
    if (newName.trim() && newName !== connectedDevice?.name) {
      onRenameDevice(newName);
      setShowRenameInput(false);
    }
  };

  const handleResetConfirm = () => {
    if (window.confirm('Reset all settings? This will clear device history, theme preferences, and connection state.')) {
      onResetSettings();
    }
  };

  const cardClass = darkMode 
    ? 'bg-slate-900 border-slate-800' 
    : 'bg-slate-50 border-slate-200';

  return (
    <div className={`border-b ${darkMode ? 'border-slate-800' : 'border-slate-200'}`}>
      <div className="max-w-2xl mx-auto px-4 py-6 space-y-6">
        {/* Theme Toggle */}
        <div className={`p-4 rounded-lg border ${cardClass}`}>
          <div className="flex items-center justify-between">
            <div>
              <p className="font-medium">Dark Mode</p>
              <p className={`text-sm ${darkMode ? 'text-slate-400' : 'text-slate-600'}`}>
                Toggle between light and dark theme
              </p>
            </div>
            <button
              onClick={onThemeToggle}
              className={`relative w-12 h-6 rounded-full transition-colors ${
                darkMode ? 'bg-emerald-600' : 'bg-slate-300'
              }`}
            >
              <div
                className={`absolute top-1 left-1 w-4 h-4 bg-white rounded-full transition-transform ${
                  darkMode ? 'translate-x-6' : ''
                }`}
              />
            </button>
          </div>
        </div>

        {/* Device Settings */}
        {connectedDevice && (
          <div className={`p-4 rounded-lg border ${cardClass}`}>
            <p className="font-medium mb-4">Device Settings</p>
            
            <div className="space-y-4">
              {/* Device Name */}
              <div>
                <p className={`text-sm ${darkMode ? 'text-slate-400' : 'text-slate-600'}`}>
                  Device Name
                </p>
                {showRenameInput ? (
                  <div className="flex gap-2 mt-2">
                    <input
                      type="text"
                      value={newName}
                      onChange={(e) => setNewName(e.target.value)}
                      className={`flex-1 px-3 py-2 rounded border ${
                        darkMode
                          ? 'bg-slate-800 border-slate-700 text-white'
                          : 'bg-white border-slate-300 text-slate-900'
                      }`}
                      placeholder="Device name"
                    />
                    <button
                      onClick={handleRename}
                      className="px-3 py-2 bg-emerald-600 hover:bg-emerald-700 text-white rounded font-medium"
                    >
                      Save
                    </button>
                    <button
                      onClick={() => setShowRenameInput(false)}
                      className={`px-3 py-2 rounded border ${
                        darkMode
                          ? 'bg-slate-800 border-slate-700 text-slate-300'
                          : 'bg-slate-200 border-slate-300 text-slate-700'
                      }`}
                    >
                      Cancel
                    </button>
                  </div>
                ) : (
                  <div className="flex items-center justify-between mt-2">
                    <p className="font-mono text-sm">{connectedDevice.name}</p>
                    <button
                      onClick={() => setShowRenameInput(true)}
                      className="text-emerald-500 hover:text-emerald-600 text-sm font-medium"
                    >
                      Edit
                    </button>
                  </div>
                )}
              </div>

              {/* Device ID */}
              <div>
                <p className={`text-sm ${darkMode ? 'text-slate-400' : 'text-slate-600'}`}>
                  Device ID
                </p>
                <p className="font-mono text-xs mt-1">{connectedDevice.id}</p>
              </div>

              {/* Disconnect Button */}
              <button
                onClick={() => {
                  if (window.confirm(`Disconnect from ${connectedDevice.name}?`)) {
                    onDisconnect();
                  }
                }}
                className="w-full px-4 py-2 bg-rose-600 hover:bg-rose-700 text-white rounded-lg font-medium transition-colors"
              >
                Disconnect Device
              </button>
            </div>
          </div>
        )}

        {/* App Settings */}
        <div className={`p-4 rounded-lg border ${cardClass}`}>
          <p className="font-medium mb-4">App Settings</p>
          
          <button
            onClick={handleResetConfirm}
            className="w-full px-4 py-2 bg-slate-700 hover:bg-slate-600 text-white rounded-lg font-medium transition-colors"
          >
            Reset All Settings
          </button>
          <p className={`text-xs mt-2 ${darkMode ? 'text-slate-500' : 'text-slate-500'}`}>
            This will clear device history, theme preference, and connection state.
          </p>
        </div>

        {/* About */}
        <div className={`p-4 rounded-lg border ${cardClass}`}>
          <p className="font-medium mb-2">About</p>
          <p className={`text-sm ${darkMode ? 'text-slate-400' : 'text-slate-600'}`}>
            Keyholder PWA v2.0
          </p>
          <p className={`text-xs mt-2 ${darkMode ? 'text-slate-500' : 'text-slate-500'}`}>
            A proximity key-finder with BLE connectivity and real-time feedback.
          </p>
        </div>
      </div>
    </div>
  );
}
