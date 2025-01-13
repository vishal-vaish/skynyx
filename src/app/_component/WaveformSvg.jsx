"use client";

import React, {useEffect, useRef, useState} from "react";
import {linearPath} from "waveform-path";

const WaveformSvg = ({audioContext, stream, silenceDetected}) => {
  const svgRef = useRef(null);
  const [initialized, setInitialized] = useState(false);
  const [svgWidth, setSvgWidth] = useState(600);
  const colors = [
    "rgb(0,255,10)",
    "rgb(0,188,212)",
    "rgb(238,130,238)",
    "rgb(103,58,183)",
    "rgb(233,30,99)",
  ];
  const dotsPerColor = 16;

  useEffect(() => {
   if(silenceDetected) {
     setInitialized(false)
   } else {
     setInitialized(true);
   }
  }, [silenceDetected]);

  useEffect(() => {
    if (!audioContext || !stream) {
      setInitialized(false);
      return;
    }
    const source = audioContext.createMediaStreamSource(stream);
    const processor = audioContext.createScriptProcessor(2048, 1, 1);

    source.connect(processor);
    processor.connect(audioContext.destination);

    processor.onaudioprocess = (e) => {
      const options = {
        samples: 80,
        type: "bars",
        top: 10,
        normalize: false,
        paths: [
          {d: "V", sy: 0, x: 50, ey: 100},
        ],
      };

      const pathData = linearPath(e.inputBuffer, options);
      const pathElement = svgRef.current.querySelector("path");
      if (pathElement) {
        pathElement.setAttribute("d", pathData);
      }
    };

    setInitialized(true);

    return () => {
      processor.disconnect();
      source.disconnect();
    };
  }, [audioContext, stream]);

  useEffect(() => {
    const handleResize = () => {
      const width = window.innerWidth;
      if (width > 1200 && width < 1500) {
        setSvgWidth(500);
      } else if (width > 800 && width <= 1200) {
        setSvgWidth(400);
      } else if (width <= 800) {
        setSvgWidth(300);
      } else {
        setSvgWidth(600);
      }
    };

    handleResize();
    window.addEventListener("resize", handleResize);

    return () => {
      window.removeEventListener("resize", handleResize);
    };
  }, []);

  return (
     <svg
        id="Mic1"
        height="120px"
        width={svgWidth}
        ref={svgRef}
     >
       {initialized ? (
          <>
            <defs>
              <linearGradient id="lgrad" x1="0%" y1="50%" x2="100%" y2="50%">
                <stop offset="0%" style={{stopColor: "rgb(0,255,10)", stopOpacity: 1}}/>
                <stop offset="25%" style={{stopColor: "rgb(0,188,212)", stopOpacity: 0.7}}/>
                <stop offset="50%" style={{stopColor: "rgb(238,130,238)", stopOpacity: 1}}/>
                <stop offset="75%" style={{stopColor: "rgb(103,58,183)", stopOpacity: 0.7}}/>
                <stop offset="100%" style={{stopColor: "rgb(233,30,99)", stopOpacity: 1}}/>
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
          </>
       ) : (
          <>
            {Array.from({length: 80}, (_, index) => {
              const colorIndex = Math.floor(index / dotsPerColor);
              const color = colors[colorIndex];

              const cx = (index + 1) * 8;

              return <circle key={index} cx={cx} cy="90%" r="2" fill={color}/>;
            })}
          </>
       )}
     </svg>
  );
};

export default WaveformSvg;
