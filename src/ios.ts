import os from 'os'
import execa from 'execa'
import Conf from 'conf'
import { CliConfig } from './types'
const config = new Conf<CliConfig>()

export async function getIOSSimulatorList() {
  if (os.platform() !== 'darwin') {
    throw Error('The iOS Simulator is only available on macOS')
  }
  // TODO: Check if the iOS Simulator is installed

  return ['iOS_Simulator']
}

export async function startIOSSimulator(id: string) {
  let lastOpenedById = config.get('lastOpenedById') || {}
  lastOpenedById = { ...lastOpenedById, [id]: new Date().toString() }
  config.set('lastOpenedById', lastOpenedById)

  return await execa('open', ['-a', 'Simulator.app'])
}
