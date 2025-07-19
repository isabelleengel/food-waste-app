// GroceryList.tsx
//GOING TO NEED TO ADD ANOTHER ACTUAL API HERE...
//also need to make it so that the home page saves the recipe if we are to navigate back there after this page
import React from "react";
import { useLocation, Link } from "react-router-dom";

export default function GroceryList() {
  const location = useLocation();
  const missingIngredients: string[] = location.state?.missingIngredients || [];

  return (
    <main className="min-h-screen bg-white p-6 flex flex-col items-center">
      <div className="w-full max-w-xl">
        <h1 className="text-4xl font-bold mb-6 text-center text-gray-800">
          🛒 Grocery List
        </h1>

        {missingIngredients.length === 0 ? (
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
          <Link
            to="/"
            className="px-6 py-2 rounded bg-green-500 hover:bg-green-600 text-white font-semibold"
          >
            ← Back to Recipe
          </Link>
        </div>
      </div>
    </main>
  );
}
