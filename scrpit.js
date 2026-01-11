document.addEventListener('DOMContentLoaded', () => {
    // --- DOM Elements ---
    const startScreen = document.getElementById('start-screen');
    const verificationDashboard = document.getElementById('verification-dashboard');
    const startVerificationBtn = document.getElementById('start-verification-btn');
    const resetVerificationBtn = document.getElementById('reset-verification-btn');

    const userCameraFeed = document.getElementById('user-camera-feed');
    const cameraStatus = document.getElementById('camera-status');
    const currentOverallStatus = document.getElementById('current-overall-status');

    // Step 1: Gesture Challenge
    const stepGesture = document.getElementById('step-gesture');
    const gestureStepStatus = document.getElementById('gesture-step-status');
    const gestureInstruction = document.getElementById('gesture-instruction');
    const simulateGesturePassBtn = document.getElementById('simulate-gesture-pass');
    const simulateGestureFailBtn = document.getElementById('simulate-gesture-fail');

    // Step 2: Latency Check
    const stepLatency = document.getElementById('step-latency');
    const latencyStepStatus = document.getElementById('latency-step-status');
    const audioVisualizerCanvas = document.getElementById('audio-visualizer-canvas');
    const soundDetectionStatus = document.getElementById('sound-detection-status');
    const simulateLatencyDetectBtn = document.getElementById('simulate-latency-detect');
    const canvasCtx = audioVisualizerCanvas.getContext('2d');

    // Step 3: Audio FFT
    const stepAudioFFT = document.getElementById('step-audio-fft');
    const audioFftStepStatus = document.getElementById('audio-fft-step-status');
    const audioFftResult = document.getElementById('audio-fft-result');
    const simulateAudioHumanBtn = document.getElementById('simulate-audio-human');
    const simulateAudioSyntheticBtn = document.getElementById('simulate-audio-synthetic');

    // Step 4: Behavioral Analysis
    const stepBehavioral = document.getElementById('step-behavioral');
    const behavioralStepStatus = document.getElementById('behavioral-step-status');
    const behaviorUrgency = document.getElementById('behavior-urgency');
    const behaviorAvoiding = document.getElementById('behavior-avoiding');
    const behaviorMoneyOtp = document.getElementById('behavior-money-otp');

    // Step 5: Knowledge Challenge
    const stepKnowledge = document.getElementById('step-knowledge');
    const knowledgeStepStatus = document.getElementById('knowledge-step-status');
    const knowledgeResultRadios = document.querySelectorAll('input[name="knowledge-result"]');

    // Results Summary
    const trustScoreGauge = document.getElementById('trust-score-gauge');
    const gaugeFill = trustScoreGauge.querySelector('.gauge-fill');
    const scorePercentage = document.getElementById('score-percentage');
    const finalMessage = document.getElementById('final-message');

    // --- State Variables ---
    let currentStep = 0;
    let localStream;
    let audioContext;
    let analyser;
    let dataArray;
    let bufferLength;

    const verificationResults = {
        gesturePassed: null, // true/false
        latencyMatched: null, // true/false
        audioHuman: null, // true/false
        behavioralFlags: {
            urgency: false,
            avoiding: false,
            moneyOtp: false
        },
        knowledgeResult: null // 'correct', 'wrong', 'avoided'
    };

    const trustScoreWeights = {
        gesture: 30,
        latency: 20,
        audioFFT: 30,
        behavioral: 10, // Penalty
        knowledge: 10
    };

    const gestureChallenges = [
        "Show 2 fingers",
        "Turn your head left",
        "Blink twice"
    ];
    let currentGestureIndex = 0;
    let gestureStartTime;

    // --- Helper Functions ---
    const showScreen = (screenId) => {
        document.querySelectorAll('.screen').forEach(screen => {
            screen.classList.remove('active');
        });
        document.getElementById(screenId).classList.add('active');
    };

    const updateStatusIndicator = (element, status) => {
        element.className = `status-indicator ${status}`;
        element.textContent = status.replace('-', ' ');
    };

    const updateOverallStatus = (message, type = 'info') => {
        currentOverallStatus.textContent = message;
        currentOverallStatus.className = `status-message ${type}`;
    };

    const calculateTrustScore = () => {
        let score = 0;
        let maxPossibleScore = 0;
        let message = "Analyzing verification data...";

        // Gesture Score
        if (verificationResults.gesturePassed !== null) {
            maxPossibleScore += trustScoreWeights.gesture;
            if (verificationResults.gesturePassed) {
                score += trustScoreWeights.gesture;
            }
        }

        // Latency Score
        if (verificationResults.latencyMatched !== null) {
            maxPossibleScore += trustScoreWeights.latency;
            if (verificationResults.latencyMatched) {
                score += trustScoreWeights.latency;
            }
        }

        // Audio FFT Score
        if (verificationResults.audioHuman !== null) {
            maxPossibleScore += trustScoreWeights.audioFFT;
            if (verificationResults.audioHuman) {
                score += trustScoreWeights.audioFFT;
            }
        }

        // Behavioral Analysis Penalty
        let behavioralPenalty = 0;
        if (verificationResults.behavioralFlags.urgency) behavioralPenalty += 3;
        if (verificationResults.behavioralFlags.avoiding) behavioralPenalty += 4;
        if (verificationResults.behavioralFlags.moneyOtp) behavioralPenalty += 5;
        score -= behavioralPenalty * (trustScoreWeights.behavioral / 12); // Max penalty is 12, so normalize to weight.

        // Knowledge Challenge Score
        if (verificationResults.knowledgeResult !== null) {
            maxPossibleScore += trustScoreWeights.knowledge;
            if (verificationResults.knowledgeResult === 'correct') {
                score += trustScoreWeights.knowledge;
            } else if (verificationResults.knowledgeResult === 'wrong') {
                score -= trustScoreWeights.knowledge / 2; // Penalize for wrong answer
            }
            // 'avoided' gets 0 points, no penalty
        }
        
        // Ensure score doesn't go below 0
        score = Math.max(0, score);
        maxPossibleScore = Math.max(1, maxPossibleScore); // Prevent division by zero if no steps completed

        const percentage = Math.round((score / maxPossibleScore) * 100);
        scorePercentage.textContent = `${percentage}%`;

        // Update gauge fill
        // Gauge is a semi-circle, 100% fill means 180deg rotation.
        // We'll use clip-path to simulate fill from bottom up in a circular manner
        // For simplicity, a linear fill is easier to demonstrate and still visually indicative.
        // Let's use CSS variable for gauge fill
        gaugeFill.style.height = `${percentage}%`;

        if (percentage >= 80) {
            finalMessage.className = "final-message success";
            message = "🟢 Trusted Human: High confidence in caller's identity.";
        } else if (percentage >= 50) {
            finalMessage.className = "final-message warning";
            message = "🟡 Human Verified, Identity Unclear: Proceed with caution.";
        } else {
            finalMessage.className = "final-message error";
            message = "🔴 Human Detected but High Fraud Behavior / Possibly Synthetic: Severe warning.";
        }
        finalMessage.textContent = message;
    };

    // --- Media Access & Audio Processing ---
    const startMediaStreams = async () => {
        try {
            const stream = await navigator.mediaDevices.getUserMedia({ video: true, audio: true });
            localStream = stream;
            userCameraFeed.srcObject = stream;
            cameraStatus.textContent = "Camera & Mic Active";
            cameraStatus.className = "status-message success";
            updateOverallStatus("Camera and microphone successfully activated.");

            // Initialize AudioContext for latency and FFT
            audioContext = new (window.AudioContext || window.webkitAudioContext)();
            const source = audioContext.createMediaStreamSource(stream);
            analyser = audioContext.createAnalyser();
            source.connect(analyser);
            analyser.fftSize = 2048; // A common size, good for both FFT and time domain
            bufferLength = analyser.frequencyBinCount; // half of fftSize
            dataArray = new Uint8Array(bufferLength);

            // Start audio visualization loop
            drawAudioVisualizer();

            // Enable gesture buttons now that camera is ready
            simulateGesturePassBtn.disabled = false;
            simulateGestureFailBtn.disabled = false;
            gestureInstruction.textContent = gestureChallenges[currentGestureIndex];
            updateStatusIndicator(gestureStepStatus, 'in-progress');

        } catch (err) {
            console.error("Error accessing media devices: ", err);
            cameraStatus.textContent = `Access denied: ${err.name}`;
            cameraStatus.className = "status-message error";
            updateOverallStatus(`Failed to access camera/mic: ${err.message}`, 'error');
            // Disable start button or show error gracefully
        }
    };

    const drawAudioVisualizer = () => {
        requestAnimationFrame(drawAudioVisualizer);

        if (!analyser || !canvasCtx) return;

        analyser.getByteTimeDomainData(dataArray); // Get waveform data

        canvasCtx.clearRect(0, 0, audioVisualizerCanvas.width, audioVisualizerCanvas.height);
        canvasCtx.lineWidth = 2;
        canvasCtx.strokeStyle = '#3498db'; // Blue
        canvasCtx.beginPath();

        const sliceWidth = audioVisualizerCanvas.width * 1.0 / bufferLength;
        let x = 0;

        for (let i = 0; i < bufferLength; i++) {
            const v = dataArray[i] / 128.0; // Data is 0-255, normalize to 0-2
            const y = v * audioVisualizerCanvas.height / 2;

            if (i === 0) {
                canvasCtx.moveTo(x, y);
            } else {
                canvasCtx.lineTo(x, y);
            }

            x += sliceWidth;
        }

        canvasCtx.lineTo(audioVisualizerCanvas.width, audioVisualizerCanvas.height / 2);
        canvasCtx.stroke();
    };


    // --- Verification Flow Steps ---

    const advanceStep = () => {
        currentStep++;
        document.querySelectorAll('.step-card').forEach(card => card.style.display = 'none'); // Hide all

        switch (currentStep) {
            case 1:
                stepGesture.style.display = 'block';
                updateOverallStatus("Please perform the requested gesture on camera.");
                gestureStartTime = Date.now(); // Start timer for gesture
                break;
            case 2:
                stepLatency.style.display = 'block';
                simulateLatencyDetectBtn.disabled = false;
                updateOverallStatus("Now, ask the caller to say 'Ab phone ghumao' and detect the sound spike.");
                updateStatusIndicator(latencyStepStatus, 'in-progress');
                // In a real scenario, we'd actively listen for a sound spike here.
                // For simulation, the button triggers it.
                break;
            case 3:
                stepAudioFFT.style.display = 'block';
                simulateAudioHumanBtn.disabled = false;
                simulateAudioSyntheticBtn.disabled = false;
                updateOverallStatus("Analyzing caller's voice for signs of AI or synthesis.");
                updateStatusIndicator(audioFftStepStatus, 'in-progress');
                // Simulate processing time
                audioFftResult.textContent = "Analyzing audio... (simulated processing)";
                setTimeout(() => {
                    audioFftResult.textContent = "Ready for AI voice detection result.";
                }, 1500);
                break;
            case 4:
                stepBehavioral.style.display = 'block';
                updateOverallStatus("Observe the caller's behavior and mark relevant points.");
                updateStatusIndicator(behavioralStepStatus, 'in-progress');
                break;
            case 5:
                stepKnowledge.style.display = 'block';
                updateOverallStatus("Challenge the caller with a personal question.");
                updateStatusIndicator(knowledgeStepStatus, 'in-progress');
                break;
            case 6: // All steps completed
                updateOverallStatus("Verification flow completed. Reviewing Trust Score.", 'info');
                resetVerificationBtn.style.display = 'inline-block';
                break;
        }
        calculateTrustScore(); // Update score after each step
    };

    const resetVerification = () => {
        // Reset all state variables
        currentStep = 0;
        verificationResults.gesturePassed = null;
        verificationResults.latencyMatched = null;
        verificationResults.audioHuman = null;
        verificationResults.behavioralFlags = { urgency: false, avoiding: false, moneyOtp: false };
        verificationResults.knowledgeResult = null;
        currentGestureIndex = 0;

        // Reset UI elements
        showScreen('start-screen');
        document.querySelectorAll('.step-card').forEach(card => card.style.display = 'none');
        document.querySelectorAll('.status-indicator').forEach(indicator => {
            indicator.className = 'status-indicator pending';
            indicator.textContent = 'Pending';
        });

        gestureInstruction.textContent = "Please enable your camera to begin the gesture challenge.";
        simulateGesturePassBtn.disabled = true;
        simulateGestureFailBtn.disabled = true;

        soundDetectionStatus.textContent = "Waiting for sound spike...";
        simulateLatencyDetectBtn.disabled = true;

        audioFftResult.textContent = "Analyzing caller's voice for authenticity...";
        simulateAudioHumanBtn.disabled = true;
        simulateAudioSyntheticBtn.disabled = true;

        behaviorUrgency.checked = false;
        behaviorAvoiding.checked = false;
        behaviorMoneyOtp.checked = false;

        knowledgeResultRadios.forEach(radio => radio.checked = false);

        scorePercentage.textContent = '0%';
        gaugeFill.style.height = '0%';
        finalMessage.className = "final-message info";
        finalMessage.textContent = "Proceed through the steps to calculate the Trust Score.";
        resetVerificationBtn.style.display = 'none';

        // Stop media streams if active
        if (localStream) {
            localStream.getTracks().forEach(track => track.stop());
            userCameraFeed.srcObject = null;
            localStream = null;
        }
        if (audioContext) {
            audioContext.close();
            audioContext = null;
            analyser = null;
        }
        cameraStatus.textContent = "Waiting for camera...";
        cameraStatus.className = "status-message info";
        updateOverallStatus("Ready to start a new verification.", 'info');
    };

    // --- Event Listeners ---
    startVerificationBtn.addEventListener('click', async () => {
        showScreen('verification-dashboard');
        updateOverallStatus("Requesting camera and microphone access...");
        await startMediaStreams();
        advanceStep(); // Go to Gesture Challenge
    });

    resetVerificationBtn.addEventListener('click', resetVerification);

    simulateGesturePassBtn.addEventListener('click', () => {
        const gestureEndTime = Date.now();
        const duration = gestureEndTime - gestureStartTime;
        // Simulate human response time: 300-800ms
        if (duration >= 300 && duration <= 1200) { // Increased window for demo
            verificationResults.gesturePassed = true;
            updateStatusIndicator(gestureStepStatus, 'completed');
            updateOverallStatus("Gesture challenge passed! Proceeding to Latency Check.", 'success');
        } else {
            verificationResults.gesturePassed = false;
            updateStatusIndicator(gestureStepStatus, 'failed');
            updateOverallStatus(`Gesture challenge failed (response time: ${duration}ms). Too slow or too fast.`, 'warning');
        }
        simulateGesturePassBtn.disabled = true;
        simulateGestureFailBtn.disabled = true;
        advanceStep();
    });

    simulateGestureFailBtn.addEventListener('click', () => {
        verificationResults.gesturePassed = false;
        updateStatusIndicator(gestureStepStatus, 'failed');
        updateOverallStatus("Gesture challenge failed as simulated. Proceeding.", 'warning');
        simulateGesturePassBtn.disabled = true;
        simulateGestureFailBtn.disabled = true;
        advanceStep();
    });

    simulateLatencyDetectBtn.addEventListener('click', () => {
        // Simulate sound detection and timing sync
        // In a real scenario, this would compare actual sound spike time with gesture completion time.
        // For demo, we'll just simulate a match or mismatch.
        const isMatch = Math.random() > 0.3; // 70% chance of match for demo
        verificationResults.latencyMatched = isMatch;

        if (isMatch) {
            soundDetectionStatus.textContent = "Sound Detected! Timing: MATCH.";
            soundDetectionStatus.className = "status-message success";
            updateStatusIndicator(latencyStepStatus, 'completed');
            updateOverallStatus("Latency check matched! Good sign.", 'success');
        } else {
            soundDetectionStatus.textContent = "Sound Detected! Timing: MISMATCH (Potential replay/AI).";
            soundDetectionStatus.className = "status-message warning";
            updateStatusIndicator(latencyStepStatus, 'failed');
            updateOverallStatus("Latency check mismatched. Potential AI or replay detected.", 'warning');
        }
        simulateLatencyDetectBtn.disabled = true;
        advanceStep();
    });

    simulateAudioHumanBtn.addEventListener('click', () => {
        verificationResults.audioHuman = true;
        audioFftResult.textContent = "Likely Human Voice. (Based on FFT analysis)";
        audioFftResult.className = "status-message success";
        updateStatusIndicator(audioFftStepStatus, 'completed');
        updateOverallStatus("Audio analysis indicates a likely human voice.", 'success');
        simulateAudioHumanBtn.disabled = true;
        simulateAudioSyntheticBtn.disabled = true;
        advanceStep();
    });

    simulateAudioSyntheticBtn.addEventListener('click', () => {
        verificationResults.audioHuman = false;
        audioFftResult.textContent = "Possibly Synthetic Voice. (Based on FFT analysis)";
        audioFftResult.className = "status-message warning";
        updateStatusIndicator(audioFftStepStatus, 'failed');
        updateOverallStatus("Audio analysis suggests a possibly synthetic voice. High alert!", 'error');
        simulateAudioHumanBtn.disabled = true;
        simulateAudioSyntheticBtn.disabled = true;
        advanceStep();
    });

    // Behavioral Analysis Checkboxes
    [behaviorUrgency, behaviorAvoiding, behaviorMoneyOtp].forEach(checkbox => {
        checkbox.addEventListener('change', () => {
            verificationResults.behavioralFlags.urgency = behaviorUrgency.checked;
            verificationResults.behavioralFlags.avoiding = behaviorAvoiding.checked;
            verificationResults.behavioralFlags.moneyOtp = behaviorMoneyOtp.checked;
            updateStatusIndicator(behavioralStepStatus, 'completed'); // Mark as completed once any change is made
            calculateTrustScore(); // Update score immediately
            updateOverallStatus("Behavioral flags updated.", 'info');
            // Advance to next step after a short delay to allow user to tick multiple
            if (!checkbox.dataset.debounced) {
                checkbox.dataset.debounced = setTimeout(() => {
                    advanceStep();
                    delete checkbox.dataset.debounced;
                }, 1000);
            }
        });
    });

    // Knowledge Challenge Radios
    knowledgeResultRadios.forEach(radio => {
        radio.addEventListener('change', () => {
            verificationResults.knowledgeResult = radio.value;
            updateStatusIndicator(knowledgeStepStatus, 'completed');
            calculateTrustScore(); // Update score immediately
            updateOverallStatus(`Knowledge challenge result: ${radio.value}.`, 'info');
            advanceStep();
        });
    });

    // Initial state setup
    showScreen('start-screen');
    calculateTrustScore(); // Initialize score display

    // If you want to auto-start for development
    // setTimeout(() => startVerificationBtn.click(), 100);
});