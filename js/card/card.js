import { NFC } from "./nfc-pcsc/index.js";
import { Main_logger } from "../main_logger.js";

const nfc = new NFC();

export const waitForCondition = function(conditionFn, intervalMs=100, timeoutMs=5000) {
    return new Promise((resolve, reject)=>{
        console.log(typeof conditionFn)
        if( typeof conditionFn != "function") {
            reject(new Error("waitForCondition conditionFn error"));
            return;
        }
        const startTime = Date.now();
        const timer = setInterval(() => {
            if (conditionFn()) {
                clearInterval(timer);
                resolve();
            } else if (timeoutMs > 0 && Date.now() - startTime >= timeoutMs) {
                clearInterval(timer);
                reject(new Error("waitForCondition timeout"));
            }
        }, intervalMs);
    });
}

export class Reader {
    static win = null;
    static ready(
        callback_pasori_ready,
        pasori_card_touch,
        pasori_card_remove,
    ) {
        //console.log('waiting, in Reader')
        //await waitForCondition(() => Reader.win != null, 50, 5000);
        //console.log('ready go, in Reader')
        Main_logger.debug('ready go, in Reader');
        nfc.on('reader', reader=>{
            const device_name = reader.reader.name;
            Main_logger.debug(`Device ready (${device_name})`);
            //console.log(`Device ready (${device_name})`);
            callback_pasori_ready(device_name);
            reader.on('card', async card => {
                Main_logger.debug(`IC Card touched`);
                Main_logger.debug(card);
	            //console.log(`IC Card touched`);
	            //console.log(card);
                pasori_card_touch(card.uid);
        
            });
            reader.on('card.off', card=>{
                Main_logger.debug(`IC Card removed`);
                Main_logger.debug(card);
                //console.log(`IC Card removed`);
	            //console.log(card);
                pasori_card_remove()
            })
            reader.on('error', err => {
                console.log(`${reader.reader.name}  an error occurred`, err);
            });
            reader.on('end', () => {
                console.log(`device removed (${reader.reader.name})`);
            });
        })
        nfc.on('error', err => {
	        console.log('an error occurred', err);
        });

    }

}

