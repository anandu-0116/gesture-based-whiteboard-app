import React, { useEffect, useState } from 'react';
import { Hands, HAND_CONNECTIONS } from '@mediapipe/hands';
import * as cam from '@mediapipe/camera_utils';
import { drawConnectors, drawLandmarks } from '@mediapipe/drawing_utils';
import WhiteBoard from './WhiteBoard';

function HandTracker() {
    const [handData, setHandData] = useState(null);

    useEffect(() => {
        let camera = null;
        const initialize = async () => {
            try {
                const videoElement = document.querySelector('.input_video');
                if (!videoElement) return;

                // Request camera permission and set up video
                const stream = await navigator.mediaDevices.getUserMedia({ video: true });
                videoElement.srcObject = stream;
                await new Promise((resolve) => {
                    videoElement.onloadedmetadata = () => resolve();
                });

                // Initialize hands with specific CDN version
                const hands = new Hands({
                    locateFile: (file) => {
                        return `https://cdn.jsdelivr.net/npm/@mediapipe/hands@0.4.1646424915/${file}`;
                    }
                });

                // Configure hands before camera setup
                await hands.setOptions({
                    selfieMode: true,
                    maxNumHands: 2,
                    modelComplexity: 1,
                    minDetectionConfidence: 0.5,
                    minTrackingConfidence: 0.5
                });

                // Set up results handler
                hands.onResults((results) => {
                    const canvasElement = document.querySelector('.output_canvas');
                    if (!canvasElement) return;

                    const canvasCtx = canvasElement.getContext('2d');
                    canvasCtx.save();
                    canvasCtx.clearRect(0, 0, canvasElement.width, canvasElement.height);
                    canvasCtx.drawImage(
                        results.image,
                        0,
                        0,
                        canvasElement.width,
                        canvasElement.height
                    );

                    if (results.multiHandLandmarks) {
                        for (const landmarks of results.multiHandLandmarks) {
                            drawConnectors(canvasCtx, landmarks, HAND_CONNECTIONS, {
                                color: '#00FF00',
                                lineWidth: 5
                            });
                            drawLandmarks(canvasCtx, landmarks, {
                                color: '#FF0000',
                                lineWidth: 2
                            });
                        }
                    }
                    canvasCtx.restore();
                    setHandData(results);
                });

                // Initialize camera with error handling
                camera = new cam.Camera(videoElement, {
                    onFrame: async () => {
                        try {
                            await hands.send({ image: videoElement });
                        } catch (err) {
                            console.error('Hand detection error:', err);
                        }
                    },
                    width: 640,
                    height: 480
                });

                await camera.start();
                console.log('Camera started successfully');

            } catch (error) {
                console.error('Initialization error:', error);
            }
        };

        // Start initialization
        initialize();

        // Cleanup function
        return () => {
            if (camera) {
                camera.stop();
            }
            const videoElement = document.querySelector('.input_video');
            if (videoElement?.srcObject) {
                videoElement.srcObject.getTracks().forEach(track => track.stop());
            }
        };
    }, []);

    return (
        <div>
            <div style={{ position: 'relative', width: '640px', height: '480px' }}>
                <video 
                    className="input_video" 
                    width="640"
                    height="480"
                    autoPlay 
                    playsInline
                    style={{
                        width: '100%',
                        height: '100%',
                        position: 'absolute',
                        top: 0,
                        left: 0,
                        transform: 'scaleX(-1)' // Mirror the video
                    }}
                />
                <canvas 
                    className="output_canvas" 
                    width="640" 
                    height="480"
                    style={{
                        width: '100%',
                        height: '100%',
                        position: 'absolute',
                        top: 0,
                        left: 0,
                        transform: 'scaleX(-1)' // Mirror the canvas
                    }}
                />
            </div>
            <WhiteBoard handData={handData} />
        </div>
    );
}

export default HandTracker;