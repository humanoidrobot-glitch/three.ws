export default async function handler(req, res) {
	if (req.method !== 'POST') {
		return res.status(405).json({ error: 'Method not allowed' });
	}

	const apiKey = process.env.AVATURN_API_KEY;
	if (!apiKey) {
		return res.status(500).json({ error: 'AVATURN_API_KEY not configured' });
	}

	try {
		const response = await fetch('https://api.avaturn.live/api/v1/sessions', {
			method: 'POST',
			headers: {
				Authorization: `Bearer ${apiKey}`,
				'Content-Type': 'application/json',
			},
		});

		if (!response.ok) {
			const text = await response.text();
			return res.status(response.status).json({ error: `Avaturn API error: ${text}` });
		}

		const data = await response.json();
		return res.status(200).json({ token: data.token, sessionId: data.session_id });
	} catch (err) {
		return res.status(500).json({ error: 'Failed to create Avaturn session' });
	}
}
