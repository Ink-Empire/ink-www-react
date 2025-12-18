import React from "react";
import Head from "next/head";
import Layout from "../components/Layout";
import LandingPage from "../components/LandingPage";

export default function Home() {
  return (
    <Layout>
      <Head>
        <title>InkedIn | Find Your Perfect Tattoo Artist</title>
        <meta
          name="description"
          content="Connect with world-class tattoo artists. Browse portfolios, book consultations, and collaborate on custom designs."
        />
        <link rel="icon" href="/assets/img/logo.png" />
        <link
          rel="preload"
          href="/fonts/tattoo.ttf"
          as="font"
          type="font/ttf"
          crossOrigin="anonymous"
        />
      </Head>
      <LandingPage />
    </Layout>
  );
}
