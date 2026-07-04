import { GlitterBackground } from "@/components/webgl-glitter-background";
import { SphereBackground } from "@/components/webgl-sphere-background";

const COLORS = {
  glitter: "#ffffff",
  glitterOpacity: 1,
  sphere: "#ffffff",
  sphereOpacity: 0.02,
} as const;

export function WebGLBackground() {
  return (
    <>
      <div
        aria-hidden="true"
        className="fixed inset-0 z-0 opacity-80 mix-blend-screen"
        style={{ pointerEvents: "none" }}
      >
        <GlitterBackground color={COLORS.glitter} opacity={COLORS.glitterOpacity} />
      </div>
      <div
        aria-hidden="true"
        className="fixed inset-0 z-0 opacity-80 mix-blend-screen"
        style={{
          WebkitMaskImage:
            "radial-gradient(ellipse at 50% 50%, black 0%, black 48%, transparent 78%)",
          maskImage: "radial-gradient(ellipse at 50% 50%, black 0%, black 48%, transparent 78%)",
          pointerEvents: "none",
        }}
      >
        <SphereBackground color={COLORS.sphere} opacity={COLORS.sphereOpacity} />
      </div>
    </>
  );
}
