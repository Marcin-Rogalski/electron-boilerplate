import { app, BrowserWindow } from 'electron'
import { resolve } from 'path'
import 'dotenv/config'

const wait = async (ms: number) =>
    new Promise<void>(res => {
        setTimeout(() => res(), ms)
    })

const main = async () => {
    await app.whenReady()

    const window = await useWindow('main', {
        height: 600,
        width: 600,
        title: 'Main Window',
        webPreferences: {
            preload: resolve(__dirname, 'windows/main/preload.js')
        }
    })

    app.on('window-all-closed', () => {
        app.exit()
    })
}

main()

const useWindow = async (
    name: string,
    options: Electron.BrowserWindowConstructorOptions
) => {
    const window = new BrowserWindow({
        ...options
    })

    if (process.env.USE_LOCALHOST) {
        await window.loadURL(
            `http://localhost:${process.env.LOCALHOST_PORT ?? 8080}/${name}`
        )
    } else {
        await window.loadFile(resolve(__dirname, `windows/${name}/view.html`))
    }
}
