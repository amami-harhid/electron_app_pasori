import { Menu, BrowserWindow } from 'electron';
import { appVersion } from './version.js';
const CARD_MANAGE = '#CardManage';
const GENERAL = '#Genaral';
const GENERAL_STOP = '#Genaral_STOP';
const MEMBERS = '#MEMBERS';
const DEV_TOOL = "#DEV_TOOL";
const APP_VERSION = "#APP_VERSION";
const template = [
    { 
        label: '操作', 
        submenu: [
            {
                label: '開始',
                id: GENERAL,
                enabled: true,
                click: () => {
                    toGeneral();
                }
            },
            {
                label: '停止',
                id: GENERAL_STOP,
                enabled: false,
                click: () => {
                    toGeneralStop();
                }
            },
            {
                label: 'メンバー',
                id: MEMBERS,
                enabled: true,
                click: () => {
                    toMember();
                }
            },
            {
                label: 'カード管理',
                id: CARD_MANAGE,
                enabled: true,
                click: () => {
                    toManager();
                }
            },
        ] 
    },
    { 
        label: 'HELP', 
        submenu: [
            {
                label: '開発者ツール',
                id: DEV_TOOL,
                enabled: true,
                click: () => {
                    openDevTool();
                }
            },
            {
                label: 'VERSION',
                id: APP_VERSION,
                enabled: true,
                click: () => {
                    viewAppVersion();
                }
            },

        ] 
    },
];
const APP_GENERAL_HANDLING = "app-general-handling";
const APP_GENERAL_STOP_HANDLING = "app-general-stop-handling";
const APP_MANAGER_HANDLING = "app-manager-handling";
const APP_MEMBERS_HANDLING = "app-members-handling";
const toManager = ()=>{
    const menu = Menu.getApplicationMenu();
    menu.getMenuItemById(GENERAL).enabled = true;
    menu.getMenuItemById(GENERAL_STOP).enabled = false;
    menu.getMenuItemById(CARD_MANAGE).enabled = false;
    menu.getMenuItemById(MEMBERS).enabled = true;
    const browserWindow = BrowserWindow.getFocusedWindow();
    browserWindow.send(APP_MANAGER_HANDLING);
}
const toGeneral = () => {
    const menu = Menu.getApplicationMenu();
    menu.getMenuItemById(GENERAL).enabled = false;
    menu.getMenuItemById(GENERAL_STOP).enabled = true;
    menu.getMenuItemById(MEMBERS).enabled = true;
    menu.getMenuItemById(CARD_MANAGE).enabled = true;
    const browserWindow = BrowserWindow.getFocusedWindow();
    browserWindow.send(APP_GENERAL_HANDLING);
}
const toGeneralStop = () => {
    const menu = Menu.getApplicationMenu();
    menu.getMenuItemById(GENERAL).enabled = true;
    menu.getMenuItemById(GENERAL_STOP).enabled = false;
    menu.getMenuItemById(MEMBERS).enabled = true;
    menu.getMenuItemById(CARD_MANAGE).enabled = true;
    const browserWindow = BrowserWindow.getFocusedWindow();
    browserWindow.send(APP_GENERAL_STOP_HANDLING);
}
const toMember = () => {
    const menu = Menu.getApplicationMenu();
    menu.getMenuItemById(GENERAL).enabled = true;
    menu.getMenuItemById(GENERAL_STOP).enabled = false;
    menu.getMenuItemById(CARD_MANAGE).enabled = true;
    menu.getMenuItemById(MEMBERS).enabled = false;
    const browserWindow = BrowserWindow.getFocusedWindow();
    browserWindow.send(APP_MEMBERS_HANDLING);
}
const openDevTool = () => {
    const browser = BrowserWindow.getFocusedWindow();
    browser.webContents.openDevTools(); // 開発者ツールを表示
}
const viewAppVersion = () => {
    const version = appVersion();
    const browser = BrowserWindow.getFocusedWindow();
    browser.webContents.send('app-version-handling', version);

    // app-version-handling
}
// macOS では "アプリメニュー" が必要
if (process.platform === 'darwin') template.unshift({ role: 'appMenu' });

// テンプレートからメニューを作成
export const menu = Menu.buildFromTemplate(template);