import { useEffect, useState } from 'react';
import {
  Alert,
  Autocomplete,
  Box,
  Button,
  Card,
  CardContent,
  CircularProgress,
  Dialog,
  DialogActions,
  DialogContent,
  DialogTitle,
  IconButton,
  TextField,
  Typography,
} from '@mui/material';
import DeleteIcon from '@mui/icons-material/Delete';
import { adminService, AdminStudioOption, OnboardArtistResult } from '@/services/adminService';
import LocationAutocomplete from '@/components/LocationAutocomplete';

const ACCEPTED = ['image/jpeg', 'image/png', 'image/gif', 'image/webp'];
const MAX_IMAGES = 60;

interface PendingImage {
  content: string;
  mime: string;
  filename: string;
  size: number;
  preview: string;
}

// Strips the data URL prefix. The API takes raw base64, the same shape the
// inbound mailbox produces from an email attachment.
const readAsBase64 = (file: File): Promise<string> =>
  new Promise((resolve, reject) => {
    const reader = new FileReader();
    reader.onload = () => resolve(String(reader.result).split(',')[1] ?? '');
    reader.onerror = () => reject(reader.error);
    reader.readAsDataURL(file);
  });

export const OnboardArtistPanel = () => {
  const [email, setEmail] = useState('');
  const [name, setName] = useState('');
  const [location, setLocation] = useState('');
  const [locationLatLong, setLocationLatLong] = useState('');
  const [studio, setStudio] = useState<AdminStudioOption | null>(null);
  const [studioOptions, setStudioOptions] = useState<AdminStudioOption[]>([]);
  const [studioQuery, setStudioQuery] = useState('');
  const [studioLoading, setStudioLoading] = useState(false);
  const [newStudioName, setNewStudioName] = useState('');
  const [newStudioLocation, setNewStudioLocation] = useState('');
  const [newStudioLatLong, setNewStudioLatLong] = useState('');
  const [creatingStudio, setCreatingStudio] = useState(false);
  const [images, setImages] = useState<PendingImage[]>([]);
  const [loading, setLoading] = useState(false);
  const [reading, setReading] = useState(false);
  const [result, setResult] = useState<OnboardArtistResult | null>(null);
  const [error, setError] = useState<string | null>(null);

  // Debounced so typing a studio name does not fire a request per keystroke.
  useEffect(() => {
    if (studioQuery.trim().length < 2) {
      setStudioOptions([]);
      return;
    }

    let cancelled = false;
    setStudioLoading(true);

    const timer = setTimeout(async () => {
      try {
        const studios = await adminService.searchStudios(studioQuery.trim());
        if (!cancelled) setStudioOptions(studios);
      } catch {
        if (!cancelled) setStudioOptions([]);
      } finally {
        if (!cancelled) setStudioLoading(false);
      }
    }, 300);

    return () => {
      cancelled = true;
      clearTimeout(timer);
    };
  }, [studioQuery]);

  const addFiles = async (files: FileList | null) => {
    if (!files?.length) return;

    setError(null);
    setReading(true);

    const rejected: string[] = [];
    const accepted: PendingImage[] = [];

    for (const file of Array.from(files)) {
      if (!ACCEPTED.includes(file.type)) {
        rejected.push(file.name);
        continue;
      }

      accepted.push({
        content: await readAsBase64(file),
        mime: file.type,
        filename: file.name,
        size: file.size,
        preview: URL.createObjectURL(file),
      });
    }

    setImages(prev => [...prev, ...accepted].slice(0, MAX_IMAGES));
    setReading(false);

    if (rejected.length) {
      setError(`Skipped ${rejected.length} file(s) that are not images: ${rejected.join(', ')}`);
    }
  };

  const removeImage = (index: number) => {
    setImages(prev => prev.filter((_, i) => i !== index));
  };

  // The studio the artist named is often not on the platform yet. This creates
  // a stub so the affiliation can be recorded now; it stays unverified and
  // ownerless until somebody claims it.
  const createStudio = async () => {
    setError(null);
    setCreatingStudio(true);

    try {
      const created = await adminService.createStudio({
        name: newStudioName.trim(),
        location: newStudioLocation.trim() || null,
        location_lat_long: newStudioLatLong || null,
      });

      setStudio(created);
      setStudioOptions([created]);
      closeCreateStudio();
    } catch (err: any) {
      setError(err?.message || 'Could not create that studio. Please try again.');
    } finally {
      setCreatingStudio(false);
    }
  };

  const closeCreateStudio = () => {
    setNewStudioName('');
    setNewStudioLocation('');
    setNewStudioLatLong('');
  };

  const submit = async () => {
    setError(null);
    setResult(null);
    setLoading(true);

    try {
      const response = await adminService.onboardArtist({
        email: email.trim(),
        name: name.trim(),
        images: images.map(({ content, mime, filename, size }) => ({ content, mime, filename, size })),
        studio_id: studio?.id ?? null,
        location: location.trim() || null,
        location_lat_long: locationLatLong || null,
      });

      setResult(response);
      setEmail('');
      setName('');
      setStudio(null);
      setStudioQuery('');
      setLocation('');
      setLocationLatLong('');
      setImages([]);
    } catch (err: any) {
      setError(err?.message || 'Could not create that artist. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  const canSubmit = email.trim() !== '' && name.trim() !== '' && images.length > 0 && !loading && !reading;

  return (
    <Card sx={{ maxWidth: 900, m: 2 }}>
      <CardContent>
        <Typography variant="h5" gutterBottom>
          Onboard an artist
        </Typography>
        <Typography variant="body2" sx={{ mb: 3, color: 'text.secondary' }}>
          For artists who sent their work in directly. This creates a claimable account and emails
          them a temporary password. The images land in their review queue rather than going live,
          so nothing is published until it has been checked.
        </Typography>

        <Box sx={{ display: 'flex', gap: 2, mb: 3, flexWrap: 'wrap' }}>
          <TextField
            label="Artist email"
            type="email"
            value={email}
            onChange={e => setEmail(e.target.value)}
            sx={{ flex: '1 1 260px' }}
            required
          />
          <TextField
            label="Artist name"
            value={name}
            onChange={e => setName(e.target.value)}
            sx={{ flex: '1 1 260px' }}
            required
          />
        </Box>

        {/* The picker supplies coordinates alongside the address. A typed
            location without them leaves the artist out of proximity search and
            out of reach of users:backfill-timezones, so their bookings would
            sync to Google in UTC. */}
        <Box sx={{ mb: 3, maxWidth: 540 }}>
          <LocationAutocomplete
            value={location}
            onChange={(loc, latLong) => {
              setLocation(loc);
              setLocationLatLong(latLong);
            }}
            surface="light"
            label="Location (optional)"
            placeholder="Search for their city..."
            helperText={
              location && !locationLatLong
                ? 'No coordinates for that location, so search and timezone will not work'
                : 'Pick from the list so coordinates are captured too'
            }
          />
        </Box>

        <Autocomplete
          sx={{ mb: 3, maxWidth: 540 }}
          options={studioOptions}
          value={studio}
          loading={studioLoading}
          onChange={(_, value) => setStudio(value)}
          onInputChange={(_, value) => setStudioQuery(value)}
          getOptionLabel={option => option.name}
          isOptionEqualToValue={(option, value) => option.id === value.id}
          filterOptions={x => x}
          noOptionsText={
            studioQuery.trim().length < 2 ? (
              'Type to search studios'
            ) : (
              <Box>
                <Typography variant="body2" sx={{ mb: 1 }}>
                  No studios found
                </Typography>
                <Button
                  size="small"
                  variant="outlined"
                  onMouseDown={e => e.preventDefault()}
                  onClick={() => setNewStudioName(studioQuery.trim())}
                >
                  Add &quot;{studioQuery.trim()}&quot;
                </Button>
              </Box>
            )
          }
          renderInput={params => (
            <TextField
              {...params}
              label="Studio (optional)"
              helperText="Sends a join request the studio still has to confirm"
            />
          )}
        />

        {/* A studio the artist named that is not on the platform yet. Location
            is optional: an admin often knows the name and not the address, and
            a guessed address is worse than none. */}
        <Dialog open={newStudioName !== ''} onClose={closeCreateStudio} fullWidth maxWidth="sm">
          <DialogTitle>Add a studio</DialogTitle>
          <DialogContent>
            <Typography variant="body2" sx={{ mb: 2, color: 'text.secondary' }}>
              Creates an unverified studio with no owner. It becomes theirs when
              somebody from the studio claims it.
            </Typography>
            <TextField
              fullWidth
              label="Studio name"
              value={newStudioName}
              onChange={e => setNewStudioName(e.target.value)}
              sx={{ mb: 3, mt: 1 }}
              required
            />
            <LocationAutocomplete
              surface="light"
              value={newStudioLocation}
              onChange={(loc, latLong) => {
                setNewStudioLocation(loc);
                setNewStudioLatLong(latLong);
              }}
              label="Studio location (optional)"
              placeholder="Search for the studio's city..."
              helperText="Leave blank if you do not know it. Without coordinates the studio will not appear in search."
            />
          </DialogContent>
          <DialogActions>
            <Button onClick={closeCreateStudio}>Cancel</Button>
            <Button
              variant="contained"
              onClick={createStudio}
              disabled={newStudioName.trim() === '' || creatingStudio}
            >
              {creatingStudio ? <CircularProgress size={20} sx={{ mr: 1 }} /> : null}
              Create studio
            </Button>
          </DialogActions>
        </Dialog>

        <Button variant="outlined" component="label" disabled={reading}>
          {reading ? 'Reading files...' : 'Add images'}
          <input
            type="file"
            hidden
            multiple
            accept={ACCEPTED.join(',')}
            onChange={e => addFiles(e.target.files)}
          />
        </Button>

        {images.length > 0 && (
          <>
            <Typography variant="body2" sx={{ mt: 2, mb: 1 }}>
              {images.length} image{images.length === 1 ? '' : 's'} ready
              {images.length >= MAX_IMAGES ? ` (limit of ${MAX_IMAGES} reached)` : ''}
            </Typography>
            <Box sx={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(110px, 1fr))', gap: 1 }}>
              {images.map((image, index) => (
                <Box key={`${image.filename}-${index}`} sx={{ position: 'relative' }}>
                  <Box
                    component="img"
                    src={image.preview}
                    alt={image.filename}
                    sx={{ width: '100%', height: 110, objectFit: 'cover', borderRadius: 1 }}
                  />
                  <IconButton
                    size="small"
                    onClick={() => removeImage(index)}
                    sx={{
                      position: 'absolute',
                      top: 2,
                      right: 2,
                      bgcolor: 'rgba(0,0,0,0.6)',
                      color: '#fff',
                      '&:hover': { bgcolor: 'rgba(0,0,0,0.8)' },
                    }}
                  >
                    <DeleteIcon fontSize="small" />
                  </IconButton>
                </Box>
              ))}
            </Box>
          </>
        )}

        <Box sx={{ mt: 3 }}>
          <Button variant="contained" onClick={submit} disabled={!canSubmit}>
            {loading ? <CircularProgress size={20} sx={{ mr: 1 }} /> : null}
            Create artist page
          </Button>
        </Box>

        {error && (
          <Alert severity="error" sx={{ mt: 2 }} onClose={() => setError(null)}>
            {error}
          </Alert>
        )}

        {result && (
          <Alert severity="success" sx={{ mt: 2 }} onClose={() => setResult(null)}>
            {result.is_new_account
              ? `Created ${result.artist.name} and emailed their temporary password.`
              : `${result.artist.name} already had an account, so the images were added to it.`}{' '}
            {result.studio ? `Join request sent to ${result.studio.name}. ` : ''}
            {result.images_saved} of {result.images_submitted} image(s) saved to their review queue.{' '}
            <a href={`#/users/${result.artist.id}`}>Open their profile</a>
          </Alert>
        )}
      </CardContent>
    </Card>
  );
};

export default OnboardArtistPanel;
