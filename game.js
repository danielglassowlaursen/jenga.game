// Animal Jenga Game with Three.js

class AnimalJengaGame {
    constructor() {
        this.scene = null;
        this.camera = null;
        this.renderer = null;
        this.blocks = [];
        this.removedBlocks = 0;
        this.isAnimating = false;
        this.raycaster = new THREE.Raycaster();
        this.mouse = new THREE.Vector2();

        // Animal types with special effects
        this.animalTypes = [
            { name: 'Elephant', emoji: '🐘', color: 0x808080, effect: 'shake' },
            { name: 'Cat', emoji: '🐱', color: 0xFFA500, effect: 'smooth' },
            { name: 'Dragon', emoji: '🐉', color: 0xFF0000, effect: 'fire' },
            { name: 'Cow', emoji: '💨', color: 0xFFFFFF, effect: 'fart' },
            { name: 'Tiger', emoji: '⚡', color: 0xFFD700, effect: 'lightning' },
            { name: 'Frog', emoji: '🐸', color: 0x00FF00, effect: 'bounce' },
            { name: 'Eagle', emoji: '🦅', color: 0x8B4513, effect: 'wind' },
            { name: 'Turtle', emoji: '🐢', color: 0x006400, effect: 'slow' }
        ];

        this.init();
        this.createTower();
        this.animate();
        this.setupEventListeners();
    }

    init() {
        // Scene setup
        this.scene = new THREE.Scene();
        this.scene.background = new THREE.Color(0x87CEEB);

        // Camera setup
        this.camera = new THREE.PerspectiveCamera(
            75,
            window.innerWidth / window.innerHeight,
            0.1,
            1000
        );
        this.camera.position.set(10, 15, 20);
        this.camera.lookAt(0, 8, 0);

        // Renderer setup
        const canvas = document.getElementById('game-canvas');
        this.renderer = new THREE.WebGLRenderer({ canvas, antialias: true });
        this.renderer.setSize(window.innerWidth, window.innerHeight);
        this.renderer.shadowMap.enabled = true;

        // Lighting
        const ambientLight = new THREE.AmbientLight(0xffffff, 0.6);
        this.scene.add(ambientLight);

        const directionalLight = new THREE.DirectionalLight(0xffffff, 0.8);
        directionalLight.position.set(10, 20, 10);
        directionalLight.castShadow = true;
        this.scene.add(directionalLight);

        // Ground
        const groundGeometry = new THREE.PlaneGeometry(50, 50);
        const groundMaterial = new THREE.MeshStandardMaterial({
            color: 0x228B22,
            roughness: 0.8
        });
        const ground = new THREE.Mesh(groundGeometry, groundMaterial);
        ground.rotation.x = -Math.PI / 2;
        ground.receiveShadow = true;
        this.scene.add(ground);
    }

    createTower() {
        this.blocks = [];
        const blockWidth = 1;
        const blockHeight = 0.6;
        const blockDepth = 3;
        const levels = 12;

        for (let level = 0; level < levels; level++) {
            const isRotated = level % 2 === 0;
            const blocksPerLevel = 3;
            const y = level * blockHeight + blockHeight / 2;

            for (let i = 0; i < blocksPerLevel; i++) {
                const animal = this.animalTypes[Math.floor(Math.random() * this.animalTypes.length)];

                let x, z, rotationY;
                if (isRotated) {
                    x = (i - 1) * blockWidth;
                    z = 0;
                    rotationY = 0;
                } else {
                    x = 0;
                    z = (i - 1) * blockWidth;
                    rotationY = Math.PI / 2;
                }

                const geometry = new THREE.BoxGeometry(blockDepth, blockHeight, blockWidth);
                const material = new THREE.MeshStandardMaterial({
                    color: animal.color,
                    roughness: 0.5,
                    metalness: 0.2
                });
                const block = new THREE.Mesh(geometry, material);

                block.position.set(x, y, z);
                block.rotation.y = rotationY;
                block.castShadow = true;
                block.receiveShadow = true;

                // Store animal data
                block.userData = {
                    animal: animal,
                    level: level,
                    isRemoved: false,
                    velocity: new THREE.Vector3(0, 0, 0),
                    angularVelocity: new THREE.Vector3(0, 0, 0)
                };

                this.blocks.push(block);
                this.scene.add(block);
            }
        }
    }

    setupEventListeners() {
        // Mouse click
        window.addEventListener('click', (e) => this.onMouseClick(e), false);

        // Window resize
        window.addEventListener('resize', () => {
            this.camera.aspect = window.innerWidth / window.innerHeight;
            this.camera.updateProjectionMatrix();
            this.renderer.setSize(window.innerWidth, window.innerHeight);
        }, false);

        // Reset button
        document.getElementById('reset-btn').addEventListener('click', () => {
            this.resetGame();
        });
    }

    onMouseClick(event) {
        if (this.isAnimating) return;

        // Calculate mouse position in normalized device coordinates
        this.mouse.x = (event.clientX / window.innerWidth) * 2 - 1;
        this.mouse.y = -(event.clientY / window.innerHeight) * 2 + 1;

        // Update the picking ray
        this.raycaster.setFromCamera(this.mouse, this.camera);

        // Get active blocks (not removed)
        const activeBlocks = this.blocks.filter(b => !b.userData.isRemoved);
        const intersects = this.raycaster.intersectObjects(activeBlocks);

        if (intersects.length > 0) {
            const clickedBlock = intersects[0].object;
            this.removeBlock(clickedBlock);
        }
    }

    removeBlock(block) {
        if (block.userData.isRemoved) return;

        this.isAnimating = true;
        block.userData.isRemoved = true;
        this.removedBlocks++;

        // Update score
        document.getElementById('blocks-removed').textContent = this.removedBlocks;

        // Display animal effect
        this.showEffect(block.userData.animal);

        // Apply special effect
        this.applySpecialEffect(block);

        // Animate block removal
        this.animateBlockRemoval(block);
    }

    showEffect(animal) {
        const effectDisplay = document.getElementById('effect-display');
        effectDisplay.innerHTML = `
            <div>${animal.emoji}</div>
            <div style="font-size: 0.5em;">${animal.name} Power!</div>
        `;

        setTimeout(() => {
            effectDisplay.innerHTML = '';
        }, 1500);
    }

    applySpecialEffect(block) {
        const effect = block.userData.animal.effect;

        switch(effect) {
            case 'shake':
                this.shakeAllBlocks();
                break;
            case 'smooth':
                // Smooth removal - no additional effect
                this.updateStatus('😸 Smooth and stealthy!');
                break;
            case 'fire':
                this.fireBlast(block);
                break;
            case 'fart':
                this.fartEffect();
                break;
            case 'lightning':
                this.lightningStrike();
                break;
            case 'bounce':
                this.bounceBlocks();
                break;
            case 'wind':
                this.windGust();
                break;
            case 'slow':
                this.updateStatus('🐢 Slow and steady wins the race!');
                break;
        }
    }

    shakeAllBlocks() {
        this.updateStatus('🐘 EARTHQUAKE! Everything shakes!');
        this.blocks.forEach(block => {
            if (!block.userData.isRemoved) {
                block.userData.velocity.x += (Math.random() - 0.5) * 0.3;
                block.userData.velocity.z += (Math.random() - 0.5) * 0.3;
            }
        });
    }

    fireBlast(sourceBlock) {
        this.updateStatus('🔥 FIRE BLAST!');
        this.scene.background = new THREE.Color(0xFF6600);

        setTimeout(() => {
            this.scene.background = new THREE.Color(0x87CEEB);
        }, 300);

        // Push nearby blocks
        this.blocks.forEach(block => {
            if (!block.userData.isRemoved && block !== sourceBlock) {
                const distance = block.position.distanceTo(sourceBlock.position);
                if (distance < 5) {
                    const direction = new THREE.Vector3()
                        .subVectors(block.position, sourceBlock.position)
                        .normalize();
                    block.userData.velocity.add(direction.multiplyScalar(0.2));
                }
            }
        });
    }

    fartEffect() {
        this.updateStatus('💨 FART POWER! *poot*');
        this.blocks.forEach(block => {
            if (!block.userData.isRemoved) {
                block.userData.velocity.y += 0.1;
                block.userData.angularVelocity.x += (Math.random() - 0.5) * 0.1;
                block.userData.angularVelocity.z += (Math.random() - 0.5) * 0.1;
            }
        });
    }

    lightningStrike() {
        this.updateStatus('⚡ LIGHTNING STRIKE!');
        this.scene.background = new THREE.Color(0xFFFFFF);

        setTimeout(() => {
            this.scene.background = new THREE.Color(0xFFFF00);
            setTimeout(() => {
                this.scene.background = new THREE.Color(0x87CEEB);
            }, 100);
        }, 100);

        // Random block gets zapped
        const activeBlocks = this.blocks.filter(b => !b.userData.isRemoved);
        if (activeBlocks.length > 0) {
            const randomBlock = activeBlocks[Math.floor(Math.random() * activeBlocks.length)];
            randomBlock.userData.velocity.y += 0.3;
            randomBlock.userData.angularVelocity.set(
                Math.random() - 0.5,
                Math.random() - 0.5,
                Math.random() - 0.5
            );
        }
    }

    bounceBlocks() {
        this.updateStatus('🐸 BOUNCE! Boing boing!');
        this.blocks.forEach(block => {
            if (!block.userData.isRemoved) {
                block.userData.velocity.y += 0.15;
            }
        });
    }

    windGust() {
        this.updateStatus('🦅 WIND GUST! Whoooosh!');
        const direction = new THREE.Vector3(
            Math.random() - 0.5,
            0,
            Math.random() - 0.5
        ).normalize();

        this.blocks.forEach(block => {
            if (!block.userData.isRemoved) {
                block.userData.velocity.add(direction.clone().multiplyScalar(0.15));
            }
        });
    }

    updateStatus(message) {
        document.getElementById('status').textContent = message;
        setTimeout(() => {
            document.getElementById('status').textContent = 'Click on a block to pull it!';
        }, 2000);
    }

    animateBlockRemoval(block) {
        const startY = block.position.y;
        const endY = startY - 5;
        const duration = 1000;
        const startTime = Date.now();

        const animateDown = () => {
            const elapsed = Date.now() - startTime;
            const progress = Math.min(elapsed / duration, 1);

            block.position.y = startY + (endY - startY) * progress;
            block.rotation.x += 0.05;
            block.rotation.z += 0.03;

            if (progress < 1) {
                requestAnimationFrame(animateDown);
            } else {
                this.scene.remove(block);
                this.isAnimating = false;
            }
        };

        animateDown();
    }

    animate() {
        requestAnimationFrame(() => this.animate());

        // Apply simple physics to blocks
        this.blocks.forEach(block => {
            if (!block.userData.isRemoved) {
                // Apply velocity
                block.position.add(block.userData.velocity);
                block.rotation.x += block.userData.angularVelocity.x;
                block.rotation.y += block.userData.angularVelocity.y;
                block.rotation.z += block.userData.angularVelocity.z;

                // Apply gravity
                block.userData.velocity.y -= 0.01;

                // Damping
                block.userData.velocity.multiplyScalar(0.95);
                block.userData.angularVelocity.multiplyScalar(0.95);

                // Collision with ground
                if (block.position.y < 0.3) {
                    block.position.y = 0.3;
                    block.userData.velocity.y = 0;
                }
            }
        });

        // Rotate camera slowly
        const time = Date.now() * 0.0001;
        this.camera.position.x = Math.cos(time) * 20;
        this.camera.position.z = Math.sin(time) * 20;
        this.camera.lookAt(0, 8, 0);

        this.renderer.render(this.scene, this.camera);
    }

    resetGame() {
        // Remove all blocks
        this.blocks.forEach(block => {
            this.scene.remove(block);
        });

        // Reset counters
        this.removedBlocks = 0;
        document.getElementById('blocks-removed').textContent = '0';
        document.getElementById('status').textContent = 'Click on a block to pull it!';

        // Create new tower
        this.createTower();
        this.isAnimating = false;
    }
}

// Start the game when the page loads
window.addEventListener('DOMContentLoaded', () => {
    new AnimalJengaGame();
});
