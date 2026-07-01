export interface DiscoveredDevice {
  id: string;
  name: string;
  paired: boolean;
  batteryLevel?: number;
}
