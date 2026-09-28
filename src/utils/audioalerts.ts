/**
 * Web Audio API synthesizer for non-intrusive alert sounds.
 * Synthesizes clean audio chimes without external MP3 dependencies.
 */

class AudioAlertManager {
	private ctx: AudioContext | null = null;

	private getContext(): AudioContext | null {
		if (typeof window === "undefined") return null;
		if (!this.ctx) {
			const AudioCtx =
				window.AudioContext || (window as any).webkitAudioContext;
			if (AudioCtx) {
				this.ctx = new AudioCtx();
			}
		}
		if (this.ctx && this.ctx.state === "suspended") {
			this.ctx.resume();
		}
		return this.ctx;
	}

	/**
	 * Plays a pleasant double-chime for new notifications.
	 */
	public playChime(
		type: "info" | "warning" | "error" | "success" = "info",
	): void {
		try {
			const ctx = this.getContext();
			if (!ctx) return;

			const now = ctx.currentTime;
			const osc = ctx.createOscillator();
			const gain = ctx.createGain();

			osc.type = "sine";

			let freq1 = 523.25; // C5
			let freq2 = 659.25; // E5

			if (type === "warning") {
				freq1 = 440.0; // A4
				freq2 = 554.37; // C#5
			} else if (type === "error") {
				freq1 = 349.23; // F4
				freq2 = 311.13; // Eb4
			} else if (type === "success") {
				freq1 = 587.33; // D5
				freq2 = 880.0; // A5
			}

			osc.frequency.setValueAtTime(freq1, now);
			osc.frequency.setValueAtTime(freq2, now + 0.12);

			gain.gain.setValueAtTime(0.08, now);
			gain.gain.exponentialRampToValueAtTime(0.001, now + 0.35);

			osc.connect(gain);
			gain.connect(ctx.destination);

			osc.start(now);
			osc.stop(now + 0.35);
		} catch (e) {
			console.warn("Could not play audio notification chime:", e);
		}
	}
}

export const audioAlerts = new AudioAlertManager();
