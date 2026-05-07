import { options } from './optionsStorage'

/** Preset keys → official-style Minecraft usernames (skins from Mojang/session services). */
export const PLAYER_AVATAR_PRESET_TO_USERNAME: Record<string, string> = {
  wanderer: 'wanderer',
  steve: 'Steve',
  alex: 'Alex',
  jeb: 'jeb_',
  dinnerbone: 'Dinnerbone',
  notch: 'Notch',
}

/** Username used for singleplayer login, skin fetch, and offline playerdata paths. */
export function getLocalPlayerUsername (): string {
  if (options.playerAvatarPreset === 'custom') {
    return options.localUsername
  }
  return PLAYER_AVATAR_PRESET_TO_USERNAME[options.playerAvatarPreset] ?? options.localUsername
}
