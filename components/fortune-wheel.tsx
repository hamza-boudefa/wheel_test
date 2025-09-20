"use client"

import { useState, useRef, useEffect } from "react"
import { Button } from "@/components/ui/button"
import { Card, CardContent } from "@/components/ui/card"
import { Triangle } from "lucide-react"

interface FortuneWheelProps {
    onSpin: (prize: string) => void
    disabled: boolean,
    getWonPrize:(wonPrize:any)=>void
}

const prizes = [ 
    { text: "ما في نصيب هل مرة", color: "#DC2626", textColor: "#FFFFFF", probability: 0.11 }, 
    { text: "$10", color: "#2563EB", textColor: "#FFFFFF", probability: 0.011 }, 
    { text: "ما في نصيب هل مرة", color: "#16A34A", textColor: "#FFFFFF", probability: 0.11 }, 
    { text: "$20", color: "#EAB308", textColor: "#FFFFFF", probability: 0.011 }, 
    { text: "$20", color: "#DC2626", textColor: "#FFFFFF", probability: 0.011 }, 
    { text: "$10", color: "#2563EB", textColor: "#FFFFFF", probability: 0.011 }, 
    { text: "$30", color: "#16A34A", textColor: "#FFFFFF", probability: 0.011 }, 
    { text: "$40", color: "#EAB308", textColor: "#FFFFFF", probability: 0.011 }, 
    { text: "$50", color: "#DC2626", textColor: "#FFFFFF", probability: 0.012 }, 
]

interface ConfettiPiece {
    id: number
    x: number
    y: number
    vx: number
    vy: number
    rotation: number
    rotationSpeed: number
    color: string
    shape: "circle" | "square" | "triangle" | "star"
    size: number
    opacity: number
}

interface Firework {
    id: number
    x: number
    y: number
    particles: Array<{
        x: number
        y: number
        vx: number
        vy: number
        color: string
        life: number
        maxLife: number
    }>
}

const rand = (m: number, M: number) => Math.random() * (M - m) + m

export default function FortuneWheel({ onSpin, disabled ,getWonPrize}: FortuneWheelProps) {
    const [isSpinning, setIsSpinning] = useState(false)
    const [ang, setAng] = useState(0)
    const [angVel, setAngVel] = useState(0)
    const [isAccelerating, setIsAccelerating] = useState(false)
    const [showCelebration, setShowCelebration] = useState(false)
    const [confetti, setConfetti] = useState<ConfettiPiece[]>([])
    const [fireworks, setFireworks] = useState<Firework[]>([])
    const [wonPrize, setWonPrize] = useState<string>("")
    const [screenShake, setScreenShake] = useState(false)
    
    // MODIFIED: State for controlling the spin
    const [spinTargetAng, setSpinTargetAng] = useState<number | null>(null);
    const [decelerationRate, setDecelerationRate] = useState<number>(0);

    const canvasRef = useRef<HTMLCanvasElement>(null)
    const celebrationRef = useRef<HTMLCanvasElement>(null)
    const animationRef = useRef<number>(0)
    const frameRef = useRef<number>(0)

    // Physics constants
    const tot = prizes.length
    const friction = 0.991
    const angVelMin = 0.002
    const PI = Math.PI
    const TAU = 2 * PI
    const arc = TAU / tot

    // Audio refs
    const audioContextRef = useRef<AudioContext | null>(null)
    const currentSoundRef = useRef<{ stop: () => void } | null>(null)
    const lastTickTimeRef = useRef<number>(0)

    const getIndex = () => Math.floor(tot - (ang / TAU) * tot) % tot

    // New function to select a prize based on probability
    const selectPrizeByProbability = () => {
        const rand = Math.random();
        let cumulativeProbability = 0;
        for (let i = 0; i < prizes.length; i++) {
            cumulativeProbability += prizes[i].probability;
            if (rand < cumulativeProbability) {
                return i;
            }
        }
        return prizes.length - 1; // Default to last prize if something goes wrong
    };
    
    useEffect(() => {
        drawWheel()
        initializeAudio()
    }, [])

    useEffect(() => {
        if (showCelebration) {
            createConfetti()
            createFireworks()
            animateEffects()
        } else {
            if (animationRef.current) {
                cancelAnimationFrame(animationRef.current)
            }
        }

        return () => {
            if (animationRef.current) {
                cancelAnimationFrame(animationRef.current)
            }
        }
    }, [showCelebration])

    const initializeAudio = () => {
        try {
            audioContextRef.current = new (window.AudioContext || (window as any).webkitAudioContext)()
        } catch (error) {
            console.log("Audio not supported:", error)
        }
    }

    const playTickSound = (velocity: number) => {
        try {
            if (!audioContextRef.current) return;
            const ctx = audioContextRef.current;
            const now = ctx.currentTime;
    
            const masterGain = ctx.createGain();
            masterGain.connect(ctx.destination);
            masterGain.gain.setValueAtTime(Math.min(0.3, 0.1 + velocity * 0.7), now);
            masterGain.gain.exponentialRampToValueAtTime(0.001, now + 0.15);
    
            const osc = ctx.createOscillator();
            const oscGain = ctx.createGain();
            
            osc.type = "sine";
            const baseFreq = 400 + velocity * 200;
            osc.frequency.setValueAtTime(baseFreq, now);
            osc.frequency.exponentialRampToValueAtTime(baseFreq * 0.7, now + 0.05);
            
            oscGain.gain.setValueAtTime(0.4, now);
            oscGain.gain.exponentialRampToValueAtTime(0.001, now + 0.1);
            
            osc.connect(oscGain);
            oscGain.connect(masterGain);
            osc.start(now);
            osc.stop(now + 0.15);
    
            const clickOsc = ctx.createOscillator();
            const clickGain = ctx.createGain();
            
            clickOsc.type = "square";
            clickOsc.frequency.setValueAtTime(1200 + velocity * 800, now);
            clickOsc.frequency.exponentialRampToValueAtTime(600, now + 0.05);
            
            clickGain.gain.setValueAtTime(0.2, now);
            clickGain.gain.exponentialRampToValueAtTime(0.001, now + 0.05);
            
            clickOsc.connect(clickGain);
            clickGain.connect(masterGain);
            clickOsc.start(now);
            clickOsc.stop(now + 0.1);
    
            const noiseBuffer = ctx.createBuffer(1, ctx.sampleRate * 0.1, ctx.sampleRate);
            const noiseData = noiseBuffer.getChannelData(0);
            for (let i = 0; i < noiseBuffer.length; i++) {
                noiseData[i] = Math.random() * 2 - 1;
            }
            
            const noise = ctx.createBufferSource();
            noise.buffer = noiseBuffer;
            
            const noiseGain = ctx.createGain();
            noiseGain.gain.setValueAtTime(0.15, now);
            noiseGain.gain.exponentialRampToValueAtTime(0.001, now + 0.08);
            
            const noiseFilter = ctx.createBiquadFilter();
            noiseFilter.type = "bandpass";
            noiseFilter.frequency.setValueAtTime(1500 + velocity * 1000, now);
            noiseFilter.Q.setValueAtTime(1.0, now);
            
            noise.connect(noiseFilter);
            noiseFilter.connect(noiseGain);
            noiseGain.connect(masterGain);
            
            noise.start(now);
            noise.stop(now + 0.1);
        } catch (error) {
            console.log("Could not play tick sound:", error);
        }
    };

    const stopSpinSound = () => {
        if (currentSoundRef.current) {
            currentSoundRef.current.stop()
            currentSoundRef.current = null
        }
    }

    const playWinSound = () => {
        try {
            const audioContext = new (window.AudioContext || (window as any).webkitAudioContext)()
            const playNote = (frequency: number, startTime: number, duration: number) => {
                const oscillator = audioContext.createOscillator()
                const gainNode = audioContext.createGain()
                oscillator.connect(gainNode)
                gainNode.connect(audioContext.destination)
                oscillator.frequency.setValueAtTime(frequency, audioContext.currentTime + startTime)
                gainNode.gain.setValueAtTime(0.1, audioContext.currentTime + startTime)
                gainNode.gain.exponentialRampToValueAtTime(0.01, audioContext.currentTime + startTime + duration)
                oscillator.type = "sine"
                oscillator.start(audioContext.currentTime + startTime)
                oscillator.stop(audioContext.currentTime + startTime + duration)
            }
            playNote(523, 0, 0.2)
            playNote(659, 0.2, 0.2)
            playNote(784, 0.4, 0.2)
            playNote(1047, 0.6, 0.4)
        } catch (error) {
            console.log("Could not play win sound:", error)
        }
    }

    const playNoWinSound = () => {
        try {
            const audioContext = new (window.AudioContext || (window as any).webkitAudioContext)()
            const oscillator = audioContext.createOscillator()
            const gainNode = audioContext.createGain()
            oscillator.connect(gainNode)
            gainNode.connect(audioContext.destination)
            oscillator.frequency.setValueAtTime(200, audioContext.currentTime)
            oscillator.frequency.exponentialRampToValueAtTime(100, audioContext.currentTime + 1)
            gainNode.gain.setValueAtTime(0.1, audioContext.currentTime)
            gainNode.gain.exponentialRampToValueAtTime(0.01, audioContext.currentTime + 1)
            oscillator.type = "sawtooth"
            oscillator.start()
            oscillator.stop(audioContext.currentTime + 1)
        } catch (error) {
            console.log("Could not play no-win sound:", error)
        }
    }

    const playClickSound = () => {
        try {
            const audioContext = new (window.AudioContext || (window as any).webkitAudioContext)()
            const oscillator = audioContext.createOscillator()
            const gainNode = audioContext.createGain()
            oscillator.connect(gainNode)
            gainNode.connect(audioContext.destination)
            oscillator.frequency.setValueAtTime(800, audioContext.currentTime)
            gainNode.gain.setValueAtTime(0.1, audioContext.currentTime)
            gainNode.gain.exponentialRampToValueAtTime(0.01, audioContext.currentTime + 0.1)
            oscillator.type = "square"
            oscillator.start()
            oscillator.stop(audioContext.currentTime + 0.1)
        } catch (error) {
            console.log("Could not play click sound:", error)
        }
    }

    const createConfetti = () => {
        const pieces: ConfettiPiece[] = []
        const colors = [
            "#84cc16",
            "#a3e635",
            "#65a30d",
            "#FFD700",
            "#FF6B6B",
            "#4ECDC4",
            "#45B7D1",
            "#96CEB4",
            "#FFEAA7",
            "#DDA0DD",
        ]
        const shapes: ("circle" | "square" | "triangle" | "star")[] = ["circle", "square", "triangle", "star"]

        for (let i = 0; i < 150; i++) {
            pieces.push({
                id: i,
                x: Math.random() * 400,
                y: -10,
                vx: (Math.random() - 0.5) * 12,
                vy: Math.random() * 4 + 3,
                rotation: Math.random() * 360,
                rotationSpeed: (Math.random() - 0.5) * 15,
                color: colors[Math.floor(Math.random() * colors.length)],
                shape: shapes[Math.floor(Math.random() * shapes.length)],
                size: Math.random() * 10 + 6,
                opacity: 1,
            })
        }
        setConfetti(pieces)
    }

    const createFireworks = () => {
        const newFireworks: Firework[] = []

        for (let i = 0; i < 5; i++) {
            const firework: Firework = {
                id: i,
                x: Math.random() * 400,
                y: Math.random() * 200 + 100,
                particles: [],
            }

            for (let j = 0; j < 20; j++) {
                const angle = (j / 20) * Math.PI * 2
                const speed = Math.random() * 3 + 2
                firework.particles.push({
                    x: firework.x,
                    y: firework.y,
                    vx: Math.cos(angle) * speed,
                    vy: Math.sin(angle) * speed,
                    color: `hsl(${Math.random() * 360}, 100%, 60%)`,
                    life: 60,
                    maxLife: 60,
                })
            }

            newFireworks.push(firework)
        }
        setFireworks(newFireworks)
    }

    const animateEffects = () => {
        const canvas = celebrationRef.current
        if (!canvas) return
        const ctx = canvas.getContext("2d")
        if (!ctx) return
        ctx.clearRect(0, 0, canvas.width, canvas.height)

        setConfetti((prevConfetti) => {
            const updatedConfetti = prevConfetti
                .map((piece) => ({
                    ...piece,
                    x: piece.x + piece.vx,
                    y: piece.y + piece.vy,
                    vy: piece.vy + 0.15,
                    vx: piece.vx * 0.99,
                    rotation: piece.rotation + piece.rotationSpeed,
                    opacity: piece.y > 350 ? Math.max(0, piece.opacity - 0.03) : piece.opacity,
                }))
                .filter((piece) => piece.y < 500 && piece.opacity > 0)

            updatedConfetti.forEach((piece) => {
                ctx.save()
                ctx.globalAlpha = piece.opacity
                ctx.translate(piece.x, piece.y)
                ctx.rotate((piece.rotation * Math.PI) / 180)
                ctx.fillStyle = piece.color

                switch (piece.shape) {
                    case "circle":
                        ctx.beginPath()
                        ctx.arc(0, 0, piece.size / 2, 0, Math.PI * 2)
                        ctx.fill()
                        break
                    case "square":
                        ctx.fillRect(-piece.size / 2, -piece.size / 2, piece.size, piece.size)
                        break
                    case "triangle":
                        ctx.beginPath()
                        ctx.moveTo(0, -piece.size / 2)
                        ctx.lineTo(-piece.size / 2, piece.size / 2)
                        ctx.lineTo(piece.size / 2, piece.size / 2)
                        ctx.closePath()
                        ctx.fill()
                        break
                    case "star":
                        drawStar(ctx, 0, 0, 5, piece.size / 2, piece.size / 4)
                        ctx.fill()
                        break
                }
                ctx.restore()
            })

            return updatedConfetti
        })

        setFireworks((prevFireworks) => {
            const updatedFireworks = prevFireworks
                .map((firework) => ({
                    ...firework,
                    particles: firework.particles
                        .map((particle) => ({
                            ...particle,
                            x: particle.x + particle.vx,
                            y: particle.y + particle.vy,
                            vy: particle.vy + 0.1,
                            life: particle.life - 1,
                        }))
                        .filter((particle) => particle.life > 0),
                }))
                .filter((firework) => firework.particles.length > 0)

            updatedFireworks.forEach((firework) => {
                firework.particles.forEach((particle) => {
                    ctx.save()
                    ctx.globalAlpha = particle.life / particle.maxLife
                    ctx.fillStyle = particle.color
                    ctx.beginPath()
                    ctx.arc(particle.x, particle.y, 3, 0, Math.PI * 2)
                    ctx.fill()
                    ctx.restore()
                })
            })

            return updatedFireworks
        })

        if (showCelebration) {
            animationRef.current = requestAnimationFrame(animateEffects)
        }
    }

    const drawStar = (
        ctx: CanvasRenderingContext2D,
        cx: number,
        cy: number,
        spikes: number,
        outerRadius: number,
        innerRadius: number,
    ) => {
        let rot = (Math.PI / 2) * 3
        let x = cx
        let y = cy
        const step = Math.PI / spikes

        ctx.beginPath()
        ctx.moveTo(cx, cy - outerRadius)

        for (let i = 0; i < spikes; i++) {
            x = cx + Math.cos(rot) * outerRadius
            y = cy + Math.sin(rot) * outerRadius
            ctx.lineTo(x, y)
            rot += step

            x = cx + Math.cos(rot) * innerRadius
            y = cy + Math.sin(rot) * innerRadius
            ctx.lineTo(x, y)
            rot += step
        }

        ctx.lineTo(cx, cy - outerRadius)
        ctx.closePath()
    }

    const lightenColor = (color: string, percent: number) => {
        const num = Number.parseInt(color.replace("#", ""), 16)
        const amt = Math.round(2.55 * percent)
        const R = Math.min(255, (num >> 16) + amt)
        const G = Math.min(255, ((num >> 8) & 0x00ff) + amt)
        const B = Math.min(255, (num & 0x0000ff) + amt)
        return "#" + ((1 << 24) + (R << 16) + (G << 8) + B).toString(16).slice(1)
    }

    const darkenColor = (color: string, percent: number) => {
        const num = Number.parseInt(color.replace("#", ""), 16)
        const amt = Math.round(2.55 * percent)
        const R = Math.max(0, (num >> 16) - amt)
        const G = Math.max(0, ((num >> 8) & 0x00ff) - amt)
        const B = Math.max(0, (num & 0x0000ff) - amt)
        return "#" + ((1 << 24) + (R << 16) + (G << 8) + B).toString(16).slice(1)
    }

    const drawSector = (ctx: CanvasRenderingContext2D, prize: any, i: number) => {
        const ang = arc * i
        const rad = ctx.canvas.width / 2
        const centerX = rad
        const centerY = rad
        
        ctx.save()
        
        const gradient = ctx.createRadialGradient(centerX, centerY, 0, centerX, centerY, rad)
        gradient.addColorStop(0, lightenColor(prize.color, 20))
        gradient.addColorStop(0.7, prize.color)
        gradient.addColorStop(1, darkenColor(prize.color, 20))
        
        ctx.beginPath()
        ctx.fillStyle = gradient
        ctx.moveTo(centerX, centerY)
        ctx.arc(centerX, centerY, rad, ang, ang + arc)
        ctx.lineTo(centerX, centerY)
        ctx.fill()
        
        ctx.strokeStyle = "#84cc16"
        ctx.lineWidth = 2
        ctx.stroke()
        
        ctx.translate(centerX, centerY)
        ctx.rotate(ang + arc / 2)
        ctx.textAlign = "center"
        ctx.textBaseline = "middle"
        ctx.fillStyle = prize.textColor
        
        const fontSize = prize.text.length > 10 ? '12px' : '16px'
        ctx.font = `bold ${fontSize} 'Segoe UI', Tahoma, 'Arial Unicode MS', sans-serif`
        ctx.shadowColor = "rgba(0, 0, 0, 0.7)"
        ctx.shadowBlur = 3
        
        const textRadius = prize.text.length > 10 ? rad * 0.6 : rad * 0.7
        ctx.fillText(prize.text, textRadius, 0)
        ctx.restore()
    }

    const drawWheel = () => {
        const canvas = canvasRef.current
        if (!canvas) return

        const ctx = canvas.getContext("2d")
        if (!ctx) return

        const centerX = canvas.width / 2
        const centerY = canvas.height / 2
        const radius = canvas.width / 2

        ctx.clearRect(0, 0, canvas.width, canvas.height)

        ctx.save()
        ctx.shadowColor = "rgba(132, 204, 22, 0.4)" 
        ctx.shadowBlur = 25
        ctx.shadowOffsetX = 0
        ctx.shadowOffsetY = 0
        
        ctx.beginPath()
        ctx.arc(centerX, centerY, radius, 0, 2 * Math.PI)
        ctx.fillStyle = "#ffffff"
        ctx.fill()
        ctx.restore()

        prizes.forEach((prize, i) => drawSector(ctx, prize, i))

        const hubGradient = ctx.createRadialGradient(centerX, centerY, 0, centerX, centerY, 40)
        hubGradient.addColorStop(0, "#ffffff")
        hubGradient.addColorStop(0.7, "#f8f9fa")
        hubGradient.addColorStop(1, "#84cc16") 

        ctx.beginPath()
        ctx.arc(centerX, centerY, 40, 0, 2 * Math.PI)
        ctx.fillStyle = hubGradient
        ctx.fill()
        ctx.strokeStyle = "#84cc16" 
        ctx.lineWidth = 3
        ctx.stroke()

        for (let i = 0; i < 8; i++) {
            const angle = i * 45 * (Math.PI / 180)
            const x = centerX + Math.cos(angle) * 25
            const y = centerY + Math.sin(angle) * 25

            ctx.beginPath()
            ctx.arc(x, y, 3, 0, 2 * Math.PI)
            ctx.fillStyle = "#000000"
            ctx.fill()
        }
    }

    const rotate = () => {
        const canvas = canvasRef.current
        if (!canvas) return
        canvas.style.transform = `rotate(${ang - PI / 2}rad)`
    }
    const lastSectorIndexRef = useRef<number>(getIndex())

    const frame = () => {
        if (!isSpinning) return;

        // MODIFIED: Use spinTargetAng to control deceleration
        if (spinTargetAng !== null) {
            const currentAng = ang % TAU;
            const diff = (spinTargetAng - currentAng + TAU) % TAU;

            // Check if we are approaching the target
            if (diff < angVel * 200) { 
                setAngVel(prev => prev * 0.98); // Taper off to a softer stop
            } else {
                setAngVel(prev => prev * friction);
            }
        } else {
            setAngVel(prev => prev * friction);
        }

        if (angVel < angVelMin) {
            setIsSpinning(false);
            setAngVel(0);
            stopSpinSound();

            const winningPrize = prizes[getIndex()];
            setWonPrize(winningPrize.text);
            getWonPrize(winningPrize);

            if (!winningPrize.text.includes("ما في نصيب")) {
                playWinSound();
                setShowCelebration(true);
                setScreenShake(true);
                setTimeout(() => setScreenShake(false), 1000);
                setTimeout(() => setShowCelebration(false), 5000);
            } else {
                playNoWinSound();
            }

            onSpin(winningPrize.text);
            return;
        }


        const currentIndex = getIndex();
        if (currentIndex !== lastSectorIndexRef.current) {
            playTickSound(angVel);
            lastSectorIndexRef.current = currentIndex;
        }

        setAng(prev => (prev + angVel) % TAU);
    };


    useEffect(() => {
        if (isSpinning) {
            frameRef.current = requestAnimationFrame(frame)
            return () => cancelAnimationFrame(frameRef.current)
        }
    }, [isSpinning, angVel, spinTargetAng])

    useEffect(() => {
        drawWheel()
        rotate()
    }, [ang])

    const handleSpin = () => {
        if (isSpinning || disabled) return
        
        playClickSound()
        
        lastTickTimeRef.current = 0
        
        // MODIFIED: Select the winning prize by probability first
        const winningIndex = selectPrizeByProbability();
        const prizeAngle = (winningIndex * arc + arc / 2);
        
        // MODIFIED: Calculate a final stopping angle
        const currentAng = ang % TAU;
        const revolutions = 5 + Math.random() * 5; // Spin for a random number of extra revolutions
        const targetAng = (currentAng + revolutions * TAU) - (currentAng + prizeAngle) % TAU + PI / 2;
        
        setSpinTargetAng(targetAng);
        setAngVel(0.4); // Start with a fixed, high velocity
        
        setIsSpinning(true);
        setIsAccelerating(true); // Keep accelerating for a short period
        setTimeout(() => setIsAccelerating(false), 1000);
        
        setShowCelebration(false)
        setScreenShake(false)
    }

    useEffect(() => {
        const handleResize = () => {
            const container = canvasRef.current?.parentElement
            if (container && canvasRef.current) {
                const size = Math.min(container.clientWidth, container.clientHeight, 400)
                canvasRef.current.width = size
                canvasRef.current.height = size
                if (celebrationRef.current) {
                    celebrationRef.current.width = size + 4
                    celebrationRef.current.height = size + 4
                }
                drawWheel()
            }
        }
        handleResize()
        window.addEventListener("resize", handleResize)
        return () => window.removeEventListener("resize", handleResize)
    }, [])

    return (
        <div className={`${screenShake ? "animate-bounce" : ""}`}>
            <Card className="w-full max-w-xs sm:max-w-sm md:max-w-md lg:max-w-lg mx-auto bg-black border-2 border-lime-400 shadow-2xl shadow-lime-400/30">
                <CardContent className="p-4 sm:p-6 md:p-8">
                    <div className="relative w-72 h-72 sm:w-80 sm:h-80 md:w-96 md:h-96 mx-auto mb-4 sm:mb-6">
                        {/* Celebration Canvas */}
                        <canvas
                            ref={celebrationRef}
                            width={292}
                            height={292}
                            className="absolute inset-0 pointer-events-none z-30"
                            style={{ left: "-2px", top: "-2px" }}
                        />

                        {/* Enhanced Sparkle Effects */}
                        {showCelebration && (
                            <div className="absolute inset-0 pointer-events-none z-25">
                                {[...Array(30)].map((_, i) => (
                                    <div
                                        key={i}
                                        className="absolute animate-ping"
                                        style={{
                                            left: `${Math.random() * 100}%`,
                                            top: `${Math.random() * 100}%`,
                                            animationDelay: `${Math.random() * 3}s`,
                                            animationDuration: `${0.5 + Math.random() * 1.5}s`,
                                        }}
                                    >
                                        <div
                                            className="w-3 h-3 rounded-full opacity-90"
                                            style={{
                                                backgroundColor: `hsl(${Math.random() * 10}, 100%, 60%)`,
                                                boxShadow: `0 0 10px hsl(${Math.random() * 360}, 100%, 60%)`,
                                            }}
                                        ></div>
                                    </div>
                                ))}
                            </div>
                        )}

                        {/* Enhanced Glow Effect for Winning */}
                        {showCelebration && (
                            <div className="absolute inset-0 rounded-full bg-gradient-to-r from-lime-400 via-yellow-400 to-lime-600 opacity-40 animate-pulse z-20"></div>
                        )}

                        {/* Pulsing rings during celebration */}
                        {showCelebration && (
                            <>
                                <div className="absolute inset-0 rounded-full border-4 border-lime-400 opacity-60 animate-ping z-18"></div>
                                <div
                                    className="absolute inset-2 rounded-full border-4 border-yellow-400 opacity-40 animate-ping z-18"
                                    style={{ animationDelay: "0.5s" }}
                                ></div>
                                <div
                                    className="absolute inset-4 rounded-full border-4 border-lime-500 opacity-30 animate-ping z-18"
                                    style={{ animationDelay: "1s" }}
                                ></div>
                            </>
                        )}

                        <canvas
                            ref={canvasRef}
                            width={288}
                            height={288}
                            className={`absolute inset-0 transition-none z-10 ${
                                disabled ? "opacity-50" : ""
                            } ${isSpinning ? "animate-pulse" : ""}`}
                        />

                        {/* Enhanced Pointer */}
                        <div className="absolute top-0 left-1/2 transform -translate-x-1/2 -translate-y-2 z-50">
                            <div className="relative">
                                <div className="absolute top-1 left-1 w-0 h-0 border-l-6 border-r-6 border-b-12 border-l-transparent border-r-transparent border-b-gray-400 opacity-50"></div>
                                <div className="w-0 h-0 border-l-6 border-r-6 border-b-12 border-l-transparent border-r-transparent border-b-lime-500 drop-shadow-lg"></div>
                                <div className="relative -top-2"><Triangle className="text-lime-500 rotate-180" fill="#a3e635" /></div>
                                {showCelebration && (
                                    <div className="absolute -top-2 -left-2 w-4 h-4 bg-lime-400 rounded-full animate-ping opacity-75"></div>
                                )}
                            </div>
                        </div>

                        {/* Enhanced Spin Button */}
                        <div className="absolute top-1/2 left-1/2 transform -translate-x-1/2 -translate-y-1/2 z-20">
                            <Button
                                onClick={handleSpin}
                                disabled={isSpinning || disabled}
                                className={`
                                    w-16 h-16 sm:w-20 sm:h-20 md:w-24 md:h-24 rounded-full font-bold text-sm sm:text-base md:text-lg shadow-2xl transition-all duration-300 arabic-text border-4
                                    ${
                                        isSpinning
                                            ? "bg-gray-600 border-gray-400 cursor-not-allowed scale-95 text-white animate-pulse"
                                            : disabled
                                                ? "bg-gray-700 border-gray-500 cursor-not-allowed text-gray-400"
                                                : showCelebration
                                                    ? "bg-gradient-to-br from-yellow-400 to-lime-500 hover:from-yellow-500 hover:to-lime-600 text-black hover:scale-110 active:scale-95 shadow-lime-400/50 border-yellow-500 animate-bounce"
                                                    : "bg-gradient-to-br from-lime-400 to-lime-500 hover:from-lime-500 hover:to-lime-600 text-black hover:scale-110 active:scale-95 shadow-lime-400/50 border-lime-600"
                                    }`}
                                style={{ zIndex: 25 }}
                            >
                                {!isSpinning && (
                                    <div className="flex flex-col items-center">
                                        <span className="text-xl font-black">دوّر</span>
                                    </div>
                                )}
                            </Button>
                        </div>

                        {/* Enhanced Decorative rings */}
                        <div className="absolute inset-0 rounded-full border-4 border-lime-400 opacity-20 animate-pulse z-5"></div>

                        {isSpinning && (
                            <>
                                <div className="absolute inset-0 rounded-full bg-gradient-to-r from-lime-400 to-lime-500 opacity-20 animate-ping z-5"></div>
                                <div className="absolute inset-2 rounded-full border-2 border-lime-300 opacity-30 animate-spin z-5"></div>
                            </>
                        )}
                    </div>

                    <div className="text-center">
                        <div
                            className={`inline-flex items-center px-2 py-1 sm:px-4 sm:py-2 rounded-full text-xs sm:text-sm font-medium transition-all duration-300 arabic-text ${
                                isSpinning
                                    ? "bg-lime-400/20 text-lime-300 animate-pulse border border-lime-400/30"
                                    : showCelebration
                                        ? "bg-gradient-to-r from-yellow-400/20 to-lime-400/20 text-lime-300 animate-bounce border border-lime-400/50 shadow-lg"
                                        : "bg-lime-400/20 text-lime-300 border border-lime-400/30"
                            }`}
                        >
                            {isSpinning ? (
                                <>
                                    <div className="animate-spin rounded-full h-4 w-4 border-2 border-lime-400 border-t-transparent ml-2"></div>
                                    جاري الدوران...
                                </>
                            ) : showCelebration ? (
                                <>🎉 تهانينا! فزت بـ {wonPrize}! 🎉</>
                            ) : (
                                "جاهز للدوران!"
                            )}
                        </div>
                    </div>
                </CardContent>
            </Card>
        </div>
    )
}