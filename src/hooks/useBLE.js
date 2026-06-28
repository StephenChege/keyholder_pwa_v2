import { useState, useCallback, useRef, useEffect } from 'react';

const SERVICE_UUID = '12345678-1234-1234-1234-123456789abc';
const LED_WRITE_UUID = 'deadbeef-1234-1234-1234-123456789abc';
const BUZZER_WRITE_UUID = 'deadbeef-1234-1234-1234-123456789abd';
const RSSI_READ_UUID = 'abcd1234-5678-1234-5678-abcdef123457';

// ============================================================================
// Convert RSSI to proximity percentage
// ============================================================================
function rssiToProximity(rssi) {
  if (rssi === null || rssi === undefined) return 0;
  
  // RSSI range: -100 dBm (far) to -30 dBm (very close)
  const minRSSI = -100;
  const maxRSSI = -30;
  
  const clamped = Math.max(minRSSI, Math.min(maxRSSI, rssi));
  const proximity = ((clamped - minRSSI) / (maxRSSI - minRSSI)) * 100;
  
  return Math.round(Math.max(0, Math.min(100, proximity)));
}

// ============================================================================
// Main Hook
// ============================================================================
export default function useBLE() {
  const [connectedDevice, setConnectedDevice] = useState(null);
  const [discoveryInProgress, setDiscoveryInProgress] = useState(false);
  const [rssi, setRssi] = useState(null);
  const [proximityPercent, setProximityPercent] = useState(0);
  
  const deviceRef = useRef(null);
  const ledCharacteristicRef = useRef(null);
  const buzzerCharacteristicRef = useRef(null);
  const rssiCharacteristicRef = useRef(null);
  const pollIntervalRef = useRef(null);

  // ========================================================================
  // Connect to Device
  // ========================================================================
  const connect = useCallback(async (deviceId, deviceName) => {
    if (!navigator.bluetooth) {
      alert('Web Bluetooth API not available');
      return;
    }

    try {
      const device = await navigator.bluetooth.requestDevice({
        optionalServices: [SERVICE_UUID],
        filters: [{ name: deviceName }]
      });

      const server = await device.gatt.connect();
      const service = await server.getPrimaryService(SERVICE_UUID);
      
      // Get LED characteristic
      const ledCharacteristic = await service.getCharacteristic(LED_WRITE_UUID);
      ledCharacteristicRef.current = ledCharacteristic;

      // Get Buzzer characteristic
      const buzzerCharacteristic = await service.getCharacteristic(BUZZER_WRITE_UUID);
      buzzerCharacteristicRef.current = buzzerCharacteristic;

      // Get RSSI characteristic
      const rssiCharacteristic = await service.getCharacteristic(RSSI_READ_UUID);
      rssiCharacteristicRef.current = rssiCharacteristic;

      deviceRef.current = device;

      setConnectedDevice({
        id: device.id,
        name: device.name || 'Unknown Device',
        device
      });

      console.log('Connected to:', device.name);
      console.log('RSSI characteristic UUID:', RSSI_READ_UUID);
      console.log('Starting RSSI polling...');
    } catch (error) {
      console.error('Connection error:', error);
      alert('Failed to connect: ' + error.message);
    }
  }, []);

  // ========================================================================
  // Disconnect from Device
  // ========================================================================
  const disconnect = useCallback(async () => {
    // Stop polling
    if (pollIntervalRef.current) {
      clearInterval(pollIntervalRef.current);
      pollIntervalRef.current = null;
    }

    if (deviceRef.current) {
      try {
        deviceRef.current.gatt.disconnect();
        console.log('Disconnected');
      } catch (error) {
        console.error('Disconnect error:', error);
      }
      deviceRef.current = null;
      ledCharacteristicRef.current = null;
      buzzerCharacteristicRef.current = null;
      rssiCharacteristicRef.current = null;
      setConnectedDevice(null);
      setRssi(null);
      setProximityPercent(0);
    }
  }, []);

  // ========================================================================
  // Start Device Discovery
  // ========================================================================
  const startDiscovery = useCallback(async () => {
    if (!navigator.bluetooth) {
      alert('Web Bluetooth API not available');
      return;
    }

    setDiscoveryInProgress(true);
    try {
      const device = await navigator.bluetooth.requestDevice({
        optionalServices: [SERVICE_UUID],
        filters: [{ services: [SERVICE_UUID] }]
      });

      if (device) {
        await connect(device.id, device.name);
      }
    } catch (error) {
      if (error.name !== 'NotFoundError') {
        console.error('Discovery error:', error);
      }
    } finally {
      setDiscoveryInProgress(false);
    }
  }, [connect]);

  // ========================================================================
  // Send LED Brightness
  // ========================================================================
  const sendLedBrightness = useCallback(async (brightness) => {
    if (!ledCharacteristicRef.current) {
      console.error('LED characteristic not connected');
      return;
    }

    try {
      const value = Math.min(Math.max(brightness, 0), 255);
      const data = new Uint8Array([value]);
      
      await ledCharacteristicRef.current.writeValue(data);
      console.log('LED brightness sent:', value);
    } catch (error) {
      console.error('Send LED error:', error);
    }
  }, []);

  // ========================================================================
  // Send Buzzer Volume
  // ========================================================================
  const sendBuzzerVolume = useCallback(async (volume) => {
    if (!buzzerCharacteristicRef.current) {
      console.error('Buzzer characteristic not connected');
      return;
    }

    try {
      const value = Math.min(Math.max(volume, 0), 255);
      const data = new Uint8Array([value]);
      
      await buzzerCharacteristicRef.current.writeValue(data);
      console.log('Buzzer volume sent:', value);
    } catch (error) {
      console.error('Send buzzer error:', error);
    }
  }, []);

  // ========================================================================
  // Poll RSSI (Reliable Method)
  // ========================================================================
  useEffect(() => {
    if (!rssiCharacteristicRef.current || !connectedDevice) return;

    // Start polling RSSI every 500ms
    const startPolling = async () => {
      pollIntervalRef.current = setInterval(async () => {
        try {
          const value = await rssiCharacteristicRef.current.readValue();
          
          // Read as 2-byte signed integer (little-endian)
          const view = new DataView(value.buffer);
          const newRssi = view.getInt16(0, true);
          
          setRssi(newRssi);
          const proximity = rssiToProximity(newRssi);
          setProximityPercent(proximity);
          
          console.log('RSSI polled:', newRssi, '| Proximity:', proximity + '%');
        } catch (error) {
          console.error('Poll RSSI error:', error);
        }
      }, 500); // Poll every 500ms
    };

    startPolling();

    // Cleanup on disconnect
    return () => {
      if (pollIntervalRef.current) {
        clearInterval(pollIntervalRef.current);
        pollIntervalRef.current = null;
      }
    };
  }, [connectedDevice]);

  return {
    connectedDevice,
    connect,
    disconnect,
    discoveryInProgress,
    startDiscovery,
    sendLedBrightness,
    sendBuzzerVolume,
    rssi,
    proximityPercent
  };
}