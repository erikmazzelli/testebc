/**
 * Sample React Native App
 * https://github.com/facebook/react-native
 *
 * @format
 * @flow strict-local
 */

import React, { useEffect, useState } from 'react';
import type { Node } from 'react';
import {
  Button,
  SafeAreaView,
  Text,
  LogBox,
  PermissionsAndroid
} from 'react-native';
import RNBluetoothClassic, {
  BluetoothDevice,
  BluetoothEventType
} from 'react-native-bluetooth-classic';

LogBox.ignoreLogs(['new']);

const App: () => Node = () => {
  const [bluetooth, setBluetooth] = useState(false);
  const [device, setDevice] = useState('...');
  const [connected, setConnected] = useState(false);

  useEffect(() => {
    const fetchBluetooth = async () => {
      const isBluetoothAvailable = await RNBluetoothClassic.isBluetoothAvailable();

      if (!isBluetoothAvailable) return setBluetooth('Not Available');

      const state = await RNBluetoothClassic.isBluetoothEnabled();

      setBluetooth(state);
    };

    fetchBluetooth();
  }, []);

  useEffect(() => {
    const fetchDevice = async () => {
      const bondedDevices = await RNBluetoothClassic.getBondedDevices();
      let filteredDevice;

      bondedDevices.forEach(device => {
        if (device.name === "Pitometria") {
          filteredDevice = device;
        }
      });

      setDevice(filteredDevice);
    };

    bluetooth && fetchDevice();
  }, [bluetooth]);

  useEffect(() => {
    const subscription = RNBluetoothClassic.onStateChanged(async (state) => {
      setBluetooth(state.enabled);
    });

    return () => subscription.remove();
  }, []);

  const requestAccessFineLocationPermission = async () => {
    const granted = await PermissionsAndroid.request(
      PermissionsAndroid.PERMISSIONS.ACCESS_FINE_LOCATION,
      {
        title: 'Access fine location required for discovery',
        message:
          'In order to perform discovery, you must enable/allow' +
          'fine location access.',
        buttonNeutral: 'Ask Me Later',
        buttonNegative: 'Cancel',
        buttonPositive: 'Ok'
      }
    );

    return granted === PermissionsAndroid.RESULTS.GRANTED;
  };

  const startScan = async () => {
    try {
      const granted = await requestAccessFineLocationPermission();

      if (!granted) return alert('Access fine location was not granted');

      const devices = await RNBluetoothClassic.startDiscovery();

      let deviceList = [];

      devices.forEach((device, index) => {
        deviceList[index] = `${device.name}`;
      });

      console.log(deviceList);
    } catch (e) {
      console.log(e);
    }
  };

  const stopScan = async () => {
    try {
      await RNBluetoothClassic.cancelDiscovery();
    } catch (e) {
      console.log(e);
    }
  };

  const startConnection = async () => {
    try {
      const response = await device.connect();
      console.log(`Connection: ${response}`);
      setConnected(response);
    } catch (e) {
      console.log(e);
    }
  };

  const stopConnection = async () => {
    try {
      const response = await device.disconnect();
      console.log(`Disconnection: ${response}`);
      setConnected(!response);
    } catch (e) {
      console.log(e);
    }
  };

  const sendAction = async (command) => {
    command = String(command);

    try {
      if (device !== '...' && connected) {
        await device.write(`AT+${command}\r\n`);

        const response1 = await device.read();
        const response2 = await device.read();

        console.log(`
        Response:
        ${response1}
        ${response2}
        `);

        return alert(`
        Response:
        ${response1}
        ${response2}
        `);
      } else {
        return alert('Dispositivo não pareado ou desconectado');
      }
    } catch (e) {
      console.log(e);
    }
  };

  return (
    <SafeAreaView
      style={{ flex: 1, justifyContent: 'space-evenly', alignItems: 'center' }}
    >
      <Text style={{ fontSize: 16 }}>
        {
          `
          Bluetooth enabled: ${bluetooth}

          Paired Device: ${device?.name || '...'}

          Is Connected: ${connected}
          `
        }
      </Text>
      <Button
        title='Start Scan'
        onPress={startScan}
        disabled={bluetooth === 'Not Available'}
      />
      <Button
        title='Stop Scan'
        onPress={stopScan}
        disabled={bluetooth === 'Not Available'}
      />
      <Button
        title='Start Connection'
        onPress={startConnection}
        disabled={bluetooth === 'Not Available'}
      />
      <Button
        title='Stop Connection'
        onPress={stopConnection}
        disabled={bluetooth === 'Not Available'}
      />
      <Button
        title='Send Action'
        onPress={() => sendAction('MEDIDAS?')}
        disabled={bluetooth === 'Not Available'}
      />
    </SafeAreaView>
  );
};

export default App;
