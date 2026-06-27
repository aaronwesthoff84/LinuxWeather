import { useEffect, useRef } from "react";
import type { Scene } from "../../services/gradientService";

interface Props {
  scene: Scene;
  reducedMotion?: boolean;
}

interface Drop {
  x: number;
  y: number;
  len: number;
  speed: number;
  drift: number;
}

export function AnimatedBackground({ scene, reducedMotion = false }: Props) {
  const canvasRef = useRef<HTMLCanvasElement | null>(null);
  const rafRef = useRef<number>(0);

  const gradientCss = `linear-gradient(180deg, ${scene.gradient[0]} 0%, ${scene.gradient[1]} 52%, ${scene.gradient[2]} 100%)`;

  useEffect(() => {
    if (reducedMotion) return;
    const canvas = canvasRef.current;
    if (!canvas || scene.particle === "none") return;
    const ctx = canvas.getContext("2d");
    if (!ctx) return;

    let w = (canvas.width = window.innerWidth);
    let h = (canvas.height = window.innerHeight);

    const isSnow = scene.particle === "snow";
    const count = isSnow ? 110 : 160;

    const spawn = (width: number, height: number): Drop => ({
      x: Math.random() * width,
      y: Math.random() * height,
      len: isSnow ? 2 + Math.random() * 3 : 10 + Math.random() * 14,
      speed: isSnow ? 0.6 + Math.random() * 1.1 : 7 + Math.random() * 6,
      drift: isSnow ? -0.5 + Math.random() : -0.6,
    });

    const drops: Drop[] = Array.from({ length: count }, () => spawn(w, h));

    const onResize = () => {
      w = canvas.width = window.innerWidth;
      h = canvas.height = window.innerHeight;
    };
    window.addEventListener("resize", onResize);

    const render = () => {
      ctx.clearRect(0, 0, w, h);
      for (const d of drops) {
        if (isSnow) {
          ctx.fillStyle = "rgba(255,255,255,0.85)";
          ctx.beginPath();
          ctx.arc(d.x, d.y, d.len, 0, Math.PI * 2);
          ctx.fill();
        } else {
          ctx.strokeStyle = "rgba(170,205,255,0.45)";
          ctx.lineWidth = 1.4;
          ctx.beginPath();
          ctx.moveTo(d.x, d.y);
          ctx.lineTo(d.x + d.drift * 2, d.y + d.len);
          ctx.stroke();
        }
        d.y += d.speed;
        d.x += d.drift;
        if (d.y > h + 20) {
          d.y = -20;
          d.x = Math.random() * w;
        }
      }
      rafRef.current = requestAnimationFrame(render);
    };
    render();

    return () => {
      cancelAnimationFrame(rafRef.current);
      window.removeEventListener("resize", onResize);
    };
  }, [scene.particle, reducedMotion]);

  return (
    <div className="animated-bg-container">
      <div className="bg-gradient" style={{ position: "absolute", inset: 0, width: "100%", height: "100%", zIndex: 0, background: gradientCss }} />
      {!reducedMotion && scene.particle !== "none" && (
        <canvas className="bg-canvas" ref={canvasRef} style={{ position: "absolute", inset: 0, width: "100%", height: "100%", zIndex: 0 }} />
      )}
    </div>
  );
}
