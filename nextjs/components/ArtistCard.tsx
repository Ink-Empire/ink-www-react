import React from 'react';
import Link from 'next/link';
import Image from 'next/image';
import { ArtistType } from '../models/artist.interface';

interface ArtistCardProps {
  artist: ArtistType;
}

const ArtistCard: React.FC<ArtistCardProps> = ({ artist }) => {
  return (
    <div className="artist-card">
      <Link href={`/artists/${artist.id}`}>
        <div className="artist-card-inner">
          {artist.primary_image && (
            <div className="artist-image">
              <Image 
                src={artist.primary_image.uri}
                alt={artist.name || 'Artist'} 
                width={150}
                height={150}
                className="rounded-image"
              />
            </div>
          )}
          <div className="artist-info">
            <h3>{artist.name}</h3>
            <p className="shop">{artist.shop}</p>
            {artist.location && <p className="location">{artist.location}</p>}
            {artist.styles && artist.styles.length > 0 && (
              <div className="styles">
                {artist.styles.map((style, index) => {
                  // Handle both string styles and object styles
                  const styleText = typeof style === 'string' 
                    ? style 
                    : style && typeof style === 'object' && 'name' in style
                      ? style.name
                      : '';
                  
                  return styleText ? (
                    <span key={index} className="style-tag">{styleText}</span>
                  ) : null;
                })}
              </div>
            )}
          </div>
        </div>
      </Link>
    </div>
  );
};

export default ArtistCard;