import { useState } from "react";
import ReactMarkdown from "react-markdown";  // <-- import react-markdown
import { generateRecipe } from "./lib/gemini";

export default function App() {
  const [foodInput, setFoodInput] = useState("");
  const [recipe, setRecipe] = useState("");
  const [loading, setLoading] = useState(false);

  const handleClick = async () => {
    if (!foodInput.trim()) {
      setRecipe("Please enter some ingredients first.");
      return;
    }
    setLoading(true);
    try {
      const prompt = `Give me a recipe using ${foodInput}. The user of this app is a vegetarian and appreciates when a recipe is quick to make and its description is blunt. However, the user enjoys full recipies with complex flavors, so find that balance.
Please add two return lines between each step of the output.`;

      const result = await generateRecipe(prompt);

      const output = typeof result === "string" ? result : result?.text ?? "No recipe found.";

      setRecipe(output);
    } catch (error) {
      console.error("Error generating recipe:", error);
      setRecipe("Error generating recipe.");
    } finally {
      setLoading(false);
    }
  };

  return (
    <main className="min-h-screen bg-white p-6 flex flex-col items-center">
      <style>
        {`
          @keyframes fade-in {
            from { opacity: 0; transform: translateY(4px); }
            to { opacity: 1; transform: translateY(0); }
          }

          .animate-fade-in {
            animation: fade-in 0.4s ease-out both;
          }
        `}
      </style>

      <div className="w-full max-w-xl">
        <h1 className="text-4xl font-bold mb-6 text-center text-gray-800">
          🥕 Food Waste Helper
        </h1>

        <textarea
          className="w-full p-4 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-green-400 transition"
          placeholder="Enter your leftover ingredients here..."
          value={foodInput}
          onChange={(e) => setFoodInput(e.target.value)}
          rows={5}
          disabled={loading}
        />

        <div className="mt-4 flex justify-center">
          <button
            onClick={handleClick}
            disabled={loading || !foodInput.trim()}
            aria-busy={loading}
            className={`px-6 py-2 font-semibold rounded ${
              loading
                ? "bg-gray-300 text-gray-700 cursor-not-allowed"
                : "bg-green-500 hover:bg-green-600 text-white"
            }`}
          >
            {loading ? "Cooking..." : "Find a Recipe"}
          </button>
        </div>

        {recipe && (
          <div className="mt-10">
            <h2 className="text-xl font-semibold text-gray-700 mb-3 border-b pb-1">
              🍽️ Your Recipe
            </h2>
            <div className="p-6 bg-yellow-50 border-l-4 border-yellow-400 rounded-lg shadow-md max-h-[500px] overflow-y-auto animate-fade-in prose prose-green">
              <ReactMarkdown>{recipe}</ReactMarkdown>
            </div>
          </div>
        )}

        {!recipe && !loading && (
          <p className="mt-6 text-center text-gray-500 italic">
            Enter ingredients and click "Find a Recipe" to get started.
          </p>
        )}
      </div>
    </main>
  );
}
