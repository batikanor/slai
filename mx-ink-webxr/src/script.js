import * as THREE from "three";
import { TubePainter } from "three/examples/jsm/misc/TubePainter.js";
import { XRButton } from "three/examples/jsm/webxr/XRButton.js";
import { XRControllerModelFactory } from "three/examples/jsm/webxr/XRControllerModelFactory.js";
import { GLTFLoader } from "three/examples/jsm/loaders/GLTFLoader.js";
import { DRACOLoader } from "three/examples/jsm/loaders/DRACOLoader.js";

let camera, scene, renderer;
let controller1, controller2;
let controllerGrip1, controllerGrip2;
let stylus;
let painter1;
let gamepad1;
let isDrawing = false;
let prevIsDrawing = false;

let ws;
const WS_PORT = 8443; 
const WS_ADDRESS = '192.168.26.162'; 



const material = new THREE.MeshNormalMaterial({
    flatShading: true,
    side: THREE.DoubleSide,
});

const cursor = new THREE.Vector3();

const sizes = {
    width: window.innerWidth,
    height: window.innerHeight,
};

init();

function init() {
    const canvas = document.querySelector("canvas.webgl");
    scene = new THREE.Scene();
    scene.background = new THREE.Color(0x222222);
    camera = new THREE.PerspectiveCamera(50, window.innerWidth / window.innerHeight, 0.01, 50);
    camera.position.set(0, 1.6, 3);

    const dracoLoader = new DRACOLoader();
    dracoLoader.setDecoderPath("/draco/");

    const gltfLoader = new GLTFLoader();
    gltfLoader.setDRACOLoader(dracoLoader);

    const grid = new THREE.GridHelper(4, 1, 0x111111, 0x111111);
    scene.add(grid);

    scene.add(new THREE.HemisphereLight(0x888877, 0x777788, 3));

    const light = new THREE.DirectionalLight(0xffffff, 1.5);
    light.position.set(0, 4, 0);
    scene.add(light);

    painter1 = new TubePainter();
    painter1.mesh.material = material;
    painter1.setSize(0.1);

    scene.add(painter1.mesh);

    renderer = new THREE.WebGLRenderer({ antialias: true, canvas });
    renderer.setPixelRatio(window.devicePixelRatio, 2);
    renderer.setSize(sizes.width, sizes.height);
    renderer.setAnimationLoop(animate);
    renderer.xr.enabled = true;
    document.body.appendChild(XRButton.createButton(renderer, { optionalFeatures: ["unbounded"] }));

    const controllerModelFactory = new XRControllerModelFactory();

    controller1 = renderer.xr.getController(0);
    controller1.addEventListener("connected", onControllerConnected);
    controller1.addEventListener("selectstart", onSelectStart);
    controller1.addEventListener("selectend", onSelectEnd);
    controllerGrip1 = renderer.xr.getControllerGrip(0);
    controllerGrip1.add(controllerModelFactory.createControllerModel(controllerGrip1));
    scene.add(controllerGrip1);
    scene.add(controller1);

    controller2 = renderer.xr.getController(1);
    controller2.addEventListener("connected", onControllerConnected);
    controller2.addEventListener("selectstart", onSelectStart);
    controller2.addEventListener("selectend", onSelectEnd);
    controllerGrip2 = renderer.xr.getControllerGrip(1);
    controllerGrip2.add(controllerModelFactory.createControllerModel(controllerGrip2));
    scene.add(controllerGrip2);
    scene.add(controller2);

    
    initWebSocket();
    
}

window.addEventListener("resize", () => {
    sizes.width = window.innerWidth;
    sizes.height = window.innerHeight;

    camera.aspect = sizes.width / sizes.height;
    camera.updateProjectionMatrix();

    renderer.setSize(sizes.width, sizes.height);
    renderer.setPixelRatio(Math.min(window.devicePixelRatio, 2));
});

function initWebSocket() {
    console.log(`Attempting to connect to: wss://${WS_ADDRESS}:${WS_PORT}`);
    
    ws = new WebSocket(`wss://${WS_ADDRESS}:${WS_PORT}`);

    ws.onopen = () => {
        console.log('✅ WebSocket connection established successfully!');
        console.log('Connection state:', ws.readyState);
        ws.send(JSON.stringify({ type: 'status', message: 'VR app connected' }));
    };

    ws.onmessage = (event) => {
        console.log('📨 Message from server:', event.data);
        try {
            const data = JSON.parse(event.data);
            console.log('Parsed server message:', data);
        } catch (e) {
            console.log('Failed to parse server message:', e);
        }
    };

    ws.onerror = (error) => {
        console.error('❌ WebSocket Error:', error);
        console.log('Connection state during error:', ws.readyState);
        console.log('Error event details:', {
            type: error.type,
            target: error.target,
            currentTarget: error.currentTarget
        });
    };

    ws.onclose = (event) => {
        console.log('🔌 WebSocket connection closed');
        console.log('Close code:', event.code);
        console.log('Close reason:', event.reason);
        console.log('Was clean:', event.wasClean);
        
        // Common close codes:
        // 1000: Normal closure
        // 1001: Going away
        // 1006: Abnormal closure (no close frame)
        
        setTimeout(() => {
            console.log('🔄 Attempting to reconnect...');
            initWebSocket();
        }, 3000);
    };
}

function animate() {
    if (gamepad1) {
      const xPos = stylus.position.x;
      prevIsDrawing = isDrawing;
      isDrawing = gamepad1.buttons[5].value > 0;
      // debugGamepad(gamepad1);

      if (isDrawing && !prevIsDrawing) {
          const painter = stylus.userData.painter;
          painter.moveTo(stylus.position);
      }
    }

    handleDrawing(stylus);

    // Render
    renderer.render(scene, camera);
}

function handleDrawing(controller) {
    if (!controller) return;

    const userData = controller.userData;
    const painter = userData.painter;

    if (gamepad1) {
        const xPos = stylus.position.x;

        // --- Send stylus position via WebSocket ---
        if (ws && ws.readyState === WebSocket.OPEN) {
            // Send position as a JSON object
            const dataToSend = {
                type: 'stylus_position',
                x: xPos,
                y: stylus.position.y,
                z: stylus.position.z,
                timestamp: Date.now()
            };
            ws.send(JSON.stringify(dataToSend));
        }
        // ------------------------------------------

        cursor.set(stylus.position.x, stylus.position.y, stylus.position.z);

        if (userData.isSelecting || isDrawing) {
            painter.lineTo(cursor);
            painter.update();
        }
    }
}

function onSelectStart(e) {
    if (e.target !== stylus) return;
    const painter = stylus.userData.painter;
    painter.moveTo(stylus.position);
    this.userData.isSelecting = true;
}

function onSelectEnd() {
    this.userData.isSelecting = false;
}

function debugGamepad(gamepad) {
    gamepad.buttons.forEach((btn, index) => {
        if (btn.pressed) {
            console.log(`BTN ${index} - Pressed: ${btn.pressed} - Touched: ${btn.touched} - Value: ${btn.value}`);
        }

        if (btn.touched) {
            console.log(`BTN ${index} - Pressed: ${btn.pressed} - Touched: ${btn.touched} - Value: ${btn.value}`);
        }
    });
}

function onControllerConnected(e) {
  console.log('Controller connected:', e.data.profiles);
  if (e.data.profiles.includes("logitech-mx-ink")) {
      console.log('Logitech MX Ink stylus detected!');
      stylus = e.target;
      stylus.userData.painter = painter1;
      gamepad1 = e.data.gamepad;
  }
}

function testNetworkConnectivity() {
    console.log('🔍 Testing network connectivity...');
    
    // Test if we can reach the server via HTTP first
    fetch(`https://${WS_ADDRESS}:${WS_PORT}`)
        .then(response => {
            console.log('✅ HTTP connection test successful');
            console.log('Response status:', response.status);
        })
        .catch(error => {
            console.log('❌ HTTP connection test failed:', error);
        });
}

// Call this before trying WebSocket
testNetworkConnectivity();

// Add this to see what the VR headset thinks about networking
console.log('🌐 Current location:', window.location);
console.log('🌐 User agent:', navigator.userAgent);
console.log('🌐 Online status:', navigator.onLine);