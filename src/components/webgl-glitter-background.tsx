import { Canvas, useFrame } from "@react-three/fiber";
import { useEffect, useMemo, useRef, useState } from "react";
import * as THREE from "three";

const VERTEX_SHADER = `
  varying vec2 vUv;

  void main() {
    vUv = uv;
    gl_Position = projectionMatrix * modelViewMatrix * vec4(position, 1.0);
  }
`;

const FRAGMENT_SHADER = `
  uniform float iTime;
  uniform sampler2D iChannel0;
  uniform vec3 sparkleColor;
  uniform float intensity;
  uniform float opacity;

  varying vec2 vUv;

  void main() {
    vec2 uv = vUv;
    float result = 0.0;

    result += texture2D(iChannel0, uv * 1.1 + vec2(iTime * -0.005)).r;
    result *= texture2D(iChannel0, uv * 0.9 + vec2(iTime * 0.005)).g;
    result = pow(result, 12.0);

    gl_FragColor = vec4(sparkleColor * intensity * result, opacity * result);
  }
`;

function generateNoiseTexture(size = 512): THREE.DataTexture {
  const data = new Uint8Array(size * size * 4);

  for (let index = 0; index < size * size; index++) {
    const stride = index * 4;

    data[stride] = Math.random() * 255;
    data[stride + 1] = Math.random() * 255;
    data[stride + 2] = Math.random() * 255;
    data[stride + 3] = 255;
  }

  const texture = new THREE.DataTexture(data, size, size, THREE.RGBAFormat);
  texture.wrapS = THREE.RepeatWrapping;
  texture.wrapT = THREE.RepeatWrapping;
  texture.minFilter = THREE.LinearFilter;
  texture.magFilter = THREE.LinearFilter;
  texture.needsUpdate = true;

  return texture;
}

function usePrefersReducedMotion() {
  const [prefersReducedMotion, setPrefersReducedMotion] = useState(false);

  useEffect(() => {
    const mediaQuery = window.matchMedia("(prefers-reduced-motion: reduce)");
    const updatePreference = () => {
      setPrefersReducedMotion(mediaQuery.matches);
    };

    updatePreference();
    mediaQuery.addEventListener("change", updatePreference);

    return () => {
      mediaQuery.removeEventListener("change", updatePreference);
    };
  }, []);

  return prefersReducedMotion;
}

interface SparklesPlaneProps {
  color: string;
  intensity: number;
  opacity: number;
  speed: number;
}

function SparklesPlane({ color, intensity, opacity, speed }: SparklesPlaneProps) {
  const meshRef = useRef<THREE.Mesh>(null);
  const noiseTexture = useMemo(() => generateNoiseTexture(), []);

  const material = useMemo(() => {
    return new THREE.ShaderMaterial({
      blending: THREE.AdditiveBlending,
      depthTest: false,
      depthWrite: false,
      fragmentShader: FRAGMENT_SHADER,
      side: THREE.DoubleSide,
      transparent: true,
      uniforms: {
        iChannel0: { value: noiseTexture },
        iTime: { value: 0 },
        intensity: { value: 5 },
        opacity: { value: 0.12 },
        sparkleColor: { value: new THREE.Color("#ffffff") },
      },
      vertexShader: VERTEX_SHADER,
    });
  }, [noiseTexture]);

  useEffect(() => {
    material.uniforms.sparkleColor.value.set(color);
    material.uniforms.intensity.value = intensity;
    material.uniforms.opacity.value = opacity;
  }, [color, intensity, material, opacity]);

  useEffect(() => {
    return () => {
      material.dispose();
      noiseTexture.dispose();
    };
  }, [material, noiseTexture]);

  useFrame((state) => {
    material.uniforms.iTime.value = state.clock.elapsedTime * speed;
  });

  return (
    <mesh ref={meshRef} material={material}>
      <planeGeometry args={[10, 10]} />
    </mesh>
  );
}

interface GlitterBackgroundProps {
  color?: string;
  intensity?: number;
  opacity?: number;
  speed?: number;
}

export function GlitterBackground({
  color = "#ffffff",
  intensity = 5,
  opacity = 0.12,
  speed = 0.75,
}: GlitterBackgroundProps) {
  const prefersReducedMotion = usePrefersReducedMotion();

  return (
    <div className="absolute inset-0 scale-125 opacity-50">
      <Canvas
        camera={{ position: [0, 0, 8], fov: 35 }}
        frameloop={prefersReducedMotion ? "demand" : "always"}
        gl={{ alpha: true, powerPreference: "high-performance" }}
        onCreated={({ gl }) => {
          gl.setClearColor(0x000000, 0);
        }}
        style={{
          height: "100%",
          width: "100%",
        }}
      >
        <SparklesPlane color={color} intensity={intensity} opacity={opacity} speed={speed} />
      </Canvas>
    </div>
  );
}
