// client/src/services/templates.js
/**
 * Project Templates
 * Pre-defined project templates for quick start
 */

export const templates = [
  {
    id: "react-vite-ts",
    name: "React + Vite + TypeScript",
    description: "Modern React app with Vite and TypeScript",
    category: "Frontend",
    icon: "⚛️",
    prompt: "Create a React + Vite + TypeScript project with Tailwind CSS",
  },
  {
    id: "nextjs",
    name: "Next.js App",
    description: "Full-stack React framework with SSR",
    category: "Full-stack",
    icon: "▲",
    prompt: "Create a Next.js project with TypeScript and Tailwind CSS",
  },
  {
    id: "vue-vite",
    name: "Vue + Vite",
    description: "Vue 3 with Vite and TypeScript",
    category: "Frontend",
    icon: "🟢",
    prompt: "Create a Vue 3 + Vite + TypeScript project with Tailwind CSS",
  },
  {
    id: "express-api",
    name: "Express API",
    description: "RESTful API with Express and Node.js",
    category: "Backend",
    icon: "🚀",
    prompt: "Create an Express.js REST API with TypeScript",
  },
  {
    id: "todo-app",
    name: "Todo App",
    description: "Full-featured todo application",
    category: "Example",
    icon: "✅",
    prompt: "Create a beautiful todo app with React, TypeScript, and Tailwind CSS. Include features like add, edit, delete, mark complete, and filter todos",
  },
  {
    id: "portfolio",
    name: "Portfolio Website",
    description: "Personal portfolio website",
    category: "Example",
    icon: "💼",
    prompt: "Create a modern portfolio website with React, TypeScript, and Tailwind CSS. Include sections for about, projects, skills, and contact",
  },
  {
    id: "dashboard",
    name: "Dashboard",
    description: "Analytics dashboard with charts",
    category: "Example",
    icon: "📊",
    prompt: "Create a dashboard application with React, TypeScript, and Tailwind CSS. Include charts, statistics cards, and a sidebar navigation",
  },
  {
    id: "landing-page",
    name: "Landing Page",
    description: "Modern landing page template",
    category: "Example",
    icon: "🎯",
    prompt: "Create a beautiful landing page with React, TypeScript, and Tailwind CSS. Include hero section, features, testimonials, and CTA",
  },
  {
    id: "blog",
    name: "Blog Website",
    description: "Modern blog with markdown support",
    category: "Example",
    icon: "📝",
    prompt: "Create a modern blog website with React, TypeScript, and Tailwind CSS. Include blog post list, individual post pages, markdown rendering, and a clean design",
  },
  {
    id: "ecommerce",
    name: "E-commerce Store",
    description: "Online store with shopping cart",
    category: "Example",
    icon: "🛒",
    prompt: "Create an e-commerce store with React, TypeScript, and Tailwind CSS. Include product listing, product details, shopping cart, and checkout flow",
  },
  {
    id: "weather-app",
    name: "Weather App",
    description: "Weather forecast application",
    category: "Example",
    icon: "🌤️",
    prompt: "Create a weather app with React, TypeScript, and Tailwind CSS. Include weather forecast, location search, and beautiful weather icons",
  },
  {
    id: "chat-app",
    name: "Chat Application",
    description: "Real-time chat interface",
    category: "Example",
    icon: "💬",
    prompt: "Create a chat application with React, TypeScript, and Tailwind CSS. Include message list, input field, user avatars, and real-time message updates",
  },
  {
    id: "svelte-kit",
    name: "SvelteKit App",
    description: "SvelteKit with TypeScript",
    category: "Full-stack",
    icon: "🔥",
    prompt: "Create a SvelteKit project with TypeScript and Tailwind CSS",
  },
  {
    id: "angular",
    name: "Angular App",
    description: "Angular with TypeScript",
    category: "Frontend",
    icon: "🅰️",
    prompt: "Create an Angular project with TypeScript and Tailwind CSS",
  },
  {
    id: "remix",
    name: "Remix App",
    description: "Remix full-stack framework",
    category: "Full-stack",
    icon: "⚡",
    prompt: "Create a Remix project with TypeScript and Tailwind CSS",
  },
];

export const getTemplateById = (id) => {
  return templates.find((t) => t.id === id);
};

export const getTemplatesByCategory = (category) => {
  return templates.filter((t) => t.category === category);
};

export const categories = [...new Set(templates.map((t) => t.category))];

