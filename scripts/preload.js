const { contextBridge, ipcRenderer } = require('electron')
const FABRIC_INSTALLER_URL = 'https://maven.fabricmc.net/net/fabricmc/fabric-installer/0.11.2/fabric-installer-0.11.2.jar'

function getModrinthURL (mod, total_mods) {
    const modrinthURL = `https://api.modrinth.com/v2/project/${mod.mod_name}/version`
    fetch(modrinthURL).then(response => response.json()).then(json_response => {
        for (let item of json_response) {
            if (item.version_number === mod.version && item.loaders.includes('fabric')) {
                ipcRenderer.send('downloadMod', {
                    modData: {
                        mod_url: item.files[0].url,
                        totalMods: total_mods
                    }
                })
                return
            }
        }

        console.log('failed for mod ' + mod.mod_name)
        console.log(mod)
        console.log(json_response)
    }).catch(err => console.log(err))
}

function buildUrl (mod, total_mods) {
    if (mod['file_url'] !== undefined && mod['file_url'] !== null) {
        ipcRenderer.send('downloadMod', {
            modData: {
                mod_url: mod['file_url'],
                totalMods: total_mods
            }
        })
        return
    }
    getModrinthURL(mod, total_mods)

}

function downloadFabricInstaller(loader, version) {
    const fs = require('fs')
    if(fs.existsSync("fabric-installer.jar")) {
        return
    }
    ipcRenderer.send('downloadInstaller', {
        data: {
            file_url: FABRIC_INSTALLER_URL,
            loader: loader,
            version: version,
        }
    })
}

function installModLoader(loader, version) {
    if (loader === 'fabric') {
        downloadFabricInstaller(loader, version)
    }
}

function downloadMods (modpackData) {
    const path = require('path')
    let dotMinecraft = ''
    if (process.platform === 'win32') {
        dotMinecraft = path.join(process.env.appdata, '.minecraft')
    } else if (process.platform === 'darwin') {
        dotMinecraft = path.join(process.env.appdata, '.minecraft')
    } else {
        dotMinecraft = path.join(process.env.appdata, '.minecraft')
    }

    const fs = require('fs')
    const directory = path.join(dotMinecraft, 'mods')

    installModLoader(modpackData.loader.name, modpackData.loader.version)
    fs.readdir(directory, (err, files) => {
        if (err) throw err

        for (const file of files) {
            if (fs.lstatSync(file).isDirectory) {
                continue;
            }
            fs.unlink(path.join(directory, file), (err) => {
                if (err) throw err
            })
        }
    })

    for (let mod of modpackData.mods) {
        buildUrl(mod, modpackData.mods.length)
    }
}

function updateProgress (element, text) {
    ipcRenderer.on('updateProgress', (event, { data }) => {
        let percent = (data.count * 100) / data.max
        element.style = `width: ${percent}%`
        if (data.count === data.max) {
            text.innerText = 'Instalación completa'
        }
    })
}

function forceProgress0 (element, text) {
    element.style = `width: 0%`
    text.innerText = 'Instalando'
}

contextBridge.exposeInMainWorld('functions', {
    downloadMods: (modpackData) => downloadMods(modpackData),
    updateProgress: (element, text) => updateProgress(element, text),
    forceProgress0: (element, text) => forceProgress0(element, text),
})