import { useEffect, useRef } from "react";
import * as THREE from "three";

const MATTER_VERTEX_SHADER = `
uniform float time;
uniform vec3 uSeed;
uniform float uDisplacement;

varying vec3 vNormal;
varying vec3 vPosition;
varying float vReveal;

vec3 mod289(vec3 x) {
  return x - floor(x * (1.0 / 289.0)) * 289.0;
}

vec4 mod289(vec4 x) {
  return x - floor(x * (1.0 / 289.0)) * 289.0;
}

vec4 permute(vec4 x) {
  return mod289(((x * 34.0) + 1.0) * x);
}

vec4 taylorInvSqrt(vec4 r) {
  return 1.79284291400159 - 0.85373472095314 * r;
}

float snoise(vec3 v) {
  const vec2 C = vec2(1.0 / 6.0, 1.0 / 3.0);
  const vec4 D = vec4(0.0, 0.5, 1.0, 2.0);
  vec3 i = floor(v + dot(v, C.yyy));
  vec3 x0 = v - i + dot(i, C.xxx);
  vec3 g = step(x0.yzx, x0.xyz);
  vec3 l = 1.0 - g;
  vec3 i1 = min(g.xyz, l.zxy);
  vec3 i2 = max(g.xyz, l.zxy);
  vec3 x1 = x0 - i1 + C.xxx;
  vec3 x2 = x0 - i2 + C.yyy;
  vec3 x3 = x0 - D.yyy;
  i = mod289(i);
  vec4 p = permute(permute(permute(
    i.z + vec4(0.0, i1.z, i2.z, 1.0))
    + i.y + vec4(0.0, i1.y, i2.y, 1.0))
    + i.x + vec4(0.0, i1.x, i2.x, 1.0));
  float n_ = 0.142857142857;
  vec3 ns = n_ * D.wyz - D.xzx;
  vec4 j = p - 49.0 * floor(p * ns.z * ns.z);
  vec4 x_ = floor(j * ns.z);
  vec4 y_ = floor(j - 7.0 * x_);
  vec4 x = x_ * ns.x + ns.yyyy;
  vec4 y = y_ * ns.x + ns.yyyy;
  vec4 h = 1.0 - abs(x) - abs(y);
  vec4 b0 = vec4(x.xy, y.xy);
  vec4 b1 = vec4(x.zw, y.zw);
  vec4 s0 = floor(b0) * 2.0 + 1.0;
  vec4 s1 = floor(b1) * 2.0 + 1.0;
  vec4 sh = -step(h, vec4(0.0));
  vec4 a0 = b0.xzyw + s0.xzyw * sh.xxyy;
  vec4 a1 = b1.xzyw + s1.xzyw * sh.zzww;
  vec3 p0 = vec3(a0.xy, h.x);
  vec3 p1 = vec3(a0.zw, h.y);
  vec3 p2 = vec3(a1.xy, h.z);
  vec3 p3 = vec3(a1.zw, h.w);
  vec4 norm = taylorInvSqrt(vec4(
    dot(p0, p0),
    dot(p1, p1),
    dot(p2, p2),
    dot(p3, p3)
  ));
  p0 *= norm.x;
  p1 *= norm.y;
  p2 *= norm.z;
  p3 *= norm.w;
  vec4 m = max(0.6 - vec4(
    dot(x0, x0),
    dot(x1, x1),
    dot(x2, x2),
    dot(x3, x3)
  ), 0.0);
  m = m * m;
  return 42.0 * dot(m * m, vec4(
    dot(p0, x0),
    dot(p1, x1),
    dot(p2, x2),
    dot(p3, x3)
  ));
}

void main() {
  float n1 = snoise(position * 2.0 + uSeed + time * 0.5);
  float n2 = snoise(position * 4.0 + uSeed * 1.7 + time * 0.3) * 0.5;
  float displacement = (n1 + n2) * uDisplacement;
  vec3 newPosition = position + normal * displacement;
  vec4 worldPosition = modelMatrix * vec4(newPosition, 1.0);

  vNormal = normalize(mat3(modelMatrix) * normal);
  vPosition = worldPosition.xyz;
  vReveal = (snoise(position * 1.2 + uSeed * 0.3) + 1.0) * 0.5;
  gl_Position = projectionMatrix * viewMatrix * worldPosition;
}
`;

const MATTER_FRAGMENT_SHADER = `
uniform vec3 color;
uniform float opacity;
uniform vec3 pointLightPosition;
uniform float uReveal;

varying vec3 vNormal;
varying vec3 vPosition;
varying float vReveal;

void main() {
  if (vReveal > uReveal) discard;

  vec3 normal = normalize(vNormal);
  vec3 lightDir = normalize(pointLightPosition - vPosition);
  vec3 viewDir = normalize(cameraPosition - vPosition);
  float diffuse = max(dot(normal, lightDir), 0.0);
  float fresnel = pow(1.0 - max(dot(normal, viewDir), 0.0), 2.0);
  vec3 finalColor = color * (diffuse * 0.85 + fresnel * 0.65 + 0.08);

  float edgeGlow = 1.0 - smoothstep(0.0, 0.06, uReveal - vReveal);
  finalColor += color * edgeGlow * 1.8;

  gl_FragColor = vec4(finalColor, opacity);
}
`;

interface SphereBackgroundProps {
  color?: string;
  opacity?: number;
  radius?: number;
  displacement?: number;
  pulse?: boolean;
  pulseAmplitude?: number;
  pulseSpeed?: number;
  fadeIn?: boolean;
  fadeInDuration?: number;
}

export function SphereBackground({
  color = "#ffffff",
  opacity = 0.01,
  radius = 1.5,
  displacement = 0.25,
  pulse = true,
  pulseAmplitude = 0.07,
  pulseSpeed = 0.8,
  fadeIn = true,
  fadeInDuration = 5000,
}: SphereBackgroundProps) {
  const mountRef = useRef<HTMLDivElement>(null);
  const materialRef = useRef<THREE.ShaderMaterial | null>(null);
  const themeRef = useRef({ color, opacity });
  const pulseRef = useRef({ pulse, pulseAmplitude, pulseSpeed });
  const displacementRef = useRef(displacement);
  const fadeInRef = useRef({ fadeIn, fadeInDuration });

  themeRef.current = { color, opacity };
  pulseRef.current = { pulse, pulseAmplitude, pulseSpeed };
  displacementRef.current = displacement;
  fadeInRef.current = { fadeIn, fadeInDuration };

  useEffect(() => {
    const material = materialRef.current;
    if (!material) return;

    material.uniforms.color.value.set(color);
    material.uniforms.opacity.value = opacity;
  }, [color, opacity]);

  useEffect(() => {
    const material = materialRef.current;
    if (!material) return;

    material.uniforms.uDisplacement.value = displacement;
  }, [displacement]);

  useEffect(() => {
    const currentMount = mountRef.current;
    if (!currentMount) return;

    const prefersReducedMotion = window.matchMedia("(prefers-reduced-motion: reduce)");
    const scene = new THREE.Scene();
    const camera = new THREE.PerspectiveCamera(75, 1, 0.1, 1000);
    camera.position.z = radius * 1.6;

    let renderer: THREE.WebGLRenderer;
    try {
      renderer = new THREE.WebGLRenderer({
        alpha: true,
        antialias: true,
        powerPreference: "high-performance",
      });
    } catch {
      return;
    }

    renderer.setClearColor(0x000000, 0);
    renderer.domElement.className = "size-full";
    currentMount.append(renderer.domElement);

    const geometry = new THREE.IcosahedronGeometry(radius, 64);
    const material = new THREE.ShaderMaterial({
      blending: THREE.AdditiveBlending,
      depthWrite: false,
      fragmentShader: MATTER_FRAGMENT_SHADER,
      transparent: true,
      uniforms: {
        color: { value: new THREE.Color(themeRef.current.color) },
        opacity: { value: fadeInRef.current.fadeIn ? 0 : themeRef.current.opacity },
        pointLightPosition: { value: new THREE.Vector3(0, 0, 5) },
        time: { value: 0 },
        uDisplacement: { value: displacementRef.current },
        uReveal: { value: fadeInRef.current.fadeIn ? 0 : 1 },
        uSeed: {
          value: new THREE.Vector3(Math.random() * 100, Math.random() * 100, Math.random() * 100),
        },
      },
      vertexShader: MATTER_VERTEX_SHADER,
      wireframe: true,
    });
    materialRef.current = material;

    const mesh = new THREE.Mesh(geometry, material);
    mesh.rotation.set(-0.18, 0.4, 0.08);
    mesh.position.set(0, 0, 0);
    scene.add(mesh);

    const targetLightPosition = new THREE.Vector3(0.8, -0.2, 2);
    const currentLightPosition = targetLightPosition.clone();

    let baseScale = 1;
    const resize = () => {
      const bounds = currentMount.getBoundingClientRect();
      const width = Math.max(bounds.width, 1);
      const height = Math.max(bounds.height, 1);
      const isWide = width >= 768;

      camera.aspect = width / height;
      camera.updateProjectionMatrix();
      renderer.setPixelRatio(Math.min(window.devicePixelRatio, isWide ? 2 : 1.5));
      renderer.setSize(width, height, false);
      baseScale = isWide ? 1 : 0.82;
      mesh.scale.setScalar(baseScale);
    };

    const moveLight = (event: PointerEvent) => {
      const x = (event.clientX / window.innerWidth) * 2 - 1;
      const y = -(event.clientY / window.innerHeight) * 2 + 1;
      const vector = new THREE.Vector3(x, y, 0.5).unproject(camera);
      const direction = vector.sub(camera.position).normalize();
      const distance = -camera.position.z / direction.z;
      const position = camera.position.clone().add(direction.multiplyScalar(distance));

      position.z = 2;
      targetLightPosition.copy(position);
    };

    let frameId = 0;
    let firstFrameTime = 0;
    const renderFrame = (timestamp: number) => {
      const time = timestamp * 0.001;
      const currentPulse = pulseRef.current;
      const currentFade = fadeInRef.current;
      const pulseScale = currentPulse.pulse
        ? 1 + Math.sin(time * currentPulse.pulseSpeed) * currentPulse.pulseAmplitude
        : 1;

      if (currentFade.fadeIn) {
        if (firstFrameTime === 0) firstFrameTime = timestamp;

        const progress = Math.min((timestamp - firstFrameTime) / currentFade.fadeInDuration, 1);
        const eased = 1 - Math.pow(1 - progress, 3);
        material.uniforms.uReveal.value = eased;
        material.uniforms.opacity.value = themeRef.current.opacity * eased;
      }

      currentLightPosition.lerp(targetLightPosition, 0.08);
      material.uniforms.pointLightPosition.value.copy(currentLightPosition);
      material.uniforms.time.value = time * 0.28;
      mesh.scale.setScalar(baseScale * pulseScale);
      mesh.rotation.x = -0.18 + Math.sin(time * 0.18) * 0.04;
      mesh.rotation.y = 0.4 + time * 0.08;
      mesh.rotation.z = 0.08 + Math.sin(time * 0.12) * 0.03;
      renderer.render(scene, camera);
    };

    const animate = (timestamp: number) => {
      renderFrame(timestamp);
      frameId = requestAnimationFrame(animate);
    };

    const startAnimation = () => {
      if (frameId) return;
      frameId = requestAnimationFrame(animate);
    };

    const stopAnimation = () => {
      cancelAnimationFrame(frameId);
      frameId = 0;
    };

    const handleMotionChange = () => {
      if (prefersReducedMotion.matches) {
        stopAnimation();
        firstFrameTime = 0;
        material.uniforms.uReveal.value = 1;
        material.uniforms.opacity.value = themeRef.current.opacity;
        renderFrame(performance.now());
      } else {
        startAnimation();
      }
    };

    resize();
    handleMotionChange();

    const resizeObserver = new ResizeObserver(resize);
    resizeObserver.observe(currentMount);
    window.addEventListener("pointermove", moveLight);
    prefersReducedMotion.addEventListener("change", handleMotionChange);

    return () => {
      stopAnimation();
      resizeObserver.disconnect();
      window.removeEventListener("pointermove", moveLight);
      prefersReducedMotion.removeEventListener("change", handleMotionChange);

      if (currentMount.contains(renderer.domElement)) {
        currentMount.removeChild(renderer.domElement);
      }

      geometry.dispose();
      material.dispose();
      materialRef.current = null;
      renderer.dispose();
    };
  }, [radius]);

  return <div ref={mountRef} className="absolute inset-0" />;
}
