import * as React from 'react'
import Head from 'next/head'
import store from "../state/store"
import Cookies from 'universal-cookie';

function MyApp({ Component, pageProps }) {

  store.dispatch("setCookieHandler", new Cookies());

  return (
    <>
      <Head>
        <meta name="viewport" content="width=device-width, initial-scale=1.0, maximum-scale=1.0" />
      </Head>
      <Component {...pageProps} />
    </>
  )
}

export default MyApp
