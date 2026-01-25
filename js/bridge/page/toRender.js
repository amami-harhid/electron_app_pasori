import { ipcMain } from 'electron';
import { ApConfig } from '../../conf.js';

const PAGE_TITLE = ApConfig.get("PAGE_TITLE");
export const handle_page_methods = () => {
    ipcMain.handle("page:get_title", ()=>{
        return PAGE_TITLE;
    });
}
export const handle_page_menu = () => {
    ipcMain.handle("page:menu_manager", ()=>{
        ApConfig.save('MANAGER', true);
    });
}