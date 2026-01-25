/* 
preloadのなかでは import できないみたいなので。
require方式にする。
*/
const { ipcRenderer, contextBridge } = require('electron');
const {dbApi} = require('./js/bridge/pasoriDbApi.js')
const {pageApi} = require('./js/bridge/pageApi.js');
const {mailApi} = require('./js/bridge/mailApi.js');
const {page} = require('./js/page/page.js');

window.addEventListener("DOMContentLoaded", () => {

    // contextBridgeExpose
    dbApi.contextBridgeExpose.pasoriDb();
    mailApi.contextBridgeExpose.pasoriMail();
    pageApi.contextBridgeExpose.titleApi();
    page.initPage();

});


