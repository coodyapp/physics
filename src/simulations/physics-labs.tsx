import { useEffect, useRef, useState } from "react";
import type { ComponentType, ReactNode } from "react";
import { ChevronLeft, ChevronRight, ListTree, SlidersHorizontal } from "lucide-react";
import { Link, useParams } from "react-router-dom";

import { Badge } from "@/ui/badge";
import { Button } from "@/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/ui/card";
import { Label } from "@/ui/label";
import { Slider } from "@/ui/slider";

export type LabCategory = "mechanics" | "electromagnetism" | "thermodynamics" | "quantum-mechanics";

export type LabDefinition = {
  category: LabCategory;
  slug: string;
  title: string;
  summary: string;
  principle: string;
  equations: string[];
  method: string;
  expectedOutput: string;
  component: ComponentType;
};

type CanvasDraw = (
  ctx: CanvasRenderingContext2D,
  width: number,
  height: number,
  time: number,
  delta: number,
) => void;

type Particle = {
  x: number;
  y: number;
  vx: number;
  vy: number;
  radius: number;
};

type ParticleState = {
  x: number;
  y: number;
  vx: number;
  vy: number;
};

export const LAB_CATEGORY_LABELS: Record<LabCategory, string> = {
  mechanics: "Mechanics",
  electromagnetism: "Electromagnetism",
  thermodynamics: "Thermodynamics",
  "quantum-mechanics": "Quantum Mechanics",
};

export const LAB_CATEGORY_ORDER: LabCategory[] = [
  "mechanics",
  "electromagnetism",
  "thermodynamics",
  "quantum-mechanics",
];

function useCanvasAnimation(draw: CanvasDraw) {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const drawRef = useRef(draw);
  drawRef.current = draw;

  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;

    const ctx = canvas.getContext("2d");
    if (!ctx) return;

    let frameId = 0;
    let lastTime = performance.now();

    const resize = () => {
      const bounds = canvas.getBoundingClientRect();
      const dpr = Math.min(window.devicePixelRatio, 2);

      canvas.width = Math.max(1, Math.round(bounds.width * dpr));
      canvas.height = Math.max(1, Math.round(bounds.height * dpr));
      ctx.setTransform(dpr, 0, 0, dpr, 0, 0);
    };

    const render = (now: number) => {
      const bounds = canvas.getBoundingClientRect();
      const delta = Math.min((now - lastTime) / 1000, 0.05);
      lastTime = now;

      drawRef.current(ctx, bounds.width, bounds.height, now / 1000, delta);
      frameId = requestAnimationFrame(render);
    };

    resize();
    const resizeObserver = new ResizeObserver(resize);
    resizeObserver.observe(canvas);
    frameId = requestAnimationFrame(render);

    return () => {
      cancelAnimationFrame(frameId);
      resizeObserver.disconnect();
    };
  }, []);

  return canvasRef;
}

function LabCanvas({ children }: { children: ReactNode }) {
  return (
    <div className="relative h-full min-h-[520px] overflow-hidden bg-slate-950">{children}</div>
  );
}

function formatSliderValue(value: number, step: number, unit: string) {
  const precision = step >= 1 ? 0 : step >= 0.1 ? 1 : step >= 0.01 ? 2 : 3;

  return `${value.toFixed(precision)}${unit}`;
}

function ControlPanel({ title, children }: { title: string; children: ReactNode }) {
  return (
    <div className="absolute inset-x-3 bottom-3 z-10 max-h-[55%] overflow-y-auto rounded-2xl border border-white/10 bg-black/65 p-4 text-white shadow-2xl backdrop-blur-xl sm:top-4 sm:bottom-auto sm:left-4 sm:w-80 sm:max-h-[calc(100%-2rem)]">
      <div className="mb-4 flex items-start justify-between gap-3 border-b border-white/10 pb-3">
        <div>
          <div className="text-[0.65rem] font-semibold uppercase tracking-[0.22em] text-cyan-200/70">
            Parameters
          </div>
          <div className="mt-1 text-sm font-semibold">{title}</div>
        </div>
        <div className="rounded-full border border-white/10 bg-white/10 p-2 text-cyan-100">
          <SlidersHorizontal className="size-4" />
        </div>
      </div>
      <div className="space-y-4">{children}</div>
    </div>
  );
}

function SliderControl({
  label,
  value,
  min,
  max,
  step,
  unit = "",
  onChange,
}: {
  label: string;
  value: number;
  min: number;
  max: number;
  step: number;
  unit?: string;
  onChange: (value: number) => void;
}) {
  const displayedValue = formatSliderValue(value, step, unit);

  return (
    <div className="space-y-2">
      <div className="flex items-center justify-between gap-3">
        <Label className="text-xs font-medium text-white/75">{label}</Label>
        <span className="rounded-full bg-white/10 px-2 py-0.5 font-mono text-xs text-white/80">
          {displayedValue}
        </span>
      </div>
      <Slider
        value={[value]}
        min={min}
        max={max}
        step={step}
        onValueChange={([next]) => onChange(next ?? value)}
      />
      <div className="flex justify-between font-mono text-[0.65rem] text-white/35">
        <span>{formatSliderValue(min, step, unit)}</span>
        <span>{formatSliderValue(max, step, unit)}</span>
      </div>
    </div>
  );
}

function clearLabCanvas(ctx: CanvasRenderingContext2D, width: number, height: number) {
  const gradient = ctx.createRadialGradient(
    width * 0.5,
    height * 0.3,
    0,
    width * 0.5,
    height * 0.5,
    width,
  );
  gradient.addColorStop(0, "#172554");
  gradient.addColorStop(0.45, "#020617");
  gradient.addColorStop(1, "#000000");
  ctx.fillStyle = gradient;
  ctx.fillRect(0, 0, width, height);
}

function drawArrow(
  ctx: CanvasRenderingContext2D,
  x: number,
  y: number,
  dx: number,
  dy: number,
  color: string,
) {
  const angle = Math.atan2(dy, dx);
  ctx.strokeStyle = color;
  ctx.fillStyle = color;
  ctx.lineWidth = 1.2;
  ctx.beginPath();
  ctx.moveTo(x, y);
  ctx.lineTo(x + dx, y + dy);
  ctx.stroke();
  ctx.beginPath();
  ctx.moveTo(x + dx, y + dy);
  ctx.lineTo(x + dx - 6 * Math.cos(angle - 0.45), y + dy - 6 * Math.sin(angle - 0.45));
  ctx.lineTo(x + dx - 6 * Math.cos(angle + 0.45), y + dy - 6 * Math.sin(angle + 0.45));
  ctx.closePath();
  ctx.fill();
}

function heatColor(value: number) {
  const v = Math.max(0, Math.min(1, value));
  const hue = 240 - 240 * v;
  const lightness = 16 + 48 * v;
  return `hsl(${hue} 95% ${lightness}%)`;
}

function ProjectileMotionSimulation() {
  const [launchAngle, setLaunchAngle] = useState(42);
  const [launchSpeed, setLaunchSpeed] = useState(7.4);
  const [gravity, setGravity] = useState(9.8);

  const canvasRef = useCanvasAnimation((ctx, width, height, time) => {
    clearLabCanvas(ctx, width, height);

    const angle = (launchAngle * Math.PI) / 180;
    const vx = launchSpeed * Math.cos(angle);
    const vy = launchSpeed * Math.sin(angle);
    const flightTime = Math.max(0.1, (2 * vy) / gravity);
    const range = vx * flightTime;
    const maxHeight = (vy * vy) / (2 * gravity);
    const plotX = width * 0.08;
    const groundY = height * 0.82;
    const plotW = width * 0.84;
    const plotH = height * 0.58;
    const scaleX = plotW / Math.max(range, 1);
    const scaleY = plotH / Math.max(maxHeight * 1.35, 1);

    ctx.strokeStyle = "rgba(255,255,255,0.2)";
    ctx.lineWidth = 1;
    for (let line = 0; line <= 4; line++) {
      const y = groundY - (line / 4) * plotH;
      ctx.beginPath();
      ctx.moveTo(plotX, y);
      ctx.lineTo(plotX + plotW, y);
      ctx.stroke();
    }

    ctx.strokeStyle = "rgba(255,255,255,0.46)";
    ctx.lineWidth = 2;
    ctx.beginPath();
    ctx.moveTo(plotX, groundY);
    ctx.lineTo(plotX + plotW, groundY);
    ctx.stroke();

    ctx.strokeStyle = "rgba(56,189,248,0.9)";
    ctx.lineWidth = 2.5;
    ctx.beginPath();
    for (let i = 0; i <= 96; i++) {
      const t = (i / 96) * flightTime;
      const x = vx * t;
      const y = vy * t - 0.5 * gravity * t * t;
      const screenX = plotX + x * scaleX;
      const screenY = groundY - y * scaleY;
      if (i === 0) ctx.moveTo(screenX, screenY);
      else ctx.lineTo(screenX, screenY);
    }
    ctx.stroke();

    const currentTime = ((time * 0.24) % 1) * flightTime;
    const projectileX = vx * currentTime;
    const projectileY = vy * currentTime - 0.5 * gravity * currentTime * currentTime;
    const screenX = plotX + projectileX * scaleX;
    const screenY = groundY - projectileY * scaleY;

    ctx.fillStyle = "#f97316";
    ctx.beginPath();
    ctx.arc(screenX, screenY, 10, 0, Math.PI * 2);
    ctx.fill();

    drawArrow(
      ctx,
      screenX,
      screenY,
      Math.min(54, vx * 8),
      -(vy - gravity * currentTime) * 8,
      "#fde68a",
    );

    ctx.fillStyle = "rgba(255,255,255,0.72)";
    ctx.font = "13px ui-monospace";
    ctx.fillText(`range ~= ${range.toFixed(1)} m`, plotX, height * 0.16);
    ctx.fillText(`flight time ~= ${flightTime.toFixed(2)} s`, plotX, height * 0.16 + 22);
  });

  return (
    <LabCanvas>
      <canvas ref={canvasRef} className="absolute inset-0 size-full" />
      <ControlPanel title="Projectile launch">
        <div className="space-y-4">
          <SliderControl
            label="Launch angle"
            value={launchAngle}
            min={10}
            max={80}
            step={1}
            unit=" deg"
            onChange={setLaunchAngle}
          />
          <SliderControl
            label="Launch speed"
            value={launchSpeed}
            min={3}
            max={12}
            step={0.1}
            unit=" m/s"
            onChange={setLaunchSpeed}
          />
          <SliderControl
            label="Gravity"
            value={gravity}
            min={1.6}
            max={16}
            step={0.1}
            unit=" m/s2"
            onChange={setGravity}
          />
        </div>
      </ControlPanel>
    </LabCanvas>
  );
}

function SpringMassSimulation() {
  const [stiffness, setStiffness] = useState(1.4);
  const [damping, setDamping] = useState(0.35);
  const [drive, setDrive] = useState(0.4);

  const canvasRef = useCanvasAnimation((ctx, width, height, time) => {
    clearLabCanvas(ctx, width, height);

    const centerY = height * 0.5;
    const anchorX = width * 0.18;
    const equilibriumX = width * 0.64;
    const amplitude = 0.06 + 0.2 * (1 - damping / 1.2);
    const displacement =
      amplitude * Math.sin(time * Math.sqrt(stiffness) * 2.5) + drive * 0.08 * Math.sin(time * 1.8);
    const massX = equilibriumX + displacement * width * 0.45;
    const massW = Math.min(96, width * 0.14);
    const massH = Math.min(86, height * 0.18);

    ctx.strokeStyle = "rgba(255,255,255,0.35)";
    ctx.lineWidth = 4;
    ctx.beginPath();
    ctx.moveTo(anchorX, centerY - 90);
    ctx.lineTo(anchorX, centerY + 90);
    ctx.stroke();

    ctx.strokeStyle = "rgba(148,163,184,0.55)";
    ctx.setLineDash([8, 8]);
    ctx.beginPath();
    ctx.moveTo(equilibriumX, centerY - 120);
    ctx.lineTo(equilibriumX, centerY + 120);
    ctx.stroke();
    ctx.setLineDash([]);

    ctx.strokeStyle = "#67e8f9";
    ctx.lineWidth = 3;
    ctx.beginPath();
    ctx.moveTo(anchorX, centerY);
    const springEnd = massX - massW / 2;
    const springLength = springEnd - anchorX;
    const turns = 14;
    for (let i = 1; i <= turns * 2; i++) {
      const x = anchorX + (i / (turns * 2)) * springLength;
      const y = centerY + (i % 2 === 0 ? -18 : 18);
      ctx.lineTo(x, y);
    }
    ctx.lineTo(springEnd, centerY);
    ctx.stroke();

    ctx.fillStyle = "#f97316";
    ctx.fillRect(massX - massW / 2, centerY - massH / 2, massW, massH);
    ctx.strokeStyle = "rgba(255,255,255,0.5)";
    ctx.strokeRect(massX - massW / 2, centerY - massH / 2, massW, massH);

    const potential = Math.min(1, 0.5 * stiffness * displacement * displacement * 10);
    const kinetic = Math.min(
      1,
      Math.abs(Math.cos(time * Math.sqrt(stiffness) * 2.5)) * (1 - damping * 0.45),
    );
    const barX = width * 0.08;
    const barY = height * 0.18;
    ctx.fillStyle = "rgba(255,255,255,0.72)";
    ctx.font = "13px ui-monospace";
    ctx.fillText("energy exchange", barX, barY - 18);
    ctx.fillStyle = "rgba(56,189,248,0.35)";
    ctx.fillRect(barX, barY, width * 0.22, 12);
    ctx.fillStyle = "#38bdf8";
    ctx.fillRect(barX, barY, width * 0.22 * potential, 12);
    ctx.fillStyle = "rgba(251,113,133,0.35)";
    ctx.fillRect(barX, barY + 24, width * 0.22, 12);
    ctx.fillStyle = "#fb7185";
    ctx.fillRect(barX, barY + 24, width * 0.22 * kinetic, 12);
  });

  return (
    <LabCanvas>
      <canvas ref={canvasRef} className="absolute inset-0 size-full" />
      <ControlPanel title="Driven spring-mass">
        <div className="space-y-4">
          <SliderControl
            label="Spring stiffness"
            value={stiffness}
            min={0.4}
            max={3}
            step={0.1}
            onChange={setStiffness}
          />
          <SliderControl
            label="Damping"
            value={damping}
            min={0}
            max={1.1}
            step={0.05}
            onChange={setDamping}
          />
          <SliderControl
            label="Drive strength"
            value={drive}
            min={0}
            max={1.4}
            step={0.1}
            onChange={setDrive}
          />
        </div>
      </ControlPanel>
    </LabCanvas>
  );
}

function DampedPendulumSimulation() {
  const [length, setLength] = useState(1.1);
  const [gravity, setGravity] = useState(9.8);
  const [damping, setDamping] = useState(0.22);
  const [initialAngle, setInitialAngle] = useState(44);
  const startTimeRef = useRef(0);

  useEffect(() => {
    startTimeRef.current = 0;
  }, [length, gravity, damping, initialAngle]);

  const canvasRef = useCanvasAnimation((ctx, width, height, time) => {
    if (startTimeRef.current === 0) startTimeRef.current = time;

    clearLabCanvas(ctx, width, height);
    const localTime = time - startTimeRef.current;
    const pivotX = width * 0.5;
    const pivotY = height * 0.16;
    const pixelLength = Math.min(width, height) * 0.3 * length;
    const angle0 = (initialAngle * Math.PI) / 180;
    const omega = Math.sqrt(gravity / length);
    const angle = angle0 * Math.exp(-damping * localTime * 0.16) * Math.cos(omega * localTime);
    const bobX = pivotX + Math.sin(angle) * pixelLength;
    const bobY = pivotY + Math.cos(angle) * pixelLength;

    ctx.strokeStyle = "rgba(255,255,255,0.22)";
    ctx.lineWidth = 1;
    ctx.beginPath();
    ctx.arc(pivotX, pivotY, pixelLength, Math.PI / 2 - angle0, Math.PI / 2 + angle0);
    ctx.stroke();

    ctx.strokeStyle = "rgba(255,255,255,0.65)";
    ctx.lineWidth = 3;
    ctx.beginPath();
    ctx.moveTo(pivotX, pivotY);
    ctx.lineTo(bobX, bobY);
    ctx.stroke();

    ctx.fillStyle = "#67e8f9";
    ctx.beginPath();
    ctx.arc(pivotX, pivotY, 7, 0, Math.PI * 2);
    ctx.fill();

    ctx.fillStyle = "#f97316";
    ctx.beginPath();
    ctx.arc(bobX, bobY, 18, 0, Math.PI * 2);
    ctx.fill();

    const period = 2 * Math.PI * Math.sqrt(length / gravity);
    ctx.fillStyle = "rgba(255,255,255,0.72)";
    ctx.font = "13px ui-monospace";
    ctx.fillText(`small-angle period ~= ${period.toFixed(2)} s`, width * 0.08, height * 0.82);
    ctx.fillText(
      `angle ~= ${((angle * 180) / Math.PI).toFixed(1)} deg`,
      width * 0.08,
      height * 0.82 + 22,
    );
  });

  return (
    <LabCanvas>
      <canvas ref={canvasRef} className="absolute inset-0 size-full" />
      <ControlPanel title="Damped pendulum">
        <div className="space-y-4">
          <SliderControl
            label="String length"
            value={length}
            min={0.5}
            max={1.8}
            step={0.1}
            unit=" m"
            onChange={setLength}
          />
          <SliderControl
            label="Gravity"
            value={gravity}
            min={1.6}
            max={16}
            step={0.1}
            unit=" m/s2"
            onChange={setGravity}
          />
          <SliderControl
            label="Damping"
            value={damping}
            min={0}
            max={0.9}
            step={0.05}
            onChange={setDamping}
          />
          <SliderControl
            label="Initial angle"
            value={initialAngle}
            min={5}
            max={75}
            step={1}
            unit=" deg"
            onChange={setInitialAngle}
          />
        </div>
      </ControlPanel>
    </LabCanvas>
  );
}

function ElectricFieldLinesSimulation() {
  const [separation, setSeparation] = useState(1.2);
  const [chargeRatio, setChargeRatio] = useState(-1);

  const canvasRef = useCanvasAnimation((ctx, width, height) => {
    clearLabCanvas(ctx, width, height);

    const scale = Math.min(width, height) * 0.22;
    const charges = [
      { x: width / 2 - separation * scale, y: height / 2, q: 1, color: "#38bdf8" },
      { x: width / 2 + separation * scale, y: height / 2, q: chargeRatio, color: "#fb7185" },
    ];

    const fieldAt = (x: number, y: number) => {
      let ex = 0;
      let ey = 0;

      // Coulomb superposition: E = sum(k q r_vec / |r|^3). k is absorbed into scale.
      for (const charge of charges) {
        const rx = x - charge.x;
        const ry = y - charge.y;
        const r2 = rx * rx + ry * ry + 900;
        const invR3 = 1 / Math.pow(r2, 1.5);
        ex += charge.q * rx * invR3;
        ey += charge.q * ry * invR3;
      }

      return { ex, ey };
    };

    for (let x = 40; x < width; x += 42) {
      for (let y = 44; y < height; y += 42) {
        const { ex, ey } = fieldAt(x, y);
        const magnitude = Math.hypot(ex, ey) || 1;
        const length = Math.min(26, 16000 * magnitude);
        drawArrow(
          ctx,
          x,
          y,
          (ex / magnitude) * length,
          (ey / magnitude) * length,
          "rgba(186,230,253,0.45)",
        );
      }
    }

    for (const charge of charges) {
      for (let line = 0; line < 18; line++) {
        const angle = (line / 18) * Math.PI * 2;
        let x = charge.x + Math.cos(angle) * 16;
        let y = charge.y + Math.sin(angle) * 16;

        ctx.beginPath();
        ctx.moveTo(x, y);
        ctx.strokeStyle = charge.q > 0 ? "rgba(56,189,248,0.75)" : "rgba(251,113,133,0.75)";
        ctx.lineWidth = 1.3;

        // Field-line stream integration by normalized Euler steps.
        for (let step = 0; step < 110; step++) {
          const { ex, ey } = fieldAt(x, y);
          const magnitude = Math.hypot(ex, ey);
          if (magnitude < 1e-8) break;

          const direction = charge.q > 0 ? 1 : -1;
          x += direction * (ex / magnitude) * 7;
          y += direction * (ey / magnitude) * 7;
          ctx.lineTo(x, y);

          if (x < 0 || x > width || y < 0 || y > height) break;
          if (charges.some((target) => Math.hypot(x - target.x, y - target.y) < 12)) break;
        }

        ctx.stroke();
      }
    }

    for (const charge of charges) {
      ctx.fillStyle = charge.color;
      ctx.beginPath();
      ctx.arc(charge.x, charge.y, 18, 0, Math.PI * 2);
      ctx.fill();
      ctx.fillStyle = "#020617";
      ctx.font = "700 18px ui-sans-serif";
      ctx.textAlign = "center";
      ctx.textBaseline = "middle";
      ctx.fillText(charge.q > 0 ? "+" : "-", charge.x, charge.y + 1);
    }
  });

  return (
    <LabCanvas>
      <canvas ref={canvasRef} className="absolute inset-0 size-full" />
      <ControlPanel title="Point-charge field">
        <div className="space-y-4">
          <SliderControl
            label="Charge spacing"
            value={separation}
            min={0.4}
            max={1.8}
            step={0.1}
            onChange={setSeparation}
          />
          <SliderControl
            label="Right charge"
            value={chargeRatio}
            min={-2}
            max={2}
            step={0.1}
            onChange={setChargeRatio}
            unit=" q"
          />
        </div>
      </ControlPanel>
    </LabCanvas>
  );
}

function lorentzDerivative(state: ParticleState, electricField: number, magneticField: number) {
  return {
    dx: state.vx,
    dy: state.vy,
    dvx: electricField + state.vy * magneticField,
    dvy: -state.vx * magneticField,
  };
}

function rk4LorentzStep(
  state: ParticleState,
  dt: number,
  electricField: number,
  magneticField: number,
): ParticleState {
  // Fourth-order Runge-Kutta integration for m dv/dt = q(E + v x B).
  const k1 = lorentzDerivative(state, electricField, magneticField);
  const k2 = lorentzDerivative(
    {
      x: state.x + (dt * k1.dx) / 2,
      y: state.y + (dt * k1.dy) / 2,
      vx: state.vx + (dt * k1.dvx) / 2,
      vy: state.vy + (dt * k1.dvy) / 2,
    },
    electricField,
    magneticField,
  );
  const k3 = lorentzDerivative(
    {
      x: state.x + (dt * k2.dx) / 2,
      y: state.y + (dt * k2.dy) / 2,
      vx: state.vx + (dt * k2.dvx) / 2,
      vy: state.vy + (dt * k2.dvy) / 2,
    },
    electricField,
    magneticField,
  );
  const k4 = lorentzDerivative(
    {
      x: state.x + dt * k3.dx,
      y: state.y + dt * k3.dy,
      vx: state.vx + dt * k3.dvx,
      vy: state.vy + dt * k3.dvy,
    },
    electricField,
    magneticField,
  );

  return {
    x: state.x + (dt / 6) * (k1.dx + 2 * k2.dx + 2 * k3.dx + k4.dx),
    y: state.y + (dt / 6) * (k1.dy + 2 * k2.dy + 2 * k3.dy + k4.dy),
    vx: state.vx + (dt / 6) * (k1.dvx + 2 * k2.dvx + 2 * k3.dvx + k4.dvx),
    vy: state.vy + (dt / 6) * (k1.dvy + 2 * k2.dvy + 2 * k3.dvy + k4.dvy),
  };
}

function ChargedParticleMotionSimulation() {
  const [electricField, setElectricField] = useState(0.35);
  const [magneticField, setMagneticField] = useState(1.4);
  const [speed, setSpeed] = useState(0.9);
  const stateRef = useRef<ParticleState>({ x: -1.2, y: 0, vx: 0.65, vy: 0.9 });
  const pathRef = useRef<[number, number][]>([]);

  useEffect(() => {
    stateRef.current = { x: -1.2, y: 0, vx: 0.45 * speed, vy: 0.9 * speed };
    pathRef.current = [];
  }, [electricField, magneticField, speed]);

  const canvasRef = useCanvasAnimation((ctx, width, height, _time, delta) => {
    clearLabCanvas(ctx, width, height);

    for (let x = 50; x < width; x += 56) {
      drawArrow(ctx, x, height - 46, electricField * 34, 0, "rgba(125,211,252,0.5)");
    }

    ctx.fillStyle = "rgba(255,255,255,0.16)";
    ctx.font = "12px ui-monospace";
    ctx.fillText("B field out of screen", 24, 34);
    for (let x = 40; x < width; x += 46) {
      for (let y = 64; y < height - 56; y += 46) {
        ctx.beginPath();
        ctx.arc(x, y, Math.max(1.5, Math.abs(magneticField) * 1.2), 0, Math.PI * 2);
        ctx.fill();
      }
    }

    const dt = Math.min(delta, 0.02) * 1.8;
    for (let step = 0; step < 6; step++) {
      stateRef.current = rk4LorentzStep(stateRef.current, dt, electricField, magneticField);
      pathRef.current.push([stateRef.current.x, stateRef.current.y]);

      if (pathRef.current.length > 900) pathRef.current.shift();
      if (Math.abs(stateRef.current.x) > 2.3 || Math.abs(stateRef.current.y) > 1.5) {
        stateRef.current = { x: -1.2, y: 0, vx: 0.45 * speed, vy: 0.9 * speed };
        pathRef.current = [];
      }
    }

    const toScreen = ([x, y]: [number, number]) =>
      [width / 2 + x * width * 0.22, height / 2 - y * height * 0.32] as const;

    ctx.strokeStyle = "rgba(56,189,248,0.85)";
    ctx.lineWidth = 2;
    ctx.beginPath();
    pathRef.current.forEach((point, index) => {
      const [x, y] = toScreen(point);
      if (index === 0) ctx.moveTo(x, y);
      else ctx.lineTo(x, y);
    });
    ctx.stroke();

    const [px, py] = toScreen([stateRef.current.x, stateRef.current.y]);
    ctx.fillStyle = "#f97316";
    ctx.beginPath();
    ctx.arc(px, py, 8, 0, Math.PI * 2);
    ctx.fill();
  });

  return (
    <LabCanvas>
      <canvas ref={canvasRef} className="absolute inset-0 size-full" />
      <ControlPanel title="Lorentz-force trajectory">
        <div className="space-y-4">
          <SliderControl
            label="Electric field"
            value={electricField}
            min={-0.8}
            max={0.8}
            step={0.05}
            onChange={setElectricField}
          />
          <SliderControl
            label="Magnetic field"
            value={magneticField}
            min={0.1}
            max={2.6}
            step={0.1}
            onChange={setMagneticField}
          />
          <SliderControl
            label="Initial speed"
            value={speed}
            min={0.3}
            max={1.8}
            step={0.1}
            onChange={setSpeed}
          />
        </div>
      </ControlPanel>
    </LabCanvas>
  );
}

function ElectromagneticWaveSimulation() {
  const [frequency, setFrequency] = useState(2.2);
  const [courant, setCourant] = useState(0.92);
  const fieldRef = useRef({ e: new Float32Array(220), h: new Float32Array(220), time: 0 });

  const canvasRef = useCanvasAnimation((ctx, width, height, _time, delta) => {
    clearLabCanvas(ctx, width, height);

    const { e, h } = fieldRef.current;
    fieldRef.current.time += delta;

    for (let substep = 0; substep < 6; substep++) {
      // Yee-style 1D FDTD update for Maxwell curl equations.
      for (let i = 0; i < h.length - 1; i++) h[i] += courant * 0.5 * (e[i + 1] - e[i]);
      for (let i = 1; i < e.length; i++) e[i] += courant * 0.5 * (h[i] - h[i - 1]);

      const source = Math.sin(fieldRef.current.time * frequency * Math.PI * 2 + substep * 0.2);
      e[18] += source * 0.38;
      e[0] *= 0.92;
      e[e.length - 1] *= 0.92;
      h[0] *= 0.92;
      h[h.length - 1] *= 0.92;
    }

    const drawField = (values: Float32Array, color: string, offset: number) => {
      ctx.strokeStyle = color;
      ctx.lineWidth = 2;
      ctx.beginPath();
      for (let i = 0; i < values.length; i++) {
        const x = (i / (values.length - 1)) * width;
        const y = height * offset - values[i] * height * 0.17;
        if (i === 0) ctx.moveTo(x, y);
        else ctx.lineTo(x, y);
      }
      ctx.stroke();
    };

    ctx.strokeStyle = "rgba(255,255,255,0.16)";
    ctx.setLineDash([6, 8]);
    ctx.beginPath();
    ctx.moveTo(0, height * 0.38);
    ctx.lineTo(width, height * 0.38);
    ctx.moveTo(0, height * 0.62);
    ctx.lineTo(width, height * 0.62);
    ctx.stroke();
    ctx.setLineDash([]);

    drawField(e, "#38bdf8", 0.38);
    drawField(h, "#fb7185", 0.62);

    ctx.fillStyle = "rgba(255,255,255,0.68)";
    ctx.font = "12px ui-monospace";
    ctx.fillText("E field", 22, height * 0.38 - 34);
    ctx.fillText("H field", 22, height * 0.62 - 34);
  });

  return (
    <LabCanvas>
      <canvas ref={canvasRef} className="absolute inset-0 size-full" />
      <ControlPanel title="1D Maxwell FDTD">
        <div className="space-y-4">
          <SliderControl
            label="Source frequency"
            value={frequency}
            min={0.5}
            max={5}
            step={0.1}
            onChange={setFrequency}
          />
          <SliderControl
            label="Courant number"
            value={courant}
            min={0.4}
            max={0.98}
            step={0.01}
            onChange={setCourant}
          />
        </div>
      </ControlPanel>
    </LabCanvas>
  );
}

function HeatDiffusionSimulation() {
  const [diffusivity, setDiffusivity] = useState(0.18);
  const [sourceStrength, setSourceStrength] = useState(0.7);
  const gridRef = useRef({ current: new Float32Array(64 * 64), next: new Float32Array(64 * 64) });

  const canvasRef = useCanvasAnimation((ctx, width, height) => {
    const size = 64;
    const { current, next } = gridRef.current;

    for (let iteration = 0; iteration < 8; iteration++) {
      // Explicit finite-difference heat equation: T_new = T + alpha * Laplacian(T).
      for (let y = 1; y < size - 1; y++) {
        for (let x = 1; x < size - 1; x++) {
          const i = y * size + x;
          const laplacian =
            current[i - 1] +
            current[i + 1] +
            current[i - size] +
            current[i + size] -
            4 * current[i];
          next[i] = current[i] + diffusivity * laplacian;
        }
      }

      const center = Math.floor(size / 2) * size + Math.floor(size / 2);
      next[center] = Math.min(1, next[center] + sourceStrength * 0.08);
      current.set(next);
    }

    ctx.fillStyle = "#020617";
    ctx.fillRect(0, 0, width, height);

    const cellW = width / size;
    const cellH = height / size;
    for (let y = 0; y < size; y++) {
      for (let x = 0; x < size; x++) {
        ctx.fillStyle = heatColor(current[y * size + x]);
        ctx.fillRect(x * cellW, y * cellH, cellW + 1, cellH + 1);
      }
    }
  });

  return (
    <LabCanvas>
      <canvas ref={canvasRef} className="absolute inset-0 size-full" />
      <ControlPanel title="Heat equation plate">
        <div className="space-y-4">
          <SliderControl
            label="Diffusivity"
            value={diffusivity}
            min={0.04}
            max={0.24}
            step={0.01}
            onChange={setDiffusivity}
          />
          <SliderControl
            label="Source power"
            value={sourceStrength}
            min={0.1}
            max={1}
            step={0.05}
            onChange={setSourceStrength}
          />
        </div>
      </ControlPanel>
    </LabCanvas>
  );
}

function IdealGasSimulation() {
  const [particleCount, setParticleCount] = useState(70);
  const [temperature, setTemperature] = useState(1.1);
  const particlesRef = useRef<Particle[]>([]);
  const pressureRef = useRef(0);

  useEffect(() => {
    particlesRef.current = Array.from({ length: particleCount }, () => {
      const angle = Math.random() * Math.PI * 2;
      const speed = (0.35 + Math.random() * 0.8) * Math.sqrt(temperature);
      return {
        x: 0.1 + Math.random() * 0.8,
        y: 0.12 + Math.random() * 0.76,
        vx: Math.cos(angle) * speed,
        vy: Math.sin(angle) * speed,
        radius: 0.012,
      };
    });
  }, [particleCount, temperature]);

  const canvasRef = useCanvasAnimation((ctx, width, height, _time, delta) => {
    clearLabCanvas(ctx, width, height);
    const particles = particlesRef.current;
    let impulse = 0;

    for (const particle of particles) {
      particle.x += particle.vx * delta * 0.2;
      particle.y += particle.vy * delta * 0.2;

      if (particle.x < particle.radius || particle.x > 1 - particle.radius) {
        particle.vx *= -1;
        impulse += Math.abs(particle.vx);
        particle.x = Math.max(particle.radius, Math.min(1 - particle.radius, particle.x));
      }
      if (particle.y < particle.radius || particle.y > 1 - particle.radius) {
        particle.vy *= -1;
        impulse += Math.abs(particle.vy);
        particle.y = Math.max(particle.radius, Math.min(1 - particle.radius, particle.y));
      }
    }

    for (let i = 0; i < particles.length; i++) {
      for (let j = i + 1; j < particles.length; j++) {
        const a = particles[i];
        const b = particles[j];
        const dx = b.x - a.x;
        const dy = b.y - a.y;
        const distance = Math.hypot(dx, dy);
        const minDistance = a.radius + b.radius;

        if (distance > 0 && distance < minDistance) {
          // Equal-mass elastic collision: swap velocity components along collision normal.
          const nx = dx / distance;
          const ny = dy / distance;
          const relativeVelocity = (a.vx - b.vx) * nx + (a.vy - b.vy) * ny;
          if (relativeVelocity < 0) continue;
          a.vx -= relativeVelocity * nx;
          a.vy -= relativeVelocity * ny;
          b.vx += relativeVelocity * nx;
          b.vy += relativeVelocity * ny;
        }
      }
    }

    pressureRef.current = pressureRef.current * 0.94 + impulse * 0.06;

    const boxX = width * 0.08;
    const boxY = height * 0.12;
    const boxW = width * 0.58;
    const boxH = height * 0.76;
    ctx.strokeStyle = "rgba(255,255,255,0.36)";
    ctx.lineWidth = 2;
    ctx.strokeRect(boxX, boxY, boxW, boxH);

    ctx.fillStyle = "#67e8f9";
    for (const particle of particles) {
      ctx.beginPath();
      ctx.arc(
        boxX + particle.x * boxW,
        boxY + particle.y * boxH,
        particle.radius * boxW,
        0,
        Math.PI * 2,
      );
      ctx.fill();
    }

    const bins = Array.from({ length: 16 }, () => 0);
    for (const particle of particles) {
      const speed = Math.hypot(particle.vx, particle.vy);
      const index = Math.min(bins.length - 1, Math.floor(speed * 5));
      bins[index]++;
    }

    const histogramX = width * 0.72;
    const histogramY = height * 0.2;
    const histogramH = height * 0.55;
    const maxBin = Math.max(...bins, 1);
    ctx.fillStyle = "rgba(255,255,255,0.72)";
    ctx.font = "12px ui-monospace";
    ctx.fillText(`pressure ~= ${pressureRef.current.toFixed(2)}`, histogramX, histogramY - 28);
    ctx.fillText("speed histogram", histogramX, histogramY - 10);
    bins.forEach((bin, index) => {
      const barH = (bin / maxBin) * histogramH;
      ctx.fillStyle = `hsl(${190 + index * 7} 90% 60%)`;
      ctx.fillRect(histogramX + index * 8, histogramY + histogramH - barH, 6, barH);
    });
  });

  return (
    <LabCanvas>
      <canvas ref={canvasRef} className="absolute inset-0 size-full" />
      <ControlPanel title="Ideal gas particles">
        <div className="space-y-4">
          <SliderControl
            label="Particle count"
            value={particleCount}
            min={20}
            max={140}
            step={1}
            onChange={setParticleCount}
          />
          <SliderControl
            label="Temperature"
            value={temperature}
            min={0.4}
            max={2.4}
            step={0.1}
            onChange={setTemperature}
          />
        </div>
      </ControlPanel>
    </LabCanvas>
  );
}

function BoltzmannDistributionSimulation() {
  const [temperature, setTemperature] = useState(1.2);
  const [proposal, setProposal] = useState(0.8);
  const energiesRef = useRef(Float32Array.from({ length: 1500 }, () => Math.random() * 2));

  const canvasRef = useCanvasAnimation((ctx, width, height) => {
    clearLabCanvas(ctx, width, height);
    const energies = energiesRef.current;

    for (let step = 0; step < 650; step++) {
      const index = Math.floor(Math.random() * energies.length);
      const oldEnergy = energies[index];
      const newEnergy = Math.abs(oldEnergy + (Math.random() - 0.5) * proposal);
      const densityRatio = Math.sqrt((newEnergy + 1e-6) / (oldEnergy + 1e-6));
      const acceptance = densityRatio * Math.exp(-(newEnergy - oldEnergy) / temperature);

      // Metropolis sampler for P(E) proportional to sqrt(E) exp(-E/kT).
      if (newEnergy < oldEnergy || Math.random() < acceptance) energies[index] = newEnergy;
    }

    const bins = Array.from({ length: 32 }, () => 0);
    for (const energy of energies) {
      const index = Math.min(bins.length - 1, Math.floor((energy / 6) * bins.length));
      bins[index]++;
    }

    const plotX = width * 0.08;
    const plotY = height * 0.16;
    const plotW = width * 0.84;
    const plotH = height * 0.66;
    const maxBin = Math.max(...bins, 1);
    let entropy = 0;

    bins.forEach((bin, index) => {
      const probability = bin / energies.length;
      if (probability > 0) entropy -= probability * Math.log(probability);
      const x = plotX + (index / bins.length) * plotW;
      const w = plotW / bins.length - 2;
      const h = (bin / maxBin) * plotH;
      ctx.fillStyle = heatColor(index / bins.length);
      ctx.fillRect(x, plotY + plotH - h, w, h);
    });

    ctx.strokeStyle = "rgba(255,255,255,0.35)";
    ctx.strokeRect(plotX, plotY, plotW, plotH);
    ctx.fillStyle = "rgba(255,255,255,0.72)";
    ctx.font = "13px ui-monospace";
    ctx.fillText(`S = -sum p ln p ~= ${entropy.toFixed(2)}`, plotX, plotY - 22);
    ctx.fillText("energy", plotX + plotW - 54, plotY + plotH + 24);
  });

  return (
    <LabCanvas>
      <canvas ref={canvasRef} className="absolute inset-0 size-full" />
      <ControlPanel title="Metropolis energy sampler">
        <div className="space-y-4">
          <SliderControl
            label="Temperature"
            value={temperature}
            min={0.3}
            max={3}
            step={0.1}
            onChange={setTemperature}
          />
          <SliderControl
            label="Proposal size"
            value={proposal}
            min={0.2}
            max={1.8}
            step={0.1}
            onChange={setProposal}
          />
        </div>
      </ControlPanel>
    </LabCanvas>
  );
}

function ParticleInBoxSimulation() {
  const [mix, setMix] = useState(0.45);
  const [level, setLevel] = useState(3);

  const canvasRef = useCanvasAnimation((ctx, width, height, time) => {
    clearLabCanvas(ctx, width, height);
    const left = width * 0.08;
    const right = width * 0.92;
    const centerY = height * 0.56;
    const amplitude = height * 0.25;
    const points: [number, number][] = [];
    let maxProbability = 0;

    for (let i = 0; i < 360; i++) {
      const x = i / 359;
      const n1 = 1;
      const n2 = Math.round(level);
      const e1 = n1 * n1;
      const e2 = n2 * n2;
      const a1 = Math.sqrt(1 - mix);
      const a2 = Math.sqrt(mix);
      const real =
        a1 * Math.sin(n1 * Math.PI * x) * Math.cos(e1 * time) +
        a2 * Math.sin(n2 * Math.PI * x) * Math.cos(e2 * time);
      const imag =
        -a1 * Math.sin(n1 * Math.PI * x) * Math.sin(e1 * time) -
        a2 * Math.sin(n2 * Math.PI * x) * Math.sin(e2 * time);
      const probability = real * real + imag * imag;
      maxProbability = Math.max(maxProbability, probability);
      points.push([left + x * (right - left), probability]);
    }

    ctx.strokeStyle = "rgba(255,255,255,0.26)";
    ctx.lineWidth = 3;
    ctx.beginPath();
    ctx.moveTo(left, centerY + amplitude * 0.55);
    ctx.lineTo(left, centerY - amplitude);
    ctx.moveTo(right, centerY + amplitude * 0.55);
    ctx.lineTo(right, centerY - amplitude);
    ctx.stroke();

    ctx.strokeStyle = "#67e8f9";
    ctx.lineWidth = 2.5;
    ctx.beginPath();
    points.forEach(([x, probability], index) => {
      const y = centerY + amplitude * 0.45 - (probability / maxProbability) * amplitude;
      if (index === 0) ctx.moveTo(x, y);
      else ctx.lineTo(x, y);
    });
    ctx.stroke();

    ctx.fillStyle = "rgba(255,255,255,0.68)";
    ctx.font = "13px ui-monospace";
    ctx.fillText("|psi(x,t)|^2 inside infinite walls", left, height * 0.18);
  });

  return (
    <LabCanvas>
      <canvas ref={canvasRef} className="absolute inset-0 size-full" />
      <ControlPanel title="Particle in a box">
        <div className="space-y-4">
          <SliderControl
            label="Excited-state mix"
            value={mix}
            min={0}
            max={0.95}
            step={0.05}
            onChange={setMix}
          />
          <SliderControl
            label="Excited level n"
            value={level}
            min={2}
            max={6}
            step={1}
            onChange={setLevel}
          />
        </div>
      </ControlPanel>
    </LabCanvas>
  );
}

function QuantumTunnelingSimulation() {
  const [barrierHeight, setBarrierHeight] = useState(1.4);
  const [packetEnergy, setPacketEnergy] = useState(1.1);
  const [resetKey, setResetKey] = useState(0);
  const waveRef = useRef({ real: new Float32Array(260), imag: new Float32Array(260) });

  useEffect(() => {
    const { real, imag } = waveRef.current;
    const k = 2.8 + packetEnergy * 1.8;

    for (let i = 0; i < real.length; i++) {
      const x = i / (real.length - 1);
      const envelope = Math.exp(-((x - 0.24) ** 2) / 0.0045);
      real[i] = envelope * Math.cos(k * i);
      imag[i] = envelope * Math.sin(k * i);
    }
  }, [barrierHeight, packetEnergy, resetKey]);

  const canvasRef = useCanvasAnimation((ctx, width, height) => {
    clearLabCanvas(ctx, width, height);
    const { real, imag } = waveRef.current;
    const nextReal = new Float32Array(real.length);
    const nextImag = new Float32Array(imag.length);
    const dt = 0.00042;
    const dx = 1 / real.length;
    const barrierStart = Math.floor(real.length * 0.55);
    const barrierEnd = Math.floor(real.length * 0.64);

    for (let substep = 0; substep < 9; substep++) {
      nextReal.set(real);
      nextImag.set(imag);

      for (let i = 1; i < real.length - 1; i++) {
        const potential = i > barrierStart && i < barrierEnd ? barrierHeight : 0;
        const lapImag = (imag[i - 1] - 2 * imag[i] + imag[i + 1]) / (dx * dx);
        const lapReal = (real[i - 1] - 2 * real[i] + real[i + 1]) / (dx * dx);

        // Dimensionless Schrodinger FDTD: R_t = -0.5 I_xx + V I, I_t = 0.5 R_xx - V R.
        nextReal[i] = real[i] + dt * (-0.5 * lapImag + potential * imag[i]);
        nextImag[i] = imag[i] + dt * (0.5 * lapReal - potential * real[i]);
      }

      real.set(nextReal);
      imag.set(nextImag);
    }

    const left = width * 0.06;
    const plotW = width * 0.88;
    const baseY = height * 0.64;
    const scaleY = height * 0.38;
    ctx.fillStyle = "rgba(251,113,133,0.25)";
    ctx.fillRect(
      left + (barrierStart / real.length) * plotW,
      height * 0.2,
      ((barrierEnd - barrierStart) / real.length) * plotW,
      height * 0.56,
    );

    ctx.strokeStyle = "#67e8f9";
    ctx.lineWidth = 2;
    ctx.beginPath();
    for (let i = 0; i < real.length; i++) {
      const density = real[i] * real[i] + imag[i] * imag[i];
      const x = left + (i / (real.length - 1)) * plotW;
      const y = baseY - density * scaleY;
      if (i === 0) ctx.moveTo(x, y);
      else ctx.lineTo(x, y);
    }
    ctx.stroke();

    ctx.fillStyle = "rgba(255,255,255,0.68)";
    ctx.font = "13px ui-monospace";
    ctx.fillText("barrier", left + (barrierStart / real.length) * plotW + 8, height * 0.24);
  });

  return (
    <LabCanvas>
      <canvas ref={canvasRef} className="absolute inset-0 size-full" />
      <ControlPanel title="Wave packet tunneling">
        <div className="space-y-4">
          <SliderControl
            label="Barrier height"
            value={barrierHeight}
            min={0.2}
            max={2.8}
            step={0.1}
            onChange={setBarrierHeight}
          />
          <SliderControl
            label="Packet energy"
            value={packetEnergy}
            min={0.4}
            max={2.2}
            step={0.1}
            onChange={setPacketEnergy}
          />
          <Button
            variant="outline"
            className="w-full"
            onClick={() => setResetKey((value) => value + 1)}
          >
            Reset packet
          </Button>
        </div>
      </ControlPanel>
    </LabCanvas>
  );
}

function QuantumWavePacket2DSimulation() {
  const [spread, setSpread] = useState(0.06);
  const [potential, setPotential] = useState(0.8);
  const gridRef = useRef({ real: new Float32Array(44 * 44), imag: new Float32Array(44 * 44) });

  useEffect(() => {
    const size = 44;
    const { real, imag } = gridRef.current;
    const kx = 16;

    for (let y = 0; y < size; y++) {
      for (let x = 0; x < size; x++) {
        const nx = x / (size - 1);
        const ny = y / (size - 1);
        const envelope = Math.exp(-(((nx - 0.3) ** 2 + (ny - 0.5) ** 2) / spread));
        const i = y * size + x;
        real[i] = envelope * Math.cos(kx * nx);
        imag[i] = envelope * Math.sin(kx * nx);
      }
    }
  }, [spread, potential]);

  const canvasRef = useCanvasAnimation((ctx, width, height) => {
    const size = 44;
    const { real, imag } = gridRef.current;
    const nextReal = new Float32Array(real.length);
    const nextImag = new Float32Array(imag.length);
    const dt = 0.00018;
    const dx = 1 / size;

    for (let substep = 0; substep < 4; substep++) {
      nextReal.set(real);
      nextImag.set(imag);

      for (let y = 1; y < size - 1; y++) {
        for (let x = 1; x < size - 1; x++) {
          const i = y * size + x;
          const nx = x / (size - 1);
          const ny = y / (size - 1);
          const v = potential * ((nx - 0.72) ** 2 + (ny - 0.5) ** 2 < 0.018 ? 1 : 0);
          const lapImag =
            (imag[i - 1] + imag[i + 1] + imag[i - size] + imag[i + size] - 4 * imag[i]) / (dx * dx);
          const lapReal =
            (real[i - 1] + real[i + 1] + real[i - size] + real[i + size] - 4 * real[i]) / (dx * dx);

          // 2D finite-difference time-domain Schrodinger update on a square grid.
          nextReal[i] = real[i] + dt * (-0.5 * lapImag + v * imag[i]);
          nextImag[i] = imag[i] + dt * (0.5 * lapReal - v * real[i]);
        }
      }

      real.set(nextReal);
      imag.set(nextImag);
    }

    ctx.fillStyle = "#020617";
    ctx.fillRect(0, 0, width, height);
    const cellW = width / size;
    const cellH = height / size;
    let maxDensity = 1e-6;
    for (let i = 0; i < real.length; i++)
      maxDensity = Math.max(maxDensity, real[i] * real[i] + imag[i] * imag[i]);

    for (let y = 0; y < size; y++) {
      for (let x = 0; x < size; x++) {
        const i = y * size + x;
        const density = (real[i] * real[i] + imag[i] * imag[i]) / maxDensity;
        ctx.fillStyle = heatColor(density);
        ctx.fillRect(x * cellW, y * cellH, cellW + 1, cellH + 1);
      }
    }

    ctx.strokeStyle = "rgba(255,255,255,0.46)";
    ctx.lineWidth = 2;
    ctx.beginPath();
    ctx.arc(width * 0.72, height * 0.5, Math.min(width, height) * 0.13, 0, Math.PI * 2);
    ctx.stroke();
  });

  return (
    <LabCanvas>
      <canvas ref={canvasRef} className="absolute inset-0 size-full" />
      <ControlPanel title="2D wave packet">
        <div className="space-y-4">
          <SliderControl
            label="Initial spread"
            value={spread}
            min={0.025}
            max={0.12}
            step={0.005}
            onChange={setSpread}
          />
          <SliderControl
            label="Potential strength"
            value={potential}
            min={0}
            max={2}
            step={0.1}
            onChange={setPotential}
          />
        </div>
      </ControlPanel>
    </LabCanvas>
  );
}

export const LAB_SIMULATIONS: LabDefinition[] = [
  {
    category: "mechanics",
    slug: "projectile-motion",
    title: "Projectile Motion",
    summary: "Launch angle, speed, and gravity shape a ballistic trajectory.",
    principle:
      "Horizontal velocity stays constant while vertical velocity changes under uniform gravitational acceleration.",
    equations: [
      "x(t) = v0 cos(theta) t",
      "y(t) = v0 sin(theta) t - 1/2 g t^2",
      "R = v0^2 sin(2 theta) / g",
    ],
    method: "Analytic constant-acceleration kinematics sampled along the flight path.",
    expectedOutput:
      "The orange projectile follows the cyan parabola; higher launch speed increases range while stronger gravity shortens flight.",
    component: ProjectileMotionSimulation,
  },
  {
    category: "mechanics",
    slug: "spring-mass-oscillator",
    title: "Spring-Mass Oscillator",
    summary: "A driven spring trades energy between motion and stored elastic potential.",
    principle:
      "Hooke's law pulls displacement back toward equilibrium while damping removes mechanical energy.",
    equations: ["m x'' + c x' + kx = F0 sin(omega t)", "U = 1/2 kx^2"],
    method: "Closed-form oscillator animation with damping and a sinusoidal drive term.",
    expectedOutput:
      "The spring compresses and stretches around the dashed equilibrium line while energy bars shift between kinetic and potential.",
    component: SpringMassSimulation,
  },
  {
    category: "mechanics",
    slug: "damped-pendulum",
    title: "Damped Pendulum",
    summary: "Length, gravity, damping, and initial angle control pendulum motion.",
    principle:
      "For small angles, a pendulum behaves like a harmonic oscillator with period set by length and gravity.",
    equations: ["theta'' + (g/L) sin(theta) = -b theta'", "T ~= 2 pi sqrt(L/g)"],
    method: "Damped small-angle oscillator with a visual arc envelope and live period estimate.",
    expectedOutput:
      "The bob swings through a visible arc, decaying faster as damping rises and slowing down as the string length increases.",
    component: DampedPendulumSimulation,
  },
  {
    category: "electromagnetism",
    slug: "electric-field-lines",
    title: "Electric Field Lines",
    summary: "Field vectors and streamlines from two point charges.",
    principle:
      "Coulomb fields add linearly, so the net electric field is the vector sum of each charge contribution.",
    equations: ["E(r) = sum_i k q_i (r - r_i) / |r - r_i|^3", "F = qE"],
    method:
      "Grid sampling plus normalized Euler streamline tracing from seed points around each charge.",
    expectedOutput:
      "Blue arrows show local field direction and magnitude; streamlines leave positive charges and terminate on negative charges.",
    component: ElectricFieldLinesSimulation,
  },
  {
    category: "electromagnetism",
    slug: "charged-particle-motion",
    title: "Charged Particle Motion",
    summary: "A charged particle curves through crossed electric and magnetic fields.",
    principle:
      "The Lorentz force bends velocity perpendicular to B while E accelerates along its direction.",
    equations: ["m dv/dt = q(E + v x B)", "dr/dt = v"],
    method: "Fourth-order Runge-Kutta ODE integration in dimensionless units.",
    expectedOutput:
      "The orange particle leaves a blue trajectory that becomes circular, helical-like, or drifting as E and B change.",
    component: ChargedParticleMotionSimulation,
  },
  {
    category: "electromagnetism",
    slug: "em-wave-propagation",
    title: "EM Wave Propagation",
    summary: "Electric and magnetic pulses propagate on a 1D Yee grid.",
    principle: "Maxwell curl equations couple E and H fields so changes in one drive the other.",
    equations: ["dE/dt = c^2 dB/dx", "dB/dt = -dE/dx"],
    method: "Finite-difference time-domain update with a sinusoidal source and damped boundaries.",
    expectedOutput:
      "Cyan E and rose H waves leave the source and travel across the domain with a phase offset.",
    component: ElectromagneticWaveSimulation,
  },
  {
    category: "thermodynamics",
    slug: "heat-diffusion",
    title: "Heat Diffusion Plate",
    summary: "A hot spot spreads through a square plate.",
    principle:
      "Heat flows from high temperature to low temperature according to the temperature Laplacian.",
    equations: ["dT/dt = alpha (d2T/dx2 + d2T/dy2)"],
    method: "Explicit finite-difference PDE solver on a 64 x 64 grid.",
    expectedOutput:
      "A bright central source diffuses into cooler blue regions; increasing diffusivity smooths the map faster.",
    component: HeatDiffusionSimulation,
  },
  {
    category: "thermodynamics",
    slug: "ideal-gas",
    title: "Ideal Gas Kinetics",
    summary: "Particles collide elastically and form a speed distribution.",
    principle:
      "Microscopic elastic collisions produce macroscopic pressure and temperature behavior.",
    equations: ["PV = NkT", "1/2 m <v^2> proportional to T"],
    method: "Monte Carlo-style hard-sphere particle update with wall and pair collisions.",
    expectedOutput:
      "Particles bounce in a box, pressure changes with wall impulse, and the speed histogram shifts with temperature.",
    component: IdealGasSimulation,
  },
  {
    category: "thermodynamics",
    slug: "boltzmann-distribution",
    title: "Boltzmann Energy Distribution",
    summary: "A Metropolis sampler relaxes toward a thermal energy distribution.",
    principle:
      "At equilibrium, states with energy E occur with probability weighted by exp(-E/kT).",
    equations: ["P(E) proportional to g(E) exp(-E/kT)", "S = -sum_i p_i ln p_i"],
    method:
      "Metropolis Monte Carlo sampling with a 3D-like density of states g(E) proportional to sqrt(E).",
    expectedOutput:
      "The histogram broadens at high temperature and narrows at low temperature while entropy is reported above the plot.",
    component: BoltzmannDistributionSimulation,
  },
  {
    category: "quantum-mechanics",
    slug: "particle-in-box",
    title: "Particle in a Box",
    summary: "Bound-state superposition evolves inside infinite potential walls.",
    principle: "Stationary eigenstates gain phase at rates set by quantized energies.",
    equations: [
      "psi_n(x) = sqrt(2/L) sin(n pi x/L)",
      "E_n proportional to n^2",
      "|psi|^2 is probability density",
    ],
    method: "Analytic eigenstate superposition with time-dependent complex phase factors.",
    expectedOutput:
      "The probability density oscillates as n=1 interferes with a selected excited state.",
    component: ParticleInBoxSimulation,
  },
  {
    category: "quantum-mechanics",
    slug: "quantum-tunneling",
    title: "Quantum Tunneling",
    summary: "A wave packet partly transmits through a finite barrier.",
    principle:
      "The Schrodinger equation allows nonzero probability inside and beyond classically forbidden barriers.",
    equations: ["i dpsi/dt = -1/2 d2psi/dx2 + V(x) psi", "rho = |psi|^2"],
    method: "Finite-difference time-domain update of real and imaginary wavefunction components.",
    expectedOutput:
      "A cyan probability wave approaches the rose barrier, reflects, and leaves a transmitted tail on the far side.",
    component: QuantumTunnelingSimulation,
  },
  {
    category: "quantum-mechanics",
    slug: "schrodinger-2d",
    title: "2D Schrodinger Wave Packet",
    summary: "A Gaussian wave packet moves through a circular potential region.",
    principle:
      "The 2D time-dependent Schrodinger equation disperses and scatters probability density.",
    equations: ["i dpsi/dt = -1/2 Laplacian(psi) + V(x,y) psi", "rho(x,y) = |psi|^2"],
    method: "Two-dimensional finite-difference time-domain solver on a compact grid.",
    expectedOutput:
      "The heat map shows probability density spreading and scattering around the outlined potential disk.",
    component: QuantumWavePacket2DSimulation,
  },
];

export function getLabSimulationPath(simulation: Pick<LabDefinition, "category" | "slug">) {
  return `/simulations/${simulation.category}/${simulation.slug}`;
}

function SimulationNavigator({ currentSimulation }: { currentSimulation: LabDefinition }) {
  const currentIndex = LAB_SIMULATIONS.findIndex(
    (simulation) =>
      simulation.category === currentSimulation.category &&
      simulation.slug === currentSimulation.slug,
  );
  const previousSimulation =
    LAB_SIMULATIONS[(currentIndex - 1 + LAB_SIMULATIONS.length) % LAB_SIMULATIONS.length];
  const nextSimulation = LAB_SIMULATIONS[(currentIndex + 1) % LAB_SIMULATIONS.length];

  return (
    <Card className="border-border/40 bg-background/90 backdrop-blur-xl">
      <CardHeader className="pb-3">
        <div className="flex items-center justify-between gap-3">
          <CardTitle className="flex items-center gap-2 text-base">
            <ListTree className="size-4" />
            Simulation Navigator
          </CardTitle>
          <Badge variant="secondary">{LAB_SIMULATIONS.length} labs</Badge>
        </div>
        <CardDescription>Jump by topic or move through the lab sequence.</CardDescription>
      </CardHeader>
      <CardContent className="space-y-4">
        <div className="grid grid-cols-2 gap-2">
          <Button asChild variant="outline" size="sm" className="justify-start">
            <Link to={getLabSimulationPath(previousSimulation)}>
              <ChevronLeft className="size-4" />
              Previous
            </Link>
          </Button>
          <Button asChild variant="outline" size="sm" className="justify-end">
            <Link to={getLabSimulationPath(nextSimulation)}>
              Next
              <ChevronRight className="size-4" />
            </Link>
          </Button>
        </div>

        <div className="space-y-4">
          {LAB_CATEGORY_ORDER.map((category) => {
            const simulations = LAB_SIMULATIONS.filter(
              (simulation) => simulation.category === category,
            );

            return (
              <div key={category}>
                <div className="flex items-center justify-between gap-3">
                  <div className="text-xs font-semibold uppercase tracking-[0.18em] text-muted-foreground">
                    {LAB_CATEGORY_LABELS[category]}
                  </div>
                  <span className="text-xs text-muted-foreground">{simulations.length}</span>
                </div>
                <div className="mt-2 grid gap-1">
                  {simulations.map((simulation) => {
                    const isActive =
                      simulation.category === currentSimulation.category &&
                      simulation.slug === currentSimulation.slug;

                    return (
                      <Button
                        key={simulation.slug}
                        asChild
                        variant={isActive ? "default" : "ghost"}
                        className="h-auto w-full flex-col items-start gap-1 whitespace-normal rounded-xl px-3 py-2 text-left"
                      >
                        <Link to={getLabSimulationPath(simulation)}>
                          <span className="block text-xs font-medium">{simulation.title}</span>
                          <span
                            className={
                              isActive
                                ? "block text-xs text-primary-foreground/70"
                                : "block text-xs text-muted-foreground"
                            }
                          >
                            {simulation.summary}
                          </span>
                        </Link>
                      </Button>
                    );
                  })}
                </div>
              </div>
            );
          })}
        </div>
      </CardContent>
    </Card>
  );
}

export function PhysicsLabRoute() {
  const params = useParams();
  const simulation = LAB_SIMULATIONS.find(
    (candidate) => candidate.category === params.category && candidate.slug === params.slug,
  );

  if (!simulation) {
    return (
      <div className="flex h-full items-center justify-center bg-background p-6 text-center">
        <Card className="max-w-md">
          <CardHeader>
            <CardTitle>Simulation not found</CardTitle>
            <CardDescription>Choose one of the available physics labs.</CardDescription>
          </CardHeader>
          <CardContent>
            <Button asChild>
              <Link to={getLabSimulationPath(LAB_SIMULATIONS[0])}>Open first lab</Link>
            </Button>
          </CardContent>
        </Card>
      </div>
    );
  }

  const Visual = simulation.component;

  return (
    <div className="h-full overflow-y-auto bg-background p-4 pt-20 pb-24 lg:grid lg:grid-cols-[minmax(0,1fr)_390px] lg:gap-4 lg:overflow-hidden">
      <div className="relative min-h-[520px] overflow-hidden rounded-3xl border border-border/40 shadow-2xl lg:h-full">
        <Visual />
      </div>

      <aside className="mt-4 space-y-4 lg:mt-0 lg:h-full lg:overflow-y-auto">
        <Card className="border-border/40 bg-background/90 backdrop-blur-xl">
          <CardHeader>
            <div className="text-xs font-semibold uppercase tracking-[0.22em] text-muted-foreground">
              {LAB_CATEGORY_LABELS[simulation.category]}
            </div>
            <CardTitle>{simulation.title}</CardTitle>
            <CardDescription>{simulation.summary}</CardDescription>
          </CardHeader>
        </Card>

        <SimulationNavigator currentSimulation={simulation} />

        <Card className="border-border/40 bg-background/90 backdrop-blur-xl">
          <CardHeader>
            <CardTitle className="text-base">Physics Concept</CardTitle>
          </CardHeader>
          <CardContent className="space-y-3 text-sm text-muted-foreground">
            <p>{simulation.principle}</p>
            <div>
              <div className="font-medium text-foreground">Key equations</div>
              <div className="mt-2 space-y-2">
                {simulation.equations.map((equation) => (
                  <code
                    key={equation}
                    className="block rounded-lg bg-muted px-3 py-2 font-mono text-xs text-foreground"
                  >
                    {equation}
                  </code>
                ))}
              </div>
            </div>
            <div>
              <div className="font-medium text-foreground">Numerical method</div>
              <p className="mt-1">{simulation.method}</p>
            </div>
            <div>
              <div className="font-medium text-foreground">Expected output</div>
              <p className="mt-1">{simulation.expectedOutput}</p>
            </div>
          </CardContent>
        </Card>
      </aside>
    </div>
  );
}
