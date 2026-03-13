'use client';

import { Component, type ReactNode, Suspense, useRef } from 'react';
import { useFrame } from '@react-three/fiber';
import { Float, Html, OrbitControls, RoundedBox, useGLTF } from '@react-three/drei';
import type { Group, Mesh } from 'three';

const AVATAR_GLB_PATH = '/avatar.glb';

/** 加载失败时显示占位 */
class SceneErrorBoundary extends Component<
  { fallback: ReactNode; children: ReactNode },
  { hasError: boolean }
> {
  state = { hasError: false };
  static getDerivedStateFromError = () => ({ hasError: true });
  render() {
    return this.state.hasError ? this.props.fallback : this.props.children;
  }
}

/** GLB 加载中时在场景内显示的占位（旋转圆环 + 文案） */
function AvatarLoadingFallback({ label }: { label: string }) {
  const meshRef = useRef<Mesh>(null);
  useFrame((_, delta) => {
    if (meshRef.current) meshRef.current.rotation.z += delta * 1.2;
  });
  return (
    <group position={[0, 0.9, 0]}>
      <mesh ref={meshRef} position={[0, 0, 0]}>
        <torusGeometry args={[0.2, 0.04, 16, 32]} />
        <meshStandardMaterial color="#67e8f9" roughness={0.6} metalness={0.2} />
      </mesh>
      <Html center className="text-sm text-slate-300 whitespace-nowrap" style={{ pointerEvents: 'none' }}>
        {label}
      </Html>
    </group>
  );
}

const mat = (color: string) => (
  <meshStandardMaterial color={color} roughness={0.65} metalness={0.08} />
);

/** 纯代码搭建的 stylized 3D 人物：带简易五官、idle/倾听/说话动画 */
function PlaceholderAvatar(props: AvatarStateProps) {
  const { isListening = false, isSpeaking = false } = props;
  const groupRef = useRef<Group>(null);
  const headRef = useRef<Group>(null);
  const leftArmRef = useRef<Group>(null);
  const rightArmRef = useRef<Group>(null);
  const timeRef = useRef(0);

  useFrame((_, delta) => {
    timeRef.current += delta;
    const t = timeRef.current;
    const group = groupRef.current;
    const head = headRef.current;
    const leftArm = leftArmRef.current;
    const rightArm = rightArmRef.current;

    if (group) {
      group.rotation.y += delta * 0.18;
      if (isListening) {
        group.rotation.x = Math.PI * 0.03;
        group.scale.setScalar(1.05);
        if (head) {
          head.rotation.x = Math.sin(t * 2.5) * 0.08;
          head.scale.setScalar(1);
        }
      } else {
        group.rotation.x = 0;
        if (head) head.rotation.x = 0;
        if (isSpeaking) {
          group.scale.setScalar(1.05);
          const breath = Math.sin(t * 8) * 0.025 + 1;
          if (head) head.scale.setScalar(breath);
        } else {
          if (head) head.scale.setScalar(1);
          const breathe = Math.sin(t * 1.2) * 0.008 + 1;
          group.scale.setScalar(1.05 * breathe);
        }
      }
    }
    if (!isListening && leftArm && rightArm) {
      const sway = Math.sin(t * 0.9) * 0.04;
      leftArm.rotation.z = 0.15 + sway;
      rightArm.rotation.z = -0.15 - sway;
    }
  });

  return (
    <Float speed={1.4} rotationIntensity={0.18} floatIntensity={0.35}>
      <group ref={groupRef} position={[0, 0.4, 0]} scale={1.05}>
        <group ref={headRef}>
          {/* 头部 */}
          <mesh position={[0, 1.52, 0]} castShadow receiveShadow>
            <sphereGeometry args={[0.28, 32, 32]} />
            {mat('#c9b8a8')}
          </mesh>
          {/* 简易头发/头顶 */}
          <mesh position={[0, 1.62, -0.08]} castShadow receiveShadow>
            <sphereGeometry args={[0.2, 20, 20, 0, Math.PI * 2, 0, Math.PI * 0.45]} />
            {mat('#4a3f35')}
          </mesh>
          {/* 左眼 */}
          <mesh position={[-0.1, 1.56, 0.24]} castShadow receiveShadow>
            <sphereGeometry args={[0.04, 12, 12]} />
            {mat('#2c2419')}
          </mesh>
          {/* 右眼 */}
          <mesh position={[0.1, 1.56, 0.24]} castShadow receiveShadow>
            <sphereGeometry args={[0.04, 12, 12]} />
            {mat('#2c2419')}
          </mesh>
          {/* 嘴（扁椭圆） */}
          <mesh position={[0, 1.42, 0.26]} rotation={[Math.PI / 2, 0, 0]} castShadow receiveShadow>
            <cylinderGeometry args={[0.06, 0.06, 0.02, 16]} />
            {mat('#8b7355')}
          </mesh>
        </group>
        <mesh position={[0, 1.22, 0]} castShadow receiveShadow>
          <cylinderGeometry args={[0.08, 0.1, 0.12, 16]} />
          {mat('#c9b8a8')}
        </mesh>
        <RoundedBox args={[0.42, 0.5, 0.22]} position={[0, 0.82, 0]} radius={0.06} smoothness={4} castShadow receiveShadow>
          {mat('#475569')}
        </RoundedBox>
        <group ref={leftArmRef} position={[-0.28, 0.92, 0.06]} rotation={[0.15, 0, 0.15]}>
          <mesh castShadow receiveShadow>
            <cylinderGeometry args={[0.06, 0.05, 0.4, 16]} />
            {mat('#64748b')}
          </mesh>
        </group>
        <group ref={rightArmRef} position={[0.28, 0.92, 0.06]} rotation={[0.15, 0, -0.15]}>
          <mesh castShadow receiveShadow>
            <cylinderGeometry args={[0.06, 0.05, 0.4, 16]} />
            {mat('#64748b')}
          </mesh>
        </group>
        <mesh position={[-0.12, 0.22, 0.02]} castShadow receiveShadow>
          <cylinderGeometry args={[0.09, 0.07, 0.5, 16]} />
          {mat('#334155')}
        </mesh>
        <mesh position={[0.12, 0.22, 0.02]} castShadow receiveShadow>
          <cylinderGeometry args={[0.09, 0.07, 0.5, 16]} />
          {mat('#334155')}
        </mesh>
      </group>
    </Float>
  );
}

/** 从 public/avatar.glb 加载的 3D 人物；isSpeaking 时可驱动口型 blend shape（需 glb 带 morph） */
function AvatarModel(props: AvatarStateProps) {
  const { isListening = false, isSpeaking = false } = props;
  const { scene } = useGLTF(AVATAR_GLB_PATH);
  const groupRef = useRef<Group>(null);
  const timeRef = useRef(0);

  useFrame((_, delta) => {
    timeRef.current += delta;
    const t = timeRef.current;
    const group = groupRef.current;
    if (!group) return;
    group.rotation.y += delta * 0.15;
    if (isListening) {
      group.rotation.x = Math.PI * 0.025;
      group.scale.setScalar(1.2);
    } else if (isSpeaking) {
      group.rotation.x = 0;
      const pulse = Math.sin(t * 7) * 0.02 + 1;
      group.scale.setScalar(1.2 * pulse);
    } else {
      // 待机：轻微呼吸感（前后微倾 + 缩放）
      group.rotation.x = Math.sin(t * 0.9) * 0.02;
      const breathe = Math.sin(t * 1.1) * 0.015 + 1;
      group.scale.setScalar(1.2 * breathe);
    }
    // 若有 blend shape（如 mouthOpen），可在此根据 TTS 时间戳驱动：
    // scene.traverse((node) => { if (node.morphTargetInfluences) { ... } });
  });

  return (
    <Float speed={1.2} rotationIntensity={0.15} floatIntensity={0.3}>
      <group ref={groupRef} position={[0, -0.5, 0]} scale={1.2}>
        <primitive object={scene.clone()} />
      </group>
    </Float>
  );
}

type AvatarStateProps = { isListening?: boolean; isSpeaking?: boolean };

/** 有 glb 用模型，没有或加载失败用占位 */
function AvatarOrPlaceholder(props: AvatarStateProps) {
  return (
    <SceneErrorBoundary fallback={<PlaceholderAvatar {...props} />}>
      <AvatarModel {...props} />
    </SceneErrorBoundary>
  );
}

type SceneProps = AvatarStateProps & { loadingLabel?: string };

export function DigitalHumanScene(props: SceneProps) {
  const loadingLabel = props.loadingLabel ?? 'Loading…';
  return (
    <>
      <ambientLight intensity={0.6} />
      <directionalLight position={[4, 6, 4]} intensity={1.2} castShadow shadow-mapSize={[512, 512]} />
      <pointLight position={[-3, 2, 2]} intensity={0.4} color="#67e8f9" />
      <Suspense fallback={<AvatarLoadingFallback label={loadingLabel} />}>
        <AvatarOrPlaceholder isListening={props.isListening} isSpeaking={props.isSpeaking} />
      </Suspense>
      <OrbitControls
        enableZoom={false}
        enablePan={false}
        minPolarAngle={Math.PI / 4}
        maxPolarAngle={Math.PI / 2}
        minAzimuthAngle={-Math.PI / 4}
        maxAzimuthAngle={Math.PI / 4}
      />
    </>
  );
}
