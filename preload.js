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
            update: async (idm, name, mail) => {
                return ipcRenderer.invoke('update', idm, name, mail) 
            },
            updateInRoom: async (in_room, idm) => {
                return ipcRenderer.invoke('updateInRoom', in_room, idm) // 在室中の更新
            },
            deleteCards: async (idm) => {
                return ipcRenderer.invoke('deleteCards', idm)
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
        }
    );
    contextBridge.exposeInMainWorld(
        'titleApi', {
            getTitle: async () => {
                return ipcRenderer.invoke('page:get_title');
            },
        }
    );
    contextBridge.exposeInMainWorld(
        'menuApi', {
            manager: async () => {
                ipcRenderer.invoke('page:menu_manager');
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
    const modalManager = document.getElementById('pasoriModal_manager')
    modalManager.style.display = 'none';
    const statusDiv = document.getElementById('statusDiv'); 
    const card_manager = document.getElementById('card_manager');
    card_manager.style.display = 'none';
    const card_edit = document.getElementById('card_edit');
    card_edit.style.display = 'none';
    const card_regist = document.getElementById('card_regist');
    const card_delete = document.getElementById('card_delete');
    const span_card_idm = document.getElementById('card_idm');
    const card_name = document.getElementById('card_name');
    const card_mail = document.getElementById('card_mail');

    const alt = document.getElementById("confirm");
    const p = alt.querySelector("p");
    const btn_yes = alt.querySelector("#confirm-yes");
    const btn_no = alt.querySelector("#confirm-no");

    const myConfirm = (text) => {
        p.textContent = text;
        alt.style.display="block";
        return new Promise( ( resolve  )=>{
            const yesEvent = ()=>{resolve(true);removeEvent();}
            const noEvent = ()=>{resolve(false);removeEvent();}
            const removeEvent = ()=>{
                btn_yes.removeEventListener("click",yesEvent);
                btn_no.removeEventListener("click",noEvent);
                alt.style.display="none";
            };
            btn_yes.addEventListener("click",yesEvent);
            btn_no.addEventListener("click",noEvent);
        })
    }

    card_regist.addEventListener('click', async ()=>{
        const answer = await myConfirm('登録しますか？')
        if(answer === true){
            const idm = span_card_idm.innerHTML;
            const name = card_name.value;
            const mail = card_mail.value;
            const rows = await ipcRenderer.invoke('selectCardsByIdm',idm);
            if(rows.length > 0) {
                // REPLACE
                await ipcRenderer.invoke('update',idm, name, mail);

            }else{
                // INSERT
                await ipcRenderer.invoke('insertData',idm, name, mail, false);
            }
            card_name.setAttribute("value", name);
            card_mail.setAttribute("value", mail);
        }
        return false;
    });
    card_delete.addEventListener('click', async ()=>{
        const answer = await myConfirm('削除しますか？')
        if(answer === true){
            const idm = span_card_idm.innerHTML;
            await ipcRenderer.invoke('deleteCards',idm);
            card_name.setAttribute("value", "");
            card_mail.setAttribute("value", "");
        }
        card_name.disable = false;
        card_mail.disable = false;
        return false;
    });

    const ic_card_general = async (idm) => {
        const MAILER_CONFIG = await ipcRenderer.invoke('mailer:get_config');

        //database_init(window);
        if (idm == ''){
            modal.style.display = 'none';
            return;
        }
        const cardsRows = await ipcRenderer.invoke('selectCardsWithCondition', `idm = '${idm}'`);
        console.log('ic_card_general');
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

    }
    const ic_card_manager = async (idm) => {
        
        if (idm == ''){
            card_manager.style.display = 'none';
            span_card_idm.innerHTML = "";
            card_name.setAttribute('value', "");
            //card_name.value = "";
            card_mail.setAttribute('value', "");
            //card_mail.value = "";
            card_edit.style.display = 'none';
            card_name.disable = false;
            card_name.readOnly = false;
            card_mail.disable = false;
            card_mail.readOnly = false;
            return;
        }
        card_manager.style.display = 'block';
        span_card_idm.innerHTML = idm;
        const rows = await ipcRenderer.invoke('selectCardsWithCondition', `idm = '${idm}'`);
        if(rows.length == 0){
            card_name.setAttribute('value', "");
            card_mail.setAttribute('value', "");
            //card_name.value = "";
            //card_mail.value = "";
            card_name.disable = false;
            card_name.readOnly = false;
            card_mail.disable = false;
            card_mail.readOnly = false;

        }else{
            const card = rows[0];
            card_name.setAttribute('value', card.name);
            card_mail.setAttribute('value', card.mail);
            //card_name.value = (card.name)?card.name:"";
            //card_mail.value = (card.mail)?card.mail:"";
            card_name.disable = false;
            card_name.readOnly = false;
            card_mail.disable = false;
            card_mail.readOnly = false;
        }
        card_edit.style.display = 'block';

    }
    // 受信設定
    ipcRenderer.on('card-message', async (_, idm)=>{ 
        // listenerの第一引数は event:IpcRenderEventだが未使用なので _ としている。
        // DB作成( ここでないとwindow.sqlite3が使えない！)
        if(modalManager.style.display == 'block'){
            ic_card_manager(idm);
        }else{
            ic_card_general(idm);
        }

    })
    
    ipcRenderer.on('app-manager-handling', async (_, managing)=>{ 
        console.log('managing=', managing);
        if(managing===true){
            modal.style.display = 'none';
            modalManager.style.display = 'block';
        }else{
            modal.style.display = 'none';
            modalManager.style.display = 'none';
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