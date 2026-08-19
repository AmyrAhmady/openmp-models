import React, { Children } from 'react';
import Document, { Html, Head, Main, NextScript } from 'next/document';
import type { DocumentContext } from 'next/document';
import { AppRegistry } from 'react-native-web';
import config from '../../app.json';

interface AppRegistryStyles {
    getStyleElement(): React.ReactElement | null;
}

const normalizeNextElements = `
  html,
  body {
    height: 100%;
    margin: 0;
    overflow: hidden;
    width: 100%;
  }

  html {
    box-sizing: border-box;
  }

  *, *::before, *::after {
    box-sizing: inherit;
  }

  #__next {
    display: flex;
    flex-direction: column;
    height: 100%;
    min-height: 100%;
    width: 100%;
  }

  *, *::before, *::after {
    font-family: Inter, sans-serif !important;
  }

  button:focus-visible,
  a:focus-visible,
  input:focus-visible,
  [role="button"]:focus-visible,
  [role="link"]:focus-visible,
  [role="switch"]:focus-visible {
    outline: 3px solid #635bff;
    outline-offset: 3px;
  }
`;

export default class MyDocument extends Document {
    static override async getInitialProps(props: DocumentContext) {
        AppRegistry.registerComponent(config.name, () => Main);
        const appRegistry = AppRegistry as typeof AppRegistry & {
            getApplication(name: string): AppRegistryStyles;
        };
        const { getStyleElement } = appRegistry.getApplication(config.name);
        const page = await props.renderPage();
        const styles = [
            <style key="normalize" dangerouslySetInnerHTML={{ __html: normalizeNextElements }} />,
            getStyleElement(),
        ];

        return { ...page, styles: Children.toArray(styles) };
    }

    override render() {
        return (
            <Html style={{ height: '100%' }}>
                <Head>
                    <link rel="icon" href="/favicon.ico" />
                    <link rel="preconnect" href="https://rsms.me" />
                    <link rel="stylesheet" href="https://rsms.me/inter/inter.css" />
                </Head>
                <body
                    style={{
                        height: '100%',
                        margin: 0,
                        overflow: 'hidden',
                        width: '100%',
                        fontFamily: 'Inter, sans-serif',
                    }}
                >
                    <Main />
                    <NextScript />
                </body>
            </Html>
        );
    }
}
