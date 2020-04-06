import meow from 'meow'
import { getAVDs, startAVD } from './android'
import { getIOSSimulatorList, startIOSSimulator } from './ios'
import { prompt, Separator } from 'inquirer'

const cli = meow(`
  Usage
    $ emus [options]

  Options
    -a, --android             Start the Android Emulator
    -i, --ios                 Start the iOS Simulator

  Examples
    $ emus
    $ emus -a
    $ emus -i
`)

interface DeviceOption {
  name: string
  value: {
    id: string
    type: 'android' | 'ios'
  }
}

;(async () => {
  const flags = cli.flags

  let androidError = null
  let avds = []
  try {
    avds = await getAVDs()
  } catch (error) {
    androidError = error.toString()
  }

  if (!androidError && avds.length === 0) {
    androidError = "Couldn't find any Android Emulators"
  }

  let iOSError = null
  let iOSSimulators = []

  try {
    iOSSimulators = await getIOSSimulatorList()
  } catch (error) {
    iOSError = error.toString()
  }

  if (!iOSError && iOSSimulators.length === 0) {
    iOSError = "Couldn't find any iOS Simulators"
  }

  const avdOptions: DeviceOption[] = avds.map((avd: string) => ({
    name: avd,
    value: { type: 'android', id: avd },
  }))

  const iOSSimulatorOptions: DeviceOption[] = iOSSimulators.map(
    (simulator: string) => ({
      name: 'iOS Simulator',
      value: { type: 'ios', id: simulator },
    })
  )

  if (flags.a || flags.android) {
    if (avdOptions.length === 0) {
      console.error(androidError)
      process.exit(1)
    }

    showOptions(avdOptions)
  } else if (flags.i || flags.ios) {
    if (iOSSimulatorOptions.length === 0) {
      console.error(iOSError)
      process.exit(1)
    }

    showOptions(iOSSimulatorOptions)
  } else {
    if (avds.length === 0 && iOSSimulators.length === 0) {
      console.error(
        `
        ${androidError}
        ${iOSError}
        `
      )
      process.exit(1)
    }

    const options = [...iOSSimulatorOptions, ...avdOptions]
    showOptions(options)
  }
})()

async function showOptions(options: DeviceOption[]) {
  const choices = [
    ...options,
    new Separator(),
    { name: 'Exit', value: { type: 'exit' } },
  ]

  const selectedOption = await prompt([
    {
      type: 'list',
      name: 'option',
      message: 'Select the device you want to start:',
      choices: choices,
    },
  ])

  if (selectedOption) {
    if (selectedOption.option.type === 'ios') {
      await startIOSSimulator()
      process.exit(0)
    } else if (selectedOption.option.type === 'android') {
      await startAVD(selectedOption.option.id)
      process.exit(0)
    } else if (selectedOption.option.type === 'exit') {
      process.exit(0)
    }
  }
}
