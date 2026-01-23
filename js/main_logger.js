import logger from 'electron-log';
import { ApConfig } from './conf.js';

const DEBUG_LOG = "DEBUG_LOG";

export class Main_logger {

    static info(...args) {
        logger.info(args);
    }
    static debug(...args) {
        if(ApConfig.has(DEBUG_LOG) && ApConfig.get(DEBUG_LOG)===true){
            logger.debug(args);
        }
    }
    static warn(...args) {
        logger.warn(args);
    }
    static error(...args) {
        logger.error(args);
    }

};