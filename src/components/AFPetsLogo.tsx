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
        console.error('Error loading AFPets logo');
        // Fallback to text if image fails to load
        e.currentTarget.style.display = 'none';
        const parent = e.currentTarget.parentElement;
        if (parent && !parent.querySelector('.logo-fallback')) {
          const fallback = document.createElement('span');
          fallback.className = 'logo-fallback text-2xl font-bold text-green-600';
          fallback.textContent = 'AFPets';
          parent.appendChild(fallback);
        }
      }}
    />
  );
};