import React, { useEffect, useState } from 'react'
import { proxy, useSnapshot } from 'valtio'
import { filesize } from 'filesize'
import { getAvailableServerPlugins } from '../clientMods'
import { showModal } from '../globalState'
import Input from './Input'
import Screen from './Screen'
import Button from './Button'
import SelectGameVersion from './SelectGameVersion'
import styles from './createWorld.module.css'
import { InputOption, showInputsModal, showOptionsModal } from './SelectOption'
import { withInjectableUi } from './extendableSystem'

// const worldTypes = ['default', 'flat', 'largeBiomes', 'amplified', 'customized', 'buffet', 'debug_all_block_states']
const worldTypes = ['default', 'flat', 'empty', 'nether', 'all_the_blocks']

export const creatingWorldState = proxy({
  title: '',
  seedText: '',
  type: worldTypes[0],
  gameMode: 'creative',
  version: '',
  plugins: [] as string[]
})

const seedMono: React.CSSProperties = { fontFamily: 'mojangles, minecraft, monospace' }

const CreateWorldBase = ({ cancelClick, createClick, customizeClick, versions, defaultVersion }) => {
  const [quota, setQuota] = useState('')

  const { title, seedText, type, version, gameMode, plugins } = useSnapshot(creatingWorldState)
  useEffect(() => {
    creatingWorldState.version = defaultVersion
    void navigator.storage?.estimate?.().then(({ quota, usage }) => {
      setQuota(`Storage usage: ${usage === undefined ? '?' : filesize(usage)} / ${quota ? filesize(quota) : '?'}`)
    })
  }, [])

  return <Screen title="Create world" backdrop="dirt">
    <form
      style={{ display: 'flex' }} onSubmit={(e) => {
        e.preventDefault()
        createClick()
      }}
    >
      <Input
        autoFocus
        value={title}
        onChange={({ target: { value } }) => {
          creatingWorldState.title = value
        }}
        placeholder='World name'
      />
      <SelectGameVersion
        versions={versions.map((obj) => { return { value: obj.version, label: obj.version } })}
        selected={{ value: defaultVersion, label: defaultVersion }}
        onChange={(value) => {
          creatingWorldState.version = value ?? defaultVersion
        }}
        containerStyle={{ width: '100px' }}
      />
      <button type='submit' style={{ visibility: 'hidden' }} />
    </form>
    <div style={{ marginTop: 6 }}>
      <div className='muted' style={{ fontSize: 9, marginBottom: 4 }}>World seed</div>
      <Input
        value={seedText}
        onChange={({ target: { value } }) => {
          creatingWorldState.seedText = value
        }}
        placeholder='Type a seed, or leave blank for random'
        rootStyles={{ marginTop: 0 }}
      />
      <div className='muted' style={{ fontSize: 8, marginTop: 3 }}>
        Enter numbers or text for a specific world. Leave empty and the game picks a random seed.
      </div>
    </div>
    <details className='muted' style={{ fontSize: 9, marginTop: 6, maxWidth: 420 }}>
      <summary style={{ cursor: 'pointer', userSelect: 'none' }}>About world seeds</summary>
      <div style={{ marginTop: 6, lineHeight: 1.4 }}>
        <p style={{ margin: '0 0 6px' }}>
          You can choose a seed or leave the field blank for a random one. Seeds are special codes that generate a world. When you create a new world, the game uses a seed to decide where everything goes: mountains, villages, caves, oceans, forests, deserts, strongholds, ancient cities, and more.
        </p>
        <p style={{ margin: '0 0 4px' }}>A seed can be:</p>
        <ul style={{ margin: '0 0 6px', paddingLeft: 18 }}>
          <li>Numbers — e.g. <span style={seedMono}>123456789</span></li>
          <li>Words — e.g. <span style={seedMono}>cool world</span></li>
          <li>A mix — e.g. <span style={seedMono}>Marsel123</span></li>
        </ul>
        <p style={{ margin: '0 0 6px' }}>
          If two players use the same seed, same Minecraft version, and same world settings, they usually get the same world.
        </p>
        <p style={{ margin: '0 0 6px' }}>
          Example: seed <span style={seedMono}>8675309</span> might create a world with a village near spawn, mountains nearby, or a desert temple, depending on the Minecraft version.
        </p>
        <p style={{ margin: 0 }}>
          In-game you can see the numeric seed with the chat command <span style={seedMono}>/seed</span>. Text seeds here are converted to a number for this client; use a numeric seed if you need an exact match with Java Edition.
        </p>
      </div>
    </details>
    <div style={{ display: 'flex' }}>
      <Button onClick={() => {
        const index = worldTypes.indexOf(type)
        creatingWorldState.type = worldTypes[index === worldTypes.length - 1 ? 0 : index + 1]
      }}
      >World Type: {type}
      </Button>
      {/* <Button onClick={() => customizeClick()} disabled>
        Customize
      </Button> */}
      <div style={{ display: 'flex', gap: 4, alignItems: 'center' }}>
        <span className="muted" style={{ fontSize: 9, marginRight: 4 }}>Game mode</span>
        <Button
          type="button"
          style={{
            width: 100,
            boxShadow: gameMode === 'survival' ? 'inset 0 0 0 2px rgba(255,255,255,0.85)' : undefined,
          }}
          onClick={() => {
            creatingWorldState.gameMode = 'survival'
          }}
        >
          Survival
        </Button>
        <Button
          type="button"
          style={{
            width: 100,
            boxShadow: gameMode === 'creative' ? 'inset 0 0 0 2px rgba(255,255,255,0.85)' : undefined,
          }}
          onClick={() => {
            creatingWorldState.gameMode = 'creative'
          }}
        >
          Creative
        </Button>
      </div>
    </div>
    <div style={{ display: 'flex' }}>
      <Button onClick={async () => {
        const availableServerPlugins = await getAvailableServerPlugins()
        const availableModNames = availableServerPlugins.map(mod => mod.name)
        const choices: Record<string, InputOption> = Object.fromEntries(availableServerPlugins.map(mod => [mod.name, {
          type: 'checkbox' as const,
          defaultValue: creatingWorldState.plugins.includes(mod.name),
          label: mod.name
        }]))
        choices.installMore = {
          type: 'button' as const,
          onButtonClick () {
            showModal({ reactType: 'mods' })
          }
        }
        const choice = await showInputsModal('Select server plugins from mods to install:', choices)
        if (!choice) return
        creatingWorldState.plugins = availableModNames.filter(modName => choice[modName])
      }}
      >Use Mods ({plugins.length})
      </Button>
      <Button type="button" disabled title="World saves use Java Edition folder layout">
        Save format: Java
      </Button>
    </div>
    <div className='muted' style={{ fontSize: 8 }}>Default and other world types are WIP</div>

    <div style={{ display: 'flex' }}>
      <Button onClick={() => {
        cancelClick()
      }}
      >Cancel
      </Button>
      <Button disabled={!title} onClick={createClick}>
        <b>
          Create
        </b>
      </Button>
    </div>
    <div className='muted' style={{ fontSize: 9 }}>Note: save important worlds in folders on your hard drive!</div>
    <div className='muted' style={{ fontSize: 9 }}>Local link: {`${window.location.origin}${window.location.pathname}`}</div>
    <div className='muted' style={{ fontSize: 9 }}>{quota}</div>
  </Screen>
}

export const WorldCustomize = ({ backClick }) => {
  const { type } = useSnapshot(creatingWorldState)

  return <Screen title='Customize world' backdrop='dirt'>
    <div className={styles.world_layers_container}>
      <div className="world_layer" />
    </div>
    <Button onClick={backClick}>Back</Button>
  </Screen>
}

export default withInjectableUi(CreateWorldBase, 'createWorld')
