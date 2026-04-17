export default async function handler(req, res) {
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('Access-Control-Allow-Methods', 'POST, OPTIONS');
  res.setHeader('Access-Control-Allow-Headers', 'Content-Type');

  if (req.method === 'OPTIONS') { res.status(200).end(); return; }
  if (req.method !== 'POST') { res.status(405).json({ error: 'Method not allowed' }); return; }

  const apiKey = process.env.GEMINI_API_KEY;
  if (!apiKey) { res.status(500).json({ error: 'GEMINI_API_KEY not set' }); return; }

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

    const data = await response.json();
    console.log('Gemini raw response:', JSON.stringify(data).slice(0, 500));

    if (!response.ok) {
      res.status(response.status).json({ error: data?.error?.message || 'Gemini API 오류' });
      return;
    }

    const text = data.candidates?.[0]?.content?.parts?.[0]?.text || '';
    console.log('Extracted text:', text.slice(0, 300));

    // JSON 추출
    const jsonMatch = text.match(/\{[\s\S]*\}/);
    if (!jsonMatch) {
      res.status(500).json({ error: 'JSON을 찾을 수 없어요: ' + text.slice(0, 200) });
      return;
    }

    const parsed = JSON.parse(jsonMatch[0]);

    if (!parsed.stage1 || !parsed.stage2 || !parsed.stage3) {
      res.status(500).json({ error: '형식 오류: ' + JSON.stringify(parsed).slice(0, 200) });
      return;
    }

    // 클라이언트에 파싱된 JSON 직접 반환
    res.status(200).json({ parsed });

  } catch (e) {
    console.error('Error:', e.message);
    res.status(500).json({ error: e.message });
  }
}
 
