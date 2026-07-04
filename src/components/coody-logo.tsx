import { useEffect, useRef } from "react";

const VERTEX_SHADER = `
attribute vec2 aPosition;
attribute vec2 aTexCoord;
varying vec2 vUv;

void main() {
  vUv = aTexCoord;
  gl_Position = vec4(aPosition, 0.0, 1.0);
}
`;

const FRAGMENT_SHADER = `
precision highp float;

varying vec2 vUv;

uniform sampler2D uTexture;
uniform float uGlitch;
uniform float uTime;
uniform float uFade;
uniform vec2 uResolution;

float rand(vec2 co) {
  return fract(sin(dot(co, vec2(12.9898, 78.233))) * 43758.5453);
}

void main() {
  vec2 uv = vUv;

  float fineSlices = 12.0;
  float fineId = floor(uv.y * fineSlices);
  float fineRand = rand(vec2(fineId, floor(uTime * 20.0)));
  float fineDx = (fineRand - 0.5) * uGlitch * 0.06;

  float coarseSlices = 4.0;
  float coarseId = floor(uv.y * coarseSlices);
  float coarseRand = rand(vec2(coarseId, floor(uTime * 8.0)));
  float coarseDx = (coarseRand - 0.5) * uGlitch * 0.12;

  vec2 dUv = vec2(uv.x + fineDx + coarseDx, uv.y);

  float shift = uGlitch * 0.03;
  float r = texture2D(uTexture, dUv + vec2(shift, 0.0)).r;
  float g = texture2D(uTexture, dUv).g;
  float b = texture2D(uTexture, dUv - vec2(shift, 0.0)).b;
  float a = texture2D(uTexture, dUv).a;

  vec3 color = vec3(r, g, b);
  float scan = sin(uv.y * uResolution.y * 1.5) * 0.04 * uGlitch;
  color -= scan;

  float noise = rand(uv + fract(uTime)) * uGlitch * 0.18;
  color = mix(color, vec3(noise), uGlitch * 0.1 * a);
  color += vec3(0.08, 0.0, 0.12) * uGlitch * a;

  gl_FragColor = vec4(color * uFade, a * uFade);
}
`;

function compileShader(
  gl: WebGLRenderingContext,
  type: number,
  source: string,
): WebGLShader | null {
  const shader = gl.createShader(type);
  if (!shader) return null;

  gl.shaderSource(shader, source);
  gl.compileShader(shader);

  if (!gl.getShaderParameter(shader, gl.COMPILE_STATUS)) {
    gl.deleteShader(shader);
    return null;
  }

  return shader;
}

export function CoodyLogo({ height = 30 }: { height?: number }) {
  const canvasRef = useRef<HTMLCanvasElement>(null);

  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;

    let disposed = false;
    let frameId = 0;
    let gl: WebGLRenderingContext | null = null;
    let program: WebGLProgram | null = null;
    let texture: WebGLTexture | null = null;
    let positionBuffer: WebGLBuffer | null = null;
    let texCoordBuffer: WebGLBuffer | null = null;

    const prefersReducedMotion = window.matchMedia("(prefers-reduced-motion: reduce)");
    const image = new Image();

    image.onload = () => {
      if (disposed) return;

      const dpr = Math.min(window.devicePixelRatio, 2);
      const aspect = image.naturalWidth / image.naturalHeight;
      const displayWidth = height * aspect;

      canvas.width = Math.round(displayWidth * dpr);
      canvas.height = Math.round(height * dpr);
      canvas.style.width = `${displayWidth}px`;
      canvas.style.height = `${height}px`;

      const glCtx = canvas.getContext("webgl", {
        alpha: true,
        antialias: true,
        premultipliedAlpha: false,
      });

      if (!glCtx) return;
      gl = glCtx;

      const vs = compileShader(glCtx, glCtx.VERTEX_SHADER, VERTEX_SHADER);
      const fs = compileShader(glCtx, glCtx.FRAGMENT_SHADER, FRAGMENT_SHADER);
      if (!vs || !fs) return;

      const prog = glCtx.createProgram();
      if (!prog) return;

      glCtx.attachShader(prog, vs);
      glCtx.attachShader(prog, fs);
      glCtx.linkProgram(prog);
      glCtx.deleteShader(vs);
      glCtx.deleteShader(fs);

      if (!glCtx.getProgramParameter(prog, glCtx.LINK_STATUS)) return;

      glCtx.useProgram(prog);
      program = prog;

      const positions = new Float32Array([-1, -1, 1, -1, -1, 1, 1, 1]);
      const texCoords = new Float32Array([0, 1, 1, 1, 0, 0, 1, 0]);

      positionBuffer = glCtx.createBuffer();
      glCtx.bindBuffer(glCtx.ARRAY_BUFFER, positionBuffer);
      glCtx.bufferData(glCtx.ARRAY_BUFFER, positions, glCtx.STATIC_DRAW);
      const posLoc = glCtx.getAttribLocation(prog, "aPosition");
      glCtx.enableVertexAttribArray(posLoc);
      glCtx.vertexAttribPointer(posLoc, 2, glCtx.FLOAT, false, 0, 0);

      texCoordBuffer = glCtx.createBuffer();
      glCtx.bindBuffer(glCtx.ARRAY_BUFFER, texCoordBuffer);
      glCtx.bufferData(glCtx.ARRAY_BUFFER, texCoords, glCtx.STATIC_DRAW);
      const uvLoc = glCtx.getAttribLocation(prog, "aTexCoord");
      glCtx.enableVertexAttribArray(uvLoc);
      glCtx.vertexAttribPointer(uvLoc, 2, glCtx.FLOAT, false, 0, 0);

      texture = glCtx.createTexture();
      glCtx.bindTexture(glCtx.TEXTURE_2D, texture);
      glCtx.texImage2D(glCtx.TEXTURE_2D, 0, glCtx.RGBA, glCtx.RGBA, glCtx.UNSIGNED_BYTE, image);
      glCtx.texParameteri(glCtx.TEXTURE_2D, glCtx.TEXTURE_WRAP_S, glCtx.CLAMP_TO_EDGE);
      glCtx.texParameteri(glCtx.TEXTURE_2D, glCtx.TEXTURE_WRAP_T, glCtx.CLAMP_TO_EDGE);
      glCtx.texParameteri(glCtx.TEXTURE_2D, glCtx.TEXTURE_MIN_FILTER, glCtx.LINEAR);
      glCtx.texParameteri(glCtx.TEXTURE_2D, glCtx.TEXTURE_MAG_FILTER, glCtx.LINEAR);

      const uTexture = glCtx.getUniformLocation(prog, "uTexture");
      const uGlitch = glCtx.getUniformLocation(prog, "uGlitch");
      const uTime = glCtx.getUniformLocation(prog, "uTime");
      const uFade = glCtx.getUniformLocation(prog, "uFade");
      const uResolution = glCtx.getUniformLocation(prog, "uResolution");

      glCtx.uniform1i(uTexture, 0);
      glCtx.uniform2f(uResolution, canvas.width, canvas.height);
      glCtx.viewport(0, 0, canvas.width, canvas.height);

      const startTime = performance.now();
      let lastGlitchStart = -10000;

      const animate = (now: number) => {
        if (disposed) return;

        const elapsed = (now - startTime) / 1000;
        const fadeProgress = Math.min((now - startTime) / 800, 1);
        const fade = 1 - Math.pow(1 - fadeProgress, 3);

        let glitch = 0;
        if (!prefersReducedMotion.matches) {
          const sinceGlitch = now - lastGlitchStart;
          if (sinceGlitch > 4000) {
            lastGlitchStart = now;
          }

          const glitchElapsed = now - lastGlitchStart;
          if (glitchElapsed < 400) {
            glitch = Math.sin((glitchElapsed / 400) * Math.PI);
          }
        }

        glCtx.uniform1f(uGlitch, glitch);
        glCtx.uniform1f(uTime, elapsed);
        glCtx.uniform1f(uFade, fade);
        glCtx.drawArrays(glCtx.TRIANGLE_STRIP, 0, 4);

        frameId = requestAnimationFrame(animate);
      };

      frameId = requestAnimationFrame(animate);
    };

    image.src = "/logo-white.png";

    return () => {
      disposed = true;
      cancelAnimationFrame(frameId);

      if (gl) {
        if (texture) gl.deleteTexture(texture);
        if (program) gl.deleteProgram(program);
        if (positionBuffer) gl.deleteBuffer(positionBuffer);
        if (texCoordBuffer) gl.deleteBuffer(texCoordBuffer);

        const ext = gl.getExtension("WEBGL_lose_context");
        if (ext) ext.loseContext();
      }
    };
  }, [height]);

  return (
    <a
      href="https://coody.app"
      target="_blank"
      rel="noopener noreferrer"
      aria-label="Coody"
      className="inline-flex opacity-90 transition-opacity duration-300 hover:opacity-100"
    >
      <canvas ref={canvasRef} />
    </a>
  );
}
