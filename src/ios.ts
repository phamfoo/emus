import os from 'os'
import execa from 'execa'

export async function getIOSSimulatorList() {
  if (os.platform() !== 'darwin') {
    throw Error('The iOS Simulator is only available on macOS')
  }
  // TODO: Check if the iOS Simulator is installed

  return ['iOS_Simulator']
}

export async function startIOSSimulator() {
  return await execa('open', ['-a', 'Simulator.app'])
}
