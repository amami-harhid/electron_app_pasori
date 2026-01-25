import electron from 'electron';
// Main側(main.js), Render側(preload.js)の両方で import できるように
// 一度「electron」で受け取り、必要なプロパティを取り出す。

const ipcMain = electron.ipcMain;
const ipcRenderer = electron.ipcRenderer;
const contextBridge = electron.contextBridge;

const pasoriDb = {
    createCards: async () => {
        ipcRenderer.invoke('createCards') //データベース作成
    },
    selectCardsAll: async () => {
        return ipcRenderer.invoke('selectCardsAll')  //SELECT *
    },
    selectCardsWithCondition: async (condition) => {
        return ipcRenderer.invoke('selectCardsWithCondition', condition); // 条件付きSELECT
    },
    insertData: async (idm, name, mail, in_room) => {
        return ipcRenderer.invoke('insertData', idm, name, mail, in_room) //データを挿入
    },
    update: async (idm, name, mail) => {
        return ipcRenderer.invoke('update', idm, name, mail) 
    },
    updateInRoom: async (in_room, idm) => {
        return ipcRenderer.invoke('updateInRoom', in_room, idm) // 在室中の更新
    },
    releaseIdm: async (idm) => {
        return ipcRenderer.invoke('releaseIdm', idm)
    },
    deleteCards: async (idm) => {
        return ipcRenderer.invoke('deleteCards', idm)
    },
    dbClose:  async () => {
        return ipcRenderer.invoke('dbClose') // DBクローズ
    }
}

const contextBridgeExpose = {
    pasoriDb: ()=>{
        contextBridge.exposeInMainWorld(
            'pasoriDb', pasoriDb
        )
    }
};

import {pasoriDbMain} from '../db/dbMethods.js';
// DBメソッドをレンダラー側で使用可能にする
const ipcMainHandler = ()=>{
    for( const name in pasoriDbMain) {
        const method = pasoriDbMain[name];
        ipcMain.handle(name, method);
    }
};

export const dbApi = {
    contextBridgeExpose,
    ipcMainHandler,
    pasoriDb,
}