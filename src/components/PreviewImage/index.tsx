import React, { useState } from 'react';
import { Image, View } from 'react-native-web';
import { useTheme } from 'src/theme/ThemeContext';

const FALLBACK_LOGO_URL = 'https://assets.open.mp/assets/images/assets/logo-dark-trans.png';

interface Props {
    uri: string;
    size: number;
    marginRight?: number;
}

const PreviewImage = ({ uri, size, marginRight = 10 }: Props) => {
    const { theme } = useTheme();
    const [failedUri, setFailedUri] = useState<string | null>(null);

    if (failedUri === uri) {
        return (
            <View
                style={{
                    width: size,
                    height: size,
                    borderRadius: 6,
                    marginRight,
                    alignItems: 'center',
                    justifyContent: 'center',
                    backgroundColor: theme.textBox,
                }}
            >
                <Image
                    source={{ uri: FALLBACK_LOGO_URL }}
                    style={{ width: size * 0.7, height: size * 0.7, opacity: 0.5 }}
                />
            </View>
        );
    }

    return (
        <Image
            source={{ uri }}
            resizeMode="contain"
            onError={() => setFailedUri(uri)}
            style={{ width: size, height: size, borderRadius: 6, marginRight }}
        />
    );
};

export default React.memo(PreviewImage);
