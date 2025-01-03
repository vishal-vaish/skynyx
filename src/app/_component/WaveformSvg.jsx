"use client";

import React, { useEffect, useRef } from "react";
import { linearPath } from "waveform-path";

const WaveformSvg = ({ audioContext, stream }) => {
  const svgRef = useRef(null);

  useEffect(() => {
    if (!audioContext || !stream) return;

    const source = audioContext.createMediaStreamSource(stream);
    const processor = audioContext.createScriptProcessor(2048, 1, 1);

    source.connect(processor);
    processor.connect(audioContext.destination);

    processor.onaudioprocess = (e) => {
      const options = {
        samples: 80,
        type: "bars",
        top: 20,
        normalize: false,
        paths: [
          { d: "V", sy: 0, x: 50, ey: 100 },
        ],
      };

      const pathData = linearPath(e.inputBuffer, options);
      const pathElement = svgRef.current.querySelector("path");
      if (pathElement) {
        pathElement.setAttribute("d", pathData);
      }
    };

    return () => {
      processor.disconnect();
      source.disconnect();
    };
  }, [audioContext, stream]);

  return (
     <svg id="Mic1" height="140px" width="600px" ref={svgRef}>
       <defs>
         <linearGradient id="lgrad" x1="0%" y1="50%" x2="100%" y2="50%">
           <stop offset="0%" style={{ stopColor: "rgb(0,255,10)", stopOpacity: 1 }} />
           <stop offset="25%" style={{ stopColor: "rgb(0,188,212)", stopOpacity: 0.7 }} />
           <stop offset="50%" style={{ stopColor: "rgb(238,130,238)", stopOpacity: 1 }} />
           <stop offset="75%" style={{ stopColor: "rgb(103,58,183)", stopOpacity: 0.7 }} />
           <stop offset="100%" style={{ stopColor: "rgb(233,30,99)", stopOpacity: 1 }} />
         </linearGradient>
       </defs>
       <path
          style={{
            fill: "none",
            strokeWidth: 4,
            strokeLinecap: "round",
            stroke: "url(#lgrad)",
          }}
       />
     </svg>
  );
};

export default WaveformSvg;
