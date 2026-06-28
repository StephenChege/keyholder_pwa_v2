import React, { useState, useEffect } from 'react';
import DeviceSelector from './components/DeviceSelector';
import ControlPanel from './components/ControlPanel';
import Settings from './components/Settings';
import useBLE from './hooks/useBLE';
import useProximity from './hooks/useProximity';
import useDeviceStorage from './hooks/useDeviceStorage';

export default function App() {
  const [darkMode, setDarkMode] = useState(() => {
    const saved = localStorage.getItem('keyholder-theme');
    return saved ? saved === 'dark' : true;
  });
  
  const [showSettings, setShowSettings] = useState(false);
  const [selectedDeviceId, setSelectedDeviceId] = useState(() => {
    return localStorage.getItem('keyholder-last-device') || null;
  });

  const { 
    devices, 
    connectedDevice, 
    connect, 
    disconnect, 
    renameDevice,
    discoveryInProgress,
    startDiscovery,
    sendLedBrightness,
    sendBuzzerVolume
  } = useBLE();

  const { 
    rssi, 
    proximityPercent 
  } = useProximity(connectedDevice);

  const { 
    savedDevices, 
    addDevice, 
    removeSavedDevice, 
    updateDeviceName 
  } = useDeviceStorage();

  const [ledOn, setLedOn] = useState(false);
  const [ledBrightness, setLedBrightness] = useState(50);
  const [buzzerOn, setBuzzerOn] = useState(false);
  const [buzzerVolume, setBuzzerVolume] = useState(50);
  const [proximityEnabled, setProximityEnabled] = useState(false);

  // Save theme preference
  useEffect(() => {
    localStorage.setItem('keyholder-theme', darkMode ? 'dark' : 'light');
  }, [darkMode]);

  // Save last connected device
  useEffect(() => {
    if (selectedDeviceId) {
      localStorage.setItem('keyholder-last-device', selectedDeviceId);
    }
  }, [selectedDeviceId]);

  // Handle device selection
  const handleSelectDevice = async (deviceId) => {
    const device = savedDevices.find(d => d.id === deviceId);
    if (device) {
      setSelectedDeviceId(deviceId);
      try {
        await connect(device.id, device.name);
      } catch (err) {
        console.error('Failed to connect:', err);
      }
    }
  };

  // Handle discovering and adding new device
  const handleAddNewDevice = async () => {
    if (!discoveryInProgress) {
      await startDiscovery();
    }
  };

  const currentDevice = connectedDevice || 
    (selectedDeviceId && savedDevices.find(d => d.id === selectedDeviceId));

  const bgClass = darkMode ? 'bg-slate-950' : 'bg-white';
  const textClass = darkMode ? 'text-white' : 'text-slate-900';
  const cardClass = darkMode 
    ? 'bg-slate-900 border-slate-800' 
    : 'bg-slate-50 border-slate-200';

  return (
    <div className={`${bgClass} ${textClass} min-h-screen transition-colors`}>
      {/* Header */}
      <header className={`border-b ${darkMode ? 'border-slate-800' : 'border-slate-200'} sticky top-0 z-50`}>
        <div className="max-w-2xl mx-auto px-4 py-4 flex items-center justify-between">
          <div>
            <h1 className="text-2xl font-bold">Keyholder</h1>
            <p className={`text-sm ${darkMode ? 'text-slate-400' : 'text-slate-600'}`}>
              {currentDevice ? `Connected to ${currentDevice.name}` : 'No device connected'}
            </p>
          </div>
          <button
            onClick={() => setShowSettings(!showSettings)}
            className={`p-2 rounded-lg transition-colors ${
              darkMode 
                ? 'hover:bg-slate-800' 
                : 'hover:bg-slate-200'
            }`}
            title="Settings"
          >
            <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M10.325 4.317c.426-1.756 2.924-1.756 3.35 0a1.724 1.724 0 002.573 1.066c1.543-.94 3.31.826 2.37 2.37a1.724 1.724 0 001.065 2.572c1.756.426 1.756 2.924 0 3.35a1.724 1.724 0 00-1.066 2.573c.94 1.543-.826 3.31-2.37 2.37a1.724 1.724 0 00-2.572 1.065c-.426 1.756-2.924 1.756-3.35 0a1.724 1.724 0 00-2.573-1.066c-1.543.94-3.31-.826-2.37-2.37a1.724 1.724 0 00-1.065-2.572c-1.756-.426-1.756-2.924 0-3.35a1.724 1.724 0 001.066-2.573c-.94-1.543.826-3.31 2.37-2.37.996.608 2.296.07 2.572-1.065z" />
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 12a3 3 0 11-6 0 3 3 0 016 0z" />
            </svg>
          </button>
        </div>
      </header>

      {showSettings && (
        <Settings
          darkMode={darkMode}
          onThemeToggle={() => setDarkMode(!darkMode)}
          connectedDevice={currentDevice}
          onDisconnect={() => {
            disconnect();
            setSelectedDeviceId(null);
            setLedOn(false);
            setBuzzerOn(false);
          }}
          onRenameDevice={(newName) => {
            if (currentDevice) {
              renameDevice(currentDevice.id, newName);
              updateDeviceName(currentDevice.id, newName);
            }
          }}
          onResetSettings={() => {
            localStorage.clear();
            window.location.reload();
          }}
        />
      )}

      <main className="max-w-2xl mx-auto px-4 py-6 pb-20">
        {/* Device Selector */}
        <DeviceSelector
          savedDevices={savedDevices}
          selectedDeviceId={selectedDeviceId}
          connectedDevice={connectedDevice}
          onSelectDevice={handleSelectDevice}
          onAddNewDevice={handleAddNewDevice}
          discoveryInProgress={discoveryInProgress}
          onDeviceDiscovered={(device) => {
            addDevice(device.id, device.name || 'Unnamed Device');
            setSelectedDeviceId(device.id);
          }}
          darkMode={darkMode}
        />

        {/* Control Panel */}
        {currentDevice && (
          <ControlPanel
            ledOn={ledOn}
            setLedOn={setLedOn}
            ledBrightness={ledBrightness}
            setLedBrightness={setLedBrightness}
            buzzerOn={buzzerOn}
            setBuzzerOn={setBuzzerOn}
            buzzerVolume={buzzerVolume}
            setBuzzerVolume={setBuzzerVolume}
            proximityEnabled={proximityEnabled}
            setProximityEnabled={setProximityEnabled}
            proximityPercent={proximityPercent}
            rssi={rssi}
            darkMode={darkMode}
            connectedDevice={connectedDevice}
            sendLedBrightness={sendLedBrightness}
            sendBuzzerVolume={sendBuzzerVolume}
          />
        )}

        {!currentDevice && (
          <div className={`text-center py-12 rounded-lg border-2 border-dashed ${
            darkMode 
              ? 'border-slate-700 bg-slate-900/50' 
              : 'border-slate-300 bg-slate-100'
          }`}>
            <p className={`text-lg ${darkMode ? 'text-slate-400' : 'text-slate-600'}`}>
              Select or add a device to get started
            </p>
          </div>
        )}
      </main>
    </div>
  );
}