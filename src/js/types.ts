export interface Firmware {
  legend: string;
  url: string|null;
}

export type Firmwares = Record<string, Firmware>
