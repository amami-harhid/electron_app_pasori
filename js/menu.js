import { Menu, BrowserWindow } from 'electron';
const MANAGER = '#Manager';
const GENERAL = '#Genaral';
const template = [
    { 
        role: 'help', 
        submenu: [
            {
                label: '管理者',
                id: MANAGER,
                enabled: true,
                click: () => {
                    toManager();
                }
            },
            {
                label: '一般',
                id: GENERAL,
                enabled: false,
                click: () => {
                    toGeneral();
                }
            }

        ] 
    },
];
const APP_MANAGER_HANDLING = "app-manager-handling";
const toManager = ()=>{
    const menu = Menu.getApplicationMenu();
    menu.getMenuItemById(MANAGER).enabled = false;
    menu.getMenuItemById(GENERAL).enabled = true;
    const browserWindow = BrowserWindow.getFocusedWindow();
    browserWindow.send(APP_MANAGER_HANDLING, true);
}
const toGeneral = () => {
    const menu = Menu.getApplicationMenu();
    menu.getMenuItemById(MANAGER).enabled = true;
    menu.getMenuItemById(GENERAL).enabled = false;
    const browserWindow = BrowserWindow.getFocusedWindow();
    browserWindow.send(APP_MANAGER_HANDLING, false);
}
// macOS では "アプリメニュー" が必要
if (process.platform === 'darwin') template.unshift({ role: 'appMenu' });

// テンプレートからメニューを作成
export const menu = Menu.buildFromTemplate(template);