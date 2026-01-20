import Store from "electron-store";

const store = new Store();



const save = (obj) => {
    for(const key in obj){
        const value = obj[key];
        store.set(key, value) 
    }
}
const get = (key) => {
    if(key && typeof key == 'string') {
        return store.get(key);
    }
    return "";
}
const has = (key)=> {
    if(key && typeof key == 'string') {
        if(store.has(key)){
            return true;
        }
    }
    return false;
}
export const ApConfig = {
    get : get,
    save : save,
    has: has,
}