import React, { useRef } from 'react';
import { Modal, Pressable, View } from 'react-native-web';
import type { StyleProp, ViewStyle } from 'react-native-web';
import { useModalEscape } from 'src/hooks/useModalEscape';
import { useModalFocus } from 'src/hooks/useModalFocus';

interface Props {
    visible: boolean;
    onRequestClose: () => void;
    accessibilityLabel: string;
    children: React.ReactNode;
    animationType?: 'none' | 'slide' | 'fade';
    contentStyle?: StyleProp<ViewStyle>;
    fullScreenContent?: boolean;
    initialFocusSelector?: string;
    placement?: 'center' | 'bottom';
}

const MobileModal = ({
    visible,
    onRequestClose,
    accessibilityLabel,
    children,
    animationType = 'fade',
    contentStyle,
    fullScreenContent = false,
    initialFocusSelector,
    placement = 'center',
}: Props) => {
    const modalRef = useRef<HTMLDivElement | null>(null);
    useModalEscape(visible, onRequestClose);
    useModalFocus(visible, modalRef, initialFocusSelector);

    return (
        <Modal
            visible={visible}
            animationType={animationType}
            transparent
            onRequestClose={onRequestClose}
            onDismiss={onRequestClose}
        >
            <View
                ref={(node) => {
                    modalRef.current = node instanceof HTMLElement ? node : null;
                }}
                accessibilityLabel={accessibilityLabel}
                style={[
                    styles.overlay,
                    placement === 'bottom' && styles.bottomOverlay,
                    fullScreenContent && styles.fullScreenOverlay,
                ]}
            >
                <Pressable
                    {...({ tabIndex: -1 } as const)}
                    accessibilityLabel={`Close ${accessibilityLabel}`}
                    style={styles.backdrop}
                    onPress={onRequestClose}
                />
                <View
                    {...({ role: 'dialog', 'aria-modal': true } as const)}
                    accessibilityViewIsModal
                    style={[
                        styles.content,
                        fullScreenContent && styles.fullScreenContent,
                        contentStyle,
                    ]}
                >
                    {children}
                </View>
            </View>
        </Modal>
    );
};

const styles = {
    overlay: {
        alignItems: 'center',
        flex: 1,
        height: '100%',
        justifyContent: 'center',
        minHeight: 0,
        minWidth: 0,
        padding: 12,
        width: '100%',
    } as ViewStyle,
    backdrop: {
        backgroundColor: 'rgba(100, 100, 100, 0.7)',
        bottom: 0,
        left: 0,
        position: 'absolute',
        right: 0,
        top: 0,
        zIndex: 100,
    } as ViewStyle,
    fullScreenOverlay: {
        padding: 0,
    } as ViewStyle,
    bottomOverlay: {
        justifyContent: 'flex-end',
    } as ViewStyle,
    content: {
        position: 'relative',
        zIndex: 101,
    } as ViewStyle,
    fullScreenContent: {
        alignSelf: 'stretch',
        flex: 1,
        minHeight: 0,
        minWidth: 0,
        width: '100%',
    } as ViewStyle,
};

export default React.memo(MobileModal);
