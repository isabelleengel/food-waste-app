// src/lib/gemini.ts

import { GoogleGenerativeAI } from "@google/generative-ai";

const genAI = new GoogleGenerativeAI(import.meta.env.VITE_GEMINI_API_KEY);
  const model = genAI.getGenerativeModel({ model: "gemini-2.5-flash" });

export async function generateRecipe(prompt: string): Promise<string> {

  try {
    const result = await model.generateContent(prompt);
    const response = await result.response;
    const text = response.text();
    return text;
  } catch (err) {
    console.error("Gemini error:", err);
    return "No recipe found. Try again later.";
  }
}

export async function generateGroceryList(
  recipe: string,
  userIngredients: string[]
): Promise<string[]> {
  const prompt = `
You're a helpful chef assistant. Here's a recipe:

${recipe}

The user says they already have: ${userIngredients.join(", ")}

Return a plain comma-separated list of all ingredients the user needs to buy to complete this recipe, based only on ingredients they don't already have. Do not include any explanation, just the list.`;

  const result = await model.generateContent(prompt);
  const response = await result.response;
  return response
    .text()
    .split(",")
    .map((i) => i.trim().toLowerCase())
    .filter((i) => i.length > 0);
}
