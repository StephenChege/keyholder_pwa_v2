import React, { useEffect } from 'react';

export default function ControlPanel({
  ledOn,
  setLedOn,
  ledBrightness,
  setLedBrightness,
  buzzerOn,
  setBuzzerOn,
  buzzerVolume,
  setBuzzerVolume,
  proximityEnabled,
  setProximityEnabled,
  proximityPercent,
  rssi,
  darkMode,
  connectedDevice,
  sendLedBrightness,
  sendBuzzerVolume
}) {
  // Calculate actual values with optional proximity multiplier
  const actualBrightness = proximityEnabled && ledOn
    ? Math.round((ledBrightness * proximityPercent) / 100)
    : ledBrightness;
  
  const actualVolume = proximityEnabled && buzzerOn
    ? Math.round((buzzerVolume * proximityPercent) / 100)
    : buzzerVolume;

  // Send LED brightness whenever it changes
  useEffect(() => {
    if (connectedDevice) {
      if (ledOn) {
        sendLedBrightness(actualBrightness);
        console.log('Sending LED brightness:', actualBrightness);
      } else {
        sendLedBrightness(0);
        console.log('Turning LED OFF');
      }
    }
  }, [actualBrightness, ledOn, connectedDevice, sendLedBrightness]);

  // Send Buzzer volume whenever it changes
  useEffect(() => {
    if (connectedDevice) {
      if (buzzerOn) {
        sendBuzzerVolume(actualVolume);
        console.log('Sending Buzzer volume:', actualVolume);
      } else {
        sendBuzzerVolume(0);
        console.log('Turning Buzzer OFF');
      }
    }
  }, [actualVolume, buzzerOn, connectedDevice, sendBuzzerVolume]);

  const cardClass = darkMode 
    ? 'bg-slate-900 border-slate-800' 
    : 'bg-slate-50 border-slate-200';

  return (
    <div className="space-y-6">
      {/* Proximity Status */}
      <div className={`p-4 rounded-lg border ${cardClass}`}>
        <div className="flex items-center justify-between mb-3">
          <label className="flex items-center gap-2 cursor-pointer">
            <input
              type="checkbox"
              checked={proximityEnabled}
              onChange={(e) => setProximityEnabled(e.target.checked)}
              className="w-4 h-4 accent-emerald-500"
            />
            <span className="font-medium">Proximity Multiplier</span>
          </label>
          <span className={`text-sm font-mono ${darkMode ? 'text-slate-400' : 'text-slate-600'}`}>
            {rssi !== null ? `${rssi} dBm` : 'Waiting...'}
          </span>
        </div>
        
        {/* Proximity Bar */}
        <div className="space-y-2">
          <div className="w-full bg-slate-700 rounded-full h-3 overflow-hidden">
            <div
              className="bg-gradient-to-r from-blue-500 via-emerald-500 to-amber-500 h-3 rounded-full transition-all duration-300"
              style={{ width: `${proximityPercent}%` }}
            ></div>
          </div>
          <div className="flex justify-between items-center">
            <p className={`text-xs ${darkMode ? 'text-slate-400' : 'text-slate-600'}`}>
              Distance: {proximityPercent}% (Close)
            </p>
            <p className={`text-xs font-mono ${darkMode ? 'text-slate-400' : 'text-slate-600'}`}>
              0% (Far)
            </p>
          </div>
        </div>

        {proximityEnabled && (
          <p className={`text-xs mt-3 ${darkMode ? 'text-slate-400' : 'text-slate-600'}`}>
            ℹ️ Brightness and volume are multiplied by proximity. Move closer to increase output.
          </p>
        )}
      </div>

      {/* LED Control */}
      <div className={`p-6 rounded-lg border ${cardClass} space-y-4`}>
        <div className="flex items-center justify-between">
          <h3 className="text-lg font-semibold">LED</h3>
          <button
            onClick={() => setLedOn(!ledOn)}
            className={`px-4 py-2 rounded-lg font-medium transition-all ${
              ledOn
                ? 'bg-amber-500 hover:bg-amber-600 text-white'
                : darkMode
                  ? 'bg-slate-800 hover:bg-slate-700 text-slate-300'
                  : 'bg-slate-200 hover:bg-slate-300 text-slate-700'
            }`}
          >
            {ledOn ? 'ON' : 'OFF'}
          </button>
        </div>

        <div>
          <div className="flex justify-between items-center mb-2">
            <label className="block text-sm font-medium">Brightness</label>
            <span className={`text-sm font-mono ${darkMode ? 'text-slate-400' : 'text-slate-600'}`}>
              {ledBrightness}%
              {proximityEnabled && ledOn && (
                <span className={darkMode ? 'text-amber-400' : 'text-amber-600'}>
                  {' '}→ {actualBrightness}% (×{proximityPercent}%)
                </span>
              )}
            </span>
          </div>
          <input
            type="range"
            min="0"
            max="100"
            value={ledBrightness}
            onChange={(e) => setLedBrightness(Number(e.target.value))}
            disabled={!ledOn}
            className="w-full accent-amber-500 disabled:opacity-50"
          />
        </div>
      </div>

      {/* Buzzer Control */}
      <div className={`p-6 rounded-lg border ${cardClass} space-y-4`}>
        <div className="flex items-center justify-between">
          <h3 className="text-lg font-semibold">Buzzer</h3>
          <button
            onClick={() => setBuzzerOn(!buzzerOn)}
            className={`px-4 py-2 rounded-lg font-medium transition-all ${
              buzzerOn
                ? 'bg-rose-500 hover:bg-rose-600 text-white'
                : darkMode
                  ? 'bg-slate-800 hover:bg-slate-700 text-slate-300'
                  : 'bg-slate-200 hover:bg-slate-300 text-slate-700'
            }`}
          >
            {buzzerOn ? 'ON' : 'OFF'}
          </button>
        </div>

        <div>
          <div className="flex justify-between items-center mb-2">
            <label className="block text-sm font-medium">Volume</label>
            <span className={`text-sm font-mono ${darkMode ? 'text-slate-400' : 'text-slate-600'}`}>
              {buzzerVolume}%
              {proximityEnabled && buzzerOn && (
                <span className={darkMode ? 'text-rose-400' : 'text-rose-600'}>
                  {' '}→ {actualVolume}% (×{proximityPercent}%)
                </span>
              )}
            </span>
          </div>
          <input
            type="range"
            min="0"
            max="100"
            value={buzzerVolume}
            onChange={(e) => setBuzzerVolume(Number(e.target.value))}
            disabled={!buzzerOn}
            className="w-full accent-rose-500 disabled:opacity-50"
          />
        </div>
      </div>
    </div>
  );
}