import { AvaturnHead } from '@avaturn-live/web-sdk';

export class AvaturnAgent {
	constructor(containerEl) {
		this.container = containerEl;
		this.avatar = null;
		this.sessionId = null;
		this.isConnected = false;
		this.isLoading = false;

		this._buildUI();
	}

	_buildUI() {
		// Avatar panel
		this.panel = document.createElement('div');
		this.panel.className = 'avaturn-panel';
		this.panel.innerHTML = `
			<div class="avaturn-header">
				<span class="avaturn-title">3D Agent</span>
				<button class="avaturn-close" aria-label="Close">&times;</button>
			</div>
			<div class="avaturn-video-wrap">
				<div class="avaturn-video" id="avaturn-video"></div>
				<div class="avaturn-status">Click to connect</div>
			</div>
			<div class="avaturn-controls">
				<input type="text" class="avaturn-input" placeholder="Ask the agent..." />
				<button class="avaturn-send" aria-label="Send">
					<svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="currentColor"><path d="M2.01 21L23 12 2.01 3 2 10l15 2-15 2z"/></svg>
				</button>
			</div>
			<div class="avaturn-mic-row">
				<button class="avaturn-mic" aria-label="Toggle microphone">
					<svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="currentColor"><path d="M12 14c1.66 0 3-1.34 3-3V5c0-1.66-1.34-3-3-3S9 3.34 9 5v6c0 1.66 1.34 3 3 3zm-1-9c0-.55.45-1 1-1s1 .45 1 1v6c0 .55-.45 1-1 1s-1-.45-1-1V5zm6 6c0 2.76-2.24 5-5 5s-5-2.24-5-5H5c0 3.53 2.61 6.43 6 6.92V21h2v-3.08c3.39-.49 6-3.39 6-6.92h-2z"/></svg>
				</button>
			</div>
		`;
		this.panel.style.display = 'none';
		this.container.appendChild(this.panel);

		// Toggle button
		this.toggleBtn = document.createElement('button');
		this.toggleBtn.className = 'avaturn-toggle';
		this.toggleBtn.innerHTML = `
			<svg xmlns="http://www.w3.org/2000/svg" width="20" height="20" viewBox="0 0 24 24" fill="currentColor"><path d="M20 2H4c-1.1 0-2 .9-2 2v18l4-4h14c1.1 0 2-.9 2-2V4c0-1.1-.9-2-2-2zm0 14H6l-2 2V4h16v12z"/><path d="M7 9h2v2H7zm4 0h2v2h-2zm4 0h2v2h-2z"/></svg>
		`;
		this.toggleBtn.title = 'Talk to 3D Agent';
		this.container.appendChild(this.toggleBtn);

		// Event listeners
		this.toggleBtn.addEventListener('click', () => this._togglePanel());
		this.panel.querySelector('.avaturn-close').addEventListener('click', () => this._togglePanel());
		this.panel.querySelector('.avaturn-send').addEventListener('click', () => this._sendMessage());
		this.panel.querySelector('.avaturn-input').addEventListener('keydown', (e) => {
			if (e.key === 'Enter') this._sendMessage();
		});
		this.panel.querySelector('.avaturn-mic').addEventListener('click', () => this._toggleMic());
	}

	_togglePanel() {
		const visible = this.panel.style.display !== 'none';
		this.panel.style.display = visible ? 'none' : 'flex';
		this.toggleBtn.classList.toggle('active', !visible);

		if (!visible && !this.isConnected && !this.isLoading) {
			this._connect();
		}
	}

	async _connect() {
		this.isLoading = true;
		this._setStatus('Connecting...');

		try {
			const res = await fetch('/api/avaturn-session', { method: 'POST' });
			if (!res.ok) {
				const err = await res.json();
				throw new Error(err.error || 'Session creation failed');
			}

			const { token, sessionId } = await res.json();
			this.sessionId = sessionId;

			const videoEl = this.panel.querySelector('#avaturn-video');
			this.avatar = new AvaturnHead(videoEl, {
				sessionToken: token,
				audioSource: false,
				keepAlive: true,
			});

			this.avatar.on('init', () => {
				this.isConnected = true;
				this.isLoading = false;
				this._setStatus('');
				this.avatar.task('Hello! I\'m your 3D Agent. Ask me anything about 3D models.');
			});

			this.avatar.on('avatar_started_speaking', () => {
				this.panel.querySelector('.avaturn-video-wrap').classList.add('speaking');
			});

			this.avatar.on('avatar_ended_speaking', () => {
				this.panel.querySelector('.avaturn-video-wrap').classList.remove('speaking');
			});

			this.avatar.on('dispose', () => {
				this.isConnected = false;
				this._setStatus('Disconnected');
			});

			await this.avatar.init();
		} catch (err) {
			console.error('[3D Agent] Avaturn connection failed:', err);
			this.isLoading = false;
			this._setStatus('Connection failed. Check API key.');
		}
	}

	_sendMessage() {
		const input = this.panel.querySelector('.avaturn-input');
		const text = input.value.trim();
		if (!text || !this.avatar || !this.isConnected) return;

		this.avatar.task(text);
		input.value = '';
	}

	_toggleMic() {
		if (!this.avatar || !this.isConnected) return;
		this.avatar.toggleLocalAudio();
		this.panel.querySelector('.avaturn-mic').classList.toggle('active');
	}

	_setStatus(msg) {
		const statusEl = this.panel.querySelector('.avaturn-status');
		statusEl.textContent = msg;
		statusEl.style.display = msg ? 'flex' : 'none';
	}

	dispose() {
		if (this.avatar) {
			this.avatar.dispose();
			this.avatar = null;
		}
		this.isConnected = false;
		this.panel.remove();
		this.toggleBtn.remove();
	}
}
