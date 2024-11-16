import React, { useEffect, useState } from 'react';
import { Hands, HAND_CONNECTIONS } from '@mediapipe/hands';
import * as cam from '@mediapipe/camera_utils';
import { drawConnectors, drawLandmarks } from '@mediapipe/drawing_utils';
import WhiteBoard from './WhiteBoard';

function HandTracker() {
    // Declare state to store hand data
    const [handData, setHandData] = useState(null);

    useEffect(() => {
        let camera = null;

        const initialize = async () => {
            try {
                // Get video element first
                const videoElement = document.querySelector('.input_video');
                if (!videoElement) return;

                // Request camera permission first
                const stream = await navigator.mediaDevices.getUserMedia({
                    video: true
                });

                // Set the stream to video element
                videoElement.srcObject = stream;

                // Wait for video to be ready
                await new Promise((resolve) => {
                    videoElement.onloadedmetadata = () => {
                        resolve();
                    };
                });

                // Create an instance of MediaPipe Hands
                const hands = new Hands({
                    locateFile: (file) => `https://cdn.jsdelivr.net/npm/@mediapipe/hands@0.4.1646424915/${file}`
                });

                // Set the onResults callback for when hands are detected
                hands.onResults((results) => {
                    const canvasElement = document.querySelector('.output_canvas');
                    if (!canvasElement) return;

                    const canvasCtx = canvasElement.getContext('2d');
                    canvasCtx.save();
                    canvasCtx.clearRect(0, 0, canvasElement.width, canvasElement.height);
                    canvasCtx.drawImage(results.image, 0, 0, canvasElement.width, canvasElement.height);

                    if (results.multiHandLandmarks) {
                        for (const landmarks of results.multiHandLandmarks) {
                            drawConnectors(canvasCtx, landmarks, HAND_CONNECTIONS, 
                                {color: '#00FF00', lineWidth: 5});
                            drawLandmarks(canvasCtx, landmarks, 
                                {color: '#FF0000', lineWidth: 2});
                        }
                    }
                    canvasCtx.restore();

                    // Update handData for the Whiteboard component
                    setHandData(results);
                });

                // Set up hand detection options
                hands.setOptions({
                    selfieMode: true,
                    maxNumHands: 2,
                    modelComplexity: 1,
                    minDetectionConfidence: 0.5,
                    minTrackingConfidence: 0.5
                });

                // Create and start the camera
                camera = new cam.Camera(videoElement, {
                    onFrame: async () => {
                        await hands.send({ image: videoElement });
                    },
                    width: 640,
                    height: 480
                });

                camera.start();
                console.log('Camera started successfully');

            } catch (error) {
                console.error('Error during initialization:', error);
            }
        };

        initialize();

        // Clean up when component is unmounted
        return () => {
            if (camera) {
                camera.stop();
            }
            const videoElement = document.querySelector('.input_video');
            if (videoElement && videoElement.srcObject) {
                const tracks = videoElement.srcObject.getTracks();
                tracks.forEach(track => track.stop());
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
                    }}
                />
            </div>

            {/* Pass handData to the WhiteBoard component */}
            <WhiteBoard handData = {handData} />
        </div>
    );
}

export default HandTracker;
