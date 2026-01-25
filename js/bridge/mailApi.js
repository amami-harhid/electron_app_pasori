import electron from 'electron';
// Main側(main.js), Render側(preload.js)の両方で import できるように
// 一度「electron」で受け取り、必要なプロパティを取り出す。

const ipcMain = electron.ipcMain;
const ipcRenderer = electron.ipcRenderer;
const contextBridge = electron.contextBridge;

import {Mailer} from '../mail/sendMail.js';

const contextBridgeExpose = {
    'pasoriMail': ()=>{
        contextBridge.exposeInMainWorld(
            'pasoriApi', {
                config: async () => {
                    return ipcRenderer.invoke('mailer:get_config');
                },
                sendMail: async (mail_to, mail_subject, text, name) => {                    return ipcRenderer.invoke('mailer:send_mail', mail_to, mail_subject, text, name);
                },
            }
        );
    }
}
const MailerSendMail = "mailer:send_mail";
const MailerGetConfig = "mailer:get_config";
const ipcMainHandler = () => {
    ipcMain.handle("mailer:send_mail", Mailer.sendMail);
    ipcMain.handle("mailer:get_config", ()=>{
        return {
            MAIL_SUBJECT:Mailer.subject,
            MAIL_TEXT:Mailer.text,
        }
    });
}

export const mailApi = {
    contextBridgeExpose,
    ipcMainHandler,
    MailerSendMail,
    MailerGetConfig,
}