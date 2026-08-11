import React from 'react';
import { View } from 'react-native-web';
import type { ColorValue, StyleProp, ViewStyle } from 'react-native-web';

type WebViewStyle = ViewStyle & { boxShadow?: string };

interface Props {
    padding: number;
    color: ColorValue;
    children: React.ReactNode;
    style?: StyleProp<ViewStyle>;
    shadowed?: boolean;
}

const RoundCard = (props: Props) => {
    const { padding, color, style, children, shadowed } = props;
    const shadowStyle: StyleProp<ViewStyle | WebViewStyle> = {
        boxShadow: '0 5px 12px rgba(0, 0, 0, 0.12)',
    };

    return (
        <View
            style={[
                {
                    backgroundColor: color,
                    padding: padding,
                    borderRadius: 14,
                    borderWidth: 1,
                    borderColor: '#ffffff12',
                },
                style,
                shadowed ? shadowStyle : {},
            ]}
        >
            {children}
        </View>
    );
};

export default React.memo(RoundCard);
