// Three.js Tank Game - Simplified
const scene = new THREE.Scene();
scene.background = new THREE.Color(0x87ceeb);
scene.fog = new THREE.Fog(0x87ceeb, 1000, 10);

const camera = new THREE.PerspectiveCamera(75, window.innerWidth / window.innerHeight, 0.1, 1000);
camera.position.set(0, 20, 30);
camera.lookAt(0, 0, 0);

const renderer = new THREE.WebGLRenderer({ antialias: true, alpha: true });
renderer.setSize(window.innerWidth, window.innerHeight);
renderer.shadowMap.enabled = true;
renderer.shadowMap.type = THREE.PCFShadowShadowMap;
document.body.appendChild(renderer.domElement);

// Lighting
const ambientLight = new THREE.AmbientLight(0xffffff, 0.6);
scene.add(ambientLight);

const directionalLight = new THREE.DirectionalLight(0xffffff, 0.8);
directionalLight.position.set(100, 100, 50);
directionalLight.castShadow = true;
directionalLight.shadow.mapSize.width = 2048;
directionalLight.shadow.mapSize.height = 2048;
directionalLight.shadow.camera.left = -500;
directionalLight.shadow.camera.right = 500;
directionalLight.shadow.camera.top = 500;
directionalLight.shadow.camera.bottom = -500;
scene.add(directionalLight);

// Ground
const groundGeometry = new THREE.PlaneGeometry(500, 500);
const groundMaterial = new THREE.MeshLambertMaterial({ color: 0x2d5016 });
const ground = new THREE.Mesh(groundGeometry, groundMaterial);
ground.rotation.x = -Math.PI / 2;
ground.receiveShadow = true;
scene.add(ground);

// Tank Object
class Tank {
    constructor() {
        this.group = new THREE.Group();
        this.position = new THREE.Vector3(0, 0, 0);
        this.rotation = 0;
        this.turretRotation = 0;
        this.turretPitch = 0;
        this.velocity = new THREE.Vector3(0, 0, 0);
        this.speed = 0.5;
        this.rotationSpeed = 0.05;
        this.isJumping = false;
        this.jumpForce = 1.5;
        this.gravity = 0.08;
        
        this.createTank();
        scene.add(this.group);
        document.getElementById('status').textContent = '✅ Tank Ready!';
    }
    
    createTank() {
        // Hull (body)
        const hullGeometry = new THREE.BoxGeometry(4, 2, 8);
        const hullMaterial = new THREE.MeshPhongMaterial({ color: 0x4a4a4a });
        const hull = new THREE.Mesh(hullGeometry, hullMaterial);
        hull.position.y = 1;
        hull.castShadow = true;
        hull.receiveShadow = true;
        this.group.add(hull);
        
        // Turret (dome)
        const turretGeometry = new THREE.CylinderGeometry(2, 2, 1.5, 32);
        const turretMaterial = new THREE.MeshPhongMaterial({ color: 0x333333 });
        this.turret = new THREE.Mesh(turretGeometry, turretMaterial);
        this.turret.position.y = 2.5;
        this.turret.castShadow = true;
        this.turret.receiveShadow = true;
        this.group.add(this.turret);
        
        // Cannon/Gun
        const cannonGeometry = new THREE.CylinderGeometry(0.3, 0.3, 6, 16);
        const cannonMaterial = new THREE.MeshPhongMaterial({ color: 0x1a1a1a });
        this.cannon = new THREE.Mesh(cannonGeometry, cannonMaterial);
        this.cannon.rotation.z = Math.PI / 2;
        this.cannon.position.set(3, 2.5, 0);
        this.cannon.castShadow = true;
        this.cannon.receiveShadow = true;
        this.turret.add(this.cannon);
        
        // Tracks/Wheels (left)
        const trackGeometry = new THREE.BoxGeometry(0.5, 1, 8);
        const trackMaterial = new THREE.MeshPhongMaterial({ color: 0x000000 });
        const trackLeft = new THREE.Mesh(trackGeometry, trackMaterial);
        trackLeft.position.set(-1.5, 0.5, 0);
        trackLeft.castShadow = true;
        trackLeft.receiveShadow = true;
        this.group.add(trackLeft);
        
        // Tracks/Wheels (right)
        const trackRight = new THREE.Mesh(trackGeometry, trackMaterial);
        trackRight.position.set(1.5, 0.5, 0);
        trackRight.castShadow = true;
        trackRight.receiveShadow = true;
        this.group.add(trackRight);
    }
    
    update(keys) {
        // Movement
        const moveDirection = new THREE.Vector3();
        
        if (keys['w'] || keys['W']) {
            moveDirection.x += Math.cos(this.rotation);
            moveDirection.z += Math.sin(this.rotation);
        }
        if (keys['s'] || keys['S']) {
            moveDirection.x -= Math.cos(this.rotation);
            moveDirection.z -= Math.sin(this.rotation);
        }
        if (keys['a'] || keys['A']) {
            this.rotation += this.rotationSpeed;
        }
        if (keys['d'] || keys['D']) {
            this.rotation -= this.rotationSpeed;
        }
        
        moveDirection.normalize();
        this.velocity.x = moveDirection.x * this.speed;
        this.velocity.z = moveDirection.z * this.speed;
        
        // Gravity and jumping
        this.velocity.y -= this.gravity;
        
        if (keys[' '] && this.position.y <= 0.1) {
            this.velocity.y = this.jumpForce;
        }
        
        // Apply velocity
        this.position.add(this.velocity);
        
        // Keep on ground
        if (this.position.y < 0) {
            this.position.y = 0;
            this.velocity.y = 0;
        }
        
        // Update group position and rotation
        this.group.position.copy(this.position);
        this.group.rotation.y = this.rotation;
    }
    
    updateTurret(mouseX, mouseY) {
        // Horizontal turret rotation based on mouse X
        const center = window.innerWidth / 2;
        const offset = mouseX - center;
        this.turretRotation = (offset / center) * 0.3;
        this.turret.rotation.z = this.turretRotation;
        
        // Vertical cannon pitch based on mouse Y
        const centerY = window.innerHeight / 2;
        const offsetY = mouseY - centerY;
        this.turretPitch = (offsetY / centerY) * 0.3;
        this.cannon.rotation.x = this.turretPitch;
    }
    
    fire() {
        // Create a projectile
        const projectile = new Projectile(this.cannon.getWorldPosition(new THREE.Vector3()), this.getCannonDirection());
        projectiles.push(projectile);
        scene.add(projectile.mesh);
    }
    
    getCannonDirection() {
        const direction = new THREE.Vector3(1, 0, 0);
        direction.applyAxisAngle(new THREE.Vector3(0, 1, 0), this.rotation + this.turretRotation);
        direction.applyAxisAngle(new THREE.Vector3(0, 0, 1), this.turretPitch);
        return direction;
    }
}

// Projectile
class Projectile {
    constructor(position, direction) {
        const geometry = new THREE.SphereGeometry(0.3, 8, 8);
        const material = new THREE.MeshPhongMaterial({ color: 0xffff00 });
        this.mesh = new THREE.Mesh(geometry, material);
        this.mesh.position.copy(position);
        this.mesh.castShadow = true;
        this.mesh.receiveShadow = true;
        
        this.velocity = direction.multiplyScalar(1.5);
        this.lifespan = 300; // frames
    }
    
    update() {
        this.velocity.y -= 0.05; // gravity
        this.mesh.position.add(this.velocity);
        this.lifespan--;
    }
}

// Game variables
const tank = new Tank();
const projectiles = [];
const keys = {};
let mouseX = window.innerWidth / 2;
let mouseY = window.innerHeight / 2;

// Event listeners
window.addEventListener('keydown', (e) => { keys[e.key] = true; });
window.addEventListener('keyup', (e) => { keys[e.key] = false; });
window.addEventListener('mousemove', (e) => {
    mouseX = e.clientX;
    mouseY = e.clientY;
});
window.addEventListener('click', () => { tank.fire(); });
window.addEventListener('resize', () => {
    camera.aspect = window.innerWidth / window.innerHeight;
    camera.updateProjectionMatrix();
    renderer.setSize(window.innerWidth, window.innerHeight);
});

// Game loop
function animate() {
    requestAnimationFrame(animate);
    
    tank.update(keys);
    tank.updateTurret(mouseX, mouseY);
    
    // Update projectiles
    for (let i = projectiles.length - 1; i >= 0; i--) {
        projectiles[i].update();
        if (projectiles[i].lifespan <= 0 || projectiles[i].mesh.position.y < -50) {
            scene.remove(projectiles[i].mesh);
            projectiles.splice(i, 1);
        }
    }
    
    // Camera follow tank
    const cameraOffset = new THREE.Vector3(0, 15, -25);
    cameraOffset.applyAxisAngle(new THREE.Vector3(0, 1, 0), tank.rotation);
    camera.position.lerp(tank.position.clone().add(cameraOffset), 0.1);
    camera.lookAt(tank.position.clone().add(new THREE.Vector3(0, 5, 0)));
    
    // Update UI
    document.getElementById('pos').textContent = 
        `${tank.position.x.toFixed(1)}, ${tank.position.y.toFixed(1)}, ${tank.position.z.toFixed(1)}`;
    document.getElementById('rot').textContent = 
        `${(tank.rotation * 180 / Math.PI).toFixed(0)}°`;
    
    renderer.render(scene, camera);
}

animate();
