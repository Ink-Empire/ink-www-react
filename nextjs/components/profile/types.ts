import CameraAltIcon from '@mui/icons-material/CameraAlt';
import PersonIcon from '@mui/icons-material/Person';
import LocationOnIcon from '@mui/icons-material/LocationOn';
import HomeIcon from '@mui/icons-material/Home';
import StarIcon from '@mui/icons-material/Star';
import AccessTimeIcon from '@mui/icons-material/AccessTime';
import EventIcon from '@mui/icons-material/Event';
import BrandingWatermarkIcon from '@mui/icons-material/BrandingWatermark';
import PublicIcon from '@mui/icons-material/Public';

// Navigation items for sidebar
export const navItems = [
  { id: 'photo', label: 'Photo', icon: CameraAltIcon },
  { id: 'about', label: 'About', icon: PersonIcon },
  { id: 'location', label: 'Location', icon: HomeIcon },
  { id: 'studio', label: 'Studio', icon: LocationOnIcon },
  { id: 'styles', label: 'Styles', icon: StarIcon },
  { id: 'hours', label: 'Hours', icon: AccessTimeIcon },
  { id: 'booking', label: 'Booking & Rates', icon: EventIcon },
  { id: 'watermark', label: 'Watermark', icon: BrandingWatermarkIcon },
  { id: 'travel', label: 'Travel', icon: PublicIcon, badge: 'Coming Soon' },
];
