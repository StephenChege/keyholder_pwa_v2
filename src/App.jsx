import React, { useState, useEffect } from 'react';
import ControlPanel from './components/ControlPanel';
import useBLE from './hooks/useBLE';

export default function App() {
  const [darkMode, setDarkMode] = useState(true);
  const [ledOn, setLedOn] = useState(false);
  const [ledBrightness, setLedBrightness] = useState(50);

  const { 
    connectedDevice, 
    connect, 
    disconnect, 
    discoveryInProgress,
    startDiscovery,
    sendLedBrightness
  } = useBLE();

  const handleAddDevice = async () => {
    await startDiscovery();
  };

  const bgClass = darkMode ? 'bg-slate-950' : 'bg-white';
  const textClass = darkMode ? 'text-white' : 'text-slate-900';

  return (
    <div className={`${bgClass} ${textClass} min-h-screen transition-colors`}>
      {/* Header */}
      <header className={`border-b ${darkMode ? 'border-slate-800' : 'border-slate-200'}`}>
        <div className="max-w-2xl mx-auto px-4 py-4 flex items-center justify-between">
          <div>
            <h1 className="text-2xl font-bold">Keyholder</h1>
            <p className={`text-sm ${darkMode ? 'text-slate-400' : 'text-slate-600'}`}>
              {connectedDevice ? `Connected to ${connectedDevice.name}` : 'No device connected'}
            </p>
          </div>
          <button
            onClick={() => setDarkMode(!darkMode)}
            className={`p-2 rounded-lg ${darkMode ? 'hover:bg-slate-800' : 'hover:bg-slate-200'}`}
          >
            {darkMode ? '☀️' : '🌙'}
          </button>
        </div>
      </header>

      <main className="max-w-2xl mx-auto px-4 py-6">
        {/* Device Connection */}
        {!connectedDevice && (
          <div className={`p-6 rounded-lg border-2 border-dashed ${
            darkMode ? 'border-slate-700' : 'border-slate-300'
          } text-center mb-6`}>
            <p className={`mb-4 ${darkMode ? 'text-slate-400' : 'text-slate-600'}`}>
              No device connected
            </p>
            <button
              onClick={handleAddDevice}
              disabled={discoveryInProgress}
              className={`px-6 py-2 rounded-lg font-medium ${
                discoveryInProgress
                  ? darkMode
                    ? 'bg-slate-800 text-slate-400'
                    : 'bg-slate-200 text-slate-400'
                  : 'bg-emerald-600 hover:bg-emerald-700 text-white'
              }`}
            >
              {discoveryInProgress ? 'Scanning...' : 'Connect Device'}
            </button>
          </div>
        )}

        {/* Control Panel */}
        {connectedDevice && (
          <>
            <ControlPanel
              ledOn={ledOn}
              setLedOn={setLedOn}
              ledBrightness={ledBrightness}
              setLedBrightness={setLedBrightness}
              darkMode={darkMode}
              connectedDevice={connectedDevice}
              sendLedBrightness={sendLedBrightness}
            />

            <button
              onClick={() => {
                disconnect();
                setLedOn(false);
              }}
              className="w-full mt-6 px-4 py-2 bg-rose-600 hover:bg-rose-700 text-white rounded-lg font-medium"
            >
              Disconnect
            </button>
          </>
        )}
      </main>
    </div>
  );
}