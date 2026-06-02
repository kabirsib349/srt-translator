document.addEventListener('DOMContentLoaded', () => {
    const dropZone = document.getElementById('drop-zone');
    const fileInput = document.getElementById('file-input');
    
    const progressContainer = document.getElementById('progress-container');
    const successContainer = document.getElementById('success-container');
    const errorContainer = document.getElementById('error-container');
    
    const fileInfo = document.getElementById('file-info');
    const progressBar = document.getElementById('progress-bar');
    const progressText = document.getElementById('progress-text');
    const statusMessage = document.getElementById('status-message');
    
    const downloadBtn = document.getElementById('download-btn');
    const resetBtn = document.getElementById('reset-btn');
    const errorResetBtn = document.getElementById('error-reset-btn');
    
    let currentTranslatedFile = null;
    let currentTranslatedContent = null;

    // --- Drag and Drop Handlers ---
    dropZone.addEventListener('click', () => fileInput.click());

    dropZone.addEventListener('dragover', (e) => {
        e.preventDefault();
        dropZone.classList.add('dragover');
    });

    dropZone.addEventListener('dragleave', () => {
        dropZone.classList.remove('dragover');
    });

    dropZone.addEventListener('drop', (e) => {
        e.preventDefault();
        dropZone.classList.remove('dragover');
        
        if (e.dataTransfer.files.length > 0) {
            handleFile(e.dataTransfer.files[0]);
        }
    });

    fileInput.addEventListener('change', (e) => {
        if (e.target.files.length > 0) {
            handleFile(e.target.files[0]);
        }
    });

    // --- Buttons Handlers ---
    resetBtn.addEventListener('click', resetUI);
    errorResetBtn.addEventListener('click', resetUI);
    
    downloadBtn.addEventListener('click', () => {
        if (!currentTranslatedContent || !currentTranslatedFile) return;
        
        const blob = new Blob([currentTranslatedContent], { type: 'text/plain' });
        const url = URL.createObjectURL(blob);
        const a = document.createElement('a');
        a.href = url;
        a.download = currentTranslatedFile;
        document.body.appendChild(a);
        a.click();
        document.body.removeChild(a);
        URL.revokeObjectURL(url);
    });

    function resetUI() {
        dropZone.classList.remove('hidden');
        progressContainer.classList.add('hidden');
        successContainer.classList.add('hidden');
        errorContainer.classList.add('hidden');
        fileInput.value = '';
        currentTranslatedFile = null;
        currentTranslatedContent = null;
    }

    function showError(msg) {
        progressContainer.classList.add('hidden');
        errorContainer.classList.remove('hidden');
        document.getElementById('error-message').textContent = msg;
    }

    function handleFile(file) {
        if (!file.name.endsWith('.srt')) {
            showError("Please upload a valid .srt file.");
            dropZone.classList.add('hidden');
            return;
        }

        // Setup UI for translation
        dropZone.classList.add('hidden');
        progressContainer.classList.remove('hidden');
        fileInfo.textContent = `Translating: ${file.name}`;
        progressBar.style.width = '0%';
        progressText.textContent = '0%';
        statusMessage.textContent = 'Uploading...';

        const reader = new FileReader();
        reader.onload = (e) => {
            const content = e.target.result;
            startTranslationWS(file.name, content);
        };
        reader.onerror = () => {
            showError("Error reading file.");
        };
        reader.readAsText(file);
    }

    function startTranslationWS(filename, content) {
        // Build websocket URL
        const protocol = window.location.protocol === 'https:' ? 'wss:' : 'ws:';
        const wsUrl = `${protocol}//${window.location.host}/ws/translate`;
        
        const ws = new WebSocket(wsUrl);

        ws.onopen = () => {
            statusMessage.textContent = 'Parsing...';
            // Send file data
            ws.send(JSON.stringify({
                filename: filename,
                content: content
            }));
        };

        ws.onmessage = (event) => {
            const data = JSON.parse(event.data);
            
            if (data.error) {
                ws.close();
                showError(data.error);
                return;
            }

            if (data.status === 'starting') {
                statusMessage.textContent = data.message;
            } 
            else if (data.status === 'translating') {
                statusMessage.textContent = 'Translating to French...';
                const percent = Math.floor((data.progress / data.total) * 100);
                progressBar.style.width = `${percent}%`;
                progressText.textContent = `${percent}%`;
            }
            else if (data.status === 'completed') {
                currentTranslatedFile = data.filename;
                currentTranslatedContent = data.translated_content;
                
                // Show success UI
                progressContainer.classList.add('hidden');
                successContainer.classList.remove('hidden');
                ws.close();
            }
        };

        ws.onerror = (error) => {
            showError("WebSocket connection error.");
            console.error(error);
        };
        
        ws.onclose = (event) => {
            if (!currentTranslatedFile && progressContainer.classList.contains('hidden') === false) {
                showError("Connection closed unexpectedly.");
            }
        };
    }
});
