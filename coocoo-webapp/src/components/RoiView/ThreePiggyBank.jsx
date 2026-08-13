import React, { useEffect, useRef, useState } from 'react';
import * as THREE from 'three';

export default function ThreePiggyBank({
  fillPct = 35,
  wishTitle = '去日本看櫻花 🍁',
  onDepositComplete
}) {
  const mountRef = useRef(null);
  const [isDepositing, setIsDepositing] = useState(false);

  // References for Three.js animation
  const sceneRef = useRef(null);
  const rendererRef = useRef(null);
  const piggyGroupRef = useRef(null);
  const waterMeshRef = useRef(null);
  const waterUniformsRef = useRef(null);
  const animFrameIdRef = useRef(null);

  // Mouse drag control state
  const isDraggingRef = useRef(false);
  const previousMousePositionRef = useRef({ x: 0, y: 0 });

  useEffect(() => {
    const container = mountRef.current;
    if (!container) return;

    const width = container.clientWidth || 320;
    const height = container.clientHeight || 260;

    // 1. Scene setup
    const scene = new THREE.Scene();
    sceneRef.current = scene;

    // 2. Camera setup
    const camera = new THREE.PerspectiveCamera(45, width / height, 0.1, 1000);
    camera.position.set(0, 0.8, 6.5);

    // 3. Renderer setup
    const renderer = new THREE.WebGLRenderer({ antialias: true, alpha: true });
    renderer.setSize(width, height);
    renderer.setPixelRatio(Math.min(window.devicePixelRatio, 2));
    renderer.toneMapping = THREE.ACESFilmicToneMapping;
    renderer.toneMappingExposure = 1.2;
    rendererRef.current = renderer;

    container.appendChild(renderer.domElement);

    // 4. Lights setup
    const ambientLight = new THREE.AmbientLight(0xfff5ea, 1.2);
    scene.add(ambientLight);

    const dirLight1 = new THREE.DirectionalLight(0xffffff, 2.0);
    dirLight1.position.set(5, 8, 5);
    scene.add(dirLight1);

    const dirLight2 = new THREE.DirectionalLight(0xe07a5f, 1.0);
    dirLight2.position.set(-5, -3, -4);
    scene.add(dirLight2);

    // Inner glowing belly point light
    const bellyLight = new THREE.PointLight(0xf2cc8f, 2.5, 5);
    bellyLight.position.set(0, -0.2, 0);
    scene.add(bellyLight);

    // 5. Build Piggy Group
    const piggyGroup = new THREE.Group();
    piggyGroupRef.current = piggyGroup;
    scene.add(piggyGroup);

    // Morandi Frosted Glass Material
    const glassMaterial = new THREE.MeshPhysicalMaterial({
      color: new THREE.Color('#fdfae7'),
      transmission: 0.92,
      opacity: 1.0,
      transparent: true,
      roughness: 0.22,
      metalness: 0.05,
      ior: 1.45,
      thickness: 1.2,
      specularIntensity: 0.9,
      clearcoat: 0.4,
      clearcoatRoughness: 0.1
    });

    // Piggy Body (Ellipsoid)
    const bodyGeo = new THREE.SphereGeometry(1.4, 48, 48);
    bodyGeo.scale(1.25, 0.95, 0.95);
    const bodyMesh = new THREE.Mesh(bodyGeo, glassMaterial);
    piggyGroup.add(bodyMesh);

    // Piggy Snout
    const snoutGeo = new THREE.CylinderGeometry(0.42, 0.46, 0.35, 32);
    snoutGeo.rotateX(Math.PI / 2);
    const snoutMesh = new THREE.Mesh(snoutGeo, glassMaterial);
    snoutMesh.position.set(1.6, -0.1, 0);
    piggyGroup.add(snoutMesh);

    // Snout Nostrils (Dark accents)
    const nostrilMat = new THREE.MeshBasicMaterial({ color: 0x582f0e });
    const nostril1 = new THREE.Mesh(new THREE.SphereGeometry(0.07, 16, 16), nostrilMat);
    nostril1.position.set(1.78, -0.05, 0.14);
    const nostril2 = new THREE.Mesh(new THREE.SphereGeometry(0.07, 16, 16), nostrilMat);
    nostril2.position.set(1.78, -0.05, -0.14);
    piggyGroup.add(nostril1, nostril2);

    // Eyes
    const eyeMat = new THREE.MeshStandardMaterial({ color: 0x222222, roughness: 0.1 });
    const eye1 = new THREE.Mesh(new THREE.SphereGeometry(0.1, 16, 16), eyeMat);
    eye1.position.set(1.3, 0.4, 0.55);
    const eye2 = new THREE.Mesh(new THREE.SphereGeometry(0.1, 16, 16), eyeMat);
    eye2.position.set(1.3, 0.4, -0.55);
    piggyGroup.add(eye1, eye2);

    // Ears
    const earGeo = new THREE.ConeGeometry(0.32, 0.55, 16);
    earGeo.rotateZ(-Math.PI / 4);
    const ear1 = new THREE.Mesh(earGeo, glassMaterial);
    ear1.position.set(0.7, 0.95, 0.65);
    ear1.rotation.y = 0.3;
    const ear2 = new THREE.Mesh(earGeo, glassMaterial);
    ear2.position.set(0.7, 0.95, -0.65);
    ear2.rotation.y = -0.3;
    piggyGroup.add(ear1, ear2);

    // 4 Stubby Feet
    const footGeo = new THREE.CylinderGeometry(0.2, 0.22, 0.4, 16);
    const footMat = glassMaterial;
    const f1 = new THREE.Mesh(footGeo, footMat); f1.position.set(0.75, -1.0, 0.6);
    const f2 = new THREE.Mesh(footGeo, footMat); f2.position.set(0.75, -1.0, -0.6);
    const f3 = new THREE.Mesh(footGeo, footMat); f3.position.set(-0.75, -1.0, 0.6);
    const f4 = new THREE.Mesh(footGeo, footMat); f4.position.set(-0.75, -1.0, -0.6);
    piggyGroup.add(f1, f2, f3, f4);

    // Curly Tail
    const tailGeo = new THREE.TorusGeometry(0.22, 0.06, 12, 24, Math.PI * 1.5);
    const tailMesh = new THREE.Mesh(tailGeo, glassMaterial);
    tailMesh.position.set(-1.75, 0.1, 0);
    tailMesh.rotation.y = Math.PI / 2;
    piggyGroup.add(tailMesh);

    // Top Metallic Slot (Back Coin Slot Rim)
    const slotMat = new THREE.MeshStandardMaterial({
      color: 0xd4af37,
      metalness: 0.85,
      roughness: 0.25
    });
    const slotRimGeo = new THREE.BoxGeometry(0.7, 0.08, 0.16);
    const slotRimMesh = new THREE.Mesh(slotRimGeo, slotMat);
    slotRimMesh.position.set(0, 0.92, 0);
    piggyGroup.add(slotRimMesh);

    // 6. Golden Light Water Shader Material ( Belly Liquid )
    const waterUniforms = {
      uTime: { value: 0 },
      uFillLevel: { value: (fillPct / 100) * 1.4 - 0.7 }, // mapped to belly Y range [-0.7, 0.7]
      uColorDeep: { value: new THREE.Color('#e07a5f') },
      uColorGold: { value: new THREE.Color('#f2cc8f') }
    };
    waterUniformsRef.current = waterUniforms;

    const waterMat = new THREE.ShaderMaterial({
      uniforms: waterUniforms,
      vertexShader: `
        uniform float uTime;
        varying vec3 vPos;
        varying vec2 vUv;
        void main() {
          vUv = uv;
          vec3 pos = position;
          pos.y += sin(pos.x * 5.0 + uTime * 3.0) * 0.06;
          pos.z += cos(pos.z * 5.0 + uTime * 2.5) * 0.05;
          vPos = pos;
          gl_Position = projectionMatrix * modelViewMatrix * vec4(pos, 1.0);
        }
      `,
      fragmentShader: `
        uniform vec3 uColorDeep;
        uniform vec3 uColorGold;
        uniform float uFillLevel;
        varying vec3 vPos;
        void main() {
          if (vPos.y > uFillLevel) discard;
          float factor = smoothstep(-0.8, uFillLevel, vPos.y);
          vec3 col = mix(uColorDeep, uColorGold, factor);
          gl_FragColor = vec4(col, 0.85);
        }
      `,
      transparent: true,
      side: THREE.DoubleSide
    });

    const waterGeo = new THREE.SphereGeometry(1.28, 32, 32);
    waterGeo.scale(1.2, 0.9, 0.9);
    const waterMesh = new THREE.Mesh(waterGeo, waterMat);
    waterMesh.position.set(0, -0.05, 0);
    waterMeshRef.current = waterMesh;
    piggyGroup.add(waterMesh);

    // Initial slight rotation angle
    piggyGroup.rotation.y = -0.4;
    piggyGroup.rotation.x = 0.15;

    // Render Loop
    let clock = new THREE.Clock();
    const animate = () => {
      const elapsedTime = clock.getElapsedTime();
      if (waterUniformsRef.current) {
        waterUniformsRef.current.uTime.value = elapsedTime;
      }

      // Gentle floating animation
      if (!isDraggingRef.current && piggyGroupRef.current) {
        piggyGroupRef.current.position.y = Math.sin(elapsedTime * 1.5) * 0.08;
      }

      renderer.render(scene, camera);
      animFrameIdRef.current = requestAnimationFrame(animate);
    };
    animate();

    // Mouse Drag Listeners
    const handleMouseDown = (e) => {
      isDraggingRef.current = true;
      previousMousePositionRef.current = { x: e.clientX, y: e.clientY };
    };

    const handleMouseMove = (e) => {
      if (!isDraggingRef.current || !piggyGroupRef.current) return;
      const deltaX = e.clientX - previousMousePositionRef.current.x;
      const deltaY = e.clientY - previousMousePositionRef.current.y;

      piggyGroupRef.current.rotation.y += deltaX * 0.01;
      piggyGroupRef.current.rotation.x += deltaY * 0.008;

      previousMousePositionRef.current = { x: e.clientX, y: e.clientY };
    };

    const handleMouseUp = () => {
      isDraggingRef.current = false;
    };

    const domEl = renderer.domElement;
    domEl.addEventListener('mousedown', handleMouseDown);
    window.addEventListener('mousemove', handleMouseMove);
    window.addEventListener('mouseup', handleMouseUp);

    // Resize Listener
    const handleResize = () => {
      if (!container || !rendererRef.current) return;
      const newW = container.clientWidth || 320;
      const newH = container.clientHeight || 260;
      camera.aspect = newW / newH;
      camera.updateProjectionMatrix();
      rendererRef.current.setSize(newW, newH);
    };
    window.addEventListener('resize', handleResize);

    return () => {
      if (animFrameIdRef.current) cancelAnimationFrame(animFrameIdRef.current);
      domEl.removeEventListener('mousedown', handleMouseDown);
      window.removeEventListener('mousemove', handleMouseMove);
      window.removeEventListener('mouseup', handleMouseUp);
      window.removeEventListener('resize', handleResize);
      if (container.contains(domEl)) container.removeChild(domEl);
    };
  }, []);

  // Update water fill level uniform when fillPct changes
  useEffect(() => {
    if (waterUniformsRef.current) {
      const targetLevel = (fillPct / 100) * 1.3 - 0.65;
      waterUniformsRef.current.uFillLevel.value = targetLevel;
    }
  }, [fillPct]);

  // Trigger Receipt Drop Animation
  const handleDepositReceiptAnimation = () => {
    if (isDepositing || !sceneRef.current) return;
    setIsDepositing(true);

    const scene = sceneRef.current;

    // Create Receipt Mesh Card
    const receiptGeo = new THREE.PlaneGeometry(0.45, 0.7);
    const receiptMat = new THREE.MeshStandardMaterial({
      color: 0xfffdf0,
      roughness: 0.3,
      side: THREE.DoubleSide
    });
    const receiptMesh = new THREE.Mesh(receiptGeo, receiptMat);
    receiptMesh.position.set(0, 3.2, 0);
    receiptMesh.rotation.z = 0.2;
    scene.add(receiptMesh);

    // Drop Animation steps
    let startY = 3.2;
    let frameCount = 0;

    const dropInterval = setInterval(() => {
      frameCount++;
      startY -= 0.12;
      receiptMesh.position.y = startY;
      receiptMesh.rotation.z += 0.05;

      // When entering top slot (y <= 0.95)
      if (startY <= 0.95) {
        clearInterval(dropInterval);
        scene.remove(receiptMesh);

        // Spawn Golden Particle Sparkles Rain
        const particleCount = 45;
        const particleGeo = new THREE.BufferGeometry();
        const positions = new Float32Array(particleCount * 3);
        for (let i = 0; i < particleCount * 3; i += 3) {
          positions[i] = (Math.random() - 0.5) * 0.8;
          positions[i + 1] = 0.8 - Math.random() * 1.2;
          positions[i + 2] = (Math.random() - 0.5) * 0.8;
        }
        particleGeo.setAttribute('position', new THREE.BufferAttribute(positions, 3));
        const particleMat = new THREE.PointsMaterial({
          color: 0xf2cc8f,
          size: 0.08,
          transparent: true,
          opacity: 0.9
        });
        const particles = new THREE.Points(particleGeo, particleMat);
        scene.add(particles);

        setTimeout(() => {
          scene.remove(particles);
          setIsDepositing(false);
          onDepositComplete?.();
        }, 600);
      }
    }, 20);
  };

  return (
    <div className="relative w-full flex flex-col items-center">
      {/* 3D Canvas Container */}
      <div 
        ref={mountRef} 
        className="w-full h-64 sm:h-72 cursor-grab active:cursor-grabbing relative flex items-center justify-center"
      >
        {/* Wish Tag Badge Overlay */}
        <div className="absolute top-2 left-4 bg-amber-100/90 border border-amber-300 text-[11px] font-extrabold text-[#3d405b] px-3 py-1 rounded-xl shadow-md z-10 animate-tag-fly">
          🏷️ 許願標籤：{wishTitle}
        </div>

        {/* 360 Drag Hint */}
        <div className="absolute bottom-2 right-4 text-[10px] font-bold text-stone-400 bg-white/70 px-2.5 py-1 rounded-full border border-stone-200 backdrop-blur-xs flex items-center gap-1 pointer-events-none">
          <span className="material-symbols-outlined text-xs">3d_rotation</span>
          <span>按住拖曳 360° 觀賞</span>
        </div>
      </div>

      {/* Interactive Trigger Button */}
      <button
        onClick={handleDepositReceiptAnimation}
        disabled={isDepositing}
        className="mt-1 bg-gradient-to-r from-[#e07a5f] to-[#d95d39] hover:from-[#d95d39] hover:to-[#c84b27] text-white text-xs font-black py-2.5 px-5 rounded-2xl shadow-md transition-all active:scale-95 flex items-center gap-2 border border-white/40"
      >
        <span className="material-symbols-outlined text-base">receipt_long</span>
        <span>{isDepositing ? '🧾 發票掉入豬背投幣孔中...' : '🧾 投遞自煮外送發票 (金光水上升測試)'}</span>
      </button>
    </div>
  );
}
