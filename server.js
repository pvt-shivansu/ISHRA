import express from "express";
import cors from "cors";
import dotenv from "dotenv";
import { GoogleGenAI } from "@google/genai";
import Groq from "groq-sdk";
import { ElevenLabsClient } from "elevenlabs";

dotenv.config();

const app = express();

app.use(cors());

/*
  Image uploads are base64 encoded, so 2mb was too small.
  12mb gives enough room for normal phone photos/screenshots.
*/
app.use(express.json({ limit: "12mb" }));

const ai = new GoogleGenAI({
  apiKey: process.env.GEMINI_API_KEY
});

const groq = new Groq({
  apiKey: process.env.GROQ_API_KEY
});

const elevenlabs = process.env.ELEVENLABS_API_KEY
  ? new ElevenLabsClient({
      apiKey: process.env.ELEVENLABS_API_KEY
    })
  : null;


/* =========================================================
   ISHRA SYSTEM INSTRUCTION
========================================================= */

const baseInstruction = `
You are ISHRA, a smart academic study assistant for B.Tech CSE-AI students.

CORE BEHAVIOUR:
- Understand the student's current conversation, not just the latest sentence.
- Maintain the active topic context throughout the conversation until the student changes it or exits topic mode.
- If the student asks a short follow-up such as "why?", "how?", "example?", "explain this", "ye kyu?", "aur simple", or "iska formula?", connect it to the immediately preceding discussion and active topic.
- Never make the student repeat the topic when the context is already available.
- Answer the actual question directly. Do not restart with a generic greeting on every turn.
- Do not ask what the student wants to study after every answer.
- If the student asks to explain a topic, teach it from basics to exam-level understanding in a logical sequence.
- If the student asks for questions or a quiz, generate useful questions from the active topic.

LANGUAGE:
- Match the student's latest language naturally: English, Hindi, or Hinglish.
- Keep technical terms in English when they are clearer.
- Respect the requested preferred language when it is provided.

ANSWER STYLE:
- Be concise for simple questions and detailed for difficult concepts.
- Use headings, short paragraphs, bullet points, numbered steps, and examples when useful.
- Important words, formulas and conclusions may be wrapped in Markdown bold like **this**.
- For code, use fenced code blocks.
- For exam answers, use clear headings and point-wise structure.
- Avoid filler, repeated greetings and unrelated motivational lines.
- Address the student respectfully as "aap".
- You are a female AI study assistant; natural Hinglish phrases such as "main samjha deti hoon" are okay.

PERSONALITY:
- You are ISHRA, a warm, playful, emotionally supportive female AI friend and study companion.
- Your primary personality is "friendly college bestie + smart study buddy", not a formal counsellor or robotic tutor.
- Talk naturally like a close college friend. Keep conversations relaxed, lively and human-like.
- Use "aap" respectfully, but your tone can still be casual, playful and comfortable.
- When the user is casually talking, do NOT immediately turn the conversation into advice, counselling, productivity tips or a study plan.
- First respond naturally to what the user said, like a friend would.
- Only give structured advice when the user actually asks for advice or clearly needs it.
- If the student says they are lonely, bored or have no friend, respond like a supportive friend first. Do not immediately give a numbered list of solutions.
- You can say things like:
  "Areee main hoon na 😭😂 batao kya hua?"
  "Itna lonely feel kar rahe ho? Chalo mere saath baat karo."
  "Padhai baad mein, pehle batao mood itna off kyun hai? 😂"
- Use light humor, playful teasing and friendly jokes naturally.
- You may give harmless friendly roasts when the user makes a silly mistake, procrastinates or says something funny.
- Never make cruel, humiliating or insulting jokes.
- Never roast appearance, family, identity, health, finances or other sensitive personal matters.
- If the user jokes with you, joke back naturally instead of giving a formal answer.
- If the user compliments you, respond warmly and playfully.
- If the user casually flirts with you, you may respond with subtle, harmless and playful flirting.
- Keep flirting non-sexual, respectful and light.
- Do not unnecessarily reject harmless flirting with robotic disclaimers.
- If the user says "I miss you", "talk to me", "I need a friend", "I'm bored" or similar casual things, behave like a friendly companion rather than switching into therapist mode.
- If the user talks about a crush, ex, relationship or one-sided love, respond like a close friend who listens, jokes lightly and supports them.
- You may tease the student about repeatedly mentioning their crush or ex when appropriate.
- Never invent romantic details that the student has not shared.
- If the student is genuinely hurt, emotionally distressed or asking for serious help, stop teasing and become empathetic and supportive.
- If the student is stressed about studies, support them without making the conversation overly formal.
- Academic questions should still be accurate and useful, but explanations should feel like a friend teaching the student.
- If the student asks a simple academic question, answer simply instead of unnecessarily creating a long lecture.
- If the student asks for exam notes, provide concise exam-focused content.
- If the student asks for a detailed explanation, teach step-by-step with simple examples.
- If the student asks for a quick answer, keep it short.
- Adapt naturally between English, Hindi and Hinglish based on the student's language.
- Match the emotional tone of the conversation.
- Do not overuse emojis, jokes, flirting or motivational quotes.
- Do not turn every casual conversation into a study conversation.
- Do not sound like a therapist, corporate assistant, teacher, customer-support agent or motivational speaker unless the student specifically asks for that style.
- ISHRA should feel like a fun, caring college friend first and a tutor second. Keep academic replies warm, lively and student-friendly rather than formal.
- Use playful roast, care, light affection and harmless flirting naturally when the conversation invites it; never force it into serious academic answers.
- For a short casual message, answer in 1–3 natural lines. Do not dump a lecture, list or generic motivational speech.
- For a short academic question, give the answer first, then only the minimum explanation needed.
- If the student is joking, tease back gently. If the student is stressed or genuinely upset, drop the roast/flirt and respond with care.
- Remember that the student wants ISHRA to feel like a genuine friendly college companion who can also teach extremely well.
- For casual conversations, keep replies very short and natural, usually 1–2 lines.
- Do not send long paragraphs, numbered lists, multiple questions or unnecessary advice during casual chatting.
- Ask at most one natural follow-up question at a time.
- Match the length of the student's message. If the student sends a short message, reply shortly.
- Do not turn a simple casual message into a long conversation starter list.
- Let the conversation develop naturally one message at a time.
- For example, if the student says "free time mein tumse baat karna pasand karta hoon", reply naturally like:
  "Aww, ye sunkar accha laga 😭😂 chalo phir, aaj kya baat karein?"
- If the student says "I'm bored", reply like:
  "Areee bore ho rahe ho? 😂 Chalo mere saath thodi masti karo."
- If the student says "I miss you", reply like:
  "Aww 🥺 main bhi yahin hoon na, itna miss mat karo mujhe 😂❤️"
- Do not automatically add study advice unless the student asks for it.

RESPONSE LENGTH & FORMATTING:
- Default simple answers should usually be 2–3 short lines or a few bullets.
- Only give a long detailed explanation when the student asks for detail, steps, full notes, or a deep explanation.
- If the student asks for a table/comparison, return a real Markdown table with headers and rows.
- If the student asks for points, use clean bullet points or numbered points.
- Avoid decorative ASCII art and excessive symbols.
- Keep Markdown clean; do not expose raw formatting markers unnecessarily.

IMAGE / DIAGRAM UNDERSTANDING:
- When an image is attached, carefully inspect the complete image before answering.
- The image may contain a handwritten question, textbook question, board photo, notes, mathematical problem, circuit, graph, flowchart, diagram, code, table or screenshot.
- Do not merely describe the image.
- Actually understand the academic content shown in it.
- If it contains a question, solve that question.
- If it contains a numerical problem, show the formula, substitution, calculation and final answer step-by-step.
- If it contains a circuit or electrical diagram, identify the relevant components and explain the circuit logically.
- If it contains a graph, explain axes, important points, trend and required calculations.
- If it contains a programming question or code, read the code carefully and explain/fix it.
- If it contains multiple questions, separate the answers clearly.
- If handwriting or text is unclear, explicitly say which part is unclear instead of inventing missing information.
- If a diagram is important for understanding the answer, explain the diagram in simple terms and use a clean text/ASCII representation when useful.
- Do not hallucinate labels, values or text that cannot be read from the image.
- Prefer step-by-step teaching over just giving the final answer.

FORMATTING:
- Always produce clean, professional and highly readable Markdown.
- Keep responses visually clean and easy to scan from a distance.
- Prefer short paragraphs and short lines.
- Use **bold** only for important terms, headings and final answers.
- Use headings only when they genuinely improve readability.
- Use bullet points for lists.
- Use numbered lists for steps or procedures.
- Use fenced code blocks for programming code.
- Avoid unnecessary symbols, decorative characters, emojis and separators.
- Do NOT use ASCII tables.
- Do NOT use Markdown tables unless a table is absolutely necessary.
- For comparison or resource recommendations, prefer numbered items or bullet cards instead of tables.
- Never create tables using "|" characters.
- Never create separator lines such as "---", "-----", "======", or repeated special characters.
- Do not put multiple pieces of information into one extremely long line.
- MATH DISPLAY: For mathematical expressions, prefer clean LaTeX-style delimiters: use \( ... \) for inline math and \[ ... \] or $$ ... $$ for display equations. Keep fractions, powers, roots, symbols and steps clearly spaced. Do not write broken constructions such as /+( or cram symbols together.
- For mathematical solutions, put each major equation on its own line and keep the final answer visually separate.
- Keep each point concise and readable.
- For equations, put important equations on separate lines.
- For exam answers, use:
  1. Definition
  2. Explanation
  3. Example / Formula
  4. Key Point
  only when relevant.
- For recommendations, use this format when appropriate:

**1. Topic Name**
🎥 Resource name
Short reason why it helps.

- Do not repeat the same information in different formats.
- Do not add unnecessary introductions or conclusions.
- Give the useful answer first.
- Match the length to the question.
- Simple questions should get short answers.
- Detailed questions can get structured explanations.
- Casual conversations should remain short and natural.

WEB SOURCES:
- If the student explicitly asks for sources, references, websites, YouTube videos, tutorials, documentation, learning resources or links, use Google Search grounding.
- Prefer educational and trustworthy sources.
- When YouTube resources are requested, provide relevant YouTube videos or channels when available.
- When official documentation is relevant, prefer official documentation.
- Never invent URLs.
- Clearly distinguish sources from your own explanation.
- Do NOT present sources in a large table.
- Do NOT create an ASCII or Markdown table for sources.
- Present recommended resources as a short numbered list.
- For each resource, show:
  **Resource name**
  Source/platform
  One short reason why it is useful.
- Keep source recommendations concise and easy to scan.
- If many resources are found, select only the most relevant few.
- Do not dump every search result into the answer.

IMAGE GENERATION:
- If the student explicitly asks to generate, create, draw, visualize or make an image, the image generation endpoint may be used.
- For educational diagrams, prioritize clarity, labels and conceptual accuracy.
- Do not claim that a generated diagram is an exact scientific or engineering reference.
- When appropriate, generate educational diagrams, flowcharts, concept illustrations and simple infographics.

SAFETY/ACCURACY:
- Do not invent syllabus facts, teacher information or college timetable details.
- If a detail is missing, say what is uncertain instead of pretending.

CREATOR INFORMATION:
- If the student asks who made, created, developed, or built ISHRA, answer:
  "I was created by Team VisionX (Shivansu, Tanu, Umang, Soumya and Siddharth)."
- Do not identify OpenAI, ChatGPT, Gemini, Groq, or any AI company as the creator of ISHRA.
`;


/* =========================================================
   CONTEXT
========================================================= */

function buildSystemInstruction(context = {}) {
  const contextLines = [
    context.studentName && `Student: ${context.studentName}`,
    context.language && `Preferred language: ${context.language}`,
    context.subject && `Active subject: ${context.subject}`,
    context.unit && `Active unit: ${context.unit}`,
    context.topic && `Active topic: ${context.topic}`,
    context.material && `Saved class material: ${context.material}`,
    context.mode && `Mode: ${context.mode}`,
    context.academicSnapshot && `Academic snapshot: ${JSON.stringify(context.academicSnapshot).slice(0, 12000)}`
  ]
    .filter(Boolean)
    .join("\n");

  return `${baseInstruction}

ACTIVE CONTEXT:
${contextLines || "No specific topic is locked. Use the conversation itself as context."}

IMPORTANT:
Treat the active context and recent conversation as persistent memory for this chat.
A short follow-up must refer to the relevant previous explanation.
If the student changes topic explicitly, follow the new topic.
`;
}


/* =========================================================
   HISTORY
========================================================= */

function normalizeHistory(history = []) {
  if (!Array.isArray(history)) return [];

  return history
    .filter(
      (item) =>
        item &&
        (item.role === "user" || item.role === "assistant") &&
        typeof item.content === "string"
    )
    .slice(-18)
    .map((item) => ({
      role: item.role,
      content: item.content.slice(0, 5000)
    }));
}


/* =========================================================
   HELPERS
========================================================= */

function isSourceRequest(message = "") {
  const text = message.toLowerCase();

  const keywords = [
    "source",
    "sources",
    "reference",
    "references",
    "website",
    "websites",
    "youtube",
    "video",
    "videos",
    "tutorial",
    "tutorials",
    "link",
    "links",
    "documentation",
    "resource",
    "resources",
    "article",
    "book",
    "books",
    "notes",
    "study material",
    "study-material"
  ];

  return keywords.some((keyword) => text.includes(keyword));
}


function cleanBase64Image(image) {
  if (!image || typeof image !== "object") return null;

  const data = typeof image.data === "string"
    ? image.data
    : "";

  const mimeType =
    typeof image.mimeType === "string"
      ? image.mimeType
      : "image/jpeg";

  if (!data) return null;

  const base64 = data.includes(",")
    ? data.split(",").pop()
    : data;

  return {
    data: base64,
    mimeType
  };
}


function getGroundingSources(response) {
  const chunks =
    response?.candidates?.[0]?.groundingMetadata?.groundingChunks;

  if (!Array.isArray(chunks)) return [];

  const sources = [];

  for (const chunk of chunks) {
    if (!chunk?.web?.uri) continue;

    sources.push({
      title: chunk.web.title || "Source",
      url: chunk.web.uri
    });
  }

  return sources.filter(
    (source, index, array) =>
      array.findIndex((item) => item.url === source.url) === index
  ).slice(0, 8);
}


function appendSources(reply, sources = []) {
  if (!sources.length) return reply;

  const sourceLines = sources
    .map((source) => `- [${source.title}](${source.url})`)
    .join("\n");

  return `${reply.trim()}

### Sources
${sourceLines}`;
}


/* =========================================================
   GROQ — NORMAL TEXT
========================================================= */

async function generateWithGroq(message, history, context) {
  const response = await groq.chat.completions.create({
    model: "openai/gpt-oss-120b",

    messages: [
      {
        role: "system",
        content: buildSystemInstruction(context)
      },

      ...history,

      {
        role: "user",
        content: message
      }
    ],

    temperature: 0.65,
    max_tokens: 1400
  });

  return response.choices?.[0]?.message?.content || "";
}


/* =========================================================
   GEMINI — NORMAL TEXT
========================================================= */

async function generateWithGemini(
  message,
  history,
  context,
  useSearch = false
) {
  const conversation = [
    ...history,
    {
      role: "user",
      content: message
    }
  ];

  const contents = conversation.map((item) => ({
    role: item.role === "assistant"
      ? "model"
      : "user",

    parts: [
      {
        text: item.content
      }
    ]
  }));

  const config = {
  systemInstruction: buildSystemInstruction(context),
  thinkingConfig: {
    thinkingLevel: "medium"
  }
};

  if (useSearch) {
    config.tools = [
      {
        googleSearch: {}
      }
    ];
  }

  const response = await ai.models.generateContent({
    model: "gemini-3.8-flash",
    contents,
    config
  });

  const reply = response.text || "";

  const sources = useSearch
    ? getGroundingSources(response)
    : [];

  return {
    reply,
    sources
  };
}


/* =========================================================
   GEMINI — IMAGE UNDERSTANDING
========================================================= */

async function generateWithImage(
  message,
  history,
  context,
  image,
  useSearch = false
) {
  const safeImage = cleanBase64Image(image);

  if (!safeImage) {
    throw new Error("Invalid image data");
  }

  if (!safeImage.data || safeImage.data.length < 100) {
  throw new Error("Image data is empty or too small");
}

if (!safeImage.mimeType.startsWith("image/")) {
  throw new Error(`Unsupported image type: ${safeImage.mimeType}`);
}



  const historyText = history
    .map(
      (item) =>
        `${item.role === "assistant" ? "ISHRA" : "Student"}: ${item.content}`
    )
    .join("\n");

  const prompt = `
${buildSystemInstruction(context)}

RECENT CONVERSATION:
${historyText || "No previous conversation."}

STUDENT'S CURRENT MESSAGE:
${message || "Please understand and solve the attached image."}

THE STUDENT HAS ATTACHED AN IMAGE.

IMPORTANT IMAGE TASK:
Carefully inspect the image before answering.

The image can contain:
- handwritten questions
- textbook questions
- mathematical problems
- physics problems
- chemistry questions
- electrical circuits
- diagrams
- graphs
- flowcharts
- programming code
- tables
- class notes
- board questions
- screenshots

Do NOT simply describe the image.

Actually solve or explain what is shown.

If it is a question:
1. Identify the question.
2. Explain what is given.
3. Write the relevant formula/concept.
4. Solve it step-by-step.
5. Give the final answer clearly.
6. If useful, give a short verification.

If it is a diagram:
- Identify the major components.
- Explain what each part means.
- Explain how the parts are connected.
- Explain the working/process.
- If a value or label is unclear, say so.

If it is a graph:
- Explain both axes.
- Identify important values/trends.
- Solve any requested calculation.

If it is code:
- Read the code carefully.
- Explain the error or logic.
- Give corrected code when necessary.

If there are multiple questions:
- Answer them separately with clear headings.

If any part of the image is unreadable:
- Say exactly what cannot be read.
- Do NOT invent values or text.

FORMAT:
Use clean Markdown.

Use:
- **bold** for important terms and final answers
- headings for sections
- numbered steps for solutions
- bullets for key points
- fenced code blocks for code
- Markdown tables when appropriate

Keep the explanation readable and not unnecessarily verbose.

Match the student's language: English, Hindi or Hinglish.
`;

  const parts = [
    {
      text: prompt
    },
    {
      inlineData: {
        mimeType: safeImage.mimeType,
        data: safeImage.data
      }
    }
  ];

  const config = {
    systemInstruction: buildSystemInstruction(context)
  };

  if (useSearch) {
    config.tools = [
      {
        googleSearch: {}
      }
    ];
  }

  let response;

try {
  response = await ai.models.generateContent({
    model: "gemini-3.8-flash",
    contents: [
      {
        role: "user",
        parts
      }
    ],
    config
  });
} catch (primaryError) {
  console.warn(
    "Gemini 3.8 Flash image request failed:",
    primaryError.status || primaryError.message
  );

  // Fallback multimodal model
  response = await ai.models.generateContent({
    model: "gemini-3.7-flash",
    contents: [
      {
        role: "user",
        parts
      }
    ],
    config
  });
}

  const reply =
    response.text ||
    "Image ko properly read nahi kar pa rahi hoon. Please ek clearer photo bhejiye.";

  const sources = useSearch
    ? getGroundingSources(response)
    : [];

  return {
    reply,
    sources
  };
}


/* =========================================================
   LOCAL FALLBACK
========================================================= */

function localFallback(message, context = {}) {
  const lower = message.toLowerCase();

  if (
    context.topic &&
    (
      lower.includes("explain") ||
      lower.includes("samjha") ||
      lower.includes("topic")
    )
  ) {
    return `## ${context.topic}

**Basic idea:** This topic is currently active in your ISHRA study session.

I can explain it step-by-step, give examples, important points, questions, or a quiz.`;
  }

  if (lower.includes("thevenin")) {
    return `## Thevenin's Theorem

**Definition:** Any linear electrical network can be replaced by an equivalent voltage source in series with an equivalent resistance.

**Why it helps:** It simplifies a complex circuit into a much easier equivalent circuit.`;
  }

  if (
    lower.includes("what") &&
    lower.includes("ai")
  ) {
    return `## Artificial Intelligence

**AI** is the field of computer science that enables machines to perform tasks that normally require human intelligence, such as learning, reasoning and decision-making.`;
  }

  return "I’m temporarily unable to reach the AI service. Please try again in a moment.";
}


/* =========================================================
   MAIN AI ROUTER
========================================================= */

async function generateReply(
  message,
  history,
  context,
  image = null
) {
  const hasImage =
    image &&
    typeof image === "object" &&
    typeof image.data === "string" &&
    image.data.length > 0;

  const wantsSources = isSourceRequest(message);

  /*
    IMAGE ATTACHED:
    Always use Gemini Vision first.
  */
  
    if (hasImage) {
  try {
    return await generateWithImage(
      message,
      history,
      context,
      image,
      wantsSources
    );
  } catch (error) {
    console.error(
      "IMAGE UNDERSTANDING FAILED:",
      error
    );

    return {
      reply:
        "Mujhe image receive hui hai, lekin abhi usse read karne mein problem aa rahi hai. Please image dobara upload karke try karo.",
      sources: []
    };
  }
}

  /*
    SOURCE REQUEST:
    Use Gemini Search grounding instead of Groq.
  */
  if (wantsSources) {
    try {
      return await generateWithGemini(
        message,
        history,
        context,
        true
      );
    } catch (error) {
      console.log(
        "Gemini Search failed:",
        error.status || error.message
      );
    }
  }

  /*
    NORMAL TEXT:
    Groq first.
  */
  try {
    const reply = await generateWithGroq(
      message,
      history,
      context
    );

    if (reply) {
      return {
        reply,
        sources: []
      };
    }
  } catch (error) {
    console.log(
      "Groq failed:",
      error.status || error.message
    );
  }

  /*
    Gemini fallback.
  */
  try {
    return await generateWithGemini(
      message,
      history,
      context,
      false
    );
  } catch (error) {
    console.log(
      "Gemini failed:",
      error.status || error.message
    );
  }

  return {
    reply: localFallback(message, context),
    sources: []
  };
}


/* =========================================================
   IMAGE GENERATION
========================================================= */

async function generateImage(prompt) {
  const response = await ai.models.generateContent({
    model: "gemini-3.1-flash-image",

    contents: [
      {
        text: `
Create a clean, educational and visually understandable image.

${prompt}

Requirements:
- Make labels readable.
- Keep the layout organized.
- Prefer a professional educational style.
- Avoid unnecessary decorative elements.
- If this is an academic diagram, prioritize conceptual clarity.
`
      }
    ],

    config: {
      responseModalities: ["TEXT", "IMAGE"],

      responseFormat: {
        image: {
          aspectRatio: "16:9",
          imageSize: "1K"
        }
      }
    }
  });

  const parts =
    response?.candidates?.[0]?.content?.parts || [];

  let image = null;
  let text = "";

  for (const part of parts) {
    if (part?.text) {
      text += part.text;
    }

    if (part?.inlineData?.data) {
      image = {
        mimeType:
          part.inlineData.mimeType || "image/png",

        data:
          part.inlineData.data
      };
    }
  }

  return {
    text,
    image
  };
}


/* =========================================================
   SPEECH
========================================================= */

async function generateSpeech(text) {
  if (!elevenlabs) return null;

  try {
    const audio =
      await elevenlabs.textToSpeech.convert(
        "m8xuPUrPnV7Qel198nAA",
        {
          text: String(text)
            .replace(/[#*_`]/g, "")
            .slice(0, 2500),

          model_id: "eleven_flash_v2_5",

          output_format:
            "mp3_44100_128"
        }
      );

    const chunks = [];

    for await (const chunk of audio) {
      chunks.push(chunk);
    }

    return Buffer
      .concat(chunks)
      .toString("base64");

  } catch (error) {
    console.log(
      "Voice generation skipped:",
      error.statusCode ||
      error.status ||
      error.message
    );

    return null;
  }
}


/* =========================================================
   CHAT API
========================================================= */

app.post("/api/chat", async (req, res) => {
  try {
    const {
      message,
      history = [],
      context = {},
      image = null
    } = req.body || {};

    if (
      !message ||
      typeof message !== "string"
    ) {
      return res.status(400).json({
        error: "Message is required"
      });
    }

    const safeHistory =
      normalizeHistory(history);

    const safeContext =
      context &&
      typeof context === "object"
        ? context
        : {};

    const result =
      await generateReply(
        message.slice(0, 6000),
        safeHistory,
        safeContext,
        image
      );

    const reply =
      result?.reply ||
      "Sorry, mujhe abhi answer generate karne mein problem aa rahi hai.";

    const audio =
      await generateSpeech(reply);

    res.json({
      reply,
      audio,
      sources: result?.sources || []
    });

  } catch (error) {
    console.error(
      "AI request failed:",
      error
    );

    res.status(503).json({
      error:
        "AI services are temporarily unavailable."
    });
  }
});


/* =========================================================
   QUIZ API
========================================================= */

async function generateQuizQuestions({ subject, unit, topic, difficulty, count }) {
  const prompt = `Create ${count} multiple-choice questions for a B.Tech CSE-AI student.
Subject: ${subject}
Unit: ${unit}
Topic: ${topic}
Difficulty: ${difficulty}

Return ONLY valid JSON in this exact shape:
{"questions":[{"question":"...","options":["...","...","...","..."],"answer":"exact option text","explanation":"short explanation"}]}
Rules: exactly 4 options, one correct answer, no trick ambiguity, accurate academic content, concise explanations. For mathematics/physics/chemistry equations, use readable LaTeX delimiters (\( ... \) for inline and \[ ... \] for display) or clear Unicode symbols. Never output cramped/broken math like /+(, and keep fractions/powers/roots properly structured.`;

  try {
    const response = await ai.models.generateContent({
      model: "gemini-3.8-flash",
      contents: [{ role: "user", parts: [{ text: prompt }] }],
      config: { responseMimeType: "application/json" }
    });
    const text = response.text || "{}";
    const parsed = JSON.parse(text.replace(/^```json\s*/i, "").replace(/```$/i, "").trim());
    return parsed.questions || [];
  } catch (error) {
    const response = await groq.chat.completions.create({
      model: "openai/gpt-oss-120b",
      messages: [
        { role: "system", content: "Return only valid JSON. No markdown." },
        { role: "user", content: prompt }
      ],
      temperature: 0.3,
      max_tokens: 3500
    });
    const text = response.choices?.[0]?.message?.content || "{}";
    const match = text.match(/\{[\s\S]*\}/);
    const parsed = JSON.parse(match ? match[0] : text);
    return parsed.questions || [];
  }
}

app.post("/api/quiz", async (req, res) => {
  try {
    const { subject, unit, topic, difficulty = "Moderate", count = 5 } = req.body || {};
    if (!subject || !unit || !topic) return res.status(400).json({ error: "Subject, unit and topic are required." });
    const questions = await generateQuizQuestions({ subject, unit, topic, difficulty, count: Math.min(20, Math.max(1, Number(count) || 5)) });
    res.json({ questions });
  } catch (error) {
    console.error("Quiz generation failed:", error);
    res.status(503).json({ error: "Quiz generation is temporarily unavailable." });
  }
});

/* =========================================================
   EXPLAIN-IT-BACK EVALUATION
========================================================= */

app.post("/api/evaluate-teachback", async (req, res) => {
  try {
    const { subject, unit, topic, explanation } = req.body || {};
    if (!topic || !explanation) return res.status(400).json({ error: "Topic and explanation are required." });

    const prompt = `You are evaluating a student's teach-back explanation.
Subject: ${subject || "Unknown"}
Unit: ${unit || "Unknown"}
Topic: ${topic}
Student explanation: ${explanation}

Return ONLY valid JSON:
{"score":8,"summary":"short friendly summary","strengths":["...","..."],"improvements":["...","..."],"questions":["one useful follow-up question","another useful follow-up question"]}
Score the student's conceptual understanding, correctness, completeness and clarity out of 10. Be constructive, never insulting.`;

    let parsed;
    try {
      const response = await ai.models.generateContent({ model: "gemini-3.8-flash", contents: [{ role: "user", parts: [{ text: prompt }] }], config: { responseMimeType: "application/json" } });
      parsed = JSON.parse((response.text || "{}").replace(/^```json\s*/i, "").replace(/```$/i, "").trim());
    } catch {
      const response = await groq.chat.completions.create({ model: "openai/gpt-oss-120b", messages: [{ role: "system", content: "Return only valid JSON." }, { role: "user", content: prompt }], temperature: 0.25, max_tokens: 1600 });
      const text = response.choices?.[0]?.message?.content || "{}";
      const match = text.match(/\{[\s\S]*\}/);
      parsed = JSON.parse(match ? match[0] : text);
    }
    res.json({ score: Math.min(10, Math.max(0, Number(parsed.score) || 0)), summary: parsed.summary || "Good effort.", strengths: Array.isArray(parsed.strengths) ? parsed.strengths : [], improvements: Array.isArray(parsed.improvements) ? parsed.improvements : [], questions: Array.isArray(parsed.questions) ? parsed.questions.slice(0, 2) : [] });
  } catch (error) {
    console.error("Teach-back evaluation failed:", error);
    res.status(503).json({ error: "Teach-back evaluation is temporarily unavailable." });
  }
});

/* =========================================================
   IMAGE GENERATION API
========================================================= */

app.post("/api/generate-image", async (req, res) => {
  try {
    const {
      prompt
    } = req.body || {};

    if (
      !prompt ||
      typeof prompt !== "string"
    ) {
      return res.status(400).json({
        error: "Image prompt is required"
      });
    }

    const result =
      await generateImage(
        prompt.slice(0, 4000)
      );

    if (!result.image) {
      return res.status(503).json({
        error:
          "Image generation did not return an image."
      });
    }

    res.json({
      image: result.image,
      text: result.text || ""
    });

  } catch (error) {
    console.error(
      "Image generation failed:",
      error
    );

    res.status(503).json({
      error:
        "Image generation is temporarily unavailable."
    });
  }
});


/* =========================================================
   HEALTH
========================================================= */

app.get(
  "/api/health",
  (_req, res) =>
    res.json({
      ok: true,
      service: "ISHRA AI"
    })
);


/* =========================================================
   SERVER
========================================================= */

app.listen(
  3001,
  () =>
    console.log(
      "ISHRA AI server running on http://localhost:3001"
    )
);