import { app, BrowserWindow } from 'electron'
import { resolve } from 'path'

const wait = async (ms: number) =>
    new Promise<void>(res => {
        setTimeout(() => res(), ms)
    })

const main = async () => {
    await app.whenReady()

    const window = new BrowserWindow({
        height: 600,
        width: 600,
        title: 'Main Window',
        webPreferences: {
            preload: resolve(__dirname, 'windows/main/preload.js')
        }
    })

    await window.loadFile(resolve(__dirname, 'windows/main/view.html'))

    app.on('window-all-closed', () => {
        app.exit()
    })
}

main()
