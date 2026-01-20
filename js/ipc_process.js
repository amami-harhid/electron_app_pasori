import { ipcRenderer } from "electron";

ipcRenderer.on('test-message', (msg)=>{
    console.log('test-message', msg);
})