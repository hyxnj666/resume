'use client';

import dynamic from 'next/dynamic';
import { Canvas } from '@react-three/fiber';
import { DigitalHumanScene } from './digital-human-scene';

type CanvasProps = {
  isListening?: boolean;
  isSpeaking?: boolean;
  loadingLabel?: string;
  fullScreen?: boolean;
};

function DigitalHumanCanvasInner(props: CanvasProps) {
  return (
    <div
      className={
        props.fullScreen
          ? 'absolute inset-0 w-full h-full bg-slate-950'
          : 'h-[360px] w-full min-h-[360px] bg-slate-950 shrink-0'
      }
    >
      <Canvas
        shadows
        camera={{ position: [0, 1.15, 3.6], fov: 38 }}
        gl={{ antialias: true, alpha: false }}
      >
        <DigitalHumanScene
          isListening={props.isListening}
          isSpeaking={props.isSpeaking}
          loadingLabel={props.loadingLabel}
        />
      </Canvas>
    </div>
  );
}

/** 弹层内 3D 区域，仅在有需要时动态加载 */
export default dynamic(() => Promise.resolve(DigitalHumanCanvasInner), { ssr: false });
