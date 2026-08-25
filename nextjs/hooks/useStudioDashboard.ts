import { useCallback, useState } from 'react';
import { studioService } from '@/services/studioService';
import type { WorkingHour } from '@/components/WorkingHoursModal';
import type { StudioArtist, Announcement } from '@/components/dashboard';

/**
 * All state and actions behind the studio management surface.
 *
 * This lives outside pages/dashboard.tsx so the studio screens can grow
 * without that file growing with them. The dashboard still calls the hook, as
 * its header needs the loaded studio.
 */
export function useStudioDashboard(studioId?: number) {
  // Studio data states
  const [studioData, setStudioData] = useState<any>(null);
  const [studioArtists, setStudioArtists] = useState<StudioArtist[]>([]);
  const [announcements, setAnnouncements] = useState<Announcement[]>([]);
  const [seekingGuests, setSeekingGuests] = useState(false);
  const [guestSpotDetails, setGuestSpotDetails] = useState('');
  const [isSavingGuestDetails, setIsSavingGuestDetails] = useState(false);
  const [studioStats, setStudioStats] = useState<{
    page_views: { count: number; trend: number; trend_label: string };
    bookings: { count: number; trend: number; trend_label: string };
    inquiries: { count: number; trend: number; trend_label: string };
    artists_count: number;
  } | null>(null);
  const [studioWorkingHours, setStudioWorkingHours] = useState<WorkingHour[]>([]);

  // Studio contact info editing
  const [isEditingContact, setIsEditingContact] = useState(false);
  const [contactForm, setContactForm] = useState({
    address: '',
    address2: '',
    city: '',
    state: '',
    postal_code: '',
    phone: '',
  });
  const [isSavingContact, setIsSavingContact] = useState(false);

  // Spotlights, so the studio page card can show what is pinned without
  // opening the picker.
  const [spotlights, setSpotlights] = useState<any[]>([]);

  const loadSpotlights = useCallback(async () => {
    if (!studioId) return;
    try {
      setSpotlights(await studioService.getSpotlights(studioId));
    } catch (err) {
      console.error('Failed to load spotlights:', err);
    }
  }, [studioId]);

  // Announcement form
  const [newAnnouncement, setNewAnnouncement] = useState({ title: '', content: '' });
  const [isAddingAnnouncement, setIsAddingAnnouncement] = useState(false);

  const loadStudioData = async () => {
    if (!studioId) return;
    try {
      // Use combined dashboard endpoint - single API call instead of 5
      const dashboardData = await studioService.getDashboard(studioId);

      // The dashboard endpoint returns the studio's own fields at the top
      // level, with artists/announcements/stats/working_hours alongside them.
      // There is no `studio` key to read.
      const studio = (dashboardData as any)?.studio ?? dashboardData;
      setStudioData(studio);
      setStudioArtists(Array.isArray(dashboardData.artists) ? dashboardData.artists : []);
      setAnnouncements(Array.isArray(dashboardData.announcements) ? dashboardData.announcements : []);
      setSeekingGuests(studio?.seeking_guest_artists || false);
      setGuestSpotDetails(studio?.guest_spot_details || '');
      // Initialize contact form with current studio data
      setContactForm({
        address: studio?.address || '',
        address2: studio?.address2 || '',
        city: studio?.city || '',
        state: studio?.state || '',
        postal_code: studio?.postal_code || '',
        phone: studio?.phone || '',
      });
      if (dashboardData.stats) {
        setStudioStats(dashboardData.stats);
      }
      // Set working hours from API response
      const hours = Array.isArray(dashboardData.working_hours) ? dashboardData.working_hours : [];
      setStudioWorkingHours(hours);
      loadSpotlights();
    } catch (err) {
      console.error('Failed to load studio data:', err);
    }
  };

  const handleToggleSeekingGuests = async () => {
    if (!studioId) return;
    const newValue = !seekingGuests;
    setSeekingGuests(newValue);
    try {
      await studioService.updateDetails(studioId, { seeking_guest_artists: newValue });
    } catch (err) {
      setSeekingGuests(!newValue); // Revert on error
      console.error('Failed to update seeking status:', err);
    }
  };

  const handleSaveGuestSpotDetails = async () => {
    if (!studioId) return;
    setIsSavingGuestDetails(true);
    try {
      await studioService.updateDetails(studioId, { guest_spot_details: guestSpotDetails });
    } catch (err) {
      console.error('Failed to save guest spot details:', err);
    } finally {
      setIsSavingGuestDetails(false);
    }
  };

  const handleSaveContactInfo = async () => {
    if (!studioId) return;
    setIsSavingContact(true);
    try {
      await studioService.updateDetails(studioId, contactForm);
      setStudioData((prev: any) => ({ ...prev, ...contactForm }));
      setIsEditingContact(false);
    } catch (err) {
      console.error('Failed to save contact info:', err);
    } finally {
      setIsSavingContact(false);
    }
  };

  const handleCancelContactEdit = () => {
    // Reset form to current studio data
    setContactForm({
      address: studioData?.address || '',
      address2: studioData?.address2 || '',
      city: studioData?.city || '',
      state: studioData?.state || '',
      postal_code: studioData?.postal_code || '',
      phone: studioData?.phone || '',
    });
    setIsEditingContact(false);
  };

  const handleSaveBusinessHours = async (hours: WorkingHour[]) => {
    if (!studioId) return;
    try {
      // Save all working hours to the API (same format as artists)
      await studioService.setWorkingHours(studioId, hours);
      // Reload studio data to get updated hours
      loadStudioData();
    } catch (err) {
      console.error('Failed to save business hours:', err);
    }
  };

  const handleRemoveArtist = async (artistId: number) => {
    if (!studioId) return;
    try {
      await studioService.removeArtist(studioId, artistId);
      setStudioArtists(prev => prev.filter(a => a.id !== artistId));
    } catch (err) {
      console.error('Failed to remove artist:', err);
    }
  };

  const handleVerifyArtist = async (artistId: number) => {
    if (!studioId) return;
    try {
      await studioService.verifyArtist(studioId, artistId);
      setStudioArtists(prev => prev.map(a =>
        a.id === artistId ? { ...a, is_verified: true, verified_at: new Date().toISOString() } : a
      ));
    } catch (err) {
      console.error('Failed to verify artist:', err);
    }
  };

  const handleUnverifyArtist = async (artistId: number) => {
    if (!studioId) return;
    try {
      await studioService.unverifyArtist(studioId, artistId);
      setStudioArtists(prev => prev.map(a =>
        a.id === artistId ? { ...a, is_verified: false, verified_at: null } : a
      ));
    } catch (err) {
      console.error('Failed to unverify artist:', err);
    }
  };

  const handleAddAnnouncement = async () => {
    if (!studioId || !newAnnouncement.title || !newAnnouncement.content) return;
    setIsAddingAnnouncement(true);
    try {
      const res = await studioService.createAnnouncement(studioId, newAnnouncement);
      setAnnouncements(prev => [(res as any).announcement || res, ...prev]);
      setNewAnnouncement({ title: '', content: '' });
    } catch (err) {
      console.error('Failed to add announcement:', err);
    } finally {
      setIsAddingAnnouncement(false);
    }
  };

  const handleDeleteAnnouncement = async (announcementId: number) => {
    if (!studioId) return;
    try {
      await studioService.deleteAnnouncement(studioId, announcementId);
      setAnnouncements(prev => prev.filter(a => a.id !== announcementId));
    } catch (err) {
      console.error('Failed to delete announcement:', err);
    }
  };
  return {
    studioData,
    setStudioData,
    studioArtists,
    setStudioArtists,
    announcements,
    setAnnouncements,
    seekingGuests,
    guestSpotDetails,
    setGuestSpotDetails,
    isSavingGuestDetails,
    studioStats,
    studioWorkingHours,
    isEditingContact,
    setIsEditingContact,
    contactForm,
    setContactForm,
    isSavingContact,
    spotlights,
    loadSpotlights,
    newAnnouncement,
    setNewAnnouncement,
    isAddingAnnouncement,
    loadStudioData,
    handleToggleSeekingGuests,
    handleSaveGuestSpotDetails,
    handleSaveContactInfo,
    handleCancelContactEdit,
    handleSaveBusinessHours,
    handleRemoveArtist,
    handleVerifyArtist,
    handleUnverifyArtist,
    handleAddAnnouncement,
    handleDeleteAnnouncement,
  };
}

export type StudioDashboard = ReturnType<typeof useStudioDashboard>;
