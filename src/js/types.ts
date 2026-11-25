export interface Firmware {
  legend: string;
  url: string|null;
  uiParameterSelector: string;
}

export type SensorType = 'test' | 'tempds18b20' | 'tempmax6675' | 'gnssneo6mv2' | 'gnssneo6mv2_udp' | 'adctanklevel'

export type Firmwares = Record<SensorType, Firmware>
