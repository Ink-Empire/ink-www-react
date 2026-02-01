import React from 'react';
import { Box, IconButton, Tooltip } from '@mui/material';
import InstagramIcon from '@mui/icons-material/Instagram';
import FacebookIcon from '@mui/icons-material/Facebook';
import XIcon from '@mui/icons-material/X';
import { colors } from '../styles/colors';

interface SocialMediaLink {
  platform: string;
  username: string;
  url: string;
}

interface SocialMediaIconsProps {
  links: SocialMediaLink[];
  size?: 'small' | 'medium' | 'large';
}

const BlueskyIcon = ({ size = 20 }: { size?: number }) => (
  <svg width={size} height={size} viewBox="0 0 24 24" fill="currentColor">
    <path d="M12 10.8c-1.087-2.114-4.046-6.053-6.798-7.995C2.566.944 1.561 1.266.902 1.565.139 1.908 0 3.08 0 3.768c0 .69.378 5.65.624 6.479.815 2.736 3.713 3.66 6.383 3.364.136-.02.275-.039.415-.056-.138.022-.276.04-.415.056-3.912.58-7.387 2.005-2.83 7.078 5.013 5.19 6.87-1.113 7.823-4.308.953 3.195 2.05 9.271 7.733 4.308 4.267-4.308 1.172-6.498-2.74-7.078a8.741 8.741 0 0 1-.415-.056c.14.017.279.036.415.056 2.67.297 5.568-.628 6.383-3.364.246-.828.624-5.79.624-6.478 0-.69-.139-1.861-.902-2.206-.659-.298-1.664-.62-4.3 1.24C16.046 4.748 13.087 8.687 12 10.8Z" />
  </svg>
);

const TikTokIcon = ({ size = 20 }: { size?: number }) => (
  <svg width={size} height={size} viewBox="0 0 24 24" fill="currentColor">
    <path d="M19.59 6.69a4.83 4.83 0 0 1-3.77-4.25V2h-3.45v13.67a2.89 2.89 0 0 1-5.2 1.74 2.89 2.89 0 0 1 2.31-4.64 2.93 2.93 0 0 1 .88.13V9.4a6.84 6.84 0 0 0-1-.05A6.33 6.33 0 0 0 5 20.1a6.34 6.34 0 0 0 10.86-4.43v-7a8.16 8.16 0 0 0 4.77 1.52v-3.4a4.85 4.85 0 0 1-1-.1z" />
  </svg>
);

const platformConfig: Record<string, {
  icon: React.ReactNode;
  label: string;
  color: string;
}> = {
  instagram: {
    icon: <InstagramIcon />,
    label: 'Instagram',
    color: '#E4405F',
  },
  facebook: {
    icon: <FacebookIcon />,
    label: 'Facebook',
    color: '#1877F2',
  },
  x: {
    icon: <XIcon />,
    label: 'X (Twitter)',
    color: '#000000',
  },
  bluesky: {
    icon: <BlueskyIcon />,
    label: 'Bluesky',
    color: '#0085FF',
  },
  tiktok: {
    icon: <TikTokIcon />,
    label: 'TikTok',
    color: '#000000',
  },
};

const sizeMap = {
  small: { button: 32, icon: 18 },
  medium: { button: 40, icon: 24 },
  large: { button: 48, icon: 28 },
};

export const SocialMediaIcons: React.FC<SocialMediaIconsProps> = ({
  links,
  size = 'medium'
}) => {
  if (!links || links.length === 0) {
    return null;
  }

  const dimensions = sizeMap[size];

  return (
    <Box sx={{ display: 'flex', gap: 1, alignItems: 'center' }}>
      {links.map((link) => {
        const config = platformConfig[link.platform];
        if (!config) return null;

        return (
          <Tooltip key={link.platform} title={`${config.label}: @${link.username}`}>
            <IconButton
              component="a"
              href={link.url}
              target="_blank"
              rel="noopener noreferrer"
              sx={{
                width: dimensions.button,
                height: dimensions.button,
                color: colors.textMuted,
                '&:hover': {
                  color: config.color,
                  backgroundColor: `${config.color}10`,
                },
                '& svg': {
                  fontSize: dimensions.icon,
                },
              }}
            >
              {link.platform === 'bluesky' ? (
                <BlueskyIcon size={dimensions.icon} />
              ) : link.platform === 'tiktok' ? (
                <TikTokIcon size={dimensions.icon} />
              ) : (
                config.icon
              )}
            </IconButton>
          </Tooltip>
        );
      })}
    </Box>
  );
};

export default SocialMediaIcons;
