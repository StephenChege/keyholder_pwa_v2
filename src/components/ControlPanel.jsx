import React, { useEffect } from 'react';
import FeedbackCircle from './FeedbackCircle';

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
  connectedDevice
}) {
  // Calculate actual values based on proximity
  const actualBrightness = proximityEnabled 
    ? Math.round((ledBrightness * proximityPercent) / 100)
    : ledBrightness;
  
  const actualVolume = proximityEnabled
    ? Math.round((buzzerVolume * proximityPercent) / 100)
    : buzzerVolume;

  // Send brightness to device
  useEffect(() => {
    if (connectedDevice && ledOn) {
      // TODO: Send brightness value to ESP32 LED characteristic
      console.log('Sending LED brightness:', actualBrightness);
    }
  }, [actualBrightness, ledOn, connectedDevice]);

  // Send volume to device
  useEffect(() => {
    if (connectedDevice && buzzerOn) {
      // TODO: Send volume value to ESP32 buzzer characteristic
      // Also calculate frequency: 400Hz (far) to 2000Hz (close)
      const frequency = 400 + (proximityPercent * 16); // 400 + (100 * 16) = 2000
      console.log('Sending buzzer volume:', actualVolume, 'frequency:', frequency);
    }
  }, [actualVolume, buzzerOn, proximityPercent, connectedDevice]);

  const cardClass = darkMode 
    ? 'bg-slate-900 border-slate-800' 
    : 'bg-slate-50 border-slate-200';

  const sliderClass = darkMode
    ? 'accent-emerald-500'
    : 'accent-emerald-600';

  return (
    <div className="space-y-6">
      {/* Proximity Status */}
      <div className={`p-4 rounded-lg border ${cardClass}`}>
        <div className="flex items-center justify-between mb-2">
          <label className="flex items-center gap-2 cursor-pointer">
            <input
              type="checkbox"
              checked={proximityEnabled}
              onChange={(e) => setProximityEnabled(e.target.checked)}
              className="w-4 h-4"
            />
            <span className="font-medium">Proximity Feedback</span>
          </label>
          <span className={`text-sm font-mono ${darkMode ? 'text-slate-400' : 'text-slate-600'}`}>
            {rssi !== null ? `${rssi} dBm` : 'No signal'}
          </span>
        </div>
        <div className="w-full bg-slate-700 rounded-full h-2 mb-2">
          <div
            className="bg-emerald-500 h-2 rounded-full transition-all"
            style={{ width: `${proximityPercent}%` }}
          ></div>
        </div>
        <p className={`text-xs ${darkMode ? 'text-slate-400' : 'text-slate-600'}`}>
          {proximityPercent}% proximity
        </p>
      </div>

      {/* LED Control */}
      <div className={`p-6 rounded-lg border ${cardClass}`}>
        <div className="mb-6">
          <div className="flex items-center justify-between mb-4">
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

          {/* Feedback Circle */}
          {ledOn && (
            <div className="mb-4">
              <FeedbackCircle
                value={actualBrightness}
                max={100}
                type="brightness"
                darkMode={darkMode}
              />
            </div>
          )}

          {/* Brightness Slider */}
          <div>
            <label className="block text-sm font-medium mb-2">
              Brightness: {ledBrightness}%
            </label>
            <input
              type="range"
              min="0"
              max="100"
              value={ledBrightness}
              onChange={(e) => setLedBrightness(Number(e.target.value))}
              disabled={!ledOn}
              className={`w-full ${sliderClass} disabled:opacity-50`}
            />
            {proximityEnabled && (
              <p className={`text-xs mt-2 ${darkMode ? 'text-slate-400' : 'text-slate-600'}`}>
                Actual: {actualBrightness}% (slider × proximity)
              </p>
            )}
          </div>
        </div>
      </div>

      {/* Buzzer Control */}
      <div className={`p-6 rounded-lg border ${cardClass}`}>
        <div className="mb-6">
          <div className="flex items-center justify-between mb-4">
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

          {/* Feedback Wave */}
          {buzzerOn && (
            <div className="mb-4">
              <FeedbackCircle
                value={actualVolume}
                max={100}
                type="loudness"
                darkMode={darkMode}
              />
            </div>
          )}

          {/* Volume Slider */}
          <div>
            <label className="block text-sm font-medium mb-2">
              Volume: {buzzerVolume}%
            </label>
            <input
              type="range"
              min="0"
              max="100"
              value={buzzerVolume}
              onChange={(e) => setBuzzerVolume(Number(e.target.value))}
              disabled={!buzzerOn}
              className={`w-full ${sliderClass} disabled:opacity-50`}
            />
            {proximityEnabled && (
              <p className={`text-xs mt-2 ${darkMode ? 'text-slate-400' : 'text-slate-600'}`}>
                Actual: {actualVolume}% (slider × proximity)
              </p>
            )}
          </div>
        </div>
      </div>

      {/* Info */}
      <div className={`p-4 rounded-lg border ${cardClass}`}>
        <p className={`text-sm ${darkMode ? 'text-slate-400' : 'text-slate-600'}`}>
          {proximityEnabled
            ? 'Brightness and volume are multiplied by proximity percentage. Move closer to increase output.'
            : 'Proximity feedback is disabled. Sliders control absolute output.'}
        </p>
      </div>
    </div>
  );
}
