import dynamic from 'next/dynamic';
import Head from 'next/head';
import { CircularProgress, Box } from '@mui/material';

// Dynamically import React Admin with SSR disabled
// React Admin uses browser-only APIs and doesn't support server-side rendering
const AdminApp = dynamic(() => import('@/admin/App'), {
  ssr: false,
  loading: () => (
    <Box
      sx={{
        display: 'flex',
        justifyContent: 'center',
        alignItems: 'center',
        height: '100vh',
        backgroundColor: '#fafafb',
      }}
    >
      <CircularProgress />
    </Box>
  ),
});

const AdminPage = () => {
  return (
    <>
      <Head>
        <title>InkedIn Admin</title>
        <meta name="robots" content="noindex, nofollow" />
      </Head>
        <Box sx={{ overflowX: 'auto', minWidth: '100vw' }}>
            <AdminApp />
        </Box>
    </>
  );
};

export default AdminPage;
