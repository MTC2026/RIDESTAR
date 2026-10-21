import * as THREE from "three";

// ========================================
// 1. CREATE THE GAME WORLD
// ========================================

const scene = new THREE.Scene();

scene.background = new THREE.Color(0x87ceeb);

scene.fog = new THREE.Fog(0x87ceeb, 100, 450);

const camera = new THREE.PerspectiveCamera(
    70,
    window.innerWidth / window.innerHeight,
    0.1,
    1000
);

const renderer = new THREE.WebGLRenderer({
    antialias: true
});

renderer.setSize(window.innerWidth, window.innerHeight);
renderer.setPixelRatio(Math.min(window.devicePixelRatio, 2));

renderer.shadowMap.enabled = true;
renderer.shadowMap.type = THREE.PCFSoftShadowMap;

renderer.outputColorSpace = THREE.SRGBColorSpace;

document.getElementById("game-container").appendChild(
    renderer.domElement
);

// ========================================
// 2. LIGHTING
// ========================================

const ambientLight = new THREE.HemisphereLight(
    0xffffff,
    0x59634b,
    2
);

scene.add(ambientLight);

const sunlight = new THREE.DirectionalLight(
    0xffffff,
    3
);

sunlight.position.set(80, 120, 50);
sunlight.castShadow = true;

sunlight.shadow.mapSize.set(2048, 2048);

sunlight.shadow.camera.left = -150;
sunlight.shadow.camera.right = 150;
sunlight.shadow.camera.top = 150;
sunlight.shadow.camera.bottom = -150;

scene.add(sunlight);

// ========================================
// 3. MATERIALS
// ========================================

const grassMaterial = new THREE.MeshStandardMaterial({
    color: 0x647d52
});

const roadMaterial = new THREE.MeshStandardMaterial({
    color: 0x30343a,
    roughness: 1
});

const pavementMaterial = new THREE.MeshStandardMaterial({
    color: 0x999999
});

const buildingColors = [
    0x999da5,
    0xb5a18a,
    0x8d969d,
    0xb5b9c1,
    0x777e89,
    0xc1b5a0
];

// ========================================
// 4. GROUND
// ========================================

const ground = new THREE.Mesh(
    new THREE.PlaneGeometry(1000, 1000),
    grassMaterial
);

ground.rotation.x = -Math.PI / 2;
ground.position.y = -0.1;
ground.receiveShadow = true;

scene.add(ground);

// ========================================
// 5. CREATE ROADS
// ========================================

const roadWidth = 14;
const blockSize = 40;
const cityRange = 5;

const roads = [];
const buildings = [];

function createRoad(x, z, width, depth) {

    const road = new THREE.Mesh(
        new THREE.PlaneGeometry(width, depth),
        roadMaterial
    );

    road.rotation.x = -Math.PI / 2;
    road.position.set(x, 0.01, z);
    road.receiveShadow = true;

    scene.add(road);

    // Add dashed road markings.
    if (width > depth) {

        for (
            let markX = x - width / 2 + 3;
            markX < x + width / 2;
            markX += 8
        ) {

            const line = new THREE.Mesh(
                new THREE.PlaneGeometry(3, 0.16),
                new THREE.MeshBasicMaterial({
                    color: 0xffffff
                })
            );

            line.rotation.x = -Math.PI / 2;
            line.position.set(markX, 0.04, z);

            scene.add(line);
        }

    } else {

        for (
            let markZ = z - depth / 2 + 3;
            markZ < z + depth / 2;
            markZ += 8
        ) {

            const line = new THREE.Mesh(
                new THREE.PlaneGeometry(0.16, 3),
                new THREE.MeshBasicMaterial({
                    color: 0xffffff
                })
            );

            line.rotation.x = -Math.PI / 2;
            line.position.set(x, 0.04, markZ);

            scene.add(line);
        }
    }
}

// Build a grid of intersecting roads.

for (let i = -cityRange; i <= cityRange; i++) {

    const coordinate = i * blockSize;

    createRoad(
        coordinate,
        0,
        roadWidth,
        blockSize * (cityRange * 2 + 1)
    );

    createRoad(
        0,
        coordinate,
        blockSize * (cityRange * 2 + 1),
        roadWidth
    );
}

// ========================================
// 6. BUILDINGS
// ========================================

function createBuilding(x, z) {

    const width = 10 + Math.random() * 10;
    const depth = 10 + Math.random() * 10;
    const height = 12 + Math.random() * 55;

    const material = new THREE.MeshStandardMaterial({
        color: buildingColors[
            Math.floor(Math.random() * buildingColors.length)
        ],
        roughness: 0.85
    });

    const building = new THREE.Mesh(
        new THREE.BoxGeometry(width, height, depth),
        material
    );

    building.position.set(
        x,
        height / 2,
        z
    );

    building.castShadow = true;
    building.receiveShadow = true;

    scene.add(building);

    // Store collision information.
    buildings.push({
        x,
        z,
        halfWidth: width / 2,
        halfDepth: depth / 2
    });

    // Windows on the front face.
    const windowMaterial = new THREE.MeshStandardMaterial({
        color: 0x9ed7e8,
        emissive: 0x19303a,
        metalness: 0.2,
        roughness: 0.3
    });

    for (
        let y = 4;
        y < height - 2;
        y += 5
    ) {

        for (
            let wx = -width / 2 + 2;
            wx < width / 2 - 1;
            wx += 3
        ) {

            const windowMesh = new THREE.Mesh(
                new THREE.BoxGeometry(1.2, 1.7, 0.12),
                windowMaterial
            );

            windowMesh.position.set(
                x + wx,
                y,
                z + depth / 2 + 0.07
            );

            scene.add(windowMesh);
        }
    }
}

// Create buildings between the roads.

for (let gx = -cityRange; gx < cityRange; gx++) {

    for (let gz = -cityRange; gz < cityRange; gz++) {

        const centerX = gx * blockSize + blockSize / 2;
        const centerZ = gz * blockSize + blockSize / 2;

        // Leave space for the roads and sidewalks.
        const buildingX = centerX + (Math.random() - 0.5) * 7;
        const buildingZ = centerZ + (Math.random() - 0.5) * 7;

        createBuilding(buildingX, buildingZ);
    }
}

// ========================================
// 7. SIDEWALKS
// ========================================

for (let i = -cityRange; i <= cityRange; i++) {

    const coordinate = i * blockSize;

    for (const side of [-1, 1]) {

        const sidewalkX = coordinate + side * 9;
        const sidewalkZ = coordinate + side * 9;

        const sidewalkA = new THREE.Mesh(
            new THREE.PlaneGeometry(
                3,
                blockSize * (cityRange * 2 + 1)
            ),
            pavementMaterial
        );

        sidewalkA.rotation.x = -Math.PI / 2;
        sidewalkA.position.set(
            sidewalkX,
            0.025,
            0
        );

        scene.add(sidewalkA);

        const sidewalkB = new THREE.Mesh(
            new THREE.PlaneGeometry(
                blockSize * (cityRange * 2 + 1),
                3
            ),
            pavementMaterial
        );

        sidewalkB.rotation.x = -Math.PI / 2;
        sidewalkB.position.set(
            0,
            0.025,
            sidewalkZ
        );

        scene.add(sidewalkB);
    }
}

// ========================================
// 8. CREATE PLAYER
// ========================================

const player = new THREE.Group();

const skinMaterial = new THREE.MeshStandardMaterial({
    color: 0xc58b65
});

const shirtMaterial = new THREE.MeshStandardMaterial({
    color: 0x2766a8
});

const pantsMaterial = new THREE.MeshStandardMaterial({
    color: 0x292d38
});

// Body
const body = new THREE.Mesh(
    new THREE.BoxGeometry(0.9, 1.2, 0.45),
    shirtMaterial
);

body.position.y = 1.45;
body.castShadow = true;

player.add(body);

// Head
const head = new THREE.Mesh(
    new THREE.SphereGeometry(0.3, 16, 16),
    skinMaterial
);

head.position.y = 2.3;
head.castShadow = true;

player.add(head);

// Legs
const legs = [];

for (const side of [-1, 1]) {

    const leg = new THREE.Mesh(
        new THREE.BoxGeometry(0.32, 0.85, 0.35),
        pantsMaterial
    );

    leg.position.set(
        side * 0.23,
        0.43,
        0
    );

    leg.castShadow = true;

    player.add(leg);
    legs.push(leg);
}

player.position.set(0, 0, 0);

scene.add(player);

// ========================================
// 9. CAMERA
// ========================================

let cameraYaw = 0;
let cameraPitch = 0.18;

const cameraDistance = 7;
const cameraHeight = 2.5;

function updateCamera() {

    const target = new THREE.Vector3(
        player.position.x,
        player.position.y + 1.5,
        player.position.z
    );

    const horizontalDistance =
        cameraDistance * Math.cos(cameraPitch);

    const cameraOffset = new THREE.Vector3(
        Math.sin(cameraYaw) * horizontalDistance,
        cameraHeight + Math.sin(cameraPitch) * cameraDistance,
        Math.cos(cameraYaw) * horizontalDistance
    );

    camera.position.copy(target).add(cameraOffset);

    camera.lookAt(target);
}

updateCamera();

// ========================================
// 10. PLAYER CONTROLS
// ========================================

const keys = {};

let gameStarted = false;

window.addEventListener("keydown", (event) => {

    keys[event.key.toLowerCase()] = true;

    if (
        ["w", "a", "s", "d", " "].includes(event.key.toLowerCase())
    ) {
        event.preventDefault();
    }
});

window.addEventListener("keyup", (event) => {
    keys[event.key.toLowerCase()] = false;
});

renderer.domElement.addEventListener("click", () => {

    if (gameStarted && document.pointerLockElement !== renderer.domElement) {
        renderer.domElement.requestPointerLock();
    }
});

document.addEventListener("mousemove", (event) => {

    if (document.pointerLockElement !== renderer.domElement) {
        return;
    }

    cameraYaw -= event.movementX * 0.003;
    cameraPitch -= event.movementY * 0.002;

    cameraPitch = THREE.MathUtils.clamp(
        cameraPitch,
        -0.35,
        0.8
    );
});

// ========================================
// 11. COLLISION DETECTION
// ========================================

function collidesWithBuilding(x, z) {

    const playerRadius = 0.65;

    for (const building of buildings) {

        const closestX = THREE.MathUtils.clamp(
            x,
            building.x - building.halfWidth,
            building.x + building.halfWidth
        );

        const closestZ = THREE.MathUtils.clamp(
            z,
            building.z - building.halfDepth,
            building.z + building.halfDepth
        );

        const dx = x - closestX;
        const dz = z - closestZ;

        if (
            dx * dx + dz * dz <
            playerRadius * playerRadius
        ) {
            return true;
        }
    }

    return false;
}

// ========================================
// 12. MOVEMENT AND ANIMATION
// ========================================

const clock = new THREE.Clock();

let walkTime = 0;

function updatePlayer(delta) {

    if (!gameStarted) return;

    let forward = 0;
    let sideways = 0;

    if (keys["w"]) forward += 1;
    if (keys["s"]) forward -= 1;
    if (keys["a"]) sideways += 1;
    if (keys["d"]) sideways -= 1;

    const moving = forward !== 0 || sideways !== 0;

    if (!moving) {

        legs.forEach((leg) => {
            leg.rotation.x = 0;
        });

        return;
    }

    const speed = keys["shift"] ? 11 : 6;

    const inputLength = Math.hypot(forward, sideways);

    forward /= inputLength;
    sideways /= inputLength;

    const directionX =
        -Math.sin(cameraYaw) * forward +
        Math.cos(cameraYaw) * sideways;

    const directionZ =
        -Math.cos(cameraYaw) * forward -
        Math.sin(cameraYaw) * sideways;

    const nextX =
        player.position.x + directionX * speed * delta;

    const nextZ =
        player.position.z + directionZ * speed * delta;

    // Allow movement along a wall when the other axis is clear.

    if (!collidesWithBuilding(nextX, player.position.z)) {
        player.position.x = nextX;
    }

    if (!collidesWithBuilding(player.position.x, nextZ)) {
        player.position.z = nextZ;
    }

    // Turn the character toward the movement direction.

    player.rotation.y = Math.atan2(
        directionX,
        directionZ
    );

    // Simple walking animation.

    walkTime += delta * (keys["shift"] ? 15 : 9);

    legs[0].rotation.x = Math.sin(walkTime) * 0.65;
    legs[1].rotation.x = -Math.sin(walkTime) * 0.65;
}

// ========================================
// 13. START GAME
// ========================================

document.getElementById("start-button").addEventListener(
    "click",
    () => {

        gameStarted = true;

        document.getElementById("start-screen")
            .classList.add("hidden");

        renderer.domElement.requestPointerLock();
    }
);

// ========================================
// 14. RESPONSIVE WINDOW
// ========================================

window.addEventListener("resize", () => {

    camera.aspect =
        window.innerWidth / window.innerHeight;

    camera.updateProjectionMatrix();

    renderer.setSize(
        window.innerWidth,
        window.innerHeight
    );

    renderer.setPixelRatio(
        Math.min(window.devicePixelRatio, 2)
    );
});

// ========================================
// 15. MAIN GAME LOOP
// ========================================

function animate() {

    requestAnimationFrame(animate);

    const delta = Math.min(clock.getDelta(), 0.05);

    updatePlayer(delta);
    updateCamera();

    renderer.render(scene, camera);
}

animate();
