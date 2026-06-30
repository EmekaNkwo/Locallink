export interface BleDevice {
  id: string;
  name: string;
  signal: number;
  distanceMeters: number;
  paired: boolean;
  batteryLevel?: number;
}
