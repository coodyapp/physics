import { useEffect, useRef, useState } from "react";
import * as THREE from "three";

import { cn } from "@/utils/tailwind";

const WAVE_VERTEX_SHADER = `
varying vec2 vUv;

void main() {
  vUv = uv;
  gl_Position = vec4(position.xy, 0.0, 1.0);
}
`;

const WAVE_FRAGMENT_SHADER = `
uniform vec2 uResolution;
uniform float uTime;

varying vec2 vUv;

void main() {
  vec2 centered = vUv - 0.5;
  float widthFactor = smoothstep(480.0, 1280.0, uResolution.x);
  float density = mix(8.0, 15.0, widthFactor);
  float wave = sin(vUv.x * 5.0 + uTime * 0.8) * 0.09;
  wave += sin(vUv.x * 11.0 - uTime * 0.48) * 0.045;

  float linePhase = fract((vUv.y + wave) * density + uTime * 0.035);
  float line = 1.0 - smoothstep(0.0, 0.28, abs(linePhase - 0.5));
  float edgeFade = 1.0 - smoothstep(0.12, 0.62, abs(centered.y));
  float verticalFade = smoothstep(0.0, 0.1, vUv.y) * (1.0 - smoothstep(0.9, 1.0, vUv.y));
  float pulse = 0.68 + 0.32 * sin(vUv.x * 7.0 + vUv.y * 2.0 + uTime * 0.8);
  vec3 base = vec3(0.88, 0.93, 1.0);
  vec3 accent = vec3(0.38, 0.74, 1.0);
  vec3 color = mix(base, accent, 0.28 + 0.16 * sin(vUv.x * 6.28318 + uTime * 0.22));
  float alpha = line * edgeFade * verticalFade * pulse * 0.58;

  gl_FragColor = vec4(color, alpha);
}
`;

interface WaveTextProps {
  names: readonly string[];
  className?: string;
  intervalMs?: number;
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

function supportsWebGL() {
  const canvas = document.createElement("canvas");
  return Boolean(
    canvas.getContext("webgl2") ||
    canvas.getContext("webgl") ||
    canvas.getContext("experimental-webgl"),
  );
}

export function WaveText({ names, className, intervalMs = 2800 }: WaveTextProps) {
  const mountRef = useRef<HTMLSpanElement>(null);
  const prefersReducedMotion = usePrefersReducedMotion();
  const [activeIndex, setActiveIndex] = useState(0);
  const [isWebGLReady, setIsWebGLReady] = useState(false);

  const nameCount = names.length;
  const currentName = nameCount > 0 ? (names[activeIndex % nameCount] ?? names[0]) : "Physics";

  useEffect(() => {
    if (!isWebGLReady || prefersReducedMotion || nameCount < 2) return;

    const intervalId = window.setInterval(() => {
      setActiveIndex((index) => (index + 1) % nameCount);
    }, intervalMs);

    return () => {
      window.clearInterval(intervalId);
    };
  }, [intervalMs, isWebGLReady, nameCount, prefersReducedMotion]);

  useEffect(() => {
    const mount = mountRef.current;
    if (!mount || !supportsWebGL()) {
      setIsWebGLReady(false);
      return;
    }

    const scene = new THREE.Scene();
    const camera = new THREE.OrthographicCamera(-1, 1, 1, -1, 0, 1);
    const geometry = new THREE.PlaneGeometry(2, 2);
    const material = new THREE.ShaderMaterial({
      blending: THREE.AdditiveBlending,
      depthTest: false,
      depthWrite: false,
      fragmentShader: WAVE_FRAGMENT_SHADER,
      transparent: true,
      uniforms: {
        uResolution: { value: new THREE.Vector2(1, 1) },
        uTime: { value: 0 },
      },
      vertexShader: WAVE_VERTEX_SHADER,
    });
    const mesh = new THREE.Mesh(geometry, material);
    scene.add(mesh);

    let renderer: THREE.WebGLRenderer;
    try {
      renderer = new THREE.WebGLRenderer({
        alpha: true,
        antialias: false,
        powerPreference: "high-performance",
      });
    } catch {
      geometry.dispose();
      material.dispose();
      setIsWebGLReady(false);
      return;
    }

    renderer.setClearColor(0x000000, 0);
    renderer.domElement.setAttribute("aria-hidden", "true");
    renderer.domElement.style.height = "100%";
    renderer.domElement.style.inset = "0";
    renderer.domElement.style.pointerEvents = "none";
    renderer.domElement.style.position = "absolute";
    renderer.domElement.style.width = "100%";
    renderer.domElement.style.zIndex = "0";
    mount.append(renderer.domElement);

    let frameId = 0;
    let isDisposed = false;

    const renderFrame = (timestamp: number) => {
      if (isDisposed) return;

      material.uniforms.uTime.value = prefersReducedMotion ? 0 : timestamp * 0.001;
      renderer.render(scene, camera);
    };

    const resize = () => {
      if (isDisposed) return;

      const bounds = mount.getBoundingClientRect();
      const width = Math.max(Math.floor(bounds.width), 1);
      const height = Math.max(Math.floor(bounds.height), 1);
      const pixelRatio = Math.min(window.devicePixelRatio || 1, width >= 768 ? 1.75 : 1.25);

      renderer.setPixelRatio(pixelRatio);
      renderer.setSize(width, height, false);
      material.uniforms.uResolution.value.set(width * pixelRatio, height * pixelRatio);
      renderFrame(performance.now());
    };

    const animate = (timestamp: number) => {
      renderFrame(timestamp);
      frameId = window.requestAnimationFrame(animate);
    };

    resize();
    setIsWebGLReady(true);

    if (prefersReducedMotion) {
      renderFrame(0);
    } else {
      frameId = window.requestAnimationFrame(animate);
    }

    let resizeObserver: ResizeObserver | undefined;
    if (typeof ResizeObserver !== "undefined") {
      resizeObserver = new ResizeObserver(resize);
      resizeObserver.observe(mount);
    }

    return () => {
      isDisposed = true;
      window.cancelAnimationFrame(frameId);
      resizeObserver?.disconnect();

      if (mount.contains(renderer.domElement)) {
        mount.removeChild(renderer.domElement);
      }

      geometry.dispose();
      material.dispose();
      renderer.dispose();
    };
  }, [prefersReducedMotion]);

  return (
    <span
      ref={mountRef}
      className={cn(
        "relative block h-[clamp(10rem,32vw,22rem)] w-full min-w-0 overflow-hidden",
        className,
      )}
    >
      <span className="relative z-10 flex h-full items-center justify-center text-balance text-center text-[clamp(2.65rem,10vw,8rem)] font-bold leading-none tracking-[-0.08em] text-white drop-shadow-[0_18px_48px_rgba(0,0,0,0.6)]">
        <span className="sr-only" aria-live="polite">
          {currentName}
        </span>
        <span aria-hidden="true">{currentName}</span>
      </span>
    </span>
  );
}
