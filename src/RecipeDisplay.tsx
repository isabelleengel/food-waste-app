// src/components/RecipeDisplay.tsx
import ReactMarkdown from "react-markdown";
import remarkGfm from "remark-gfm";

type Props = {
  recipe: string;
};

export default function RecipeDisplay({ recipe }: Props) {
  return (
    <div className="bg-white p-4 rounded-lg shadow-md text-gray-800 font-serif whitespace-pre-wrap max-h-[500px] overflow-y-auto animate-fade-in">
      <ReactMarkdown
        children={recipe}
        remarkPlugins={[remarkGfm]}
        className="prose prose-sm max-w-none"
      />
    </div>
  );
}
