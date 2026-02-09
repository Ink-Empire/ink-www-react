import React from 'react';
import Head from 'next/head';
import { Box, Typography, Container, Paper } from '@mui/material';
import Layout from '@/components/Layout';
import { colors } from '@/styles/colors';

export default function TermsOfServicePage() {
  return (
    <Layout>
      <Head>
        <title>Terms of Service | InkedIn</title>
        <meta name="description" content="InkedIn Terms of Service" />
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
          Terms of Service
        </Typography>

        <Paper
          sx={{
            p: { xs: 3, md: 4 },
            bgcolor: colors.surface,
            borderRadius: 2,
          }}
        >
          <Typography variant="body2" sx={{ color: colors.textSecondary, mb: 3 }}>
            Last updated: February 2026
          </Typography>

          <Section title="Acceptance of Terms">
            By accessing or using InkedIn ("the Platform"), you agree to be bound by these Terms of Service.
            If you do not agree to these terms, please do not use the Platform. We reserve the right to
            update these terms at any time, and your continued use of the Platform constitutes acceptance
            of any changes.
          </Section>

          <Section title="Use of Platform">
            InkedIn is a platform connecting tattoo enthusiasts with tattoo artists and studios. You agree to:
            <ul>
              <li>Use the Platform only for lawful purposes</li>
              <li>Provide accurate and truthful information in your profile</li>
              <li>Not impersonate any person or entity</li>
              <li>Not interfere with the proper functioning of the Platform</li>
              <li>Not use automated systems to access the Platform without permission</li>
            </ul>
          </Section>

          <Section title="User Content">
            You retain ownership of content you upload to the Platform. By uploading content, you grant
            InkedIn a non-exclusive, worldwide, royalty-free license to use, display, and distribute your
            content in connection with the Platform. You are responsible for ensuring you have the right
            to share any content you upload.
          </Section>

          <Section title="Artist Services">
            InkedIn facilitates connections between clients and tattoo artists but is not a party to any
            agreements between them. Artists are independent professionals, not employees or agents of
            InkedIn. We do not guarantee the quality, safety, or legality of any tattoo services arranged
            through the Platform.
          </Section>

          <Section title="Intellectual Property">
            The Platform, including its design, features, and content (excluding user-generated content),
            is owned by InkedIn and protected by intellectual property laws. You may not copy, modify,
            or distribute any part of the Platform without our written consent.
          </Section>

          <Section title="Limitation of Liability">
            InkedIn is provided "as is" without warranties of any kind. To the fullest extent permitted
            by law, InkedIn shall not be liable for any indirect, incidental, special, or consequential
            damages arising from your use of the Platform.
          </Section>

          <Section title="Termination">
            We may suspend or terminate your account at any time for violation of these terms or for
            any other reason at our discretion. You may delete your account at any time through your
            account settings.
          </Section>

          <Section title="Changes to Terms">
            We may modify these Terms of Service at any time. We will notify users of significant changes
            via email or a notice on the Platform. Your continued use of the Platform after changes are
            posted constitutes your acceptance of the revised terms.
          </Section>

          <Section title="Contact Information">
            If you have questions about these Terms of Service, please contact us through our contact
            form or email us at info@getinked.in.
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
