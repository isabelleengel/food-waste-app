import { useState } from "react";
import ReactMarkdown from "react-markdown";
import { generateRecipe } from "./lib/gemini";
import { useNavigate } from "react-router-dom";

export default function Home() {
  const [ingredientInput, setIngredientInput] = useState("");
  const [ingredients, setIngredients] = useState<string[]>([]);
  const [recipe, setRecipe] = useState("");
  const [loading, setLoading] = useState(false);

  const navigate = useNavigate();

  // Add ingredient, remove ingredient, handleKeyDown remain the same...

  const addIngredient = () => {
    const trimmed = ingredientInput.trim();
    if (trimmed && !ingredients.includes(trimmed.toLowerCase())) {
      setIngredients([...ingredients, trimmed]);
      setIngredientInput("");
    }
  };

  const removeIngredient = (index: number) => {
    setIngredients(ingredients.filter((_, i) => i !== index));
  };

  const handleKeyDown = (e: React.KeyboardEvent<HTMLInputElement>) => {
    if (e.key === "Enter") {
      e.preventDefault();
      addIngredient();
    }
  };

  const handleClick = async () => {
    if (ingredients.length === 0) {
      setRecipe("Please add at least one ingredient.");
      return;
    }
    setLoading(true);
    try {
      const ingredientList = ingredients.join(", ");
      const prompt = `Give me a recipe using ${ingredientList}. The user of this app is a vegetarian and appreciates when a recipe is quick to make and its description is blunt. However, the user enjoys full recipes with complex flavors, so find that balance.
Please add two return lines between each step of the output.`;

      const result = await generateRecipe(prompt);
      const output =
        typeof result === "string" ? result : result?.text ?? "No recipe found.";
      setRecipe(output);
    } catch (error) {
      console.error("Error generating recipe:", error);
      setRecipe("Error generating recipe.");
    } finally {
      setLoading(false);
    }
  };

  // Parse ingredients from the recipe (simple parse by markdown lines starting with "- ")
  const parseIngredients = (recipeText: string) => {
    const lines = recipeText.split("\n");
    const startIndex = lines.findIndex((line) =>
      line.toLowerCase().includes("ingredients")
    );
    if (startIndex === -1) return [];

    const ingredients: string[] = [];
    for (let i = startIndex + 1; i < lines.length; i++) {
      const line = lines[i].trim();
      if (!line.startsWith("-")) break;
      ingredients.push(line.slice(1).trim());
    }
    return ingredients;
  };

  // Get missing ingredients by comparing user ingredients (case-insensitive substring check)
  const getMissingIngredients = () => {
    if (!recipe) return [];
    const recipeIngredients = parseIngredients(recipe);
    const userIngredients = ingredients.map((i) => i.toLowerCase());

    return recipeIngredients.filter(
      (ri) => !userIngredients.some((ui) => ri.toLowerCase().includes(ui))
    );
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

        {/* Ingredient Input Section */}
        <label
          htmlFor="ingredient-input"
          className="block mb-2 font-semibold text-gray-700"
        >
          Enter leftover ingredients
        </label>

        <div className="flex gap-2">
          <input
            id="ingredient-input"
            type="text"
            className="flex-grow p-3 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-green-400 transition"
            placeholder="Add ingredient (e.g., spinach)"
            value={ingredientInput}
            onChange={(e) => setIngredientInput(e.target.value)}
            onKeyDown={handleKeyDown}
            disabled={loading}
            aria-label="Ingredient input"
          />
          <button
            onClick={addIngredient}
            disabled={loading || !ingredientInput.trim()}
            className={`px-5 py-3 font-semibold rounded ${
              loading || !ingredientInput.trim()
                ? "bg-gray-300 text-gray-700 cursor-not-allowed"
                : "bg-green-500 hover:bg-green-600 text-white"
            }`}
            aria-label="Add ingredient"
          >
            Add
          </button>
        </div>

        {/* Display Added Ingredients */}
        {ingredients.length > 0 && (
          <div className="mt-4 flex flex-wrap gap-2">
            {ingredients.map((ing, idx) => (
              <div
                key={idx}
                className="flex items-center gap-2 bg-green-100 text-green-800 rounded-full px-3 py-1 font-medium select-none"
              >
                {ing}
                <button
                  onClick={() => removeIngredient(idx)}
                  aria-label={`Remove ${ing}`}
                  className="text-green-600 hover:text-green-900 focus:outline-none"
                  type="button"
                >
                  ×
                </button>
              </div>
            ))}
          </div>
        )}

        {/* Find Recipe Button */}
        <div className="mt-6 flex justify-center gap-4">
          <button
            onClick={handleClick}
            disabled={loading || ingredients.length === 0}
            aria-busy={loading}
            className={`px-6 py-3 font-semibold rounded ${
              loading || ingredients.length === 0
                ? "bg-gray-300 text-gray-700 cursor-not-allowed"
                : "bg-green-500 hover:bg-green-600 text-white"
            }`}
          >
            {loading ? "Cooking..." : "Find a Recipe"}
          </button>

          {recipe && (
            <button
              onClick={() =>
                navigate("/grocery-list", {
                  state: {
                    missingIngredients: getMissingIngredients(),
                  },
                })
              }
              className="px-6 py-3 font-semibold rounded bg-yellow-500 hover:bg-yellow-600 text-white"
            >
              View Grocery List
            </button>
          )}
        </div>

        {/* Recipe Display */}
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
            Add ingredients above and click "Find a Recipe" to get started.
          </p>
        )}
      </div>
    </main>
  );
}
