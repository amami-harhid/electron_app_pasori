import { app } from 'electron';
const version = app.getVersion();
export const appVersion = () => {
    return version;
}
