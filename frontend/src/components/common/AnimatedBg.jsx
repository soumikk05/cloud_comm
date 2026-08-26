import { useEffect, useState, useRef } from 'react';
import { motion } from 'motion/react';
import { gsap } from 'gsap';
import { useGSAP } from '@gsap/react';

gsap.registerPlugin(useGSAP);
import './AnimatedBg.css';

function CanvasParticles() {
  const canvasRef = useRef(null);

  useEffect(() => {
    const canvas = canvasRef.current;
    const ctx = canvas.getContext('2d');
    let animationFrameId;
    let particles = [];
    let w = window.innerWidth;
    let h = window.innerHeight;

    const resize = () => {
      w = window.innerWidth;
      h = window.innerHeight;
      canvas.width = w;
      canvas.height = h;
    };
    
    window.addEventListener('resize', resize);
    resize();

    class Particle {
      constructor() {
        this.x = Math.random() * w;
        this.y = Math.random() * h;
        this.size = Math.random() * 2 + 0.5;
        this.speedY = Math.random() * 0.5 + 0.1;
        this.speedX = (Math.random() - 0.5) * 0.3;
        this.opacity = Math.random() * 0.5 + 0.1;
        // Cyan and emerald colors
        this.color = Math.random() > 0.5 ? `rgba(34, 211, 238, ` : `rgba(52, 211, 153, `;
      }
      update() {
        this.y -= this.speedY;
        this.x += this.speedX;
        if (this.y < 0) {
          this.y = h;
          this.x = Math.random() * w;
        }
        if (this.x > w || this.x < 0) {
          this.speedX = -this.speedX;
        }
      }
      draw() {
        ctx.fillStyle = this.color + this.opacity + ')';
        ctx.beginPath();
        ctx.arc(this.x, this.y, this.size, 0, Math.PI * 2);
        ctx.fill();
        
        // Glow effect for slightly larger particles
        if (this.size > 1.5) {
          ctx.shadowBlur = 10;
          ctx.shadowColor = this.color + '1)';
        } else {
          ctx.shadowBlur = 0;
        }
      }
    }

    const init = () => {
      particles = [];
      const particleCount = Math.floor((w * h) / 15000); // Responsive count
      for (let i = 0; i < particleCount; i++) {
        particles.push(new Particle());
      }
    };

    const animate = () => {
      ctx.clearRect(0, 0, w, h);
      for (let i = 0; i < particles.length; i++) {
        particles[i].update();
        particles[i].draw();
      }
      animationFrameId = requestAnimationFrame(animate);
    };

    init();
    animate();

    return () => {
      window.removeEventListener('resize', resize);
      cancelAnimationFrame(animationFrameId);
    };
  }, []);

  return <canvas ref={canvasRef} className="absolute inset-0 z-0 pointer-events-none opacity-60" />;
}

/**
 * High-performance React Motion background with floating gradient orbs,
 * mouse parallax reaction, cyber laser scanning sweep, and flying particles.
 */
export function AnimatedBg() {
  const bgRef = useRef(null);
  const orb1Ref = useRef(null);
  const orb2Ref = useRef(null);

  useGSAP(() => {
    // High performance mouse tracking without React re-renders
    const xTo1 = gsap.quickTo(orb1Ref.current, 'x', { duration: 0.6, ease: 'power3' });
    const yTo1 = gsap.quickTo(orb1Ref.current, 'y', { duration: 0.6, ease: 'power3' });
    
    const xTo2 = gsap.quickTo(orb2Ref.current, 'x', { duration: 0.8, ease: 'power3' });
    const yTo2 = gsap.quickTo(orb2Ref.current, 'y', { duration: 0.8, ease: 'power3' });

    const handleMouseMove = (e) => {
      const { clientWidth, clientHeight } = document.documentElement;
      const x = (e.clientX / clientWidth - 0.5) * 80;
      const y = (e.clientY / clientHeight - 0.5) * 80;
      xTo1(x);
      yTo1(y);
      xTo2(-x * 1.2);
      yTo2(-y * 1.2);
    };

    window.addEventListener('mousemove', handleMouseMove, { passive: true });
    return () => window.removeEventListener('mousemove', handleMouseMove);
  }, { scope: bgRef });

  return (
    <div ref={bgRef} className="animated-bg" aria-hidden="true">
      {/* Cyber Circuit SVG */}
      <svg className="animated-bg__circuit" viewBox="0 0 100 100" preserveAspectRatio="none">
        <defs>
          <linearGradient id="circuitGrad" x1="0%" y1="0%" x2="100%" y2="100%">
            <stop offset="0%" stopColor="rgba(14, 165, 233, 0.4)" />
            <stop offset="100%" stopColor="rgba(139, 92, 246, 0.4)" />
          </linearGradient>
        </defs>
        {[
          "M-10,20 L30,20 L40,30 L110,30",
          "M-10,80 L20,80 L35,65 L110,65",
          "M40,-10 L40,40 L60,60 L60,110",
          "M70,-10 L70,30 L85,45 L110,45",
          "M20,110 L20,70 L10,60 L-10,60",
          "M80,110 L80,90 L90,80 L110,80"
        ].map((path, i) => (
          <motion.path
            key={i}
            d={path}
            fill="none"
            stroke="url(#circuitGrad)"
            strokeWidth="0.2"
            initial={{ pathLength: 0, opacity: 0 }}
            animate={{ 
              pathLength: [0, 1, 1],
              opacity: [0, 1, 0]
            }}
            transition={{
              duration: 4 + i,
              repeat: Infinity,
              ease: "linear",
              delay: i * 0.8
            }}
          />
        ))}
      </svg>

      <div className="animated-bg__grid" />

      {/* Orbs now use CSS animations for the infinite float, and GSAP quickTo for mouse parallax */}
      <div
        ref={orb1Ref}
        className="animated-bg__orb animated-bg__orb--1 float-anim-1"
      />
      <div
        ref={orb2Ref}
        className="animated-bg__orb animated-bg__orb--2 float-anim-2"
      />
      <div
        className="animated-bg__orb animated-bg__orb--3 float-anim-3"
      />
      <div
        className="animated-bg__orb animated-bg__orb--4 float-anim-4"
      />

      <CanvasParticles />

      <motion.div
        className="animated-bg__scanline"
        animate={{ top: ['-5%', '105%'], opacity: [0, 0.7, 0.7, 0] }}
        transition={{ duration: 6, repeat: Infinity, ease: 'linear' }}
      />

      <div className="animated-bg__noise" />
    </div>
  );
}

/**
 * Word-by-word staggered text reveal using GSAP and useGSAP.
 */
export function AnimatedText({ text, className = '', delay = 0 }) {
  const containerRef = useRef(null);
  const words = text.split(' ');

  useGSAP(() => {
    gsap.from('.anim-word-gsap', {
      y: 15,
      opacity: 0,
      filter: 'blur(4px)',
      duration: 0.6,
      stagger: 0.05,
      delay: delay,
      ease: 'back.out(1.7)',
    });
  }, { scope: containerRef });

  return (
    <span ref={containerRef} className={`animated-text ${className}`}>
      {words.map((word, index) => (
        <span
          key={index}
          className="anim-word-gsap"
          style={{ display: 'inline-block', marginRight: '0.28em' }}
        >
          {word}
        </span>
      ))}
    </span>
  );
}

/**
 * Animated number counter using requestAnimationFrame.
 */
export function AnimatedCounter({ value, duration = 1.4, decimals = 0, className = '' }) {
  const [displayValue, setDisplayValue] = useState(0);

  useEffect(() => {
    let startTimestamp = null;
    const target = Number(value) || 0;
    const durationMs = duration * 1000;
    let frameId;

    const step = (timestamp) => {
      if (!startTimestamp) startTimestamp = timestamp;
      const progress = Math.min((timestamp - startTimestamp) / durationMs, 1);
      const eased = progress === 1 ? 1 : 1 - Math.pow(2, -10 * progress);
      const current = eased * target;

      setDisplayValue(decimals > 0 ? Number(current.toFixed(decimals)) : Math.round(current));

      if (progress < 1) {
        frameId = requestAnimationFrame(step);
      } else {
        setDisplayValue(decimals > 0 ? Number(target.toFixed(decimals)) : target);
      }
    };

    frameId = requestAnimationFrame(step);
    return () => cancelAnimationFrame(frameId);
  }, [value, duration, decimals]);

  return <span className={className}>{displayValue}</span>;
}
