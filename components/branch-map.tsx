'use client';

import { useEffect, useState, useRef } from 'react';

/**
 * Props for the BranchMap component
 */
export interface BranchMapProps {
  branchName: string;      // Branch name for ARIA labels and display
  location: string | null;  // Address string to geocode
  branchId: string;         // Unique identifier for caching
}

/**
 * Status of the map component
 */
type MapStatus = 'loading' | 'success' | 'no-location';

/**
 * LoadingState Component
 * Displays animated loading indicator
 */
function LoadingState({ branchName }: { branchName: string }) {
  return (
    <div 
      className="h-40 w-full flex items-center justify-center bg-brand-green/10"
      role="status"
      aria-live="polite"
      aria-label={`Loading map for ${branchName}`}
    >
      <div className="flex flex-col items-center gap-2">
        <div className="h-8 w-8 animate-spin rounded-full border-4 border-brand-gold border-t-transparent" />
        <span className="text-sm font-semibold text-brand-green/60">Loading map...</span>
      </div>
    </div>
  );
}

/**
 * FallbackView Component
 * Displays when no location data is available
 */
function FallbackView() {
  return (
    <div className="h-40 w-full flex items-center justify-center bg-brand-green/5 border border-brand-green/20">
      <span className="text-sm font-semibold text-brand-green/60">
        Location information unavailable
      </span>
    </div>
  );
}

/**
 * BranchMap Component
 * 
 * Displays branch location with a static map preview that links to Google Maps.
 * 
 * Features:
 * - Static map preview using Google Maps Static API
 * - Clickable to open full interactive map
 * - Loading and fallback states
 * - Responsive design
 */
export function BranchMap({ branchName, location }: BranchMapProps) {
  const [status, setStatus] = useState<MapStatus>('loading');
  const [imageError, setImageError] = useState(false);
  const loadingTimeoutRef = useRef<NodeJS.Timeout | null>(null);
  
  useEffect(() => {
    // Check for missing location
    if (!location || location.trim().length === 0) {
      setStatus('no-location');
      return;
    }
    
    // Simulate minimum loading time for smooth UX (500ms)
    loadingTimeoutRef.current = setTimeout(() => {
      setStatus('success');
    }, 500);
    
    return () => {
      if (loadingTimeoutRef.current) {
        clearTimeout(loadingTimeoutRef.current);
      }
    };
  }, [location]);
  
  // Render based on status
  if (status === 'no-location') {
    return <FallbackView />;
  }
  
  if (status === 'loading') {
    return <LoadingState branchName={branchName} />;
  }
  
  // Success state - render static map preview with link
  const mapQuery = encodeURIComponent(location);
  const googleMapsUrl = `https://www.google.com/maps/search/?api=1&query=${mapQuery}`;
  
  // Google Maps Static API - generates a static map image
  // Format: https://maps.googleapis.com/maps/api/staticmap?parameters
  // For free usage without API key, we'll use a workaround with OpenStreetMap static map
  const staticMapUrl = `https://staticmap.openstreetmap.de/staticmap.php?center=${mapQuery}&zoom=15&size=600x300&markers=${mapQuery}`;
  
  // Fallback if image fails to load
  if (imageError) {
    return (
      <a
        href={googleMapsUrl}
        target="_blank"
        rel="noopener noreferrer"
        className="h-40 w-full relative overflow-hidden bg-gradient-to-br from-brand-green to-brand-green/80 flex items-center justify-center group hover:from-brand-green/90 hover:to-brand-green/70 transition-all cursor-pointer"
        role="img"
        aria-label={`Map showing ${branchName} at ${location}. Click to open in Google Maps.`}
      >
        <div className="flex flex-col items-center gap-2 text-white">
          <svg 
            className="h-12 w-12 text-brand-gold group-hover:scale-110 transition-transform" 
            viewBox="0 0 24 24" 
            fill="currentColor"
          >
            <path d="M12 2C8.13 2 5 5.13 5 9c0 5.25 7 13 7 13s7-7.75 7-13c0-3.87-3.13-7-7-7zm0 9.5c-1.38 0-2.5-1.12-2.5-2.5s1.12-2.5 2.5-2.5 2.5 1.12 2.5 2.5-1.12 2.5-2.5 2.5z"/>
          </svg>
          <div className="text-center px-4">
            <p className="text-sm font-bold text-white">View on Map</p>
            <p className="text-xs text-white/80 mt-1">Click to open Google Maps</p>
          </div>
        </div>
      </a>
    );
  }
  
  return (
    <a
      href={googleMapsUrl}
      target="_blank"
      rel="noopener noreferrer"
      className="h-40 w-full relative overflow-hidden block group cursor-pointer"
      role="img"
      aria-label={`Map preview showing ${branchName} at ${location}. Click to open in Google Maps.`}
    >
      {/* Static map image */}
      <img
        src={staticMapUrl}
        alt={`Map of ${branchName}`}
        className="h-full w-full object-cover transition-transform group-hover:scale-105"
        onError={() => setImageError(true)}
        loading="lazy"
      />
      
      {/* Overlay with hover effect */}
      <div className="absolute inset-0 bg-black/0 group-hover:bg-black/20 transition-colors flex items-center justify-center">
        <div className="opacity-0 group-hover:opacity-100 transition-opacity bg-white/95 px-4 py-2 rounded-lg shadow-lg">
          <p className="text-sm font-bold text-brand-green">Click to open in Google Maps</p>
        </div>
      </div>
    </a>
  );
}
