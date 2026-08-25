import React from 'react';
import { Image, StyleSheet, Text, TouchableOpacity, View } from 'react-native-web';
import Header from 'src/components/Header';
import { useResponsiveView } from 'src/hooks/useResponsiveView';
import type { ThemeMode } from 'src/theme/themeTokens';
import { useTheme } from 'src/theme/ThemeContext';

interface Props {
    themeMode: ThemeMode;
    onThemeModeChange: (mode: ThemeMode) => void;
}

interface FeatureCardProps {
    accent: string;
    available: boolean;
    description: string;
    icon: string;
    id: string;
    items: string[];
    title: string;
    visual: 'library' | 'world' | 'editor';
}

const modelLibraryHref = '/models?cat=vehicles&model=400';

function FeatureVisual({ visual, accent }: Pick<FeatureCardProps, 'visual' | 'accent'>) {
    const source = {
        library: '/landing/model-library.png',
        world: '/landing/world-explorer.png',
        editor: '/landing/map-editor.png',
    }[visual];

    return (
        <View style={[styles.featureVisual, { backgroundColor: `${accent}12` }]}>
            <Image
                accessibilityLabel={`${visual} preview`}
                resizeMode="cover"
                source={{ uri: source }}
                style={styles.featureImage}
            />
        </View>
    );
}

function FeatureCard({
    accent,
    available,
    description,
    icon,
    id,
    items,
    title,
    visual,
}: FeatureCardProps) {
    const { theme } = useTheme();

    return (
        <View
            nativeID={id}
            style={[
                styles.featureCard,
                { backgroundColor: theme.elementBg, borderColor: theme.lines },
            ]}
        >
            <View style={styles.featureHeader}>
                <View style={[styles.featureIcon, { backgroundColor: `${accent}12` }]}>
                    <Text style={[styles.featureIconText, { color: accent }]}>{icon}</Text>
                </View>
                <View style={styles.featureHeading}>
                    <Text style={[styles.featureTitle, { color: theme.title }]}>{title}</Text>
                    <Text style={[styles.featureDescription, { color: theme.mutedText }]}>
                        {description}
                    </Text>
                </View>
                <View
                    style={[
                        styles.statusBadge,
                        { backgroundColor: available ? `${accent}12` : theme.textBox },
                    ]}
                >
                    <Text
                        style={[styles.statusText, { color: available ? accent : theme.mutedText }]}
                    >
                        {available ? 'Available' : 'Planned'}
                    </Text>
                </View>
            </View>
            <FeatureVisual visual={visual} accent={accent} />
            <View style={styles.featureFooter}>
                <View style={styles.featureItems}>
                    {items.map((item) => (
                        <Text key={item} style={[styles.featureItem, { color: theme.mutedText }]}>
                            {item}
                        </Text>
                    ))}
                </View>
                <Text style={[styles.featureArrow, { color: accent }]} aria-hidden>
                    →
                </Text>
            </View>
        </View>
    );
}

const LandingPage = ({ themeMode, onThemeModeChange }: Props) => {
    const { theme } = useTheme();
    const isMobileView = useResponsiveView();
    return (
        <div
            style={{
                backgroundColor: theme.mainBg,
                display: 'flex',
                flex: 1,
                flexDirection: 'column',
                minHeight: 0,
                overflowX: 'hidden',
                overflowY: 'auto',
            }}
        >
            <Header
                activePage="home"
                isMobile={isMobileView}
                onThemeModeChange={onThemeModeChange}
                subtitle="Open Multiplayer toolkit"
                themeMode={themeMode}
            />

            <View nativeID="top" style={[styles.content, isMobileView && styles.mobileContent]}>
                <View style={[styles.hero, isMobileView && styles.mobileHero]}>
                    <View style={styles.heroCopy}>
                        <Text style={[styles.eyebrow, { color: theme.accent }]}>
                            OPEN MULTIPLAYER TOOLKIT
                        </Text>
                        <Text
                            style={[
                                styles.heroTitle,
                                isMobileView && styles.mobileHeroTitle,
                                { color: theme.title },
                            ]}
                        >
                            Build, inspect,{'\n'}and explore open.mp worlds
                        </Text>
                        <Text style={[styles.heroDescription, { color: theme.mutedText }]}>
                            A focused toolkit for developers to browse models, inspect game assets,
                            and shape the next generation of Open Multiplayer experiences.
                        </Text>
                        <View
                            style={[styles.heroActions, isMobileView && styles.mobileHeroActions]}
                        >
                            <a
                                href={modelLibraryHref}
                                style={{
                                    alignItems: 'center',
                                    backgroundColor: theme.accent,
                                    borderRadius: 9,
                                    color: '#ffffff',
                                    display: 'flex',
                                    fontSize: 15,
                                    fontWeight: 800,
                                    marginBottom: isMobileView ? 10 : 0,
                                    marginRight: isMobileView ? 0 : 10,
                                    padding: '14px 20px',
                                    textDecoration: 'none',
                                }}
                            >
                                <Text style={styles.actionIcon}>◇</Text>
                                Open Model Library
                            </a>
                            <a
                                href="#world-explorer"
                                style={{
                                    alignItems: 'center',
                                    borderColor: theme.accent,
                                    borderRadius: 9,
                                    borderStyle: 'solid',
                                    borderWidth: 1,
                                    color: theme.accent,
                                    display: 'flex',
                                    fontSize: 15,
                                    fontWeight: 800,
                                    padding: '13px 20px',
                                    textDecoration: 'none',
                                }}
                            >
                                <Text style={styles.actionIcon}>◎</Text>
                                Explore the World
                            </a>
                        </View>
                    </View>
                    {!isMobileView && (
                        <View style={[styles.heroVisual, { backgroundColor: `${theme.accent}0c` }]}>
                            <Image
                                accessibilityLabel="Open-world city preview"
                                resizeMode="cover"
                                source={{ uri: '/landing/hero-world.png' }}
                                style={styles.heroImage}
                            />
                            <Text style={[styles.heroVisualLabel, { color: theme.accent }]}>
                                WORLD EXPLORER / PLANNED
                            </Text>
                        </View>
                    )}
                </View>

                <View style={[styles.featureGrid, isMobileView && styles.mobileFeatureGrid]}>
                    <FeatureCard
                        id="model-library"
                        accent={theme.accent}
                        available
                        icon="◇"
                        title="Model Library"
                        description="Browse and inspect 3D assets from the Open Multiplayer ecosystem."
                        items={['Vehicles', 'Skins', 'Objects', 'Animations']}
                        visual="library"
                    />
                    <FeatureCard
                        id="world-explorer"
                        accent="#3d78d8"
                        available={false}
                        icon="◎"
                        title="World Explorer"
                        description="Explore world data through an interactive map and detailed references."
                        items={['World regions', 'Interiors', 'Object data']}
                        visual="world"
                    />
                    <FeatureCard
                        id="map-editor"
                        accent="#8b5cf6"
                        available={false}
                        icon="✎"
                        title="Map Editor"
                        description="Create, edit, and optimize maps with real-time 3D tools."
                        items={['Scene editing', 'Object transforms', 'Map exports']}
                        visual="editor"
                    />
                </View>

                <View
                    style={[
                        styles.toolsPanel,
                        isMobileView && styles.mobileToolsPanel,
                        { backgroundColor: theme.elementBg, borderColor: theme.lines },
                    ]}
                >
                    <View style={[styles.toolsIntro, isMobileView && styles.mobileToolsIntro]}>
                        <Text style={[styles.toolsTitle, { color: theme.title }]}>
                            Developer tools
                        </Text>
                        <Text style={[styles.toolsDescription, { color: theme.mutedText }]}>
                            Useful building blocks for Open Multiplayer development.
                        </Text>
                    </View>
                    <View style={styles.toolsList}>
                        {[
                            ['Vehicles', true],
                            ['Skins', true],
                            ['Objects', true],
                            ['Animations', true],
                            ['Shareable URLs', true],
                            ['Map exports', false],
                        ].map(([label, available]) => (
                            <View
                                key={label as string}
                                style={[
                                    styles.toolChip,
                                    { backgroundColor: theme.textBox, borderColor: theme.lines },
                                ]}
                            >
                                <View
                                    style={[
                                        styles.toolDot,
                                        { backgroundColor: available ? theme.accent : theme.lines },
                                    ]}
                                />
                                <Text style={[styles.toolLabel, { color: theme.title }]}>
                                    {label as string}
                                </Text>
                                {!available && (
                                    <Text style={[styles.toolStatus, { color: theme.mutedText }]}>
                                        Planned
                                    </Text>
                                )}
                            </View>
                        ))}
                    </View>
                </View>

                <View style={styles.footer}>
                    <Text style={[styles.footerText, { color: theme.mutedText }]}>
                        open.mp · Open Multiplayer developer toolkit
                    </Text>
                    <TouchableOpacity
                        accessibilityRole="link"
                        accessibilityLabel="Open open.mp website"
                        onPress={() =>
                            window.open('https://open.mp/', '_blank', 'noopener,noreferrer')
                        }
                    >
                        <Text style={[styles.footerLink, { color: theme.accent }]}>open.mp</Text>
                    </TouchableOpacity>
                </View>
            </View>
        </div>
    );
};

const styles = StyleSheet.create({
    content: {
        alignSelf: 'center',
        maxWidth: 1320,
        paddingBottom: 28,
        paddingHorizontal: 32,
        width: '100%',
    },
    mobileContent: {
        paddingHorizontal: 16,
    },
    hero: {
        alignItems: 'center',
        flexDirection: 'row',
        minHeight: 360,
        paddingHorizontal: 18,
        paddingVertical: 44,
    },
    mobileHero: {
        minHeight: 0,
        paddingHorizontal: 8,
        paddingVertical: 34,
    },
    heroCopy: {
        flex: 1,
        maxWidth: 700,
        zIndex: 1,
    },
    eyebrow: {
        fontSize: 11,
        fontWeight: '800',
        letterSpacing: 1.8,
        marginBottom: 14,
    },
    heroTitle: {
        fontSize: 54,
        fontWeight: '800',
        letterSpacing: -2,
        lineHeight: 61,
    },
    mobileHeroTitle: {
        fontSize: 38,
        lineHeight: 44,
    },
    heroDescription: {
        fontSize: 17,
        lineHeight: 27,
        marginTop: 18,
        maxWidth: 590,
    },
    heroActions: {
        alignItems: 'center',
        flexDirection: 'row',
        marginTop: 26,
    },
    mobileHeroActions: {
        alignItems: 'stretch',
        flexDirection: 'column',
    },
    actionIcon: {
        fontSize: 21,
        marginRight: 9,
    },
    heroVisual: {
        borderRadius: 24,
        height: 300,
        marginLeft: -90,
        overflow: 'hidden',
        position: 'relative',
        width: 620,
    },
    heroImage: {
        height: '100%',
        width: '100%',
    },
    heroVisualLabel: {
        bottom: 22,
        fontSize: 10,
        fontWeight: '800',
        letterSpacing: 1.2,
        position: 'absolute',
        right: 24,
    },
    featureGrid: {
        flexDirection: 'row',
    },
    mobileFeatureGrid: {
        flexDirection: 'column',
    },
    featureCard: {
        borderRadius: 16,
        borderWidth: 1,
        flex: 1,
        minWidth: 0,
        marginBottom: 16,
        marginRight: 16,
        overflow: 'hidden',
        padding: 16,
        shadowColor: '#172033',
        shadowOffset: { width: 0, height: 6 },
        shadowOpacity: 0.06,
        shadowRadius: 14,
    },
    featureHeader: {
        alignItems: 'flex-start',
        flexDirection: 'row',
        minHeight: 86,
    },
    featureIcon: {
        alignItems: 'center',
        borderRadius: 11,
        height: 42,
        justifyContent: 'center',
        width: 42,
    },
    featureIconText: {
        fontSize: 25,
        fontWeight: '800',
    },
    featureHeading: {
        flex: 1,
        marginLeft: 12,
        minWidth: 0,
    },
    featureTitle: {
        fontSize: 20,
        fontWeight: '800',
    },
    featureDescription: {
        fontSize: 13,
        lineHeight: 19,
        marginTop: 5,
    },
    statusBadge: {
        borderRadius: 8,
        paddingHorizontal: 8,
        paddingVertical: 6,
    },
    statusText: {
        fontSize: 10,
        fontWeight: '800',
    },
    featureVisual: {
        borderRadius: 11,
        height: 175,
        overflow: 'hidden',
        width: '100%',
    },
    featureImage: {
        height: '100%',
        width: '100%',
    },
    featureFooter: {
        alignItems: 'center',
        flexDirection: 'row',
        justifyContent: 'space-between',
        marginTop: 14,
        minHeight: 24,
    },
    featureItems: {
        flexDirection: 'row',
        flexWrap: 'wrap',
    },
    featureItem: {
        fontSize: 11,
        marginRight: 6,
    },
    featureArrow: {
        fontSize: 24,
        fontWeight: '400',
        marginLeft: 8,
    },
    toolsPanel: {
        alignItems: 'center',
        borderRadius: 16,
        borderWidth: 1,
        flexDirection: 'row',
        marginTop: 18,
        paddingHorizontal: 24,
        paddingVertical: 18,
        shadowColor: '#172033',
        shadowOffset: { width: 0, height: 5 },
        shadowOpacity: 0.05,
        shadowRadius: 12,
    },
    mobileToolsPanel: {
        alignItems: 'stretch',
        flexDirection: 'column',
    },
    toolsIntro: {
        minWidth: 210,
    },
    mobileToolsIntro: {
        minWidth: 0,
    },
    toolsTitle: {
        fontSize: 18,
        fontWeight: '800',
    },
    toolsDescription: {
        fontSize: 12,
        lineHeight: 18,
        marginTop: 4,
    },
    toolsList: {
        flex: 1,
        flexDirection: 'row',
        flexWrap: 'wrap',
        justifyContent: 'flex-end',
    },
    toolChip: {
        alignItems: 'center',
        borderRadius: 9,
        borderWidth: 1,
        flexDirection: 'row',
        margin: 4,
        paddingHorizontal: 11,
        paddingVertical: 9,
    },
    toolDot: {
        borderRadius: 5,
        height: 8,
        marginRight: 7,
        width: 8,
    },
    toolLabel: {
        fontSize: 12,
        fontWeight: '700',
    },
    toolStatus: {
        fontSize: 10,
        marginLeft: 6,
    },
    footer: {
        alignItems: 'center',
        flexDirection: 'row',
        justifyContent: 'space-between',
        paddingHorizontal: 4,
        paddingTop: 22,
    },
    footerText: {
        fontSize: 11,
    },
    footerLink: {
        fontSize: 11,
        fontWeight: '800',
    },
});

export default React.memo(LandingPage);
