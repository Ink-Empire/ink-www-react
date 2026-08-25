import React, { useEffect, useMemo, useState } from 'react';
import { GetServerSideProps } from 'next';
import Head from 'next/head';
import { useRouter } from 'next/router';
import { Box, Button, Typography, CircularProgress } from '@mui/material';
import VisibilityIcon from '@mui/icons-material/Visibility';
import EditIcon from '@mui/icons-material/Edit';
import ArrowBackIcon from '@mui/icons-material/ArrowBack';
import Layout from '@/components/Layout';
import { colors } from '@/styles/colors';
import { useAuth } from '@/contexts/AuthContext';
import { studioService } from '@/services/studioService';
import { useStudioHours, useStudioArtists, useStudioGallery } from '@/hooks/useStudios';
import {
  StudioBanner,
  StudioHeader,
  StudioSpotlight,
  StudioAnnouncements,
  StudioInfoCard,
  StudioLocationHours,
  StudioHoursCard,
  StudioContactCard,
  StudioGuides,
} from '@/components/studio';
import EditableSection from '@/components/studio/edit/EditableSection';
import StudioDetailsEditor from '@/components/studio/edit/StudioDetailsEditor';
import BannerEditor from '@/components/studio/edit/BannerEditor';
import { markStudioRecentlyEdited } from '@/utils/studioEditing';
import LocationEditor, { LocationDraft } from '@/components/studio/edit/LocationEditor';
import ContactEditor, { ContactDraft } from '@/components/studio/edit/ContactEditor';
import HoursEditor from '@/components/studio/edit/HoursEditor';
import AnnouncementsEditor, { AnnouncementDraft } from '@/components/studio/edit/AnnouncementsEditor';
import GuidesEditor, { GuideDraft } from '@/components/studio/edit/GuidesEditor';
import TemplatePicker, { StudioTemplateValue } from '@/components/studio/edit/TemplatePicker';
import SpotlightEditor, { SpotlightDraft } from '@/components/studio/edit/SpotlightEditor';

interface StudioEditProps {
  initialStudio?: any;
  initialSpotlights?: any[];
  initialGuides?: any[];
}

export default function StudioEdit({
  initialStudio,
  initialSpotlights = [],
  initialGuides = [],
}: StudioEditProps) {
  const router = useRouter();
  const { slug } = router.query;
  const { user, isAuthenticated } = useAuth();
  const { hours: savedHours } = useStudioHours(slug as string);
  const { artists } = useStudioArtists(slug as string);
  const { gallery, loading: galleryLoading } = useStudioGallery(slug as string);

  const [studio, setStudio] = useState<any>(initialStudio);
  const [previewing, setPreviewing] = useState(false);
  const [publishing, setPublishing] = useState(false);
  const [published, setPublished] = useState(false);
  const [error, setError] = useState<string | null>(null);

  // Draft edits live here until Publish. Nothing is written on the way.
  const [name, setName] = useState(initialStudio?.name || '');
  const [about, setAbout] = useState(initialStudio?.about || '');
  const [photoFile, setPhotoFile] = useState<File | null>(null);
  const [photoPreview, setPhotoPreview] = useState<string | null>(initialStudio?.image?.uri || null);
  const [bannerFile, setBannerFile] = useState<File | null>(null);
  const [bannerPreview, setBannerPreview] = useState<string | null>(initialStudio?.banner?.uri || null);
  const [bannerCleared, setBannerCleared] = useState(false);
  const [template, setTemplate] = useState<StudioTemplateValue>(
    (initialStudio?.template as StudioTemplateValue) || 'portfolio',
  );

  const [location, setLocation] = useState<LocationDraft>({
    address: initialStudio?.address || '',
    address2: initialStudio?.address2 || '',
    city: initialStudio?.city || '',
    state: initialStudio?.state || '',
    postal_code: initialStudio?.postal_code || '',
  });

  const [contact, setContact] = useState<ContactDraft>({
    phone: initialStudio?.phone || '',
    email: initialStudio?.email || '',
    website: initialStudio?.website || '',
  });

  const [hours, setHours] = useState<any[]>([]);
  const [hoursTouched, setHoursTouched] = useState(false);

  const [announcements, setAnnouncements] = useState<AnnouncementDraft[]>(
    (initialStudio?.announcements || []).map((a: any) => ({
      id: a.id,
      type: a.type || 'general',
      title: a.title,
      content: a.content,
      starts_at: a.starts_at ? String(a.starts_at).slice(0, 10) : '',
      ends_at: a.ends_at ? String(a.ends_at).slice(0, 10) : '',
    })),
  );

  const [guides, setGuides] = useState<GuideDraft[]>(
    (initialGuides || []).map((g: any) => ({
      id: g.id,
      type: g.type,
      title: g.title,
      excerpt: g.excerpt || '',
      content: g.content,
      is_default: Boolean(g.is_default),
    })),
  );

  const [spotlights, setSpotlights] = useState<SpotlightDraft[]>(
    initialSpotlights.map((s: any) => ({ id: s.id, type: s.type, item_id: s.item_id, item: s.item })),
  );

  // Saved hours arrive from their own endpoint, so seed the draft once.
  useEffect(() => {
    if (!hoursTouched && savedHours && savedHours.length > 0) {
      setHours(savedHours);
    }
  }, [savedHours, hoursTouched]);

  const isOwner = Boolean(user && studio && Number(user.id) === Number(studio.owner_id));

  const announcementFingerprint = (list: any[]) => list
    .map((a: any) => [
      a.id ?? 'new',
      a.type || 'general',
      a.title,
      a.content,
      a.starts_at ? String(a.starts_at).slice(0, 10) : '',
      a.ends_at ? String(a.ends_at).slice(0, 10) : '',
    ].join('|'))
    .sort()
    .join('~');

  const savedAnnouncementIds = announcementFingerprint(studio?.announcements || []);
  const draftAnnouncementIds = announcementFingerprint(announcements);
  const savedSpotlightKeys = initialSpotlights.map((s: any) => `${s.type}:${s.item_id}`).sort().join(',');
  const draftSpotlightKeys = spotlights.map((s) => `${s.type}:${s.item_id}`).sort().join(',');

  const guideFingerprint = (list: any[]) => list
    .map((g: any) => [g.id ?? 'new', g.type, g.title, g.excerpt || '', g.content, g.is_default ? '1' : '0'].join('|'))
    .sort()
    .join('~');

  const isDirty =
    name !== (studio?.name || '') ||
    about !== (studio?.about || '') ||
    Boolean(photoFile) ||
    Boolean(bannerFile) ||
    bannerCleared ||
    hoursTouched ||
    template !== (studio?.template || 'portfolio') ||
    location.address !== (studio?.address || '') ||
    location.address2 !== (studio?.address2 || '') ||
    location.city !== (studio?.city || '') ||
    location.state !== (studio?.state || '') ||
    location.postal_code !== (studio?.postal_code || '') ||
    contact.phone !== (studio?.phone || '') ||
    contact.email !== (studio?.email || '') ||
    contact.website !== (studio?.website || '') ||
    announcements.some((a) => !a.id) ||
    savedAnnouncementIds !== draftAnnouncementIds ||
    savedSpotlightKeys !== draftSpotlightKeys ||
    guideFingerprint(initialGuides) !== guideFingerprint(guides);

  // Anything not yet published would be lost on a reload.
  useEffect(() => {
    if (!isDirty || published) return;

    const warn = (e: BeforeUnloadEvent) => {
      e.preventDefault();
      e.returnValue = '';
    };

    window.addEventListener('beforeunload', warn);
    return () => window.removeEventListener('beforeunload', warn);
  }, [isDirty, published]);

  // Only the owner edits their own page.
  useEffect(() => {
    if (!studio) return;
    if (isAuthenticated === false || (user && !isOwner)) {
      router.replace(`/studios/${studio.slug}`);
    }
  }, [isAuthenticated, user, isOwner, studio, router]);

  // What the sections render: the saved studio with the pending edits on top.
  const draftStudio = useMemo(
    () => ({
      ...studio,
      name,
      about,
      ...location,
      ...contact,
      template,
      announcements,
      image: photoPreview ? { ...(studio?.image || {}), uri: photoPreview } : studio?.image,
      banner: bannerPreview ? { ...(studio?.banner || {}), uri: bannerPreview } : null,
    }),
    [studio, name, about, photoPreview, bannerPreview, location, contact, announcements],
  );

  const handlePhoto = (file: File) => {
    setPhotoFile(file);
    setPhotoPreview(URL.createObjectURL(file));
  };

  const handleBanner = (file: File) => {
    setBannerFile(file);
    setBannerPreview(URL.createObjectURL(file));
    setBannerCleared(false);
  };

  const handleBannerRemove = () => {
    setBannerFile(null);
    setBannerPreview(null);
    setBannerCleared(true);
  };

  const handlePublish = async () => {
    if (!studio?.id) return;

    setPublishing(true);
    setError(null);

    try {
      // Images first: they are their own resources, so a failure here leaves
      // the studio untouched rather than half-edited.
      if (photoFile) {
        const form = new FormData();
        form.append('image', photoFile);
        await studioService.uploadImageFile(studio.id, form);
      }

      if (bannerFile) {
        const form = new FormData();
        form.append('image', bannerFile);
        await studioService.uploadBannerFile(studio.id, form);
      } else if (bannerCleared) {
        await studioService.removeBanner(studio.id);
      }

      // Everything relational lands in one transaction, so a failure part way
      // through cannot leave the page half-published.
      await studioService.publishPage(studio.id, {
        name,
        about,
        template,
        ...location,
        ...contact,
        ...(hoursTouched && hours.length > 0 ? { working_hours: hours } : {}),
        announcements: announcements.map((a) => ({
          ...(a.id ? { id: a.id } : {}),
          type: a.type || 'general',
          title: a.title,
          content: a.content,
          ...(a.starts_at ? { starts_at: a.starts_at } : {}),
          ...(a.ends_at ? { ends_at: a.ends_at } : {}),
        })),
        guides: guides.map((g) => ({
          ...(g.id ? { id: g.id } : {}),
          type: g.type || 'aftercare',
          title: g.title,
          excerpt: g.excerpt || '',
          content: g.content,
          is_default: Boolean(g.is_default),
        })),
        spotlights: spotlights.map((sp) => ({ type: sp.type, item_id: sp.item_id })),
      });

      // Clear the pending flags before navigating so the unsaved-changes
      // guard does not fire on the way out.
      setPhotoFile(null);
      setBannerFile(null);
      setBannerCleared(false);
      setHoursTouched(false);
      setPublished(true);

      // Tell the public page to skip the shared cache for this visitor, so the
      // owner sees their change rather than a cached copy of the old page.
      markStudioRecentlyEdited(studio.slug);

      router.push(`/studios/${studio.slug}?published=1`);
    } catch (err: any) {
      setError(err?.message || 'That did not publish. Try again.');
    } finally {
      setPublishing(false);
    }
  };

  if (!studio) {
    return (
      <Layout>
        <Box sx={{ p: 6, textAlign: 'center', color: colors.textSecondary }}>Studio not found.</Box>
      </Layout>
    );
  }

  const editing = !previewing;
  const noop = () => {};

  return (
    <Layout>
      <Head>
        <title>{`Edit ${studio.name} | InkedIn`}</title>
        <meta name="robots" content="noindex" />
      </Head>

      {/* Toolbar */}
      <Box sx={{
        position: 'sticky',
        top: 0,
        zIndex: 10,
        bgcolor: colors.surface,
        borderBottom: `1px solid ${colors.border}`,
        px: 3,
        py: 1.5,
        display: 'flex',
        alignItems: 'center',
        gap: 2,
        flexWrap: 'wrap',
      }}>
        <Button
          onClick={() => router.push('/dashboard')}
          startIcon={<ArrowBackIcon sx={{ fontSize: 18 }} />}
          sx={{ color: colors.textSecondary, textTransform: 'none' }}
        >
          Dashboard
        </Button>

        <Box sx={{ flex: 1, minWidth: 0 }}>
          <Typography noWrap sx={{ fontSize: '1rem', color: colors.textPrimary }}>
            {previewing ? 'Previewing your page' : 'Editing your page'}
          </Typography>
          <Typography sx={{ fontSize: '0.8rem', color: colors.textSecondary }}>
            {isDirty
              ? 'You have changes that visitors cannot see yet.'
              : 'Everything here is live.'}
          </Typography>
        </Box>

        {error && (
          <Typography sx={{ fontSize: '0.85rem', color: colors.error }}>{error}</Typography>
        )}

        <Button
          onClick={() => setPreviewing((p) => !p)}
          startIcon={previewing
            ? <EditIcon sx={{ fontSize: 18 }} />
            : <VisibilityIcon sx={{ fontSize: 18 }} />}
          variant="outlined"
          sx={{ color: colors.textPrimary, borderColor: colors.border, textTransform: 'none' }}
        >
          {previewing ? 'Back to editing' : 'Preview page'}
        </Button>

        <Button
          onClick={handlePublish}
          disabled={!isDirty || publishing}
          sx={{
            bgcolor: colors.accent,
            color: colors.background,
            textTransform: 'none',
            px: 3,
            '&:hover': { bgcolor: colors.accent, opacity: 0.9 },
            '&.Mui-disabled': { bgcolor: colors.border, color: colors.textMuted },
          }}
        >
          {publishing ? <CircularProgress size={18} sx={{ color: colors.background }} /> : 'Publish'}
        </Button>
      </Box>

      <Box sx={{ maxWidth: 1200, mx: 'auto', py: 3 }}>
        <EditableSection
          label="Banner"
          editing={editing}
          isEmpty={!bannerPreview}
          emptyHint="No banner yet. Your page opens with your name and photo until you add one."
          editor={
            <BannerEditor
              bannerPreview={bannerPreview}
              onBannerChange={handleBanner}
              onBannerRemove={handleBannerRemove}
            />
          }
        >
          <StudioBanner studio={draftStudio} />
        </EditableSection>

        <EditableSection
          label="Layout"
          editing={editing}
          editor={<TemplatePicker value={template} onChange={setTemplate} />}
        >
          <Box sx={{
            p: 2,
            borderRadius: '10px',
            bgcolor: colors.surface,
            border: `1px solid ${colors.border}`,
          }}>
            <Typography sx={{ fontSize: '0.75rem', textTransform: 'uppercase', letterSpacing: '0.06em', color: colors.accent }}>
              Layout
            </Typography>
            <Typography sx={{ fontSize: '0.95rem', color: colors.textPrimary, textTransform: 'capitalize' }}>
              {template}
            </Typography>
          </Box>
        </EditableSection>

        <EditableSection
          label="Announcements"
          editing={editing}
          isEmpty={announcements.length === 0}
          emptyHint="No announcements yet. Post one and it shows as a banner at the top of your page."
          editor={<AnnouncementsEditor value={announcements} onChange={setAnnouncements} />}
        >
          <StudioAnnouncements studio={draftStudio} />
        </EditableSection>

        <EditableSection
          label="Studio details"
          editing={editing}
          editor={
            <StudioDetailsEditor
              name={name}
              about={about}
              photoPreview={photoPreview}
              onNameChange={setName}
              onAboutChange={setAbout}
              onPhotoChange={handlePhoto}
            />
          }
        >
          <StudioHeader
            studio={draftStudio}
            artists={[]}
            studioStyles={[]}
            isSaved={false}
            canContact={false}
            handleContactStudio={noop}
            handleSaveStudio={noop}
          />
        </EditableSection>

        <EditableSection
          label="Spotlight"
          editing={editing}
          isEmpty={spotlights.length === 0}
          emptyHint="Nothing in your Spotlight yet. Pick a few artists or tattoos to feature here."
          editor={
            <SpotlightEditor
              value={spotlights}
              artists={artists}
              gallery={gallery}
              galleryLoading={galleryLoading}
              onChange={setSpotlights}
            />
          }
        >
          <StudioSpotlight
            spotlights={spotlights}
            studio={draftStudio}
            artists={[]}
            slug={slug}
            router={router}
            handleTattooClick={noop}
          />
        </EditableSection>

        <Box sx={{ display: 'grid', gridTemplateColumns: { xs: '1fr', md: '1fr 320px' }, gap: 3 }}>
          <Box sx={{ display: 'flex', flexDirection: 'column', gap: 3 }}>
            <EditableSection
              label="Location"
              editing={editing}
              editor={<LocationEditor value={location} onChange={setLocation} />}
            >
              <StudioLocationHours studio={draftStudio} />
            </EditableSection>

            <EditableSection
              label="Hours"
              editing={editing}
              isEmpty={!hours || hours.length === 0}
              emptyHint="No opening hours set yet."
              editor={
                <HoursEditor
                  value={hours}
                  onChange={(next) => { setHours(next); setHoursTouched(true); }}
                />
              }
            >
              <StudioHoursCard studio={draftStudio} workingHours={hours} />
            </EditableSection>

            <EditableSection
              label="Contact"
              editing={editing}
              editor={<ContactEditor value={contact} onChange={setContact} />}
            >
              <StudioContactCard
                studio={draftStudio}
                canContact={false}
                handleContactStudio={noop}
              />
            </EditableSection>
          </Box>

          <Box sx={{ display: 'flex', flexDirection: 'column', gap: 3 }}>
            {/* No editor of its own: this card is a summary of Contact and Hours. */}
            <EditableSection
              label="Guides"
              editing={editing}
              isEmpty={guides.length === 0}
              emptyHint="No guides yet. Write your aftercare once and send it to clients from your messages."
              editor={<GuidesEditor value={guides} onChange={setGuides} />}
            >
              <StudioGuides guides={guides} studioSlug={studio.slug} />
            </EditableSection>

            <EditableSection label="Studio info" editing={editing}>
              <StudioInfoCard studio={draftStudio} todayHours={null} />
            </EditableSection>
          </Box>
        </Box>
      </Box>
    </Layout>
  );
}

export const getServerSideProps: GetServerSideProps = async (context) => {
  const { slug } = context.params || {};
  if (!slug || typeof slug !== 'string') {
    return { notFound: true };
  }

  const apiUrl = process.env.NEXT_PUBLIC_API_URL || 'http://localhost';
  const appToken = process.env.NEXT_PUBLIC_API_APP_TOKEN || '';
  const headers = {
    Accept: 'application/json',
    ...(appToken ? { 'X-App-Token': appToken } : {}),
  };

  try {
    const response = await fetch(`${apiUrl}/api/studios/${slug}`, { method: 'GET', headers });
    if (!response.ok) {
      return { notFound: true };
    }

    const data = await response.json();
    const studio = data?.studio || null;
    if (!studio) {
      return { notFound: true };
    }

    let initialGuides: any[] = [];
    try {
      const res = await fetch(`${apiUrl}/api/studios/${slug}/guides`, { method: 'GET', headers });
      if (res.ok) {
        initialGuides = (await res.json())?.guides || [];
      }
    } catch {
      // leave the list empty
    }

    let initialSpotlights: any[] = [];
    try {
      const res = await fetch(`${apiUrl}/api/studios/${slug}/spotlights`, { method: 'GET', headers });
      if (res.ok) {
        initialSpotlights = (await res.json())?.spotlights || [];
      }
    } catch {
      // leave the strip empty
    }

    return { props: { initialStudio: studio, initialSpotlights, initialGuides } };
  } catch {
    return { props: {} };
  }
};
