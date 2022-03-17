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
  BackHandler
} from 'react-native';
import RNBluetoothClassic from 'react-native-bluetooth-classic';

LogBox.ignoreLogs(['new']);

const App: () => Node = () => {
  const [bluetoothEnabled, setBluetoothEnabled] = useState(false);
  const [device, setDevice] = useState('...');
  const [connected, setConnected] = useState(false);
  const [logEnabled, setTeste] = useState(false);
  const [data, setData] = useState([]);

  useEffect(() => {
    const fetchBluetooth = async () => {
      const isBluetoothAvailable = await RNBluetoothClassic.isBluetoothAvailable();

      if (!isBluetoothAvailable) return setBluetoothEnabled(false);

      const state = await RNBluetoothClassic.isBluetoothEnabled();

      setBluetoothEnabled(state);

      if (!state) {
        try {
          await RNBluetoothClassic.requestBluetoothEnabled();
        } catch (e) {
          if (e.message = 'User did not enable Bluetooth') {
            return BackHandler.exitApp();
          }

          console.log(e);
        }
      }
    };

    fetchBluetooth();
  }, [bluetoothEnabled]);

  useEffect(() => {
    const fetchDevice = async () => {
      const pairedDevices = await RNBluetoothClassic.getBondedDevices();

      const filteredDevice = pairedDevices.find(device => {
        return device.name === 'Pitometria';
      });

      setDevice(filteredDevice);

      if (!filteredDevice) alert(
        'Pairing with a compatible device is required'
      );
    };

    bluetoothEnabled && fetchDevice();
  }, [bluetoothEnabled]);

  useEffect(() => {
    const subscription = RNBluetoothClassic.onStateChanged(state => {
      setBluetoothEnabled(state.enabled);

      if (!state.enabled) {
        setConnected(state.enabled);
        setDevice('...');
      }
    });

    return () => subscription.remove();
  }, []);

  useEffect(() => {
    const interval = setInterval(async () => {
      const date = new Date;

      try {
        await device.write('1');

        const response = await device.read();

        return console.log(`
          Date (HH:MM:SS:Ms): ${date.getHours()}:${date.getMinutes().toLocaleString()}:${date.getSeconds()}:${date.getMilliseconds()}
          Response: ${response}
          `);

      } catch (e) {
        console.log(e);
      }
    }, 1000);


    if (!logEnabled) return clearInterval(interval);

    return () => clearInterval(interval);
  }, [logEnabled]);

  const startConnection = async () => {
    try {
      if (!connected) {
        const response = await device.connect();
        console.log(`Connection: ${response}`);
        setConnected(response);
      }
    } catch (e) {
      console.log(e);
    }
  };

  const stopConnection = async () => {
    try {
      if (connected) {
        const response = await device.disconnect();
        console.log(`Disconnection: ${response}`);
        setConnected(!response);
      }
    } catch (e) {
      console.log(e);
    }
  };

  const startLog = () => {
    setTeste(!logEnabled);
    if (!logEnabled) {
      console.log('Iniciando log');
    } else {
      console.log('Encerrando log');
    }
  };

  const readAction = async (command) => {
    command = String(command);

    try {
      await device.write(`AT+${command}?\r\n`);
      const available = await device.available();

      if (available > 0) {
        for (let i = 0; i < available; i++) {
          let response = await device.read();
          console.log(i);
          setData([response, ...data]);
        }
      }
      console.log(data);
    } catch (e) {
      console.log(e);
    }
  };

  const writeAction = async (command, value) => {
    command = String(command);
    value = String(value);

    try {
      await device.write(`AT+${command}=${value}\r\n`);
      const available = await device.available();

      if (available > 0) {
        for (let i = 0; i < available; i++) {
          let data = await device.read();
          console.log(data);
        }
      }
    } catch (e) {
      console.log(e);
    }
  };

  // const testIFC = async (command) => {
  //   try {
  //     await device.write(command);

  //     const available = await device.available();

  //     if (available > 0) {
  //       for (let i = 0; i < available; i++) {
  //         const data = await device.read();
  //         console.log(data);
  //       }
  //     }
  //   } catch (e) {
  //     console.log(e);
  //   }
  // };

  return (
    <SafeAreaView
      style={{ flex: 1, justifyContent: 'space-evenly', alignItems: 'center' }}
    >
      <Text style={{ fontSize: 16 }}>
        {
          `
          Bluetooth enabled: ${bluetoothEnabled}

          Paired Device: ${device?.name || '...'}

          Is Connected: ${connected}
          `
        }
      </Text>
      <Button
        title='Start Connection'
        onPress={startConnection}
        disabled={!bluetoothEnabled}
      />
      <Button
        title='Stop Connection'
        onPress={stopConnection}
        disabled={!bluetoothEnabled}
      />
      <Button
        title={logEnabled ? 'Stop Logging' : 'Start Logging'}
        onPress={() => startLog()}
        disabled={!bluetoothEnabled}
      />
      <Button
        title='Read Action'
        onPress={() => readAction('MEDIDAS')}
        disabled={!bluetoothEnabled}
      />
      <Button
        title='Write Action'
        onPress={() => writeAction('DATAHORA', '170322073900')}
        disabled={!bluetoothEnabled}
      />
      {/* <Button
        title='IFC050P'
        onPress={() => testIFC('1')}
        disabled={!bluetoothEnabled}
      /> */}
    </SafeAreaView>
  );
};

export default App;
