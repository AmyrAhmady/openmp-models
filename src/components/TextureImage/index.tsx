import React from 'react';
import type { CSSProperties } from 'react';

interface Props {
    uri: string;
    alt: string;
    fit?: 'contain' | 'cover';
    style?: CSSProperties;
    onError?: () => void;
}

const TextureImage = ({ uri, alt, fit = 'cover', style, onError }: Props) => (
    <img
        crossOrigin="anonymous"
        src={uri}
        alt={alt}
        draggable={false}
        onError={onError}
        style={{ display: 'block', boxSizing: 'border-box', objectFit: fit, ...style }}
    />
);

export default React.memo(TextureImage);
