import React, { useEffect, useRef, useState } from 'react';

// GLSL Simplex Noise and Curl Field utility shaders
const NOISE_GLSL = `
// Simplex 3D Noise by Ian McEwan, Ashima Arts
vec4 permute(vec4 x) { return mod(((x*34.0)+10.0)*x, 289.0); }
vec4 taylorInvSqrt(vec4 r) { return 1.79284291400159 - 0.85373472095314 * r; }

float snoise(vec3 v) {
  const vec2 C = vec2(1.0/6.0, 1.0/3.0);
  const vec4 D = vec4(0.0, 0.5, 1.0, 2.0);

  vec3 i  = floor(v + dot(v, C.yyy) );
  vec3 x0 =   v - i + dot(i, C.xxx) ;

  vec3 g = step(x0.yzx, x0.xyz);
  vec3 l = 1.0 - g;
  vec3 i1 = min( g.xyz, l.zxy );
  vec3 i2 = max( g.xyz, l.zxy );

  vec3 x1 = x0 - i1 + C.xxx;
  vec3 x2 = x0 - i2 + C.yyy;
  vec3 x3 = x0 - D.yyy;

  i = mod(i, 289.0);
  vec4 p = permute( permute( permute(
             i.z + vec4(0.0, i1.z, i2.z, 1.0 ))
           + i.y + vec4(0.0, i1.y, i2.y, 1.0 ))
           + i.x + vec4(0.0, i1.x, i2.x, 1.0 ));

  float n_ = 0.142857142857;
  vec3  ns = n_ * D.wyz - D.xzx;

  vec4 j = p - 49.0 * floor(p * ns.z * ns.z);

  vec4 x_ = floor(j * ns.z);
  vec4 y_ = floor(j - 7.0 * x_ );

  vec4 x = x_ *ns.x + ns.yyyy;
  vec4 y = y_ *ns.x + ns.yyyy;
  vec4 h = 1.0 - abs(x) - abs(y);

  vec4 b0 = vec4( x.xy, y.xy );
  vec4 b1 = vec4( x.zw, y.zw );

  vec4 s0 = floor(b0)*2.0 + 1.0;
  vec4 s1 = floor(b1)*2.0 + 1.0;
  vec4 sh = -step(h, vec4(0.0));

  vec4 a0 = b0.xzyw + s0.xzyw*sh.xxyy ;
  vec4 a1 = b1.xzyw + s1.xzyw*sh.zzww ;

  vec3 p0 = vec3(a0.xy,h.x);
  vec3 p1 = vec3(a0.zw,h.y);
  vec3 p2 = vec3(a1.xy,h.z);
  vec3 p3 = vec3(a1.zw,h.w);

  vec4 norm = taylorInvSqrt(vec4(dot(p0,p0), dot(p1,p1), dot(p2, p2), dot(p3,p3)));
  p0 *= norm.x;
  p1 *= norm.y;
  p2 *= norm.z;
  p3 *= norm.w;

  vec4 m = max(0.6 - vec4(dot(x0,x0), dot(x1,x1), dot(x2,x2), dot(x3,x3)), 0.0);
  m = m * m;
  return 42.0 * dot( m*m, vec4( dot(p0,x0), dot(p1,x1),
                                dot(p2,x2), dot(p3,x3) ) );
}

// Curl Noise generator to simulate fluid flow vectors
vec2 curlNoise(vec2 p, float time) {
  float eps = 0.08;
  float n1 = snoise(vec3(p.x, p.y - eps, time));
  float n2 = snoise(vec3(p.x, p.y + eps, time));
  float n3 = snoise(vec3(p.x - eps, p.y, time));
  float n4 = snoise(vec3(p.x + eps, p.y, time));
  return vec2(n2 - n1, n3 - n4) / (2.0 * eps);
}
`;

export default function CosmicBackground({ theme }) {
  const containerRef = useRef(null);
  const canvasRef = useRef(null);
  const [isLoaded, setIsLoaded] = useState(false);
  const currentTheme = useRef(theme);
  
  useEffect(() => {
    currentTheme.current = theme;
  }, [theme]);

  useEffect(() => {
    if (!canvasRef.current) return;

    let THREE;
    let scene, camera, renderer;
    let fluidMesh, fluidMaterial;
    let particleSystem, particleMaterial;
    let flowSystem, flowMaterial;
    let animationFrameId;
    let resizeObserver;
    
    const isMobile = window.innerWidth < 768;
    const particleCount = isMobile ? 400 : 1200;
    const flowStreamCount = isMobile ? 300 : 800;

    // Interaction states
    const rawMouse = { x: 0, y: 0, hoverActive: 0.0 };
    const springMouse = { x: 0, y: 0 };
    const mouseVel = { x: 0, y: 0 };
    
    const rawScroll = { y: 0 };
    const springScroll = { y: 0 };
    const scrollVel = { y: 0 };

    const springHover = { value: 0 };
    const hoverVel = { value: 0 };
    
    let isReducedMotion = window.matchMedia('(prefers-reduced-motion: reduce)').matches;

    const handleMouseMove = (e) => {
      rawMouse.x = (e.clientX / window.innerWidth) * 2 - 1;
      rawMouse.y = -(e.clientY / window.innerHeight) * 2 + 1;
    };

    const handleScroll = () => {
      rawScroll.y = window.scrollY;
    };

    const handleMouseOver = (e) => {
      const target = e.target;
      const isInteractive = 
        target.tagName === 'BUTTON' || 
        target.tagName === 'A' || 
        target.closest('button') || 
        target.closest('a') || 
        target.closest('.glass-panel') ||
        target.closest('[role="button"]');
        
      rawMouse.hoverActive = isInteractive ? 1.0 : 0.0;
    };

    window.addEventListener('mousemove', handleMouseMove);
    window.addEventListener('scroll', handleScroll);
    window.addEventListener('mouseover', handleMouseOver);

    const motionQuery = window.matchMedia('(prefers-reduced-motion: reduce)');
    const handleMotionChange = (e) => {
      isReducedMotion = e.matches;
      if (fluidMaterial) fluidMaterial.uniforms.uReducedMotion.value = isReducedMotion ? 1.0 : 0.0;
      if (particleMaterial) particleMaterial.uniforms.uReducedMotion.value = isReducedMotion ? 1.0 : 0.0;
      if (flowMaterial) flowMaterial.uniforms.uReducedMotion.value = isReducedMotion ? 1.0 : 0.0;
    };
    motionQuery.addEventListener('change', handleMotionChange);

    import('three').then((module) => {
      THREE = module;
      const canvas = canvasRef.current;
      
      const width = canvas.clientWidth || window.innerWidth;
      const height = canvas.clientHeight || window.innerHeight;

      scene = new THREE.Scene();
      camera = new THREE.OrthographicCamera(-1, 1, 1, -1, 0, 1);
      
      renderer = new THREE.WebGLRenderer({
        canvas,
        antialias: false,
        alpha: true,
        powerPreference: "high-performance",
        preserveDrawingBuffer: false
      });
      renderer.setSize(width, height, false);
      renderer.setPixelRatio(isMobile ? 1 : Math.min(window.devicePixelRatio, 1.5));

      // 1. Fluid Simulation Plane Quad
      const fluidGeometry = new THREE.PlaneGeometry(2, 2);
      
      fluidMaterial = new THREE.ShaderMaterial({
        vertexShader: `
          varying vec2 vUv;
          void main() {
            vUv = uv;
            gl_Position = vec4(position, 1.0);
          }
        `,
        fragmentShader: `
          varying vec2 vUv;
          uniform float uTime;
          uniform vec2 uMouse;
          uniform float uScroll;
          uniform float uScrollVelocity;
          uniform vec2 uResolution;
          uniform float uTheme;
          uniform float uReducedMotion;

          ${NOISE_GLSL}

          float fbm(vec3 p) {
            float value = 0.0;
            float amplitude = 0.5;
            float frequency = 1.0;
            for (int i = 0; i < 4; i++) {
              value += amplitude * snoise(p * frequency);
              frequency *= 2.0;
              amplitude *= 0.5;
            }
            return value;
          }

          void main() {
            vec2 st = gl_FragCoord.xy / uResolution.xy;
            float aspect = uResolution.x / uResolution.y;
            vec2 uv = vUv - 0.5;
            uv.x *= aspect;

            float speedVal = uTime * 0.018 + uScrollVelocity * 0.06;
            
            // Cursor interaction vectors (gravity and fluid swirl vortex)
            vec2 mousePos = vec2(uMouse.x * aspect * 0.5, uMouse.y * 0.5);
            vec2 mouseDir = uv - mousePos;
            float mouseDist = length(mouseDir);
            float mouseGlow = smoothstep(0.9, 0.0, mouseDist);

            // Warp UVs with curl noise to simulate fluid advection
            vec2 uvWarped = uv;
            if (uReducedMotion < 0.5) {
              vec2 flow = curlNoise(uv * 1.5, speedVal * 0.5);
              
              // Swirling fluid displacement around cursor
              vec2 swirl = vec2(-mouseDir.y, mouseDir.x) * mouseGlow * 0.16;
              
              uvWarped += flow * 0.14 + swirl;
              uvWarped.y -= uScroll * 0.0004; // Scroll vertical advection
            }

            // Procedural Cosmic Plasma Fluid layers
            float fluid1 = fbm(vec3(uvWarped * 1.2, speedVal * 0.3));
            float fluid2 = fbm(vec3(uvWarped * 2.4 + vec2(fluid1), speedVal * 0.6 + 10.0));
            float fluid3 = fbm(vec3(uvWarped * 3.6 + vec2(fluid2), speedVal * 0.9 + 20.0));

            // Fluid turbulence magnitude for highlights
            float turbulence = abs(fluid1 * 0.5 + fluid2 * 0.3 + fluid3 * 0.2);

            // Palette
            vec3 spaceBlack = vec3(0.004, 0.006, 0.012);   // Darker for higher UI contrast
            vec3 spaceNavy = vec3(0.008, 0.02, 0.07);      
            vec3 quantumIndigo = vec3(0.035, 0.015, 0.12); 
            vec3 plasmaMagenta = vec3(0.32, 0.02, 0.28);   
            vec3 electricBlue = vec3(0.01, 0.15, 0.44);   
            vec3 fluidCyan = vec3(0.005, 0.25, 0.32);     
            
            vec3 lightSlate = vec3(0.98, 0.98, 1.0);
            vec3 lightBlue = vec3(0.92, 0.95, 0.99);
            vec3 lightIndigo = vec3(0.94, 0.91, 0.97);

            vec3 darkFluid = mix(spaceBlack, spaceNavy, turbulence);
            darkFluid = mix(darkFluid, quantumIndigo, fluid1 * 0.4 + 0.3);
            darkFluid = mix(darkFluid, electricBlue, fluid2 * 0.3 + 0.2);
            darkFluid = mix(darkFluid, plasmaMagenta, max(0.0, fluid2 - 0.2) * 0.25);
            darkFluid = mix(darkFluid, fluidCyan, fluid3 * 0.3);

            // Dynamic fluid highlights (glows brighter when fluid shifts fast)
            float flowIntensity = uScrollVelocity * 0.25 + 0.1;
            darkFluid += fluidCyan * (fluid3 * fluid3) * flowIntensity;

            // Cursor heat trail
            darkFluid += mix(vec3(0.5, 0.2, 0.9), vec3(0.0, 0.8, 1.0), fluid2 * 0.5 + 0.5) * mouseGlow * (0.06 + uScrollVelocity * 0.05);

            vec3 lightFluid = mix(lightSlate, lightIndigo, fluid1 * 0.35);
            lightFluid = mix(lightFluid, lightBlue, fluid2 * 0.3);

            vec3 color = mix(darkFluid, lightFluid, uTheme);

            // Ambient film grain to avoid color banding
            float grainVal = fract(sin(dot(gl_FragCoord.xy, vec2(12.9898, 78.233))) * 43758.5453);
            color += vec3(grainVal * 0.012 - 0.006);

            gl_FragColor = vec4(color, 1.0);
          }
        `,
        uniforms: {
          uTime: { value: 0 },
          uMouse: { value: new THREE.Vector2(0, 0) },
          uScroll: { value: 0.0 },
          uScrollVelocity: { value: 0.0 },
          uResolution: { value: new THREE.Vector2(width, height) },
          uTheme: { value: currentTheme.current === 'light' ? 1.0 : 0.0 },
          uReducedMotion: { value: isReducedMotion ? 1.0 : 0.0 }
        },
        depthWrite: false,
        depthTest: false
      });

      fluidMesh = new THREE.Mesh(fluidGeometry, fluidMaterial);
      scene.add(fluidMesh);

      // 2. Layer 4: Flowing Quantum Energy Stream Particles
      const flowGeometry = new THREE.BufferGeometry();
      const flowPos = new Float32Array(flowStreamCount * 3);
      const flowSizes = new Float32Array(flowStreamCount);
      const flowAlphas = new Float32Array(flowStreamCount);
      const flowPhases = new Float32Array(flowStreamCount);
      const flowDepths = new Float32Array(flowStreamCount);

      for (let i = 0; i < flowStreamCount; i++) {
        flowPos[i * 3] = (Math.random() - 0.5) * 3.5;
        flowPos[i * 3 + 1] = (Math.random() - 0.5) * 3.5;
        flowPos[i * 3 + 2] = -0.6 - Math.random() * 0.2; // Midground Z depth

        flowSizes[i] = Math.random() * 1.5 + 0.5;
        flowAlphas[i] = Math.random() * 0.28 + 0.08;
        flowPhases[i] = Math.random() * Math.PI * 2;
        flowDepths[i] = Math.random() * 0.4 + 0.2;
      }

      flowGeometry.setAttribute('position', new THREE.BufferAttribute(flowPos, 3));
      flowGeometry.setAttribute('aSize', new THREE.BufferAttribute(flowSizes, 1));
      flowGeometry.setAttribute('aAlpha', new THREE.BufferAttribute(flowAlphas, 1));
      flowGeometry.setAttribute('aPhase', new THREE.BufferAttribute(flowPhases, 1));
      flowGeometry.setAttribute('aDepth', new THREE.BufferAttribute(flowDepths, 1));

      flowMaterial = new THREE.ShaderMaterial({
        vertexShader: `
          attribute float aSize;
          attribute float aAlpha;
          attribute float aPhase;
          attribute float aDepth;

          uniform float uTime;
          uniform vec2 uMouse;
          uniform float uScroll;
          uniform float uScrollVelocity;
          uniform float uTheme;
          uniform float uReducedMotion;

          varying float vAlpha;
          varying float vPhase;

          ${NOISE_GLSL}

          void main() {
            vec3 pos = position;
            
            // Fluid flow simulation in vertex shader using curl noise
            if (uReducedMotion < 0.5) {
              float flowTime = uTime * 0.05 + uScrollVelocity * 0.12;
              vec2 drift = curlNoise(pos.xy * 0.8, flowTime);
              pos.xy += drift * 0.15 * aDepth;
            }

            // Scroll parallax
            pos.y -= (uScroll * 0.0003 * aDepth);
            // Mouse parallax
            pos.x += uMouse.x * 0.03 * aDepth;
            pos.y += uMouse.y * 0.03 * aDepth;

            gl_Position = vec4(pos, 1.0);
            
            // Elongate stars slightly into streaks when scrolling fast
            float warpScale = 1.0 + uScrollVelocity * 4.0;
            gl_PointSize = aSize * warpScale * (1.2 - uTheme * 0.5);

            vAlpha = aAlpha;
            vPhase = aPhase;
          }
        `,
        fragmentShader: `
          uniform float uTime;
          uniform float uTheme;
          uniform float uScrollVelocity;
          uniform float uReducedMotion;

          varying float vAlpha;
          varying float vPhase;

          void main() {
            vec2 coord = gl_PointCoord - vec2(0.5);
            if (uReducedMotion < 0.5) {
              coord.x *= (1.0 + uScrollVelocity * 6.0); // Streak capsule
            }

            float dist = length(coord);
            if (dist > 0.5) discard;
            float mask = smoothstep(0.5, 0.1, dist);

            float shimmer = sin(uTime * 1.5 + vPhase * 6.0) * 0.3 + 0.7;
            vec3 color = mix(vec3(0.5, 0.75, 1.0), vec3(0.2, 0.3, 0.5), uTheme);

            gl_FragColor = vec4(color, vAlpha * mask * shimmer);
          }
        `,
        uniforms: {
          uTime: { value: 0 },
          uMouse: { value: new THREE.Vector2(0, 0) },
          uScroll: { value: 0.0 },
          uScrollVelocity: { value: 0.0 },
          uTheme: { value: currentTheme.current === 'light' ? 1.0 : 0.0 },
          uReducedMotion: { value: isReducedMotion ? 1.0 : 0.0 }
        },
        transparent: true,
        blending: THREE.AdditiveBlending,
        depthWrite: false,
        depthTest: false
      });

      flowSystem = new THREE.Points(flowGeometry, flowMaterial);
      scene.add(flowSystem);

      // 3. Layer 5: Foreground Fluid Particles (swirls on mouse proximity)
      const particleGeometry = new THREE.BufferGeometry();
      const positions = new Float32Array(particleCount * 3);
      const sizes = new Float32Array(particleCount);
      const alphas = new Float32Array(particleCount);
      const speeds = new Float32Array(particleCount);
      const phases = new Float32Array(particleCount);
      const depths = new Float32Array(particleCount); 
      const colorIndices = new Float32Array(particleCount);

      for (let i = 0; i < particleCount; i++) {
        positions[i * 3] = (Math.random() - 0.5) * 3.2;
        positions[i * 3 + 1] = (Math.random() - 0.5) * 3.2;
        positions[i * 3 + 2] = (Math.random() - 0.5) * 1.2 + 0.1; // Foreground Z depth

        sizes[i] = Math.random() * 3.0 + 1.5; 
        alphas[i] = Math.random() * 0.22 + 0.08; 
        speeds[i] = Math.random() * 0.35 + 0.12;
        phases[i] = Math.random() * Math.PI * 2;
        depths[i] = Math.random() * 0.6 + 0.4; // High parallax depth
        colorIndices[i] = Math.floor(Math.random() * 3);
      }

      particleGeometry.setAttribute('position', new THREE.BufferAttribute(positions, 3));
      particleGeometry.setAttribute('aSize', new THREE.BufferAttribute(sizes, 1));
      particleGeometry.setAttribute('aAlpha', new THREE.BufferAttribute(alphas, 1));
      particleGeometry.setAttribute('aSpeed', new THREE.BufferAttribute(speeds, 1));
      particleGeometry.setAttribute('aPhase', new THREE.BufferAttribute(phases, 1));
      particleGeometry.setAttribute('aDepth', new THREE.BufferAttribute(depths, 1));
      particleGeometry.setAttribute('aColorIdx', new THREE.BufferAttribute(colorIndices, 1));

      particleMaterial = new THREE.ShaderMaterial({
        vertexShader: `
          attribute float aSize;
          attribute float aAlpha;
          attribute float aSpeed;
          attribute float aPhase;
          attribute float aDepth;
          attribute float aColorIdx;

          uniform float uTime;
          uniform vec2 uMouse;
          uniform float uScroll;
          uniform float uScrollVelocity;
          uniform float uHoverActive;
          uniform float uTheme;
          uniform float uReducedMotion;

          varying float vAlpha;
          varying float vPhase;
          varying float vColorIdx;
          varying float vMouseGlow;

          ${NOISE_GLSL}

          void main() {
            vec3 pos = position;
            
            // 1. Fluid drift (Curl noise advection)
            if (uReducedMotion < 0.5) {
              float driftTime = uTime * aSpeed * 0.05 + uScrollVelocity * 0.08;
              vec2 drift = curlNoise(pos.xy * 0.6, driftTime);
              pos.xy += drift * 0.14 * aDepth;
            }

            // 2. Scroll Parallax
            pos.y -= (uScroll * 0.0006 * aDepth);
            // 3. Mouse Parallax
            pos.x += uMouse.x * 0.06 * aDepth;
            pos.y += uMouse.y * 0.06 * aDepth;

            // 4. Cursor fluid swirl vortex interaction (Swirls nearby particles)
            vec2 toMouse = pos.xy - uMouse;
            float distToMouse = length(toMouse);
            float influence = smoothstep(0.48, 0.0, distToMouse);
            
            if (influence > 0.0 && uReducedMotion < 0.5) {
              float swirlAngle = influence * 0.28 * aDepth;
              float c = cos(swirlAngle);
              float s = sin(swirlAngle);
              // Rotate around cursor
              pos.xy = uMouse + mat2(c, -s, s, c) * toMouse;
              
              // Mild advection pull
              pos.xy -= normalize(toMouse) * influence * 0.018 * aDepth;
            }

            gl_Position = vec4(pos, 1.0);
            
            float warpScale = 1.0 + uScrollVelocity * 3.5;
            gl_PointSize = aSize * warpScale * (1.0 + influence * 0.8) * (1.2 - uTheme * 0.4);
            
            vAlpha = aAlpha;
            vPhase = aPhase;
            vColorIdx = aColorIdx;
            vMouseGlow = influence * (1.2 + uHoverActive * 1.8);
          }
        `,
        fragmentShader: `
          uniform float uTime;
          uniform float uTheme;
          uniform float uScrollVelocity;
          uniform float uReducedMotion;
          
          varying float vAlpha;
          varying float vPhase;
          varying float vColorIdx;
          varying float vMouseGlow;

          void main() {
            vec2 coord = gl_PointCoord - vec2(0.5);
            if (uReducedMotion < 0.5) {
              coord.x *= (1.0 + uScrollVelocity * 5.0); // Streaks during scroll
            }

            float dist = length(coord);
            if (dist > 0.5) discard;
            float alphaMask = smoothstep(0.5, 0.1, dist);

            float shimmer = sin(uTime * 1.2 + vPhase * 4.0) * 0.4 + 0.6;
            float finalAlpha = vAlpha * alphaMask * shimmer;

            // Brighter trails near cursor
            finalAlpha *= (1.0 + vMouseGlow * 1.5);

            // Colorful plasma colors
            vec3 particleColor = vec3(1.0);
            if (uTheme > 0.5) {
              particleColor = mix(vec3(0.25, 0.1, 0.5), vec3(0.05, 0.35, 0.6), vColorIdx * 0.5);
            } else {
              if (vColorIdx < 0.5) {
                particleColor = vec3(0.01, 0.68, 0.95); // Electric Cyan
              } else if (vColorIdx < 1.5) {
                particleColor = vec3(0.98, 0.05, 0.55); // Plasma Magenta
              } else {
                particleColor = vec3(0.48, 0.15, 0.95); // Quantum Violet
              }
            }

            if (vMouseGlow > 0.1) {
              vec3 glowTint = mix(vec3(0.9, 0.7, 1.0), vec3(0.7, 0.95, 1.0), shimmer);
              particleColor = mix(particleColor, glowTint, vMouseGlow * 0.35);
            }

            gl_FragColor = vec4(particleColor, finalAlpha);
          }
        `,
        uniforms: {
          uTime: { value: 0 },
          uMouse: { value: new THREE.Vector2(0, 0) },
          uScroll: { value: 0.0 },
          uScrollVelocity: { value: 0.0 },
          uHoverActive: { value: 0.0 },
          uTheme: { value: currentTheme.current === 'light' ? 1.0 : 0.0 },
          uReducedMotion: { value: isReducedMotion ? 1.0 : 0.0 }
        },
        transparent: true,
        blending: THREE.AdditiveBlending,
        depthWrite: false,
        depthTest: false
      });

      particleSystem = new THREE.Points(particleGeometry, particleMaterial);
      scene.add(particleSystem);

      setIsLoaded(true);

      let lastTime = 0;
      let isVisible = true;

      const observer = new IntersectionObserver(([entry]) => {
        isVisible = entry.isIntersecting;
      }, { threshold: 0.01 });
      observer.observe(canvas);

      const render = (time) => {
        animationFrameId = requestAnimationFrame(render);
        
        if (!isVisible || document.hidden) return;

        const dt = Math.min((time - lastTime) * 0.001, 0.1);
        lastTime = time;

        const elapsedSeconds = time * 0.001;

        // Mouse Spring-Damping
        const mdx = rawMouse.x - springMouse.x;
        const mdy = rawMouse.y - springMouse.y;
        mouseVel.x += (mdx * 8.5 - mouseVel.x * 2.5) * dt;
        mouseVel.y += (mdy * 8.5 - mouseVel.y * 2.5) * dt;
        springMouse.x += mouseVel.x * dt;
        springMouse.y += mouseVel.y * dt;

        // Scroll Spring-Damping
        const sdx = rawScroll.y - springScroll.y;
        scrollVel.y += (sdx * 7.5 - scrollVel.y * 2.8) * dt;
        springScroll.y += scrollVel.y * dt;

        const currentScrollVelocity = Math.abs(scrollVel.y);
        const normalizedVelocity = Math.min(currentScrollVelocity * 0.0012, 1.8);

        // Hover multiplier spring math
        const targetHover = rawMouse.hoverActive || 0.0;
        const hdiff = targetHover - springHover.value;
        hoverVel.value += (hdiff * 14.0 - hoverVel.value * 4.0) * dt;
        springHover.value += hoverVel.value * dt;

        // Update Shader Uniforms
        if (fluidMaterial) {
          fluidMaterial.uniforms.uTime.value = elapsedSeconds;
          fluidMaterial.uniforms.uMouse.value.set(springMouse.x, springMouse.y);
          fluidMaterial.uniforms.uScroll.value = springScroll.y;
          fluidMaterial.uniforms.uScrollVelocity.value = normalizedVelocity;
          fluidMaterial.uniforms.uTheme.value += (currentTheme.current === 'light' ? 1.0 - fluidMaterial.uniforms.uTheme.value : 0.0 - fluidMaterial.uniforms.uTheme.value) * 0.08;
        }

        if (flowMaterial) {
          flowMaterial.uniforms.uTime.value = elapsedSeconds;
          flowMaterial.uniforms.uMouse.value.set(springMouse.x, springMouse.y);
          flowMaterial.uniforms.uScroll.value = springScroll.y;
          flowMaterial.uniforms.uScrollVelocity.value = normalizedVelocity;
          flowMaterial.uniforms.uTheme.value += (currentTheme.current === 'light' ? 1.0 - flowMaterial.uniforms.uTheme.value : 0.0 - flowMaterial.uniforms.uTheme.value) * 0.08;
        }

        if (particleMaterial) {
          particleMaterial.uniforms.uTime.value = elapsedSeconds;
          particleMaterial.uniforms.uMouse.value.set(springMouse.x, springMouse.y);
          particleMaterial.uniforms.uScroll.value = springScroll.y;
          particleMaterial.uniforms.uScrollVelocity.value = normalizedVelocity;
          particleMaterial.uniforms.uHoverActive.value = springHover.value;
          particleMaterial.uniforms.uTheme.value += (currentTheme.current === 'light' ? 1.0 - particleMaterial.uniforms.uTheme.value : 0.0 - particleMaterial.uniforms.uTheme.value) * 0.08;
        }

        renderer.render(scene, camera);
      };

      const handleResize = () => {
        if (!canvasRef.current) return;
        const w = window.innerWidth;
        const h = window.innerHeight;
        renderer.setSize(w, h, false);
        if (fluidMaterial) fluidMaterial.uniforms.uResolution.value.set(w, h);
      };

      resizeObserver = new ResizeObserver(() => handleResize());
      if (containerRef.current) resizeObserver.observe(containerRef.current);
      
      animationFrameId = requestAnimationFrame(render);

      return () => {
        window.removeEventListener('mousemove', handleMouseMove);
        window.removeEventListener('scroll', handleScroll);
        window.removeEventListener('mouseover', handleMouseOver);
        motionQuery.removeEventListener('change', handleMotionChange);
        
        if (resizeObserver) resizeObserver.disconnect();
        observer.unobserve(canvas);
        cancelAnimationFrame(animationFrameId);
        
        fluidGeometry.dispose();
        fluidMaterial.dispose();
        flowGeometry.dispose();
        flowMaterial.dispose();
        particleGeometry.dispose();
        particleMaterial.dispose();
        renderer.dispose();
      };
    });
  }, []);

  return (
    <div 
      ref={containerRef} 
      className="absolute inset-0 w-full h-full pointer-events-none z-0 overflow-hidden"
      style={{ mixBlendMode: 'normal' }}
    >
      <canvas
        ref={canvasRef}
        className="w-full h-full block pointer-events-none transition-opacity duration-[1500ms] ease-out"
        style={{ 
          opacity: isLoaded ? 1 : 0,
          mixBlendMode: 'normal' 
        }}
      />
    </div>
  );
}
