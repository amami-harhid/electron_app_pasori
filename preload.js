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
                //console.log('ipcRenderer.invoke selectCardsAll')
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
    const modalMembers = document.getElementById('pasoriModal_members');
    modalMembers.style.display = 'none';
    const statusDiv = document.getElementById('statusDiv'); 
    const card_manager = document.getElementById('card_manager');
    card_manager.style.display = 'none';
    const card_edit = document.getElementById('card_edit');
    card_edit.style.display = 'none';
    const card_regist = document.getElementById('card_regist');
    const card_delete = document.getElementById('card_delete');
    const span_card_idm = document.getElementById('card_idm');
    const card_fcno = document.getElementById('card_fcno')
    const card_name = document.getElementById('card_name');
    const card_kana = document.getElementById('card_kana');
    //const card_mail = document.getElementById('card_mail');
    const fcno_select = document.getElementById('fcno-select');
    const card_message_span = document.getElementById('card_message_span');
    const memberTable = document.getElementById('members');
    const member_edit_cancel = document.getElementById('member_edit_cancel');
    const member_edit_update = document.getElementById('member_edit_update');
    const member_edit_remove = document.getElementById('member_edit_remove');
    const add_new_member = document.getElementById('add_new_member');

    const alt = document.getElementById("confirm");
    const p = alt.querySelector("p");
    const btn_yes = alt.querySelector("#confirm-yes");
    const btn_no = alt.querySelector("#confirm-no");
    const card_empty_idm = document.getElementById('card_empty_idm');
    const card_has_idm = document.getElementById('card_has_idm');

    const pasoriModal_members_content = document.getElementById('pasoriModal_members_content');
    
    const pasoriModal_members_edit_content = document.getElementById('pasoriModal_members_edit_content');

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
    let now_confirm = false;
    card_regist.addEventListener('click', async ()=>{
        if(now_confirm == true){
            return false;
        }

        card_message_span.innerHTML = '';
        const idm= span_card_idm.innerHTML;
        const checkView = async(fcno) => {
            const rows = await ipcRenderer.invoke('selectCardsByFcno',fcno);
            if(rows.length > 0) {
                fcno_select.innerHTML = '';
                const _card = rows[0];
                card_fcno.innerHTML = _card.fcno;
                card_name.innerHTML = _card.name;
                card_kana.innerHTML = _card.kana;
            }
        }
        if(card_regist.innerHTML == '確認'){
            card_regist.innerHTML = '更新';
            // 選択した値
            const _fcno = fcno_select.value;
            await checkView(_fcno);
            card_empty_idm.style.display = 'none';
            card_has_idm.style.display = 'inline-block';
        }else{
            now_confirm = true;
            const answer = await myConfirm('登録しますか？')
            now_confirm = false;
            const target_name = card_name.innerHTML;
            if(answer === true){
                if(card_has_idm.style.display != 'none') {
                    // IDM登録がないときの条件
                    const _fcno = card_fcno.innerHTML;
                    if(_fcno && typeof _fcno === 'string' && _fcno.length > 0){
                        await ipcRenderer.invoke('updateIdmByFcno', _fcno, idm);
                        card_regist.style.display = 'none';
                        await checkView(_fcno);
                        card_message_span.innerHTML = `${target_name}さんへIDMを登録しました`
                    }
                }
            }
            if(card_touching === false) {
                // カードが離れているとき
                setTimeout(()=>{
                    hide_card_manager();
                }, 1000);
            }
        }
        return false;
    });
    card_delete.addEventListener('click', async ()=>{
        if(now_confirm == true){
            return false;
        }
        const target_name = card_name.innerHTML;
        card_message_span.innerHTML = '';
        now_confirm = true;
        const answer = await myConfirm('削除しますか？')
        now_confirm = false;
        if(answer === true){
            const idm = span_card_idm.innerHTML;
            await ipcRenderer.invoke('releaseIdm',idm);
            card_fcno.innerHTML = "";
            card_name.innerHTML = "";
            card_kana.innerHTML = "";
            //card_mail.setAttribute("value", "");
            card_regist.style.display = "none";
            card_delete.style.display = "none";
            card_message_span.innerHTML = `${target_name}さんからIDMを除外しました`;

        }
        if(card_touching === false) {
            // カードが離れているとき
            setTimeout(()=>{
                hide_card_manager();
            }, 1000);
        }
        //card_name.disable = false;
        //card_mail.disable = false;
        return false;
    });

    const ic_card_general = async (idm) => {
        const MAILER_CONFIG = await ipcRenderer.invoke('mailer:get_config');

        //database_init(window);
        if (idm == null || idm == ''){
            modal.style.display = 'none';
            return;
        }
        const cardsRows = await ipcRenderer.invoke('selectCardsWithCondition', `idm = '${idm}'`);
        //console.log('ic_card_general');
        //console.log(cardsRows);
        if( cardsRows.length == 0) {
            //console.log(`登録なしカード=(${idm})`);
            soundNGPlay();
            //console.log('soundNGPlay() おわり')
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
        //console.log(`登録ありカード=(${idm})`);
        const card = cardsRows[0];
        //console.log(card);
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
                    // 意図的にawaitをつけない
                    ipcRenderer.invoke('mailer:send_mail', mail_to, mail_subject, text, name)
                }
                // 意図的にawaitをつけない
                ipcRenderer.invoke('outRoomHistoriesByIdm', idm);
            }else{
                // 入室処理
                status = true;
                ipcRenderer.invoke('updateInRoom', idm, true)
                const mail_to = card.mail;
                if(mail_to && typeof mail_to === 'string' && mail_to.length > 0){
                    const mail_subject = MAILER_CONFIG.MAIL_SUBJECT.IN;
                    const name = card.name;
                    const text = MAILER_CONFIG.MAIL_TEXT.IN;
                    // 意図的にawaitをつけない
                    ipcRenderer.invoke('mailer:send_mail', mail_to, mail_subject, text, name)
                }
                // 意図的にawaitをつけない
                ipcRenderer.invoke('inRoomHistoriesByIdm', idm);
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
    let card_touching = false;
    const hide_card_manager = () => {
        card_manager.style.display = 'none';
        fcno_select.innerHTML = ''; // option全削除
        span_card_idm.innerHTML = "";
        card_fcno.innerHTML = "";
        card_name.innerHTML = "";
        card_kana.innerHTML = "";
        card_edit.style.display = 'none';
    }
    const ic_card_manager = async (idm) => {
        card_touching = true;
        card_message_span.innerHTML = '';

        if (idm == ''){
            card_touching = false;
            if(now_confirm === true){
                return;
            }
            hide_card_manager();
            return;
        }
        card_manager.style.display = 'block';
        span_card_idm.innerHTML = idm;
        const rows = await ipcRenderer.invoke('selectCardsByIdm', idm);
        if(rows.length == 0){
            // IDM未登録
            card_empty_idm.style.display = 'inline-block';
            card_has_idm.style.display = 'none';
            const emptyRows = await ipcRenderer.invoke('selectCardsByIdm', '');
            // 選択肢を追加
            fcno_select.innerHTML = ''; // option全削除
            for(const card of emptyRows) {
                //console.log(card);
                const newOption = document.createElement("option");
                newOption.value = card.fcno;
                newOption.text = `${card.name}(${card.fcno})`;
                fcno_select.add(newOption);
            }
            // IDM登録なし
            card_delete.style.display = "none";
            if(emptyRows.length == 0) {
                // 登録できない
                card_regist.style.display = "none";
            }else{
                card_regist.style.display = "inline-block";
                card_regist.innerHTML = "確認";

            }

        }else{
            // IDM登録あり
            card_empty_idm.style.display = 'none';
            card_has_idm.style.display = 'inline-block';

            card_regist.style.display = 'none';
            card_delete.style.display = "inline-block";
            const card = rows[0];
            card_fcno.innerHTML = card.fcno;
            card_name.innerHTML = card.name;
            card_kana.innerHTML = card.kana;
        }
        card_edit.style.display = 'block';

    }
    // 受信設定
    ipcRenderer.on('card-message', async (_, idm)=>{
        // listenerの第一引数は event:IpcRenderEventだが未使用なので _ としている。
        // DB作成( ここでないとwindow.sqlite3が使えない！)
        if(modalManager.style.display == 'block'){
            if(nowAppManagerHandling===true){
                ic_card_manager(idm);
            }
        }else{
            if(nowAppGeneralHandling===true){
                ic_card_general(idm);
            }
        }

    })
    let nowAppManagerHandling = false;
    let nowAppGeneralHandling = false; // 初期値
    let nowAppMembersHandling = false;
    ipcRenderer.on('app-manager-handling', async ()=>{ 
        nowAppManagerHandling = true;
        nowAppGeneralHandling = false;
        nowAppMembersHandling = false;
        modal.style.display = 'none';
        modalManager.style.display = 'block';
        modalMembers.style.display = 'none';
    })
    ipcRenderer.on('app-general-handling', async ()=>{ 
        nowAppManagerHandling = false;
        nowAppGeneralHandling = true;
        nowAppMembersHandling = false;
        //console.log('managing=', managing);
        modal.style.display = 'none';
        modalManager.style.display = 'none';
        modalMembers.style.display = 'none';
    })
    ipcRenderer.on('app-general-stop-handling', async ()=>{ 
        nowAppManagerHandling = false;
        nowAppGeneralHandling = false;
        nowAppMembersHandling = false;
        //console.log('managing=', managing);
        modal.style.display = 'none';
        modalManager.style.display = 'none';
        modalMembers.style.display = 'none';
    })
    const app_members_handling = async() => {
        nowAppManagerHandling = false;
        nowAppGeneralHandling = false;
        nowAppMembersHandling = true;
        //console.log('managing=', managing);
        modal.style.display = 'none';
        modalManager.style.display = 'none';
        modalMembers.style.display = 'block';
        pasoriModal_members_content.style.display = 'block';
        pasoriModal_members_edit_content.style.display = 'none';
        const cards = await appCardHandler.getAll();
        
        const memberRowsBody = memberTable.tBodies[1];
        memberRowsBody.innerHTML = ''; // 子要素TRを全削除
        let rowIdx = 0
        for(const card of cards) {
            rowIdx+= 1;
            const row = memberRowsBody.insertRow(-1);
            let colomnIdx = 0
            // NO
            {
                const cell = row.insertCell(colomnIdx++);
                cell.textContent = String(rowIdx).padStart(4,'0');
            }
            // FCNO
            {
                const cell = row.insertCell(colomnIdx++);
                cell.textContent = card.fcno;
                cell.classList.add('CELL_FCNO');
            }
            // 名前
            {
                const cell = row.insertCell(colomnIdx++);
                cell.textContent = card.name;
            }
            // カナ
            {
                const cell = row.insertCell(colomnIdx++);
                cell.textContent = card.kana;
            }
            // MAIL
            {
                const cell = row.insertCell(colomnIdx++);
                cell.textContent = card.mail;
            }
            // 在室
            {
                const cell = row.insertCell(colomnIdx++);
                cell.textContent = (card.in_room===1)?"在室":"";
            }
            // CARD IDM
            {
                const cell = row.insertCell(colomnIdx++);
                cell.textContent = card.idm;
            }
        }        
    }
    ipcRenderer.on('app-members-handling', async ()=>{
        await app_members_handling();
    })
    memberTable.addEventListener('click', async (e)=>{
        if(e) {
            const target = e.target;
            if(target.tagName === 'TD' && target.classList.contains('CELL_FCNO')){
                const fcno = target.innerHTML;
                await editCard(fcno);
            }
        }
    });
    const editCard = async (fcno) => {
        console.log('editCard fcno=',fcno);
        member_edit_remove.style.display = 'none';
        const targetCardRows = await ipcRenderer.invoke('selectCardsByFcno', fcno);
        const member_edit_fcno = document.getElementById('member_edit_fcno');
        const member_edit_name = document.getElementById('member_edit_name');
        const member_edit_kana = document.getElementById('member_edit_kana');
        const member_edit_mail = document.getElementById('member_edit_mail');
        if(targetCardRows.length > 0){
            pasoriModal_members_content.style.display = 'none';
            pasoriModal_members_edit_content.style.display = 'block';
            const card = targetCardRows[0];
            member_edit_fcno.value = fcno;
            member_edit_fcno.readOnly = true;
            member_edit_name.value = card.name;
            member_edit_kana.value = card.kana;
            member_edit_mail.value = card.mail;
            member_edit_update.innerHTML = "更新";
            member_edit_remove.style.display = 'inline-block';
        }else{
            pasoriModal_members_content.style.display = 'none';
            pasoriModal_members_edit_content.style.display="block";
            member_edit_fcno.value = "";
            member_edit_fcno.readOnly = false;
            member_edit_name.value = "";
            member_edit_kana.value = "";
            member_edit_mail.value = "";
            member_edit_update.innerHTML = "追加";
        }

    }
    // キャンセル
    member_edit_cancel.addEventListener('click',async()=>{
        await app_members_handling();
    });
    // 更新
    member_edit_update.addEventListener('click',async()=>{
        const _type = member_edit_update.innerHTML;
        const member_edit_fcno = document.getElementById('member_edit_fcno');
        const member_edit_name = document.getElementById('member_edit_name');
        const member_edit_kana = document.getElementById('member_edit_kana');
        const member_edit_mail = document.getElementById('member_edit_mail');
        if(_type == '更新'){
            const fcno = member_edit_fcno.value;
            const rows = await ipcRenderer.invoke('selectCardsByFcno', fcno);
            if(rows.length>0){
                const card = rows[0];
                const idm = card.idm;
                await ipcRenderer.invoke('update',
                    member_edit_name.value,
                    member_edit_kana.value, 
                    member_edit_mail.value,
                    idm
                );
            }
        }else if(_type=='追加'){
            const fcno = member_edit_fcno.value;
            await ipcRenderer.invoke('insertData',
                fcno, 
                member_edit_name.value,
                member_edit_kana.value, 
                member_edit_mail.value,
                false, // in_room 
                '' // idm
            );
        }
        await app_members_handling();
    });
    // 削除
    member_edit_remove.addEventListener('click', async()=>{
        const member_edit_fcno = document.getElementById('member_edit_fcno');
        const fcno = member_edit_fcno.value;
        await ipcRenderer.invoke('deleteCardsByFcno',
                fcno
            );
        await ipcRenderer.invoke('deleteHistoriesByFcno', fcno);
        await app_members_handling();
    });
    // 新規メンバー追加
    add_new_member.addEventListener('click',async ()=>{
        await editCard();
    });
});

// メンバー管理
class AppCardsHandler {
    // 全員分を取得する
    async getAll() {
        const memberRows = await ipcRenderer.invoke('selectCardsAll');
        return memberRows;
    }

}
const appCardHandler = new AppCardsHandler();

