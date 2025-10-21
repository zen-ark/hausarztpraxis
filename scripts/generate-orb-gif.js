const fs = require('fs');
const path = require('path');

// Create a simple animated GIF using canvas and gifencoder
// This is a simplified version - in practice you'd use a library like gifencoder

const createOrbGif = () => {
  // For now, let's create a simple animated SVG that can be converted to GIF
  const svgContent = `
<svg width="32" height="32" viewBox="0 0 32 32" xmlns="http://www.w3.org/2000/svg">
  <defs>
    <radialGradient id="orbGradient" cx="50%" cy="50%" r="50%">
      <stop offset="0%" style="stop-color:#2F86D1;stop-opacity:1" />
      <stop offset="70%" style="stop-color:#1E5A9B;stop-opacity:0.8" />
      <stop offset="100%" style="stop-color:#0F3A6B;stop-opacity:0.6" />
    </radialGradient>
    <filter id="glow">
      <feGaussianBlur stdDeviation="2" result="coloredBlur"/>
      <feMerge> 
        <feMergeNode in="coloredBlur"/>
        <feMergeNode in="SourceGraphic"/>
      </feMerge>
    </filter>
  </defs>
  
  <!-- Background circle -->
  <circle cx="16" cy="16" r="14" fill="url(#orbGradient)" filter="url(#glow)"/>
  
  <!-- Animated particles -->
  <g>
    <animateTransform attributeName="transform" type="rotate" values="0 16 16;360 16 16" dur="8s" repeatCount="indefinite"/>
    <circle cx="12" cy="12" r="1.5" fill="#4A9EFF" opacity="0.7"/>
    <circle cx="20" cy="14" r="1" fill="#6BB6FF" opacity="0.6"/>
    <circle cx="14" cy="20" r="1.2" fill="#4A9EFF" opacity="0.8"/>
    <circle cx="18" cy="18" r="0.8" fill="#6BB6FF" opacity="0.5"/>
    <circle cx="10" cy="18" r="1" fill="#4A9EFF" opacity="0.6"/>
    <circle cx="22" cy="12" r="0.9" fill="#6BB6FF" opacity="0.7"/>
    <circle cx="16" cy="10" r="1.1" fill="#4A9EFF" opacity="0.8"/>
    <circle cx="12" cy="22" r="0.7" fill="#6BB6FF" opacity="0.5"/>
    <circle cx="20" cy="22" r="1.3" fill="#4A9EFF" opacity="0.6"/>
    <circle cx="8" cy="16" r="0.8" fill="#6BB6FF" opacity="0.4"/>
    <circle cx="24" cy="16" r="1" fill="#4A9EFF" opacity="0.7"/>
    <circle cx="16" cy="24" r="0.9" fill="#6BB6FF" opacity="0.5"/>
  </g>
  
  <!-- Breathing effect -->
  <circle cx="16" cy="16" r="14" fill="none" stroke="#2F86D1" stroke-width="0.5" opacity="0.3">
    <animate attributeName="r" values="14;15;14" dur="3s" repeatCount="indefinite"/>
    <animate attributeName="opacity" values="0.3;0.6;0.3" dur="3s" repeatCount="indefinite"/>
  </circle>
</svg>`;

  fs.writeFileSync(path.join(__dirname, '../public/favicon-animated.svg'), svgContent);
  console.log('Animated SVG favicon created!');
};

createOrbGif();
