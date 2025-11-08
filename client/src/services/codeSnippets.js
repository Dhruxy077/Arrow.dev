// client/src/services/codeSnippets.js
/**
 * Code Snippets Library
 * Pre-defined code snippets for quick insertion
 */

export const codeSnippets = [
  {
    id: "react-component",
    name: "React Component",
    description: "Basic React functional component",
    language: "jsx",
    category: "React",
    code: `import React from 'react';

function ComponentName() {
  return (
    <div>
      <h1>Hello World</h1>
    </div>
  );
}

export default ComponentName;`,
  },
  {
    id: "react-hook",
    name: "React Hook",
    description: "Custom React hook template",
    language: "javascript",
    category: "React",
    code: `import { useState, useEffect } from 'react';

function useCustomHook() {
  const [state, setState] = useState(null);

  useEffect(() => {
    // Effect logic here
  }, []);

  return { state, setState };
}

export default useCustomHook;`,
  },
  {
    id: "express-route",
    name: "Express Route",
    description: "Basic Express.js route handler",
    language: "javascript",
    category: "Backend",
    code: `const express = require('express');
const router = express.Router();

router.get('/endpoint', async (req, res) => {
  try {
    // Route logic here
    res.json({ success: true });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

module.exports = router;`,
  },
  {
    id: "api-fetch",
    name: "API Fetch",
    description: "Async fetch function",
    language: "javascript",
    category: "Utilities",
    code: `async function fetchData(url) {
  try {
    const response = await fetch(url);
    if (!response.ok) {
      throw new Error('Network response was not ok');
    }
    const data = await response.json();
    return data;
  } catch (error) {
    console.error('Error fetching data:', error);
    throw error;
  }
}`,
  },
  {
    id: "local-storage",
    name: "Local Storage Hook",
    description: "React hook for localStorage",
    language: "javascript",
    category: "React",
    code: `import { useState, useEffect } from 'react';

function useLocalStorage(key, initialValue) {
  const [storedValue, setStoredValue] = useState(() => {
    try {
      const item = window.localStorage.getItem(key);
      return item ? JSON.parse(item) : initialValue;
    } catch (error) {
      return initialValue;
    }
  });

  const setValue = (value) => {
    try {
      setStoredValue(value);
      window.localStorage.setItem(key, JSON.stringify(value));
    } catch (error) {
      console.error(error);
    }
  };

  return [storedValue, setValue];
}

export default useLocalStorage;`,
  },
  {
    id: "debounce",
    name: "Debounce Function",
    description: "Debounce utility function",
    language: "javascript",
    category: "Utilities",
    code: `function debounce(func, wait) {
  let timeout;
  return function executedFunction(...args) {
    const later = () => {
      clearTimeout(timeout);
      func(...args);
    };
    clearTimeout(timeout);
    timeout = setTimeout(later, wait);
  };
}`,
  },
  {
    id: "form-validation",
    name: "Form Validation",
    description: "React form with validation",
    language: "jsx",
    category: "React",
    code: `import { useState } from 'react';

function Form() {
  const [formData, setFormData] = useState({ email: '', password: '' });
  const [errors, setErrors] = useState({});

  const validate = () => {
    const newErrors = {};
    if (!formData.email) newErrors.email = 'Email is required';
    if (!formData.password) newErrors.password = 'Password is required';
    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const handleSubmit = (e) => {
    e.preventDefault();
    if (validate()) {
      // Submit form
    }
  };

  return (
    <form onSubmit={handleSubmit}>
      <input
        type="email"
        value={formData.email}
        onChange={(e) => setFormData({ ...formData, email: e.target.value })}
      />
      {errors.email && <span>{errors.email}</span>}
      <button type="submit">Submit</button>
    </form>
  );
}`,
  },
  {
    id: "context-provider",
    name: "Context Provider",
    description: "React Context provider",
    language: "jsx",
    category: "React",
    code: `import { createContext, useContext, useState } from 'react';

const AppContext = createContext();

export function AppProvider({ children }) {
  const [state, setState] = useState(null);

  return (
    <AppContext.Provider value={{ state, setState }}>
      {children}
    </AppContext.Provider>
  );
}

export function useApp() {
  const context = useContext(AppContext);
  if (!context) {
    throw new Error('useApp must be used within AppProvider');
  }
  return context;
}`,
  },
];

export const getSnippetById = (id) => {
  return codeSnippets.find((s) => s.id === id);
};

export const getSnippetsByCategory = (category) => {
  return codeSnippets.filter((s) => s.category === category);
};

export const snippetCategories = [...new Set(codeSnippets.map((s) => s.category))];

