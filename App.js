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
  BackHandler,
  Switch
} from 'react-native';
import RNBluetoothClassic from 'react-native-bluetooth-classic';

const App: () => Node = () => {
  const [bluetoothEnabled, setBluetoothEnabled] = useState(false);
  const [device, setDevice] = useState('...');
  const [connected, setConnected] = useState(false);
  const [logEnabled, setLogEnabled] = useState(false);
  const [switchEnabled, setSwitchEnabled] = useState(false);
  const [fetching, setFetching] = useState(false);

  useEffect(() => {
    const checkBluetoothState = async () => {
      const isBluetoothAvailable = await RNBluetoothClassic
        .isBluetoothAvailable();

      if (!isBluetoothAvailable) return setBluetoothEnabled(false);

      const state = await RNBluetoothClassic.isBluetoothEnabled();

      setBluetoothEnabled(state);

      if (!state) {
        try {
          await RNBluetoothClassic.requestBluetoothEnabled();
        } catch (e) {
          if (e.message === 'User did not enable Bluetooth') {
            return BackHandler.exitApp();
          }

          console.log(e);
        }
      }
    };

    checkBluetoothState();
  }, [bluetoothEnabled]);

  useEffect(() => {
    const searchForDevices = async () => {
      const pairedDevices = await RNBluetoothClassic.getBondedDevices();
      let desiredDevice = switchEnabled ? 'Pitometria' : 'ERIC_BT';
      const filteredDevice = pairedDevices.find(device => {
        return device.name === desiredDevice;
      });

      setDevice(filteredDevice);

      if (!filteredDevice) return alert(
        'Pairing with a compatible device is required'
      );
    };

    bluetoothEnabled && searchForDevices();
  }, [bluetoothEnabled, switchEnabled]);

  useEffect(() => {
    const bluetoothStateListener = RNBluetoothClassic
      .onStateChanged(state => {
        setBluetoothEnabled(state.enabled);

        if (!state.enabled) {
          setConnected(state.enabled);
          setDevice('...');
        }
      });

    return () => bluetoothStateListener.remove();
  }, []);

  useEffect(() => {
    const disconnectionListener = RNBluetoothClassic
      .onDeviceDisconnected(() => {
        setConnected(false);
      });

    return () => disconnectionListener.remove();
  }, []);

  useEffect(() => {
    let i = 0;
    const executeRead = async () => {
      while (logEnabled && i < 10) {

        const write = await writeAction(
          switchEnabled ?
            'MEDIDAS' :
            '1'
        );
        const available = await getAvailable();
        const read = await readAction(available);
        console.log('EXECUTANDO LEITURA');
        await Promise.all([write, available, read]).then(values => {
          console.log(values[2]);
        });
        i++;
      };
    };

    logEnabled && readFromDevice('MEDIDAS', 10);
  }, [logEnabled]);

  const toggleConnection = async () => {
    try {
      if (!connected) {
        const response = await device.connect();
        console.log(`Connection: ${response}`);
        return setConnected(response);
      }

      const response = await device.disconnect();
      console.log(`Disconnection: ${response}`);
      setConnected(!response);
    } catch (e) {
      console.log(e);
    }
  };

  const toggleLogging = () => setLogEnabled(!logEnabled);

  const writeAction = async (command) => {
    try {
      await device.write(
        switchEnabled ?
          `AT+${command}?\r\n` :
          command
      );
    } catch (e) {
      console.log(e);
    }
  };

  const getAvailable = async () => {
    try {
      const available = await device.available();
      return available;
    } catch (e) {
      console.log(e);
    }
  };

  const readAction = async (available) => {
    try {
      if (available > 0) {
        let data = [];
        for (let i = 0; i < available; i++) {
          data.push(await device.read());
        }
        return data;
      }
    } catch (e) {
      console.log(e);
    }
  };

  const readFromDevice = async (command, iteracoes) => {
    try {
      let i = 1;
      while (i <= iteracoes) {
        console.log('Fetching');
        const write = await writeAction(command);
        const available = await getAvailable();
        const read = await readAction(available);
        await Promise.all([write, available, read]).then(values => {
          console.log('Response: ', values[2]);
        });
        i++;
      }
    } catch (e) {
      console.log(e);
    }
  };

  const readFromEsp = async (command, iteracoes = 0) => {
    try {
      let i = 1;
      while (i <= iteracoes) {
        console.log('Fetching');
        await writeAction(command);
        const available = await getAvailable();
        const read = await readAction(available);
        console.log('Response: ', read);
        i++;
      }
    } catch (e) {
      console.log(e);
    }
  };

  const writeOnDevice = async (command, value) => {
    try {
      await device.write(`AT+${command}=${value}\r\n`);
      const available = await device.available();

      if (available > 0) {
        let data = [];
        for (let i = 0; i < available; i++) {
          data.push(await device.read());
        }
        return console.log(data);
      }
      console.log('Leitura nula');
    } catch (e) {
      console.log(e);
    }
  };

  const asyncFunc = () => {
    return new Promise((resolve, reject) => {
      setFetching(true);
      setTimeout(() => {
        resolve('done');
        setFetching(false);
      }, 5000);
    });
  };

  const testAsync = async () => {
    try {
      console.log('Fetching');
      const result = await asyncFunc();
      console.log(result);
    } catch (e) {
      console.log(e);
    }
  };

  return (
    <SafeAreaView
      style={{
        flex: 1,
        justifyContent: 'space-evenly',
        alignItems: 'center'
      }}
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
      <Switch
        onValueChange={() => {
          setConnected(false);
          setSwitchEnabled(!switchEnabled);
        }}
        value={switchEnabled}
      />
      <Button
        title={connected ? 'Stop Connection' : 'Start Connection'}
        onPress={toggleConnection}
        disabled={!bluetoothEnabled}
      />
      <Button
        title={logEnabled ? 'Stop Logging' : 'Start Logging'}
        onPress={toggleLogging}
        disabled={!bluetoothEnabled}
      />
      <Button
        title='Read Action'
        onPress={() =>
          switchEnabled ?
            readFromDevice('MEDIDAS') :
            readFromEsp('1')
        }
        disabled={!bluetoothEnabled}
      />
      <Button
        title='Write Action'
        onPress={() => writeOnDevice('ARQUIVO_CONTEUDO', 'data/Conaut2.csv')}
        disabled={!bluetoothEnabled || !switchEnabled}
      />
    </SafeAreaView>
  );
};

export default App;
