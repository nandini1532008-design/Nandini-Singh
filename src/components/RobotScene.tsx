import { useEffect, useRef, useState } from "react";
import * as THREE from "three";
import { RoomEnvironment } from "three/examples/jsm/environments/RoomEnvironment.js";
import { RoundedBoxGeometry } from "three/examples/jsm/geometries/RoundedBoxGeometry.js";

export type LandingStage = 0 | 1 | 2; // 0: Intro, 1: Product, 2: Reviews

interface RobotSceneProps {
  stage: LandingStage;
}

function easeInOutCubic(t: number): number {
  return t < 0.5 ? 4 * t * t * t : 1 - Math.pow(-2 * t + 2, 3) / 2;
}

function createConicRingTexture(maxAnisotropy: number): THREE.CanvasTexture {
  const size = 512;
  const canvas = document.createElement("canvas");
  canvas.width = size;
  canvas.height = size;
  const ctx = canvas.getContext("2d");

  if (ctx) {
    const cx = size / 2;
    const cy = size / 2;

    if (typeof ctx.createConicGradient === "function") {
      const grad = ctx.createConicGradient(-Math.PI / 4, cx, cy);
      grad.addColorStop(0.0, "#ffb347");
      grad.addColorStop(0.24, "#ff8a3d");
      grad.addColorStop(0.5, "#ff5a5f");
      grad.addColorStop(0.76, "#ff3d8b");
      grad.addColorStop(1.0, "#ffb347");
      ctx.fillStyle = grad;
      ctx.fillRect(0, 0, size, size);
    } else {
      const grad = ctx.createLinearGradient(0, 0, size, size);
      grad.addColorStop(0.0, "#ffb347");
      grad.addColorStop(0.35, "#ff8a3d");
      grad.addColorStop(0.7, "#ff5a5f");
      grad.addColorStop(1.0, "#ff3d8b");
      ctx.fillStyle = grad;
      ctx.fillRect(0, 0, size, size);
    }

    // Soft radial highlight for ceramic rim sheen
    const radial = ctx.createRadialGradient(cx, cy, size * 0.22, cx, cy, size * 0.52);
    radial.addColorStop(0, "rgba(255, 255, 255, 0.22)");
    radial.addColorStop(0.65, "rgba(255, 255, 255, 0)");
    radial.addColorStop(1, "rgba(20, 12, 10, 0.14)");
    ctx.fillStyle = radial;
    ctx.fillRect(0, 0, size, size);
  }

  const texture = new THREE.CanvasTexture(canvas);
  texture.colorSpace = THREE.SRGBColorSpace;
  texture.anisotropy = maxAnisotropy;
  texture.needsUpdate = true;
  return texture;
}

function createQuoteTexture(maxAnisotropy: number): THREE.CanvasTexture {
  const width = 512;
  const height = 384;
  const canvas = document.createElement("canvas");
  canvas.width = width;
  canvas.height = height;
  const ctx = canvas.getContext("2d");

  if (ctx) {
    ctx.clearRect(0, 0, width, height);

    // Subtle warm-white glow halo
    const glow = ctx.createRadialGradient(
      width / 2,
      height / 2,
      12,
      width / 2,
      height / 2,
      180
    );
    glow.addColorStop(0, "rgba(255, 179, 71, 0.22)");
    glow.addColorStop(0.5, "rgba(255, 90, 95, 0.10)");
    glow.addColorStop(1, "rgba(0, 0, 0, 0)");
    ctx.fillStyle = glow;
    ctx.fillRect(0, 0, width, height);

    ctx.fillStyle = "#ffffff";
    ctx.shadowColor = "rgba(255, 180, 110, 0.85)";
    ctx.shadowBlur = 24;
    ctx.textAlign = "center";
    ctx.textBaseline = "middle";
    ctx.font = "700 280px Georgia, 'Times New Roman', serif";
    ctx.fillText("“", width / 2, height / 2 + 42);
  }

  const texture = new THREE.CanvasTexture(canvas);
  texture.colorSpace = THREE.SRGBColorSpace;
  texture.anisotropy = maxAnisotropy;
  texture.needsUpdate = true;
  return texture;
}

function createContactShadowTexture(): THREE.CanvasTexture {
  const size = 256;
  const canvas = document.createElement("canvas");
  canvas.width = size;
  canvas.height = size;
  const ctx = canvas.getContext("2d");

  if (ctx) {
    const grad = ctx.createRadialGradient(
      size / 2,
      size / 2,
      16,
      size / 2,
      size / 2,
      size / 2
    );
    grad.addColorStop(0, "rgba(20, 18, 16, 0.42)");
    grad.addColorStop(0.55, "rgba(20, 18, 16, 0.14)");
    grad.addColorStop(1, "rgba(20, 18, 16, 0)");
    ctx.fillStyle = grad;
    ctx.fillRect(0, 0, size, size);
  }

  const texture = new THREE.CanvasTexture(canvas);
  texture.colorSpace = THREE.SRGBColorSpace;
  texture.needsUpdate = true;
  return texture;
}

export function RobotScene({ stage }: RobotSceneProps) {
  const mountRef = useRef<HTMLDivElement | null>(null);
  const stageRef = useRef<LandingStage>(stage);
  const [webglFailed, setWebglFailed] = useState(false);

  useEffect(() => {
    stageRef.current = stage;
  }, [stage]);

  useEffect(() => {
    const container = mountRef.current;
    if (!container) return;

    const prefersReducedMotion = window.matchMedia(
      "(prefers-reduced-motion: reduce)"
    ).matches;

    const isSoftwareGl = (() => {
      try {
        const probe = document.createElement("canvas");
        const gl = probe.getContext("webgl2") || probe.getContext("webgl");
        if (!gl) return true;
        const ext = gl.getExtension("WEBGL_debug_renderer_info");
        const param = ext ? ext.UNMASKED_RENDERER_WEBGL : gl.RENDERER;
        const gpu = String(gl.getParameter(param) || "");
        gl.getExtension("WEBGL_lose_context")?.loseContext();
        return /SwiftShader|llvmpipe|softpipe|Software|Basic Render/i.test(gpu);
      } catch {
        return true;
      }
    })();

    let renderer: THREE.WebGLRenderer;
    try {
      renderer = new THREE.WebGLRenderer({
        antialias: !isSoftwareGl,
        alpha: true,
        powerPreference: "high-performance",
      });
    } catch {
      setWebglFailed(true);
      return;
    }

    const handleContextLost = (e: Event) => {
      e.preventDefault();
      setWebglFailed(true);
    };
    renderer.domElement.addEventListener("webglcontextlost", handleContextLost);

    renderer.outputColorSpace = THREE.SRGBColorSpace;
    renderer.toneMapping = THREE.ACESFilmicToneMapping;
    renderer.toneMappingExposure = 1.08;
    renderer.setPixelRatio(
      isSoftwareGl ? 1 : Math.min(window.devicePixelRatio || 1, 2)
    );
    renderer.setSize(window.innerWidth, window.innerHeight);
    renderer.setClearColor(0x000000, 0);
    renderer.shadowMap.enabled = !isSoftwareGl;
    renderer.shadowMap.type = THREE.PCFSoftShadowMap;

    renderer.domElement.style.width = "100%";
    renderer.domElement.style.height = "100%";
    renderer.domElement.style.display = "block";
    container.appendChild(renderer.domElement);

    const scene = new THREE.Scene();

    const camera = new THREE.PerspectiveCamera(
      34,
      window.innerWidth / Math.max(window.innerHeight, 1),
      0.1,
      100
    );
    camera.position.set(-1.1, 0.15, 11.6);

    let envTarget: THREE.WebGLRenderTarget | null = null;
    try {
      const pmremGenerator = new THREE.PMREMGenerator(renderer);
      const roomEnv = new RoomEnvironment();
      envTarget = pmremGenerator.fromScene(roomEnv, 0.04);
      scene.environment = envTarget.texture;
      roomEnv.dispose();
      pmremGenerator.dispose();
    } catch {
      // Proceed without PMREM environment if GPU/driver rejects RoomEnvironment
    }

    // Lighting rig: Hemisphere + Key + Rim + Warm Point Light
    const hemiLight = new THREE.HemisphereLight(0xfff9f2, 0xc7bfb2, 0.95);
    scene.add(hemiLight);

    const keyLight = new THREE.DirectionalLight(0xfff4e6, 2.25);
    keyLight.position.set(4.8, 7.2, 6.4);
    if (!isSoftwareGl) {
      keyLight.castShadow = true;
      keyLight.shadow.mapSize.set(1024, 1024);
      keyLight.shadow.camera.near = 1;
      keyLight.shadow.camera.far = 22;
      keyLight.shadow.camera.left = -4.5;
      keyLight.shadow.camera.right = 4.5;
      keyLight.shadow.camera.top = 4.5;
      keyLight.shadow.camera.bottom = -4.5;
      keyLight.shadow.bias = -0.0005;
      keyLight.shadow.normalBias = 0.02;
    }
    scene.add(keyLight);

    const rimLight = new THREE.DirectionalLight(0xdbe8ff, 1.35);
    rimLight.position.set(-5.5, 4.2, -5.2);
    scene.add(rimLight);

    const warmAccentLight = new THREE.PointLight(0xff8a3d, 2.1, 9.5, 1.8);
    warmAccentLight.position.set(1.8, 1.1, 2.6);
    scene.add(warmAccentLight);

    // Materials
    const maxAniso = renderer.capabilities.getMaxAnisotropy();
    const ringTexture = createConicRingTexture(maxAniso);
    const quoteTexture = createQuoteTexture(maxAniso);
    const contactShadowTexture = createContactShadowTexture();

    const ceramicMat = new THREE.MeshPhysicalMaterial({
      color: 0xeeebe6,
      roughness: 0.38,
      metalness: 0.04,
      clearcoat: 0.45,
      clearcoatRoughness: 0.2,
    });

    const darkJointMat = new THREE.MeshStandardMaterial({
      color: 0x1b1b1f,
      roughness: 0.52,
      metalness: 0.3,
    });

    const pedestalMat = new THREE.MeshStandardMaterial({
      color: 0x2a2928,
      roughness: 0.46,
      metalness: 0.18,
    });

    const ringMat = new THREE.MeshStandardMaterial({
      map: ringTexture,
      emissiveMap: ringTexture,
      emissive: new THREE.Color(0xffffff),
      emissiveIntensity: 0.58,
      roughness: 0.28,
      metalness: 0.12,
    });

    const visorMat = new THREE.MeshPhysicalMaterial({
      color: 0x06070b,
      roughness: 0.08,
      metalness: 0.12,
      clearcoat: 1.0,
      clearcoatRoughness: 0.04,
    });

    const eyeMat = new THREE.MeshStandardMaterial({
      color: 0xffffff,
      emissive: new THREE.Color(0xffffff),
      emissiveIntensity: 2.0,
      roughness: 0.1,
    });

    const quoteMat = new THREE.MeshBasicMaterial({
      map: quoteTexture,
      transparent: true,
      opacity: 0,
      depthWrite: false,
    });

    const ledAmberMat = new THREE.MeshStandardMaterial({
      color: 0xffb347,
      emissive: new THREE.Color(0xffb347),
      emissiveIntensity: 1.8,
      roughness: 0.2,
    });
    const ledCoralMat = new THREE.MeshStandardMaterial({
      color: 0xff5a5f,
      emissive: new THREE.Color(0xff5a5f),
      emissiveIntensity: 1.6,
      roughness: 0.2,
    });
    const ledBlueMat = new THREE.MeshStandardMaterial({
      color: 0x54a6ff,
      emissive: new THREE.Color(0x54a6ff),
      emissiveIntensity: 1.5,
      roughness: 0.2,
    });

    const shadowPlaneMat = new THREE.MeshBasicMaterial({
      map: contactShadowTexture,
      transparent: true,
      depthWrite: false,
      opacity: 0.85,
    });

    // Track geometries for clean disposal
    const geometries: THREE.BufferGeometry[] = [];
    const trackGeo = <T extends THREE.BufferGeometry>(g: T): T => {
      geometries.push(g);
      return g;
    };

    // Root Stage Assembly
    const sceneRoot = new THREE.Group();
    scene.add(sceneRoot);

    // Pedestal (anchored below feet)
    const pedestalGroup = new THREE.Group();
    pedestalGroup.position.set(0, -2.05, 0);
    sceneRoot.add(pedestalGroup);

    const pedestalTop = new THREE.Mesh(
      trackGeo(new THREE.CylinderGeometry(1.38, 1.46, 0.2, 48)),
      pedestalMat
    );
    pedestalTop.position.y = 0.08;
    pedestalTop.receiveShadow = true;
    pedestalGroup.add(pedestalTop);

    const pedestalCollar = new THREE.Mesh(
      trackGeo(new THREE.CylinderGeometry(1.48, 1.58, 0.14, 48)),
      darkJointMat
    );
    pedestalCollar.position.y = -0.09;
    pedestalCollar.receiveShadow = true;
    pedestalGroup.add(pedestalCollar);

    const contactShadowPlane = new THREE.Mesh(
      trackGeo(new THREE.PlaneGeometry(3.4, 3.4)),
      shadowPlaneMat
    );
    contactShadowPlane.rotation.x = -Math.PI / 2;
    contactShadowPlane.position.y = 0.185;
    pedestalGroup.add(contactShadowPlane);

    // Robot Character Hierarchy
    const robotBody = new THREE.Group();
    robotBody.position.set(0, -0.05, 0);
    sceneRoot.add(robotBody);

    // Torso
    const torsoMesh = new THREE.Mesh(
      trackGeo(new RoundedBoxGeometry(1.36, 1.32, 0.92, 6, 0.26)),
      ceramicMat
    );
    torsoMesh.position.y = 0.0;
    torsoMesh.castShadow = true;
    torsoMesh.receiveShadow = true;
    robotBody.add(torsoMesh);

    // Waist joint + pelvis
    const waistJoint = new THREE.Mesh(
      trackGeo(new THREE.CylinderGeometry(0.46, 0.42, 0.22, 32)),
      darkJointMat
    );
    waistJoint.position.y = -0.7;
    robotBody.add(waistJoint);

    const pelvisMesh = new THREE.Mesh(
      trackGeo(new RoundedBoxGeometry(1.02, 0.34, 0.72, 4, 0.14)),
      ceramicMat
    );
    pelvisMesh.position.y = -0.88;
    pelvisMesh.castShadow = true;
    robotBody.add(pelvisMesh);

    // Chest HUD strip & 3 glowing LEDs
    const chestPlate = new THREE.Mesh(
      trackGeo(new RoundedBoxGeometry(0.68, 0.26, 0.08, 4, 0.08)),
      darkJointMat
    );
    chestPlate.position.set(0, 0.22, 0.44);
    robotBody.add(chestPlate);

    const ledGeo = trackGeo(new THREE.SphereGeometry(0.042, 16, 16));
    const led1 = new THREE.Mesh(ledGeo, ledAmberMat);
    led1.position.set(-0.16, 0.22, 0.485);
    const led2 = new THREE.Mesh(ledGeo, ledCoralMat);
    led2.position.set(0, 0.22, 0.485);
    const led3 = new THREE.Mesh(ledGeo, ledBlueMat);
    led3.position.set(0.16, 0.22, 0.485);
    robotBody.add(led1, led2, led3);

    // Neck Joint
    const neckCollar = new THREE.Mesh(
      trackGeo(new THREE.CylinderGeometry(0.28, 0.34, 0.28, 32)),
      darkJointMat
    );
    neckCollar.position.y = 0.74;
    robotBody.add(neckCollar);

    // Head Group (pivots around neck)
    const headGroup = new THREE.Group();
    headGroup.position.set(0, 0.88, 0);
    robotBody.add(headGroup);

    const headShell = new THREE.Mesh(
      trackGeo(new RoundedBoxGeometry(1.74, 1.32, 1.16, 6, 0.3)),
      ceramicMat
    );
    headShell.position.y = 0.62;
    headShell.castShadow = true;
    headShell.receiveShadow = true;
    headGroup.add(headShell);

    // Side temple pods
    const earPodGeo = trackGeo(new THREE.CylinderGeometry(0.22, 0.22, 0.14, 28));
    const leftEar = new THREE.Mesh(earPodGeo, darkJointMat);
    leftEar.rotation.z = Math.PI / 2;
    leftEar.position.set(-0.88, 0.62, 0.02);
    const rightEar = new THREE.Mesh(earPodGeo, darkJointMat);
    rightEar.rotation.z = Math.PI / 2;
    rightEar.position.set(0.88, 0.62, 0.02);
    headGroup.add(leftEar, rightEar);

    // Gradient Ring around Face
    const faceRing = new THREE.Mesh(
      trackGeo(new RoundedBoxGeometry(1.44, 1.02, 0.14, 5, 0.24)),
      ringMat
    );
    faceRing.position.set(0, 0.62, 0.54);
    headGroup.add(faceRing);

    // Glossy Black Face Screen
    const visorScreen = new THREE.Mesh(
      trackGeo(new RoundedBoxGeometry(1.3, 0.88, 0.14, 5, 0.2)),
      visorMat
    );
    visorScreen.position.set(0, 0.62, 0.56);
    headGroup.add(visorScreen);

    // Glowing White Eyes
    const eyesGroup = new THREE.Group();
    eyesGroup.position.set(0, 0.62, 0.64);
    headGroup.add(eyesGroup);

    const eyeGeo = trackGeo(new THREE.CapsuleGeometry(0.082, 0.16, 8, 16));
    const leftEye = new THREE.Mesh(eyeGeo, eyeMat);
    leftEye.position.set(-0.24, 0.02, 0);
    const rightEye = new THREE.Mesh(eyeGeo, eyeMat);
    rightEye.position.set(0.24, 0.02, 0);
    eyesGroup.add(leftEye, rightEye);

    // State 3 Glowing Quotation Mark
    const quoteMesh = new THREE.Mesh(
      trackGeo(new THREE.PlaneGeometry(0.78, 0.58)),
      quoteMat
    );
    quoteMesh.position.set(0, 0.62, 0.645);
    quoteMesh.scale.set(0.6, 0.6, 1);
    headGroup.add(quoteMesh);

    // Helper for articulated arm
    function buildArm(side: -1 | 1): THREE.Group {
      const shoulderPivot = new THREE.Group();
      shoulderPivot.position.set(side * 0.84, 0.44, 0);

      const shoulderJoint = new THREE.Mesh(
        trackGeo(new THREE.SphereGeometry(0.18, 24, 24)),
        darkJointMat
      );
      shoulderPivot.add(shoulderJoint);

      const upperArm = new THREE.Mesh(
        trackGeo(new THREE.CapsuleGeometry(0.14, 0.32, 8, 20)),
        ceramicMat
      );
      upperArm.position.set(side * 0.06, -0.3, 0);
      upperArm.rotation.z = side * 0.14;
      upperArm.castShadow = true;
      shoulderPivot.add(upperArm);

      const elbowJoint = new THREE.Mesh(
        trackGeo(new THREE.SphereGeometry(0.135, 20, 20)),
        darkJointMat
      );
      elbowJoint.position.set(side * 0.12, -0.58, 0.02);
      shoulderPivot.add(elbowJoint);

      const forearm = new THREE.Mesh(
        trackGeo(new THREE.CapsuleGeometry(0.135, 0.34, 8, 20)),
        ceramicMat
      );
      forearm.position.set(side * 0.14, -0.88, 0.08);
      forearm.rotation.x = -0.18;
      forearm.castShadow = true;
      shoulderPivot.add(forearm);

      const hand = new THREE.Mesh(
        trackGeo(new RoundedBoxGeometry(0.22, 0.24, 0.2, 4, 0.09)),
        darkJointMat
      );
      hand.position.set(side * 0.14, -1.16, 0.14);
      hand.castShadow = true;
      shoulderPivot.add(hand);

      return shoulderPivot;
    }

    const leftArm = buildArm(-1);
    const rightArm = buildArm(1);
    robotBody.add(leftArm, rightArm);

    // Helper for articulated leg
    function buildLeg(side: -1 | 1): THREE.Group {
      const legGroup = new THREE.Group();
      legGroup.position.set(side * 0.32, -1.0, 0);

      const hipJoint = new THREE.Mesh(
        trackGeo(new THREE.SphereGeometry(0.16, 20, 20)),
        darkJointMat
      );
      legGroup.add(hipJoint);

      const thigh = new THREE.Mesh(
        trackGeo(new THREE.CapsuleGeometry(0.16, 0.26, 8, 20)),
        ceramicMat
      );
      thigh.position.set(0, -0.26, 0);
      thigh.castShadow = true;
      legGroup.add(thigh);

      const kneeJoint = new THREE.Mesh(
        trackGeo(new THREE.CylinderGeometry(0.15, 0.15, 0.12, 24)),
        darkJointMat
      );
      kneeJoint.rotation.z = Math.PI / 2;
      kneeJoint.position.set(0, -0.48, 0);
      legGroup.add(kneeJoint);

      const shin = new THREE.Mesh(
        trackGeo(new THREE.CapsuleGeometry(0.165, 0.26, 8, 20)),
        ceramicMat
      );
      shin.position.set(0, -0.7, 0);
      shin.castShadow = true;
      legGroup.add(shin);

      const foot = new THREE.Mesh(
        trackGeo(new RoundedBoxGeometry(0.36, 0.18, 0.54, 4, 0.08)),
        darkJointMat
      );
      foot.position.set(0, -0.88, 0.08);
      foot.castShadow = true;
      legGroup.add(foot);

      return legGroup;
    }

    const leftLeg = buildLeg(-1);
    const rightLeg = buildLeg(1);
    robotBody.add(leftLeg, rightLeg);

    if (!isSoftwareGl) {
      try {
        renderer.compile(scene, camera);
      } catch {
        // Non-fatal shader pre-warm failure
      }
    }

    // Pointer & Scroll Interpolation State
    let pointerX = 0;
    let pointerY = 0;

    const handlePointerMove = (e: PointerEvent) => {
      const nx = (e.clientX / Math.max(window.innerWidth, 1)) * 2 - 1;
      const ny = (e.clientY / Math.max(window.innerHeight, 1)) * 2 - 1;
      pointerX = THREE.MathUtils.clamp(nx, -1, 1);
      pointerY = THREE.MathUtils.clamp(ny, -1, 1);
    };

    window.addEventListener("pointermove", handlePointerMove, { passive: true });

    const handleResize = () => {
      camera.aspect = window.innerWidth / Math.max(window.innerHeight, 1);
      camera.updateProjectionMatrix();
      renderer.setPixelRatio(
        isSoftwareGl ? 1 : Math.min(window.devicePixelRatio || 1, 2)
      );
      renderer.setSize(window.innerWidth, window.innerHeight);
    };

    window.addEventListener("resize", handleResize);

    // Stage transition state
    let transitionProgress = 1;
    let lastStage: LandingStage = stageRef.current;
    let fromStage: LandingStage = stageRef.current;
    let toStage: LandingStage = stageRef.current;

    const getStageTargets = (s: LandingStage, isCompact: boolean) => {
      if (s === 0) {
        return {
          camX: isCompact ? 0 : -1.25,
          camY: isCompact ? 0.2 : 0.12,
          camZ: isCompact ? 13.4 : 11.6,
          lookY: isCompact ? 0.1 : 0.05,
          bodyRotY: isCompact ? -0.18 : -0.34,
          headTiltZ: 0.06,
        };
      }
      if (s === 1) {
        return {
          camX: isCompact ? 0 : -0.7,
          camY: 1.05,
          camZ: isCompact ? 8.2 : 6.9,
          lookY: 1.32,
          bodyRotY: -0.18,
          headTiltZ: 0.03,
        };
      }
      return {
        camX: isCompact ? 0 : -1.05,
        camY: 1.08,
        camZ: isCompact ? 8.2 : 6.9,
        lookY: 1.35,
        bodyRotY: -0.24,
        headTiltZ: 0.05,
      };
    };

    // Blinking state
    let nextBlinkAt = 2.4;
    let blinkElapsed = -1;

    // Face expression state (0 = eyes, 1 = quote)
    let quoteBlend = stageRef.current === 2 ? 1 : 0;

    // Pre-allocated vectors for zero GC in loop
    const lookTarget = new THREE.Vector3(0, 0.05, 0);

    let lastTime = performance.now();
    let totalTime = 0;
    let frameId = 0;
    let disposed = false;

    function afterDraw(cb: () => void) {
      const gl = renderer.getContext() as WebGL2RenderingContext;
      const sync =
        typeof gl.fenceSync === "function"
          ? gl.fenceSync(gl.SYNC_GPU_COMMANDS_COMPLETE, 0)
          : null;
      gl.flush();
      const poll = () => {
        if (disposed) return;
        const state = sync && gl.getSyncParameter(sync, gl.SYNC_STATUS);
        if (sync && state === gl.UNSIGNALED) {
          frameId = window.setTimeout(poll, 5);
        } else {
          if (sync) gl.deleteSync(sync);
          frameId = window.setTimeout(cb, 80);
        }
      };
      frameId = window.setTimeout(poll, 5);
    }

    function tick() {
      if (disposed) return;

      const now = performance.now();
      const delta = Math.min((now - lastTime) / 1000, 0.05);
      lastTime = now;
      totalTime += delta;

      const currentStage = stageRef.current;
      if (currentStage !== lastStage) {
        fromStage = lastStage;
        toStage = currentStage;
        lastStage = currentStage;
        transitionProgress = 0;
      }

      if (transitionProgress < 1) {
        transitionProgress = Math.min(1, transitionProgress + delta / 0.85);
      }

      const eased = easeInOutCubic(transitionProgress);
      const isCompact = window.innerWidth < 768;
      const a = getStageTargets(fromStage, isCompact);
      const b = getStageTargets(toStage, isCompact);

      const targetCamX =
        THREE.MathUtils.lerp(a.camX, b.camX, eased) + pointerX * 0.28;
      const targetCamY =
        THREE.MathUtils.lerp(a.camY, b.camY, eased) - pointerY * 0.16;
      const targetCamZ = THREE.MathUtils.lerp(a.camZ, b.camZ, eased);
      const targetLookY = THREE.MathUtils.lerp(a.lookY, b.lookY, eased);
      const targetBodyRotY =
        THREE.MathUtils.lerp(a.bodyRotY, b.bodyRotY, eased) + pointerX * 0.16;
      const targetHeadTiltZ = THREE.MathUtils.lerp(a.headTiltZ, b.headTiltZ, eased);

      camera.position.x = THREE.MathUtils.damp(camera.position.x, targetCamX, 5, delta);
      camera.position.y = THREE.MathUtils.damp(camera.position.y, targetCamY, 5, delta);
      camera.position.z = THREE.MathUtils.damp(camera.position.z, targetCamZ, 5, delta);
      lookTarget.y = THREE.MathUtils.damp(lookTarget.y, targetLookY, 5, delta);
      camera.lookAt(lookTarget);

      // Gentle idle animation
      const motionScale = prefersReducedMotion ? 0 : 1;
      const bobY = Math.sin(totalTime * 1.45) * 0.04 * motionScale;
      robotBody.position.y = -0.05 + bobY;

      robotBody.rotation.y = THREE.MathUtils.damp(
        robotBody.rotation.y,
        targetBodyRotY,
        4.5,
        delta
      );

      // Head tracks pointer smoothly + subtle idle motion
      const targetHeadYaw = pointerX * 0.34 + Math.sin(totalTime * 0.8) * 0.035 * motionScale;
      const targetHeadPitch = -pointerY * 0.22 + Math.cos(totalTime * 1.1) * 0.025 * motionScale;
      headGroup.rotation.y = THREE.MathUtils.damp(
        headGroup.rotation.y,
        targetHeadYaw,
        6,
        delta
      );
      headGroup.rotation.x = THREE.MathUtils.damp(
        headGroup.rotation.x,
        targetHeadPitch,
        6,
        delta
      );
      headGroup.rotation.z = THREE.MathUtils.damp(
        headGroup.rotation.z,
        targetHeadTiltZ,
        5,
        delta
      );

      // Natural arm sway
      leftArm.rotation.x = Math.sin(totalTime * 1.3) * 0.06 * motionScale;
      rightArm.rotation.x = -Math.sin(totalTime * 1.3) * 0.06 * motionScale;
      leftArm.rotation.z = 0.04 + Math.sin(totalTime * 0.9) * 0.02 * motionScale;
      rightArm.rotation.z = -0.04 - Math.sin(totalTime * 0.9) * 0.02 * motionScale;

      // Subtle LED pulse
      ledAmberMat.emissiveIntensity = 1.5 + Math.sin(totalTime * 2.2) * 0.35 * motionScale;
      ledCoralMat.emissiveIntensity = 1.4 + Math.sin(totalTime * 2.2 + 1.2) * 0.35 * motionScale;
      ledBlueMat.emissiveIntensity = 1.35 + Math.sin(totalTime * 2.2 + 2.4) * 0.35 * motionScale;

      // Random eye blinking
      let blinkScaleY = 1;
      if (!prefersReducedMotion && currentStage !== 2) {
        if (totalTime >= nextBlinkAt && blinkElapsed < 0) {
          blinkElapsed = 0;
        }
        if (blinkElapsed >= 0) {
          blinkElapsed += delta;
          const blinkDur = 0.16;
          if (blinkElapsed < blinkDur) {
            const p = blinkElapsed / blinkDur;
            blinkScaleY = Math.max(0.08, Math.abs(Math.cos(p * Math.PI)));
          } else {
            blinkElapsed = -1;
            nextBlinkAt = totalTime + 2.5 + Math.random() * 3.5;
          }
        }
      }

      // Face transition between Eyes (State 0/1) and Quotation Mark (State 2)
      const targetQuoteBlend = currentStage === 2 ? 1 : 0;
      quoteBlend = THREE.MathUtils.damp(quoteBlend, targetQuoteBlend, 7, delta);

      const eyePresence = Math.max(0.001, 1 - quoteBlend);
      eyesGroup.visible = quoteBlend < 0.96;
      eyesGroup.scale.set(
        eyePresence,
        eyePresence * blinkScaleY,
        1
      );

      quoteMesh.visible = quoteBlend > 0.03;
      quoteMat.opacity = quoteBlend;
      const qScale = 0.72 + quoteBlend * 0.28;
      quoteMesh.scale.set(qScale, qScale, 1);

      renderer.render(scene, camera);

      if (isSoftwareGl) {
        afterDraw(tick);
      } else {
        frameId = window.requestAnimationFrame(tick);
      }
    }

    tick();

    return () => {
      disposed = true;
      window.cancelAnimationFrame(frameId);
      window.clearTimeout(frameId);
      window.removeEventListener("pointermove", handlePointerMove);
      window.removeEventListener("resize", handleResize);
      renderer.domElement.removeEventListener("webglcontextlost", handleContextLost);

      geometries.forEach((g) => g.dispose());
      ceramicMat.dispose();
      darkJointMat.dispose();
      pedestalMat.dispose();
      ringMat.dispose();
      visorMat.dispose();
      eyeMat.dispose();
      quoteMat.dispose();
      ledAmberMat.dispose();
      ledCoralMat.dispose();
      ledBlueMat.dispose();
      shadowPlaneMat.dispose();
      ringTexture.dispose();
      quoteTexture.dispose();
      contactShadowTexture.dispose();
      envTarget?.dispose();
      renderer.dispose();
      if (renderer.domElement.parentNode === container) {
        container.removeChild(renderer.domElement);
      }
    };
  }, []);

  if (webglFailed) {
    return (
      <div
        aria-hidden="true"
        className="fixed inset-0 z-[1] pointer-events-none flex items-center justify-end pr-[10%] opacity-40"
      >
        <div className="w-72 h-96 rounded-[40px] border-2 border-[#ff8a3d]/40 bg-[#eeebe6] shadow-2xl flex flex-col items-center justify-center gap-6">
          <div className="w-44 h-28 rounded-3xl bg-[#141414] border-4 border-[#ff5a5f]/70 flex items-center justify-center gap-7">
            <div className="w-4 h-7 rounded-full bg-white" />
            <div className="w-4 h-7 rounded-full bg-white" />
          </div>
          <div className="flex items-center gap-2">
            <span className="w-2.5 h-2.5 rounded-full bg-[#ffb347]" />
            <span className="w-2.5 h-2.5 rounded-full bg-[#ff5a5f]" />
            <span className="w-2.5 h-2.5 rounded-full bg-[#54a6ff]" />
          </div>
        </div>
      </div>
    );
  }

  return (
    <div
      ref={mountRef}
      aria-hidden="true"
      className="fixed inset-0 z-[1] pointer-events-none"
    />
  );
}
