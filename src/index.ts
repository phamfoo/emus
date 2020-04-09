import meow, { AnyFlags } from 'meow'
import { getAVDs, startAVD } from './android'
import { getIOSSimulatorList, startIOSSimulator } from './ios'
import { prompt, Separator } from 'inquirer'
import Conf from 'conf'
import { DeviceOption, CliConfig } from './types'

const config = new Conf<CliConfig>({ projectName: 'emus' })

const cli = meow(
  `
  Usage
    $ emus [options]

  Options
    -a, --android             Start the Android Emulator
    -i, --ios                 Start the iOS Simulator

  Examples
    $ emus
    $ emus -a
    $ emus -i
`,
  {
    flags: {
      help: {
        type: 'boolean',
        alias: 'h',
        default: false,
      },
      android: {
        type: 'boolean',
        alias: 'a',
        default: false,
      },
      ios: {
        type: 'boolean',
        alias: 'i',
        default: false,
      },
    },
  }
)

;(async () => {
  const flags = cli.flags
  if (flags.help) {
    cli.showHelp()
    process.exit(0)
  }

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

  if (flags.android) {
    if (avdOptions.length === 0) {
      console.error(androidError)
      process.exit(1)
    }

    showOptions(avdOptions)
  } else if (flags.ios) {
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
        ${process.platform === 'darwin' && iOSError}
        `
      )
      process.exit(1)
    }

    const options = [...iOSSimulatorOptions, ...avdOptions]
    showOptions(options)
  }
})()

async function showOptions(options: DeviceOption[]) {
  const lastOpenedById = config.get('lastOpenedById') || {}

  options.sort(function (a, b) {
    const aLastOpened = lastOpenedById[a.value.id] || ''
    const bLastOpened = lastOpenedById[b.value.id] || ''

    // Show the more recently opened devices first
    if (aLastOpened > bLastOpened) {
      return -1
    }
    if (bLastOpened > aLastOpened) {
      return 1
    }

    // Show iOS simulator first
    if (a.value.type === 'ios') {
      return -1
    }
    if (b.value.type === 'ios') {
      return 1
    }

    return 0
  })

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
      await startIOSSimulator(selectedOption.option.id)
      process.exit(0)
    } else if (selectedOption.option.type === 'android') {
      await startAVD(selectedOption.option.id)
      process.exit(0)
    } else if (selectedOption.option.type === 'exit') {
      process.exit(0)
    }
  }
}
