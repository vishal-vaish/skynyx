"use client";

import React, {useEffect, useRef} from 'react'

type Props = {
  volumeRef: React.MutableRefObject<number>
}

const settings = {
  bars: 30,
  spacing: 4,
  width: 6,
  height: 100,
};

const Meter = ({volumeRef}: Props) => {
  const refs = useRef<(HTMLDivElement | null)[]>([]);
  const volumeRefs = useRef<number[]>(new Array(settings.bars).fill(0));

  useEffect(() => {
    const intervalId = setInterval(() => {
      volumeRefs.current.unshift(volumeRef.current);
      volumeRefs.current.pop();

      for (let i = 0; i < refs.current.length; i++) {
        const ref = refs.current[i];
        if (ref) {
          ref.style.transform = `scaleY(${volumeRefs.current[i] / 100})`;
        }
      }
    }, 20);

    return () => {
      clearInterval(intervalId);
    };
  }, [volumeRef]);

  const createElements = () => {
    const elements: React.JSX.Element[] = [];

    for (let i = 0; i < settings.bars; i++) {
      elements.push(
        <div
          ref={(ref) => {
            if (ref) refs.current[i] = ref;
          }}
          key={`vu-${i}`}
          style={{
            position: "absolute",
            background: "lightblue",
            borderRadius: settings.width + "px",
            width: settings.width + "px",
            height: Math.sin((i / settings.bars) * 4) * settings.height + "px",
            left: i * (settings.width + settings.spacing) + "px",
            top:
              settings.height / 2 +
              Math.sin((i / settings.bars) * 4) * (-settings.height / 2) +
              "px",
          }}
        />
      );
    }
    return elements;
  };

  return <div style={{
    position: "relative",
    left: "25%",
  }}>
    {createElements()}
  </div>;
}
export default Meter
