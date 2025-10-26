require('dotenv').config();
const express = require('express');
const cors = require('cors');
const bodyParser = require('body-parser');
const axios = require('axios');

const app = express();
const PORT = process.env.PORT || 5000;

// ✅ Allowed origins for frontend
const allowedOrigins = [
    'https://speech-rho.vercel.app', // production
    'http://localhost:3000'          // local
];

const resumeCOntent = `PROFESSIONAL SUMMARY
    - Solution - driven Full Stack Engineer with over 4 + years of experience in building modular, reusable React components and libraries.Skilled in state management(Redux Toolkit, Saga), API integration, and automated testing(Jest, Cypress).
- Adept at leveraging Typescript, JavaScript, and modern front - end design patterns to deliver scalable, secure, and high - quality applications.
- Recognized for mentoring peers, driving technical excellence, and collaborating closely with product owners to align solutions with customer needs.
- Strong analytical and problem - solving skills with a track record of successful.
- Thrive in working in a fast - paced, high - tech environment with cross - functional teams using.
TECHNICAL SKILLS
    - React(Hooks, Forms, Routing, Lifecycle Methods, Code Splitting).
- State Management: Redux Toolkit, Saga
    - TypeScript, JavaScript, JSX and TSX
        - Frontend: React(Hooks, Forms, Routing, Lifecycle Methods), TypeScript, JavaScript(ES6), HTML5, CSS3
            - Testing: Jest, Cypress(Automation, Unit, Integration)
                - Backend: GoLang, NodeJS and Java(Spring boot),
                    - Databases: MySQL, MongoDB, Redis
                        - Version Control: GitLab, SVN
                            - Architecture: Micro Frontend(Single - Spa)
                                - Other: Telemetry Frameworks.
WORK EXPERIENCE
System Engineer / Senior Full Stack Developer
Tata Consultancy Service - BlackRock(June 2023 - Present) Chennai, India
Achievements[Project – Aladdin Studio]
 Led the migration of a monolithic React Application(Create React App) to a scalable Micro - Frontend(MFE) architecture using Single-SPA, significantly improving modularity, deployment flexibility, and team autonomy.This transition reduced initial project render times by 20 % and enhanced overall system performance and maintainability.
 Implemented an AI - powered Copilot assistant that enables users to quickly search and navigate APIs, ATXs and studio space / project, dramatically improving discoverability and ease to use
 Collaborated with cross - functional teams to define the technical requirements and standards for Copilot integration, ensuring seamless compatibility.
 Enhanced application performance with code - splitting and lifecycle optimizations, reducing initial load times by 20 %.
 Designed secure API integrations using Axios/Fetch for real-time data synchronization.
 Collaborated directly with product owners and QA to deliver user stories with the highest quality.
 Built full - stack solutions with Java Spring Boot + GO Lang backend and React front - end.
System Engineer
Tata Consultancy Service - BlackRock(Feb 2023 – June 2023) Chennai, India
Achievements[Project – Studio - Compute – Micro Frontend Application]
 Developed backend services using Go and built dynamic frontend components with React and Typescript.Integrated real - time space and project data into a Micro Frontend architecture using React Redux Toolkit.
 Contributed to the Compute platform, enabling administrators to create, manage, and federate custom compute environments across teams and organizations.
 Integrated Studio Compute capabilities to support automated, scheduled, and event - driven workflows, including jobs, functions frameworks, and Studio Events.
 Implemented an automated notification system that alerts space / project owners and members in real - time when critical scheduled jobs are executed, enhancing operational visibility.
Associate Consultant
Atos Syntel - Fedex(June 2021 – Feb 2023) Chennai, India
Achievements[Project – Common Data Service]
 Led migration to a multi - maven microservices and micro - frontend architecture, improving modularity and deployment agility.
 Developed Java Spring boot and Go backend services with React / Next.js frontend integration.
 Designed data - driven dashboards with telemetry and KPIs to optimize flows and user engagement.
 Built AI - powered copilot assistant for API discoverability and onboarding, reducing training time.
 Implemented trunk - based development with AWS feature flags for safe, incremental releases.
 Automated testing pipelines(Jest, Cypress) and integrated into Jenkins + GitLab CI / CD, improving release reliability.
 Partnered with stakeholders, product owners, and QA to align features with business priorities.`;

// ✅ Main CORS middleware for normal requests
app.use(cors({
    origin: function (origin, callback) {
        // Allow requests without an origin (mobile apps, curl)
        if (!origin) return callback(null, true);
        if (allowedOrigins.includes(origin)) {
            return callback(null, true);
        }
        return callback(new Error('CORS policy: Origin not allowed'));
    },
    methods: ['GET', 'POST', 'OPTIONS'],
    allowedHeaders: ['Content-Type', 'Authorization']
}));

// ✅ Global OPTIONS handler (prevents pathToRegexpError in Render)
app.use((req, res, next) => {
    if (req.method === 'OPTIONS') {
        if (allowedOrigins.includes(req.headers.origin)) {
            res.header('Access-Control-Allow-Origin', req.headers.origin);
        }
        res.header('Access-Control-Allow-Methods', 'GET, POST, OPTIONS');
        res.header('Access-Control-Allow-Headers', 'Content-Type, Authorization');
        return res.sendStatus(200);
    }
    next();
});

// ✅ Parse incoming JSON requests
app.use(bodyParser.json());

const OPENROUTER_API_KEY = process.env.OPENROUTER_API_KEY;

// === Routes ===
app.get('/api/chat', (req, res) => {
    res.json({ message: 'Welcome to the OpenRouter Chat API!' });
});

app.post('/api/chat', async (req, res) => {
    const { prompt, role, apiKey } = req.body;

    if (!prompt || !prompt.trim()) {
        return res.status(400).json({ error: 'Prompt is required.' });
    }

    if (!apiKey || !apiKey.trim()) {
        return res.status(400).json({ error: 'API key is required.' });
    }

    const roleContext = role?.trim()
        ? `You are a helpful AI assistant acting as a ${role.trim()}.`
        : 'You are a helpful AI assistant.';

    const resume = resumeCOntent || '';

    try {
        const messages = [
            { role: 'system', content: roleContext },
        ];
        if (resume) {
            messages.push({
                role: 'system',
                content:
                    'IMPORTANT: Use the following resume as the primary input when answering. Base all recommendations, edits, and suggestions primarily on this resume:\n\n' +
                    resume,
            });
        }
        messages.push({ role: 'user', content: prompt });

        const response = await axios.post(
            'https://openrouter.ai/api/v1/chat/completions',
            {
                model: 'openai/gpt-4o-mini',
                messages,
            },
            {
                headers: {
                    Authorization: `Bearer ${apiKey.trim() || OPENROUTER_API_KEY}`,
                    'Content-Type': 'application/json',
                    'HTTP-Referer': 'https://speech-rho.vercel.app', // ✅ use prod URL
                    'X-Title': 'SpeechToTextApp',
                },
                timeout: 10000,
            }
        );

        const aiMessage = response.data.choices[0].message.content;
        res.json({ response: aiMessage });
    } catch (error) {
        console.error('[OpenRouter Error]', error.response?.data || error.message);
        res.status(500).json({
            error: 'Failed to fetch AI response',
            details: error.response?.data || error.message
        });
    }
});

// === Start the server ===
app.listen(PORT, () => {
    console.log(`✅ Server running on http://localhost:${PORT}`);
});
