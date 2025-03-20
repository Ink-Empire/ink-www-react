import React from 'react';
import Link from 'next/link';
import Image from 'next/image';
import { TattooType } from '../models/tattoo.interface';

interface TattooCardProps {
  tattoo: any; // Using any for now as the tattoo JSON doesn't match the interface exactly
}

const TattooCard: React.FC<TattooCardProps> = ({ tattoo }) => {
  return (
    <div className="tattoo-card">
      <Link href={`/tattoos/${tattoo.id}`}>
        <div className="tattoo-card-inner">
          {tattoo.image && (
            <div className="tattoo-image-container">
              <Image 
                src={tattoo.image.uri} 
                alt={tattoo.title || 'Tattoo'} 
                width={200}
                height={200}
                className="tattoo-thumbnail"
              />
            </div>
          )}
          <div className="tattoo-info">
            <h3>{tattoo.title}</h3>
            <p className="shop">{tattoo.shopName}</p>
            {tattoo.artist && <p className="artist">By {tattoo.artist.name}</p>}
            {tattoo.styles && tattoo.styles.length > 0 && (
              <div className="styles">
                {tattoo.styles.slice(0, 3).map((style: string, index: number) => (
                  <span key={index} className="style-tag">{style}</span>
                ))}
                {tattoo.styles.length > 3 && <span className="more-styles">+{tattoo.styles.length - 3} more</span>}
              </div>
            )}
          </div>
        </div>
      </Link>
    </div>
  );
};

export default TattooCard;