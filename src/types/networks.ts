import crabRegistryType from "./crab";
import darwiniaRegistryType from "./darwinia";


export const NETWORK_LIST = [
  {
    key: "kusama",
    value: "kusama"
  },
  {
    key: "darwinia",
    value: "darwinia"
  },
  {
    key: "crab",
    value: "crab"
  },
  {
    key: "polkadot",
    value: "polkadot"
  }
]

export const ENDPOINTS_MAP = {
  polkadot: {
    wss: 'wss://rpc.polkadot.io',
    prefix: 0,
    types: {}
  },
  kusama: {
    wss: 'wss://kusama-rpc.polkadot.io',
    prefix: 2,
    types: {}
  },
  crab: {
    wss: 'wss://crab.darwinia.network',
    prefix: 42,
    types: crabRegistryType
  },
  darwinia: {
    wss: 'wss://cc1.darwinia.network',
    prefix: 18,
    types: darwiniaRegistryType
  }
}
