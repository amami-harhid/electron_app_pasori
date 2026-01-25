const { ipcRenderer } = require('electron');
const {mailApi} = require('./js/bridge/mailApi.js');
const Sound = require('./js/page/sounds.js');
const {dateUtils} = require('./js/utils/dateUtils.js');

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

const confirm_alt = document.querySelector("#confirm");
const confirm_p = confirm_alt.querySelector("#confirm_p");
const confirm_btn_yes = confirm_alt.querySelector("#confirm-yes");
const confirm_btn_no = confirm_alt.querySelector("#confirm-no");
const card_empty_idm = document.getElementById('card_empty_idm');
const card_has_idm = document.getElementById('card_has_idm');

const pasoriModal_members_content = document.getElementById('pasoriModal_members_content');
    
const pasoriModal_members_edit_content = document.getElementById('pasoriModal_members_edit_content');


const viewingManager = (content) => {
    const viewer = [
        modalManager,
        modalMembers,
        pasoriModal_histories,
    ]
    for(const _v of viewer){
        if(content.id == _v.id){
            _v.style.display = 'block';
        }else{
            _v.style.display = 'none';
        }
    }
}
const myConfirm = (text) => {
    confirm_p.textContent = text;
    confirm_alt.style.display="block";
    return new Promise( ( resolve  )=>{
        const yesEvent = ()=>{resolve(true);removeEvent();}
        const noEvent = ()=>{resolve(false);removeEvent();}
        const removeEvent = ()=>{
            confirm_btn_yes.removeEventListener("click",yesEvent);
            confirm_btn_no.removeEventListener("click",noEvent);
            confirm_alt.style.display="none";
        };
        confirm_btn_yes.addEventListener("click",yesEvent);
        confirm_btn_no.addEventListener("click",noEvent);
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
        const MAILER_CONFIG = await ipcRenderer.invoke(mailApi.MailerGetConfig);

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
            Sound.soundNGPlay();
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
                    ipcRenderer.invoke(mailApi.MailerSendMail, mail_to, mail_subject, text, name)
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
                    ipcRenderer.invoke(mailApi.MailerSendMail, mail_to, mail_subject, text, name)
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
                Sound.soundInPlay();
            }else{
                p_tag.innerText = `退室 (${card.name}さん)`;
                p_tag.classList.add('out');
                Sound.soundByePlay();
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
        viewingManager(modalManager);
    })
    ipcRenderer.on('app-general-handling', async ()=>{ 
        nowAppManagerHandling = false;
        nowAppGeneralHandling = true;
        nowAppMembersHandling = false;
        viewingManager(modal);
        modal.style.display = 'none';
    })
    ipcRenderer.on('app-general-stop-handling', async ()=>{
        nowAppManagerHandling = false;
        nowAppGeneralHandling = false;
        nowAppMembersHandling = false;
        viewingManager(modal);
        modal.style.display = 'none';
    })
    const app_members_handling = async() => {
        nowAppManagerHandling = false;
        nowAppGeneralHandling = false;
        nowAppMembersHandling = true;
        viewingManager(modalMembers);
        modal.style.display = 'none';
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
        //pasoriModal_histories.style.display = 'none';
        viewingManager(modalMembers);
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

    // APPバージョンモーダル表示
    const app_version = document.getElementById('app_version_modal');
    app_version.style.display = 'none';
    ipcRenderer.on('app-version-handling', async (_, version)=>{
        const app_version_view = document.getElementById('app_version_view');
        app_version_view.innerHTML = `version=[${version}]`;
        app_version.style.display = 'block';
    })
    const app_version_yes = document.getElementById('app_version_yes');
    app_version_yes.addEventListener('click', ()=>{
        app_version.style.display = 'none';
    });

    // 入退室履歴モーダル表示
    const pasoriModal_histories = document.querySelector('#pasoriModal_histories');
    pasoriModal_histories.style.display = 'none';
    const histories_inputDate = pasoriModal_histories.querySelector('#histories_inputDate');
    const histories_dateResult = pasoriModal_histories.querySelector('#histories_dateResult');
    const histories_table = pasoriModal_histories.querySelector('#histories_table');
    const histories_body = histories_table.tBodies[1];
    const histories_reload = pasoriModal_histories.querySelector('#histories_reload');
    // メニュー（履歴）が押されたとき
    // 日付（本日）で初期表示する
    ipcRenderer.on('app-histories-handling', async ()=> {
        viewingManager(pasoriModal_histories);
        if(app_version.style.display == 'none') {
            pasoriModal_histories.style.display = 'block';
            histories_body.innerHTML = "";
            const toDay = new Date();
            const toDayStr = dateUtils.dateFormatter(toDay);
            histories_inputDate.value = toDayStr;
            histories_dateResult.textContent = toDayStr;
            await histories_view(toDayStr)
        }
    })
    // 履歴日付の日付が変更されたとき
    histories_inputDate.addEventListener("change", async (e) => {
        const _date = e.target.value;
        histories_dateResult.textContent = _date;
        await histories_view(_date);
    });
    histories_reload.addEventListener("click", async (e)=>{
        const _date = histories_dateResult.textContent;
        if(_date && typeof _date == 'string' && _date.length != ''){
            await histories_view(_date);
        }
    });
    // 選択日付で履歴テーブルを表示する
    const histories_view = async (_date) => {
        histories_body.innerHTML = '';
        const _histories = await ipcRenderer.invoke('selectInRoomHistoriesByDate',_date);
        let rowIdx = 0
        for(const _row of _histories){
            rowIdx += 1;
            const row = histories_body.insertRow(-1);
            let colomnIdx = 0
            // NO
            {
                const cell = row.insertCell(colomnIdx++);
                cell.textContent = String(rowIdx).padStart(4,'0');
            }
            // FCNO
            {
                const cell = row.insertCell(colomnIdx++);
                cell.textContent = _row.fcno;
            }
            // 名前
            {
                const cell = row.insertCell(colomnIdx++);
                cell.textContent = _row.name;
            }
            // カナ
            {
                const cell = row.insertCell(colomnIdx++);
                cell.textContent = _row.kana;
            }
            // 入室
            {
                const cell = row.insertCell(colomnIdx++);
                cell.textContent = _row.date_in;
            }
            // 退室
            {
                const cell = row.insertCell(colomnIdx++);
                cell.textContent = _row.date_out;
            }
        }
    }

// メンバー管理
class AppCardsHandler {
    // 全員分を取得する
    async getAll() {
        const memberRows = await ipcRenderer.invoke('selectCardsAll');
        return memberRows;
    }

}
const appCardHandler = new AppCardsHandler();