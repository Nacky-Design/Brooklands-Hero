import React, { useEffect, useMemo, useRef } from 'react';
import { useFrame, useThree } from '@react-three/fiber';
import * as THREE from 'three';
import { HorizontalBlurShader } from 'three/addons/shaders/HorizontalBlurShader.js';
import { VerticalBlurShader } from 'three/addons/shaders/VerticalBlurShader.js';

// A local, height-weighted contact projection. Only the car is on layer 1.
// It updates after car movement, never runs its own animation loop.
export function ContactShadow({ carRoot }) {
  const { gl, scene } = useThree();
  const previous = useRef({ root: null, angle: null });
  const resources = useMemo(() => {
    const resolution = 512;
    const target = () => new THREE.WebGLRenderTarget(resolution, resolution, { depthBuffer: false });
    const depth = target();
    depth.depthBuffer = true;
    const temporary = target();
    const blurred = target();
    const camera = new THREE.OrthographicCamera(-4, 4, 4, -4, .001, 2.2);
    camera.position.set(0, -.004, 0);
    camera.up.set(0, 0, 1);
    camera.lookAt(0, 1, 0);
    camera.layers.set(1);
    const depthMaterial = new THREE.MeshDepthMaterial({
      depthPacking: THREE.BasicDepthPacking, side: THREE.DoubleSide, blending: THREE.NoBlending,
    });
    depthMaterial.onBeforeCompile = shader => {
      shader.fragmentShader = shader.fragmentShader.replace(
        'gl_FragColor = vec4( vec3( 1.0 - fragCoordZ ), opacity );',
        'gl_FragColor = vec4( vec3( 0.0 ), pow( clamp( 1.0 - fragCoordZ, 0.0, 1.0 ), 3.0 ) );',
      );
    };
    const horizontal = new THREE.ShaderMaterial({
      ...HorizontalBlurShader, uniforms: THREE.UniformsUtils.clone(HorizontalBlurShader.uniforms),
      depthTest: false, depthWrite: false, blending: THREE.NoBlending,
    });
    const vertical = new THREE.ShaderMaterial({
      ...VerticalBlurShader, uniforms: THREE.UniformsUtils.clone(VerticalBlurShader.uniforms),
      depthTest: false, depthWrite: false, blending: THREE.NoBlending,
    });
    horizontal.uniforms.h.value = 6 / resolution;
    vertical.uniforms.v.value = 6 / resolution;
    const blurScene = new THREE.Scene();
    const geometry = new THREE.PlaneGeometry(2, 2);
    const quad = new THREE.Mesh(geometry, horizontal);
    blurScene.add(quad);
    const blurCamera = new THREE.OrthographicCamera(-1, 1, 1, -1, 0, 2);
    blurCamera.position.z = 1;
    const material = new THREE.ShaderMaterial({
      transparent: true, depthWrite: false, side: THREE.DoubleSide,
      uniforms: { contactMap: { value: depth.texture }, softMap: { value: blurred.texture } },
      vertexShader: 'varying vec2 vUv; void main(){vUv=uv;gl_Position=projectionMatrix*modelViewMatrix*vec4(position,1.0);}',
      fragmentShader: 'uniform sampler2D contactMap; uniform sampler2D softMap; varying vec2 vUv; void main(){float contact=texture2D(contactMap,vUv).a;float soft=texture2D(softMap,vUv).a;gl_FragColor=vec4(vec3(0.0),min(.88,pow(contact,8.0)*.7+soft*.3));}',
    });
    return { depth, temporary, blurred, camera, depthMaterial, horizontal, vertical, blurScene, quad, geometry, blurCamera, material };
  }, []);
  useEffect(() => () => {
    for (const key of ['depth', 'temporary', 'blurred', 'depthMaterial', 'horizontal', 'vertical', 'geometry', 'material']) resources[key].dispose();
  }, [resources]);
  useFrame(() => {
    const root = carRoot.current;
    if (!root || (previous.current.root === root && previous.current.angle === root.rotation.y)) return;
    const r = resources;
    const saved = {
      target: gl.getRenderTarget(), background: scene.background, override: scene.overrideMaterial,
      color: gl.getClearColor(new THREE.Color()), alpha: gl.getClearAlpha(), shadowAuto: gl.shadowMap.autoUpdate,
    };
    try {
      scene.background = null;
      scene.overrideMaterial = r.depthMaterial;
      gl.shadowMap.autoUpdate = false;
      gl.setClearColor(0x000000, 0);
      gl.setRenderTarget(r.depth);
      gl.clear();
      gl.render(scene, r.camera);
      scene.overrideMaterial = saved.override;
      r.quad.material = r.horizontal;
      r.horizontal.uniforms.tDiffuse.value = r.depth.texture;
      gl.setRenderTarget(r.temporary);
      gl.clear();
      gl.render(r.blurScene, r.blurCamera);
      r.quad.material = r.vertical;
      r.vertical.uniforms.tDiffuse.value = r.temporary.texture;
      gl.setRenderTarget(r.blurred);
      gl.clear();
      gl.render(r.blurScene, r.blurCamera);
      previous.current = { root, angle: root.rotation.y };
      if (import.meta.env.DEV) {
        const stage = document.querySelector('.stage');
        if (stage) stage.dataset.shadowUpdates = String(Number(stage.dataset.shadowUpdates || 0) + 1);
      }
    } finally {
      scene.background = saved.background;
      scene.overrideMaterial = saved.override;
      gl.shadowMap.autoUpdate = saved.shadowAuto;
      gl.setClearColor(saved.color, saved.alpha);
      gl.setRenderTarget(saved.target);
    }
  }, -1);
  // This orientation maps the below-floor camera's +Z image up-axis onto world Z.
  return <mesh rotation={[Math.PI / 2, 0, 0]} position={[0, -.004, 0]} material={resources.material}>
    <planeGeometry args={[8, 8]} />
  </mesh>;
}
