const express = require('express');
const http = require('http');
const WebSocket = require('ws');

const app = express();
const server = http.createServer(app);
const wss = new WebSocket.Server({ server });

let connectedClients = new Set();

wss.on('connection', (ws) => {
    connectedClients.add(ws);
    console.log('Client terhubung. Total client:', connectedClients.size);

    ws.on('message', (message) => {
        for (let client of connectedClients) {
            if (client !== ws && client.readyState === WebSocket.OPEN) {
                client.send(message);
            }
        }
    });

    ws.on('close', () => {
        connectedClients.delete(ws);
        console.log('Client terputus.');
    });
});

app.get('/', (req, res) => {
    res.send(`
        <!DOCTYPE html>
        <html>
        <head>
            <title>CCTV ESP32-CAM Live</title>
            <meta name="viewport" content="width=device-width, initial-scale=1.0">
            <style>
                body { background: #0f172a; color: #fff; text-align: center; font-family: sans-serif; margin: 0; padding: 20px; }
                h2 { margin-bottom: 10px; font-size: 20px; }
                .stream-box { max-width: 600px; margin: 0 auto; background: #1e293b; padding: 10px; border-radius: 12px; box-shadow: 0 4px 10px rgba(0,0,0,0.5); }
                img { width: 100%; height: auto; border-radius: 8px; display: block; }
                .status { margin-top: 10px; font-size: 13px; color: #38bdf8; }
            </style>
        </head>
        <body>
            <h2>Live CCTV ESP32-CAM</h2>
            <div class="stream-box">
                <img id="stream" src="" alt="Menunggu koneksi ESP32-CAM..." />
            </div>
            <p class="status" id="status">Status: Menghubungkan ke Server...</p>
            <script>
                const img = document.getElementById('stream');
                const statusText = document.getElementById('status');
                const wsProtocol = window.location.protocol === 'https:' ? 'wss:' : 'ws:';
                const ws = new WebSocket(wsProtocol + '//' + window.location.host);

                ws.onopen = () => { statusText.innerText = "Status: Terhubung ke Cloud Server"; };
                ws.onclose = () => { statusText.innerText = "Status: Koneksi Terputus"; };

                ws.onmessage = (event) => {
                    if (event.data instanceof Blob) {
                        const url = URL.createObjectURL(event.data);
                        img.onload = () => URL.revokeObjectURL(url);
                        img.src = url;
                    }
                };
            </script>
        </body>
        </html>
    `);
});

const PORT = process.env.PORT || 8080;
server.listen(PORT, () => {
    console.log(`Server berjalan di port ${PORT}`);
});
