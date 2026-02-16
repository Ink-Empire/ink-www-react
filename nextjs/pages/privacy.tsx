import React from 'react';
import Head from 'next/head';
import { Box, Typography } from '@mui/material';

const gold = '#c9a84c';
const goldDim = 'rgba(201, 168, 76, 0.35)';
const bg = '#1a1816';
const bgDeep = '#0e0d0b';
const text = '#c8c3b8';
const textLight = '#a09a90';
const textHeading = '#f5f0e8';
const border = 'rgba(201, 168, 76, 0.15)';
const borderFaint = 'rgba(201, 168, 76, 0.06)';

function Section({ number, title, children }: { number: string; title: string; children: React.ReactNode }) {
  return (
    <Box sx={{ mb: '48px' }}>
      <Typography sx={{
        fontFamily: '"Cormorant Garamond", Georgia, serif',
        fontSize: '14px',
        fontWeight: 400,
        color: gold,
        letterSpacing: '0.1em',
        mb: '6px',
      }}>
        {number}
      </Typography>
      <Typography component="h2" sx={{
        fontFamily: '"Cormorant Garamond", Georgia, serif',
        fontSize: { xs: '24px', md: '28px' },
        fontWeight: 400,
        color: textHeading,
        mb: '16px',
        letterSpacing: '-0.01em',
      }}>
        {title}
      </Typography>
      <Box sx={{
        '& p': {
          mb: '14px',
          color: text,
          fontFamily: '"DM Sans", sans-serif',
          fontWeight: 300,
          fontSize: '16px',
          lineHeight: 1.75,
        },
        '& p:last-child': { mb: 0 },
      }}>
        {children}
      </Box>
    </Box>
  );
}

export default function PrivacyPage() {
  return (
    <>
      <Head>
        <title>Privacy Policy | InkedIn</title>
        <meta name="description" content="InkedIn Privacy Policy - how we collect, use, and protect your personal information." />
        <link
          href="https://fonts.googleapis.com/css2?family=Cormorant+Garamond:ital,wght@0,300;0,400;0,500;0,600;1,400&family=DM+Sans:wght@300;400;500&display=swap"
          rel="stylesheet"
        />
      </Head>

      <Box sx={{
        bgcolor: bgDeep,
        color: text,
        fontFamily: '"DM Sans", sans-serif',
        fontWeight: 300,
        fontSize: '16px',
        lineHeight: 1.75,
        minHeight: '100vh',
      }}>
        {/* Header */}
        <Box sx={{
          textAlign: 'center',
          pt: { xs: '48px', md: '80px' },
          pb: '48px',
          px: '24px',
          borderBottom: `1px solid ${border}`,
        }}>
          <Box
            component="img"
            src="/assets/images/inkedin-logo.png"
            alt="InkedIn"
            sx={{
              width: { xs: '200px', md: '260px' },
              height: 'auto',
              mb: '24px',
            }}
          />
          <Typography component="h1" sx={{
            fontFamily: '"Cormorant Garamond", Georgia, serif',
            fontSize: { xs: '36px', md: '48px' },
            fontWeight: 300,
            color: textHeading,
            letterSpacing: '-0.01em',
            mb: '12px',
          }}>
            Privacy Policy
          </Typography>
          <Typography sx={{
            fontSize: '14px',
            color: textLight,
            letterSpacing: '0.02em',
          }}>
            Effective Date: February 17, 2026
          </Typography>
        </Box>

        {/* Content */}
        <Box sx={{
          maxWidth: '740px',
          mx: 'auto',
          px: { xs: '20px', md: '24px' },
          pt: { xs: '40px', md: '60px' },
          pb: { xs: '80px', md: '120px' },
        }}>
          {/* Intro */}
          <Typography sx={{
            fontSize: '17px',
            color: text,
            mb: '48px',
            lineHeight: 1.8,
            fontFamily: '"DM Sans", sans-serif',
            fontWeight: 300,
            '& a': { color: gold, textDecoration: 'none', '&:hover': { textDecoration: 'underline' } },
          }}>
            InkedIn is operated by Ink Empire, a company registered in New Zealand. This policy explains what
            personal information we collect, how we use it, and your rights. By using InkedIn (the
            &ldquo;Platform&rdquo;), including our website at{' '}
            <a href="https://getinked.in">getinked.in</a> and our mobile application, you agree to the
            practices described below. We are committed to protecting your privacy in accordance with the
            New Zealand Privacy Act 2020.
          </Typography>

          {/* Section 1 */}
          <Section number="01" title="Information We Collect">
            <p>We collect information you provide directly, information generated through your use of the Platform, and limited information from third-party services.</p>
            <Box component="table" sx={{
              width: '100%',
              borderCollapse: 'collapse',
              my: '20px',
              '& th': {
                textAlign: 'left',
                fontFamily: '"DM Sans", sans-serif',
                fontSize: '12px',
                fontWeight: 500,
                letterSpacing: '0.12em',
                textTransform: 'uppercase',
                color: gold,
                p: '12px 16px',
                borderBottom: `1px solid ${border}`,
              },
              '& td': {
                p: '14px 16px',
                borderBottom: `1px solid ${borderFaint}`,
                fontSize: '15px',
                color: text,
                verticalAlign: 'top',
              },
              '& tr:last-child td': { borderBottom: 'none' },
              '& td:first-of-type': {
                color: textHeading,
                fontWeight: 400,
                whiteSpace: { xs: 'normal', md: 'nowrap' },
                width: '35%',
              },
            }}>
              <thead>
                <tr><th>Data Type</th><th>Details</th></tr>
              </thead>
              <tbody>
                <tr><td>Account Information</td><td>Name, email address, password (encrypted), profile details, and account preferences.</td></tr>
                <tr><td>Location Data</td><td>Approximate location based on IP address or, with your permission, precise location to help you find nearby tattoo artists and shops.</td></tr>
                <tr><td>Portfolio &amp; Images</td><td>Photos, tattoo designs, and portfolio images you upload to the Platform.</td></tr>
                <tr><td>Messages</td><td>Content of messages exchanged between users through the Platform&apos;s messaging feature.</td></tr>
                <tr><td>Usage Data</td><td>Search queries, pages visited, features used, device information, and interaction patterns.</td></tr>
              </tbody>
            </Box>
          </Section>

          {/* Section 2 */}
          <Section number="02" title="How We Use Your Information">
            <p>We use the information we collect to operate and improve the Platform, connect tattoo enthusiasts with artists, personalise your experience, and communicate with you about your account and our services.</p>
            <p>Specifically, we use your information to facilitate artist discovery and search, enable messaging and collaboration between users, send transactional notifications such as booking confirmations and messages, analyse usage patterns to improve Platform features and performance, and ensure the security and integrity of the Platform.</p>
            <p>We do not sell your personal information to third parties. We do not use your data for automated decision-making or profiling that produces legal effects.</p>
          </Section>

          {/* Section 3 */}
          <Section number="03" title="Third-Party Services">
            <p>We use a limited number of trusted third-party services to operate the Platform. These providers only process data as necessary to deliver their specific function.</p>
            <Box sx={{ my: '16px' }}>
              {[
                { name: 'Firebase', purpose: "Push notifications and analytics. Firebase may collect device identifiers and app usage data. Governed by Google's privacy policy." },
                { name: 'Elastic Cloud', purpose: 'Powers search functionality. Processes artist profiles, portfolio metadata, and search queries to deliver relevant results.' },
                { name: 'Resend', purpose: 'Transactional email delivery. Processes email addresses to send account-related communications such as verification and notifications.' },
              ].map((service, i) => (
                <Box key={i} sx={{
                  display: 'flex',
                  gap: '12px',
                  py: '12px',
                  borderBottom: i < 2 ? `1px solid ${borderFaint}` : 'none',
                }}>
                  <Typography sx={{ color: textHeading, fontWeight: 400, minWidth: '140px', fontSize: '16px' }}>
                    {service.name}
                  </Typography>
                  <Typography sx={{ color: textLight, fontSize: '16px', lineHeight: 1.75 }}>
                    {service.purpose}
                  </Typography>
                </Box>
              ))}
            </Box>
          </Section>

          {/* Section 4 */}
          <Section number="04" title="Data Storage & Security">
            <p>Your data is stored on secure servers hosted in the United States. We implement industry-standard security measures including encrypted connections (TLS/SSL), encrypted password storage, and access controls to protect your information.</p>
            <p>While we take reasonable steps to protect your data, no method of electronic storage or transmission is 100% secure. We encourage you to use a strong, unique password for your InkedIn account.</p>
          </Section>

          {/* Section 5 */}
          <Section number="05" title="Data Retention">
            <p>We retain your personal information for as long as your account is active or as needed to provide you with our services. If you delete your account, we will remove your personal data within 30 days, except where we are required to retain it by law or for legitimate business purposes such as resolving disputes or enforcing our agreements.</p>
            <p>Portfolio images and messages associated with deleted accounts will be removed or anonymised.</p>
          </Section>

          {/* Section 6 */}
          <Section number="06" title="Your Rights">
            <p>Under the New Zealand Privacy Act 2020, you have the following rights regarding your personal information:</p>
            <Box sx={{
              display: 'grid',
              gridTemplateColumns: { xs: '1fr', sm: '1fr 1fr' },
              gap: '12px',
              my: '16px',
            }}>
              {[
                { right: 'Access', desc: 'Request a copy of the personal information we hold about you.' },
                { right: 'Correction', desc: 'Request that we correct any inaccurate or incomplete information.' },
                { right: 'Deletion', desc: 'Request deletion of your account and associated personal data.' },
                { right: 'Complaint', desc: 'Lodge a complaint with the NZ Privacy Commissioner if you believe your privacy has been breached.' },
              ].map((item, i) => (
                <Box key={i} sx={{ p: '16px', border: `1px solid ${border}`, borderRadius: '4px' }}>
                  <Typography sx={{ color: textHeading, fontWeight: 400, fontSize: '15px', mb: '4px' }}>
                    {item.right}
                  </Typography>
                  <Typography sx={{ fontSize: '14px', color: textLight, lineHeight: 1.5 }}>
                    {item.desc}
                  </Typography>
                </Box>
              ))}
            </Box>
            <p>To exercise any of these rights, contact us using the details below. We will respond to your request within 20 working days, as required by law.</p>
          </Section>

          {/* Section 7 */}
          <Section number="07" title="Cookies & Tracking">
            <p>The Platform uses essential cookies to maintain your session and keep you logged in. We use analytics through Firebase to understand how users interact with the Platform. You can disable analytics collection in your device settings. We do not use cookies for advertising or cross-site tracking.</p>
          </Section>

          {/* Section 8 */}
          <Section number="08" title="Children's Privacy">
            <p>InkedIn is not intended for individuals under the age of 18. We do not knowingly collect personal information from children. If we become aware that we have collected data from a person under 18, we will take steps to delete that information promptly.</p>
          </Section>

          {/* Section 9 */}
          <Section number="09" title="International Data Transfers">
            <p>As our servers and some third-party services are located outside New Zealand, your data may be transferred to and processed in other countries, primarily the United States. We ensure that any such transfers are conducted in compliance with the New Zealand Privacy Act 2020 and that your data receives an adequate level of protection.</p>
          </Section>

          {/* Section 10 */}
          <Section number="10" title="Changes to This Policy">
            <p>We may update this privacy policy from time to time. If we make material changes, we will notify you through the Platform or by email. The &ldquo;Effective Date&rdquo; at the top of this page indicates when this policy was last updated. Your continued use of the Platform after changes are posted constitutes your acceptance of the revised policy.</p>
          </Section>

          {/* Section 11 */}
          <Section number="11" title="Contact Us">
            <p>If you have any questions about this privacy policy or how we handle your data, please contact us:</p>
            <Box sx={{
              border: `1px solid ${border}`,
              p: '28px',
              mt: '20px',
              borderRadius: '4px',
              '& p': { mb: '6px', fontSize: '15px' },
              '& a': { color: gold, textDecoration: 'none', '&:hover': { textDecoration: 'underline' } },
            }}>
              <p><strong>Ink Empire</strong></p>
              <p>Email: <a href="mailto:info@getinked.in">info@getinked.in</a></p>
              <p>Website: <a href="https://getinked.in">getinked.in</a></p>
            </Box>
          </Section>
        </Box>

        {/* Footer */}
        <Box sx={{
          textAlign: 'center',
          py: '40px',
          px: '24px',
          borderTop: `1px solid ${border}`,
        }}>
          <Typography sx={{
            fontFamily: '"DM Sans", sans-serif',
            fontSize: '12px',
            letterSpacing: '0.3em',
            textTransform: 'uppercase',
            color: goldDim,
          }}>
            getinked.in
          </Typography>
        </Box>
      </Box>
    </>
  );
}
