import Document, { Html, Head, Main, NextScript, DocumentContext } from 'next/document';

class MyDocument extends Document {
  static async getInitialProps(ctx: DocumentContext) {
    const initialProps = await Document.getInitialProps(ctx);
    return { ...initialProps };
  }

  render() {
    return (
      <Html>
        <Head>
          <link rel="icon" href="/favicon.png" />
          <link rel="apple-touch-icon" href="/favicon.png" />
          <meta name="theme-color" content="#339989" />
          <title>InkedIn | Find Your Tattoo Artist</title>
          <link rel="preload" href="/fonts/tatFont.ttf" as="font" type="font/ttf" crossOrigin="anonymous" />
          <link rel="preload" href="/fonts/tattoo.ttf" as="font" type="font/ttf" crossOrigin="anonymous" />
          <style dangerouslySetInnerHTML={{
            __html: `
              @font-face {
                font-family: 'Tattoo-Font';
                src: url('/fonts/Tattoo-dKGR.ttf') format('truetype'),
                     url('/fonts/tattoo.ttf') format('truetype');
                font-weight: normal;
                font-style: normal;
                font-display: swap;
              }
            `
          }} />
        </Head>
        <body>
          <Main />
          <NextScript />
        </body>
      </Html>
    );
  }
}

export default MyDocument;