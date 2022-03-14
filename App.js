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
  const [online, setOnline] = useState();
  const [bluetooth, setBluetooth] = useState();
  const [device, setDevice] = useState();

  useEffect(() => {
    const fetchBluetooth = async () => {
      const state = await RNBluetoothClassic.isBluetoothEnabled();

      setBluetooth(state);
    };

    fetchBluetooth();
  }, []);

  useEffect(() => {
    const subscription = RNBluetoothClassic.onStateChanged(state => {
      setBluetooth(state.enabled);
    });

    return () => subscription.remove();
  }, []);

  useEffect(() => {
    const fetchDevice = async () => {
      try {
        await RNBluetoothClassic.pairDevice('80:7D:3A:AF:F7:A2');

        const device = await RNBluetoothClassic.accept({});

        setDevice({ device });
      } catch (e) {
        console.log(e);
      }
    };

    fetchDevice();
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

      devices.forEach(device => {
        console.log(device.name);
      });

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

  const sendAction = async () => {
    try {
      console.log(device);
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
          Online: ${online}

          Bluetooth: ${bluetooth}
          `
        }
      </Text>
      <Button title='Start Scan' onPress={startScan} />
      <Button title='Stop Scan' onPress={stopScan} />
      <Button title='Send Action' onPress={sendAction} />
    </SafeAreaView>
  );
};

export default App;
