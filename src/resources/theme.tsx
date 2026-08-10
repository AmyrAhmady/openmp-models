import store from "src/state/store";

const lightTheme = {
    navbar: '#ffffff',
    elementBg: '#ffffff',
    mainBg: '#f5f7fb',
    normalText: '#000000',
    title: '#172033',
    lines: '#e5e7eb',
    button: '#635bff',
    textBox: '#f8fafc',
    textBoxPlaceholder: '#7b8497',
    mutedText: '#6b7280',
    accent: '#635bff',
    accentSoft: '#eeecff',
    stageBg: '#eef1f7'
}

const darkTheme = {
    navbar: '#151923',
    elementBg: '#1d2330',
    mainBg: '#10141d',
    normalText: '#f3f4f6',
    title: '#f7f8fb',
    lines: '#2b3342',
    button: '#8b83ff',
    textBox: '#171d29',
    textBoxPlaceholder: '#8b95a8',
    mutedText: '#9aa4b5',
    accent: '#8b83ff',
    accentSoft: '#2b2850',
    stageBg: '#171d29'
}

export const themeSelect = (custom?: string) => {
    if (custom) {
        return custom === "dark" ? darkTheme : lightTheme;
    }
    return store.state.themeMode === "dark" ? darkTheme : lightTheme;
}
