import { Children } from 'react'
import Document, { Html, Head, Main, NextScript } from 'next/document'
import { AppRegistry } from 'react-native'
import config from '../../app.json'

// Force Next-generated DOM elements to fill their parent's height
const normalizeNextElements = `
  #__next {
    display: flex;
    flex-direction: column;
    height: 100%;
  }

  *, *::before, *::after {
    font-family: Inter, sans-serif !important;
  }
`

export default class MyDocument extends Document {
  static async getInitialProps(props) {
    const {
      renderPage,
    } = props;

    AppRegistry.registerComponent(config.name, () => Main)
    const { getStyleElement } = AppRegistry.getApplication(config.name)
    const page = await renderPage()
    const styles = [
      <style dangerouslySetInnerHTML={{ __html: normalizeNextElements }} />,
      getStyleElement(),
    ]
    return { ...page, styles: Children.toArray(styles) }
  }

  render() {
    return (
      <Html style={{ height: '100%' }}>
        <Head>
          <link rel="preconnect" href="https://rsms.me" />
          <link rel="stylesheet" href="https://rsms.me/inter/inter.css" />
        </Head>
        <body style={{ height: '100%', overflow: 'hidden', fontFamily: 'Inter, sans-serif' }}>
          <Main />
          <NextScript />
        </body>
      </Html>
    )
  }
}
