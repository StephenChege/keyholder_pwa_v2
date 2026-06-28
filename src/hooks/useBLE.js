import { useState, useCallback, useRef } from 'react';

const SERVICE_UUID = '12345678-1234-1234-1234-123456789abc';
const RSSI_CHARACTERISTIC_UUID = 'abcd1234-5678-1234-5678-abcdef123457';
const LED_WRITE_CHARACTERISTIC_UUID = 'deadbeef-1234-1234-1234-123456789abc';      // LED brightness
const BUZZER_WRITE_CHARACTERISTIC_UUID = 'deadbeef-1234-1234-1234-123456789abd';   // Buzzer volume

export default function useBLE() {
  const [devices, setDevices] = useState([]);
  const [connectedDevice, setConnectedDevice] = useState(null);
  const [discoveryInProgress, setDiscoveryInProgress] = useState(false);
  const deviceRef = useRef(null);
  const rssiCharacteristicRef = useRef(null);
  const ledCharacteristicRef = useRef(null);
  const buzzerCharacteristicRef = useRef(null);

  const connect = useCallback(async (deviceId, deviceName) => {
    if (!navigator.bluetooth) {
      alert('Web Bluetooth API not available on this browser');
      return;
    }

    try {
      const device = await navigator.bluetooth.requestDevice({
        optionalServices: [SERVICE_UUID],
        filters: [
          { name: deviceName },
          { services: [SERVICE_UUID] }
        ]
      });

      const server = await device.gatt.connect();
      const service = await server.getPrimaryService(SERVICE_UUID);
      
      // Get RSSI characteristic for reading proximity
      const rssiCharacteristic = await service.getCharacteristic(RSSI_CHARACTERISTIC_UUID);
      await rssiCharacteristic.startNotifications();
      rssiCharacteristicRef.current = rssiCharacteristic;

      // Get LED write characteristic
      const ledCharacteristic = await service.getCharacteristic(LED_WRITE_CHARACTERISTIC_UUID);
      ledCharacteristicRef.current = ledCharacteristic;

      // Get Buzzer write characteristic
      const buzzerCharacteristic = await service.getCharacteristic(BUZZER_WRITE_CHARACTERISTIC_UUID);
      buzzerCharacteristicRef.current = buzzerCharacteristic;

      deviceRef.current = device;

      setConnectedDevice({
        id: device.id,
        name: device.name || 'Unknown Device',
        device
      });

      console.log('Connected to device:', device.name);
      console.log('LED characteristic UUID:', LED_WRITE_CHARACTERISTIC_UUID);
      console.log('Buzzer characteristic UUID:', BUZZER_WRITE_CHARACTERISTIC_UUID);
    } catch (error) {
      console.error('Connection error:', error);
      if (error.name !== 'NotFoundError') {
        alert('Failed to connect: ' + error.message);
      }
    }
  }, []);

  const disconnect = useCallback(async () => {
    if (deviceRef.current) {
      try {
        if (rssiCharacteristicRef.current) {
          await rssiCharacteristicRef.current.stopNotifications();
        }
        deviceRef.current.gatt.disconnect();
        console.log('Disconnected from device');
      } catch (error) {
        console.error('Disconnect error:', error);
      }
      deviceRef.current = null;
      rssiCharacteristicRef.current = null;
      ledCharacteristicRef.current = null;
      buzzerCharacteristicRef.current = null;
      setConnectedDevice(null);
    }
  }, []);

  const startDiscovery = useCallback(async () => {
    if (!navigator.bluetooth) {
      alert('Web Bluetooth API not available on this browser');
      return;
    }

    setDiscoveryInProgress(true);
    try {
      const device = await navigator.bluetooth.requestDevice({
        optionalServices: [SERVICE_UUID],
        filters: [
          { services: [SERVICE_UUID] }
        ]
      });

      setDevices(prev => {
        const exists = prev.find(d => d.id === device.id);
        return exists ? prev : [...prev, {
          id: device.id,
          name: device.name || 'Unknown Device'
        }];
      });

      if (device) {
        await connect(device.id, device.name);
      }
    } catch (error) {
      if (error.name === 'NotFoundError') {
        console.log('Device selection cancelled');
      } else {
        console.error('Discovery error:', error);
      }
    } finally {
      setDiscoveryInProgress(false);
    }
  }, [connect]);

  const renameDevice = useCallback((deviceId, newName) => {
    setConnectedDevice(prev => {
      if (prev?.id === deviceId) {
        return { ...prev, name: newName };
      }
      return prev;
    });
  }, []);

  // Send LED brightness (0-255)
  const sendLedBrightness = useCallback(async (brightness) => {
    if (!ledCharacteristicRef.current) return;

    try {
      const data = new Uint8Array([Math.min(Math.max(brightness, 0), 255)]);
      await ledCharacteristicRef.current.writeValue(data);
      console.log('LED brightness sent:', brightness);
    } catch (error) {
      console.error('Send LED brightness error:', error);
    }
  }, []);

  // Send buzzer volume (0-255)
  const sendBuzzerVolume = useCallback(async (volume) => {
    if (!buzzerCharacteristicRef.current) return;

    try {
      const data = new Uint8Array([Math.min(Math.max(volume, 0), 255)]);
      await buzzerCharacteristicRef.current.writeValue(data);
      console.log('Buzzer volume sent:', volume);
    } catch (error) {
      console.error('Send buzzer volume error:', error);
    }
  }, []);

  // Backward compatible sendValue for generic use
  const sendValue = useCallback(async (value, type = 'led') => {
    if (type === 'led') {
      await sendLedBrightness(value);
    } else if (type === 'buzzer') {
      await sendBuzzerVolume(value);
    }
  }, [sendLedBrightness, sendBuzzerVolume]);

  const getRSSI = useCallback(async () => {
    if (!rssiCharacteristicRef.current) return null;

    try {
      const value = await rssiCharacteristicRef.current.readValue();
      
      const view = new DataView(value.buffer);
      const rssi = view.getInt16(0, true);
      
      return rssi;
    } catch (error) {
      console.error('Read RSSI error:', error);
      return null;
    }
  }, []);

  return {
    devices,
    connectedDevice,
    connect,
    disconnect,
    renameDevice,
    discoveryInProgress,
    startDiscovery,
    sendValue,
    sendLedBrightness,
    sendBuzzerVolume,
    getRSSI
  };
}