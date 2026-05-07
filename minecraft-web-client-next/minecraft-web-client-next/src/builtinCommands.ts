import fs from 'fs'
import { join } from 'path'
import JSZip from 'jszip'
import { getThreeJsRendererMethods } from 'renderer/viewer/three/threeJsMethods'
import { fsState, readLevelDat } from './loadSave'
import { closeWan, openToWanAndCopyJoinLink } from './localServerMultiplayer'
import { copyFilesAsync, uniqueFileNameFromWorldName } from './browserfs'
import { saveServer } from './flyingSquidUtils'
import { setLoadingScreenStatus } from './appStatus'
import { displayClientChat } from './botUtils'
import { miscUiState } from './globalState'

const notImplemented = () => {
  return 'Not implemented yet'
}

async function addFolderToZip (folderPath, zip, relativePath) {
  const entries = await fs.promises.readdir(folderPath)

  for (const entry of entries) {
    const entryPath = join(folderPath, entry)
    const stats = await fs.promises.stat(entryPath)

    const zipEntryPath = join(relativePath, entry)

    if (stats.isDirectory()) {
      const subZip = zip.folder(zipEntryPath)
      await addFolderToZip(entryPath, subZip, zipEntryPath)
    } else {
      const fileData = await fs.promises.readFile(entryPath)
      zip.file(entry, fileData)
    }
  }
}

export const exportWorld = async (path: string, type: 'zip' | 'folder', zipName = 'world-prismarine-exported') => {
  try {
    if (type === 'zip') {
      setLoadingScreenStatus('Generating zip, this may take a few minutes')
      const zip = new JSZip()
      await addFolderToZip(path, zip, '')

      // Generate the ZIP archive content
      const zipContent = await zip.generateAsync({ type: 'blob' })

      // Create a download link and trigger the download
      const downloadLink = document.createElement('a')
      downloadLink.href = URL.createObjectURL(zipContent)
      // todo use loaded zip/folder name
      downloadLink.download = `${zipName}.zip`
      downloadLink.click()

      // Clean up the URL object after download
      URL.revokeObjectURL(downloadLink.href)
    } else {
      setLoadingScreenStatus('Preparing export folder')
      let dest = '/'
      if ((await fs.promises.readdir('/export')).length) {
        const { levelDat } = (await readLevelDat(path))!
        dest = await uniqueFileNameFromWorldName(levelDat.LevelName, path)
      }
      setLoadingScreenStatus(`Copying files to ${dest} of selected folder`)
      await copyFilesAsync(path, '/export' + dest)
    }
  } finally {
    setLoadingScreenStatus(undefined)
  }
}

// todo include in help
const exportLoadedWorld = async () => {
  await saveServer()
  let worldFolder = fsState.inMemorySavePath
  if (!worldFolder.startsWith('/')) worldFolder = `/${worldFolder}`
  await exportWorld(worldFolder, 'zip')
}

window.exportWorld = exportLoadedWorld

const writeText = (text) => {
  displayClientChat(text)
}

/** Named phases → Minecraft day time ticks (0–24000). Server advances time when doDaylightCycle is on. */
const SET_TIME_ALIASES: Record<string, number> = {
  morning: 1000,
  day: 6000,
  afternoon: 11000,
  night: 13000,
  midnight: 18000,
  'mid night': 18000,
}

const setTimeFromAlias = (argRaw: string): number | undefined => {
  const arg = argRaw.trim().toLowerCase()
  if (!arg) return undefined
  if (/^\d+$/.test(arg)) {
    return parseInt(arg, 10) % 24000
  }
  return SET_TIME_ALIASES[arg]
}

export const commands: Array<{
  command: string[],
  alwaysAvailable?: boolean,
  invoke (args: string[]): Promise<void> | void
  //@ts-format-ignore-region
}> = [
  {
    command: ['/download', '/export'],
    invoke: exportLoadedWorld
  },
  {
    command: ['/publish', '/share'],
    async invoke () {
      const text = await openToWanAndCopyJoinLink(writeText)
      if (text) writeText(text)
    }
  },
  {
    command: ['/close'],
    invoke () {
      const text = closeWan()
      if (text) writeText(text)
    }
  },
  {
    command: ['/save'],
    async invoke () {
      await saveServer(false)
      writeText('Saved to browser memory')
    }
  },
  {
    command: ['/pos'],
    alwaysAvailable: true,
    async invoke ([type]) {
      let pos: { x: number, y: number, z: number } | undefined
      if (type === 'block') {
        const blockPos = window.cursorBlockRel()?.position
        if (blockPos) {
          pos = { x: blockPos.x, y: blockPos.y, z: blockPos.z }
        }
      } else {
        const playerPos = bot.entity.position
        pos = { x: playerPos.x, y: playerPos.y, z: playerPos.z }
      }
      if (!pos) return
      const formatted = `${pos.x.toFixed(2)} ${pos.y.toFixed(2)} ${pos.z.toFixed(2)}`
      await navigator.clipboard.writeText(formatted)
      writeText(`Copied position to clipboard: ${formatted}`)
    }
  },
  {
    command: ['/mesherlog'],
    alwaysAvailable: true,
    invoke () {
      getThreeJsRendererMethods()?.downloadMesherLog()
    }
  },
  {
    command: ['/set'],
    invoke (args) {
      if (args[0]?.toLowerCase() !== 'time') {
        writeText('Usage: /set time <morning | day | afternoon | night | midnight | 0-24000>')
        return
      }
      const rest = args.slice(1).join(' ').trim()
      if (!rest) {
        writeText('Usage: /set time <morning | day | afternoon | night | midnight | 0-24000>')
        return
      }
      const ticks = setTimeFromAlias(rest)
      if (ticks === undefined) {
        writeText(`Unknown time “${rest}”. Try: morning, day, afternoon, night, midnight, or a number.`)
        return
      }
      bot.chat(`/time set ${ticks}`)
    }
  }
]
//@ts-format-ignore-endregion

export const getBuiltinCommandsList = () => {
  const base = commands.filter(command => command.alwaysAvailable || miscUiState.singleplayer).flatMap(command => command.command)
  return miscUiState.singleplayer ? [...base, '/set time'] : base
}

export const tryHandleBuiltinCommand = (message: string) => {
  const trimmed = message.trim()
  const [userCommand, ...args] = trimmed.split(/\s+/)

  for (const command of commands.filter(command => command.alwaysAvailable || miscUiState.singleplayer)) {
    if (command.command.includes(userCommand)) {
      void command.invoke(args) // ignoring for now
      return true
    }
  }
}
