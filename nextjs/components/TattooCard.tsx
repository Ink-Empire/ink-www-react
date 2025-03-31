import React from 'react';
import Link from 'next/link';
import Image from 'next/image';
import { TattooType } from '../models/tattoo.interface';

interface TattooCardProps {
  tattoo: any; // Using any for now as the tattoo JSON doesn't match the interface exactly
}

const TattooCard: React.FC<TattooCardProps> = ({ tattoo }) => {

  // Log image info for debugging
  console.log('Tattoo data:', tattoo);

  // Determine the image URI from either primary_image or image
  const imageUri = tattoo.primary_image?.uri || tattoo.image?.uri;
  
  return (
    <div className="tattoo-card">
      <Link href={`/tattoos/${tattoo.id}`}>
        <div className="tattoo-card-inner">
          {imageUri && (
            <div className="tattoo-image-container">
              <Image 
                src={imageUri}
                alt={tattoo.title || 'Tattoo'} 
                width={200}
                height={200}
                className="tattoo-thumbnail"
              />
            </div>
          )}
          <div className="tattoo-info">
            <h3>{tattoo.title}</h3>
            <p className="shop">{tattoo?.studio?.name}</p>

            {tattoo.artist && <p className="artist">{tattoo.artist.name}</p>}
            {tattoo.styles && tattoo.styles.length > 0 && (
                <div className="styles">
                  {tattoo.styles.map((style, index) => {
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

export default TattooCard;