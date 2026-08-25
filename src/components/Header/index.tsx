import React from 'react';
import {
    Image,
    Linking,
    Pressable,
    StyleSheet,
    Switch,
    Text,
    TouchableOpacity,
    View,
} from 'react-native-web';
import type { ModelType } from 'src/domain/catalog';
import { MODEL_TYPE_LABELS, MODEL_TYPE_OPTIONS } from 'src/domain/modelType';
import type { ThemeMode } from 'src/theme/themeTokens';
import { useTheme } from 'src/theme/ThemeContext';

export type HeaderPage = 'home' | 'library' | 'world' | 'editor';

interface HeaderLink {
    href: string;
    key: HeaderPage;
    label: string;
}

const headerLinks: HeaderLink[] = [
    { href: '/', key: 'home', label: 'Home' },
    { href: '/models?cat=vehicles&model=400', key: 'library', label: 'Model Library' },
    { href: '/#world-explorer', key: 'world', label: 'World Explorer' },
    { href: '/#map-editor', key: 'editor', label: 'Map Editor' },
];

interface Props {
    activePage: HeaderPage;
    isMobile?: boolean;
    modelType?: ModelType;
    onModelTypeChange?: (type: ModelType) => void;
    onThemeModeChange: (mode: ThemeMode) => void;
    subtitle?: string;
    themeMode: ThemeMode;
}

const drawerLayerStyle: React.CSSProperties = {
    bottom: 0,
    left: 0,
    position: 'fixed',
    right: 0,
    top: 0,
    zIndex: 1000,
};

const drawerBackdropStyle: React.CSSProperties = {
    backgroundColor: 'rgba(15, 23, 42, 0.38)',
    bottom: 0,
    left: 0,
    position: 'absolute',
    right: 0,
    top: 0,
    transition: 'opacity 200ms ease-out',
};

const drawerPanelStyle: React.CSSProperties = {
    bottom: 0,
    boxShadow: '-4px 0 18px rgba(15, 23, 42, 0.18)',
    maxWidth: 320,
    padding: 18,
    position: 'absolute',
    right: 0,
    top: 0,
    transition: 'transform 240ms ease-out',
    width: '84%',
};

const Header = ({
    activePage,
    isMobile = false,
    modelType,
    onModelTypeChange,
    onThemeModeChange,
    subtitle = 'Open Multiplayer toolkit',
    themeMode,
}: Props) => {
    const { theme } = useTheme();
    const [drawerVisible, setDrawerVisible] = React.useState(false);
    const [drawerClosing, setDrawerClosing] = React.useState(false);
    const [drawerOpen, setDrawerOpen] = React.useState(false);
    const [libraryExpanded, setLibraryExpanded] = React.useState(activePage === 'library');
    const darkMode = themeMode === 'dark';

    const openDrawer = () => {
        setDrawerClosing(false);
        setDrawerOpen(false);
        setDrawerVisible(true);
        requestAnimationFrame(() => {
            setDrawerOpen(true);
        });
    };

    const closeDrawer = () => {
        if (!drawerVisible || drawerClosing) {
            return;
        }

        setDrawerClosing(true);
        setDrawerOpen(false);
        window.setTimeout(() => {
            setDrawerVisible(false);
            setDrawerClosing(false);
        }, 200);
    };
    const selectCategory = (type: ModelType) => {
        onModelTypeChange?.(type);
        closeDrawer();
    };

    const renderPageLink = (link: HeaderLink, mobile = false) => {
        const isActive = link.key === activePage;

        return (
            <a
                key={link.key}
                href={link.href}
                aria-current={isActive ? 'page' : undefined}
                onClick={mobile ? closeDrawer : undefined}
                style={{
                    alignItems: 'center',
                    backgroundColor: isActive ? theme.accentSoft : 'transparent',
                    borderRadius: 10,
                    color: isActive ? theme.accent : theme.mutedText,
                    display: 'flex',
                    fontSize: 14,
                    fontWeight: 700,
                    margin: mobile ? '2px 0' : '0 2px',
                    minHeight: 38,
                    padding: '8px 16px',
                    textDecoration: 'none',
                    width: mobile ? '100%' : undefined,
                }}
            >
                {link.label}
            </a>
        );
    };

    return (
        <>
            <View
                style={[
                    styles.container,
                    isMobile && styles.mobileContainer,
                    { backgroundColor: theme.navbar, borderBottomColor: theme.lines },
                ]}
            >
                <View style={[styles.brand, isMobile && styles.mobileBrand]}>
                    <Pressable
                        accessibilityRole="link"
                        accessibilityLabel="Open open.mp home"
                        onPress={() => Linking.openURL('https://open.mp/')}
                    >
                        <Image
                            source={{
                                uri: 'https://assets.open.mp/assets/images/assets/logo-dark-trans.png',
                            }}
                            style={{ height: 46, marginRight: 12, width: 46 }}
                            accessibilityLabel="open.mp home"
                        />
                    </Pressable>
                    <View>
                        <Text style={[styles.brandTitle, { color: theme.title }]}>open.mp</Text>
                        <Text style={[styles.brandSubtitle, { color: theme.mutedText }]}>
                            {subtitle}
                        </Text>
                    </View>
                </View>

                {!isMobile && (
                    <View style={styles.pageNav}>
                        {headerLinks.map((link) => renderPageLink(link))}
                    </View>
                )}

                {!drawerVisible && (
                    <View style={[styles.actions, isMobile && styles.mobileActions]}>
                        {!isMobile && (
                            <>
                                <Text style={[styles.modeLabel, { color: theme.mutedText }]}>
                                    {darkMode ? 'Dark' : 'Light'}
                                </Text>
                                <Switch
                                    accessibilityLabel="Toggle dark mode"
                                    trackColor={{ false: theme.lines, true: theme.accent }}
                                    thumbColor="#ffffff"
                                    onValueChange={(value) =>
                                        onThemeModeChange(value ? 'dark' : 'light')
                                    }
                                    value={darkMode}
                                />
                            </>
                        )}
                        {isMobile && (
                            <TouchableOpacity
                                accessibilityLabel="Open navigation menu"
                                accessibilityRole="button"
                                accessibilityState={{ expanded: drawerVisible }}
                                onPress={openDrawer}
                                style={styles.menuButton}
                            >
                                <View accessibilityElementsHidden style={styles.menuIcon}>
                                    <View
                                        style={[styles.menuLine, { backgroundColor: theme.button }]}
                                    />
                                    <View
                                        style={[styles.menuLine, { backgroundColor: theme.button }]}
                                    />
                                    <View
                                        style={[styles.menuLine, { backgroundColor: theme.button }]}
                                    />
                                </View>
                            </TouchableOpacity>
                        )}
                    </View>
                )}
            </View>

            {isMobile && drawerVisible && (
                <div style={drawerLayerStyle}>
                    <div
                        style={{
                            ...drawerBackdropStyle,
                            opacity: drawerOpen ? 1 : 0,
                            pointerEvents: drawerOpen ? 'auto' : 'none',
                        }}
                    >
                        <TouchableOpacity
                            accessibilityLabel="Close navigation menu"
                            accessibilityRole="button"
                            onPress={closeDrawer}
                            style={styles.drawerBackdropTouch}
                        />
                    </div>
                    <div
                        aria-label="Navigation menu"
                        style={{
                            ...drawerPanelStyle,
                            backgroundColor: theme.elementBg,
                            pointerEvents: drawerOpen ? 'auto' : 'none',
                            transform: drawerOpen ? 'translateX(0)' : 'translateX(100%)',
                        }}
                    >
                        <View style={styles.drawerHeader}>
                            <Text style={[styles.drawerTitle, { color: theme.title }]}>Menu</Text>
                            <TouchableOpacity
                                accessibilityLabel="Close navigation menu"
                                accessibilityRole="button"
                                onPress={closeDrawer}
                                style={styles.closeButton}
                            >
                                <Text style={[styles.closeButtonText, { color: theme.mutedText }]}>
                                    ×
                                </Text>
                            </TouchableOpacity>
                        </View>
                        <View style={styles.drawerLinks}>
                            {renderPageLink(headerLinks[0]!, true)}
                            <TouchableOpacity
                                accessibilityRole="button"
                                accessibilityState={{
                                    expanded: libraryExpanded,
                                    selected: activePage === 'library',
                                }}
                                onPress={() => setLibraryExpanded((expanded) => !expanded)}
                                style={[
                                    styles.drawerSectionButton,
                                    activePage === 'library' && {
                                        backgroundColor: theme.accentSoft,
                                    },
                                ]}
                            >
                                <Text
                                    style={[
                                        styles.drawerSectionText,
                                        {
                                            color:
                                                activePage === 'library'
                                                    ? theme.accent
                                                    : theme.mutedText,
                                        },
                                    ]}
                                >
                                    Model Library
                                </Text>
                                <Text style={[styles.chevron, { color: theme.mutedText }]}>
                                    {libraryExpanded ? '▾' : '▸'}
                                </Text>
                            </TouchableOpacity>
                            {libraryExpanded && (
                                <View
                                    style={[styles.categoryTree, { borderLeftColor: theme.lines }]}
                                >
                                    {MODEL_TYPE_OPTIONS.map((item) => {
                                        const isSelected = modelType === item.value;
                                        const href = `/models?cat=${item.value}s&model=${
                                            item.value === 'vehicle' ? 400 : 1
                                        }`;

                                        return onModelTypeChange ? (
                                            <TouchableOpacity
                                                key={item.value}
                                                accessibilityRole="button"
                                                accessibilityState={{ selected: isSelected }}
                                                onPress={() => selectCategory(item.value)}
                                                style={[
                                                    styles.categoryButton,
                                                    isSelected && {
                                                        backgroundColor: theme.accentSoft,
                                                    },
                                                ]}
                                            >
                                                <Text
                                                    style={{
                                                        color: isSelected
                                                            ? theme.accent
                                                            : theme.mutedText,
                                                        fontSize: 14,
                                                        fontWeight: isSelected ? '700' : '500',
                                                    }}
                                                >
                                                    {MODEL_TYPE_LABELS[item.value]}
                                                </Text>
                                            </TouchableOpacity>
                                        ) : (
                                            <a
                                                key={item.value}
                                                href={href}
                                                onClick={closeDrawer}
                                                style={{
                                                    borderRadius: 8,
                                                    color: theme.mutedText,
                                                    display: 'flex',
                                                    minHeight: 38,
                                                    padding: '10px 14px',
                                                    textDecoration: 'none',
                                                    width: '100%',
                                                }}
                                            >
                                                {MODEL_TYPE_LABELS[item.value]}
                                            </a>
                                        );
                                    })}
                                </View>
                            )}
                            {headerLinks.slice(2).map((link) => renderPageLink(link, true))}
                            <View style={styles.drawerThemeRow}>
                                <Text
                                    style={[styles.drawerSectionText, { color: theme.mutedText }]}
                                >
                                    Dark mode
                                </Text>
                                <Switch
                                    accessibilityLabel="Toggle dark mode"
                                    trackColor={{ false: theme.lines, true: theme.accent }}
                                    thumbColor="#ffffff"
                                    onValueChange={(value) =>
                                        onThemeModeChange(value ? 'dark' : 'light')
                                    }
                                    value={darkMode}
                                />
                            </View>
                        </View>
                    </div>
                </div>
            )}
        </>
    );
};

const styles = StyleSheet.create({
    container: {
        alignItems: 'center',
        borderBottomWidth: 1,
        flexDirection: 'row',
        height: 76,
        justifyContent: 'space-between',
        paddingHorizontal: 24,
        width: '100%',
    },
    mobileContainer: {
        height: 68,
        paddingHorizontal: 12,
    },
    brand: {
        alignItems: 'center',
        flexDirection: 'row',
        width: 250,
    },
    mobileBrand: {
        flex: 1,
        minWidth: 0,
        width: undefined,
    },
    logo: {
        height: 46,
        marginRight: 12,
        width: 46,
    },
    brandTitle: {
        fontSize: 17,
        fontWeight: '800',
        letterSpacing: 0.2,
    },
    brandSubtitle: {
        fontSize: 12,
        marginTop: 2,
    },
    pageNav: {
        alignItems: 'center',
        flex: 1,
        flexDirection: 'row',
        justifyContent: 'center',
    },
    actions: {
        alignItems: 'center',
        flexDirection: 'row',
        justifyContent: 'flex-end',
        width: 250,
    },
    mobileActions: {
        width: 'auto',
    },
    modeLabel: {
        fontSize: 12,
        marginRight: 8,
    },
    menuButton: {
        alignItems: 'center',
        height: 42,
        justifyContent: 'center',
        marginLeft: 8,
        width: 42,
    },
    menuIcon: {
        width: 22,
    },
    menuLine: {
        height: 2,
        marginVertical: 3,
        width: '100%',
    },
    drawerBackdropTouch: {
        bottom: 0,
        left: 0,
        position: 'absolute',
        right: 0,
        top: 0,
    },
    drawerHeader: {
        alignItems: 'center',
        flexDirection: 'row',
        justifyContent: 'space-between',
        marginBottom: 24,
    },
    drawerTitle: {
        fontSize: 20,
        fontWeight: '800',
    },
    closeButton: {
        alignItems: 'center',
        height: 38,
        justifyContent: 'center',
        width: 38,
    },
    closeButtonText: {
        fontSize: 28,
        lineHeight: 30,
    },
    drawerLinks: {
        paddingTop: 4,
        width: '100%',
    },
    drawerThemeRow: {
        alignItems: 'center',
        flexDirection: 'row',
        justifyContent: 'space-between',
        marginTop: 20,
        paddingHorizontal: 16,
    },
    drawerSectionButton: {
        alignItems: 'center',
        borderRadius: 10,
        flexDirection: 'row',
        justifyContent: 'space-between',
        minHeight: 42,
        marginBottom: 4,
        paddingHorizontal: 16,
        width: '100%',
    },
    drawerSectionText: {
        fontSize: 14,
        fontWeight: '700',
    },
    chevron: {
        fontSize: 16,
    },
    categoryTree: {
        borderLeftWidth: 2,
        marginLeft: 20,
        marginTop: 4,
        paddingLeft: 8,
        paddingTop: 4,
    },
    categoryButton: {
        borderRadius: 8,
        minHeight: 38,
        marginBottom: 6,
        paddingHorizontal: 14,
        paddingVertical: 10,
        width: '100%',
    },
});

export default React.memo(Header);
