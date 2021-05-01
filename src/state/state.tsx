import { Cookie } from "universal-cookie";

export interface IState {
    themeMode: 'dark' | 'light';
    cookie: Cookie
}

export default {
    themeMode: 'light',
    cookie: null
} as IState;