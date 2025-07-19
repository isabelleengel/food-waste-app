import { useEffect, useState } from "react";
import { useLocation, useNavigate } from "react-router-dom";
import { generateGroceryList } from "./lib/gemini"; // 👈 import your new helper

export default function GroceryList() {
  const location = useLocation();
  const navigate = useNavigate();
  const [missingIngredients, setMissingIngredients] = useState<string[]>([]);
  const [loading, setLoading] = useState(true);

  const recipe: string = location.state?.recipe || "";
  const userIngredients: string[] = location.state?.ingredients || [];

  useEffect(() => {
    const fetchMissingIngredients = async () => {
      if (!recipe || userIngredients.length === 0) {
        setLoading(false);
        return;
      }

      try {
        const result = await generateGroceryList(recipe, userIngredients);
        setMissingIngredients(result);
      } catch (err) {
        console.error("Error generating grocery list:", err);
      } finally {
        setLoading(false);
      }
    };

    fetchMissingIngredients();
  }, [recipe, userIngredients]);

  return (
    <main className="min-h-screen bg-white p-6 flex flex-col items-center">
      <div className="w-full max-w-xl">
        <h1 className="text-4xl font-bold mb-6 text-center text-gray-800">🛒 Grocery List</h1>

        {loading ? (
          <p className="text-gray-600 text-lg text-center">Generating grocery list...</p>
        ) : missingIngredients.length === 0 ? (
          <p className="text-gray-700 text-center text-lg">
            🎉 You have all the ingredients! No need to shop.
          </p>
        ) : (
          <ul className="list-disc list-inside text-gray-800 text-lg space-y-2">
            {missingIngredients.map((ingredient, i) => (
              <li key={i}>{ingredient}</li>
            ))}
          </ul>
        )}

        <div className="mt-8 flex justify-center">
          <button
            onClick={() => navigate("/")}
            className="px-6 py-2 rounded bg-green-500 hover:bg-green-600 text-white font-semibold"
          >
            ← Back to Recipe
          </button>
        </div>
      </div>
    </main>
  );
}
