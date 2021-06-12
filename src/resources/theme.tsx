import store from "src/state/store";

const lightTheme = {
    navbar: '#f2f2f2',
    elementBg: '#fafafa',
    mainBg: '#ffffff',
    normalText: '#000000',
    title: '#555555',
    lines: '#CCCCCC',
    button: '#999999',
    textBox: '#FAFAFA',
    textBoxPlaceholder: '#747474'
}

const darkTheme = {
    navbar: '#2C2D2D',
    elementBg: '#532E67',
    mainBg: '#252830',
    normalText: '#C5C5C5',
    title: '#BBBBBB',
    lines: '#282828',
    button: '#BBBBBB',
    textBox: '#2B3039',
    textBoxPlaceholder: '#9D9D9D'
}

export const themeSelect = (custom?: string) => {
    if (custom) {
        return custom === "dark" ? darkTheme : lightTheme;
    }
    return store.state.themeMode === "dark" ? darkTheme : lightTheme;
}