import React, { memo } from 'react';

export const BackgroundEffects = memo(() => {
  return (
    <div className="fixed inset-0 pointer-events-none -z-50 overflow-hidden bg-[#020617]">
       {/* Layer 1 - Deep Space Gradients */}
       <div className="absolute inset-0 bg-[radial-gradient(circle_at_top,rgba(88,80,255,0.22),transparent_40%),radial-gradient(circle_at_bottom_right,rgba(0,180,255,0.18),transparent_35%)]"></div>
       
       {/* Layer 2 - Moving Grid (Operational Mesh) */}
       <div className="absolute inset-0 bg-[linear-gradient(to_right,#ffffff03_1px,transparent_1px),linear-gradient(to_bottom,#ffffff03_1px,transparent_1px)] bg-[size:4rem_4rem] [mask-image:radial-gradient(ellipse_60%_60%_at_50%_0%,#000_70%,transparent_100%)]"></div>

       {/* Layer 3 - Giant blurred orb (Static for performance) */}
       <div 
         className="absolute right-[-10%] top-[10%] w-[800px] h-[800px] rounded-full bg-indigo-600 blur-[140px] opacity-20"
       ></div>

       <div 
         className="absolute left-[-10%] bottom-[10%] w-[600px] h-[600px] rounded-full bg-blue-600 blur-[130px] opacity-15"
       ></div>

      {/* Layer 4 - Noise Texture (Cinematic Grain - Optimizied) */}
      <div className="absolute inset-0 opacity-[0.03]" style={{backgroundImage: 'url("data:image/svg+xml,%3Csvg viewBox=\'0 0 200 200\' xmlns=\'http://www.w3.org/2000/svg\'%3E%3Cfilter id=\'noiseFilter\'%3E%3CfeTurbulence type=\'fractalNoise\' baseFrequency=\'0.9\' numOctaves=\'1\' stitchTiles=\'stitch\'/%3E%3C/filter%3E%3Crect width=\'100%25\' height=\'100%25\' filter=\'url(%23noiseFilter)\'/%3E%3C/svg%3E")'}}></div>

      {/* Ambient fog at bottom to ground it */}
      <div className="absolute bottom-0 left-0 right-0 h-64 bg-gradient-to-t from-[#020617] to-transparent z-10"></div>
    </div>
  );
});

BackgroundEffects.displayName = 'BackgroundEffects';
