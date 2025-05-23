import { useCallback, useRef } from "react";
import * as THREE from "three";

export const useThreeJS = (canvasRef, artPieces) => {
  const sceneRef = useRef(null);
  const rendererRef = useRef(null);
  const cameraRef = useRef(null);
  const controlsRef = useRef(null);
  const animationRef = useRef(null);

  const createOrbitControls = (camera, renderer) => {
    let isMouseDown = false;
    let mouseX = 0;
    let mouseY = 0;
    let distance = 15;
    let phi = Math.PI / 2;
    let theta = 0;

    const spherical = new THREE.Spherical();
    const target = new THREE.Vector3(0, 0, 0);

    const onMouseDown = (event) => {
      isMouseDown = true;
      mouseX = event.clientX;
      mouseY = event.clientY;
    };

    const onMouseUp = () => {
      isMouseDown = false;
    };

    const onMouseMove = (event) => {
      if (!isMouseDown) return;

      const deltaX = event.clientX - mouseX;
      const deltaY = event.clientY - mouseY;

      theta -= deltaX * 0.01;
      phi += deltaY * 0.01;

      phi = Math.max(0.1, Math.min(Math.PI - 0.1, phi));

      mouseX = event.clientX;
      mouseY = event.clientY;
    };

    const onWheel = (event) => {
      distance += event.deltaY * 0.01;
      distance = Math.max(5, Math.min(30, distance));
    };

    const update = () => {
      spherical.set(distance, phi, theta);
      const position = new THREE.Vector3().setFromSpherical(spherical);
      position.add(target);
      camera.position.copy(position);
      camera.lookAt(target);
    };

    renderer.domElement.addEventListener("mousedown", onMouseDown);
    renderer.domElement.addEventListener("mouseup", onMouseUp);
    renderer.domElement.addEventListener("mousemove", onMouseMove);
    renderer.domElement.addEventListener("wheel", onWheel);

    return {
      update,
      dispose: () => {
        renderer.domElement.removeEventListener("mousedown", onMouseDown);
        renderer.domElement.removeEventListener("mouseup", onMouseUp);
        renderer.domElement.removeEventListener("mousemove", onMouseMove);
        renderer.domElement.removeEventListener("wheel", onWheel);
      },
    };
  };

  // Helper function to load image texture
  const loadImageTexture = (imageUrl) => {
    return new Promise((resolve, reject) => {
      if (!imageUrl) {
        reject(new Error("No image URL provided"));
        return;
      }

      const textureLoader = new THREE.TextureLoader();
      textureLoader.crossOrigin = "anonymous";

      textureLoader.load(
        imageUrl,
        (texture) => {
          texture.generateMipmaps = false;
          texture.minFilter = THREE.LinearFilter;
          texture.magFilter = THREE.LinearFilter;
          texture.wrapS = THREE.ClampToEdgeWrapping;
          texture.wrapT = THREE.ClampToEdgeWrapping;

          console.log(`✅ Successfully loaded texture from: ${imageUrl}`);
          resolve(texture);
        },
        (progress) => {
          console.log(
            `Loading texture: ${(progress.loaded / progress.total) * 100}%`
          );
        },
        (error) => {
          console.error(`❌ Failed to load texture from: ${imageUrl}`, error);
          reject(error);
        }
      );
    });
  };

  // Create fallback texture when image fails to load
  const createFallbackTexture = (color, title) => {
    const canvas = document.createElement("canvas");
    canvas.width = 512;
    canvas.height = 384;
    const ctx = canvas.getContext("2d");

    const gradient = ctx.createRadialGradient(256, 192, 0, 256, 192, 256);
    gradient.addColorStop(0, color);
    gradient.addColorStop(1, "#000000");
    ctx.fillStyle = gradient;
    ctx.fillRect(0, 0, 512, 384);

    for (let i = 0; i < 8; i++) {
      ctx.fillStyle = `rgba(255, 255, 255, ${Math.random() * 0.3})`;
      ctx.fillRect(
        Math.random() * 400,
        Math.random() * 300,
        Math.random() * 100 + 20,
        Math.random() * 100 + 20
      );
    }

    ctx.fillStyle = "rgba(255, 255, 255, 0.8)";
    ctx.font = "bold 24px Arial";
    ctx.textAlign = "center";
    ctx.fillText(title || "Artwork", 256, 200);

    return new THREE.CanvasTexture(canvas);
  };

  // Create Three.js built-in star field
  const createStarField = () => {
    const starsGeometry = new THREE.BufferGeometry();
    const starCount = 10000;

    const positions = new Float32Array(starCount * 3);
    const colors = new Float32Array(starCount * 3);

    for (let i = 0; i < starCount; i++) {
      // Random positions in a large sphere
      positions[i * 3] = (Math.random() - 0.5) * 2000;
      positions[i * 3 + 1] = (Math.random() - 0.5) * 2000;
      positions[i * 3 + 2] = (Math.random() - 0.5) * 2000;

      // Random colors with slight blue/white tint
      const color = new THREE.Color();
      color.setHSL(0.6 + Math.random() * 0.1, 0.2, 0.5 + Math.random() * 0.5);
      colors[i * 3] = color.r;
      colors[i * 3 + 1] = color.g;
      colors[i * 3 + 2] = color.b;
    }

    starsGeometry.setAttribute(
      "position",
      new THREE.BufferAttribute(positions, 3)
    );
    starsGeometry.setAttribute("color", new THREE.BufferAttribute(colors, 3));

    const starsMaterial = new THREE.PointsMaterial({
      size: 2,
      vertexColors: true,
      transparent: true,
      opacity: 0.8,
    });

    return new THREE.Points(starsGeometry, starsMaterial);
  };

  const init3DGallery = useCallback(() => {
    const initializeGallery = async () => {
      if (!canvasRef.current) return;

      console.log(
        `🎨 Initializing 3D Gallery with ${artPieces.length} art pieces`
      );

      const scene = new THREE.Scene();

      // Create Three.js built-in star field background
      const starField = createStarField();
      scene.add(starField);

      // Set scene background to deep space color
      scene.background = new THREE.Color(0x0a0a1a);

      const camera = new THREE.PerspectiveCamera(
        75,
        window.innerWidth / window.innerHeight,
        0.1,
        1000
      );
      const renderer = new THREE.WebGLRenderer({
        canvas: canvasRef.current,
        antialias: true,
        alpha: true,
      });
      renderer.setSize(window.innerWidth, window.innerHeight);
      renderer.shadowMap.enabled = true;
      renderer.shadowMap.type = THREE.PCFSoftShadowMap;
      renderer.toneMapping = THREE.ACESFilmicToneMapping;
      renderer.toneMappingExposure = 1.2;

      const createWallTexture = (color1, color2) => {
        const canvas = document.createElement("canvas");
        canvas.width = 512;
        canvas.height = 512;
        const ctx = canvas.getContext("2d");

        ctx.fillStyle = color1;
        ctx.fillRect(0, 0, 512, 512);

        ctx.fillStyle = color2;
        for (let i = 0; i < 512; i += 64) {
          for (let j = 0; j < 512; j += 64) {
            if ((i + j) % 128 === 0) {
              ctx.fillRect(i, j, 32, 32);
            }
          }
        }

        const imageData = ctx.getImageData(0, 0, 512, 512);
        const data = imageData.data;
        for (let i = 0; i < data.length; i += 4) {
          const noise = (Math.random() - 0.5) * 15;
          data[i] += noise;
          data[i + 1] += noise;
          data[i + 2] += noise;
        }
        ctx.putImageData(imageData, 0, 0);

        return new THREE.CanvasTexture(canvas);
      };

      // Lighter walls for better contrast with dark space
      const wallTexture = createWallTexture("#4a4a4a", "#555555");
      wallTexture.wrapS = THREE.RepeatWrapping;
      wallTexture.wrapT = THREE.RepeatWrapping;
      wallTexture.repeat.set(2, 1);

      const wallGeometry = new THREE.PlaneGeometry(50, 20);
      const wallMaterial = new THREE.MeshLambertMaterial({
        map: wallTexture,
        color: 0xffffff,
      });

      const backWall = new THREE.Mesh(wallGeometry, wallMaterial);
      backWall.position.z = -15;
      backWall.receiveShadow = true;
      scene.add(backWall);

      const leftWall = new THREE.Mesh(wallGeometry, wallMaterial);
      leftWall.rotation.y = Math.PI / 2;
      leftWall.position.x = -25;
      leftWall.receiveShadow = true;
      scene.add(leftWall);

      const rightWall = new THREE.Mesh(wallGeometry, wallMaterial);
      rightWall.rotation.y = -Math.PI / 2;
      rightWall.position.x = 25;
      rightWall.receiveShadow = true;
      scene.add(rightWall);

      const createFloorTexture = () => {
        const canvas = document.createElement("canvas");
        canvas.width = 512;
        canvas.height = 512;
        const ctx = canvas.getContext("2d");

        ctx.fillStyle = "#2a2a2a";
        ctx.fillRect(0, 0, 512, 512);

        ctx.strokeStyle = "#3a3a3a";
        ctx.lineWidth = 1;
        for (let i = 0; i < 30; i++) {
          ctx.beginPath();
          ctx.moveTo(Math.random() * 512, Math.random() * 512);
          ctx.bezierCurveTo(
            Math.random() * 512,
            Math.random() * 512,
            Math.random() * 512,
            Math.random() * 512,
            Math.random() * 512,
            Math.random() * 512
          );
          ctx.stroke();
        }

        for (let i = 0; i < 50; i++) {
          ctx.fillStyle = `rgba(255, 255, 255, ${Math.random() * 0.05})`;
          ctx.beginPath();
          ctx.arc(
            Math.random() * 512,
            Math.random() * 512,
            Math.random() * 3 + 1,
            0,
            Math.PI * 2
          );
          ctx.fill();
        }

        return new THREE.CanvasTexture(canvas);
      };

      const floorTexture = createFloorTexture();
      floorTexture.wrapS = THREE.RepeatWrapping;
      floorTexture.wrapT = THREE.RepeatWrapping;
      floorTexture.repeat.set(4, 4);

      const floorGeometry = new THREE.PlaneGeometry(60, 40);
      const floorMaterial = new THREE.MeshLambertMaterial({
        map: floorTexture,
        color: 0xffffff,
      });
      const floor = new THREE.Mesh(floorGeometry, floorMaterial);
      floor.rotation.x = -Math.PI / 2;
      floor.position.y = -10;
      floor.receiveShadow = true;
      scene.add(floor);

      // Enhanced lighting setup for better NFT visibility
      const ambientLight = new THREE.AmbientLight(0x404080, 0.3);
      scene.add(ambientLight);

      // Main directional light
      const mainLight = new THREE.DirectionalLight(0xffffff, 0.6);
      mainLight.position.set(15, 20, 10);
      mainLight.castShadow = true;
      mainLight.shadow.mapSize.width = 2048;
      mainLight.shadow.mapSize.height = 2048;
      mainLight.shadow.camera.near = 0.5;
      mainLight.shadow.camera.far = 50;
      mainLight.shadow.camera.left = -30;
      mainLight.shadow.camera.right = 30;
      mainLight.shadow.camera.top = 30;
      mainLight.shadow.camera.bottom = -30;
      scene.add(mainLight);

      // Fill light from opposite side
      const fillLight = new THREE.DirectionalLight(0xffffff, 0.3);
      fillLight.position.set(-10, 10, 5);
      scene.add(fillLight);

      // Position art pieces on walls with better spacing
      const wallPositions = [];
      const artPiecesToDisplay = artPieces.slice(0, 12);

      // Back wall positions (4 pieces)
      for (let i = 0; i < 4 && i < artPiecesToDisplay.length; i++) {
        wallPositions.push({
          x: (i - 1.5) * 8,
          y: 0,
          z: -14.5,
          wall: "back",
        });
      }

      // Left wall positions (4 pieces)
      for (let i = 0; i < 4 && i + 4 < artPiecesToDisplay.length; i++) {
        wallPositions.push({
          x: -24.5,
          y: 0,
          z: (i - 1.5) * 6,
          wall: "left",
          rotation: Math.PI / 2,
        });
      }

      // Right wall positions (4 pieces)
      for (let i = 0; i < 4 && i + 8 < artPiecesToDisplay.length; i++) {
        wallPositions.push({
          x: 24.5,
          y: 0,
          z: (i - 1.5) * 6,
          wall: "right",
          rotation: -Math.PI / 2,
        });
      }

      // Enhanced spotlight system for each artwork
      artPiecesToDisplay.forEach((art, index) => {
        if (index < wallPositions.length) {
          const position = wallPositions[index];

          // Primary spotlight for each artwork
          const spotLight = new THREE.SpotLight(0xffffff, 2.0);
          spotLight.position.set(
            position.x +
              (position.wall === "left"
                ? 8
                : position.wall === "right"
                ? -8
                : 0),
            8,
            position.z + (position.wall === "back" ? 8 : 0)
          );
          spotLight.target.position.set(position.x, position.y, position.z);
          spotLight.angle = Math.PI / 5;
          spotLight.penumbra = 0.2;
          spotLight.decay = 1;
          spotLight.distance = 25;
          spotLight.castShadow = true;
          spotLight.shadow.mapSize.width = 1024;
          spotLight.shadow.mapSize.height = 1024;
          scene.add(spotLight);
          scene.add(spotLight.target);

          // Secondary fill light for each artwork
          const fillSpot = new THREE.SpotLight(0xffffff, 0.8);
          fillSpot.position.set(
            position.x +
              (position.wall === "left"
                ? 4
                : position.wall === "right"
                ? -4
                : Math.random() > 0.5
                ? 3
                : -3),
            5,
            position.z +
              (position.wall === "back" ? 4 : Math.random() > 0.5 ? 2 : -2)
          );
          fillSpot.target.position.set(position.x, position.y, position.z);
          fillSpot.angle = Math.PI / 4;
          fillSpot.penumbra = 0.5;
          fillSpot.decay = 2;
          fillSpot.distance = 15;
          scene.add(fillSpot);
          scene.add(fillSpot.target);
        }
      });

      // Create art pieces with IPFS images
      console.log("🖼️ Loading art pieces with IPFS images...");

      const artPromises = artPiecesToDisplay.map(async (art, index) => {
        if (index >= wallPositions.length) return;

        const position = wallPositions[index];

        try {
          // Create frame with enhanced wood texture
          const createWoodTexture = () => {
            const canvas = document.createElement("canvas");
            canvas.width = 256;
            canvas.height = 256;
            const ctx = canvas.getContext("2d");

            ctx.fillStyle = "#6b4423";
            ctx.fillRect(0, 0, 256, 256);

            for (let i = 0; i < 256; i += 3) {
              ctx.fillStyle = `rgba(92, 51, 23, ${Math.random() * 0.4})`;
              ctx.fillRect(0, i, 256, 1);
            }

            for (let i = 0; i < 20; i++) {
              ctx.fillStyle = `rgba(139, 101, 82, ${Math.random() * 0.3})`;
              ctx.fillRect(
                Math.random() * 256,
                Math.random() * 256,
                Math.random() * 40 + 10,
                2
              );
            }

            return new THREE.CanvasTexture(canvas);
          };

          const woodTexture = createWoodTexture();
          const frameGeometry = new THREE.BoxGeometry(3.4, 2.6, 0.2);
          const frameMaterial = new THREE.MeshLambertMaterial({
            map: woodTexture,
            color: 0xffffff,
          });
          const frame = new THREE.Mesh(frameGeometry, frameMaterial);
          frame.position.set(position.x, position.y, position.z);
          if (position.rotation) {
            frame.rotation.y = position.rotation;
          }
          frame.castShadow = true;
          scene.add(frame);

          // Try to load IPFS image, fallback to generated texture
          let artTexture;
          try {
            if (art.imageUrl) {
              console.log(
                `🔄 Loading image for "${art.title}": ${art.imageUrl}`
              );
              artTexture = await loadImageTexture(art.imageUrl);
              console.log(`✅ Successfully loaded image for "${art.title}"`);
            } else {
              throw new Error("No image URL available");
            }
          } catch (error) {
            console.log(
              `⚠️ Failed to load image for "${art.title}", using fallback`
            );
            artTexture = createFallbackTexture(
              art.color || "#ff6b6b",
              art.title
            );
          }

          // Create canvas with the loaded/fallback texture
          const canvasGeometry = new THREE.PlaneGeometry(3.2, 2.4);
          const canvasMaterial = new THREE.MeshLambertMaterial({
            map: artTexture,
            color: 0xffffff,
          });
          const artCanvas = new THREE.Mesh(canvasGeometry, canvasMaterial);

          // Position slightly in front of the frame
          const offset =
            position.wall === "back"
              ? 0.2
              : position.wall === "left"
              ? -0.2
              : 0.2;
          artCanvas.position.set(
            position.wall === "left"
              ? position.x + offset
              : position.wall === "right"
              ? position.x - offset
              : position.x,
            position.y,
            position.wall === "back" ? position.z + offset : position.z
          );

          if (position.rotation) {
            artCanvas.rotation.y = position.rotation;
          }
          scene.add(artCanvas);

          // Create label with improved styling
          const createLabelTexture = (title, tokenId) => {
            const canvas = document.createElement("canvas");
            canvas.width = 512;
            canvas.height = 128;
            const ctx = canvas.getContext("2d");

            ctx.fillStyle = "#2a2a2a";
            ctx.fillRect(0, 0, 512, 128);

            ctx.strokeStyle = "#555555";
            ctx.lineWidth = 2;
            ctx.strokeRect(1, 1, 510, 126);

            ctx.fillStyle = "#ffffff";
            ctx.font = "bold 28px Arial";
            ctx.textAlign = "center";

            const displayTitle =
              title.length > 20 ? title.substring(0, 17) + "..." : title;
            ctx.fillText(displayTitle, 256, 45);

            ctx.font = "18px Arial";
            ctx.fillStyle = "#cccccc";
            ctx.fillText(`Token #${tokenId}`, 256, 75);

            if (art.imageUrl) {
              ctx.fillStyle = "#10b981";
              ctx.font = "12px Arial";
              ctx.fillText("🌐 IPFS", 256, 95);
            }

            return new THREE.CanvasTexture(canvas);
          };

          const labelTexture = createLabelTexture(art.title, art.tokenId);
          const labelGeometry = new THREE.PlaneGeometry(2.5, 0.6);
          const labelMaterial = new THREE.MeshLambertMaterial({
            map: labelTexture,
            color: 0xffffff,
          });
          const label = new THREE.Mesh(labelGeometry, labelMaterial);

          label.position.set(
            position.wall === "left"
              ? position.x + offset * 0.9
              : position.wall === "right"
              ? position.x - offset * 0.9
              : position.x,
            position.y - 2,
            position.wall === "back" ? position.z + offset * 0.9 : position.z
          );

          if (position.rotation) {
            label.rotation.y = position.rotation;
          }
          scene.add(label);
        } catch (error) {
          console.error(`❌ Error creating art piece "${art.title}":`, error);
        }
      });

      // Wait for all art pieces to load
      await Promise.allSettled(artPromises);
      console.log("🎨 Finished loading all art pieces");

      camera.position.set(0, 2, 15);
      camera.lookAt(0, 0, 0);

      const controls = createOrbitControls(camera, renderer);

      const animate = () => {
        animationRef.current = requestAnimationFrame(animate);
        controls.update();
        renderer.render(scene, camera);
      };

      animate();

      sceneRef.current = scene;
      rendererRef.current = renderer;
      cameraRef.current = camera;
      controlsRef.current = controls;

      const handleResize = () => {
        camera.aspect = window.innerWidth / window.innerHeight;
        camera.updateProjectionMatrix();
        renderer.setSize(window.innerWidth, window.innerHeight);
      };

      window.addEventListener("resize", handleResize);
    };

    initializeGallery();
  }, [canvasRef, artPieces]);

  return { init3DGallery };
};
