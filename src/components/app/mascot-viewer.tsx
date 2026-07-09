"use client";

import { useEffect, useRef, useState } from "react";
import { cn } from "@/lib/utils";

type MascotViewerProps = {
  className?: string;
  model?: "premium" | "light";
  interactive?: boolean;
  compact?: boolean;
  label?: string;
};

const MODEL_PATHS = {
  premium: "/models/kontrakpaham-guardian-bull-premium.glb",
  light: "/models/kontrakpaham-guardian-bull-light.glb",
} as const;

export function MascotViewer({
  className,
  model = "light",
  interactive = true,
  compact = false,
  label = "Maskot banteng penjaga KontrakPaham",
}: MascotViewerProps) {
  const hostRef = useRef<HTMLDivElement | null>(null);
  const dragRef = useRef({ active: false, x: 0, rotation: 0 });
  const rotationRef = useRef(-Math.PI / 2);
  const [failed, setFailed] = useState(false);

  useEffect(() => {
    const host = hostRef.current;
    if (!host) return;

    let disposed = false;
    let frameId = 0;
    let resizeObserver: ResizeObserver | null = null;
    let renderer: import("three").WebGLRenderer | null = null;
    let scene: import("three").Scene | null = null;
    let camera: import("three").PerspectiveCamera | null = null;
    let root: import("three").Object3D | null = null;

    async function boot() {
      try {
        const THREE = await import("three");
        const { GLTFLoader } = await import("three/examples/jsm/loaders/GLTFLoader.js");
        if (disposed || !host) return;

        const prefersReducedMotion = window.matchMedia("(prefers-reduced-motion: reduce)").matches;
        const canvas = document.createElement("canvas");
        canvas.className = "mascot-viewer__canvas";
        host.appendChild(canvas);

        renderer = new THREE.WebGLRenderer({
          alpha: true,
          antialias: true,
          canvas,
          powerPreference: "high-performance",
        });
        renderer.outputColorSpace = THREE.SRGBColorSpace;
        renderer.setPixelRatio(Math.min(window.devicePixelRatio || 1, compact ? 1.6 : 2));

        scene = new THREE.Scene();
        camera = new THREE.PerspectiveCamera(32, 1, 0.1, 100);
        camera.position.set(0, 0.22, compact ? 5.35 : 4.85);

        scene.add(new THREE.HemisphereLight(0xfff7e8, 0x244b38, 2.2));
        const key = new THREE.DirectionalLight(0xffffff, 2.8);
        key.position.set(3, 5, 5);
        scene.add(key);
        const fill = new THREE.DirectionalLight(0xc28a3a, 0.75);
        fill.position.set(-4, 2, 3);
        scene.add(fill);

        const loader = new GLTFLoader();
        const gltf = await loader.loadAsync(MODEL_PATHS[model]);
        if (disposed || !scene) return;

        root = gltf.scene;
        root.rotation.x = -Math.PI / 2;
        root.rotation.y = 0;
        root.rotation.z = rotationRef.current + 0.08;
        root.traverse((child) => {
          const mesh = child as import("three").Mesh;
          if (mesh.isMesh) {
            mesh.castShadow = false;
            mesh.receiveShadow = false;
          }
        });

        const box = new THREE.Box3().setFromObject(root);
        const center = box.getCenter(new THREE.Vector3());
        const size = box.getSize(new THREE.Vector3());
        root.position.sub(center);
        const maxSize = Math.max(size.x, size.y, size.z);
        root.scale.setScalar((compact ? 3.05 : 3.38) / maxSize);
        root.position.y -= compact ? 0.08 : 0.18;
        scene.add(root);

        const renderSize = () => {
          if (!renderer || !camera || !host) return;
          const width = Math.max(1, host.clientWidth);
          const height = Math.max(1, host.clientHeight);
          renderer.setSize(width, height, false);
          camera.aspect = width / height;
          camera.updateProjectionMatrix();
        };

        resizeObserver = new ResizeObserver(renderSize);
        resizeObserver.observe(host);
        renderSize();

        const clock = new THREE.Clock();
        const animate = () => {
          if (disposed || !renderer || !scene || !camera) return;
          const t = clock.getElapsedTime();
          if (root) {
            const idle = prefersReducedMotion ? 0 : Math.sin(t * 1.4) * 0.035;
            root.rotation.y = idle;
            root.rotation.z = rotationRef.current + 0.08;
            root.position.y = (compact ? -0.08 : -0.18) + (prefersReducedMotion ? 0 : Math.sin(t * 1.8) * 0.025);
          }
          renderer.render(scene, camera);
          frameId = requestAnimationFrame(animate);
        };
        animate();
      } catch (error) {
        console.error("Failed to load mascot model", error);
        setFailed(true);
      }
    }

    boot();

    return () => {
      disposed = true;
      cancelAnimationFrame(frameId);
      resizeObserver?.disconnect();
      if (root) {
        root.traverse((child) => {
          const mesh = child as import("three").Mesh;
          if (mesh.isMesh) {
            mesh.geometry?.dispose();
            const materials = Array.isArray(mesh.material) ? mesh.material : [mesh.material];
            for (const material of materials) {
              material?.dispose();
            }
          }
        });
      }
      renderer?.dispose();
      host.querySelector("canvas")?.remove();
    };
  }, [compact, model]);

  const onPointerDown = (event: React.PointerEvent<HTMLDivElement>) => {
    if (!interactive) return;
    dragRef.current = { active: true, x: event.clientX, rotation: rotationRef.current };
    event.currentTarget.setPointerCapture(event.pointerId);
  };

  const onPointerMove = (event: React.PointerEvent<HTMLDivElement>) => {
    if (!interactive || !dragRef.current.active) return;
    const delta = event.clientX - dragRef.current.x;
    rotationRef.current = dragRef.current.rotation + delta * 0.012;
  };

  const endDrag = () => {
    dragRef.current.active = false;
  };

  return (
    <div
      ref={hostRef}
      className={cn("mascot-viewer", compact ? "mascot-viewer--compact" : "", failed ? "is-fallback" : "", className)}
      role="img"
      aria-label={label}
      onPointerDown={onPointerDown}
      onPointerMove={onPointerMove}
      onPointerUp={endDrag}
      onPointerCancel={endDrag}
    >
      {failed && (
        <div className="mascot-viewer__fallback">
          <span />
          <span />
        </div>
      )}
      {interactive && <span className="mascot-viewer__hint">geser</span>}
    </div>
  );
}
