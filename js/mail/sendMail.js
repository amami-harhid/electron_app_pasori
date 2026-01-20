import nodemailer from 'nodemailer';
import { ipcMain } from 'electron';
import { ApConfig } from '../conf.js';

const SMTP_SERVER = (ApConfig.has("SMTP_SERVER"))?
        ApConfig.get("SMTP_SERVER"):"";
console.log(SMTP_SERVER);
const SMTP_PORT = (ApConfig.has("SMTP_PORT"))?
        ApConfig.get("SMTP_PORT"):456; // 465
console.log(SMTP_PORT);
// trueの場合はSSL/TLSを使用
const SMPT_SECURE = (ApConfig.has("SMPT_SECURE"))?
        ApConfig.get("SMPT_SECURE"):true;
console.log(SMPT_SECURE);
// user は googleアカウントの@の左側です
// pass は googleアカウント管理画面内で
// 二段階認証有効としたうえで、同画面内で
// アプリケーションパスワードとして設定したものです。
// Googleアカウントのパスワードではありません。
const SMTP_ACCOUNT_USER = (ApConfig.has("SMTP_ACCOUNT_USER"))?
        ApConfig.get("SMTP_ACCOUNT_USER"):"";
console.log(SMTP_ACCOUNT_USER);
const SMTP_ACCOUNT_PASSWORD = (ApConfig.has("SMTP_ACCOUNT_PASSWORD"))?
        ApConfig.get("SMTP_ACCOUNT_PASSWORD"):"";
console.log(SMTP_ACCOUNT_PASSWORD);

// 送信元
const MAIL_FROM = '"Pasori System" <pasori@mirai-logic.com>'
// 件名
const MAIL_SUBJECT = {
    IN: (ApConfig.has("MAIL_SUBJECT_IN"))? 
        ApConfig.get("MAIL_SUBJECT_IN"):"入室連絡(Pasori)",
    OUT: (ApConfig.has("MAIL_SUBJECT_OUT"))? 
        ApConfig.get("MAIL_SUBJECT_OUT"):"退室連絡(Pasori)",
}
// 本文
const MAIL_TEXT = {
    IN: (ApConfig.has("MAIL_TEXT_IN"))? 
        ApConfig.get("MAIL_TEXT_IN"):"入室",
    OUT: (ApConfig.has("MAIL_TEXT_OUT"))? 
        ApConfig.get("MAIL_TEXT_OUT"):"退室",
}

const SEND_MAILER = async ( eve,
    mail_to, mail_subject, text, name ) =>{
    console.log('mail_to=',mail_to, 
        'mail_subject=',mail_subject, 
        'text=',text, 
        'name=',name)
    // SMTPサーバーの設定
    let transporter = nodemailer.createTransport({
        host: SMTP_SERVER, 
        port: SMTP_PORT, 
        secure: SMPT_SECURE,
        auth: {
            user: SMTP_ACCOUNT_USER, // メールアドレス
            pass: SMTP_ACCOUNT_PASSWORD // パスワード
        }
    })
    // メール内容の設定
    let mailOptions = {
        from: MAIL_FROM, // 送信元
        to: mail_to, // 送信先
        subject: mail_subject, // 件名
        text: `${name}さんが${text}しました`, // テキスト形式の本文
        html: `<p><strong>${name}</strong>さんが${text}しました</p>` // HTML形式
    }

    try {
        let info = await transporter.sendMail(mailOptions);
        console.log("メールが送信されました:", info.messageId);
    } catch (error) {
        console.error("エラーが発生しました:", error);
    }
}

export const handle_mail_methods = () => {
    ipcMain.handle("mailer:send_mail", SEND_MAILER);
    ipcMain.handle("mailer:get_config", ()=>{
        return {
            MAIL_SUBJECT:MAIL_SUBJECT,
            MAIL_TEXT:MAIL_TEXT,
        }
    });
}

export const Mailer = {
    subject: MAIL_SUBJECT,
    text: MAIL_TEXT,
    sendMail: SEND_MAILER,
}