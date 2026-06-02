# SRT Translator Web App

A professional web application designed to automatically translate English SubRip (.srt) subtitle files into French. The application provides a sleek, modern user interface with real-time translation progress.

## Features

- Translates English subtitles to French using Google Translate (via deep-translator).
- Built with Python (FastAPI) and Vanilla JavaScript/CSS.
- Asynchronous processing with WebSocket integration for real-time progress tracking.
- Drag-and-drop interface with a dark glassmorphic design.
- Strictly uses solid colors (purple, blue, green, red) without gradients.

## Prerequisites

- Python 3.8+
- pip (Python package installer)

## Installation

1. Clone this repository or download the source code.
2. Navigate to the project directory.
3. Install the required dependencies:

```bash
pip install -r requirements.txt
```

## Usage

1. Start the FastAPI backend server:

```bash
python -m uvicorn main:app --port 8000
```

2. Open your web browser and navigate to:
   http://localhost:8000

3. Drag and drop your English `.srt` file into the designated area.
4. Wait for the real-time translation to reach 100%.
5. Click the "Download" button to save your translated French `.srt` file.

## Technical Stack

- Backend: FastAPI, Python, Uvicorn
- Translation Engine: deep-translator, pysrt
- Frontend: HTML5, CSS3, Vanilla JavaScript (WebSockets)
