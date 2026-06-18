import React, { useEffect, useRef, useState } from 'react';

interface GlobeNode {
  lat: number;
  lon: number;
  label: string;
  color: string;
}

interface GlobeArc {
  fromIdx: number;
  toIdx: number;
  progress: number;
  speed: number;
  color: string;
}

// Realistic coordinates of major Earth continents and islands to represent them accurately
const POL_NORTH_AMERICA = [
  { lat: 72, lon: -168 }, // Alaska West
  { lat: 70, lon: -130 }, // N Canada
  { lat: 75, lon: -80 },  // Baffin Island / N Hudson
  { lat: 60, lon: -60 },  // Labrador
  { lat: 45, lon: -60 },  // Nova Scotia
  { lat: 25, lon: -80 },  // Florida
  { lat: 23, lon: -82 },  // Cuba / FL Straits
  { lat: 10, lon: -75 },  // Panama
  { lat: 16, lon: -95 },  // Central Mexico
  { lat: 32, lon: -115 }, // Gulf of California
  { lat: 34, lon: -120 }, // California
  { lat: 48, lon: -125 }, // Vancouver / Seattle
  { lat: 60, lon: -140 }, // Alaska South
  { lat: 55, lon: -160 }, // Aleutians
];

const POL_SOUTH_AMERICA = [
  { lat: 12, lon: -72 },  // N Colombia
  { lat: 5, lon: -50 },   // N Brazil
  { lat: -5, lon: -35 },  // NE Brazil
  { lat: -23, lon: -42 }, // SE Brazil
  { lat: -35, lon: -55 }, // Uruguay / River Plate
  { lat: -55, lon: -68 }, // Cape Horn
  { lat: -40, lon: -74 }, // S Chile
  { lat: -20, lon: -70 }, // N Chile
  { lat: -5, lon: -81 },  // N Peru
  { lat: 8, lon: -77 },   // Panama Border
];

const POL_EURASIA = [
  { lat: 70, lon: 20 },   // N Norway
  { lat: 70, lon: 40 },   // Kola Peninsula
  { lat: 75, lon: 60 },   // N Urals
  { lat: 72, lon: 100 },  // Taymyr Peninsula
  { lat: 72, lon: 140 },  // NE Siberia
  { lat: 65, lon: 170 },  // Chukotka
  { lat: 55, lon: 160 },  // Kamchatka
  { lat: 43, lon: 140 },  // Vladivostok
  { lat: 35, lon: 122 },  // Shandong
  { lat: 22, lon: 114 },  // South China
  { lat: 10, lon: 108 },  // Indochina
  { lat: 1, lon: 103 },   // Singapore / Malaya
  { lat: 10, lon: 98 },   // Thailand / Myanmar
  { lat: 20, lon: 90 },   // Bangladesh
  { lat: 8, lon: 78 },    // S India
  { lat: 22, lon: 70 },   // NW India
  { lat: 25, lon: 60 },   // Iran
  { lat: 12, lon: 44 },   // Yemen
  { lat: 25, lon: 35 },   // Red Sea West Arabia
  { lat: 30, lon: 35 },   // Israel / Jordan
  { lat: 36, lon: 35 },   // Turkey / Anatolia
  { lat: 40, lon: 26 },   // Greece
  { lat: 45, lon: 12 },   // Italy
  { lat: 36, lon: -5 },   // Gibraltar / Spain S
  { lat: 38, lon: -9 },   // Portugal W
  { lat: 48, lon: -5 },   // Brittany France
  { lat: 54, lon: 5 },    // Netherlands/North Sea
  { lat: 62, lon: 5 },    // Norway Bergen
];

const POL_AFRICA = [
  { lat: 37, lon: 11 },   // Tunisia
  { lat: 31, lon: 32 },   // Delta Egypt
  { lat: 12, lon: 43 },   // Bab-el-Mandeb
  { lat: 4, lon: 51 },    // Somalia (Horn of Africa)
  { lat: -34, lon: 20 },  // South Africa
  { lat: -15, lon: 12 },  // Angola
  { lat: 5, lon: 9 },     // Cameroon / Gulf of Guinea
  { lat: 5, lon: -10 },   // Liberia
  { lat: 15, lon: -17 },  // Senegal (Dakar)
  { lat: 30, lon: -10 },  // Morocco (Atlas)
];

const POL_AUSTRALIA = [
  { lat: -12, lon: 131 }, // Darwin
  { lat: -11, lon: 142 }, // Cape York
  { lat: -27, lon: 153 }, // Brisbane
  { lat: -38, lon: 145 }, // Melbourne
  { lat: -35, lon: 118 }, // Albany
  { lat: -22, lon: 114 }, // Exmouth
];

const POL_GREENLAND = [
  { lat: 83, lon: -35 },
  { lat: 70, lon: -20 },
  { lat: 60, lon: -44 },
  { lat: 70, lon: -55 }
];

const Polygons = [
  POL_NORTH_AMERICA,
  POL_SOUTH_AMERICA,
  POL_EURASIA,
  POL_AFRICA,
  POL_AUSTRALIA,
  POL_GREENLAND,
  // Madagascar
  [
    { lat: -12, lon: 49 },
    { lat: -16, lon: 50 },
    { lat: -25, lon: 47 },
    { lat: -20, lon: 44 }
  ],
  // Great Britain & Ireland
  [
    { lat: 58, lon: -6 },
    { lat: 55, lon: -1 },
    { lat: 51, lon: 1 },
    { lat: 50, lon: -10 },
    { lat: 54, lon: -10 }
  ],
  // Japan (Honshu/Hokkaido)
  [
    { lat: 45, lon: 142 },
    { lat: 43, lon: 145 },
    { lat: 35, lon: 140 },
    { lat: 31, lon: 130 },
    { lat: 35, lon: 132 }
  ],
  // Sumatra
  [
    { lat: 5, lon: 95 },
    { lat: 2, lon: 99 },
    { lat: -5, lon: 105 },
    { lat: -5, lon: 102 }
  ],
  // Borneo
  [
    { lat: 7, lon: 116 },
    { lat: 4, lon: 119 },
    { lat: -3, lon: 115 },
    { lat: -2, lon: 110 },
    { lat: 2, lon: 109 }
  ],
  // New Guinea
  [
    { lat: -1, lon: 131 },
    { lat: -3, lon: 143 },
    { lat: -10, lon: 150 },
    { lat: -8, lon: 140 },
    { lat: -5, lon: 134 }
  ],
  // New Zealand (North & South)
  [
    { lat: -34, lon: 173 },
    { lat: -37, lon: 178 },
    { lat: -41, lon: 175 },
    { lat: -46, lon: 167 },
    { lat: -41, lon: 172 }
  ]
];

// Ray casting algorithm to verify if a coordinate belongs to land
const isLandPoint = (origLat: number, origLon: number): boolean => {
  if (origLat < -60) return true; // Antarctica
  
  // Add fine-grade procedural noise to coordinate boundary checks for beautiful natural coastlines
  const noiseLat = Math.sin(origLon * 1.5) * Math.cos(origLat * 1.5) * 1.2;
  const noiseLon = Math.cos(origLon * 1.5) * Math.sin(origLat * 1.5) * 1.2;
  
  const lat = origLat + noiseLat;
  const lon = origLon + noiseLon;
  
  for (const poly of Polygons) {
    let inside = false;
    for (let i = 0, j = poly.length - 1; i < poly.length; j = i++) {
      const xi = poly[i].lon, yi = poly[i].lat;
      const xj = poly[j].lon, yj = poly[j].lat;
      const intersect = ((yi > lat) !== (yj > lat))
          && (lon < (xj - xi) * (lat - yi) / (yj - yi) + xi);
      if (intersect) inside = !inside;
    }
    if (inside) return true;
  }
  return false;
};

export const InteractiveGlobe = () => {
  const canvasRef = useRef<HTMLCanvasElement | null>(null);
  
  // Interaction and Inertia controls
  const isDragging = useRef(false);
  const previousMousePosition = useRef({ x: 0, y: 0 });
  
  const angleX = useRef(0.4);       // Tilt angle around X
  const angleY = useRef(-0.6);      // Turn angle around Y
  const velocityX = useRef(0);      // Spin inertia in X axis
  const velocityY = useRef(0.0035);  // Passive drift speed around Y axis
  
  // Infrastructure nodes (Spotify aesthetic: bright neons)
  const nodes: GlobeNode[] = [
    { lat: 50.111, lon: 8.682, label: 'Node-EU (Frankfurt)', color: '#1db954' },     // Spotify Green
    { lat: 40.712, lon: -74.006, label: 'Node-US-East (NY)', color: '#10b981' },    // Custom Emerald
    { lat: 35.676, lon: 139.65, label: 'Node-JP (Tokyo)', color: '#1db954' },       // Spotify Green
    { lat: 1.352, lon: 103.82, label: 'Node-SG (Singapore)', color: '#34d399' },    // Mint Teal
    { lat: -33.868, lon: 151.209, label: 'Node-AU (Sydney)', color: '#059669' },    // Darker Emerald
    { lat: -23.55, lon: -46.633, label: 'Node-BR (São Paulo)', color: '#1db954' },  // Spotify Green
    { lat: 37.774, lon: -122.419, label: 'Node-US-West (SF)', color: '#059669' },   // Darker Emerald
    { lat: 51.507, lon: -0.127, label: 'Node-UK (London)', color: '#10b981' },      // Custom Emerald
    { lat: -26.204, lon: 28.047, label: 'Node-ZA (Johannesburg)', color: '#34d399' }, // Mint Teal
  ];

  // Micro active stream connections
  const arcs = useRef<GlobeArc[]>([
    { fromIdx: 1, toIdx: 0, progress: 0.1, speed: 0.006, color: 'rgba(29, 185, 84, 0.45)' },
    { fromIdx: 0, toIdx: 2, progress: 0.4, speed: 0.004, color: 'rgba(16, 185, 129, 0.45)' },
    { fromIdx: 3, toIdx: 2, progress: 0.7, speed: 0.007, color: 'rgba(52, 211, 153, 0.45)' },
    { fromIdx: 4, toIdx: 3, progress: 0.2, speed: 0.005, color: 'rgba(29, 185, 84, 0.45)' },
    { fromIdx: 6, toIdx: 1, progress: 0.5, speed: 0.008, color: 'rgba(16, 185, 129, 0.45)' },
    { fromIdx: 7, toIdx: 0, progress: 0.0, speed: 0.007, color: 'rgba(52, 211, 153, 0.45)' },
    { fromIdx: 1, toIdx: 5, progress: 0.3, speed: 0.006, color: 'rgba(16, 185, 129, 0.45)' },
    { fromIdx: 5, toIdx: 8, progress: 0.8, speed: 0.005, color: 'rgba(52, 211, 153, 0.45)' },
    { fromIdx: 8, toIdx: 0, progress: 0.6, speed: 0.006, color: 'rgba(29, 185, 84, 0.45)' },
    { fromIdx: 8, toIdx: 3, progress: 0.1, speed: 0.005, color: 'rgba(16, 185, 129, 0.45)' },
    { fromIdx: 2, toIdx: 6, progress: 0.9, speed: 0.007, color: 'rgba(29, 185, 84, 0.45)' },
  ]);

  // Generate 3D Fibonacci point distribution of the Earth mapping grid coordinates once
  const globePoints = useRef<{ x: number; y: number; z: number; isLand: boolean }[]>([]);

  if (globePoints.current.length === 0) {
    const totalPoints = 2200;
    for (let i = 0; i < totalPoints; i++) {
      const yVal = 1 - (i / (totalPoints - 1)) * 2;          // Range from 1 down to -1 (North is positive, South is negative)
      const radiusAtY = Math.sqrt(1 - yVal * yVal);
      const theta = 2.3999632297286533 * i;

      // Clean and unified projection equations
      const subLat = Math.asin(yVal) * (180 / Math.PI);
      const subLon = Math.atan2(Math.sin(theta), Math.cos(theta)) * (180 / Math.PI);

      const radLat = (subLat * Math.PI) / 180;
      const radLon = (subLon * Math.PI) / 180;

      globePoints.current.push({
        x: Math.cos(radLat) * Math.cos(radLon),
        y: -Math.sin(radLat), // Negative Y is UP in canvas-friendly 3D projection space
        z: Math.cos(radLat) * Math.sin(radLon),
        isLand: isLandPoint(subLat, subLon)
      });
    }
  }

  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;

    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    let animationId: number;
    let width = canvas.offsetWidth;
    let height = canvas.offsetHeight;

    const resizeCanvas = () => {
      width = canvas.parentElement?.offsetWidth || 500;
      height = canvas.parentElement?.offsetHeight || 500;
      canvas.width = width * window.devicePixelRatio;
      canvas.height = height * window.devicePixelRatio;
      canvas.style.width = `${width}px`;
      canvas.style.height = `${height}px`;
      ctx.scale(window.devicePixelRatio, window.devicePixelRatio);
    };

    resizeCanvas();
    window.addEventListener('resize', resizeCanvas);

    // Coordinate calculation
    const getCartesian = (lat: number, lon: number, radius: number) => {
      const radLat = (lat * Math.PI) / 180;
      const radLon = (lon * Math.PI) / 180;
      
      return {
        x: radius * Math.cos(radLat) * Math.cos(radLon),
        y: -radius * Math.sin(radLat), // North is negative (UP) in canvas projection coordinates
        z: radius * Math.cos(radLat) * Math.sin(radLon),
      };
    };

    // 3D coordinate projection with viewport angles
    const projectPoint = (x: number, y: number, z: number, rx: number, ry: number) => {
      // Rotation around Y-axis (longitude drift)
      const cosY = Math.cos(ry);
      const sinY = Math.sin(ry);
      const x1 = x * cosY - z * sinY;
      const z1 = x * sinY + z * cosY;

      // Rotation around X-axis (latitudinal tilt)
      const cosX = Math.cos(rx);
      const sinX = Math.sin(rx);
      const y2 = y * cosX - z1 * sinX;
      const z2 = y * sinX + z1 * cosX;

      return { x: x1, y: y2, z: z2 };
    };

    const render = () => {
      // Clean canvas with pure pitch-black background for maximum high-contrast neon vibe
      ctx.fillStyle = '#000000';
      ctx.fillRect(0, 0, width, height);

      // Inertia dynamics
      if (!isDragging.current) {
        // Apply tiny friction/decay to inertia speed
        velocityY.current *= 0.975;
        velocityX.current *= 0.975;

        // Keep a minimum passive drift velocity going for beautiful perpetual movement
        if (Math.abs(velocityY.current) < 0.0015) {
          velocityY.current = Math.sign(velocityY.current || 1) * 0.0015;
        }

        angleY.current += velocityY.current;
        angleX.current += velocityX.current;
      } else {
        // Damp values slightly while dragging to avoid jitter
        velocityX.current *= 0.5;
        velocityY.current *= 0.5;
      }

      // Constrain tilt rotation to prevent flipping upside down
      angleX.current = Math.max(-0.9, Math.min(0.9, angleX.current));

      const centerX = width / 2;
      const centerY = height / 2;
      const baseRadius = Math.min(width, height) * 0.43;

      // Draw subtle backing concentric atmosphere orbit rings (Spotify minimalist line feel)
      ctx.strokeStyle = 'rgba(29, 185, 84, 0.035)';
      ctx.lineWidth = 1;
      
      ctx.beginPath();
      ctx.arc(centerX, centerY, baseRadius * 1.05, 0, Math.PI * 2);
      ctx.stroke();

      ctx.beginPath();
      ctx.arc(centerX, centerY, baseRadius, 0, Math.PI * 2);
      ctx.stroke();

      // Draw glowing deep dark background atmosphere inside the globe core
      // Starting at 0 removes the "eye pupil / donut" effect, creating a clean, soft spherical glow
      const radialGlow = ctx.createRadialGradient(
        centerX, centerY, 0,
        centerX, centerY, baseRadius * 0.95
      );
      radialGlow.addColorStop(0, 'rgba(29, 185, 84, 0.15)');
      radialGlow.addColorStop(0.5, 'rgba(29, 185, 84, 0.03)');
      radialGlow.addColorStop(1, 'rgba(29, 185, 84, 0)');
      
      ctx.fillStyle = radialGlow;
      ctx.beginPath();
      ctx.arc(centerX, centerY, baseRadius, 0, Math.PI * 2);
      ctx.fill();

      // Render the Earth points (Fibonacci Dotted sphere)
      globePoints.current.forEach(pt => {
        // Multiply by baseRadius to scale unit sphere points to pixel coordinate sizes
        const rx = pt.x * baseRadius;
        const ry = pt.y * baseRadius;
        const rz = pt.z * baseRadius;

        // Rotate the spherical land point
        const projected = projectPoint(rx, ry, rz, angleX.current, angleY.current);

        // Calculate opacity based on depth (z coordinate) to create 3D volumetric density
        // Front depth has max opacity, back hemisphere fades out gracefully
        const zDepthNorm = (projected.z + baseRadius) / (baseRadius * 2); 
        let alpha = zDepthNorm * 0.8;

        // Spotify design style: Land points are clean glowing emeralds. Ocean is omitted or ultra-subtle.
        if (pt.isLand) {
          // Beautiful high-fidelity neon spot
          ctx.fillStyle = `rgba(29, 185, 84, ${alpha * 0.9})`;
          
          // Render larger dots on the front hemisphere for detailed volumetric proximity
          const dotSize = projected.z >= 0 ? 1.4 : 0.8;
          ctx.beginPath();
          ctx.arc(centerX + projected.x, centerY + projected.y, dotSize, 0, Math.PI * 2);
          ctx.fill();
        } else {
          // Oceans: Draw as very tiny, extremely subtle dark teal/gray points to hint of a boundary
          ctx.fillStyle = `rgba(16, 185, 129, ${alpha * 0.1})`;
          ctx.beginPath();
          ctx.arc(centerX + projected.x, centerY + projected.y, 0.6, 0, Math.PI * 2);
          ctx.fill();
        }
      });

      // Update stream progress speeds
      arcs.current.forEach(arc => {
        arc.progress = (arc.progress + arc.speed) % 1.0;
      });

      // Unified 3D bezier curves rendering tool to draw connection paths with true depth occlusion segmenting
      const getArcPoint3D = (p1: any, pMid: any, p2: any, t: number) => {
        return {
          x: (1 - t) * (1 - t) * p1.x + 2 * (1 - t) * t * pMid.x + t * t * p2.x,
          y: (1 - t) * (1 - t) * p1.y + 2 * (1 - t) * t * pMid.y + t * t * p2.y,
          z: (1 - t) * (1 - t) * p1.z + 2 * (1 - t) * t * pMid.z + t * t * p2.z,
        };
      };

      // Render Connection Paths Segmented by Z-depth to simulate real sphere occlusion
      arcs.current.forEach(arc => {
        const fromNode = nodes[arc.fromIdx];
        const toNode = nodes[arc.toIdx];

        const pt1 = getCartesian(fromNode.lat, fromNode.lon, baseRadius);
        const pt2 = getCartesian(toNode.lat, toNode.lon, baseRadius);

        // Arc midpoints elevated outwards to form a beautiful parabolic path in 3D
        const midLat = (fromNode.lat + toNode.lat) / 2;
        const midLon = (fromNode.lon + toNode.lon) / 2;
        const elevation = baseRadius * 1.15;
        const ptMid = getCartesian(midLat, midLon, elevation);

        // Draw connections dynamically by evaluating slices in 3D
        const segmentsCount = 28;
        let prevProjected = projectPoint(pt1.x, pt1.y, pt1.z, angleX.current, angleY.current);

        for (let j = 1; j <= segmentsCount; j++) {
          const t = j / segmentsCount;
          const pt3d = getArcPoint3D(pt1, ptMid, pt2, t);
          const currentProjected = projectPoint(pt3d.x, pt3d.y, pt3d.z, angleX.current, angleY.current);

          const averageZ = (prevProjected.z + currentProjected.z) / 2;

          ctx.beginPath();
          ctx.moveTo(centerX + prevProjected.x, centerY + prevProjected.y);
          ctx.lineTo(centerX + currentProjected.x, centerY + currentProjected.y);

          // If the segment is on the front side of the globe
          if (averageZ >= -5) {
            ctx.strokeStyle = arc.color;
            ctx.lineWidth = 1.3;
          } else {
            // Segment is behind the globe, draw very subtle faded dashed styling for 3D realism
            ctx.strokeStyle = 'rgba(29, 185, 84, 0.05)';
            ctx.lineWidth = 0.8;
          }
          ctx.stroke();

          prevProjected = currentProjected;
        }

        // Render moving signal pulse flow particle
        const sigT = arc.progress;
        const sigPt3d = getArcPoint3D(pt1, ptMid, pt2, sigT);
        const sigP = projectPoint(sigPt3d.x, sigPt3d.y, sigPt3d.z, angleX.current, angleY.current);

        // Particle is only rendered when it travels across the front hemisphere, naturally passing out of sight
        if (sigP.z >= -5) {
          const sigX = centerX + sigP.x;
          const sigY = centerY + sigP.y;

          ctx.fillStyle = '#ffffff';
          ctx.shadowColor = '#1db954';
          ctx.shadowBlur = 10;
          ctx.beginPath();
          ctx.arc(sigX, sigY, 2.8, 0, Math.PI * 2);
          ctx.fill();
          ctx.shadowBlur = 0; // reset
        }
      });

      // Render Infrastructure Nodes
      nodes.forEach(node => {
        const cartesian = getCartesian(node.lat, node.lon, baseRadius);
        const projected = projectPoint(cartesian.x, cartesian.y, cartesian.z, angleX.current, angleY.current);

        // Nodes on the front side are highlighted with high details
        if (projected.z >= 0) {
          const px = centerX + projected.x;
          const py = centerY + projected.y;

          // Draw a expanding radar heartbeat pulse pattern around the active node
          ctx.strokeStyle = node.color;
          ctx.lineWidth = 1;
          ctx.beginPath();
          
          const pulseDuration = 1200;
          const elapsed = Date.now() % pulseDuration;
          const pulseRadius = 3 + (elapsed / pulseDuration) * 12;
          ctx.globalAlpha = 1.0 - (elapsed / pulseDuration);
          
          ctx.arc(px, py, pulseRadius, 0, Math.PI * 2);
          ctx.stroke();
          ctx.globalAlpha = 1.0; // reset global opacity

          // Hub point center
          ctx.fillStyle = '#ffffff';
          ctx.beginPath();
          ctx.arc(px, py, 3.2, 0, Math.PI * 2);
          ctx.fill();

          ctx.fillStyle = node.color;
          ctx.beginPath();
          ctx.arc(px, py, 2.0, 0, Math.PI * 2);
          ctx.fill();

          // Modern clean monospace labels
          ctx.fillStyle = 'rgba(255, 255, 255, 0.9)';
          ctx.font = '500 9px "JetBrains Mono", monospace';
          ctx.textAlign = 'left';
          
          // Micro glow background for text readability
          ctx.shadowColor = 'rgba(0,0,0,0.85)';
          ctx.shadowBlur = 6;
          ctx.fillText(node.label, px + 7, py + 3);
          ctx.shadowBlur = 0; // reset
        }
      });

      animationId = requestAnimationFrame(render);
    };

    render();

    // Mouse and Touch Event Handlers with physics-driven flick inertia
    const handleMouseDown = (e: MouseEvent) => {
      isDragging.current = true;
      previousMousePosition.current = {
        x: e.clientX,
        y: e.clientY
      };
    };

    const handleMouseMove = (e: MouseEvent) => {
      if (!isDragging.current) return;
      
      const deltaX = e.clientX - previousMousePosition.current.x;
      const deltaY = e.clientY - previousMousePosition.current.y;
      
      previousMousePosition.current = {
        x: e.clientX,
        y: e.clientY
      };

      // Set speeds based on manual swipe offsets (inverted for natural grabbing dragging)
      velocityY.current = -deltaX * 0.0035;
      velocityX.current = -deltaY * 0.0035;

      // Update rotation degrees
      angleY.current += velocityY.current;
      angleX.current += velocityX.current;
    };

    const handleMouseUp = () => {
      isDragging.current = false;
    };

    // Responsive Mobile interactions
    const handleTouchStart = (e: TouchEvent) => {
      if (e.touches.length === 1) {
        isDragging.current = true;
        previousMousePosition.current = {
          x: e.touches[0].clientX,
          y: e.touches[0].clientY
        };
      }
    };

    const handleTouchMove = (e: TouchEvent) => {
      if (!isDragging.current || e.touches.length !== 1) return;
      
      const deltaX = e.touches[0].clientX - previousMousePosition.current.x;
      const deltaY = e.touches[0].clientY - previousMousePosition.current.y;
      
      previousMousePosition.current = {
        x: e.touches[0].clientX,
        y: e.touches[0].clientY
      };

      // Inverted for natural touch grabbing
      velocityY.current = -deltaX * 0.003;
      velocityX.current = -deltaY * 0.003;

      angleY.current += velocityY.current;
      angleX.current += velocityX.current;
    };

    canvas.addEventListener('mousedown', handleMouseDown);
    window.addEventListener('mousemove', handleMouseMove);
    window.addEventListener('mouseup', handleMouseUp);
    
    canvas.addEventListener('touchstart', handleTouchStart);
    window.addEventListener('touchmove', handleTouchMove, { passive: true });
    window.addEventListener('touchend', handleMouseUp);

    return () => {
      cancelAnimationFrame(animationId);
      window.removeEventListener('resize', resizeCanvas);
      canvas.removeEventListener('mousedown', handleMouseDown);
      window.removeEventListener('mousemove', handleMouseMove);
      window.removeEventListener('mouseup', handleMouseUp);
      canvas.removeEventListener('touchstart', handleTouchStart);
      window.removeEventListener('touchmove', handleTouchMove);
      window.removeEventListener('touchend', handleMouseUp);
    };
  }, []);

  return (
    <div className="w-full h-full relative flex items-center justify-center cursor-grab active:cursor-grabbing bg-black rounded-3xl overflow-hidden shadow-2xl">
      <canvas 
        ref={canvasRef} 
        className="block pointer-events-auto"
      />
    </div>
  );
};
