import { Button } from "@/ui/button";
import { Link } from "react-router-dom";
import { useEffect, useRef } from "react";
import * as THREE from "three";
import { HERO_CONTENT } from "@/utils/constants";

function Home() {
  const canvasRef = useRef<HTMLCanvasElement>(null);

  useEffect(() => {
    if (!canvasRef.current) return;

    // Scene setup
    const scene = new THREE.Scene();
    const camera = new THREE.PerspectiveCamera(
      75,
      window.innerWidth / window.innerHeight,
      0.1,
      1000,
    );
    camera.position.set(0, 15, 20);
    camera.lookAt(0, 0, 0);

    const renderer = new THREE.WebGLRenderer({
      canvas: canvasRef.current,
      alpha: true,
      antialias: true,
    });
    renderer.setSize(window.innerWidth, window.innerHeight);
    renderer.setPixelRatio(Math.min(window.devicePixelRatio, 2));

    // Create spacetime fabric grid
    const gridSize = 100;
    const gridDivisions = 50;
    const vertices: number[] = [];
    const indices: number[] = [];

    // Create grid vertices
    for (let i = 0; i <= gridDivisions; i++) {
      for (let j = 0; j <= gridDivisions; j++) {
        const x = (i / gridDivisions - 0.5) * gridSize;
        const z = (j / gridDivisions - 0.5) * gridSize;
        const y = 0;
        vertices.push(x, y, z);
      }
    }

    // Create grid indices for lines
    for (let i = 0; i < gridDivisions; i++) {
      for (let j = 0; j < gridDivisions; j++) {
        const a = i * (gridDivisions + 1) + j;
        const b = a + 1;
        const c = a + (gridDivisions + 1);

        // Horizontal lines
        indices.push(a, b);
        // Vertical lines
        indices.push(a, c);
      }
    }

    // Add last column and row
    for (let i = 0; i < gridDivisions; i++) {
      const a = i * (gridDivisions + 1) + gridDivisions;
      const c = a + (gridDivisions + 1);
      indices.push(a, c);
    }
    for (let j = 0; j < gridDivisions; j++) {
      const a = gridDivisions * (gridDivisions + 1) + j;
      const b = a + 1;
      indices.push(a, b);
    }

    const geometry = new THREE.BufferGeometry();
    geometry.setAttribute("position", new THREE.Float32BufferAttribute(vertices, 3));
    geometry.setIndex(indices);

    const material = new THREE.LineBasicMaterial({
      color: 0xffffff,
      transparent: true,
      opacity: 0.1,
      blending: THREE.AdditiveBlending,
    });

    const grid = new THREE.LineSegments(geometry, material);
    scene.add(grid);

    // Animation
    let time = 0;

    const animate = () => {
      requestAnimationFrame(animate);
      time += 0.01;

      // Animate the fabric with gravitational wave effect
      const positions = grid.geometry.attributes.position.array as Float32Array;

      for (let i = 0; i <= gridDivisions; i++) {
        for (let j = 0; j <= gridDivisions; j++) {
          const index = (i * (gridDivisions + 1) + j) * 3;
          const x = positions[index];
          const z = positions[index + 2];

          // Create wave pattern from center
          const distance = Math.sqrt(x * x + z * z);
          const wave1 = Math.sin(distance * 0.3 - time * 2) * 2;
          const wave2 = Math.sin(distance * 0.15 - time * 1.5) * 1.5;

          // Combine waves for more complex motion
          positions[index + 1] = wave1 + wave2;
        }
      }

      grid.geometry.attributes.position.needsUpdate = true;

      // Gentle camera rotation
      camera.position.x = Math.sin(time * 0.1) * 5;
      camera.position.z = 20 + Math.cos(time * 0.1) * 5;
      camera.lookAt(0, 0, 20);

      renderer.render(scene, camera);
    };

    animate();

    // Handle resize
    const handleResize = () => {
      camera.aspect = window.innerWidth / window.innerHeight;
      camera.updateProjectionMatrix();
      renderer.setSize(window.innerWidth, window.innerHeight);
    };

    window.addEventListener("resize", handleResize);

    return () => {
      window.removeEventListener("resize", handleResize);
      renderer.dispose();
      geometry.dispose();
      material.dispose();
    };
  }, []);

  return (
    <div className="relative h-screen w-full overflow-hidden bg-black">
      {/* Three.js Canvas */}
      <canvas ref={canvasRef} className="absolute inset-0 z-10 pointer-events-none" />

      {/* Hero Content - Centered */}
      <div className="absolute inset-0 flex items-center justify-center z-20">
        <div className="text-center px-4">
          <div className="inline-block mb-6 px-4 py-1.5 rounded-full border border-white/20 bg-black/40 backdrop-blur-xl text-xs font-mono text-white/80">
            {HERO_CONTENT.badge}
          </div>

          <h1 className="text-5xl sm:text-6xl md:text-7xl font-bold mb-4 text-white drop-shadow-2xl">
            {HERO_CONTENT.title.main} <br />
            <span className="bg-gradient-to-r from-white to-gray-400 bg-clip-text text-transparent">
              {HERO_CONTENT.title.highlight}
            </span>
          </h1>

          <p className="text-base sm:text-lg text-white/80 text-balance mt-6 max-w-[540px] mx-auto drop-shadow-lg">
            {HERO_CONTENT.description}
          </p>

          <div className="mt-12 flex gap-4 justify-center">
            <Link to={HERO_CONTENT.cta.link}>
              <Button size="lg" className="gap-2 bg-white text-black hover:bg-white/90 shadow-2xl">
                {HERO_CONTENT.cta.text}
              </Button>
            </Link>
          </div>
        </div>
      </div>
    </div>
  );
}

export { Home };
