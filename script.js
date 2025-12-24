document.addEventListener('DOMContentLoaded', () => {

    const mainMenuOverlay = document.getElementById('main-menu-overlay');
    const chatBotOverlay = document.getElementById('chat-bot-overlay');
    const envScannerOverlay = document.getElementById('env-scanner-overlay');
    const lockedMapOverlay = document.getElementById('locked-map-overlay');

    const scanBtn = document.getElementById('scan-btn');
    const openChatBtn = document.getElementById('chat-btn');
    const quitBtn = document.getElementById('quit-btn');
    const closeMapBtn = document.getElementById('close-map-btn');

    const userInputField = document.getElementById('user-input');
    const sendChatMsgBtn = document.getElementById('send-chat-msg');
    const chatMessages = document.getElementById('chat-messages');

    // --- State Variables ---
    let isScanning = false;
    let isLockedMapping = false;
    let xrSession = null;
    let mapImageElement = null;

    // --- Event Listeners ---

    scanBtn.addEventListener('click', () => {
        if (isScanning) return;
        
        startEnvironmentScan();
        isScanning = true;
    });

    openChatBtn.addEventListener('click', () => {
        mainMenuOverlay.style.display = 'none';
        envScannerOverlay.style.display = 'none';
        lockedMapOverlay.style.display = 'none';
        
        chatBotOverlay.style.display = 'flex';
    });

    quitBtn.addEventListener('click', () => {
        location.reload();
    });

    closeMapBtn.addEventListener('click', () => {
        lockedMapOverlay.style.display = 'none';
        // Add logic here to re-enable the main menu or chat
    });

    // --- WebXR Functions ---

    async function startEnvironmentScan() {
        if (xrSession) return;

        try {
            // Create an XR session
            xrSession = await navigator.xr.requestSession({
                requiredFeatures: ['localEnvironmentalFeedback'],
                optionalFeatures: ['video', 'depth'], // Ensure depth sensing is used
                audioOutputDevice: 'default'
            });

            // Show the environment scanner overlay
            envScannerOverlay.style.display = 'flex';

            // Create a VR display
            const display = await xrSession.display;
            
            // Create an XRCompositionTrack
            const compositionTracker = xrSession.createXRCompositionTracker();
            compositionTracker.addEventListener('compositionchange', (event) => {
                if (event.composeState === 'candid') {
                    // This is the state we want for scanning
                    isScanning = true;
                }
            });

            // Start the XR frame loop
            const trackElement = document.createElement('div');
            trackElement.setAttribute('xr-tracking', 'tracked');
            
            let lastTime = 0;

            const renderFrame = (time, delta) => {
                if (!xrSession || xrSession.status !== 'ready') return;
                
                // Update the UI with frame time
                // console.log(`VR Frame Time: ${time}, Delta: ${delta}`);

                // Redraw the scene
                xrSession.requestAnimationFrame(renderFrame);

                // Get the current composition state
                const currentState = compositionTracker.getCompositionState();
                if (currentState === 'candid' && !isScanning) {
                    isScanning = true;
                    startEnvironmentScan; // Recursive call to lock the scan
                }
            };

            xrSession.requestAnimationFrame(renderFrame);

        } catch (error) {
            console.error("Error starting environment scan:", error);
        }
    }

    function stopEnvironmentScan() {
        if (xrSession) {
            xrSession.end();
            xrSession = null;
        }
        isScanning = false;
        envScannerOverlay.style.display = 'none';
    }

    // --- AI Chatbot Functions ---

    const aiChatBotUrl = 'https://api.openai.com/v1/completions';

    async function processUserInput(userInput) {
        if (!userInput.trim()) return;

        // Show loading indicator if you have one
        const loadingText = document.createElement('p');
        loadingText.innerText = "Thinking...";
        chatMessages.appendChild(loadingText);
        
        try {
            // 1. Send an API request to your AI model
            // You'll need an API key from OpenAI or a similar service
            const response = await fetch(aiChatBotUrl, {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                    'Authorization': `Bearer YOUR_API_KEY_HERE`, // <<-- GET THIS FROM OPENAI
                },
                body: JSON.stringify({
                    model: "completions",
                    prompt: `User: ${userInput}\nAI:`,
                    max_tokens: 200,
                }),
            });

            if (!response.ok) {
                throw new Error(`AI request failed with status: ${response.status}`);
            }

            const data = await response.json();
            
            // 2. Extract the AI's response
            const aiResponse = data.choices[0].text;
            
            // 3. Display the AI's response in the UI
            const aiMessageEl = document.createElement('p');
            aiMessageEl.className = "ai-response";
            aiMessageEl.innerText = aiResponse;
            chatMessages.appendChild(aiMessageEl);
            
        } catch (error) {
            console.error("Error processing user input:", error);
            const errorEl = document.createElement('p');
            errorEl.className = "error";
            errorEl.innerText = `An error occurred: ${error.message}`;
            chatMessages.appendChild(errorEl);
        }
        
        // Clear the user's input field
        userInputField.value = '';
    }

    sendChatMsgBtn.addEventListener('click', () => {
        const userInput = userInputField.value.trim();
        if (userInput) {
            processUserInput(userInput);
        }
    });

    user_input_field.addEventListener('keypress', (e) => {
        if (e.key === 'Enter') {
            processUserInput(userInputField.value);
        }
    });

});
