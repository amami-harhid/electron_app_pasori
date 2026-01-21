//import  { ipcRenderer, contextBridge } from 'electron'; 
const { contextBridge, ipcRenderer } = require('electron');

const bridgeExposeInMainWorld = () => {
    contextBridge.exposeInMainWorld('pasoriDb', {
        createCards: async () => ipcRenderer.invoke('createCards'),    //データベース作成
        selectCardsAll: async () => ipcRenderer.invoke('selectCardsAll'),  //SELECT *
        selectCardsByIdm: async () => ipcRenderer.invoke('selectCardsByIdm'),
        insertData: async (idm, name, mail, in_room) => 
            ipcRenderer.invoke('insertData', idm, name, mail, in_room), //データを挿入
        updateInRoom: async (in_room, idm) =>
            ipcRenderer.invoke('updateInRoom', in_room, idm), // 在室中の更新
        dbClose:  async () => ipcRenderer.invoke('dbClose'), // DBクローズ
    });
}
export const pasoriDb = {bridgeExposeInMainWorld}
// for preload.js
//exports.contextBridgePasoriDB = contextBridgePasoriDB;