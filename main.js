import { app, BrowserWindow } from 'electron';
import { fileURLToPath } from 'url';
import path from 'path';
import {Reader} from "./card.js"
import {handle_mail_methods } from './js/mail/sendMail.js';
import {pasoriDb, handle_db_methods} from './js/db/dbMethods.js'
import {handle_page_methods} from './js/page.js';
import {initDb} from './js/db/dbMethods.js'
import {ApConfig} from './js/conf.js';


/** ブラウザウインドウ作成 */
function createWindow() {
    const __filename = fileURLToPath(import.meta.url);
    const mainWindow = new BrowserWindow({
        width: 800,
        height: 600,
        //
        webPreferences: {
            preload: path.join(path.dirname(__filename), "preload.js"),
            // true: レンダラープロセスでNode.jsの機能を使用できる
            nodeIntegration: true, 
            // true: レンダラープロセスはNode.jsにアクセスできない
            // contextBridge は contextIsolation=trueのときだけ利用できる
            contextIsolation: true, 
            // サンドボックス化されたプロセスは、CPUサイクルとメモリのみを使用でき、
            // 追加の権限が必要な操作は専用の通信チャネルを使用してメインプロセスに委譲されます
            sandbox: false 
        },
        autoHideMenuBar: true, // メニュー非表示
    });

    mainWindow.loadFile("index.html");
    //mainWindow.webContents.openDevTools(); // 開発者ツールを表示
    mainWindow.setAlwaysOnTop(true, 'screen-saver');
    //mainWindow.setIgnoreMouseEvents(true, { forward: true }); // マウス無効にすると閉じることができない。
    mainWindow.moveTop();
    Reader.win = mainWindow;
    
    return mainWindow;
};


app.whenReady().then(async () => {

    createWindow();
    const rows = await pasoriDb.selectCardsAll();
    if(rows.length==0){
        await pasoriDb.insertData(0, "012e4cd8a3179d43", "Test Taro", "dummy", false);
    }

    // メインへのハンドラー定義
    handle_db_methods();
    handle_mail_methods();
    handle_page_methods();


    //win.webContents.send('test-message', 'ponpon');
    app.on("activate", () => {
        // 開いたウインドウがない場合にウインドウを開く (macOS)
        // activateイベントは、macOSでアプリケーションがアクティブになったときに発生します。
        // 例えば、Dockアイコンをクリックしたときなどです。
        if (BrowserWindow.getAllWindows().length === 0) {
            createWindow();
        }
    });
    //コメントはずすとテストデータで初期化する
    //initDb();
});

// 全ウインドウを閉じた時にアプリを終了する (Windows & Linux)
app.on("window-all-closed", () => {
    pasoriDb.dbClose();
    if (process.platform !== "darwin") app.quit();
});

const pasori_ready = (device_name) =>{
    //console.log('pasori_ready', device_name)
}
const pasori_card_touch = (idm) =>{
    //console.log('pasori_card_touch')
    const targetWin = Reader.win
    targetWin.webContents.send('card-message', idm);
}
const pasori_card_remove = () =>{
    //console.log('pasori_card_remove')
    const targetWin = Reader.win
    targetWin.webContents.send('card-message', "");
}

// Pasori Reader
// app.on の中で実行すると nfc.on を検知しない
const readerReady = function() {
    //await waitForCondition(()=> Reader.win != null, 50, 5000);
    Reader.ready(
        pasori_ready,
        pasori_card_touch,
        pasori_card_remove
    )
}


readerReady();

