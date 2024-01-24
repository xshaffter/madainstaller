const { app, BrowserWindow, ipcMain, ipcRenderer } = require('electron')
const path = require('path')
const electronDl = require('electron-dl')
const { exec } = require("child_process");
const fs = require('node:fs')

const JAVA_BINARIES_URL = 'https://download.oracle.com/java/17/archive/jdk-17.0.10_windows-x64_bin.zip'

let dotMinecraft = ''
if (process.platform === 'win32') {
    dotMinecraft = path.join(process.env.appdata, '.minecraft')
} else if (process.platform === 'darwin') {
    dotMinecraft = path.join(process.env.appdata, '.minecraft')
} else {
    dotMinecraft = path.join(process.env.appdata, '.minecraft')
}

function createProfile() {
    let profiles_path = path.join(dotMinecraft, "launcher_profiles.json");
    let profile_path = path.join(__dirname, 'statics', 'profile.json');

    let profileFile = fs.readFileSync(profile_path, {encoding: 'utf8'})
    let profilesFile = fs.readFileSync(profiles_path, {encoding: 'utf8'})

    let profile_json = JSON.parse(profileFile)
    let profiles_json = JSON.parse(profilesFile)
    profiles_json.profiles.MaryMods = profile_json
    fs.writeFileSync(profiles_path, JSON.stringify(profiles_json))
}


const createWindow = async () => {
    const win = new BrowserWindow({
        width: 800,
        height: 470,
        resizable: false,
        autoHideMenuBar: true,
        icon: 'statics/icon.png',
        webPreferences: {
            nodeIntegration: true,
            preload: path.join(__dirname, 'scripts', 'preload.js')
        }
    })

    //win.removeMenu();
    let progressBarCount = null
    let count = 0;
    ipcMain.on('downloadMod', async (event, { modData }) => {
        try {
            if (progressBarCount === null) {
                progressBarCount = 0
                win.setProgressBar(0)
            }
            await electronDl.download(win, modData.mod_url, {
                overwrite: true,
                showProgressBar: false,
                saveAs: false,
                directory: path.join(dotMinecraft, 'mods')
            })
            progressBarCount += 1.0 / modData.totalMods
            win.setProgressBar(progressBarCount)

            event.sender.send('updateProgress', {
                data: {
                    count: ++count,
                    max: modData.totalMods
                }
            })
            if (count === modData.totalMods) {
                win.setProgressBar(1.0)
                count = 0
            }
        } catch (error) {
            if (error instanceof electronDl.CancelError) {
            } else {
                console.error(error)
            }
        }
    });

    ipcMain.on('downloadInstaller', async(event, {data}) => {
        console.log(`downloading ${data.loader} installer`)
        await electronDl.download(win, data.file_url, {
            overwrite: true,
            showProgressBar: false,
            saveAs: false,
            directory: path.join(__dirname)
        })
        exec(`java -jar ${data.loader}-installer-0.11.2.jar client -dir \"${dotMinecraft}\" -mcversion ${data.version} -noprofile`)
        createProfile();
    })

    await win.loadFile('screens/index.html')
}

app.whenReady().then(async () => {
    await createWindow()
})