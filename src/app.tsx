import React from "react";
import { Button } from "./components/ui/button";
import { AlertTriangle } from "lucide-react";

export default function App() {
  return (
    <main className="min-h-screen flex items-center justify-center bg-white text-black">
      <div className="text-center">
        <AlertTriangle className="mx-auto h-8 w-8 text-yellow-500" />
        <h1 className="text-2xl font-bold mt-4">Hello from Food Waste App!</h1>
        <Button className="mt-4">Click Me</Button>
      </div>
    </main>
  );
}
