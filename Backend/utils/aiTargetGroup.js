const Groq = require("groq-sdk");
const prompt = require("prompt-sync")();

const groq = new Groq({
  apiKey: process.env.GROQ_API_KEY
});

const getTargetGroupFromAI = async (category, description) => {
  const prompt = `
  Analyze this food donation and respond with ONLY one word - "young", or "everyone".
  Consider which age group would prefer this type of food and respond 'young' if younger people enjoy it more and respond with 'everyone' if all age groups equally prefer this food. :
  - Category: ${category.trim()}
  - Description: ${description.trim() || "No description provided"}
  `.trim();

  try {
    const response = await groq.chat.completions.create({
      messages: [
        {
          role: "user",
          content: prompt
        }
      ],
      model: "llama-3.3-70b-versatile",
      temperature: 1,
      max_tokens: 10,
      top_p: 1
    });

    // Extract and validate answer
    const answer = response.choices[0]?.message?.content
      ?.trim()
      ?.toLowerCase()
      ?.replace(/"/g, '')
      ?.replace('.', '');

    // Target Group determined

    return ["young", "everyone"].includes(answer) ? answer : "everyone";

  } catch (error) {
    console.error("Groq API Error:", error.message);
    return "everyone";
  }
};

// const testing = async () => {
//   const cat = prompt('Enter Category: ');
//   const desc = prompt('Enter Description: ');
//   teststring = await getTargetGroupFromAI(cat, desc);
// };

// testing();

module.exports = getTargetGroupFromAI;