/* 
preloadのなかでは import できないみたいなので。
require方式にする。
*/
const { ipcRenderer, contextBridge } = require('electron');

const bridgeExposeInMainWorld = () => {
    contextBridge.exposeInMainWorld(
        'pasoriDb', {
            createCards: async () => {
                ipcRenderer.invoke('createCards') //データベース作成
            },
            selectCardsAll: async () => {
                console.log('ipcRenderer.invoke selectCardsAll')
                return ipcRenderer.invoke('selectCardsAll')  //SELECT *
            },
            selectCardsWithCondition: async (condition) => {
                return ipcRenderer.invoke('selectCardsWithCondition', condition); // 条件付きSELECT
            },
            insertData: async (idm, name, mail, in_room) => {
                return ipcRenderer.invoke('insertData', idm, name, mail, in_room) //データを挿入
            },
            updateInRoom: async (in_room, idm) => {
                return ipcRenderer.invoke('updateInRoom', in_room, idm) // 在室中の更新
            },
            dbClose:  async () => {
                return ipcRenderer.invoke('dbClose') // DBクローズ
            }
    });
    contextBridge.exposeInMainWorld(
        'pasoriApi', {
            config: async () => {
                return ipcRenderer.invoke('mailer:get_config');
            },
            sendMail: async (mail_to, mail_subject, text, name) => {
                return ipcRenderer.invoke('mailer:send_mail', mail_to, mail_subject, text, name);
            },
            title: ()=> {
                return ipcRenderer.invoke('')
            }
        }
    );
    contextBridge.exposeInMainWorld(
        'titleApi', {
            getTitle: async () => {
                return ipcRenderer.invoke('page:get_title');
            },
        }
    );
}

//pasoriDb.bridgeExposeInMainWorld();

// サウンド定義
const soundIn = new Audio('./assets/tm2_quiz000good.wav');
const soundBye = new Audio('./assets/Jinx-_Bye_Bye_.mp3');
const soundNg = new Audio('./assets/se_nogood09.mp3');
const soundInPlay = function() {
    soundIn.currentTime = 0;
    soundIn.play()
}
const soundByePlay = function() {
    soundBye.currentTime = 0;
    soundBye.play()
}
const soundNGPlay = function() {
    soundNg.currentTime = 0;
    soundNg.play()
}


window.addEventListener("DOMContentLoaded", () => {

    bridgeExposeInMainWorld();

    // モーダル非表示
    const modal = document.getElementById('pasoriModal');
    modal.style.display = 'none';
    const statusDiv = document.getElementById('statusDiv'); 

    // 受信設定
    ipcRenderer.on('card-message', async (_, idm)=>{ 
        // listenerの第一引数は event:IpcRenderEventだが未使用なので _ としている。
        // DB作成( ここでないとwindow.sqlite3が使えない！)

        const MAILER_CONFIG = await ipcRenderer.invoke('mailer:get_config');

        //database_init(window);
        if (idm == ''){
            modal.style.display = 'none';
            return;
        }
        const cardsRows = await ipcRenderer.invoke('selectCardsWithCondition', `idm = '${idm}'`);
        console.log(cardsRows);
        if( cardsRows.length == 0) {
            console.log(`登録なしカード=(${idm})`);
            soundNGPlay();
            console.log('soundNGPlay() おわり')
            while( statusDiv.firstChild) {
                statusDiv.removeChild( statusDiv.firstChild)
            }
            const p_tag = document.createElement('p');
            p_tag.innerText = `登録がありません(${idm})`;
            p_tag.classList.add('in');
            statusDiv.appendChild(p_tag)
            modal.style.display = 'block';
            return;
        }
        console.log(`登録ありカード=(${idm})`);
        const card = cardsRows[0];
        console.log(card);
        //const card = new Card();
        //card.idm = idm;
        if( statusDiv ) {
            while( statusDiv.firstChild) {
                statusDiv.removeChild( statusDiv.firstChild)
            }
            
            let status;
            //const _card = findCard(card);
            if ( card.in_room == 1 ) {
                // 退室処理
                status = false;
                ipcRenderer.invoke('updateInRoom', idm, false)
                const mail_to = card.mail;
                if(mail_to && typeof mail_to === 'string' && mail_to.length > 0){
                    const mail_subject = MAILER_CONFIG.MAIL_SUBJECT.OUT;
                    const name = card.name;
                    const text = MAILER_CONFIG.MAIL_TEXT.OUT;
                    ipcRenderer.invoke('mailer:send_mail', mail_to, mail_subject, text, name)
                }
            }else{
                // 入室処理
                status = true;
                ipcRenderer.invoke('updateInRoom', idm, true)
                const mail_to = card.mail;
                if(mail_to && typeof mail_to === 'string' && mail_to.length > 0){
                    const mail_subject = MAILER_CONFIG.MAIL_SUBJECT.IN;
                    const name = card.name;
                    const text = MAILER_CONFIG.MAIL_TEXT.IN;
                    ipcRenderer.invoke('mailer:send_mail', mail_to, mail_subject, text, name)
                }
            }
            const p_tag = document.createElement('p');
            const p_tag2 = document.createElement('p');
            const now = new Date();
            p_tag2.innerHTML = now.toLocaleString('ja-JP', {
                year: 'numeric',
                month: '2-digit',
                day: '2-digit',
                hour: '2-digit',
                minute: '2-digit',
                second: '2-digit'
            })
            if (status) {
                p_tag.innerText = `入室 (${card.name}さん)`;
                p_tag.classList.add('in');
                soundInPlay();
            }else{
                p_tag.innerText = `退室 (${card.name}さん)`;
                p_tag.classList.add('out');
                soundByePlay();
            }
            statusDiv.appendChild(p_tag2)
            statusDiv.appendChild(p_tag)

            modal.style.display = 'block';

        }

    })
});

const entringCards = {}
class Card {
    idm = ''
    date = ''
}
const findCard = (card)=>{
    for( const key in entringCards ){
        const _card = entringCards[key];
        if( _card.idm == card.idm ) {
            return _card
        }
    }
    return null;
}
const deleteCard = (card)=>{
    const idm = card.idm;
    if( entringCards.hasOwnProperty(idm)){
        delete entringCards[idm];
    }
}
const registCard = (card)=>{
    const idm = card.idm;
    entringCards[idm] = card;
}