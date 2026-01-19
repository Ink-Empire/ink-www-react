import React from 'react';
import Head from 'next/head';
import { Box, Typography, Container, Paper } from '@mui/material';
import Layout from '@/components/Layout';
import ContactForm from '@/components/ContactForm';
import { colors } from '@/styles/colors';

export default function ContactPage() {
  return (
    <Layout>
      <Head>
        <title>Contact Us | InkedIn</title>
        <meta name="description" content="Get in touch with the InkedIn team" />
      </Head>

      <Container maxWidth="md" sx={{ py: { xs: 4, md: 6 } }}>
        <Box sx={{ textAlign: 'center', mb: 4 }}>
          <Typography
            variant="h3"
            sx={{
              fontFamily: '"Cormorant Garamond", Georgia, serif',
              fontWeight: 600,
              color: colors.textPrimary,
              mb: 2,
            }}
          >
            Contact Us
          </Typography>
          <Typography
            sx={{
              color: colors.textSecondary,
              fontSize: '1.1rem',
              maxWidth: 600,
              mx: 'auto',
            }}
          >
            Have a question, feedback, or just want to say hello? We'd love to hear from you.
          </Typography>
        </Box>

        <Paper
          sx={{
            p: { xs: 3, md: 4 },
            bgcolor: colors.surface,
            borderRadius: 2,
          }}
        >
          <ContactForm />
        </Paper>
      </Container>
    </Layout>
  );
}
