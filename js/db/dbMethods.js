import { app, ipcMain } from 'electron';
import {ApConfig} from '../conf.js';
import sqlite3 from 'sqlite3';

const DB_PATH = "DB_PATH";
const db_path = (ApConfig.has(DB_PATH))?
    ApConfig.get(DB_PATH): app.getPath('userData');
//console.log("db_path=",db_path)
const db = new sqlite3.Database(`${db_path}/pasori_card.db`);

const TEST_DATA = "TEST_DATA";
const testData = (ApConfig.has(TEST_DATA))?ApConfig.get(TEST_DATA):false;

const createCards = (_)=>{
    return new Promise((resolve, reject) => {
        db.run(
            `CREATE TABLE 
            IF NOT EXISTS cards 
            (
                [id] integer primary key autoincrement, 
                [fcno] text,
                [name] text,
                [kana] text,
                [mail] text, 
                [in_room] boolean, 
                [idm] text, 
                [date_time] datetime
            );`,
            err => {
                if (err) reject(err);
                resolve(true);
            }
        )
    })
};
const createHistories = (_)=>{
    return new Promise((resolve, reject) => {
        db.run(
            `CREATE TABLE 
            IF NOT EXISTS histories 
            (
                [id] integer primary key autoincrement, 
                [idm] text,
                [fcno] text,
                [in_room] false,
                [date_in] date,
                [date_out] date,
                [date_time] datetime
            );`,
            err => {
                if (err) reject(err);
                resolve(true);
            }
        )
    })
};
const selectCardsAll = (_) => {
    return new Promise((resolve, reject) => {
        const sql = "SELECT * FROM cards ORDER BY kana ASC;";
        db.all(sql, [], (err, rows)=>{
            if(err) {
                return reject(err);
            }
            resolve(rows);
        })
    })
};
const selectHistoriesAll = (_) => {
    return new Promise((resolve, reject) => {
        const sql = "SELECT * FROM histories;";
        db.all(sql, [], (err, rows)=>{
            if(err) {
                return reject(err);
            }
            resolve(rows);
        })
    })
};
const selectCardsWithCondition = (_, condition) => {
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

const selectCardsByIdm = (_, idm) => {
    return new Promise((resolve, reject) => {
        let sql = "SELECT * FROM cards WHERE idm = ?";
        db.all(sql, [idm], (err, rows)=>{
            if(err) {
                return reject(err);
            }
            resolve(rows);
        })
    })
};
const selectCardsByFcno = (_, fcno) => {
    return new Promise((resolve, reject) => {
        let sql = "SELECT * FROM cards WHERE fcno = ?";
        db.all(sql, [fcno], (err, rows)=>{
            if(err) {
                return reject(err);
            }
            resolve(rows);
        })
    })
};
const updateInRoom = (_, idm, in_room) => {
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
const updateIdmByFcno = (_, fcno, idm) => {
    return new Promise((resolve, reject) => {
        db.run(
            `UPDATE cards 
            SET idm = ?, 
            date_time = datetime("now", "localtime") 
            WHERE fcno = ?;`, 
            [idm, fcno], 
            err => {
                if (err) reject(err);
                resolve(true);
            }
        )
    })
};
const update = (_, name, kana, mail, idm) => {
    return new Promise((resolve, reject) => {
        db.run(
            `UPDATE cards 
            SET name = ?, kana = ?, mail = ?,
            date_time = datetime("now", "localtime") 
            WHERE idm = ?;`, 
            [name, kana, mail, idm], 
            err => {
                if (err) reject(err);
                resolve(true);
            }
        )
    })
};
const selectInRoomHistoriesByIdm = async (_, idm, date) => {
    return new Promise((resolve, reject) => {
        if(date){
            let sql = `SELECT * FROM histories 
                WHERE idm = ? AND date_in = ?`;
            db.all(sql, [idm], (err, rows)=>{
                if(err) {
                    return reject(err);
                }
                resolve(rows);
            })

        }else{
            let sql = `SELECT * FROM histories 
                WHERE idm = ? AND date_in = date(CURRENT_DATE)`;
            db.all(sql, [idm], (err, rows)=>{
                if(err) {
                    return reject(err);
                }
                resolve(rows);
            })

        }

    });
}
const selectInRoomHistoriesByDate = async (_, date) => {
    //console.log('selectInRoomHistoriesByDate', date);
    return new Promise((resolve, reject) => {
        let sql = `SELECT
                histories.fcno, 
                cards.name,cards.kana,
                histories.date_in, 
                histories.date_out 
                FROM histories
                LEFT OUTER JOIN cards 
                WHERE histories.date_in = date(?) AND histories.fcno = cards.fcno
                ORDER BY histories.fcno ASC;`;
        db.all(sql, [date], (err, rows)=>{
            if(err) {
                return reject(err);
            }
            resolve(rows);
        })

    });
}
const inRoomHistoriesByIdm = async (_, idm) => {

    const cards = await selectCardsByIdm(_, idm);
    if(cards.length>0){
        const inRooms = await selectInRoomHistoriesByIdm(_, idm);
        if(inRooms.length==0) {
            // 本日に入室はないとき
            const _card = cards[0];
            const _fcno = _card.fcno;
            return new Promise((resolve, reject) => {
                db.run(
                    `INSERT INTO histories 
                    (idm, fcno, in_room, date_in, date_out, date_time) 
                    VALUES (?, ?, TRUE, date(CURRENT_DATE), NULL, datetime("now", "localtime") );`, 
                    [idm, _fcno], 
                    err => {
                        if (err) reject(err);
                        resolve(true);
                    }
                )
            });
        }else{
            // 本日に入室があるとき
            return new Promise((resolve, reject) => {
                db.run(
                    `UPDATE histories SET 
                    in_room = TRUE, date_out = NULL, date_time = datetime("now", "localtime") 
                    WHERE idm = ? AND date_in = date(CURRENT_DATE);`, 
                    [idm], 
                    err => {
                        if (err) reject(err);
                        resolve(true);
                    }
                )
            });
        }
    }
    return false;
}
const outRoomHistoriesByIdm = async (_, idm) => {
    const inRooms = await selectInRoomHistoriesByIdm(_, idm);
    console.log(inRooms);
    if(inRooms.length > 0){
        // 入室があるとき
        return new Promise((resolve, reject) => {
            db.run(
                `UPDATE histories SET 
                in_room = false, 
                date_out = date(CURRENT_DATE), 
                date_time = datetime(CURRENT_DATE)
                WHERE idm = ? AND date_in = date(CURRENT_DATE)`, 
                [idm], 
                err => {
                    if (err) reject(err);
                    resolve(true);
                }
            )
        });
    }else{
        // 入室の履歴がないとき
        // 何もしない
        return false;
    }
}
const deleteHistoriesByIdm = async (_,idm) => {
    return new Promise((resolve, reject) => {
        db.run(
            `DELETE histories 
            WHERE idm = ?;`, 
            [idm], 
            err => {
                if (err) reject(err);
                resolve(true);
            }
        )
    });
}
const deleteHistoriesByFcno = async (_,fcno) => {
    return new Promise((resolve, reject) => {
        db.run(
            `DELETE histories
            WHERE fcno = ?;`, 
            [fcno], 
            err => {
                if (err) reject(err);
                resolve(true);
            }
        )
    });
}
const deleteOldHistories = async (_,idm) => {


}
const updateYesterday = async (_) => {
    const toDay = new Date();
    const year = toDay.getFullYear();
    const month = toDay.getMonth() + 1;
    const monthStr = String(month).padStart(2,'0');
    const day = toDay.getDate();
    const dayStr = String(day).padStart(2,'0');
    const today_first = `${year}-${monthStr}-${dayStr} 00:00:00`;
    return new Promise((resolve, reject) => {
        db.run(
            `UPDATE cards 
            SET in_room = false,
            date_time = ? 
            WHERE date_time < ?;`, 
            [today_first, today_first], 
            err => {
                if (err) reject(err);
                resolve(true);
            }
        )
    })
};
// データ挿入
const insertData = async (_, fcno, name, kana, mail, in_room, idm) => {
    return new Promise((resolve, reject) => {
        db.run(
            `INSERT INTO cards 
            (fcno, name, kana, mail, in_room, idm, date_time) 
            VALUES (?, ?, ?, ?, ?, ?, datetime("now", "localtime"));`, 
            [fcno, name, kana, mail, in_room, idm], 
            err => {
                if (err) reject(err);
                resolve(true);
            }
        )
    });    
}
const releaseIdm = async (_, idm) => {
    return new Promise((resolve, reject) => {
        const sql = "UPDATE cards SET idm = '' WHERE idm=?;";
            db.run(
                sql,[idm],
                err => {
                    if (err) reject(err);
                    resolve(true);
                }
            )
    });

}

const deleteCards = async (_) => {
    return new Promise((resolve, reject) => {
        const sql = "DELETE FROM cards;";
        db.run(
            sql,
            err => {
                if (err) reject(err);
                resolve(true);
            }
        )
    });
}
const deleteCardsByFcno = async (_, fcno) => {
    return new Promise((resolve, reject) => {
        if(fcno) {
            const sql = "DELETE FROM cards WHERE fcno=?;";
            db.run(
                sql,[fcno],
                err => {
                    if (err) reject(err);
                    resolve(true);
                }
            )
        }
        return false;    
    });
}

const dropCards = async (_) => {
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
const dropHistories = async (_) => {
    return new Promise((resolve, reject) => {
        const sql = "DROP TABLE IF EXISTS histories;";
        db.run(
            sql,
            err => {
                if (err) reject(err);
                resolve(true);
            }
        )
    });
}
// 日替わりで在室中を不在にする
const dailyClean = async () => {
    await updateYesterday();
}

// DBクローズ
const dbClose = () => {
    db.close();
}

export const pasoriDb = {
    createCards: createCards,
    createHistories: createHistories,
    dailyClean:dailyClean,
    dbClose: dbClose,
    deleteCards: deleteCards,
    deleteCardsByFcno: deleteCardsByFcno,
    deleteHistoriesByIdm:deleteHistoriesByIdm,
    deleteHistoriesByFcno:deleteHistoriesByFcno,
    dropHistories: dropHistories,
    inRoomHistoriesByIdm: inRoomHistoriesByIdm,
    insertData: insertData,
    outRoomHistoriesByIdm: outRoomHistoriesByIdm,
    releaseIdm, releaseIdm,
    selectCardsAll: selectCardsAll,
    selectHistoriesAll: selectHistoriesAll,
    selectInRoomHistoriesByDate:selectInRoomHistoriesByDate,
    selectCardsWithCondition: selectCardsWithCondition,
    selectCardsByIdm: selectCardsByIdm,
    selectCardsByFcno: selectCardsByFcno,
    updateIdmByFcno: updateIdmByFcno,
    update: update,
    updateInRoom: updateInRoom,
}
// DBメソッドをレンダラー側で使用可能にする
export const handle_db_methods = ()=>{
    for( const name in pasoriDb) {
        const method = pasoriDb[name];
        ipcMain.handle(name, method);
    }
};


export const initDb = async () => {

    await dailyClean();

    if( testData === false) {
        return;
    }
    await dropCards();
    await dropHistories();
    await createCards();
    await createHistories();

}
