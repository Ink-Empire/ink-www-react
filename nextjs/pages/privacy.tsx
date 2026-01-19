import React from 'react';
import Head from 'next/head';
import { Box, Typography, Container, Paper } from '@mui/material';
import Layout from '@/components/Layout';
import { colors } from '@/styles/colors';

export default function PrivacyPage() {
  return (
    <Layout>
      <Head>
        <title>Privacy Policy | InkedIn</title>
        <meta name="description" content="InkedIn Privacy Policy" />
      </Head>

      <Container maxWidth="md" sx={{ py: { xs: 4, md: 6 } }}>
        <Typography
          variant="h3"
          sx={{
            fontFamily: '"Cormorant Garamond", Georgia, serif',
            fontWeight: 600,
            color: colors.textPrimary,
            mb: 4,
            textAlign: 'center',
          }}
        >
          Privacy Policy
        </Typography>

        <Paper
          sx={{
            p: { xs: 3, md: 4 },
            bgcolor: colors.surface,
            borderRadius: 2,
          }}
        >
          <Typography variant="body2" sx={{ color: colors.textSecondary, mb: 3 }}>
            Last updated: January 2025
          </Typography>

          <Section title="Introduction">
            InkedIn ("we", "our", or "us") is committed to protecting your privacy. This Privacy Policy
            explains how we collect, use, and safeguard your information when you use our platform.
          </Section>

          <Section title="Information We Collect">
            We collect information you provide directly to us, including:
            <ul>
              <li>Account information (name, email, password)</li>
              <li>Profile information (location, style preferences)</li>
              <li>Content you upload or share</li>
              <li>Communications with us or other users</li>
            </ul>
          </Section>

          <Section title="How We Use Your Information">
            We use the information we collect to:
            <ul>
              <li>Provide, maintain, and improve our services</li>
              <li>Connect you with tattoo artists</li>
              <li>Send you updates and marketing communications (with your consent)</li>
              <li>Respond to your comments and questions</li>
              <li>Protect against fraud and abuse</li>
            </ul>
          </Section>

          <Section title="Information Sharing">
            We do not sell your personal information. We may share your information with:
            <ul>
              <li>Tattoo artists when you initiate contact or book appointments</li>
              <li>Service providers who assist in our operations</li>
              <li>Law enforcement when required by law</li>
            </ul>
          </Section>

          <Section title="Your Choices">
            You can:
            <ul>
              <li>Update or delete your account information at any time</li>
              <li>Opt out of marketing communications</li>
              <li>Request a copy of your data</li>
            </ul>
          </Section>

          <Section title="Contact Us">
            If you have questions about this Privacy Policy, please contact us through our contact form
            or email us at info@getinked.in.
          </Section>
        </Paper>
      </Container>
    </Layout>
  );
}

function Section({ title, children }: { title: string; children: React.ReactNode }) {
  return (
    <Box sx={{ mb: 4 }}>
      <Typography
        variant="h6"
        sx={{
          color: colors.textPrimary,
          fontWeight: 600,
          mb: 1.5,
        }}
      >
        {title}
      </Typography>
      <Typography
        component="div"
        sx={{
          color: colors.textSecondary,
          lineHeight: 1.7,
          '& ul': {
            mt: 1,
            pl: 3,
          },
          '& li': {
            mb: 0.5,
          },
        }}
      >
        {children}
      </Typography>
    </Box>
  );
}
