// geminiService.js

export const analyzeCodeWithGemini = async (code, language) => {
    const apiKey = localStorage.getItem("geminiApiKey");

    // Function to list available models (for debugging purposes)
    async function listAvailableModels(apiKey) {
        try {
            const response = await fetch(`https://generativelanguage.googleapis.com/v1beta/models?key=${apiKey}`, {
                method: 'GET',
            });
            const data = await response.json();
            console.log('Available models:', data.models);
            return data.models; // Optionally return the models for further use
        } catch (error) {
            console.error('Error fetching models:', error);
            return null;
        }
    }

    // Optionally call this to see available models in the console
    await listAvailableModels(apiKey);

    if (!apiKey) {
        throw new Error("Gemini API key not found. Please add it in Settings.");
    }

    try {
        console.log(`Analyzing ${language} code with Google Gemini API...`);

        const prompt = `
            Analyze the following ${language.toUpperCase()} code:
            
            \`\`\`${language}
            ${code}
            \`\`\`
            
            Provide:
            1. A line-by-line explanation of what the code does
            2. The overall functionality and purpose of the code, including inputs, outputs, and run. Time/space complexity analysis
            4. Three related LeetCode problems that use similar concepts (with difficulty levels)
            
            Format the response as a JSON object with the following structure:
            {
                "summary": "Brief summary of the code",
                "explanation": "Detailed explanation with educational content suitable for exam preparation",
                "relatedProblems": [
                    {
                        "title": "Problem title",
                        "url": "LeetCode URL",
                        "difficulty": "Easy/Medium/Hard"
                    }
                ]
            }
        `;

        // Use a valid model name (e.g., "gemini-1.5-pro" instead of "gemini-pro")
        const modelName = "gemini-1.5-pro"; // Replace with a confirmed valid model if needed
        const response = await fetch(
            `https://generativelanguage.googleapis.com/v1beta/models/${modelName}:generateContent?key=${apiKey}`,
            {
                method: "POST",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify({
                    contents: [{ parts: [{ text: prompt }] }],
                    generationConfig: {
                        temperature: 0.2,
                        topK: 40,
                        topP: 0.95,
                        maxOutputTokens: 2048,
                    },
                }),
            }
        );

        if (!response.ok) {
            const errorData = await response.json();
            throw new Error(`Gemini API error: ${errorData.error?.message || response.statusText}`);
        }

        const data = await response.json();
        const responseText = data.candidates[0].content.parts[0].text;
        const jsonMatch = responseText.match(/```json\n([\s\S]*?)\n```/) || responseText.match(/{[\s\S]*}/);

        if (!jsonMatch) {
            throw new Error("Gemini API did not return a valid JSON response.");
        }

        const jsonStr = jsonMatch[1] || jsonMatch[0];
        return JSON.parse(jsonStr);
    } catch (error) {
        console.error("Error analyzing code with Gemini:", error);
        throw error; // Propagate the error instead of using fallback
    }
};