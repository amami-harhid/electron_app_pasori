import { app, ipcMain } from 'electron';
import {ApConfig} from '../conf.js';
import sqlite3 from 'sqlite3';

const DB_PATH = "DB_PATH";
const db_path = (ApConfig.has(DB_PATH))?
    ApConfig.get(DB_PATH): app.getPath('userData');
console.log("db_path=",db_path)
const db = new sqlite3.Database(`${db_path}/pasori_card.db`);

const testData = ApConfig.get("TEST_DATA");

const createCards = (eve)=>{
    return new Promise((resolve, reject) => {
        db.run(
            `CREATE TABLE 
            IF NOT EXISTS cards 
            (
                [id] integer primary key autoincrement, 
                [idm] text, 
                [name] text, 
                [mail] text, 
                [in_room] boolean, 
                [date_time] datetime
            );`,
            err => {
                if (err) reject(err);
                resolve(true);
            }
        )
    })
};
const selectCardsAll = (eve) => {
    console.log("dbmethods selectCardsAll");
    return new Promise((resolve, reject) => {
        const sql = "SELECT * FROM cards;";
        db.all(sql, [], (err, rows)=>{
            if(err) {
                return reject(err);
            }
            console.log('rows=',rows)
            resolve(rows);
        })
    })
};
const selectCardsWithCondition = (eve, condition) => {
    console.log("dbmethods selectCardsAll");
    return new Promise((resolve, reject) => {
        let sql = "SELECT * FROM cards";
        if(condition && typeof condition === 'string'){
            sql += " WHERE " + `${condition}` ;
        }
        sql += ";";
        db.all(sql, [], (err, rows)=>{
            if(err) {
                return reject(err);
            }
            resolve(rows);
        })
    })
};
const updateInRoom = (eve, idm, in_room) => {
    return new Promise((resolve, reject) => {
        db.run(
            `UPDATE cards 
            SET in_room = ?, 
            date_time = datetime("now", "localtime") 
            WHERE idm = ?;`, 
            [in_room, idm], 
            err => {
                if (err) reject(err);
                resolve(true);
            }
        )
    })
};
// データ挿入
const insertData = async (eve, idm, name, mail, in_room) => {
    return new Promise((resolve, reject) => {
        db.run(
            `INSERT INTO cards 
            (idm, name, mail, in_room, date_time) 
            VALUES (?, ?, ?, ? , datetime("now", "localtime"));`, 
            [idm, name, mail, in_room], 
            err => {
                if (err) reject(err);
                resolve(true);
            }
        )
    });    
}
const deleteCards = async (eve, idm) => {
    return new Promise((resolve, reject) => {
        if(idm) {
            const sql = "DELETE FROM cards WHERE idm=?;";
            db.run(
                sql,[idm],
                err => {
                    if (err) reject(err);
                    resolve(true);
                }
            )
        }else{
            const sql = "DELETE FROM cards;";
            db.run(
                sql,
                err => {
                    if (err) reject(err);
                    resolve(true);
                }
            )
        }    
    });
}

const dropCards = async (eve) => {
    return new Promise((resolve, reject) => {
        const sql = "DROP TABLE IF EXISTS cards;";
        db.run(
            sql,
            err => {
                if (err) reject(err);
                resolve(true);
            }
        )
    });
}
// DBクローズ
const dbClose = () => {
    db.close();
}

export const pasoriDb = {
    createCards: createCards,
    selectCardsAll: selectCardsAll,
    selectCardsWithCondition: selectCardsWithCondition,
    updateInRoom: updateInRoom,
    insertData: insertData,
    deleteCards: deleteCards,
    dbClose: dbClose,
}
// DBメソッドをレンダラー側で使用可能にする
export const handle_db_methods = ()=>{
    for( const name in pasoriDb) {
        const method = pasoriDb[name];
        ipcMain.handle(name, method);
    }
};


export const initDb = async () => {
    if( testData === false) {
        return;
    }
    await dropCards();
    await createCards();
    await insertData(null, 
        '012e4cd8a3179d43',
        '山田 太郎',
        'iti.haranaga@gmail.com',
        false,
    );
    await insertData(null, 
        '012e4ce15c951d76',
        '斎藤 源五郎',
        '',
        false,
    );
    await insertData(null, 
        '',
        '清水 恵子',
        'haranagahidehiro@icloud.com',
        false,
    );
    await insertData(null, 
        '',
        '山本 さちこ',
        '',
        false,
    );

}
