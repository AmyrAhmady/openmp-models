declare module 'react-native-web' {
    import type * as React from 'react';
    import type {
        ActivityIndicatorProps,
        FlatListProps,
        ImageProps,
        ModalProps,
        PressableProps,
        ScrollViewProps,
        SwitchProps,
        TextInputProps,
        TextProps,
        TouchableOpacityProps,
        ViewProps,
    } from 'react-native';

    type WebComponentProps<Props, Ref = unknown> = Omit<Props, 'children'> & {
        children?: React.ReactNode;
        ref?: React.Ref<Ref>;
    };

    export * from 'react-native';

    export const ActivityIndicator: React.ComponentType<WebComponentProps<ActivityIndicatorProps>>;
    export const FlatList: <ItemT = unknown>(
        props: WebComponentProps<FlatListProps<ItemT>>
    ) => React.ReactElement | null;
    export const Image: React.ComponentType<WebComponentProps<ImageProps>>;
    export const Modal: React.ComponentType<WebComponentProps<ModalProps>>;
    export const Pressable: React.ComponentType<WebComponentProps<PressableProps>>;
    export const ScrollView: React.ComponentType<WebComponentProps<ScrollViewProps>>;
    export const Switch: React.ComponentType<WebComponentProps<SwitchProps>>;
    export const Text: React.ComponentType<WebComponentProps<TextProps>>;
    export const TextInput: React.ComponentType<WebComponentProps<TextInputProps>>;
    export const TouchableOpacity: React.ComponentType<WebComponentProps<TouchableOpacityProps>>;
    export const View: React.ComponentType<WebComponentProps<ViewProps, HTMLDivElement>>;
}
