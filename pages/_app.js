import "@/styles/globals.css"

import { ThemeProvider } from "@/components/layouts/ThemeProvider"
import { CookiesProvider } from "react-cookie"
import Head from "next/head"
import { Geist } from 'next/font/google'
import { ToastContainer } from "react-toastify"
import { useCronitor } from '@cronitorio/cronitor-rum-nextjs'
import AppLayout from "@/components/layouts/app-layout"
import { SidebarProvider } from "@/components/ui/sidebar"

const roboto = Geist({
  weight: '400',
  subsets: ['latin'],
})

export default function App({ Component, pageProps }) {
  useCronitor('3f97b0a02f683b7af499e046f0495786')

  return (
    <>
      <Head>
        <link rel="icon" href="/favicon.ico" sizes="any" />
        <title>CaBocil</title>

        <meta charSet="utf-8" />
        <meta name="viewport" content="initial-scale=1.0, width=device-width" />
        <meta name="description" content="Aplikasi untuk anak" />

        <meta itemProp="name" content="CaBocil" />
        <meta itemProp="description" content="Aplikasi untuk anak" />
        <meta itemProp="image" content="https://cabocil.com/icons/cabocil-logo-clear.png" />

        <meta name="og:url" content="https://cabocil.com/" />
        <meta name="og:type" content="website" />
        <meta name="og:title" content="CaBocil" />
        <meta name="og:description" content="Aplikasi untuk anak" />
        <meta name="og:image" content="https://cabocil.com/icons/cabocil-logo-clear.png" />

        <meta name="twitter:card" content="summary_large_image" />
        <meta name="twitter:title" content="CaBocil" />
        <meta name="twitter:description" content="Aplikasi untuk anak" />
        <meta name="twitter:image" content="https://cabocil.com/icons/cabocil-logo-clear.png" />

        <script async src="https://pagead2.googlesyndication.com/pagead/js/adsbygoogle.js?client=ca-pub-6813236705463574" crossorigin="anonymous" />
      </Head>

      <CookiesProvider defaultSetOptions={{ path: '/' }} />

      <ToastContainer />

      <ThemeProvider
        attribute="class"
        defaultTheme="light"
      >
        <SidebarProvider
          className={roboto.className}
          defaultOpen={false}
        >
          <AppLayout>
            <Component {...pageProps} />
          </AppLayout>
        </SidebarProvider>
      </ThemeProvider>
    </>
  )
}
