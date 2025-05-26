import React from 'react';
import Head from 'next/head';
import Layout from '../components/Layout';
import Inbox from '../components/ArtistInbox';
import { useAuth } from '../contexts/AuthContext';
import { Box, Alert } from '@mui/material';

export default function InboxPage() {
  const { user, isAuthenticated, isLoading } = useAuth();

  if (isLoading) {
    return (
      <Layout>
        <Head>
          <title>Inbox | InkedIn</title>
          <meta name="description" content="Artist appointment requests inbox" />
          <link rel="icon" href="/assets/img/logo.png" />
        </Head>
        <Box sx={{ display: 'flex', justifyContent: 'center', py: 4 }}>
          <div className="loading">Loading...</div>
        </Box>
      </Layout>
    );
  }

  if (!isAuthenticated) {
    return (
      <Layout>
        <Head>
          <title>Inbox | InkedIn</title>
          <meta name="description" content="Artist appointment requests inbox" />
          <link rel="icon" href="/assets/img/logo.png" />
        </Head>
        <Box sx={{ p: 3 }}>
          <Alert severity="warning">
            Please log in to access your inbox.
          </Alert>
        </Box>
      </Layout>
    );
  }

  // TODO: Add user type check when user type is available in the user object
  // For now, all authenticated users can access the inbox
  // In the future, you might want to check if user.type === 'artist'

  return (
    <Layout>
      <Head>
        <title>Inbox | InkedIn</title>
        <meta name="description" content="Artist appointment requests inbox" />
        <link rel="icon" href="/assets/img/logo.png" />
      </Head>

      <div className="min-h-screen bg-[#1A1A1D] text-white">
        <Inbox userId={user?.id} userType={user?.type || 'client'} />
      </div>
    </Layout>
  );
}