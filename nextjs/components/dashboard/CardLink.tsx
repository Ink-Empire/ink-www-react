import React from 'react';
import Link from 'next/link';
import { Typography } from '@mui/material';
import { colors } from '@/styles/colors';

interface CardLinkProps {
  href: string;
  children: React.ReactNode;
}

export function CardLink({ href, children }: CardLinkProps) {
  return (
    <Link href={href} style={{ textDecoration: 'none' }}>
      <Typography sx={{
        fontSize: '0.85rem',
        color: colors.accent,
        '&:hover': { textDecoration: 'underline' }
      }}>
        {children}
      </Typography>
    </Link>
  );
}

export default CardLink;
