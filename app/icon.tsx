import { ImageResponse } from 'next/og';

export const size = { width: 192, height: 192 };
export const contentType = 'image/png';

export default function Icon() {
  return new ImageResponse(
    (
      <div
        style={{
          width: 192,
          height: 192,
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          background: 'white',
          borderRadius: 32,
        }}
      >
        <svg width="120" height="120" viewBox="0 0 44 48" xmlns="http://www.w3.org/2000/svg">
          <rect x="2" y="2" width="30" height="38" rx="5" fill="#2DB34A" opacity="0.12"/>
          <rect x="2" y="2" width="30" height="38" rx="5" fill="none" stroke="#2DB34A" strokeWidth="2"/>
          <line x1="9" y1="14" x2="25" y2="14" stroke="#2DB34A" strokeWidth="2" strokeLinecap="round"/>
          <line x1="9" y1="20" x2="25" y2="20" stroke="#2DB34A" strokeWidth="2" strokeLinecap="round"/>
          <line x1="9" y1="26" x2="18" y2="26" stroke="#2DB34A" strokeWidth="2" strokeLinecap="round"/>
          <circle cx="28" cy="35" r="9" fill="#2DB34A"/>
          <polyline points="23.5,35 27,38.5 33,30" fill="none" stroke="white" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
        </svg>
      </div>
    ),
    { ...size }
  );
}
