import { useState, useCallback, useRef } from 'react';

const SERVICE_UUID = '12345678-1234-1234-1234-123456789abc';
const LED_WRITE_UUID = 'deadbeef-1234-1234-1234-123456789abc';
const BUZZER_WRITE_UUID = 'deadbeef-1234-1234-1234-123456789abd';

export default function useBLE() {
  const [connectedDevice, setConnectedDevice] = useState(null);
  const [discoveryInProgress, setDiscoveryInProgress] = useState(false);
  const deviceRef = useRef(null);
  const ledCharacteristicRef = useRef(null);
  const buzzerCharacteristicRef = useRef(null);

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

      deviceRef.current = device;

      setConnectedDevice({
        id: device.id,
        name: device.name || 'Unknown Device',
        device
      });

      console.log('Connected to:', device.name);
    } catch (error) {
      console.error('Connection error:', error);
      alert('Failed to connect: ' + error.message);
    }
  }, []);

  const disconnect = useCallback(async () => {
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
      setConnectedDevice(null);
    }
  }, []);

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

  return {
    connectedDevice,
    connect,
    disconnect,
    discoveryInProgress,
    startDiscovery,
    sendLedBrightness,
    sendBuzzerVolume
  };
}