import { Firmwares } from './types'

export const FIRMWARES: Firmwares = {
  none: {
    legend: 'No sensor',
    url: null
  },
  test: {
    legend: 'Test sensor',
    url: '/firmware/firmware_test_http.bin'
  },
  tempds18b20: {
    legend: 'Temperature sensor DS18B20',
    url: '/firmware/firmware_temp_ds18b20.bin'
  },
  tempmax6675: {
    legend: 'Temperature sensor MAX6675',
    url: '/firmware/firmware_temp_max6675.bin'
  },
  gnssneo6mv2: {
    legend: 'GNSS sensor NEO6MV2 (SignalK)',
    url: '/firmware/firmware_gnss_neo6mv2.bin'
  },
  gnssneo6mv2_udp: {
    legend: 'GNSS sensor NEO6MV2 (UDP)',
    url: '/firmware/firmware_gnss_neo6mv2_udp.bin'
  },
  adctanklevel: {
    legend: 'ADC Tanklevel sensor',
    url: '/firmware/firmware_adc_tanklevel.bin'
  }
}

import { SensorParameter } from './SensorParameters'

export const SENSOR_PARAMETERS: SensorParameter[] = [
  {
    htmlId: '#sensorParameterHostname',
    key: 'hostname',
    value: null,
    type: 'string',
  },
  {
    htmlId: '#sensorParameterSsid',
    key: 'ssid',
    value: null,
    type: 'string',
  },
  {
    htmlId: '#sensorParameterPass',
    key: 'pass',
    value: null,
    type: 'string',
  },
  {
    htmlId: '#sensorParameterSensorDelay',
    key: 'delay',
    value: null,
    type: 'int',
  },
  {
    htmlId: '#sensorParameterKey',
    key: 'key',
    value: null,
    type: 'string',
  },
  {
    htmlId: '#sensorParameterServerHost',
    key: 'srvhost',
    value: null,
    type: 'string',
  },
  {
    htmlId: '#sensorParameterServerPort',
    key: 'srvport',
    value: null,
    type: 'int',
  },
  {
    htmlId: '#sensorParameterServerToken',
    key: 'srvtoken',
    value: null,
    type: 'int',
  },
  {
    htmlId: '#sensorParameterADCTanklevel0',
    key: 'adctank0',
    value: null,
    type: 'int',
  },
  {
    htmlId: '#sensorParameterADCTanklevel100',
    key: 'adctank1',
    value: null,
    type: 'int',
  }
]
