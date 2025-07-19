import { useState } from "react";
import { Button } from "./components/ui/button";
import { generateRecipe } from "./lib/gemini";

export default function App() {
  const [foodInput, setFoodInput] = useState("");
  const [recipe, setRecipe] = useState("");
  const [loading, setLoading] = useState(false);

  const handleClick = async () => {
    setLoading(true);
    try {
      const prompt = `Give me a recipe using ${foodInput}`;
      const result = await generateRecipe(prompt);

      // If Gemini returns text from a response object
      const output =
        typeof result === "string" ? result : result?.text || "No recipe found.";

      setRecipe(output);
    } catch (error) {
      console.error("Error generating recipe:", error);
      setRecipe("Error generating recipe.");
    } finally {
      setLoading(false);
    }
  };

  return (
    <main className="min-h-screen bg-white p-6">
      <h1 className="text-3xl font-bold mb-4">Food Waste App</h1>
      <textarea
        className="w-full p-2 border border-gray-300 rounded mb-4"
        placeholder="Enter your leftover ingredients here..."
        value={foodInput}
        onChange={(e) => setFoodInput(e.target.value)}
        rows={4}
      />
      <Button onClick={handleClick} disabled={loading}>
        {loading ? "Cooking..." : "Find a Recipe"}
      </Button>
      {recipe && (
        <div className="mt-6 p-4 bg-gray-100 rounded whitespace-pre-wrap">
          {recipe}
        </div>
      )}
    </main>
  );
}
