import * as React from 'react';
import type { AppProps } from 'next/app';
import Head from 'next/head';
import AppErrorBoundary from 'src/components/AppErrorBoundary';

function MyApp({ Component, pageProps }: AppProps) {
    return (
        <AppErrorBoundary>
            <Head>
                <title>OPEN.MP | Model Library</title>
                <meta
                    name="viewport"
                    content="width=device-width, initial-scale=1.0, maximum-scale=1.0"
                />
            </Head>
            <Component {...pageProps} />
        </AppErrorBoundary>
    );
}

export default MyApp;
