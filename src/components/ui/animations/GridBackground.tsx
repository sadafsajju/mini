'use client';

import { useEffect, useRef } from 'react';

export function AnimatedGridBackground() {
  const canvasRef = useRef<HTMLCanvasElement>(null);

  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;

    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    // Set canvas dimensions to match window size
    const resizeCanvas = () => {
      canvas.width = window.innerWidth;
      canvas.height = window.innerHeight;
    };
    
    resizeCanvas();
    window.addEventListener('resize', resizeCanvas);

    // Grid configuration
    const gridSize = 80; // Size of each grid cell - INCREASED
    const lineWidth = 1;
    const lineColor = 'rgba(34, 197, 94, 0.2)'; // Green with opacity
    
    // Center of the screen
    const centerX = canvas.width / 2;
    const centerY = canvas.height / 2;
    
    // Align center to nearest grid intersection
    const gridCenterX = Math.round(centerX / gridSize) * gridSize;
    const gridCenterY = Math.round(centerY / gridSize) * gridSize;
    
    // Beam configuration
    const beamCount = 8; // Number of energy beams
    const beamWidth = 4; // Increased beam width for larger grid
    const beamSpeed = 3.5; // Increased speed for larger grid
    
    // Class to represent an energy beam
    class EnergyBeam {
      currentX: number;
      currentY: number;
      targetX: number;
      targetY: number;
      direction: string;
      trail: {x: number, y: number}[];
      trailLength: number;
      active: boolean;
      reachedCenter: boolean;
      intensity: number; // 0-1 for gradient intensity
      willFizzle: boolean;
      fizzleDistance: number;
      pulsePhase: number;
      pulseSpeed: number;
      private canvasRef: HTMLCanvasElement;
      private gridSizeRef: number;
      private gridCenterXRef: number;
      private gridCenterYRef: number;
      
      constructor(startX: number, startY: number, trailLength: number, canvas: HTMLCanvasElement, gridSize: number, gridCenterX: number, gridCenterY: number) {
        this.canvasRef = canvas;
        this.gridSizeRef = gridSize;
        this.gridCenterXRef = gridCenterX;
        this.gridCenterYRef = gridCenterY;
        // Position the beam at a grid intersection point
        this.currentX = startX;
        this.currentY = startY;
        this.targetX = startX;
        this.targetY = startY;
        this.direction = 'right'; // Initial direction
        this.trail = [];
        this.trailLength = trailLength;
        this.active = true;
        this.reachedCenter = false;
        this.intensity = 0.5 + Math.random() * 0.5; // Randomize intensity a bit
        
        // Initialize the trail
        this.trail.push({x: this.currentX, y: this.currentY});
        
        // Set first target
        const target = this.getNextTarget();
        this.targetX = target.x;
        this.targetY = target.y;
        
        // Random chance to fizzle out before reaching center
        this.willFizzle = Math.random() < 0.4; // 40% chance to fizzle out
        this.fizzleDistance = this.gridSizeRef * (2 + Math.floor(Math.random() * 7)); // Fizzle at random distance from center - adjusted for larger grid
        
        // Pulse animation properties
        this.pulsePhase = Math.random() * Math.PI * 2; // Random starting phase
        this.pulseSpeed = 0.03 + Math.random() * 0.02; // Random pulse speed (slow)
      }
      
      // Find next target that moves toward the center
      getNextTarget() {
        // Calculate available grid intersections
        const maxX = Math.floor(this.canvasRef.width / this.gridSizeRef) * this.gridSizeRef;
        const maxY = Math.floor(this.canvasRef.height / this.gridSizeRef) * this.gridSizeRef;
        
        // Determine which directions would move us closer to the center
        const moveTowardsCenter = [];
        
        // Check horizontal movement
        if (this.currentX < this.gridCenterXRef) {
          moveTowardsCenter.push('right');
        } else if (this.currentX > this.gridCenterXRef) {
          moveTowardsCenter.push('left');
        }
        
        // Check vertical movement
        if (this.currentY < this.gridCenterYRef) {
          moveTowardsCenter.push('down');
        } else if (this.currentY > this.gridCenterYRef) {
          moveTowardsCenter.push('up');
        }
        
        // If we've reached the center on one axis, we can only move on the other
        if (this.currentX === this.gridCenterXRef && this.currentY === this.gridCenterYRef) {
          // At center, prepare to deactivate
          this.reachedCenter = true;
          return { x: this.currentX, y: this.currentY };
        }
        
        // Determine possible next directions based on current direction and grid
        const possibleDirections = [];
        
        // First prioritize directions that move towards center
        for (const dir of moveTowardsCenter) {
          // Make sure the move is valid (not off grid)
          if ((dir === 'right' && this.currentX < maxX) ||
              (dir === 'left' && this.currentX > 0) ||
              (dir === 'down' && this.currentY < maxY) ||
              (dir === 'up' && this.currentY > 0)) {
            possibleDirections.push(dir);
          }
        }
        
        // If no good moves toward center, add alternatives
        if (possibleDirections.length === 0) {
          // Add any valid moves
          if (this.currentX < maxX) possibleDirections.push('right');
          if (this.currentX > 0) possibleDirections.push('left');
          if (this.currentY < maxY) possibleDirections.push('down');
          if (this.currentY > 0) possibleDirections.push('up');
        }
        
        // Choose a direction with bias toward moving to center
        let nextDirection;
        
        // Higher chance of choosing a direction that moves toward center
        const centerBias = 0.7;
        
        if (moveTowardsCenter.length > 0 && Math.random() < centerBias) {
          // Choose from directions that move toward center
          nextDirection = moveTowardsCenter[Math.floor(Math.random() * moveTowardsCenter.length)];
          
          // Ensure this is a valid move
          if ((nextDirection === 'right' && this.currentX >= maxX) ||
              (nextDirection === 'left' && this.currentX <= 0) ||
              (nextDirection === 'down' && this.currentY >= maxY) ||
              (nextDirection === 'up' && this.currentY <= 0)) {
            // Invalid move, choose randomly from all possible directions
            nextDirection = possibleDirections[Math.floor(Math.random() * possibleDirections.length)];
          }
        } else {
          // Choose randomly from all possible directions
          nextDirection = possibleDirections[Math.floor(Math.random() * possibleDirections.length)];
        }
        
        // Set the next target based on the chosen direction
        let nextX = this.currentX;
        let nextY = this.currentY;
        
        switch (nextDirection) {
          case 'right':
            nextX = Math.min(maxX, this.currentX + gridSize);
            break;
          case 'down':
            nextY = Math.min(maxY, this.currentY + gridSize);
            break;
          case 'left':
            nextX = Math.max(0, this.currentX - gridSize);
            break;
          case 'up':
            nextY = Math.max(0, this.currentY - gridSize);
            break;
        }
        
        // Update the direction
        this.direction = nextDirection || 'right';
        
        return { x: nextX, y: nextY };
      }
      
      // Update beam position and trail
      update() {
        if (!this.active) return;
        
        // If we've reached the center, reduce trail and eventually deactivate
        if (this.reachedCenter) {
          if (this.trail.length > 0) {
            this.trail.pop(); // Remove the tail end of the trail
          } else {
            this.active = false; // No more trail, deactivate
          }
          return;
        }
        
        // Update pulse phase
        this.pulsePhase += this.pulseSpeed;
        if (this.pulsePhase > Math.PI * 2) {
          this.pulsePhase -= Math.PI * 2;
        }
        
        // Move toward the target
        const dx = this.targetX - this.currentX;
        const dy = this.targetY - this.currentY;
        const distance = Math.sqrt(dx * dx + dy * dy);
        
        // Check if beam should fizzle out based on distance to center
        if (this.willFizzle) {
          const distanceToCenter = Math.sqrt(
            Math.pow(this.currentX - gridCenterX, 2) + 
            Math.pow(this.currentY - gridCenterY, 2)
          );
          
          if (distanceToCenter < this.fizzleDistance) {
            // Start fizzling out
            if (this.trail.length > 0) {
              this.trail.pop(); // Remove the tail end of the trail
              // Speed up the fading out based on how close to fizzleDistance
              if (Math.random() < 0.3) this.trail.pop(); // Occasionally remove an extra segment
              if (this.trail.length <= 5) this.active = false; // Deactivate when trail is very short
            } else {
              this.active = false;
            }
            return;
          }
        }
        
        if (distance < beamSpeed) {
          // Reached the target, set a new one
          this.currentX = this.targetX;
          this.currentY = this.targetY;
          
          // Check if we've reached the center
          if (this.currentX === gridCenterX && this.currentY === gridCenterY) {
            this.reachedCenter = true;
          } else {
            const newTarget = this.getNextTarget();
            this.targetX = newTarget.x;
            this.targetY = newTarget.y;
          }
        } else {
          // Move toward the target
          const ratio = beamSpeed / distance;
          this.currentX += dx * ratio;
          this.currentY += dy * ratio;
        }
        
        // Update trail
        this.trail.unshift({ x: this.currentX, y: this.currentY });
        if (this.trail.length > this.trailLength) {
          this.trail.pop();
        }
      }
      
      // Draw the beam and its trail
      draw(ctx: CanvasRenderingContext2D) {
        if (!this.active || this.trail.length < 2) return;
        
        // Calculate opacity based on distance to center
        const distanceToCenter = Math.sqrt(
          Math.pow(this.currentX - gridCenterX, 2) + 
          Math.pow(this.currentY - gridCenterY, 2)
        );
        
        // Maximum distance to consider for opacity calculation (3 grid cells - adjusted for larger grid)
        const maxFadeDistance = gridSize * 3;
        
        // Calculate opacity factor (1 = full opacity, 0 = transparent)
        // Opacity decreases as beam gets closer to center
        let opacityFactor = Math.min(1, distanceToCenter / maxFadeDistance);
        opacityFactor = Math.max(0, opacityFactor); // Ensure it's not negative
        
        // If very close to center, accelerate the fade out
        if (distanceToCenter < gridSize) {
          opacityFactor *= distanceToCenter / gridSize;
        }
        
        // Apply intensity to the opacity factor
        opacityFactor *= this.intensity;
        
        // Draw beam trail with gradient
        if (this.trail.length > 1) {
          // Create gradient that fades along the trail
          const gradient = ctx.createLinearGradient(
            this.trail[0].x, this.trail[0].y, 
            this.trail[this.trail.length - 1].x, this.trail[this.trail.length - 1].y
          );
          
          gradient.addColorStop(0, `rgba(34, 197, 94, ${0.7 * opacityFactor})`);
          gradient.addColorStop(0.4, `rgba(34, 197, 94, ${0.4 * opacityFactor})`);
          gradient.addColorStop(1, `rgba(34, 197, 94, 0)`);
          
          ctx.beginPath();
          ctx.lineWidth = 2;
          ctx.strokeStyle = gradient;
          ctx.moveTo(this.trail[0].x, this.trail[0].y);
          
          for (let i = 1; i < this.trail.length; i++) {
            ctx.lineTo(this.trail[i].x, this.trail[i].y);
          }
          
          ctx.stroke();
        }
        
        // Only draw the beam head if it has some opacity
        if (opacityFactor > 0.05) {
          // Calculate pulse factor (varies between 0.7 and 1.3)
          const pulseFactor = 1 + 0.3 * Math.sin(this.pulsePhase);
          
          // Pulse affects both size and brightness
          const pulseWidth = beamWidth * pulseFactor;
          const pulseOpacity = opacityFactor * (0.8 + 0.2 * Math.sin(this.pulsePhase));
          
          // Draw beam head with pulsing effect
          ctx.beginPath();
          ctx.fillStyle = `rgba(34, 197, 94, ${pulseOpacity * 0.8})`;
          ctx.arc(this.currentX, this.currentY, pulseWidth, 0, Math.PI * 2);
          ctx.fill();
          
          // Add glow effect to the beam head (also pulsing)
          const glowRange = pulseFactor * 2; // Larger pulse effect on the glow
          const headGradient = ctx.createRadialGradient(
            this.currentX, this.currentY, pulseWidth/2,
            this.currentX, this.currentY, pulseWidth*glowRange
          );
          headGradient.addColorStop(0, `rgba(34, 197, 94, ${0.6 * pulseOpacity})`);
          headGradient.addColorStop(1, 'rgba(34, 197, 94, 0)');
          
          ctx.beginPath();
          ctx.fillStyle = headGradient;
          ctx.arc(this.currentX, this.currentY, pulseWidth*glowRange, 0, Math.PI * 2);
          ctx.fill();
        }
      }
    }
    
    // Create a collection of energy beams
    const beams: EnergyBeam[] = [];
    
    // Function to create a new beam at a random edge position
    const createBeam = () => {
      // Calculate the maximum grid positions
      const maxX = Math.floor(canvas.width / gridSize) * gridSize;
      const maxY = Math.floor(canvas.height / gridSize) * gridSize;
      
      // Choose edge: 0 = top, 1 = right, 2 = bottom, 3 = left
      const edge = Math.floor(Math.random() * 4);
      let x, y;
      
      switch (edge) {
        case 0: // Top edge
          x = Math.floor(Math.random() * (maxX / gridSize + 1)) * gridSize;
          y = 0;
          break;
        case 1: // Right edge
          x = maxX;
          y = Math.floor(Math.random() * (maxY / gridSize + 1)) * gridSize;
          break;
        case 2: // Bottom edge
          x = Math.floor(Math.random() * (maxX / gridSize + 1)) * gridSize;
          y = maxY;
          break;
        case 3: // Left edge
          x = 0;
          y = Math.floor(Math.random() * (maxY / gridSize + 1)) * gridSize;
          break;
        default:
          x = 0;
          y = 0;
      }
      
      // Create a new beam with random trail length between 25-45 (adjusted for larger grid)
      const trailLength = 25 + Math.floor(Math.random() * 20);
      const beam = new EnergyBeam(x, y, trailLength, canvas, gridSize, gridCenterX, gridCenterY);
      beams.push(beam);
    };
    
    // Initially create several beams
    for (let i = 0; i < beamCount; i++) {
      createBeam();
    }
    
    // Timer for periodically creating new beams
    let lastBeamCreated = Date.now();
    const beamCreationInterval = 2000; // Create a new beam every 2 seconds
    
    // Animation function
    const animate = () => {
      // Clear the canvas
      ctx.clearRect(0, 0, canvas.width, canvas.height);
      
      // Draw static grid
      ctx.beginPath();
      ctx.lineWidth = lineWidth;
      ctx.strokeStyle = lineColor;
      
      // Vertical lines
      for (let x = 0; x <= canvas.width; x += gridSize) {
        ctx.moveTo(x, 0);
        ctx.lineTo(x, canvas.height);
      }
      
      // Horizontal lines
      for (let y = 0; y <= canvas.height; y += gridSize) {
        ctx.moveTo(0, y);
        ctx.lineTo(canvas.width, y);
      }
      
      ctx.stroke();
      
      // Update and draw all beams
      for (let i = beams.length - 1; i >= 0; i--) {
        beams[i].update();
        beams[i].draw(ctx);
        
        // Remove inactive beams
        if (!beams[i].active) {
          beams.splice(i, 1);
        }
      }
      
      // Check if we need to create a new beam
      const now = Date.now();
      if (now - lastBeamCreated > beamCreationInterval) {
        createBeam();
        lastBeamCreated = now;
      }
      
      // Make sure we maintain a minimum number of beams
      if (beams.length < beamCount / 2) {
        createBeam();
        lastBeamCreated = now;
      }
      
      requestAnimationFrame(animate);
    };
    
    // Start the animation
    animate();
    
    return () => {
      window.removeEventListener('resize', resizeCanvas);
    };
  }, []);

  return (
    <canvas 
      ref={canvasRef} 
      className="absolute inset-0 -z-10"
    />
  );
}

export default function GridBackground() {
  return (
    <div className="absolute inset-0 overflow-hidden -z-10">
      <AnimatedGridBackground />
    </div>
  );
}