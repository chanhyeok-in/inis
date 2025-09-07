'use client'

import { useState, useEffect } from 'react'
import { default as NextImage } from 'next/image'

export default function AnimatedInis({ imageUrl }) {
  const frameSize = 150;
  const imageSize = 100;
  const [position, setPosition] = useState({ x: 25, y: 25 }); // Start in the middle

  useEffect(() => {
    const interval = setInterval(() => {
      const newX = Math.random() * (frameSize - imageSize);
      const newY = Math.random() * (frameSize - imageSize);
      setPosition({ x: newX, y: newY });
    }, 2000);

    return () => clearInterval(interval);
  }, []);

  return (
    <div style={{
      position: 'relative',
      width: `${frameSize}px`,
      height: `${frameSize}px`,
      border: '1px solid #ccc',
      borderRadius: '8px',
      overflow: 'hidden'
    }}>
      <NextImage
        src={imageUrl}
        alt="My Character"
        width={imageSize}
        height={imageSize}
        priority
        style={{
          position: 'absolute',
          top: `${position.y}px`,
          left: `${position.x}px`,
          transition: 'top 2s ease-in-out, left 2s ease-in-out',
        }}
      />
    </div>
  );
}
