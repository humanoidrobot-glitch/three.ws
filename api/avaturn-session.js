// This file is no longer used. Safe to delete.
// The 3D Agent now uses native browser APIs (SpeechSynthesis + SpeechRecognition).
export default function handler(req, res) {
	res.status(410).json({ error: 'This endpoint has been removed.' });
}
