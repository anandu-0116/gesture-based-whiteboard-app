import React, { useEffect, useRef, useState } from 'react';

import { 
    ref, 
    onValue, 
    update, 
    push,
    serverTimestamp
  } from 'firebase/database';
import { db } from '../firebase';

function WhiteBoard({ handData, roomCode, userId }) {
    const canvasRef = useRef(null);
    const pointerCanvasRef = useRef(null);
    const [color, setColor] = useState('#000000');
    const [lineWidth, setLineWidth] = useState(5);
    const [lastPosition, setLastPosition] = useState(null);
    const [isDrawing, setIsDrawing] = useState(false);
    const [participants, setParticipants] = useState({});
    
    // Initialize canvases
    useEffect(() => {
        const canvas = canvasRef.current;
        const pointerCanvas = pointerCanvasRef.current;
        
        canvas.width = 800;
        canvas.height = 600;
        pointerCanvas.width = 800;
        pointerCanvas.height = 600;
        
        const ctx = canvas.getContext('2d');
        ctx.lineCap = 'round';
        ctx.lineJoin = 'round';
    }, []);

    // Update the syncDrawingToDatabase function
    const syncDrawingToDatabase = async (drawingData) => {
        if (!roomCode || !userId) return;
        
        try {
        const roomRef = ref(db, `rooms/${roomCode}/drawingData`);
        const newDrawingRef = push(roomRef);
        await update(newDrawingRef, {
            ...drawingData,
            userId: userId,
            timestamp: Date.now() // Use client timestamp for immediate sorting
        });
        } catch (error) {
        console.error('Error syncing drawing:', error);
        }
    };

    // Add a useEffect to listen for drawing updates from Realtime Database
    useEffect(() => {
        if (!roomCode) return;

        // Track participants
        const participantsRef = ref(db, `rooms/${roomCode}/participants`);
        const participantsListener = onValue(participantsRef, (snapshot) => {
            const participantsData = snapshot.val() || {};
            setParticipants(participantsData);
        });
        
        // Listen for drawing updates
        const drawingRef = ref(db, `rooms/${roomCode}/drawingData`);
        const drawingListener = onValue(drawingRef, (snapshot) => {
            const drawingData = snapshot.val();
            
            // Clear canvas first
            const canvas = canvasRef.current;
            const ctx = canvas.getContext('2d');
            ctx.clearRect(0, 0, canvas.width, canvas.height);
            
            // Sort drawing data by timestamp before replaying
            if (drawingData) {
                const sortedDrawings = Object.values(drawingData)
                .sort((a, b) => (a.timestamp || 0) - (b.timestamp || 0));
                
                sortedDrawings.forEach(data => {
                ctx.beginPath();
                ctx.moveTo(data.startX, data.startY);
                ctx.lineTo(data.endX, data.endY);
                ctx.strokeStyle = data.color;
                ctx.lineWidth = data.lineWidth;
                ctx.stroke();
                });
            }
        });

        return () => {
            participantsListener();
            drawingListener();
        };
    }, [roomCode]);

    // Check if hand is making a fist (for erasing)
    const isHandClosed = (landmarks) => {
        const fingerTips = [8, 12, 16, 20];
        const fingerPips = [6, 10, 14, 18];
        
        return fingerTips.every((tip, index) => {
            const pipY = landmarks[fingerPips[index]].y;
            const tipY = landmarks[tip].y;
            return tipY > pipY;
        });
    };

    // Check if only index finger is extended (for drawing)
    const isIndexPointing = (landmarks) => {
        const indexTipY = landmarks[8].y;
        const indexPipY = landmarks[6].y;
        
        const middleTipY = landmarks[12].y;
        const middlePipY = landmarks[10].y;
        
        const otherFingers = [
            { tip: 16, pip: 14 },
            { tip: 20, pip: 18 }
        ];
        
        const indexExtended = indexTipY < indexPipY;
        const middleNotExtended = middleTipY > middlePipY;
        const othersClose = otherFingers.every(finger => 
            landmarks[finger.tip].y > landmarks[finger.pip].y
        );
        
        return indexExtended && middleNotExtended && othersClose;
    };

    // Check if peace sign is shown (for pausing/moving)
    const isPeaceSign = (landmarks) => {
        const indexTipY = landmarks[8].y;
        const indexPipY = landmarks[6].y;
        const middleTipY = landmarks[12].y;
        const middlePipY = landmarks[10].y;
        
        const otherFingers = [
            { tip: 16, pip: 14 },
            { tip: 20, pip: 18 }
        ];
        
        const indexExtended = indexTipY < indexPipY;
        const middleExtended = middleTipY < middlePipY;
        const othersClose = otherFingers.every(finger => 
            landmarks[finger.tip].y > landmarks[finger.pip].y
        );
        
        return indexExtended && middleExtended && othersClose;
    };

    // Draw the pointer with different states
    const drawPointer = (x, y, mode, participantId = null) => {
        const pointerCanvas = pointerCanvasRef.current;
        const ctx = pointerCanvas.getContext('2d');
        
        // Clear previous pointer
        ctx.clearRect(0, 0, pointerCanvas.width, pointerCanvas.height);
        
        // Set styles based on mode
        let fillStyle, strokeStyle, radius;
        switch(mode) {
            case 'erase':
                fillStyle = 'rgba(255, 0, 0, 0.3)';
                strokeStyle = '#ff0000';
                radius = 10;
                break;
            case 'draw':
                fillStyle = `rgba(${hexToRgb(color)}, 0.3)`;
                strokeStyle = color;
                radius = lineWidth/2;
                break;
            case 'move':
                fillStyle = 'rgba(0, 255, 0, 0.3)';
                strokeStyle = '#00ff00';
                radius = 5;
                break;
            default:
                fillStyle = 'rgba(128, 128, 128, 0.3)';
                strokeStyle = '#808080';
                radius = 5;
        }
        
        // Draw pointer circle
        ctx.beginPath();
        ctx.arc(x, y, radius, 0, Math.PI * 2);
        ctx.fillStyle = fillStyle;
        ctx.fill();
        ctx.strokeStyle = strokeStyle;
        ctx.lineWidth = 2;
        ctx.stroke();
        
        // Add crosshair for precise positioning
        const crosshairSize = 10;
        ctx.beginPath();
        ctx.moveTo(x - crosshairSize, y);
        ctx.lineTo(x + crosshairSize, y);
        ctx.moveTo(x, y - crosshairSize);
        ctx.lineTo(x, y + crosshairSize);
        ctx.stroke();

        // Draw participant label with background
        if (participantId !== null) {
            const label = `P${participantId}`;
            ctx.font = '14px Arial';
            
            // Measure text for background
            const metrics = ctx.measureText(label);
            const padding = 4;
            const bgWidth = metrics.width + (padding * 2);
            const bgHeight = 20;
            
            // Draw background rectangle
            ctx.fillStyle = 'rgba(255, 255, 255, 0.8)';
            ctx.fillRect(
                x + radius + 5,
                y - bgHeight/2,
                bgWidth,
                bgHeight
            );
            
            // Draw text
            ctx.fillStyle = strokeStyle;
            ctx.textAlign = 'left';
            ctx.textBaseline = 'middle';
            ctx.fillText(label, x + radius + 5 + padding, y);
        }
    };

    // Convert hex color to RGB for transparency
    const hexToRgb = (hex) => {
        const result = /^#?([a-f\d]{2})([a-f\d]{2})([a-f\d]{2})$/i.exec(hex);
        return result ? 
            `${parseInt(result[1], 16)}, ${parseInt(result[2], 16)}, ${parseInt(result[3], 16)}` 
            : '0, 0, 0';
    };

    // Handle drawing
    useEffect(() => {
        if (!handData?.multiHandLandmarks?.[0]) {
            const pointerCtx = pointerCanvasRef.current.getContext('2d');
            pointerCtx.clearRect(0, 0, pointerCanvasRef.current.width, pointerCanvasRef.current.height);
            setLastPosition(null);
            setIsDrawing(false);
            return;
        }

        const canvas = canvasRef.current;
        const ctx = canvas.getContext('2d');
        const landmarks = handData.multiHandLandmarks[0];

        const x = landmarks[8].x * canvas.width;
        const y = landmarks[8].y * canvas.height;

        const fist = isHandClosed(landmarks);
        const pointing = isIndexPointing(landmarks);
        const peace = isPeaceSign(landmarks);

        // Determine pointer mode and update state
        let pointerMode = 'idle';
        if (fist) pointerMode = 'erase';
        else if (pointing) pointerMode = 'draw';
        else if (peace) pointerMode = 'move';

        // Always draw pointer with appropriate mode and participant ID
        const participantIndex = Object.keys(participants).indexOf(userId) + 1;
        drawPointer(x, y, pointerMode, participantIndex);

        if (peace) {
            setLastPosition(null);
            setIsDrawing(false);
            return;
        }

        if (pointing || fist) {
            if (!lastPosition) {
                setLastPosition({ x, y });
                setIsDrawing(true);
                return;
            }

            if (isDrawing) {
                ctx.beginPath();
                ctx.moveTo(lastPosition.x, lastPosition.y);
                
                if (fist) {
                    ctx.strokeStyle = '#FFFFFF';
                    ctx.lineWidth = 20;
                } else {
                    ctx.strokeStyle = color;
                    ctx.lineWidth = lineWidth;
                }
                
                ctx.lineTo(x, y);
                ctx.stroke();

                // Sync drawing to Realtime Database
                const drawingData = {
                    startX: lastPosition.x,
                    startY: lastPosition.y,
                    endX: x,
                    endY: y,
                    color: fist ? '#FFFFFF' : color,
                    lineWidth: fist ? 20 : lineWidth
                };
                syncDrawingToDatabase(drawingData);
            }
        }

        setLastPosition({ x, y });
    }, [handData, color, lineWidth, isDrawing, roomCode, userId, participants]);

    // Clear canvas and sync clear to Realtime Database
    const clearCanvas = async () => {
        const canvas = canvasRef.current;
        const ctx = canvas.getContext('2d');
        ctx.clearRect(0, 0, canvas.width, canvas.height);

        // Clear drawing data in Realtime Database
        if (roomCode) {
            const roomRef = ref(db, `rooms/${roomCode}/drawingData`);
            await update(roomRef, null);
        }
    };

    return (
        <div className="whiteboard-container">
            <div className="gesture-instructions" style={{
                textAlign: 'center',
                marginBottom: '10px',
                padding: '10px',
                backgroundColor: '#f0f0f0',
                borderRadius: '4px'
            }}>
                <p>👆 Index finger to draw | ✌️ Peace sign to move without drawing | ✊ Fist to erase</p>
            </div>
            <div className="canvas-wrapper" style={{ 
                position: 'relative', 
                width: '800px', 
                height: '600px',
                margin: '20px auto'
            }}>
                <canvas
                    ref={canvasRef}
                    style={{
                        position: 'absolute',
                        top: 0,
                        left: 0,
                        border: '2px solid #333',
                        backgroundColor: '#fff'
                    }}
                />
                <canvas
                    ref={pointerCanvasRef}
                    style={{
                        position: 'absolute',
                        top: 0,
                        left: 0,
                        pointerEvents: 'none',
                        border: '2px solid #333',
                        backgroundColor: 'transparent'
                    }}
                />
            </div>
            <div className="controls" style={{
                display: 'flex',
                gap: '20px',
                justifyContent: 'center',
                alignItems: 'center',
                padding: '10px'
            }}>
                <button 
                    onClick={clearCanvas}
                    style={{
                        padding: '8px 16px',
                        borderRadius: '4px',
                        backgroundColor: '#ff4444',
                        color: 'white',
                        border: 'none',
                        cursor: 'pointer'
                    }}
                >
                    Clear Canvas
                </button>
                <div>
                    <label>Color: </label>
                    <input
                        type="color"
                        value={color}
                        onChange={(e) => setColor(e.target.value)}
                    />
                </div>
                <div>
                    <label>Line Width: </label>
                    <input
                        type="range"
                        min="1"
                        max="20"
                        value={lineWidth}
                        onChange={(e) => setLineWidth(parseInt(e.target.value))}
                    />
                </div>
            </div>
        </div>
    );
}

export default WhiteBoard;