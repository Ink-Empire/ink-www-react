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
const highlightBg = 'rgba(201, 168, 76, 0.08)';

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
        '& h3': {
          fontFamily: '"Cormorant Garamond", Georgia, serif',
          fontSize: '20px',
          fontWeight: 400,
          color: textHeading,
          mt: '24px',
          mb: '10px',
        },
        '& ul, & ol': {
          pl: '24px',
          mb: '14px',
          color: text,
          fontFamily: '"DM Sans", sans-serif',
          fontWeight: 300,
          fontSize: '16px',
          lineHeight: 1.75,
        },
        '& li': { mb: '6px' },
      }}>
        {children}
      </Box>
    </Box>
  );
}

function HighlightBox({ children }: { children: React.ReactNode }) {
  return (
    <Box sx={{
      bgcolor: highlightBg,
      borderLeft: `3px solid ${gold}`,
      p: '16px 20px',
      my: '16px',
      borderRadius: '0 4px 4px 0',
      '& p': { mb: 0 },
    }}>
      {children}
    </Box>
  );
}

export default function TermsOfServicePage() {
  return (
    <>
      <Head>
        <title>Terms and Conditions | InkedIn</title>
        <meta name="description" content="InkedIn Terms and Conditions - the rules governing your use of the InkedIn platform." />
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
            Terms and Conditions
          </Typography>
          <Typography sx={{
            fontSize: '14px',
            color: textLight,
            letterSpacing: '0.02em',
          }}>
            Effective Date: February 21, 2026
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

          {/* Section 1 */}
          <Section number="01" title="Acceptance of Terms">
            <p>Welcome to InkedIn. These Terms and Conditions (&ldquo;Terms&rdquo;) constitute a legally binding agreement between you (&ldquo;User&rdquo;, &ldquo;you&rdquo;, or &ldquo;your&rdquo;) and InkedIn (&ldquo;Company&rdquo;, &ldquo;we&rdquo;, &ldquo;us&rdquo;, or &ldquo;our&rdquo;) governing your access to and use of the InkedIn platform, including our website, mobile applications, and all related services (collectively, the &ldquo;Platform&rdquo;).</p>
            <p>By accessing, browsing, or using the Platform, creating an account, or engaging with any of our services, you acknowledge that you have read, understood, and agree to be bound by these Terms and our Privacy Policy. If you do not agree to these Terms, you must immediately discontinue use of the Platform.</p>
            <p>Your continued use of the Platform following the posting of any changes to these Terms constitutes acceptance of those changes.</p>
          </Section>

          {/* Section 2 */}
          <Section number="02" title="Definitions">
            <p><strong>&ldquo;Artist&rdquo;</strong> refers to any tattoo artist or creative professional who creates a profile on the Platform to showcase their work and offer services.</p>
            <p><strong>&ldquo;Studio&rdquo;</strong> refers to a place of business with one or more Artists that maintains a profile on the Platform.</p>
            <p><strong>&ldquo;Client&rdquo;</strong> refers to any individual who uses the Platform to browse, search for, or engage with Artists for tattoo-related services.</p>
            <p><strong>&ldquo;User Content&rdquo;</strong> refers to any and all content uploaded, posted, submitted, or transmitted through the Platform, including but not limited to images, photographs, artwork, tattoo designs, portfolio pieces, text, reviews, messages, and profile information.</p>
            <p><strong>&ldquo;Services&rdquo;</strong> refers to the marketplace features provided by the Platform, including artist discovery, search, scheduling, portfolio display, messaging, design collaboration, and any other features made available through the Platform.</p>
          </Section>

          {/* Section 3 */}
          <Section number="03" title="Eligibility and Account Registration">
            <p>To use the Platform, you must be at least 18 years of age or the age of majority in your jurisdiction, whichever is greater. By creating an account, you represent and warrant that you meet this age requirement.</p>
            <p>When creating an account, you agree to:</p>
            <ul>
              <li>Provide accurate, current, and complete information during registration.</li>
              <li>Maintain and promptly update your account information to keep it accurate and complete.</li>
              <li>Maintain the security and confidentiality of your login credentials.</li>
              <li>Accept responsibility for all activities that occur under your account.</li>
              <li>Notify us immediately of any unauthorised access or use of your account.</li>
            </ul>
            <p>You may not create multiple accounts, use another person&apos;s account without permission, or transfer your account to any other person.</p>
          </Section>

          {/* Section 4 */}
          <Section number="04" title="Platform Description and Role">
            <HighlightBox>
              <p><strong>Important:</strong> InkedIn is a marketplace platform that connects tattoo artists with potential clients. We do not provide tattoo services, nor do we employ, contract, or supervise any Artists on the Platform. We are an intermediary only.</p>
            </HighlightBox>
            <p>The Platform provides tools for Artists to display their portfolios, manage their availability, and connect with Clients. The Platform also provides tools for Clients to discover Artists, view portfolios, and communicate with Artists regarding potential tattoo services.</p>
            <p>InkedIn does not:</p>
            <ul>
              <li>Guarantee the quality, safety, legality, or suitability of any tattoo services provided by Artists.</li>
              <li>Endorse, certify, or verify the qualifications, licences, or skills of any Artist.</li>
              <li>Control or direct the manner in which Artists perform their services.</li>
              <li>Guarantee any outcomes from bookings or interactions made through the Platform.</li>
              <li>Act as an agent for either Artists or Clients.</li>
            </ul>
            <p>Any agreement or transaction between an Artist and a Client is solely between those parties. InkedIn is not a party to any such agreement.</p>
          </Section>

          {/* Section 5 */}
          <Section number="05" title="User Content, Artwork, and Uploads">
            <HighlightBox>
              <p><strong>Important:</strong> InkedIn does not claim ownership of any User Content. However, we accept no responsibility or liability for any User Content uploaded to, displayed on, or transmitted through the Platform.</p>
            </HighlightBox>

            <Typography component="h3">5.1 Ownership and Responsibility</Typography>
            <p>You retain all ownership rights to the content you upload to the Platform. You are solely responsible for all User Content that you upload, post, share, or otherwise make available through the Platform. This includes, without limitation, all artwork, tattoo designs, photographs, portfolio images, reference images, and any other creative or visual content.</p>

            <Typography component="h3">5.2 Representations and Warranties</Typography>
            <p>By uploading any User Content, you represent and warrant that:</p>
            <ul>
              <li>You own the content or have obtained all necessary rights, licences, consents, and permissions to upload and display it on the Platform.</li>
              <li>The content does not infringe upon, misappropriate, or violate any third party&apos;s intellectual property rights, copyright, trademark, patent, trade secret, moral rights, privacy rights, publicity rights, or any other proprietary or personal right.</li>
              <li>The content does not contain any material that is defamatory, obscene, unlawful, threatening, abusive, harassing, or otherwise objectionable.</li>
              <li>The content is accurate and not misleading.</li>
              <li>You have obtained consent from any individuals depicted in photographs or artwork you upload.</li>
            </ul>

            <Typography component="h3">5.3 Content Standards</Typography>
            <p>The following types of content are strictly prohibited on the Platform and may result in immediate removal of the content and suspension or termination of your account:</p>
            <ul>
              <li>Pornography, sexually explicit material, or content depicting sexual acts of any kind.</li>
              <li>Depictions of realistic violence toward any human or animal, including but not limited to gore, mutilation, torture, or abuse.</li>
              <li>Content that promotes, glorifies, or incites violence, self-harm, or harm to others.</li>
              <li>Content depicting or promoting animal cruelty or abuse.</li>
              <li>Content that sexualises minors in any way.</li>
            </ul>
            <p>InkedIn recognises that tattoo art may depict a wide range of artistic subjects. Content that is clearly artistic in nature (e.g. tattoo designs featuring stylised skulls, mythological scenes, or dark artistic themes) is generally permitted, provided it does not cross into realistic depictions of violence or explicit sexual content as described above. InkedIn reserves the right to make final determinations on content suitability at its sole discretion.</p>

            <Typography component="h3">5.4 Licence Grant</Typography>
            <p>By uploading User Content to the Platform, you grant InkedIn a non-exclusive, worldwide, royalty-free, sublicensable, and transferable licence to use, reproduce, distribute, display, and perform your User Content solely in connection with operating, providing, promoting, and improving the Platform and its services. This licence continues for as long as your content remains on the Platform and for a reasonable period thereafter to allow for removal from backups and caches.</p>

            <Typography component="h3">5.5 No Obligation to Monitor or Store</Typography>
            <p>InkedIn has no obligation to monitor, review, or store User Content. However, we reserve the right (but not the obligation) to review, screen, edit, refuse, or remove any User Content at our sole discretion, without notice, for any reason, including but not limited to content that we believe violates these Terms or is otherwise objectionable.</p>

            <Typography component="h3">5.6 Content Loss</Typography>
            <p>InkedIn is not responsible for the loss, corruption, or deletion of any User Content, whether caused by technical failures, system errors, security breaches, or any other reason. You are solely responsible for maintaining your own backups of any content you upload to the Platform.</p>

            <Typography component="h3">5.7 Third-Party Content</Typography>
            <p>The Platform may display content from third-party users, including tattoo artwork, designs, reviews, and other materials. InkedIn does not endorse, guarantee, or assume responsibility for the accuracy, completeness, or quality of any third-party content.</p>
          </Section>

          {/* Section 6 */}
          <Section number="06" title="Intellectual Property Rights">
            <Typography component="h3">6.1 Platform IP</Typography>
            <p>The Platform, including its design, layout, look, appearance, graphics, logos, trademarks, service marks, and all software, code, and technology underlying the Platform, is the exclusive property of InkedIn and is protected by intellectual property laws. You may not copy, reproduce, modify, distribute, or create derivative works from any part of the Platform without our prior written consent.</p>

            <Typography component="h3">6.2 Artist Artwork</Typography>
            <p>InkedIn respects the intellectual property of tattoo artists. All artwork, designs, and creative works displayed by Artists on the Platform remain the intellectual property of the respective Artist unless otherwise stated. Clients and other Users may not reproduce, copy, download (except where functionality explicitly permits), distribute, or use any Artist&apos;s work without the express permission of the Artist.</p>

            <Typography component="h3">6.3 Copyright Infringement</Typography>
            <p>If you believe that any content on the Platform infringes your copyright or intellectual property rights, please contact us with the following information:</p>
            <ul>
              <li>A description of the copyrighted work you claim has been infringed.</li>
              <li>A description of where the infringing material is located on the Platform.</li>
              <li>Your contact information (name, address, telephone number, email address).</li>
              <li>A statement that you have a good faith belief that the use is not authorised.</li>
              <li>A statement, made under penalty of perjury, that the information you have provided is accurate and that you are the copyright owner or authorised to act on behalf of the copyright owner.</li>
            </ul>
          </Section>

          {/* Section 7 */}
          <Section number="07" title="Tattoo Artist Obligations">
            <p>If you use the Platform as an Artist, you agree to:</p>
            <ul>
              <li>Maintain all necessary licences, permits, certifications, and insurance required by your local jurisdiction to operate as a tattoo artist or studio.</li>
              <li>Comply with all applicable health, safety, and hygiene regulations and standards.</li>
              <li>Provide accurate information about your services, experience, location, pricing, and availability.</li>
              <li>Upload only authentic work that you have created or have the right to display.</li>
              <li>Honour confirmed bookings or provide reasonable notice of cancellation.</li>
              <li>Conduct yourself professionally in all interactions with Clients and other Users.</li>
              <li>Not engage in any misleading, deceptive, or fraudulent practices.</li>
            </ul>
            <p>InkedIn does not verify Artist credentials, licences, or qualifications. Artists are solely responsible for ensuring their compliance with all applicable laws and regulations.</p>
          </Section>

          {/* Section 8 */}
          <Section number="08" title="Client Obligations">
            <p>If you use the Platform as a Client, you agree to:</p>
            <ul>
              <li>Conduct your own due diligence when selecting an Artist, including reviewing portfolios, qualifications, reviews, and hygiene practices.</li>
              <li>Communicate clearly and respectfully with Artists regarding your requirements, expectations, and any relevant health information.</li>
              <li>Honour confirmed bookings or provide reasonable notice of cancellation.</li>
              <li>Not upload, share, or request designs or artwork that infringe upon the intellectual property rights of others.</li>
              <li>Assume full responsibility for your decision to obtain a tattoo and acknowledge the inherent risks involved.</li>
            </ul>
          </Section>

          {/* Section 9 */}
          <Section number="09" title="Bookings and Appointments">
            <p>The Platform may facilitate the scheduling of appointments between Artists and Clients. Any booking made through the Platform constitutes an agreement between the Artist and the Client only. InkedIn is not a party to this agreement and is not responsible for:</p>
            <ul>
              <li>The fulfilment, cancellation, or rescheduling of any booking.</li>
              <li>The quality, safety, or outcome of any tattoo service.</li>
              <li>Any disputes arising between Artists and Clients regarding bookings, services, or payments.</li>
              <li>Any injury, allergic reaction, infection, dissatisfaction, or other harm resulting from tattoo services.</li>
            </ul>
            <p>Cancellation and rescheduling policies are determined by individual Artists. Please review an Artist&apos;s policies before confirming a booking.</p>
          </Section>

          {/* Section 10 */}
          <Section number="10" title="Payments and Fees">
            <p>InkedIn may charge fees for certain features or services on the Platform. Any applicable fees will be clearly communicated before you incur them.</p>
            <p>Payments for tattoo services are made directly between Artists and Clients, unless otherwise facilitated through the Platform. InkedIn is not responsible for any payment disputes between Artists and Clients.</p>
            <p>Where the Platform processes payments, we use third-party payment processors. By using payment features on the Platform, you agree to the terms and conditions of the applicable payment processor. InkedIn does not store or have access to your full payment card details.</p>
            <p>All fees charged by InkedIn are non-refundable unless otherwise stated or required by applicable law.</p>
          </Section>

          {/* Section 11 */}
          <Section number="11" title="Prohibited Conduct">
            <p>You agree not to:</p>
            <ul>
              <li>Use the Platform for any unlawful purpose or in violation of any applicable local, national, or international law or regulation.</li>
              <li>Upload, share, or transmit any content that is illegal, harmful, threatening, abusive, harassing, defamatory, vulgar, obscene, invasive of another&apos;s privacy, hateful, or discriminatory.</li>
              <li>Impersonate any person or entity, or falsely state or otherwise misrepresent your affiliation with a person or entity.</li>
              <li>Upload content that you do not have the right to make available, including copyrighted artwork, designs, or images belonging to others.</li>
              <li>Interfere with, disrupt, or attempt to gain unauthorised access to the Platform, its servers, or any connected networks.</li>
              <li>Use any automated means (bots, scrapers, crawlers) to access or collect data from the Platform.</li>
              <li>Harvest, collect, or store personal data of other Users without their express consent.</li>
              <li>Engage in spamming, phishing, or other unsolicited communications through the Platform.</li>
              <li>Circumvent, disable, or interfere with any security features of the Platform.</li>
              <li>Use the Platform to solicit or engage in transactions outside the Platform to avoid applicable fees.</li>
              <li>Post fake reviews, ratings, or endorsements.</li>
            </ul>
            <p>We reserve the right to investigate and take appropriate action against anyone who violates these prohibitions, including removing content, suspending or terminating accounts, and reporting to law enforcement authorities where necessary.</p>
          </Section>

          {/* Section 12 */}
          <Section number="12" title="Privacy and Data Protection">
            <p>Your use of the Platform is also governed by our <a href="/privacy" style={{ color: gold, textDecoration: 'none' }}>Privacy Policy</a>, which describes how we collect, use, store, and disclose your personal information. By using the Platform, you consent to the collection and use of your information as described in the Privacy Policy.</p>
            <p>We are committed to protecting your personal information in accordance with the New Zealand Privacy Act 2020 and any other applicable data protection legislation. For full details on how we handle your data, please refer to our Privacy Policy.</p>
          </Section>

          {/* Section 13 */}
          <Section number="13" title="Disclaimers and Limitation of Liability">
            <Typography component="h3">13.1 Platform Provided &ldquo;As Is&rdquo;</Typography>
            <p>THE PLATFORM AND ALL SERVICES ARE PROVIDED ON AN &ldquo;AS IS&rdquo; AND &ldquo;AS AVAILABLE&rdquo; BASIS WITHOUT WARRANTIES OF ANY KIND, WHETHER EXPRESS, IMPLIED, OR STATUTORY. TO THE FULLEST EXTENT PERMITTED BY LAW, INKEDIN DISCLAIMS ALL WARRANTIES, INCLUDING BUT NOT LIMITED TO IMPLIED WARRANTIES OF MERCHANTABILITY, FITNESS FOR A PARTICULAR PURPOSE, NON-INFRINGEMENT, AND ANY WARRANTIES ARISING FROM COURSE OF DEALING OR USAGE OF TRADE.</p>

            <Typography component="h3">13.2 No Responsibility for User Content</Typography>
            <HighlightBox>
              <p><strong>InkedIn expressly disclaims all responsibility and liability for any User Content, including but not limited to artwork, tattoo designs, photographs, portfolio images, reference images, reviews, and any other content uploaded by Users.</strong> We do not verify, endorse, or guarantee the originality, accuracy, quality, legality, or safety of any User Content.</p>
            </HighlightBox>

            <Typography component="h3">13.3 No Responsibility for Tattoo Services</Typography>
            <p>InkedIn is not responsible for the quality, safety, legality, or outcome of any tattoo services arranged through the Platform. We do not guarantee that any Artist&apos;s work will meet your expectations. All tattoo services are performed at your own risk.</p>

            <Typography component="h3">13.4 Limitation of Liability</Typography>
            <p>TO THE MAXIMUM EXTENT PERMITTED BY APPLICABLE LAW, IN NO EVENT SHALL INKEDIN, ITS DIRECTORS, OFFICERS, EMPLOYEES, AGENTS, OR AFFILIATES BE LIABLE FOR ANY INDIRECT, INCIDENTAL, SPECIAL, CONSEQUENTIAL, PUNITIVE, OR EXEMPLARY DAMAGES, INCLUDING BUT NOT LIMITED TO DAMAGES FOR LOSS OF PROFITS, GOODWILL, DATA, OR OTHER INTANGIBLE LOSSES, ARISING OUT OF OR IN CONNECTION WITH:</p>
            <ul>
              <li>Your use of or inability to use the Platform.</li>
              <li>Any User Content uploaded to or displayed on the Platform.</li>
              <li>Any conduct or content of any third party on the Platform.</li>
              <li>Any tattoo services obtained through the Platform.</li>
              <li>Unauthorised access, use, or alteration of your content or data.</li>
              <li>Any interaction between Users, whether online or offline.</li>
            </ul>
            <p>TO THE MAXIMUM EXTENT PERMITTED BY LAW, INKEDIN&apos;S TOTAL AGGREGATE LIABILITY FOR ALL CLAIMS ARISING OUT OF OR RELATING TO THESE TERMS OR YOUR USE OF THE PLATFORM SHALL NOT EXCEED THE GREATER OF: (A) THE AMOUNT YOU HAVE PAID TO INKEDIN IN THE TWELVE (12) MONTHS PRECEDING THE CLAIM, OR (B) ONE HUNDRED NEW ZEALAND DOLLARS (NZD $100).</p>
            <p>Nothing in these Terms excludes or limits liability that cannot be excluded or limited under applicable law, including under the New Zealand Consumer Guarantees Act 1993 where applicable.</p>
          </Section>

          {/* Section 14 */}
          <Section number="14" title="Indemnification">
            <p>You agree to indemnify, defend, and hold harmless InkedIn, its directors, officers, employees, agents, and affiliates from and against any and all claims, damages, losses, liabilities, costs, and expenses (including reasonable legal fees) arising out of or in connection with:</p>
            <ul>
              <li>Your use of the Platform or any services obtained through the Platform.</li>
              <li>Any User Content you upload, post, or otherwise make available through the Platform.</li>
              <li>Your violation of these Terms.</li>
              <li>Your violation of any rights of a third party, including intellectual property rights.</li>
              <li>Any tattoo services you provide (if you are an Artist) or receive (if you are a Client) through the Platform.</li>
              <li>Any dispute between you and another User of the Platform.</li>
            </ul>
          </Section>

          {/* Section 15 */}
          <Section number="15" title="Account Termination and Deletion">
            <Typography component="h3">15.1 Termination by You</Typography>
            <p>You may terminate your account at any time by using the account deletion feature within the Platform&apos;s settings. Upon account deletion, we will remove your account and associated data in accordance with our Privacy Policy and applicable data retention requirements.</p>

            <Typography component="h3">15.2 Termination by InkedIn</Typography>
            <p>We reserve the right to suspend, disable, or terminate your account and access to the Platform at any time, with or without cause, and with or without notice. Reasons for termination may include, but are not limited to:</p>
            <ul>
              <li>Violation of these Terms.</li>
              <li>Fraudulent, abusive, or otherwise harmful activity.</li>
              <li>Extended periods of inactivity.</li>
              <li>Requests by law enforcement or government agencies.</li>
              <li>Discontinuation or material modification of the Platform.</li>
            </ul>

            <Typography component="h3">15.3 Effect of Termination</Typography>
            <p>Upon termination of your account, your right to use the Platform will immediately cease. Sections of these Terms that by their nature should survive termination shall survive, including but not limited to ownership provisions, warranty disclaimers, indemnification, and limitations of liability.</p>
          </Section>

          {/* Section 16 */}
          <Section number="16" title="Dispute Resolution">
            <Typography component="h3">16.1 Between Users</Typography>
            <p>InkedIn is not responsible for resolving disputes between Users. In the event of a dispute between an Artist and a Client, the parties are encouraged to resolve the matter directly between themselves. InkedIn may, at its sole discretion, provide assistance or mediation, but is under no obligation to do so.</p>

            <Typography component="h3">16.2 With InkedIn</Typography>
            <p>If you have a dispute with InkedIn, you agree to first attempt to resolve the dispute informally by contacting us. If the dispute is not resolved within thirty (30) days of your initial contact, either party may pursue formal resolution.</p>
            <p>These Terms shall be governed by and construed in accordance with the laws of New Zealand. Any disputes arising from these Terms or your use of the Platform shall be subject to the exclusive jurisdiction of the courts of New Zealand.</p>
          </Section>

          {/* Section 17 */}
          <Section number="17" title="Modifications to Terms">
            <p>InkedIn reserves the right to modify, update, or replace these Terms at any time at our sole discretion. If we make material changes, we will notify you by posting the updated Terms on the Platform and updating the &ldquo;Effective Date&rdquo;. We may also provide additional notice through email or in-app notifications for significant changes.</p>
            <p>Your continued use of the Platform after any changes to these Terms constitutes your acceptance of the revised Terms. If you do not agree with the modified Terms, you must discontinue use of the Platform and delete your account.</p>
          </Section>

          {/* Section 18 */}
          <Section number="18" title="General Provisions">
            <Typography component="h3">18.1 Entire Agreement</Typography>
            <p>These Terms, together with the Privacy Policy and any other policies referenced herein, constitute the entire agreement between you and InkedIn regarding your use of the Platform and supersede all prior agreements, understandings, and communications.</p>

            <Typography component="h3">18.2 Severability</Typography>
            <p>If any provision of these Terms is found to be invalid, illegal, or unenforceable by a court of competent jurisdiction, the remaining provisions shall remain in full force and effect. The invalid provision shall be modified to the minimum extent necessary to make it valid and enforceable.</p>

            <Typography component="h3">18.3 Waiver</Typography>
            <p>The failure of InkedIn to enforce any right or provision of these Terms shall not constitute a waiver of that right or provision. Any waiver of any provision of these Terms will be effective only if in writing and signed by InkedIn.</p>

            <Typography component="h3">18.4 Assignment</Typography>
            <p>You may not assign or transfer these Terms or any rights or obligations hereunder without InkedIn&apos;s prior written consent. InkedIn may assign these Terms without restriction.</p>

            <Typography component="h3">18.5 Force Majeure</Typography>
            <p>InkedIn shall not be liable for any failure or delay in performing its obligations under these Terms due to circumstances beyond its reasonable control, including but not limited to natural disasters, acts of government, internet or telecommunications failures, power outages, or pandemics.</p>

            <Typography component="h3">18.6 Third-Party Services</Typography>
            <p>The Platform may contain links to or integrate with third-party websites, services, or applications. InkedIn is not responsible for the content, privacy practices, or terms of any third-party services. Your use of such services is at your own risk and subject to their respective terms and conditions.</p>

            <Typography component="h3">18.7 Accessibility</Typography>
            <p>InkedIn strives to make the Platform accessible to all users. If you experience any accessibility issues, please contact us so we can work to address them.</p>
          </Section>

          {/* Section 19 */}
          <Section number="19" title="Additional Terms for Users in the United States">
            <p>The following additional terms apply to Users who reside in or access the Platform from the United States. In the event of a conflict between this section and the rest of these Terms, this section shall prevail for US-based Users.</p>

            <Typography component="h3">19.1 Binding Arbitration and Class Action Waiver</Typography>
            <HighlightBox>
              <p><strong>PLEASE READ THIS SECTION CAREFULLY. IT AFFECTS YOUR LEGAL RIGHTS, INCLUDING YOUR RIGHT TO FILE A LAWSUIT IN COURT AND TO HAVE A JURY TRIAL.</strong></p>
            </HighlightBox>
            <p>You and InkedIn agree that any dispute, claim, or controversy arising out of or relating to these Terms or the use of the Platform shall be resolved through final and binding arbitration, rather than in court, except that either party may bring claims in small claims court if the claim qualifies.</p>
            <p>Arbitration shall be administered by the American Arbitration Association (&ldquo;AAA&rdquo;) under its Consumer Arbitration Rules then in effect. The arbitration shall be conducted in the English language. The arbitrator&apos;s decision shall be final and binding and may be entered as a judgment in any court of competent jurisdiction.</p>
            <p><strong>Class Action Waiver:</strong> YOU AND INKEDIN AGREE THAT EACH PARTY MAY ONLY BRING CLAIMS AGAINST THE OTHER IN YOUR OR ITS INDIVIDUAL CAPACITY, AND NOT AS A PLAINTIFF OR CLASS MEMBER IN ANY PURPORTED CLASS, CONSOLIDATED, OR REPRESENTATIVE PROCEEDING. The arbitrator may not consolidate more than one person&apos;s claims and may not otherwise preside over any form of a representative or class proceeding.</p>
            <p><strong>Opt-Out:</strong> You may opt out of this arbitration agreement by sending written notice to InkedIn at <a href="mailto:info@getinked.in" style={{ color: gold, textDecoration: 'none' }}>info@getinked.in</a> within thirty (30) days of first accepting these Terms. Your notice must include your name, mailing address, and a clear statement that you wish to opt out of this arbitration clause.</p>

            <Typography component="h3">19.2 DMCA — Digital Millennium Copyright Act</Typography>
            <p>InkedIn respects the intellectual property rights of others and complies with the Digital Millennium Copyright Act (17 U.S.C. &sect; 512). If you believe that content on the Platform infringes your copyright, you may submit a DMCA takedown notice to our designated agent with the following information:</p>
            <ul>
              <li>A physical or electronic signature of the copyright owner or a person authorised to act on their behalf.</li>
              <li>Identification of the copyrighted work claimed to have been infringed.</li>
              <li>Identification of the material that is claimed to be infringing, with information reasonably sufficient to permit InkedIn to locate the material on the Platform.</li>
              <li>Your contact information, including name, address, telephone number, and email address.</li>
              <li>A statement that you have a good faith belief that the disputed use is not authorised by the copyright owner, its agent, or the law.</li>
              <li>A statement, made under penalty of perjury, that the information in the notification is accurate and that you are the copyright owner or authorised to act on the copyright owner&apos;s behalf.</li>
            </ul>
            <p><strong>Designated DMCA Agent:</strong> Please send all DMCA notices to <a href="mailto:info@getinked.in" style={{ color: gold, textDecoration: 'none' }}>info@getinked.in</a>.</p>
            <p><strong>Counter-Notification:</strong> If you believe your content was removed or disabled by mistake or misidentification, you may submit a counter-notification to our DMCA Agent. The counter-notification must include your physical or electronic signature, identification of the material that was removed, a statement under penalty of perjury that you have a good faith belief the material was removed as a result of mistake or misidentification, and your consent to the jurisdiction of the federal court in your district (or if outside the US, any judicial district in which InkedIn may be found).</p>
            <p><strong>Repeat Infringers:</strong> InkedIn will terminate the accounts of Users who are determined to be repeat infringers in appropriate circumstances.</p>

            <Typography component="h3">19.3 California Privacy Rights (CCPA/CPRA)</Typography>
            <p>If you are a California resident, you have additional rights under the California Consumer Privacy Act (CCPA) as amended by the California Privacy Rights Act (CPRA). These include:</p>
            <ul>
              <li><strong>Right to Know:</strong> You have the right to request disclosure of the categories and specific pieces of personal information we have collected about you, the categories of sources from which the information is collected, the business purpose for collecting or selling the information, and the categories of third parties with whom we share personal information.</li>
              <li><strong>Right to Delete:</strong> You have the right to request deletion of personal information we have collected from you, subject to certain exceptions.</li>
              <li><strong>Right to Correct:</strong> You have the right to request correction of inaccurate personal information we maintain about you.</li>
              <li><strong>Right to Opt Out of Sale or Sharing:</strong> You have the right to opt out of the sale or sharing of your personal information. InkedIn does not sell personal information. If this changes, we will provide a clear &ldquo;Do Not Sell or Share My Personal Information&rdquo; link on the Platform.</li>
              <li><strong>Right to Non-Discrimination:</strong> We will not discriminate against you for exercising any of your CCPA/CPRA rights.</li>
            </ul>
            <p>To exercise any of these rights, please contact us at <a href="mailto:info@getinked.in" style={{ color: gold, textDecoration: 'none' }}>info@getinked.in</a> or use the account settings within the Platform. We will respond to verifiable consumer requests within forty-five (45) days.</p>
            <p><strong>Categories of Personal Information Collected:</strong> Identifiers (name, email, username), commercial information (transaction history), internet activity (browsing history, search history on the Platform), geolocation data, and professional information (for Artists). For full details, please see our <a href="/privacy" style={{ color: gold, textDecoration: 'none' }}>Privacy Policy</a>.</p>

            <Typography component="h3">19.4 Other US State Privacy Rights</Typography>
            <p>Residents of Virginia (VCDPA), Colorado (CPA), Connecticut (CTDPA), Utah (UCPA), and other states with consumer privacy legislation may have similar rights to those described in Section 19.3, including the right to access, delete, and correct personal information, and the right to opt out of targeted advertising. To exercise these rights, please contact us at <a href="mailto:info@getinked.in" style={{ color: gold, textDecoration: 'none' }}>info@getinked.in</a>.</p>
            <p>If your request is denied, you may have the right to appeal. To submit an appeal, please contact us at <a href="mailto:info@getinked.in" style={{ color: gold, textDecoration: 'none' }}>info@getinked.in</a> with the subject line &ldquo;Privacy Rights Appeal.&rdquo;</p>

            <Typography component="h3">19.5 Communications Compliance (CAN-SPAM and TCPA)</Typography>
            <p>InkedIn complies with the CAN-SPAM Act (15 U.S.C. &sect; 7701 et seq.) for all commercial electronic messages. All marketing emails will include a clear opt-out mechanism, our physical mailing address, and accurate subject lines. You may opt out of marketing communications at any time by clicking the &ldquo;unsubscribe&rdquo; link in any email or updating your notification preferences in your account settings.</p>
            <p>In accordance with the Telephone Consumer Protection Act (TCPA), InkedIn will not send automated text messages or make automated calls to your phone number without your prior express consent. You may revoke consent at any time by contacting us or replying &ldquo;STOP&rdquo; to any text message.</p>

            <Typography component="h3">19.6 Section 230 Safe Harbor</Typography>
            <p>InkedIn operates as an interactive computer service under Section 230 of the Communications Decency Act (47 U.S.C. &sect; 230). As a platform for user-generated content, InkedIn is not the publisher or speaker of any User Content posted by its Users. While we may moderate, review, or remove content at our discretion, doing so does not make us liable for content we choose not to remove. InkedIn is not liable for any action taken in good faith to restrict access to material that it considers to be objectionable.</p>

            <Typography component="h3">19.7 US Governing Law</Typography>
            <p>For Users residing in the United States, to the extent not governed by the arbitration clause in Section 19.1, these Terms shall be governed by and construed in accordance with the federal laws of the United States and the laws of the applicable state, without regard to conflict of law provisions. Any legal proceedings not subject to arbitration shall be brought exclusively in the appropriate state or federal courts.</p>

            <Typography component="h3">19.8 FTC Endorsement Compliance</Typography>
            <p>Users of the Platform, including Artists and Clients, must comply with the Federal Trade Commission&apos;s (FTC) Endorsement Guides (16 CFR Part 255). This means any reviews, testimonials, or endorsements posted on the Platform must reflect the honest opinions and genuine experiences of the person posting them. Users must disclose any material connections that could affect the credibility of a review or endorsement. InkedIn reserves the right to remove reviews or content that appear to violate FTC guidelines.</p>
          </Section>

          {/* Section 20 */}
          <Section number="20" title="Contact Information">
            <p>If you have any questions, concerns, or complaints regarding these Terms or the Platform, please contact us:</p>
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
            <p style={{ marginTop: '16px' }}>For copyright infringement notices, please use the contact details above and include the information specified in Section 6.3.</p>
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
