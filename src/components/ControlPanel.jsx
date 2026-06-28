import React, { useEffect } from 'react';

export default function ControlPanel({
  ledOn,
  setLedOn,
  ledBrightness,
  setLedBrightness,
  darkMode,
  connectedDevice,
  sendLedBrightness
}) {
  // Send brightness whenever it changes
  useEffect(() => {
    if (connectedDevice) {
      if (ledOn) {
        sendLedBrightness(ledBrightness);
        console.log('Sending LED brightness:', ledBrightness);
      } else {
        sendLedBrightness(0);
        console.log('Turning LED OFF');
      }
    }
  }, [ledBrightness, ledOn, connectedDevice, sendLedBrightness]);

  const cardClass = darkMode 
    ? 'bg-slate-900 border-slate-800' 
    : 'bg-slate-50 border-slate-200';

  return (
    <div className={`p-6 rounded-lg border ${cardClass} space-y-4`}>
      <div className="flex items-center justify-between">
        <h3 className="text-lg font-semibold">LED Control</h3>
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
          className="w-full accent-emerald-500 disabled:opacity-50"
        />
      </div>

      <p className={`text-xs ${darkMode ? 'text-slate-400' : 'text-slate-600'}`}>
        {ledOn 
          ? `LED is ON at ${ledBrightness}% brightness`
          : 'Click ON to turn LED on'}
      </p>
    </div>
  );
}