// Three.js Tank Game with Custom Tank Model
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
        this.modelLoaded = false;
        
        this.loadCustomTank();
        scene.add(this.group);
    }
    
    loadCustomTank() {
        // Use CORS proxy to load the OBJ file
        const mtlLoader = new THREE.MTLLoader();
        const objLoader = new THREE.OBJLoader();
        
        // GitHub raw URLs with CORS support
        const mtlUrl = 'https://raw.githubusercontent.com/titusjorourke-cmd/3dmodletank/main/github.mtl';
        const objUrl = 'https://raw.githubusercontent.com/titusjorourke-cmd/3dmodletank/main/github.obj';
        
        mtlLoader.load(mtlUrl, (materials) => {
            materials.preload();
            objLoader.setMaterials(materials);
            objLoader.load(objUrl, (object) => {
                object.scale.set(0.5, 0.5, 0.5);
                object.traverse((child) => {
                    if (child.isMesh) {
                        child.castShadow = true;
                        child.receiveShadow = true;
                    }
                });
                this.group.add(object);
                this.modelLoaded = true;
                console.log('Tank model loaded!');
            }, undefined, (error) => {
                console.error('Error loading OBJ:', error);
                this.createFallbackTank();
            });
        }, undefined, (error) => {
            console.error('Error loading MTL:', error);
            this.createFallbackTank();
        });
    }
    
    createFallbackTank() {
        // Fallback simple tank if model doesn't load
        const hullGeometry = new THREE.BoxGeometry(4, 2, 8);
        const hullMaterial = new THREE.MeshPhongMaterial({ color: 0x4a4a4a });
        const hull = new THREE.Mesh(hullGeometry, hullMaterial);
        hull.position.y = 1;
        hull.castShadow = true;
        hull.receiveShadow = true;
        this.group.add(hull);
        
        const turretGeometry = new THREE.CylinderGeometry(2, 2, 1.5, 32);
        const turretMaterial = new THREE.MeshPhongMaterial({ color: 0x333333 });
        this.turret = new THREE.Mesh(turretGeometry, turretMaterial);
        this.turret.position.y = 2.5;
        this.turret.castShadow = true;
        this.turret.receiveShadow = true;
        this.group.add(this.turret);
        
        this.modelLoaded = true;
    }
    
    update(keys) {
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
        
        this.velocity.y -= this.gravity;
        
        if (keys[' '] && this.position.y <= 0.1) {
            this.velocity.y = this.jumpForce;
        }
        
        this.position.add(this.velocity);
        
        if (this.position.y < 0) {
            this.position.y = 0;
            this.velocity.y = 0;
        }
        
        this.group.position.copy(this.position);
        this.group.rotation.y = this.rotation;
    }
    
    updateTurret(mouseX, mouseY) {
        const center = window.innerWidth / 2;
        const offset = mouseX - center;
        this.turretRotation = (offset / center) * 0.3;
        
        const centerY = window.innerHeight / 2;
        const offsetY = mouseY - centerY;
        this.turretPitch = (offsetY / centerY) * 0.3;
    }
    
    fire() {
        const projectile = new Projectile(this.position.clone().add(new THREE.Vector3(0, 5, 0)), new THREE.Vector3(1, 0, 0));
        projectiles.push(projectile);
        scene.add(projectile.mesh);
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
        this.lifespan = 300;
    }
    
    update() {
        this.velocity.y -= 0.05;
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
    
    for (let i = projectiles.length - 1; i >= 0; i--) {
        projectiles[i].update();
        if (projectiles[i].lifespan <= 0 || projectiles[i].mesh.position.y < -50) {
            scene.remove(projectiles[i].mesh);
            projectiles.splice(i, 1);
        }
    }
    
    const cameraOffset = new THREE.Vector3(0, 15, -25);
    cameraOffset.applyAxisAngle(new THREE.Vector3(0, 1, 0), tank.rotation);
    camera.position.lerp(tank.position.clone().add(cameraOffset), 0.1);
    camera.lookAt(tank.position.clone().add(new THREE.Vector3(0, 5, 0)));
    
    document.getElementById('pos').textContent = 
        `${tank.position.x.toFixed(1)}, ${tank.position.y.toFixed(1)}, ${tank.position.z.toFixed(1)}`;
    document.getElementById('rot').textContent = 
        `${(tank.rotation * 180 / Math.PI).toFixed(0)}°`;
    
    if (tank.modelLoaded) {
        document.getElementById('status').textContent = '✅ Tank Loaded';
    }
    
    renderer.render(scene, camera);
}

animate();
