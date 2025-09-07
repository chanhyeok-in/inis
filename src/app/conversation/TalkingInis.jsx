'use client'

import { default as NextImage } from 'next/image'

export default function TalkingInis({ imageUrl }) {
  const animationName = 'pulse';
  const keyframes = `
    @keyframes ${animationName} {
      0% { transform: scale(1); }
      50% { transform: scale(1.05); }
      100% { transform: scale(1); }
    }
  `;

  return (
    <>
      <style>{keyframes}</style>
      <div style={{
        display: 'inline-block',
        animation: `${animationName} 2s infinite`
      }}>
        <NextImage
          src={imageUrl}
          alt="My Character"
          width={150}
          height={150}
          priority
          style={{ borderRadius: '8px' }}
        />
      </div>
    </>
  );
}
