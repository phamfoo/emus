import fs from 'fs'
import os from 'os'
import path from 'path'
import util from 'util'
import execa from 'execa'
import { CliConfig } from './types'
import Conf from 'conf'
import isWsl from 'is-wsl'

const access = util.promisify(fs.access)
const config = new Conf<CliConfig>({ projectName: 'emus' })

export async function getAVDs() {
  const emulatorPath = await getAndroidEmulatorPath()

  const { stdout } = await execa(emulatorPath, ['-list-avds'])
  let avdList = []
  if (stdout.length) {
    avdList = stdout.split(os.EOL)
  }

  return avdList
}

export async function startAVD(avd: string) {
  let lastOpenedById = config.get('lastOpenedById') || {}
  lastOpenedById = { ...lastOpenedById, [avd]: new Date().toString() }
  config.set('lastOpenedById', lastOpenedById)

  const emulatorPath = await getAndroidEmulatorPath()
  execa(emulatorPath, ['-avd', avd], {
    stdio: 'ignore',
    detached: true,
  }).unref()
}

async function getAndroidSDKPath() {
  let sdkPath = null

  // If either $ANDROID_HOME or $ANDROID_SDK_ROOT has been set to the correct value, use it
  if (process.env.ANDROID_HOME) {
    try {
      sdkPath = process.env.ANDROID_HOME
      await access(sdkPath)
    } catch (error) {
      throw new Error(`The $ANDROID_HOME environment variable is not correct.`)
    }
  } else if (process.env.ANDROID_SDK_ROOT) {
    try {
      sdkPath = process.env.ANDROID_SDK_ROOT
      await access(sdkPath)
    } catch (error) {
      throw new Error(
        `The $ANDROID_SDK_ROOT environment variable is not correct.`
      )
    }
  } else {
    // If $ANDROID_HOME and $ANDROID_SDK_ROOT haven't been set,
    // try to guess the path to the Android SDK
    if (process.platform === 'win32' || isWsl) {
      sdkPath = path.normalize(
        path.join(process.env.USERPROFILE, '/AppData/Local/Android/Sdk/')
      )
    } else {
      sdkPath = path.normalize(
        path.join(process.env.HOME, '/Library/Android/sdk/')
      )
    }
    try {
      await access(sdkPath)
    } catch (error) {
      throw new Error(
        `Couldn't locate the Android SDK, please set the $ANDROID_HOME or $ANDROID_SDK_ROOT environment variable.`
      )
    }
  }

  return sdkPath
}

async function getAndroidEmulatorPath() {
  const sdkPath = await getAndroidSDKPath()

  return path.normalize(path.join(sdkPath, '/emulator/emulator'))
}
