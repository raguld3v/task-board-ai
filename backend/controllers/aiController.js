const Groq = require("groq-sdk");

const groq = new Groq({
  apiKey: process.env.GROQ_API_KEY,
});

exports.generateTask = async (req, res) => {
  try {
    const { prompt } = req.body;

    const completion = await groq.chat.completions.create({
      model: "llama-3.1-8b-instant",
      messages: [
        {
          role: "user",
          content: `Convert this into JSON.

                    Rules:
                    - Return ONLY valid JSON
                    - No markdown
                    - No backticks
                    - No explanation

                    Format:
                    {
                    "title": "...",
                    "description": "..."
                    }

                    Input: ${prompt}`,
        },
      ],
    });

    res.json({
      result: completion.choices[0].message.content,
    });
  } catch (err) {
    res.status(500).json(err);
  }
};
