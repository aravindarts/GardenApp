/**
 * Curated high-resolution online botanical photography dataset (Unsplash CDN)
 * with an instant self-contained SVG fallback guard so broken images never occur.
 */

function toSvgDataUri(svg: string): string {
  return `data:image/svg+xml;utf8,${encodeURIComponent(
    svg.replace(/\s+/g, ' ').trim()
  )}`;
}

/**
 * Guaranteed offline/fallback botanical canvas if an external URL ever fails.
 */
export const BOTANICAL_FALLBACK_SVG_URI = toSvgDataUri(`
  <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 800 600" width="800" height="600">
    <defs>
      <linearGradient id="bg" x1="0" y1="0" x2="1" y2="1">
        <stop offset="0%" stop-color="#F4F0EA"/>
        <stop offset="100%" stop-color="#E5DEC9"/>
      </linearGradient>
    </defs>
    <rect width="800" height="600" fill="url(#bg)"/>
    <rect y="470" width="800" height="130" fill="#DDD3C0"/>
    <ellipse cx="400" cy="490" rx="140" ry="20" fill="#C4B8A2"/>
    <path d="M 330 350 L 470 350 L 450 490 L 350 490 Z" fill="#D97757"/>
    <rect x="322" y="336" width="156" height="20" rx="8" fill="#C26345"/>
    <path d="M 400 340 Q 350 240 270 190" stroke="#1B4332" stroke-width="10" fill="none" stroke-linecap="round"/>
    <path d="M 400 340 Q 450 230 530 180" stroke="#1B4332" stroke-width="10" fill="none" stroke-linecap="round"/>
    <path d="M 400 340 L 400 140" stroke="#1B4332" stroke-width="11" fill="none" stroke-linecap="round"/>
    <ellipse cx="270" cy="185" rx="75" ry="52" transform="rotate(-24 270 185)" fill="#1B4332"/>
    <ellipse cx="530" cy="175" rx="75" ry="52" transform="rotate(24 530 175)" fill="#2D6A4F"/>
    <ellipse cx="400" cy="135" rx="82" ry="58" fill="#1B4332"/>
  </svg>
`);

export const CURATED_BOTANICAL_FALLBACK_URL =
  'https://images.unsplash.com/photo-1545241047-6083a3684587?auto=format&fit=crop&w=900&q=85';

export const STUDIO_VISUALS = {
  // 9. Hero Banner Background (Sunlit Indoor Jungle)
  heroConservatory:
    'https://images.unsplash.com/photo-1466781783364-36c955e42a7f?auto=format&fit=crop&w=1600&q=85',

  // 1. Monstera Deliciosa (Swiss Cheese Plant)
  monsteraPrimary:
    'https://images.unsplash.com/photo-1614594975525-e45190c55d0b?auto=format&fit=crop&w=900&q=85',
  monsteraSecondary:
    'https://images.unsplash.com/photo-1545241047-6083a3684587?auto=format&fit=crop&w=900&q=85',

  // 2. Fiddle Leaf Fig (Ficus Lyrata - Statement Tree)
  fiddleFigPrimary:
    'https://images.unsplash.com/photo-1597055181300-e3633a917c9c?auto=format&fit=crop&w=900&q=85',
  fiddleFigSecondary:
    'https://images.unsplash.com/photo-1509423350716-97f9360b4e09?auto=format&fit=crop&w=900&q=85',

  // 3. Sansevieria Laurentii (Air-Purifying Snake Plant)
  snakePlantPrimary:
    'https://images.unsplash.com/photo-1593482892290-f54927ae1bb6?auto=format&fit=crop&w=900&q=85',
  snakePlantSecondary:
    'https://images.unsplash.com/photo-1572688484438-313a6e50c333?auto=format&fit=crop&w=900&q=85',

  // 4. Mediterranean Olive Tree (UAE Sun & Patio Favorite)
  oliveTreePrimary:
    'https://images.unsplash.com/photo-1512428813834-c702c7702b78?auto=format&fit=crop&w=900&q=85',
  oliveTreeSecondary:
    'https://images.unsplash.com/photo-1463936575829-25148e1db1b8?auto=format&fit=crop&w=900&q=85',

  // 5. Calathea Orbifolia (Pet-Safe Prayer Plant)
  calatheaPrimary:
    'https://images.unsplash.com/photo-1600411833196-7c1f6b1a8b90?auto=format&fit=crop&w=900&q=85',
  calatheaSecondary:
    'https://images.unsplash.com/photo-1520412099551-62b6bafeb5bb?auto=format&fit=crop&w=900&q=85',

  // 6. ZZ Raven & Emerald Plant (Low-Light Survivor)
  zzPlantPrimary:
    'https://images.unsplash.com/photo-1632207691143-643e2a9a9361?auto=format&fit=crop&w=900&q=85',
  zzPlantSecondary:
    'https://images.unsplash.com/photo-1485955900006-10f4d324d411?auto=format&fit=crop&w=900&q=85',

  // 7. Handcrafted Matte Terracotta & Ceramic Planter Set
  terracottaPotPrimary:
    'https://images.unsplash.com/photo-1459411552884-841db9b3cc2a?auto=format&fit=crop&w=900&q=85',
  terracottaPotSecondary:
    'https://images.unsplash.com/photo-1509223197845-458d87318791?auto=format&fit=crop&w=900&q=85',

  // 8. White Phalaenopsis Orchid in Ceramic Pot
  orchidPrimary:
    'https://images.unsplash.com/photo-1566907225472-514215c9e5cd?auto=format&fit=crop&w=900&q=85',
  orchidSecondary:
    'https://images.unsplash.com/photo-1525310072745-f49212b5ac6d?auto=format&fit=crop&w=900&q=85',

  // Legacy aliases for add-on kits
  desertRosePrimary:
    'https://images.unsplash.com/photo-1566907225472-514215c9e5cd?auto=format&fit=crop&w=900&q=85',
  desertRoseSecondary:
    'https://images.unsplash.com/photo-1525310072745-f49212b5ac6d?auto=format&fit=crop&w=900&q=85',
  soilAndCarePrimary:
    'https://images.unsplash.com/photo-1459411552884-841db9b3cc2a?auto=format&fit=crop&w=900&q=85',
  soilAndCareSecondary:
    'https://images.unsplash.com/photo-1509223197845-458d87318791?auto=format&fit=crop&w=900&q=85',
};

/**
 * Generates a 4-image PDP gallery for any product:
 * 1. Studio Specimen (primaryImage)
 * 2. Sunlit Room View (secondaryImage)
 * 3. Leaf / Foliage Macro Texture Crop
 * 4. Ceramic Planter & Substrate Detail Crop
 */
export function buildProductGalleryImages(
  primaryImage: string,
  secondaryImage: string
): Array<{
  url: string;
  label: string;
  caption: string;
  focalClass?: string;
}> {
  const leafMacroUrl = primaryImage.includes('images.unsplash.com')
    ? `${primaryImage.split('?')[0]}?auto=format&fit=crop&w=1200&q=90&fp-x=0.5&fp-y=0.32&fp-z=1.35`
    : primaryImage;

  const potDetailUrl = secondaryImage.includes('images.unsplash.com')
    ? `${secondaryImage.split('?')[0]}?auto=format&fit=crop&w=1200&q=90&fp-x=0.5&fp-y=0.72&fp-z=1.3`
    : secondaryImage;

  return [
    {
      url: primaryImage,
      label: 'Studio Specimen',
      caption: 'Full nursery specimen in handcrafted planter',
    },
    {
      url: secondaryImage,
      label: 'View in Room',
      caption: 'Styled in a sunlit modern UAE residence',
    },
    {
      url: leafMacroUrl,
      label: 'Leaf Texture Close-Up',
      caption: 'High-definition foliage health & venation detail',
    },
    {
      url: potDetailUrl,
      label: 'Planter & Soil Detail',
      caption: 'Breathable ceramic vessel & organic aroid substrate',
    },
  ];
}
