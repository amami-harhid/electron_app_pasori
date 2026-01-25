import electron from 'electron';
// Main側(main.js), Render側(preload.js)の両方で import できるように
// 一度「electron」で受け取り、必要なプロパティを取り出す。

const ipcMain = electron.ipcMain;
const ipcRenderer = electron.ipcRenderer;
const contextBridge = electron.contextBridge;

export const bridgePageApi = {
    titleApi : ()=>{
        console.log('bridgePageApi.titleApi()')
        contextBridge.exposeInMainWorld(
            'titleApi', {
                getTitle: async () => {
                    return ipcRenderer.invoke('page:get_title');
                },
            }
        );
    }
};

import { ApConfig } from '../../conf.js';
const PAGE_TITLE = ApConfig.get("PAGE_TITLE");
export const handle_page_methods = () => {
    ipcMain.handle("page:get_title", ()=>{
        return PAGE_TITLE;
    });
}

