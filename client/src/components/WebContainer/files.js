/**
 * @fileoverview Defines the file system tree for the WebContainer instance.
 */

// Define the content for the server's entry point.
// The port has been changed to 3000, a common standard for local development.
const indexJsContent = `
import express from 'express';
const app = express();
const port = 3000;

app.get('/', (req, res) => {
  res.send('Hello from the WebContainer server!');
});

app.listen(port, () => {
  console.log(\`App is live at http://localhost:\${port}\`);
});`;

// Define package.json as a JavaScript object for better maintainability.
const packageJson = {
  name: "webcontainer-app",
  type: "module",
  dependencies: {
    express: "latest",
    nodemon: "latest",
  },
  scripts: {
    start: "nodemon index.js",
  },
};

// Export the final file system tree required by WebContainer.
export const files = {
  "index.js": {
    file: {
      contents: indexJsContent,
    },
  },
  "package.json": {
    file: {
      // Convert the package.json object to a formatted string.
      // The `null, 2` arguments add indentation for readability.
      contents: JSON.stringify(packageJson, null, 2),
    },
  },
};
