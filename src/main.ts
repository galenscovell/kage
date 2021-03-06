import {app, BrowserWindow, ipcMain} from 'electron';
import * as path from 'path';


let mainWindow: BrowserWindow;


function createWindow(): void {
    mainWindow = new BrowserWindow({
        webPreferences: {
            nodeIntegration: true
        },
        icon: path.join(__dirname, 'img', 'noodles.png'),
        width: 800,
        height: 356,
        resizable: false,
        center: true,
        frame: false,
        titleBarStyle: 'hidden'
    });

    mainWindow.loadFile(path.join(__dirname, 'index.html'));
    //mainWindow.webContents.openDevTools();

    mainWindow.on('closed', () => {
        mainWindow = null;
    });
}

app.on('ready', () => {
    ipcMain.on('close-main-window', () => {
        app.quit();
    });

    ipcMain.on('minimize-main-window', () => {
        mainWindow.minimize();
    });

    createWindow();
});

app.on('window-all-closed', () => {
    // On OS X it is common for applications and their menu bar
    // to stay active until the user quits explicitly with Cmd + Q
    if (process.platform !== 'darwin') {
        app.quit();
    }
});

app.on('activate', () => {
    // On OS X it"s common to re-create a window in the app when the
    // dock icon is clicked and there are no other windows open.
    if (mainWindow === null) {
        createWindow();
    }
});
