import React, { useEffect, useState } from 'react';
import { ZoomIn } from 'lucide-react';
import {
  BOTANICAL_FALLBACK_SVG_URI,
  CURATED_BOTANICAL_FALLBACK_URL,
} from '../utils/studioVisuals';

interface SmartPlantImageProps {
  primaryImage: string;
  secondaryImage?: string;
  alt: string;
  isHoveredExternal?: boolean;
  showRoomViewPill?: boolean;
  enableMagnifier?: boolean;
  aspectClassName?: string;
  className?: string;
  onClick?: () => void;
  testIdPrefix?: string;
}

export const SmartPlantImage: React.FC<SmartPlantImageProps> = ({
  primaryImage,
  secondaryImage,
  alt,
  isHoveredExternal,
  showRoomViewPill = true,
  enableMagnifier = false,
  aspectClassName = 'aspect-[4/3]',
  className = '',
  onClick,
  testIdPrefix = 'smart-plant-img',
}) => {
  const [primarySrc, setPrimarySrc] = useState(primaryImage);
  const [secondarySrc, setSecondarySrc] = useState(
    secondaryImage || primaryImage
  );
  const [primaryLoaded, setPrimaryLoaded] = useState(false);
  const [secondaryLoaded, setSecondaryLoaded] = useState(false);

  const [internalHovered, setInternalHovered] = useState(false);
  const [roomViewToggled, setRoomViewToggled] = useState(false);
  const [touchStartX, setTouchStartX] = useState<number | null>(null);

  // Interactive Magnifying Loupe / Hover Zoom state for PDP
  const [isMagnifying, setIsMagnifying] = useState(false);
  const [zoomOrigin, setZoomOrigin] = useState({ x: 50, y: 50 });

  useEffect(() => {
    setPrimarySrc(primaryImage);
    setPrimaryLoaded(false);
  }, [primaryImage]);

  useEffect(() => {
    setSecondarySrc(secondaryImage || primaryImage);
    setSecondaryLoaded(false);
  }, [secondaryImage, primaryImage]);

  const handlePrimaryError = () => {
    if (primarySrc !== CURATED_BOTANICAL_FALLBACK_URL && primarySrc !== BOTANICAL_FALLBACK_SVG_URI) {
      setPrimarySrc(CURATED_BOTANICAL_FALLBACK_URL);
    } else if (primarySrc !== BOTANICAL_FALLBACK_SVG_URI) {
      setPrimarySrc(BOTANICAL_FALLBACK_SVG_URI);
      setPrimaryLoaded(true);
    }
  };

  const handleSecondaryError = () => {
    if (
      secondarySrc !== CURATED_BOTANICAL_FALLBACK_URL &&
      secondarySrc !== BOTANICAL_FALLBACK_SVG_URI
    ) {
      setSecondarySrc(CURATED_BOTANICAL_FALLBACK_URL);
    } else if (secondarySrc !== BOTANICAL_FALLBACK_SVG_URI) {
      setSecondarySrc(BOTANICAL_FALLBACK_SVG_URI);
      setSecondaryLoaded(true);
    }
  };

  const hasSecondary = Boolean(secondaryImage && secondaryImage !== primaryImage);
  const isHovered =
    typeof isHoveredExternal === 'boolean' ? isHoveredExternal : internalHovered;
  const showSecondary =
    hasSecondary && !enableMagnifier && (isHovered || roomViewToggled);

  const handleMouseMove = (e: React.MouseEvent<HTMLDivElement>) => {
    if (!enableMagnifier) return;
    const rect = e.currentTarget.getBoundingClientRect();
    const x = Math.min(100, Math.max(0, ((e.clientX - rect.left) / rect.width) * 100));
    const y = Math.min(100, Math.max(0, ((e.clientY - rect.top) / rect.height) * 100));
    setZoomOrigin({ x, y });
  };

  return (
    <div
      onClick={onClick}
      onMouseEnter={() => {
        setInternalHovered(true);
        if (enableMagnifier) setIsMagnifying(true);
      }}
      onMouseLeave={() => {
        setInternalHovered(false);
        if (enableMagnifier) setIsMagnifying(false);
      }}
      onMouseMove={handleMouseMove}
      onTouchStart={(e) => {
        if (e.touches.length === 1) {
          setTouchStartX(e.touches[0].clientX);
        }
      }}
      onTouchEnd={(e) => {
        if (touchStartX !== null && e.changedTouches.length === 1) {
          const deltaX = e.changedTouches[0].clientX - touchStartX;
          if (Math.abs(deltaX) > 35 && hasSecondary) {
            setRoomViewToggled((prev) => !prev);
          }
        }
        setTouchStartX(null);
      }}
      data-testid={testIdPrefix}
      className={`relative w-full overflow-hidden bg-[#ECE7DF] ${aspectClassName} ${
        enableMagnifier ? 'cursor-zoom-in' : onClick ? 'cursor-pointer' : ''
      } ${className}`}
    >
      {/* Blur-Up Botanical Sage/Sand Shimmer Loader while image downloads */}
      {!primaryLoaded && (
        <div
          aria-hidden="true"
          className="absolute inset-0 z-0 animate-pulse bg-emerald-950/10 backdrop-blur-xs"
        />
      )}

      {/* Primary Studio / Specimen Image */}
      <img
        src={primarySrc}
        alt={alt}
        referrerPolicy="no-referrer"
        onLoad={() => setPrimaryLoaded(true)}
        onError={handlePrimaryError}
        style={
          enableMagnifier && isMagnifying
            ? {
                transformOrigin: `${zoomOrigin.x}% ${zoomOrigin.y}%`,
                transform: 'scale(2.15)',
              }
            : undefined
        }
        className={`h-full w-full object-cover transition-all duration-500 ease-out ${
          !enableMagnifier ? 'group-hover:scale-105' : ''
        } ${
          primaryLoaded
            ? showSecondary
              ? 'opacity-0'
              : 'opacity-100'
            : 'opacity-0 scale-102 blur-xs'
        }`}
      />

      {/* Secondary "View in Room" Lifestyle Photo Crossfade */}
      {hasSecondary && !enableMagnifier && (
        <img
          src={secondarySrc}
          alt={`${alt} styled in sunlit room`}
          referrerPolicy="no-referrer"
          onLoad={() => setSecondaryLoaded(true)}
          onError={handleSecondaryError}
          className={`absolute inset-0 h-full w-full object-cover transition-all duration-500 ease-out group-hover:scale-105 ${
            showSecondary && (secondaryLoaded || primaryLoaded)
              ? 'opacity-100 scale-105'
              : 'opacity-0 scale-100'
          }`}
        />
      )}

      {/* Interactive "View in Room" Pill (Desktop Hover Indicator + Mobile Tap Toggle) */}
      {showRoomViewPill && hasSecondary && !enableMagnifier && (
        <button
          type="button"
          onClick={(e) => {
            e.stopPropagation();
            setRoomViewToggled((prev) => !prev);
          }}
          data-testid={`${testIdPrefix}-room-pill`}
          aria-label="Toggle Room View photo"
          className="absolute bottom-3 right-3 z-20 inline-flex items-center gap-1 rounded-full backdrop-blur-md bg-white/80 border border-white/60 px-2.5 py-1 text-xs font-medium text-[#0F172A] shadow-xs transition-all duration-300 group-hover:bottom-13 hover:bg-white/95 cursor-pointer"
        >
          <span>
            {showSecondary ? '✨ Room View' : '✨ Hover for Room View'}
          </span>
        </button>
      )}

      {/* Interactive Magnifying Loupe Indicator for PDP Main Gallery */}
      {enableMagnifier && (
        <div
          data-testid="pdp-magnifier-badge"
          className="pointer-events-none absolute top-3.5 right-3.5 z-10 inline-flex items-center gap-1.5 rounded-full backdrop-blur-md bg-white/80 border border-[#E5E0D8] px-3 py-1 text-[11px] font-medium text-[#1B4332] shadow-xs"
        >
          <ZoomIn className="h-3.5 w-3.5 text-[#1B4332]" />
          <span>
            {isMagnifying
              ? `Magnifying Leaf & Pot (${Math.round(zoomOrigin.x)}%, ${Math.round(zoomOrigin.y)}%)`
              : 'Hover to Magnify Leaf & Pot Texture'}
          </span>
        </div>
      )}
    </div>
  );
};
