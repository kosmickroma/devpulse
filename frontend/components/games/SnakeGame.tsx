/*****************************************************************************
 * SnakeGame.tsx
 *
 * DevPulse Mini-Game: Snake - 80s Cyberpunk Edition
 * Full-Featured Snake with Retro Neon Aesthetic
 *
 * Features:
 * - Arrow keys / WASD controls
 * - Collision detection (walls & self)
 * - Score tracking
 * - Neon glow effects
 * - Retro grid background
 * - Game over & restart
 *****************************************************************************/

"use client";

import React, { useState, useEffect, useCallback, useContext } from "react";
import { GameNotificationContext } from "../GameOverlay";

/********************************************
 * TYPES
 ********************************************/

interface Position {
    x: number;
    y: number;
}

/********************************************
 * COMPONENT
 ********************************************/

export default function SnakeGame() {
    /********************************************
     * CONSTANTS
     ********************************************/
    const GRID_SIZE = 20;
    const INITIAL_SPEED = 150; // Faster gameplay!

    // Get notification context
    const { showNotification, notificationMessage } = useContext(GameNotificationContext);

    // Local state for notification cycling
    const [showNotificationLocal, setShowNotificationLocal] = useState(false);

    // Handle notification flashing and cycling
    useEffect(() => {
        if (showNotification) {
            console.log('🎮 SnakeGame: Showing notification!', notificationMessage);

            // Show notification
            setShowNotificationLocal(true);

            // Auto-dismiss after 5 seconds (after flashing)
            const dismissTimer = setTimeout(() => {
                setShowNotificationLocal(false);
            }, 5000);

            // Cycle back every 2 minutes
            const cycleTimer = setInterval(() => {
                setShowNotificationLocal(true);
                setTimeout(() => setShowNotificationLocal(false), 5000);
            }, 120000); // 2 minutes

            return () => {
                clearTimeout(dismissTimer);
                clearInterval(cycleTimer);
            };
        }
    }, [showNotification, notificationMessage]);

    /********************************************
     * STATE
     ********************************************/
    const [snake, setSnake] = useState<Position[]>([
        { x: 10, y: 10 },
        { x: 9, y: 10 },
        { x: 8, y: 10 }
    ]);

    const [food, setFood] = useState<Position>({ x: 15, y: 15 });
    const [isGameOver, setIsGameOver] = useState(false);
    const [isPaused, setIsPaused] = useState(false);
    const [direction, setDirection] = useState<"up" | "down" | "left" | "right">("right");
    const [score, setScore] = useState(0);
    const [highScore, setHighScore] = useState(0);

    /********************************************
     * SOUND EFFECTS
     ********************************************/

    // Using Web Audio API to generate retro sounds
    const playEatSound = useCallback(() => {
        const audioContext = new (window.AudioContext || (window as any).webkitAudioContext)();
        const oscillator = audioContext.createOscillator();
        const gainNode = audioContext.createGain();

        oscillator.connect(gainNode);
        gainNode.connect(audioContext.destination);

        oscillator.frequency.value = 800;
        oscillator.type = 'square';
        gainNode.gain.setValueAtTime(0.3, audioContext.currentTime);
        gainNode.gain.exponentialRampToValueAtTime(0.01, audioContext.currentTime + 0.1);

        oscillator.start(audioContext.currentTime);
        oscillator.stop(audioContext.currentTime + 0.1);
    }, []);

    const playGameOverSound = useCallback(() => {
        const audioContext = new (window.AudioContext || (window as any).webkitAudioContext)();
        const oscillator = audioContext.createOscillator();
        const gainNode = audioContext.createGain();

        oscillator.connect(gainNode);
        gainNode.connect(audioContext.destination);

        oscillator.frequency.setValueAtTime(400, audioContext.currentTime);
        oscillator.frequency.exponentialRampToValueAtTime(100, audioContext.currentTime + 0.5);
        oscillator.type = 'sawtooth';
        gainNode.gain.setValueAtTime(0.3, audioContext.currentTime);
        gainNode.gain.exponentialRampToValueAtTime(0.01, audioContext.currentTime + 0.5);

        oscillator.start(audioContext.currentTime);
        oscillator.stop(audioContext.currentTime + 0.5);
    }, []);

    /********************************************
     * FUNCTIONS
     ********************************************/

    const generateNewFoodPosition = useCallback((currentSnake: Position[]): Position => {
        let newFood: Position;
        do {
            newFood = {
                x: Math.floor(Math.random() * GRID_SIZE),
                y: Math.floor(Math.random() * GRID_SIZE),
            };
        } while (currentSnake.some(segment => segment.x === newFood.x && segment.y === newFood.y));
        return newFood;
    }, []);

    const resetGame = useCallback(() => {
        setSnake([
            { x: 10, y: 10 },
            { x: 9, y: 10 },
            { x: 8, y: 10 }
        ]);
        setFood({ x: 15, y: 15 });
        setDirection("right");
        setIsGameOver(false);
        setIsPaused(false);
        setScore(0);
    }, []);

    /********************************************
     * KEYBOARD INPUT
     ********************************************/

    useEffect(() => {
        const handleKeyDown = (e: KeyboardEvent) => {
            if (isGameOver) return;

            // Pause toggle
            if (e.key === " " || e.key === "Escape") {
                e.preventDefault();
                setIsPaused(prev => !prev);
                return;
            }

            if (isPaused) return;

            // Prevent arrow keys from scrolling the page
            if (e.key.startsWith("Arrow")) {
                e.preventDefault();
            }

            switch (e.key) {
                case "ArrowUp":
                case "w":
                case "W":
                    if (direction !== "down") setDirection("up");
                    break;
                case "ArrowDown":
                case "s":
                case "S":
                    if (direction !== "up") setDirection("down");
                    break;
                case "ArrowLeft":
                case "a":
                case "A":
                    if (direction !== "right") setDirection("left");
                    break;
                case "ArrowRight":
                case "d":
                case "D":
                    if (direction !== "left") setDirection("right");
                    break;
            }
        };

        window.addEventListener("keydown", handleKeyDown);
        return () => window.removeEventListener("keydown", handleKeyDown);
    }, [direction, isGameOver, isPaused]);

    /********************************************
     * GAME LOOP
     ********************************************/

    useEffect(() => {
        if (isGameOver || isPaused) return;

        const interval = setInterval(() => {
            setSnake(prevSnake => {
                const newHead = { ...prevSnake[0] };

                switch (direction) {
                    case "up":    newHead.y -= 1; break;
                    case "down":  newHead.y += 1; break;
                    case "left":  newHead.x -= 1; break;
                    case "right": newHead.x += 1; break;
                }

                // Wall collision
                const isWallCollision =
                    newHead.x < 0 ||
                    newHead.x >= GRID_SIZE ||
                    newHead.y < 0 ||
                    newHead.y >= GRID_SIZE;

                if (isWallCollision) {
                    setIsGameOver(true);
                    if (score > highScore) setHighScore(score);
                    playGameOverSound();
                    return prevSnake;
                }

                // Self collision
                const isSelfCollision = prevSnake.some((segment, index) =>
                    index > 0 && newHead.x === segment.x && newHead.y === segment.y
                );

                if (isSelfCollision) {
                    setIsGameOver(true);
                    if (score > highScore) setHighScore(score);
                    playGameOverSound();
                    return prevSnake;
                }

                // Food collision
                const isEating = newHead.x === food.x && newHead.y === food.y;
                let nextSnake: Position[] = [newHead, ...prevSnake];

                if (isEating) {
                    setFood(generateNewFoodPosition(nextSnake));
                    setScore(prev => prev + 10);
                    playEatSound();
                } else {
                    nextSnake = nextSnake.slice(0, -1);
                }

                return nextSnake;
            });
        }, INITIAL_SPEED);

        return () => clearInterval(interval);
    }, [direction, food, isGameOver, isPaused, generateNewFoodPosition, score, highScore, playEatSound, playGameOverSound]);

    /********************************************
     * RENDER BOARD
     ********************************************/

    const renderBoard = () => {
        const rows = [];

        for (let y = 0; y < GRID_SIZE; y++) {
            const rowCells = [];

            for (let x = 0; x < GRID_SIZE; x++) {
                const snakeIndex = snake.findIndex(segment => segment.x === x && segment.y === y);
                const isSnakeHead = snakeIndex === 0;
                const isSnakeBody = snakeIndex > 0;
                const isFood = food.x === x && food.y === y;

                // Calculate tail fade gradient
                const tailProgress = snakeIndex / snake.length;
                const opacity = isSnakeBody ? 1 - (tailProgress * 0.4) : 1;

                rowCells.push(
                    <div
                        key={`${x}-${y}`}
                        className={`
                            w-5 h-5 border border-dark-border/30
                            transition-all duration-75
                            ${isSnakeHead
                                ? "bg-neon-magenta shadow-neon-magenta animate-glow-pulse"
                                : isSnakeBody
                                ? "bg-neon-cyan shadow-neon-cyan"
                                : isFood
                                ? "bg-neon-green shadow-neon-green animate-glow-pulse rounded-full"
                                : "bg-dark-card/20"
                            }
                        `}
                        style={{
                            opacity: isSnakeBody ? opacity : 1,
                            boxShadow: isSnakeHead
                                ? '0 0 15px rgba(255, 0, 255, 0.8), 0 0 30px rgba(255, 0, 255, 0.4)'
                                : isSnakeBody
                                ? `0 0 10px rgba(0, 255, 255, ${0.6 * opacity}), 0 0 20px rgba(0, 255, 255, ${0.3 * opacity})`
                                : isFood
                                ? '0 0 15px rgba(57, 255, 20, 0.8), 0 0 30px rgba(57, 255, 20, 0.4)'
                                : 'none'
                        }}
                    />
                );
            }

            rows.push(
                <div key={y} className="flex">
                    {rowCells}
                </div>
            );
        }
        return rows;
    };

    /********************************************
     * RENDER
     ********************************************/

    return (
        <div className="w-full h-full flex flex-col items-center justify-center bg-dark-bg relative">
            {/* Retro Grid Background */}
            <div className="absolute inset-0 grid-bg opacity-20" />
            <div className="absolute inset-0 perspective-grid opacity-10" />

            {/* CRT Scanlines */}
            <div className="scanline" />

            {/* Content Container */}
            <div className="relative z-10 flex flex-col items-center gap-2 py-3">
                {/* Header */}
                <div className="text-center">
                    <h1 className="text-2xl font-bold font-sans neon-text tracking-wider">
                        SNAKE
                    </h1>
                    <div className="text-xs text-neon-cyan/60 font-mono tracking-widest">
                        [ CLASSIC ARCADE ]
                    </div>
                </div>

                {/* Score Panel */}
                <div className="flex gap-6 font-mono">
                    <div className="flex flex-col items-center">
                        <span className="text-neon-cyan/60 text-xs tracking-wider">SCORE</span>
                        <span className="text-lg font-bold neon-text tabular-nums">
                            {score.toString().padStart(4, '0')}
                        </span>
                    </div>
                    <div className="flex flex-col items-center">
                        <span className="text-neon-magenta/60 text-xs tracking-wider">HIGH</span>
                        <span className="text-lg font-bold neon-text-magenta tabular-nums">
                            {highScore.toString().padStart(4, '0')}
                        </span>
                    </div>
                </div>

                {/* Game Board Container */}
                <div className="relative">
                    {/* Board */}
                    <div className="p-1">
                        {renderBoard()}
                    </div>

                    {/* Pause Overlay */}
                    {isPaused && !isGameOver && (
                        <div className="absolute inset-0 flex items-center justify-center bg-dark-bg/80 backdrop-blur-sm rounded-lg">
                            <div className="text-center space-y-2">
                                <div className="text-3xl font-bold neon-text-magenta animate-glow-pulse">
                                    PAUSED
                                </div>
                                <div className="text-neon-cyan/60 text-xs font-mono">
                                    Press SPACE to continue
                                </div>
                            </div>
                        </div>
                    )}

                    {/* Game Over Overlay */}
                    {isGameOver && (
                        <div className="absolute inset-0 flex items-center justify-center bg-dark-bg/90 backdrop-blur-sm rounded-lg">
                            <div className="text-center space-y-3 glitch">
                                <div className="text-4xl font-bold neon-text-magenta animate-flicker tracking-wider">
                                    GAME OVER
                                </div>
                                <div className="space-y-1">
                                    <div className="text-lg neon-text font-mono">
                                        FINAL SCORE: {score}
                                    </div>
                                    {score === highScore && score > 0 && (
                                        <div className="text-neon-green neon-text-green text-xs font-bold animate-glow-pulse">
                                            ★ NEW HIGH SCORE ★
                                        </div>
                                    )}
                                </div>
                                <button
                                    onClick={resetGame}
                                    className="
                                        px-5 py-2
                                        neon-border
                                        bg-dark-card/50
                                        text-neon-cyan
                                        font-mono font-bold
                                        text-xs
                                        tracking-wider
                                        hover:bg-neon-cyan/10
                                        transition-all
                                        rounded
                                        active:scale-95
                                    "
                                >
                                    [ RESTART ]
                                </button>
                            </div>
                        </div>
                    )}
                </div>

                {/* Controls Info */}
                <div className="text-center font-mono text-xs text-neon-cyan/40 mt-1">
                    <div>↑↓←→ or WASD • SPACE to pause</div>
                </div>
            </div>

            {/* SCAN COMPLETE NOTIFICATION - Cyberpunk Flashing Neon Sign */}
            {showNotificationLocal && (
                <div className="
                    absolute top-1/3 left-1/2 -translate-x-1/2 -translate-y-1/2
                    z-[100]
                    p-6
                    border-4 border-neon-green
                    bg-dark-bg/70
                    backdrop-blur-sm
                    rounded-lg
                    shadow-neon-green
                    animate-flicker
                    w-80
                "
                style={{
                    boxShadow: '0 0 40px rgba(57, 255, 20, 0.9), inset 0 0 30px rgba(57, 255, 20, 0.4)',
                    animation: 'neon-flicker 0.3s ease-in-out 6, glow-pulse 2s ease-in-out infinite 2s'
                }}>
                    <div className="text-center space-y-3">
                        <div className="text-neon-green font-bold font-mono text-2xl neon-text-green tracking-wider">
                            SCAN COMPLETE
                        </div>
                        <div className="text-neon-green text-lg font-mono font-bold">
                            {notificationMessage}
                        </div>
                        <div className="text-neon-green/80 text-sm font-mono border-t-2 border-neon-green/50 pt-3 mt-3">
                            Press ESC to view
                        </div>
                    </div>
                </div>
            )}

            <style jsx>{`
                @keyframes neon-flicker {
                    0%, 100% { opacity: 1; }
                    10% { opacity: 0.3; }
                    20% { opacity: 1; }
                    30% { opacity: 0.5; }
                    40% { opacity: 1; }
                    50% { opacity: 0.4; }
                    60% { opacity: 1; }
                }
            `}</style>
        </div>
    );
}
