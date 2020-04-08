import fs from 'fs'
import os from 'os'
import path from 'path'
import util from 'util'
import execa from 'execa'
import { CliConfig } from './types'
import Conf from 'conf'

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

async function getAndroidEmulatorPath() {
  // If either $ANDROID_HOME or $ANDROID_SDK_ROOT has been set to the correct value, use it
  if (process.env.ANDROID_HOME) {
    try {
      return await findEmulatorFromSdkPath(process.env.ANDROID_HOME)
    } catch (error) {
      throw new Error(
        `
        Couldn't find the Android Emulator in: '${process.env.ANDROID_HOME}'
        Make sure your $ANDROID_HOME environment variable is pointed to the correct SDK installation directory.
        `
      )
    }
  } else if (process.env.ANDROID_SDK_ROOT) {
    try {
      return await findEmulatorFromSdkPath(process.env.ANDROID_SDK_ROOT)
    } catch (error) {
      throw new Error(
        `
        Couldn't find the Android Emulator in: '${process.env.ANDROID_SDK_ROOT}'
        Make sure your $ANDROID_SDK_ROOT environment variable is pointed to the correct SDK installation directory.
        `
      )
    }
  } else {
    // If $ANDROID_HOME and $ANDROID_SDK_ROOT haven't been set,
    // try to guess the path to the Android SDK
    let sdkPath = null
    if (process.platform === 'win32') {
      sdkPath = path.normalize(
        path.join(process.env.USERPROFILE, '/AppData/Local/Android/Sdk/')
      )
    } else {
      sdkPath = path.normalize(
        path.join(process.env.HOME, '/Library/Android/sdk/')
      )
    }
    try {
      return await findEmulatorFromSdkPath(sdkPath)
    } catch (error) {
      throw new Error(
        'Unable to locate the Android SDK, please set the $ANDROID_HOME or $ANDROID_SDK_ROOT environment variable.'
      )
    }
  }
}

async function findEmulatorFromSdkPath(sdkPath: string) {
  const emulatorPaths = ['/emulator/emulator', '/tools/emulator']

  for (let i = 0; i < emulatorPaths.length; i++) {
    const emulatorPath = emulatorPaths[i]
    try {
      const emulatorFullPath = path.normalize(path.join(sdkPath, emulatorPath))
      await access(emulatorFullPath)
      return emulatorFullPath
      // eslint-disable-next-line no-empty
    } catch (error) {}
  }

  throw new Error("Couldn't to find the Android Emulator in ${sdkPath}")
}
