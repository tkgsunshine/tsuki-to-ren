const apiKey = process.env.GEMINI_API_KEY;
console.log('Has API Key:', !!apiKey);

const models = [
  'gemini-1.5-flash',
  'gemini-1.5-flash-latest',
  'gemini-1.5-pro',
  'gemini-2.0-flash-exp',
  'gemini-2.0-flash',
  'gemini-pro'
];

async function test() {
  for (const m of models) {
    try {
      const res = await fetch(`https://generativelanguage.googleapis.com/v1beta/models/${m}:generateContent?key=${apiKey}`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          contents: [{ role: 'user', parts: [{ text: 'こんにちは！' }] }]
        })
      });
      const data = await res.json();
      if (data.candidates?.[0]?.content?.parts?.[0]?.text) {
        console.log(`SUCCESS with model: ${m} ->`, data.candidates[0].content.parts[0].text.substring(0, 50));
      } else {
        console.log(`FAILED model: ${m} ->`, data.error?.message || data);
      }
    } catch (e) {
      console.log(`ERROR model: ${m} ->`, e.message);
    }
  }
}

test();
