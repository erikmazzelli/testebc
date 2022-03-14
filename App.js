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
import { BleManager } from 'react-native-ble-plx';
import NetInfo from '@react-native-community/netinfo';
import RNBluetoothClassic, {
  BluetoothDevice,
  BluetoothEventType
} from 'react-native-bluetooth-classic';

LogBox.ignoreLogs(['new']);

const App: () => Node = () => {
  const manager = new BleManager();

  const [online, setOnline] = useState();
  const [bluetooth, setBluetooth] = useState();
  const [device, setDevice] = useState();

  useEffect(() => {
    const fetchNetwork = async () => {
      const state = await NetInfo.fetch();
      setOnline(!!(state.isConnected && state.isInternetReachable));
    };

    // const fetchBLE = async () => {
    //   const state = await manager.state();
    //   setBluetooth(state);
    // };

    const fetchBluetooth = async () => {
      const state = await RNBluetoothClassic.isBluetoothEnabled();

      setBluetooth(state);
    };

    fetchNetwork();
    // fetchBLE();
    fetchBluetooth();
  }, []);

  useEffect(() => {
    const subscription = () => {
      NetInfo.addEventListener(networkState => {
        const state = !!(
          networkState.isConnected && networkState.isInternetReachable
        );
        return setOnline(state);
      });
    };

    return () => subscription();
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

  // useEffect(() => {
  //   const subscription = manager.onStateChange(state => {
  //     // if (state === 'PoweredOn') {
  //     //   // scanAndConnect();
  //     // }

  //     setBluetooth(state);
  //   });

  //   return () => subscription.remove();
  // }, []);

  // const scanAndConnect = () => {
  //   manager.startDeviceScan(null, null, (error, device) => {
  //     if (error) {
  //       return console.log(error);
  //     }

  //     //Encontrar alguma info que identifique a maleta e conectar e sincronizar
  //     if (device.localName === 'e Watch') {
  //       alert('Relógio');
  //     }
  //   });
  // };

  const startBLEScan = () => {
    try {
      manager.startDeviceScan(null, null, (e, d) => {
        if (e) {
          return console.log(e);
        }

        console.log(JSON.stringify(d, null, 2));
      });
    } catch (e) {
      console.log(e);
    }
  };

  const stopBLEScan = () => {
    try {
      manager.stopDeviceScan();
    } catch (e) {
      console.log(e);
    }
  };

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
      <Button title='Start BLE Scan' onPress={startBLEScan} />
      <Button title='Stop BLE Scan' onPress={stopBLEScan} />
      <Button title='Start Scan' onPress={startScan} />
      <Button title='Stop Scan' onPress={stopScan} />
      <Button title='Send Action' onPress={sendAction} />
    </SafeAreaView>
  );
};

export default App;
