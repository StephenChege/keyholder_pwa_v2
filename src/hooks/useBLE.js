import { useState, useCallback, useRef } from 'react';

const SERVICE_UUID = '12345678-1234-1234-1234-123456789abc';
const RSSI_CHARACTERISTIC_UUID = 'abcd1234-5678-1234-5678-abcdef123457';
const WRITE_CHARACTERISTIC_UUID = 'deadbeef-1234-1234-1234-123456789abc';

export default function useBLE() {
  const [devices, setDevices] = useState([]);
  const [connectedDevice, setConnectedDevice] = useState(null);
  const [discoveryInProgress, setDiscoveryInProgress] = useState(false);
  const deviceRef = useRef(null);
  const characteristicRef = useRef(null);

  const connect = useCallback(async (deviceId, deviceName) => {
    if (!navigator.bluetooth) {
      alert('Web Bluetooth API not available on this browser');
      return;
    }

    try {
      // Request device by name (since we already know the name from saved devices)
      const device = await navigator.bluetooth.requestDevice({
        optionalServices: [SERVICE_UUID],
        filters: [
          { name: deviceName },
          { services: [SERVICE_UUID] }
        ]
      });

      const server = await device.gatt.connect();
      const service = await server.getPrimaryService(SERVICE_UUID);
      const characteristic = await service.getCharacteristic(RSSI_CHARACTERISTIC_UUID);

      // Enable notifications
      await characteristic.startNotifications();
      characteristic.addEventListener('characteristicvaluechanged', () => {
        // This will be handled by useProximity hook
      });

      deviceRef.current = device;
      characteristicRef.current = characteristic;

      setConnectedDevice({
        id: device.id,
        name: device.name || 'Unknown Device',
        device
      });

      console.log('Connected to device:', device.name);
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
        // Stop notifications
        if (characteristicRef.current) {
          await characteristicRef.current.stopNotifications();
        }
        deviceRef.current.gatt.disconnect();
        console.log('Disconnected from device');
      } catch (error) {
        console.error('Disconnect error:', error);
      }
      deviceRef.current = null;
      characteristicRef.current = null;
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

      // Automatically connect to newly discovered device
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

  const sendValue = useCallback(async (value) => {
    if (!connectedDevice?.device) return;

    try {
      const service = await connectedDevice.device.gatt.getPrimaryService(SERVICE_UUID);
      const characteristic = await service.getCharacteristic(WRITE_CHARACTERISTIC_UUID);
      
      // Send as 1-byte unsigned integer (0-255)
      const data = new Uint8Array([Math.min(value, 255)]);
      await characteristic.writeValue(data);
    } catch (error) {
      console.error('Send value error:', error);
    }
  }, [connectedDevice]);

  const getRSSI = useCallback(async () => {
    if (!connectedDevice?.device) return null;

    try {
      const service = await connectedDevice.device.gatt.getPrimaryService(SERVICE_UUID);
      const characteristic = await service.getCharacteristic(RSSI_CHARACTERISTIC_UUID);
      const value = await characteristic.readValue();
      
      // Read as 2-byte signed integer (little-endian)
      const view = new DataView(value.buffer);
      const rssi = view.getInt16(0, true);
      
      return rssi;
    } catch (error) {
      console.error('Read RSSI error:', error);
      return null;
    }
  }, [connectedDevice]);

  return {
    devices,
    connectedDevice,
    connect,
    disconnect,
    renameDevice,
    discoveryInProgress,
    startDiscovery,
    sendValue,
    getRSSI
  };
}
