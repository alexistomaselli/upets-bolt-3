import React from 'react';

interface AFPetsLogoProps {
  className?: string;
  alt?: string;
}

export const AFPetsLogo: React.FC<AFPetsLogoProps> = ({ 
  className = "h-9 w-auto", 
  alt = "AFPets Logo" 
}) => {
  return (
    <img 
      src="/afpets-7.webp" 
      alt={alt} 
      className={className}
      onError={(e) => {
        console.error('Logo failed to load');
        e.currentTarget.style.display = 'none';
      }}
    />
  );
};