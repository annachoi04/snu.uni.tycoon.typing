export default async function handler(req, res) {
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('Access-Control-Allow-Methods', 'POST, OPTIONS');
  res.setHeader('Access-Control-Allow-Headers', 'Content-Type');
 
  if (req.method === 'OPTIONS') { res.status(200).end(); return; }
  if (req.method !== 'POST') { res.status(405).json({ error: 'Method not allowed' }); return; }
 
  const apiKey = process.env.GEMINI_API_KEY;
  if (!apiKey) {
    res.status(500).json({ error: 'GEMINI_API_KEY not set' });
    return;
  }
 
  try {
    const { prompt } = req.body;
    const url = `https://generativelanguage.googleapis.com/v1beta/models/gemini-1.5-flash:generateContent?key=${apiKey}`;
 
    const response = await fetch(url, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        contents: [{ parts: [{ text: prompt }] }],
        generationConfig: { temperature: 0.7, maxOutputTokens: 1200 }
      })
    });
 
    const rawText = await response.text();
 
    let data;
    try {
      data = JSON.parse(rawText);
    } catch (e) {
      res.status(500).json({ error: 'Gemini 응답 파싱 실패: ' + rawText.slice(0, 200) });
      return;
    }
 
    if (!response.ok) {
      res.status(response.status).json({ error: data?.error?.message || 'Gemini API 오류' });
      return;
    }
 
    const text = data.candidates?.[0]?.content?.parts?.[0]?.text || '';
    res.status(200).json({ content: [{ text }] });
 
  } catch (e) {
    res.status(500).json({ error: e.message });
  }
}
 
