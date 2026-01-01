// src/utils/SyncEngine.js
export class SyncEngine {
    constructor(socket, onStatusChange, onSeek) {
        this.socket = socket;
        this.onStatusChange = onStatusChange;
        this.onSeek = onSeek;

        this.offset = 0;
        this.futureTimeout = null;
        this.futureDelay = 2000;

        // Listen for Sync Events immediately
        this.socket.on('sync_event', (event) => {
            this.handleEvent(event);
        });
    }

    // --- HELPER: Wrap the Callback in a Promise ---
    getServerTime() {
        return new Promise((resolve) => {
            this.socket.emit('get_server_time', (serverTimestamp) => {
                resolve(serverTimestamp);
            });
        });
    }

    // --- A. CLOCK SYNC (NTP) ---
    async syncClock() {
        const t0 = Date.now();

        // Call our new internal helper
        const serverTime = await this.getServerTime();

        const t1 = Date.now();
        const latency = (t1 - t0) / 2;
        const expectedServerTime = serverTime + latency;
        this.offset = expectedServerTime - t1;

        console.log(`⏱️ Clock Synced. Offset: ${this.offset}ms`);
    }

    // --- B. PLAY/PAUSE (Use your existing socket) ---
    play(currentPosition) {
        const now = Date.now() + this.offset;
        const scheduledTime = now + this.futureDelay;

        // Emit using your existing socket
        // Note: Ensure you send roomId if your backend requires it inside the payload
        // Or if your socket is already in the room, just emit the event.
        this.socket.emit('sync_event', {
            type: 'PLAY_SCHEDULED',
            timestamp: scheduledTime,
            position: currentPosition,
            // If your backend needs roomId inside the body:
            // roomId: "your-room-id" 
        });
    }

    pause(currentPosition) {
        this.socket.emit('sync_event', {
            type: 'PAUSE_IMMEDIATE',
            position: currentPosition
        });
    }

    // ... (handleEvent remains the same as previous code) ...
    handleEvent(event) {
        const now = Date.now() + this.offset;

        switch (event.type) {
            case 'PLAY_SCHEDULED':
                const waitTime = event.timestamp - now;

                if (waitTime > 0) {
                    this.onStatusChange('SCHEDULING', waitTime);
                    if (this.futureTimeout) clearTimeout(this.futureTimeout);
                    this.futureTimeout = setTimeout(() => {
                        this.onSeek(event.position);
                        this.onStatusChange('PLAYING');
                    }, waitTime);
                } else {
                    const missedSeconds = Math.abs(waitTime) / 1000;
                    this.onSeek(event.position + missedSeconds);
                    this.onStatusChange('PLAYING');
                }
                break;

            case 'PAUSE_IMMEDIATE':
                if (this.futureTimeout) clearTimeout(this.futureTimeout);
                this.onSeek(event.position);
                this.onStatusChange('PAUSED');
                break;
        }
    }
}