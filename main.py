import os
import json
import asyncio
import pysrt
from fastapi import FastAPI, WebSocket, WebSocketDisconnect
from fastapi.staticfiles import StaticFiles
from fastapi.responses import HTMLResponse
from deep_translator import GoogleTranslator

app = FastAPI()

# Ensure static dir exists
os.makedirs("static", exist_ok=True)
app.mount("/static", StaticFiles(directory="static"), name="static")

@app.get("/")
async def get():
    with open("static/index.html", "r", encoding="utf-8") as f:
        return HTMLResponse(f.read())

@app.websocket("/ws/translate")
async def websocket_endpoint(websocket: WebSocket):
    await websocket.accept()
    try:
        # Wait for the file data
        data = await websocket.receive_text()
        payload = json.loads(data)
        
        filename = payload.get("filename", "subtitles.srt")
        content = payload.get("content", "")
        
        if not content:
            await websocket.send_json({"error": "No content provided"})
            return
            
        await websocket.send_json({"status": "starting", "message": "Parsing subtitles..."})
        
        # Parse SRT from string
        try:
            subs = pysrt.from_string(content)
        except Exception as e:
            await websocket.send_json({"error": f"Failed to parse SRT: {str(e)}"})
            return
            
        translator = GoogleTranslator(source='en', target='fr')
        total = len(subs)
        
        if total == 0:
            await websocket.send_json({"error": "No valid subtitle lines found in the file."})
            return
        
        await websocket.send_json({"status": "translating", "progress": 0, "total": total})
        
        # Translate line by line
        for i, sub in enumerate(subs):
            try:
                # Run translation in a thread to avoid blocking the async event loop
                translated_text = await asyncio.to_thread(translator.translate, sub.text)
                if translated_text:
                    sub.text = translated_text
            except Exception as e:
                print(f"Error translating line {i}: {e}")
            
            # Send progress every 10 lines or at the end
            if (i + 1) % 10 == 0 or (i + 1) == total:
                await websocket.send_json({"status": "translating", "progress": i + 1, "total": total})
                
        # Save to temp file to easily get the string representation
        out_filename = filename.replace(".srt", ".french.srt")
        if out_filename == filename:
            out_filename = "translated_" + filename
            
        subs.save(out_filename, encoding='utf-8')
        
        with open(out_filename, "r", encoding="utf-8") as f:
            translated_content = f.read()
            
        os.remove(out_filename) # Cleanup
        
        await websocket.send_json({
            "status": "completed", 
            "filename": out_filename,
            "translated_content": translated_content
        })
        
    except WebSocketDisconnect:
        print("Client disconnected")
    except Exception as e:
        await websocket.send_json({"error": str(e)})
