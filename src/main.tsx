import React, { useState, useRef } from 'react';
import ReactDOM from 'react-dom/client';
import { Camera, Plus, Trash2, ShoppingCart, ChefHat, Edit3, Check, X } from 'lucide-react';

const FoodWasteApp = () => {
  const [inventory, setInventory] = useState([]);
  const [recipes, setRecipes] = useState([]);
  const [groceryList, setGroceryList] = useState([]);
  const [activeTab, setActiveTab] = useState('inventory');
  const [newItem, setNewItem] = useState({ name: '', quantity: '', unit: 'pieces', expiryDate: '' });
  const [editingItem, setEditingItem] = useState(null);
  const [recipePrompt, setRecipePrompt] = useState('');
  const [isGenerating, setIsGenerating] = useState(false);
  const [apiKey, setApiKey] = useState('');
  const [showApiKeyInput, setShowApiKeyInput] = useState(false);
  const fileInputRef = useRef(null);

  // Real LLM integration for recipe generation
  const generateRecipes = async (prompt, availableItems) => {
    if (!apiKey) {
      alert('Please enter your OpenAI API key first!');
      setShowApiKeyInput(true);
      return [];
    }

    setIsGenerating(true);
    
    try {
      const inventoryList = availableItems.map(item => 
        `${item.name} (${item.quantity} ${item.unit})`
      ).join(', ');
      
      const systemPrompt = `You are a helpful cooking assistant that creates recipes to minimize food waste. 
      
      Given a user's food inventory, generate 2-3 creative recipes that prioritize using ingredients they already have.
      
      IMPORTANT: Respond with a valid JSON array of recipe objects. Each recipe should have this exact structure:
      {
        "id": number,
        "name": "Recipe Name",
        "ingredients": [
          {
            "name": "ingredient name",
            "quantity": number,
            "unit": "unit",
            "inInventory": boolean
          }
        ],
        "instructions": "Step by step cooking instructions",
        "prepTime": "time estimate",
        "servings": number
      }
      
      Make sure to:
      - Use as many inventory items as possible
      - Mark ingredients as inInventory: true if they're in the user's inventory
      - Keep additional ingredients minimal and common
      - Provide clear, concise instructions
      - Use realistic quantities and common units`;

      const userPrompt = `My available ingredients: ${inventoryList}
      
      Additional preferences: ${prompt || 'None'}
      
      Please suggest recipes that use these ingredients and minimize food waste.`;

      const response = await fetch('https://api.openai.com/v1/chat/completions', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${apiKey}`
        },
        body: JSON.stringify({
          model: 'gpt-3.5-turbo',
          messages: [
            { role: 'system', content: systemPrompt },
            { role: 'user', content: userPrompt }
          ],
          temperature: 0.7,
          max_tokens: 2000
        })
      });

      if (!response.ok) {
        const error = await response.json();
        throw new Error(error.error?.message || 'Failed to generate recipes');
      }

      const data = await response.json();
      const recipesText = data.choices[0].message.content;
      
      // Parse the JSON response
      const generatedRecipes = JSON.parse(recipesText);
      
      // Validate and enhance the recipes
      const validatedRecipes = generatedRecipes.map(recipe => ({
        ...recipe,
        ingredients: recipe.ingredients.map(ingredient => ({
          ...ingredient,
          inInventory: availableItems.some(item => 
            item.name.toLowerCase().includes(ingredient.name.toLowerCase()) ||
            ingredient.name.toLowerCase().includes(item.name.toLowerCase())
          )
        }))
      }));
      
      setIsGenerating(false);
      return validatedRecipes;
      
    } catch (error) {
      console.error('Error generating recipes:', error);
      setIsGenerating(false);
      alert(`Error generating recipes: ${error.message}`);
      return [];
    }
  };

  const handleAddItem = () => {
    if (newItem.name.trim()) {
      const item = {
        id: Date.now(),
        ...newItem,
        quantity: parseFloat(newItem.quantity) || 1,
        dateAdded: new Date().toISOString().split('T')[0]
      };
      setInventory([...inventory, item]);
      setNewItem({ name: '', quantity: '', unit: 'pieces', expiryDate: '' });
    }
  };

  const handleEditItem = (item) => {
    setEditingItem({ ...item });
  };

  const handleSaveEdit = () => {
    setInventory(inventory.map(item => 
      item.id === editingItem.id ? editingItem : item
    ));
    setEditingItem(null);
  };

  const handleDeleteItem = (id) => {
    setInventory(inventory.filter(item => item.id !== id));
  };

  const handleReceiptUpload = (event) => {
    const file = event.target.files[0];
    if (file) {
      // Mock receipt processing with imperial units
      const mockItems = [
        { name: 'bananas', quantity: 2, unit: 'lbs' },
        { name: 'milk', quantity: 0.5, unit: 'gallons' },
        { name: 'bread', quantity: 1, unit: 'loaf' },
        { name: 'eggs', quantity: 1, unit: 'dozen' },
        { name: 'ground beef', quantity: 1.5, unit: 'lbs' },
        { name: 'orange juice', quantity: 64, unit: 'fl oz' }
      ];
      
      const newItems = mockItems.map(item => ({
        id: Date.now() + Math.random(),
        ...item,
        dateAdded: new Date().toISOString().split('T')[0],
        expiryDate: ''
      }));
      
      setInventory([...inventory, ...newItems]);
      alert('Receipt processed! Added items to your inventory.');
    }
  };

  const handleGenerateRecipes = async () => {
    if (inventory.length === 0) {
      alert('Please add some items to your inventory first!');
      return;
    }
    
    const generatedRecipes = await generateRecipes(recipePrompt, inventory);
    setRecipes(generatedRecipes);
    setActiveTab('recipes');
  };

  const handleSelectRecipe = (recipe) => {
    // Generate grocery list for missing ingredients
    const missingIngredients = recipe.ingredients
      .filter(ingredient => !ingredient.inInventory)
      .map(ingredient => ({
        id: Date.now() + Math.random(),
        name: ingredient.name,
        quantity: ingredient.quantity,
        unit: ingredient.unit,
        recipeId: recipe.id,
        recipeName: recipe.name
      }));
    
    setGroceryList([...groceryList, ...missingIngredients]);
    
    // Update inventory (reduce quantities of used items)
    const usedItems = recipe.ingredients.filter(ing => ing.inInventory);
    const updatedInventory = inventory.map(item => {
      const usedItem = usedItems.find(used => used.name.toLowerCase() === item.name.toLowerCase());
      if (usedItem) {
        return {
          ...item,
          quantity: Math.max(0, item.quantity - usedItem.quantity)
        };
      }
      return item;
    }).filter(item => item.quantity > 0);
    
    setInventory(updatedInventory);
    setActiveTab('grocery');
    alert(`Recipe selected! Check your grocery list for missing ingredients.`);
  };

  const handleRemoveFromGroceryList = (id) => {
    setGroceryList(groceryList.filter(item => item.id !== id));
  };

  const getDaysUntilExpiry = (expiryDate) => {
    if (!expiryDate) return null;
    const today = new Date();
    const expiry = new Date(expiryDate);
    const diffTime = expiry - today;
    const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24));
    return diffDays;
  };

  const getExpiryStatus = (expiryDate) => {
    const days = getDaysUntilExpiry(expiryDate);
    if (days === null) return '';
    if (days < 0) return 'text-red-600 font-semibold';
    if (days <= 3) return 'text-orange-600 font-semibold';
    if (days <= 7) return 'text-yellow-600';
    return 'text-green-600';
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-green-50 to-blue-50 p-4">
      <div className="max-w-6xl mx-auto">
        {/* Header */}
        <div className="bg-white rounded-lg shadow-lg p-6 mb-6">
          <div className="flex justify-between items-start">
            <div>
              <h1 className="text-3xl font-bold text-green-800 mb-2">🥗 Zero Waste Kitchen</h1>
              <p className="text-gray-600">Reduce food waste, save money, and discover new recipes!</p>
            </div>
            <div className="flex items-center gap-2">
              <button
                onClick={() => setShowApiKeyInput(!showApiKeyInput)}
                className={`px-4 py-2 rounded-lg text-sm font-medium transition-colors ${
                  apiKey ? 'bg-green-100 text-green-800' : 'bg-yellow-100 text-yellow-800'
                }`}
              >
                {apiKey ? '🔑 API Connected' : '🔑 Setup API Key'}
              </button>
            </div>
          </div>
          
          {showApiKeyInput && (
            <div className="mt-4 p-4 bg-blue-50 rounded-lg">
              <h3 className="font-semibold text-blue-800 mb-2">OpenAI API Configuration</h3>
              <div className="flex gap-3 items-center">
                <input
                  type="password"
                  placeholder="Enter your OpenAI API key"
                  value={apiKey}
                  onChange={(e) => setApiKey(e.target.value)}
                  className="flex-1 px-3 py-2 border rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                />
                <button
                  onClick={() => setShowApiKeyInput(false)}
                  className="bg-blue-600 text-white px-4 py-2 rounded-lg hover:bg-blue-700 transition-colors"
                >
                  Save
                </button>
              </div>
              <p className="text-sm text-blue-600 mt-2">
                Get your API key from <a href="https://platform.openai.com/api-keys" target="_blank" rel="noopener noreferrer" className="underline">OpenAI Platform</a>
              </p>
            </div>
          )}
        </div>

        {/* Navigation */}
        <div className="bg-white rounded-lg shadow-lg mb-6">
          <div className="flex border-b">
            {[
              { id: 'inventory', label: 'My Inventory', icon: <ShoppingCart className="w-5 h-5" /> },
              { id: 'recipes', label: 'Recipe Ideas', icon: <ChefHat className="w-5 h-5" /> },
              { id: 'grocery', label: 'Grocery List', icon: <Plus className="w-5 h-5" /> }
            ].map(tab => (
              <button
                key={tab.id}
                onClick={() => setActiveTab(tab.id)}
                className={`flex items-center gap-2 px-6 py-4 font-medium transition-colors ${
                  activeTab === tab.id
                    ? 'bg-green-50 text-green-700 border-b-2 border-green-500'
                    : 'text-gray-500 hover:text-gray-700'
                }`}
              >
                {tab.icon}
                {tab.label}
              </button>
            ))}
          </div>
        </div>

        {/* Content */}
        <div className="bg-white rounded-lg shadow-lg p-6">
          {activeTab === 'inventory' && (
            <div>
              <h2 className="text-2xl font-bold text-gray-800 mb-6">Food Inventory</h2>
              
              {/* Receipt Upload */}
              <div className="mb-6 p-4 bg-blue-50 rounded-lg">
                <h3 className="font-semibold text-blue-800 mb-2">Quick Add from Receipt</h3>
                <input
                  type="file"
                  ref={fileInputRef}
                  onChange={handleReceiptUpload}
                  accept="image/*"
                  className="hidden"
                />
                <button
                  onClick={() => fileInputRef.current?.click()}
                  className="flex items-center gap-2 bg-blue-600 text-white px-4 py-2 rounded-lg hover:bg-blue-700 transition-colors"
                >
                  <Camera className="w-5 h-5" />
                  Upload Receipt Photo
                </button>
                <p className="text-sm text-blue-600 mt-2">Take a photo of your receipt to automatically add items</p>
              </div>

              {/* Manual Add */}
              <div className="mb-6 p-4 bg-green-50 rounded-lg">
                <h3 className="font-semibold text-green-800 mb-4">Add Item Manually</h3>
                <div className="grid grid-cols-1 md:grid-cols-5 gap-4">
                  <input
                    type="text"
                    placeholder="Item name"
                    value={newItem.name}
                    onChange={(e) => setNewItem({...newItem, name: e.target.value})}
                    className="px-3 py-2 border rounded-lg focus:ring-2 focus:ring-green-500 focus:border-green-500"
                  />
                  <input
                    type="number"
                    placeholder="Quantity"
                    value={newItem.quantity}
                    onChange={(e) => setNewItem({...newItem, quantity: e.target.value})}
                    className="px-3 py-2 border rounded-lg focus:ring-2 focus:ring-green-500 focus:border-green-500"
                  />
                  <select
                    value={newItem.unit}
                    onChange={(e) => setNewItem({...newItem, unit: e.target.value})}
                    className="px-3 py-2 border rounded-lg focus:ring-2 focus:ring-green-500 focus:border-green-500"
                  >
                    <option value="pieces">pieces</option>
                    <optgroup label="Metric">
                      <option value="kg">kg</option>
                      <option value="g">g</option>
                      <option value="liter">liter</option>
                      <option value="ml">ml</option>
                    </optgroup>
                    <optgroup label="Imperial">
                      <option value="lbs">lbs</option>
                      <option value="oz">oz</option>
                      <option value="gallons">gallons</option>
                      <option value="quarts">quarts</option>
                      <option value="pints">pints</option>
                      <option value="fl oz">fl oz</option>
                    </optgroup>
                    <optgroup label="Common">
                      <option value="cups">cups</option>
                      <option value="tbsp">tbsp</option>
                      <option value="tsp">tsp</option>
                      <option value="dozen">dozen</option>
                      <option value="bunch">bunch</option>
                      <option value="bag">bag</option>
                      <option value="box">box</option>
                      <option value="can">can</option>
                      <option value="jar">jar</option>
                      <option value="bottle">bottle</option>
                      <option value="pack">pack</option>
                      <option value="loaf">loaf</option>
                    </optgroup>
                  </select>
                  <input
                    type="date"
                    value={newItem.expiryDate}
                    onChange={(e) => setNewItem({...newItem, expiryDate: e.target.value})}
                    className="px-3 py-2 border rounded-lg focus:ring-2 focus:ring-green-500 focus:border-green-500"
                  />
                  <button
                    onClick={handleAddItem}
                    className="bg-green-600 text-white px-4 py-2 rounded-lg hover:bg-green-700 transition-colors"
                  >
                    Add Item
                  </button>
                </div>
              </div>

              {/* Inventory List */}
              <div className="space-y-3">
                {inventory.length === 0 ? (
                  <p className="text-gray-500 text-center py-8">No items in inventory. Add some items to get started!</p>
                ) : (
                  inventory.map(item => (
                    <div key={item.id} className="flex items-center justify-between p-4 bg-gray-50 rounded-lg">
                      {editingItem && editingItem.id === item.id ? (
                        <div className="flex items-center gap-3 flex-1">
                          <input
                            type="text"
                            value={editingItem.name}
                            onChange={(e) => setEditingItem({...editingItem, name: e.target.value})}
                            className="px-2 py-1 border rounded flex-1"
                          />
                          <input
                            type="number"
                            value={editingItem.quantity}
                            onChange={(e) => setEditingItem({...editingItem, quantity: parseFloat(e.target.value)})}
                            className="px-2 py-1 border rounded w-20"
                          />
                          <select
                            value={editingItem.unit}
                            onChange={(e) => setEditingItem({...editingItem, unit: e.target.value})}
                            className="px-2 py-1 border rounded"
                          >
                            <option value="pieces">pieces</option>
                            <optgroup label="Metric">
                              <option value="kg">kg</option>
                              <option value="g">g</option>
                              <option value="liter">liter</option>
                              <option value="ml">ml</option>
                            </optgroup>
                            <optgroup label="Imperial">
                              <option value="lbs">lbs</option>
                              <option value="oz">oz</option>
                              <option value="gallons">gallons</option>
                              <option value="quarts">quarts</option>
                              <option value="pints">pints</option>
                              <option value="fl oz">fl oz</option>
                            </optgroup>
                            <optgroup label="Common">
                              <option value="cups">cups</option>
                              <option value="tbsp">tbsp</option>
                              <option value="tsp">tsp</option>
                              <option value="dozen">dozen</option>
                              <option value="bunch">bunch</option>
                              <option value="bag">bag</option>
                              <option value="box">box</option>
                              <option value="can">can</option>
                              <option value="jar">jar</option>
                              <option value="bottle">bottle</option>
                              <option value="pack">pack</option>
                              <option value="loaf">loaf</option>
                            </optgroup>
                          </select>
                          <input
                            type="date"
                            value={editingItem.expiryDate}
                            onChange={(e) => setEditingItem({...editingItem, expiryDate: e.target.value})}
                            className="px-2 py-1 border rounded"
                          />
                          <button onClick={handleSaveEdit} className="text-green-600 hover:text-green-800">
                            <Check className="w-5 h-5" />
                          </button>
                          <button onClick={() => setEditingItem(null)} className="text-red-600 hover:text-red-800">
                            <X className="w-5 h-5" />
                          </button>
                        </div>
                      ) : (
                        <>
                          <div className="flex-1">
                            <h4 className="font-semibold text-gray-800">{item.name}</h4>
                            <p className="text-sm text-gray-600">
                              {item.quantity} {item.unit}
                              {item.expiryDate && (
                                <span className={`ml-2 ${getExpiryStatus(item.expiryDate)}`}>
                                  {getDaysUntilExpiry(item.expiryDate) !== null && (
                                    getDaysUntilExpiry(item.expiryDate) < 0 
                                      ? 'Expired' 
                                      : `${getDaysUntilExpiry(item.expiryDate)} days left`
                                  )}
                                </span>
                              )}
                            </p>
                          </div>
                          <div className="flex items-center gap-2">
                            <button
                              onClick={() => handleEditItem(item)}
                              className="text-blue-600 hover:text-blue-800"
                            >
                              <Edit3 className="w-4 h-4" />
                            </button>
                            <button
                              onClick={() => handleDeleteItem(item.id)}
                              className="text-red-600 hover:text-red-800"
                            >
                              <Trash2 className="w-4 h-4" />
                            </button>
                          </div>
                        </>
                      )}
                    </div>
                  ))
                )}
              </div>

              {/* Recipe Generation */}
              {inventory.length > 0 && (
                <div className="mt-6 p-4 bg-yellow-50 rounded-lg">
                  <h3 className="font-semibold text-yellow-800 mb-2">Generate Recipe Ideas with AI</h3>
                  {!apiKey && (
                    <div className="mb-3 p-3 bg-yellow-100 rounded-lg">
                      <p className="text-yellow-800 text-sm">
                        ⚠️ Please set up your OpenAI API key in the header to generate recipes
                      </p>
                    </div>
                  )}
                  <div className="flex gap-3">
                    <input
                      type="text"
                      placeholder="Any preferences? (e.g., 'quick dinner', 'vegetarian', 'spicy')"
                      value={recipePrompt}
                      onChange={(e) => setRecipePrompt(e.target.value)}
                      className="flex-1 px-3 py-2 border rounded-lg focus:ring-2 focus:ring-yellow-500 focus:border-yellow-500"
                    />
                    <button
                      onClick={handleGenerateRecipes}
                      disabled={isGenerating || !apiKey}
                      className="bg-yellow-600 text-white px-6 py-2 rounded-lg hover:bg-yellow-700 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
                    >
                      {isGenerating ? 'Generating...' : 'Get AI Recipes'}
                    </button>
                  </div>
                  <p className="text-sm text-yellow-700 mt-2">
                    AI will create personalized recipes using your available ingredients
                  </p>
                </div>
              )}
            </div>
          )}

          {activeTab === 'recipes' && (
            <div>
              <h2 className="text-2xl font-bold text-gray-800 mb-6">Recipe Suggestions</h2>
              {recipes.length === 0 ? (
                <div className="text-center py-12">
                  <ChefHat className="w-16 h-16 text-gray-400 mx-auto mb-4" />
                  <p className="text-gray-500 mb-2">No recipes generated yet.</p>
                  <p className="text-gray-400 text-sm mb-4">Add ingredients to your inventory and use AI to generate personalized recipes!</p>
                  <button
                    onClick={() => setActiveTab('inventory')}
                    className="bg-green-600 text-white px-6 py-2 rounded-lg hover:bg-green-700 transition-colors"
                  >
                    Add Items to Get Started
                  </button>
                </div>
              ) : (
                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                  {recipes.map(recipe => (
                    <div key={recipe.id} className="border rounded-lg p-6 hover:shadow-lg transition-shadow">
                      <h3 className="text-xl font-bold text-gray-800 mb-2">{recipe.name}</h3>
                      <div className="flex items-center gap-4 text-sm text-gray-600 mb-4">
                        <span>⏱️ {recipe.prepTime}</span>
                        <span>🍽️ {recipe.servings} servings</span>
                      </div>
                      
                      <div className="mb-4">
                        <h4 className="font-semibold text-gray-700 mb-2">Ingredients:</h4>
                        <ul className="space-y-1">
                          {recipe.ingredients.map((ingredient, index) => (
                            <li key={index} className="flex items-center gap-2 text-sm">
                              <span className={`w-2 h-2 rounded-full ${ingredient.inInventory ? 'bg-green-500' : 'bg-red-500'}`}></span>
                              {ingredient.quantity} {ingredient.unit} {ingredient.name}
                              {ingredient.inInventory && <span className="text-green-600 text-xs">(in inventory)</span>}
                            </li>
                          ))}
                        </ul>
                      </div>
                      
                      <div className="mb-4">
                        <h4 className="font-semibold text-gray-700 mb-2">Instructions:</h4>
                        <p className="text-sm text-gray-600">{recipe.instructions}</p>
                      </div>
                      
                      <button
                        onClick={() => handleSelectRecipe(recipe)}
                        className="w-full bg-green-600 text-white py-2 rounded-lg hover:bg-green-700 transition-colors"
                      >
                        Make This Recipe
                      </button>
                    </div>
                  ))}
                </div>
              )}
            </div>
          )}

          {activeTab === 'grocery' && (
            <div>
              <h2 className="text-2xl font-bold text-gray-800 mb-6">Grocery List</h2>
              {groceryList.length === 0 ? (
                <div className="text-center py-12">
                  <ShoppingCart className="w-16 h-16 text-gray-400 mx-auto mb-4" />
                  <p className="text-gray-500">No items in your grocery list.</p>
                  <p className="text-gray-400 text-sm">Select a recipe to add missing ingredients here.</p>
                </div>
              ) : (
                <div className="space-y-3">
                  {groceryList.map(item => (
                    <div key={item.id} className="flex items-center justify-between p-4 bg-gray-50 rounded-lg">
                      <div>
                        <h4 className="font-semibold text-gray-800">{item.name}</h4>
                        <p className="text-sm text-gray-600">
                          {item.quantity} {item.unit}
                          {item.recipeName && <span className="text-blue-600 ml-2">for {item.recipeName}</span>}
                        </p>
                      </div>
                      <button
                        onClick={() => handleRemoveFromGroceryList(item.id)}
                        className="text-red-600 hover:text-red-800"
                      >
                        <Trash2 className="w-4 h-4" />
                      </button>
                    </div>
                  ))}
                </div>
              )}
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

export default FoodWasteApp;