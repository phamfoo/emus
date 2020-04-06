export interface CliConfig {
  lastOpenedById: {
    [key: string]: string
  }
}

export interface DeviceOption {
  name: string
  value: {
    id: string
    type: 'android' | 'ios'
  }
}
