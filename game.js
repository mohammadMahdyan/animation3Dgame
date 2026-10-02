/* ============================================================
   SNIPER DUEL 3D
   PART 2 - CORE 3D GAME ENGINE
   ============================================================ */

import * as THREE from "three";
import knifeImage from "./Assets/knife.png";
import sniperImage from "./Assets/snip.png";

("use strict");

/* ============================================================
   GLOBAL STATE
   ============================================================ */

const Game = {
  started: false,
  gameOver: false,
  victory: false,

  scene: null,
  camera: null,
  renderer: null,
  controls: null,

  clock: null,

  world: {
    width: 220,
    depth: 220,
  },

  player: {
    health: 100,
    maxHealth: 100,

    speed: 7.0,
    knifeSpeed: 11.0,
    sniperSpeed: 5.0,

    height: 1.8,

    velocity: new THREE.Vector3(),

    onGround: true,

    yaw: 0,
    pitch: 0,
  },

  enemies: [],

  weapons: {
    knife: {
      name: "KNIFE",

      damage: 35,

      range: 2.4,

      cooldown: 0.45,

      lastAttack: 0,

      speed: 11.0,
    },

    sniper: {
      name: "SNIPER",

      damage: 100,

      range: 250,

      cooldown: 1.25,

      lastShot: 0,

      magazineSize: 5,

      ammo: 5,

      reserve: 20,

      reloadTime: 2.0,

      reloading: false,

      zoomed: false,

      normalFov: 75,

      zoomFov: 24,
    },
  },

  currentWeapon: "sniper",

  keys: {},

  mouse: {
    left: false,
    right: false,
  },

  obstacles: [],

  bullets: [],

  effects: [],

  particles: [],

  enemyShots: [],

  raycaster: new THREE.Raycaster(),

  tmpVector: new THREE.Vector3(),

  tmpVector2: new THREE.Vector3(),
};

/* ============================================================
   DOM
   ============================================================ */

const DOM = {
  gameContainer: document.getElementById("game-container"),

  loadingScreen: document.getElementById("loading-screen"),

  crosshair: document.getElementById("crosshair"),

  sniperAim: document.getElementById("sniper-aim"),

  weaponImage: document.getElementById("weapon-image"),

  enemyCountInput: document.getElementById("enemy-count-input"),

  enemyCount: document.getElementById("enemy-count"),

  startScreen: document.getElementById("start-screen"),

  startButton: document.getElementById("start-button"),

  gameOverScreen: document.getElementById("game-over-screen"),

  victoryScreen: document.getElementById("victory-screen"),

  restartButton: document.getElementById("restart-button"),

  victoryRestartButton: document.getElementById("victory-restart-button"),

  playerHealthBar: document.getElementById("player-health-bar"),

  playerHealthText: document.getElementById("player-health-text"),

  enemyHealthBar: document.getElementById("enemy-health-bar"),

  weaponName: document.getElementById("weapon-name"),

  ammoCurrent: document.getElementById("ammo-current"),

  ammoReserve: document.getElementById("ammo-reserve"),

  reloadIndicator: document.getElementById("reload-indicator"),

  hitMarker: document.getElementById("hit-marker"),

  damageIndicator: document.getElementById("damage-indicator"),

  interactionHint: document.getElementById("interaction-hint"),
};

/* ============================================================
   INITIALIZATION
   ============================================================ */

function initializeGame() {
  createRenderer();
  createScene();
  createCamera();
  createLighting();
  createWorld();
  createPlayer();
  createWeapons();
  setupEvents();
  updateHUD();

  Game.clock = new THREE.Clock();

  animate();

  DOM.loadingScreen.classList.add("hidden");
}

/* ============================================================
   RENDERER
   ============================================================ */

function createRenderer() {
  Game.renderer = new THREE.WebGLRenderer({
    antialias: true,

    powerPreference: "high-performance",
  });

  Game.renderer.setPixelRatio(Math.min(window.devicePixelRatio, 2));

  Game.renderer.setSize(window.innerWidth, window.innerHeight);

  Game.renderer.shadowMap.enabled = true;

  Game.renderer.shadowMap.type = THREE.PCFSoftShadowMap;

  Game.renderer.outputColorSpace = THREE.SRGBColorSpace;

  DOM.gameContainer.appendChild(Game.renderer.domElement);
}

/* ============================================================
   SCENE
   ============================================================ */

function createScene() {
  Game.scene = new THREE.Scene();

  Game.scene.background = new THREE.Color(0x9db3c5);

  Game.scene.fog = new THREE.Fog(0x9db3c5, 70, 230);
}

/* ============================================================
   CAMERA
   ============================================================ */

function createCamera() {
  Game.camera = new THREE.PerspectiveCamera(
    75,

    window.innerWidth / window.innerHeight,

    0.05,

    500,
  );

  Game.camera.position.set(0, Game.player.height, 0);
  Game.camera.rotation.order = "YXZ";
}

/* ============================================================
   LIGHTING
   ============================================================ */

function createLighting() {
  const hemisphere = new THREE.HemisphereLight(
    0xdcecff,
    0x34402f,

    1.8,
  );

  Game.scene.add(hemisphere);

  const sun = new THREE.DirectionalLight(
    0xfff3d2,

    3.2,
  );

  sun.position.set(-70, 120, -50);

  sun.castShadow = true;

  sun.shadow.mapSize.width = 2048;
  sun.shadow.mapSize.height = 2048;

  sun.shadow.camera.left = -150;
  sun.shadow.camera.right = 150;
  sun.shadow.camera.top = 150;
  sun.shadow.camera.bottom = -150;

  sun.shadow.camera.near = 1;
  sun.shadow.camera.far = 350;

  Game.scene.add(sun);
}

/* ============================================================
   MATERIAL HELPERS
   ============================================================ */

function material(color, roughness = 0.8) {
  return new THREE.MeshStandardMaterial({
    color,

    roughness,

    metalness: 0.05,
  });
}

/* ============================================================
   WORLD
   ============================================================ */

function createWorld() {
  createGround();

  createBoundaryWalls();

  createBuildings();

  createCoverObjects();

  createTrees();

  createRocks();

  createSpawnMarkers();
}

/* ============================================================
   GROUND
   ============================================================ */

function createGround() {
  const geometry = new THREE.PlaneGeometry(
    Game.world.width,
    Game.world.depth,
    40,
    40,
  );

  const groundMaterial = new THREE.MeshStandardMaterial({
    color: 0x65704f,

    roughness: 1.0,

    metalness: 0,
  });

  const ground = new THREE.Mesh(geometry, groundMaterial);

  ground.rotation.x = -Math.PI / 2;

  ground.receiveShadow = true;

  Game.scene.add(ground);
}

/* ============================================================
   BOUNDARY
   ============================================================ */

function createBoundaryWalls() {
  const size = Game.world.width / 2;

  const wallHeight = 8;

  const wallThickness = 2;

  const wallMaterial = material(0x4d5147);

  const positions = [
    [0, wallHeight / 2, -size],
    [0, wallHeight / 2, size],
    [-size, wallHeight / 2, 0],
    [size, wallHeight / 2, 0],
  ];

  const sizes = [
    [Game.world.width, wallHeight, wallThickness],
    [Game.world.width, wallHeight, wallThickness],
    [wallThickness, wallHeight, Game.world.depth],
    [wallThickness, wallHeight, Game.world.depth],
  ];

  for (let i = 0; i < positions.length; i++) {
    const geometry = new THREE.BoxGeometry(
      sizes[i][0],
      sizes[i][1],
      sizes[i][2],
    );

    const wall = new THREE.Mesh(geometry, wallMaterial);

    wall.position.set(positions[i][0], positions[i][1], positions[i][2]);

    wall.castShadow = true;
    wall.receiveShadow = true;

    Game.scene.add(wall);

    Game.obstacles.push(wall);
  }
}

/* ============================================================
   BUILDINGS
   ============================================================ */

function createBuildings() {
  const buildings = [
    {
      x: -45,
      z: -35,
      w: 22,
      h: 13,
      d: 18,
    },

    {
      x: 40,
      z: -20,
      w: 25,
      h: 16,
      d: 20,
    },

    {
      x: -25,
      z: 38,
      w: 30,
      h: 11,
      d: 22,
    },

    {
      x: 45,
      z: 40,
      w: 18,
      h: 10,
      d: 28,
    },

    {
      x: 0,
      z: 0,
      w: 15,
      h: 7,
      d: 15,
    },
  ];

  buildings.forEach((building) => {
    createBuilding(building);
  });
}

function createBuilding(data) {
  const geometry = new THREE.BoxGeometry(data.w, data.h, data.d);

  const buildingMaterial = material(0x77766c);

  const building = new THREE.Mesh(geometry, buildingMaterial);

  building.position.set(
    data.x,

    data.h / 2,

    data.z,
  );

  building.castShadow = true;

  building.receiveShadow = true;

  Game.scene.add(building);

  Game.obstacles.push(building);

  /*
       سقف ساده
    */

  const roofGeometry = new THREE.BoxGeometry(
    data.w + 0.5,

    0.7,

    data.d + 0.5,
  );

  const roofMaterial = material(0x4e514a);

  const roof = new THREE.Mesh(
    roofGeometry,

    roofMaterial,
  );

  roof.position.set(
    data.x,

    data.h + 0.35,

    data.z,
  );

  roof.castShadow = true;

  roof.receiveShadow = true;

  Game.scene.add(roof);

  Game.obstacles.push(roof);
}

/* ============================================================
   COVER
   ============================================================ */

function createCoverObjects() {
  const covers = [
    [-60, 0, 18, 2, 4],
    [-25, -20, 14, 2, 3],
    [20, -45, 18, 2, 3],
    [55, 15, 14, 2, 3],
    [15, 50, 20, 2, 3],
    [-60, 45, 18, 2, 3],
  ];

  covers.forEach(([x, z, width, depth, height]) => {
    const geometry = new THREE.BoxGeometry(width, height, depth);

    const object = new THREE.Mesh(
      geometry,

      material(0x68583f),
    );

    object.position.set(
      x,

      height / 2,

      z,
    );

    object.castShadow = true;

    object.receiveShadow = true;

    Game.scene.add(object);

    Game.obstacles.push(object);
  });
}

/* ============================================================
   TREES
   ============================================================ */

function createTrees() {
  const treePositions = [
    [-80, -70],
    [-70, -10],
    [-80, 60],

    [-15, -75],
    [15, -75],

    [75, -65],
    [80, 0],
    [75, 70],

    [-60, 75],
    [5, 70],
  ];

  treePositions.forEach(([x, z]) => {
    createTree(x, z);
  });
}

function createTree(x, z) {
  const trunkGeometry = new THREE.CylinderGeometry(0.7, 1.0, 7, 8);

  const trunk = new THREE.Mesh(
    trunkGeometry,

    material(0x55402e),
  );

  trunk.position.set(x, 3.5, z);

  trunk.castShadow = true;

  Game.scene.add(trunk);

  const crownGeometry = new THREE.SphereGeometry(4.5, 10, 8);

  const crown = new THREE.Mesh(
    crownGeometry,

    material(0x354f2d),
  );

  crown.position.set(x, 8, z);

  crown.castShadow = true;

  crown.receiveShadow = true;

  Game.scene.add(crown);

  /*
       تنه به‌عنوان مانع
    */

  Game.obstacles.push(trunk);
}

/* ============================================================
   ROCKS
   ============================================================ */

function createRocks() {
  const rockPositions = [
    [-72, -40],
    [-40, 65],
    [30, 72],
    [70, 35],
    [65, -45],
    [-70, 25],
  ];

  rockPositions.forEach(([x, z]) => {
    const geometry = new THREE.DodecahedronGeometry(
      3 + Math.random() * 2,

      0,
    );

    const rock = new THREE.Mesh(
      geometry,

      material(0x66655c),
    );

    rock.position.set(
      x,

      2,

      z,
    );

    rock.rotation.y = Math.random() * Math.PI;

    rock.castShadow = true;

    rock.receiveShadow = true;

    Game.scene.add(rock);

    Game.obstacles.push(rock);
  });
}

/* ============================================================
   SPAWN MARKERS
   ============================================================ */

function createSpawnMarkers() {
  const markerMaterial = new THREE.MeshBasicMaterial({
    color: 0x445544,

    transparent: true,

    opacity: 0.25,
  });

  const geometry = new THREE.CircleGeometry(6, 32);

  const playerMarker = new THREE.Mesh(geometry, markerMaterial);

  playerMarker.rotation.x = -Math.PI / 2;

  playerMarker.position.set(-75, 0.02, 75);

  Game.scene.add(playerMarker);

  const enemyMarker = playerMarker.clone();

  enemyMarker.position.set(65, 0.02, -65);

  Game.scene.add(enemyMarker);
}

/* ============================================================
   PLAYER
   ============================================================ */

function createPlayer() {
  Game.camera.position.set(
    -75,

    Game.player.height,

    75,
  );
}

/* ============================================================
   ENEMY
   ============================================================ */

function createEnemy(position, index) {
  const enemyGroup = new THREE.Group();

  /*
       Body
    */

  const body = new THREE.Mesh(
    new THREE.BoxGeometry(1.2, 1.7, 0.7),

    material(0x28343b),
  );

  body.position.y = 1.7;

  body.castShadow = true;

  /*
       Head
    */

  const head = new THREE.Mesh(
    new THREE.SphereGeometry(0.42, 16, 12),

    material(0xc49b7b),
  );

  head.position.y = 2.85;

  head.castShadow = true;

  /*
       Legs
    */

  const legGeometry = new THREE.BoxGeometry(0.35, 1.5, 0.35);

  const leftLeg = new THREE.Mesh(
    legGeometry,

    material(0x20252a),
  );

  const rightLeg = leftLeg.clone();

  leftLeg.position.set(-0.3, 0.75, 0);

  rightLeg.position.set(0.3, 0.75, 0);

  leftLeg.castShadow = true;
  rightLeg.castShadow = true;

  enemyGroup.add(body, head, leftLeg, rightLeg);

  enemyGroup.position.copy(position);

  Game.scene.add(enemyGroup);

  const enemy = {
    id: index,
    health: 100,
    maxHealth: 100,
    speed: 2.4,
    attackCooldown: performance.now() / 1000 + Math.random() * 1.5,
    alive: true,
    mesh: enemyGroup,
  };

  Game.enemies.push(enemy);

  return enemy;
}

/* ============================================================
   WEAPONS
   ============================================================ */

function createWeapons() {
  updateWeaponImage();
}

function updateWeaponImage() {
  const isKnife = Game.currentWeapon === "knife";

  DOM.weaponImage.src = isKnife ? knifeImage : sniperImage;
  DOM.weaponImage.dataset.weapon = Game.currentWeapon;
  DOM.weaponImage.alt = isKnife ? "Knife" : "Sniper rifle";
  DOM.weaponImage.classList.remove("is-firing");
}

function createKnifeModel() {
  const knife = new THREE.Group();

  const blade = new THREE.Mesh(
    new THREE.BoxGeometry(0.09, 0.75, 0.18),

    material(0xc9c9c9, 0.35),
  );

  blade.position.y = 0.45;

  const handle = new THREE.Mesh(
    new THREE.BoxGeometry(0.13, 0.5, 0.16),

    material(0x252525),
  );

  handle.position.y = -0.15;

  knife.add(blade, handle);

  knife.position.set(0.45, -0.45, -0.85);

  knife.rotation.x = -0.25;

  knife.visible = false;

  Game.camera.add(knife);

  knife.name = "Knife";

  Game.knifeModel = knife;
}

function createSniperModel() {
  const sniper = new THREE.Group();

  /*
       Barrel
    */

  const barrel = new THREE.Mesh(
    new THREE.CylinderGeometry(0.055, 0.055, 1.5, 12),

    material(0x1b1d1f, 0.4),
  );

  barrel.rotation.z = Math.PI / 2;

  barrel.position.z = -0.75;

  /*
       Body
    */

  const body = new THREE.Mesh(
    new THREE.BoxGeometry(0.22, 0.22, 1.5),

    material(0x24211d),
  );

  body.position.z = -0.1;

  /*
       Scope
    */

  const scope = new THREE.Mesh(
    new THREE.CylinderGeometry(0.09, 0.09, 0.65, 12),

    material(0x151719, 0.25),
  );

  scope.rotation.x = Math.PI / 2;

  scope.position.set(
    0,

    0.23,

    -0.15,
  );

  sniper.add(barrel, body, scope);

  sniper.position.set(
    0.45,

    -0.45,

    -0.85,
  );

  sniper.rotation.x = -0.02;

  Game.camera.add(sniper);

  sniper.name = "Sniper";

  Game.sniperModel = sniper;
}

/* ============================================================
   INPUT
   ============================================================ */

function setupEvents() {
  window.addEventListener("resize", onResize);

  window.addEventListener("mousemove", (event) => {
    if (!Game.started || Game.gameOver || Game.victory) return;

    const pointerLocked =
      document.pointerLockElement === Game.renderer.domElement;

    if (!pointerLocked && event.buttons === 0) return;

    const sensitivity = 0.0022;
    const movementX = Number.isFinite(event.movementX) ? event.movementX : 0;
    const movementY = Number.isFinite(event.movementY) ? event.movementY : 0;

    Game.player.yaw -= movementX * sensitivity;
    Game.player.pitch = THREE.MathUtils.clamp(
      Game.player.pitch - movementY * sensitivity,
      -Math.PI / 2 + 0.05,
      Math.PI / 2 - 0.05,
    );

    Game.camera.rotation.y = Game.player.yaw;
    Game.camera.rotation.x = Game.player.pitch;
  });

  window.addEventListener("keydown", (event) => {
    Game.keys[event.code] = true;

    if (event.code === "Digit1") {
      switchWeapon("knife");
    }

    if (event.code === "Digit2") {
      switchWeapon("sniper");
    }

    if (event.code === "KeyQ" && !event.repeat) {
      switchWeapon(Game.currentWeapon === "knife" ? "sniper" : "knife");
    }

    if (event.code === "KeyR") {
      reload();
    }

    if (event.code === "Space" && Game.player.onGround) {
      Game.player.velocity.y = 7;

      Game.player.onGround = false;
    }
  });

  window.addEventListener("keyup", (event) => {
    Game.keys[event.code] = false;
  });

  window.addEventListener("mousedown", (event) => {
    if (!Game.started) return;

    if (event.button === 0) {
      Game.mouse.left = true;

      attack();
    }

    if (event.button === 2) {
      Game.mouse.right = true;

      if (Game.currentWeapon === "sniper") {
        setZoom(true);
      }
    }
  });

  window.addEventListener("mouseup", (event) => {
    if (event.button === 0) {
      Game.mouse.left = false;
    }

    if (event.button === 2) {
      Game.mouse.right = false;

      setZoom(false);
    }
  });

  window.addEventListener("contextmenu", (event) => {
    event.preventDefault();
  });

  DOM.startButton.addEventListener("click", startGame);

  DOM.restartButton.addEventListener("click", restartGame);

  DOM.victoryRestartButton.addEventListener("click", restartGame);
}

/* ============================================================
   START GAME
   ============================================================ */

function startGame() {
  const requestedCount = Number.parseInt(DOM.enemyCountInput.value, 10);
  const enemyCount = Number.isFinite(requestedCount)
    ? Math.min(10, Math.max(1, requestedCount))
    : 3;
  const spawnPoints = [
    [65, -65],
    [65, 65],
    [-65, -65],
    [0, -85],
    [85, 0],
    [-85, 0],
    [0, 85],
    [85, 85],
    [-85, -85],
    [-35, -35],
  ];

  DOM.enemyCountInput.value = enemyCount;
  Game.enemies.length = 0;

  for (let index = 0; index < enemyCount; index++) {
    const [x, z] = spawnPoints[index];
    createEnemy(new THREE.Vector3(x, 0, z), index);
  }

  updateHUD();

  Game.started = true;

  DOM.weaponImage.hidden = false;

  DOM.startScreen.classList.add("hidden");

  if (Game.renderer.domElement.requestPointerLock) {
    Game.renderer.domElement.requestPointerLock();
  }

  if (Game.clock) {
    Game.clock.start();
  }
}

/* ============================================================
   RESTART
   ============================================================ */

function restartGame() {
  location.reload();
}

/* ============================================================
   MOVEMENT
   ============================================================ */

function updatePlayer(delta) {
  if (!Game.started) return;

  if (Game.gameOver || Game.victory) return;

  let forward = 0;
  let right = 0;

  if (Game.keys["KeyW"] || Game.keys["ArrowUp"]) {
    forward += 1;
  }

  if (Game.keys["KeyS"] || Game.keys["ArrowDown"]) {
    forward -= 1;
  }

  if (Game.keys["KeyD"] || Game.keys["ArrowRight"]) {
    right += 1;
  }

  if (Game.keys["KeyA"] || Game.keys["ArrowLeft"]) {
    right -= 1;
  }

  const direction = new THREE.Vector3(right, 0, -forward);

  if (direction.lengthSq() > 0) {
    direction.normalize();

    /*
           جهت حرکت نسبت به دوربین
        */

    const cameraDirection = new THREE.Vector3();

    Game.camera.getWorldDirection(cameraDirection);

    cameraDirection.y = 0;

    cameraDirection.normalize();

    const side = new THREE.Vector3(cameraDirection.z, 0, -cameraDirection.x);

    const movement = new THREE.Vector3();

    movement.addScaledVector(cameraDirection, forward);

    movement.addScaledVector(side, right);

    movement.normalize();

    const speed =
      Game.currentWeapon === "knife"
        ? Game.player.knifeSpeed
        : Game.player.sniperSpeed;

    movement.multiplyScalar(speed * delta);

    const nextPosition = Game.camera.position.clone();

    nextPosition.x += movement.x;

    nextPosition.z += movement.z;

    if (!isPositionBlocked(nextPosition)) {
      Game.camera.position.x = nextPosition.x;

      Game.camera.position.z = nextPosition.z;
    }
  }

  /*
       Gravity
    */

  Game.player.velocity.y -= 18 * delta;

  Game.camera.position.y += Game.player.velocity.y * delta;

  if (Game.camera.position.y <= Game.player.height) {
    Game.camera.position.y = Game.player.height;

    Game.player.velocity.y = 0;

    Game.player.onGround = true;
  }
}

/* ============================================================
   COLLISION
   ============================================================ */

function isPositionBlocked(position) {
  const playerRadius = 0.45;

  /*
       مرز نقشه
    */

  const halfWidth = Game.world.width / 2 - playerRadius;

  const halfDepth = Game.world.depth / 2 - playerRadius;

  if (
    position.x < -halfWidth ||
    position.x > halfWidth ||
    position.z < -halfDepth ||
    position.z > halfDepth
  ) {
    return true;
  }

  /*
       بررسی ساختمان‌ها و موانع
    */

  for (const obstacle of Game.obstacles) {
    const box = new THREE.Box3().setFromObject(obstacle);

    box.expandByScalar(playerRadius);

    if (box.containsPoint(new THREE.Vector3(position.x, 1, position.z))) {
      return true;
    }
  }

  return false;
}

/* ============================================================
   WEAPON SWITCH
   ============================================================ */

function switchWeapon(weapon) {
  if (weapon !== "knife" && weapon !== "sniper") {
    return;
  }

  if (Game.currentWeapon === weapon) {
    return;
  }

  Game.currentWeapon = weapon;

  updateWeaponImage();

  setZoom(false);

  updateHUD();
}

/* ============================================================
   ATTACK
   ============================================================ */

function attack() {
  if (!Game.started) return;

  if (Game.gameOver || Game.victory) return;

  if (Game.currentWeapon === "knife") {
    knifeAttack();

    return;
  }

  if (Game.currentWeapon === "sniper") {
    sniperShoot();
  }
}

/* ============================================================
   KNIFE
   ============================================================ */

function knifeAttack() {
  const weapon = Game.weapons.knife;

  const now = performance.now() / 1000;

  if (now - weapon.lastAttack < weapon.cooldown) {
    return;
  }

  weapon.lastAttack = now;

  animateKnife();

  const direction = new THREE.Vector3();

  Game.camera.getWorldDirection(direction);

  const target = Game.enemies
    .filter((enemy) => enemy.alive)
    .map((enemy) => ({
      enemy,
      distance: Game.camera.position.distanceTo(enemy.mesh.position),
      direction: enemy.mesh.position
        .clone()
        .sub(Game.camera.position)
        .normalize(),
    }))
    .filter(
      (candidate) =>
        candidate.distance <= weapon.range &&
        direction.dot(candidate.direction) >= 0.45,
    )
    .sort((first, second) => first.distance - second.distance)[0];

  if (!target) return;

  damageEnemy(target.enemy, weapon.damage);

  showHitMarker();
}

/* ============================================================
   KNIFE ANIMATION
   ============================================================ */

function animateKnife() {
  animateWeapon();
}

/* ============================================================
   SNIPER
   ============================================================ */

function sniperShoot() {
  const weapon = Game.weapons.sniper;

  if (weapon.reloading) return;

  if (weapon.ammo <= 0) {
    reload();

    return;
  }

  const now = performance.now() / 1000;

  if (now - weapon.lastShot < weapon.cooldown) {
    return;
  }

  weapon.lastShot = now;

  weapon.ammo--;

  updateHUD();

  createMuzzleFlash();

  createShotEffect();

  performShot();

  animateSniper();
}

/* ============================================================
   SHOT
   ============================================================ */

function performShot() {
  const direction = new THREE.Vector3();

  Game.camera.getWorldDirection(direction);

  Game.raycaster.set(
    Game.camera.position,

    direction,
  );

  /*
       ابتدا ساختمان‌ها و موانع
    */

  const obstacleHits = Game.raycaster.intersectObjects(Game.obstacles, false);

  const enemyParts = Game.enemies
    .filter((enemy) => enemy.alive)
    .flatMap((enemy) => enemy.mesh.children);

  const enemyHits = Game.raycaster.intersectObjects(enemyParts, false);

  let obstacleDistance = Infinity;

  if (obstacleHits.length > 0) {
    obstacleDistance = obstacleHits[0].distance;
  }

  /*
       اگر دشمن قبل از مانع باشد
    */

  if (enemyHits.length > 0) {
    const hit = enemyHits[0];

    if (hit.distance <= obstacleDistance) {
      const target = Game.enemies.find(
        (enemy) => enemy.alive && enemy.mesh === hit.object.parent,
      );

      if (!target) return;

      damageEnemy(target, Game.weapons.sniper.damage);

      createBulletImpact(hit.point);

      showHitMarker();

      return;
    }
  }

  /*
       برخورد گلوله با مانع
    */

  if (obstacleHits.length > 0) {
    createBulletImpact(obstacleHits[0].point);

    return;
  }

  /*
       شلیک به دوردست
    */

  const endPoint = Game.camera.position
    .clone()
    .add(direction.multiplyScalar(Game.weapons.sniper.range));

  createBulletTrail(Game.camera.position, endPoint);
}

/* ============================================================
   SNIPER ANIMATION
   ============================================================ */

function animateSniper() {
  animateWeapon();
}

function animateWeapon() {
  DOM.weaponImage.classList.remove("is-firing");
  void DOM.weaponImage.offsetWidth;
  DOM.weaponImage.classList.add("is-firing");
}

/* ============================================================
   MUZZLE FLASH
   ============================================================ */

function createMuzzleFlash() {
  const flash = new THREE.PointLight(
    0xffd27a,

    18,

    7,
  );

  const direction = new THREE.Vector3();

  Game.camera.getWorldDirection(direction);

  flash.position.copy(Game.camera.position);

  flash.position.add(direction.multiplyScalar(1.2));

  Game.scene.add(flash);

  setTimeout(() => {
    Game.scene.remove(flash);
  }, 55);
}

/* ============================================================
   SHOT EFFECT
   ============================================================ */

function createShotEffect() {
  /*
       یک خط بسیار کوتاه برای حس حرکت گلوله
    */

  const direction = new THREE.Vector3();

  Game.camera.getWorldDirection(direction);

  const start = Game.camera.position.clone();

  const end = start.clone().add(direction.clone().multiplyScalar(5));

  createBulletTrail(start, end);
}

/* ============================================================
   BULLET TRAIL
   ============================================================ */

function createBulletTrail(start, end) {
  const geometry = new THREE.BufferGeometry().setFromPoints([start, end]);

  const materialLine = new THREE.LineBasicMaterial({
    color: 0xffdca8,

    transparent: true,

    opacity: 0.7,
  });

  const line = new THREE.Line(geometry, materialLine);

  Game.scene.add(line);

  setTimeout(() => {
    Game.scene.remove(line);

    geometry.dispose();

    materialLine.dispose();
  }, 55);
}

/* ============================================================
   BULLET IMPACT
   ============================================================ */

function createBulletImpact(point) {
  const geometry = new THREE.SphereGeometry(0.09, 8, 8);

  const materialImpact = new THREE.MeshBasicMaterial({
    color: 0xffcc77,
  });

  const impact = new THREE.Mesh(
    geometry,

    materialImpact,
  );

  impact.position.copy(point);

  Game.scene.add(impact);

  setTimeout(() => {
    Game.scene.remove(impact);

    geometry.dispose();

    materialImpact.dispose();
  }, 120);
}

/* ============================================================
   ENEMY DAMAGE
   ============================================================ */

function damageEnemy(enemy, amount) {
  if (!enemy.alive) return;

  enemy.health -= amount;

  enemy.health = Math.max(0, enemy.health);

  updateHUD();

  /*
       ضربه خوردن
    */

  enemyHitReaction(enemy);

  if (enemy.health <= 0) {
    killEnemy(enemy);
  }
}

/* ============================================================
   ENEMY HIT REACTION
   ============================================================ */

function enemyHitReaction(enemy) {
  if (!enemy.mesh) return;

  enemy.mesh.position.y = 0.15;

  setTimeout(() => {
    if (enemy.mesh && enemy.alive) {
      enemy.mesh.position.y = 0;
    }
  }, 100);
}

/* ============================================================
   ENEMY DEATH
   ============================================================ */

function killEnemy(enemyData) {
  if (!enemyData.alive) return;

  enemyData.alive = false;
  updateHUD();

  /*
       مرگ ساده و غیرگرافیکی:
       مدل به زمین می‌افتد.
    */

  const enemy = enemyData.mesh;

  let progress = 0;

  const deathAnimation = setInterval(() => {
    progress += 0.08;

    enemy.rotation.x = Math.min(Math.PI / 2, (progress * Math.PI) / 2);

    enemy.position.y = Math.max(0, 1.2 * (1 - progress));

    if (progress >= 1) {
      clearInterval(deathAnimation);

      if (Game.enemies.every((enemy) => !enemy.alive)) {
        setTimeout(showVictory, 500);
      }
    }
  }, 30);
}

/* ============================================================
   ENEMY AI
   ============================================================ */

function updateEnemy(delta) {
  if (!Game.started) return;

  const playerPosition = Game.camera.position.clone();

  for (const enemy of Game.enemies) {
    if (!enemy.alive) continue;

    const distance = enemy.mesh.position.distanceTo(playerPosition);

    if (distance < 80) {
      const direction = playerPosition.clone().sub(enemy.mesh.position);

      direction.y = 0;

      if (direction.lengthSq() > 1) {
        direction.normalize();

        const movement = direction.clone().multiplyScalar(enemy.speed * delta);

        const next = enemy.mesh.position.clone().add(movement);

        if (!isEnemyBlocked(next)) {
          enemy.mesh.position.copy(next);
        }
      }

      enemy.mesh.lookAt(
        playerPosition.x,
        enemy.mesh.position.y,
        playerPosition.z,
      );

      if (distance < 65) {
        enemyShoot(enemy);
      }
    }
  }
}

/* ============================================================
   ENEMY COLLISION
   ============================================================ */

function isEnemyBlocked(position) {
  for (const obstacle of Game.obstacles) {
    const box = new THREE.Box3().setFromObject(obstacle);

    box.expandByScalar(0.6);

    if (box.containsPoint(new THREE.Vector3(position.x, 1, position.z))) {
      return true;
    }
  }

  return false;
}

/* ============================================================
   ENEMY SHOOTING
   ============================================================ */

function enemyShoot(enemy) {
  const now = performance.now() / 1000;

  if (now - enemy.attackCooldown < 2.2) {
    return;
  }

  enemy.attackCooldown = now;

  const origin = enemy.mesh.position.clone();

  origin.y += 2.2;

  const target = Game.camera.position.clone();

  const direction = target.sub(origin).normalize();

  /*
       دقت محدود برای طبیعی‌تر شدن AI
    */

  const spread = 0.035;

  direction.x += (Math.random() - 0.5) * spread;

  direction.y += (Math.random() - 0.5) * spread;

  direction.z += (Math.random() - 0.5) * spread;

  direction.normalize();

  createBulletTrail(
    origin,
    origin.clone().add(direction.clone().multiplyScalar(40)),
  );

  /*
       Raycast برای برخورد
    */

  Game.raycaster.set(origin, direction);

  const hits = Game.raycaster.intersectObjects(Game.obstacles, false);

  let hitDistance = Infinity;

  if (hits.length > 0) {
    hitDistance = hits[0].distance;
  }

  const distanceToPlayer = origin.distanceTo(Game.camera.position);

  /*
       احتمال برخورد
    */

  if (distanceToPlayer < hitDistance) {
    /*
           آسیب متغیر
        */

    const damage = 8 + Math.random() * 12;

    damagePlayer(damage);
  }
}

/* ============================================================
   PLAYER DAMAGE
   ============================================================ */

function damagePlayer(amount) {
  if (Game.gameOver) return;

  Game.player.health -= amount;

  Game.player.health = Math.max(0, Game.player.health);

  updateHUD();

  showDamageIndicator();

  if (Game.player.health <= 0) {
    showGameOver();
  }
}

/* ============================================================
   RELOAD
   ============================================================ */

function reload() {
  const weapon = Game.weapons.sniper;

  if (Game.currentWeapon !== "sniper") {
    return;
  }

  if (weapon.reloading) return;

  if (weapon.ammo >= weapon.magazineSize) {
    return;
  }

  if (weapon.reserve <= 0) {
    return;
  }

  weapon.reloading = true;

  DOM.reloadIndicator.classList.add("visible");

  setTimeout(() => {
    const needed = weapon.magazineSize - weapon.ammo;

    const amount = Math.min(needed, weapon.reserve);

    weapon.ammo += amount;

    weapon.reserve -= amount;

    weapon.reloading = false;

    DOM.reloadIndicator.classList.remove("visible");

    updateHUD();
  }, weapon.reloadTime * 1000);
}

/* ============================================================
   ZOOM
   ============================================================ */

function setZoom(enabled) {
  const weapon = Game.weapons.sniper;

  if (Game.currentWeapon !== "sniper") {
    enabled = false;
  }

  weapon.zoomed = enabled;

  Game.camera.fov = enabled ? weapon.zoomFov : weapon.normalFov;

  Game.camera.updateProjectionMatrix();

  updateAimDisplay();
}

function updateAimDisplay() {
  const knifeMode = Game.currentWeapon === "knife";
  const scoped = Game.currentWeapon === "sniper" && Game.weapons.sniper.zoomed;

  DOM.crosshair.hidden = !knifeMode;
  DOM.sniperAim.hidden = !scoped;
  DOM.weaponImage.classList.toggle("is-aiming", scoped);
}

/* ============================================================
   HIT MARKER
   ============================================================ */

function showHitMarker() {
  DOM.hitMarker.classList.add("visible");

  setTimeout(() => {
    DOM.hitMarker.classList.remove("visible");
  }, 130);
}

/* ============================================================
   DAMAGE INDICATOR
   ============================================================ */

function showDamageIndicator() {
  DOM.damageIndicator.classList.add("visible");

  setTimeout(() => {
    DOM.damageIndicator.classList.remove("visible");
  }, 180);
}

/* ============================================================
   VICTORY
   ============================================================ */

function showVictory() {
  Game.victory = true;

  DOM.victoryScreen.classList.remove("hidden");

  if (document.exitPointerLock) {
    document.exitPointerLock();
  }
}

/* ============================================================
   GAME OVER
   ============================================================ */

function showGameOver() {
  Game.gameOver = true;

  DOM.gameOverScreen.classList.remove("hidden");

  if (document.exitPointerLock) {
    document.exitPointerLock();
  }
}

/* ============================================================
   HUD
   ============================================================ */

function updateHUD() {
  const playerHealth = Math.max(0, Math.min(100, Game.player.health));

  DOM.playerHealthBar.style.width = `${playerHealth}%`;

  DOM.playerHealthText.textContent = Math.round(playerHealth);

  const totalEnemyHealth = Game.enemies.reduce(
    (total, enemy) => total + enemy.health,
    0,
  );
  const maximumEnemyHealth = Game.enemies.length * 100;
  const enemyHealth = maximumEnemyHealth
    ? (totalEnemyHealth / maximumEnemyHealth) * 100
    : 0;

  DOM.enemyHealthBar.style.width = `${enemyHealth}%`;
  DOM.enemyCount.textContent = `${Game.enemies.filter((enemy) => enemy.alive).length} / ${Game.enemies.length}`;

  const weapon = Game.currentWeapon;

  DOM.weaponName.textContent = weapon === "knife" ? "KNIFE" : "SNIPER";

  updateAimDisplay();

  if (weapon === "sniper") {
    DOM.ammoCurrent.textContent = Game.weapons.sniper.ammo;

    DOM.ammoReserve.textContent = Game.weapons.sniper.reserve;
  } else {
    DOM.ammoCurrent.textContent = "—";

    DOM.ammoReserve.textContent = "—";
  }
}

/* ============================================================
   RESIZE
   ============================================================ */

function onResize() {
  if (!Game.camera || !Game.renderer) return;

  Game.camera.aspect = window.innerWidth / window.innerHeight;

  Game.camera.updateProjectionMatrix();

  Game.renderer.setSize(
    window.innerWidth,

    window.innerHeight,
  );
}

/* ============================================================
   MAIN LOOP
   ============================================================ */

function animate() {
  requestAnimationFrame(animate);

  if (!Game.clock) return;

  const delta = Math.min(Game.clock.getDelta(), 0.05);

  updatePlayer(delta);

  updateEnemy(delta);

  Game.renderer.render(Game.scene, Game.camera);
}

initializeGame();
