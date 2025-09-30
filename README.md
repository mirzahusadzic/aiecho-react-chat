# AI Echo React Chat

A dynamic and interactive chat viewer built with React, Vite, and rich content rendering capabilities.

## Table of Contents

- [Features](#features)
- [Technologies Used](#technologies-used)
- [Installation](#installation)
- [Usage](#usage)
- [Deployment](#deployment)
- [Contributing](#contributing)
- [License](#license)

## Features

- **Dynamic Chat Display:** Renders conversation turns with distinct user, AI thinking, and AI response messages.
- **Rich Content Support:** Integrates Markdown, LaTeX (via KaTeX), and code highlighting for enhanced readability.
- **Content Sanitization:** Utilizes DOMPurify to safely render user-generated and AI-generated content.
- **Responsive Design:** Adapts to different screen sizes, with a collapsible sidebar for mobile and desktop.
- **Optimized Rendering:** Employs `react-window` and `@react-hook/resize-observer` for efficient rendering of long chat histories.
- **Sidebar Navigation:** Provides a Table of Contents (TOC) for easy navigation through chat logs.
- **File Picker:** Allows users to load their own JSON chat log files directly from their local disk.
- **URL Hash Scrolling:** Supports direct linking and scrolling to specific messages using URL hashes (e.g., `#msg123`).
- **JSON Data Loading:** Loads chat conversations from structured JSON files, allowing for easy integration of various chat logs.

## Technologies Used

- **Frontend:** React (with Vite)
- **Styling:** CSS Modules (or similar, based on `_app.css` import)
- **Markdown Parsing:** `marked`, `react-markdown`, `remark-gfm`
- **LaTeX Rendering:** `katex`, `rehype-katex`, `remark-math`
- **Code Highlighting:** `react-syntax-highlighter`
- **Security:** `dompurify`
- **Performance:** `react-window`, `@react-hook/resize-observer`
- **Build Tool:** Vite
- **Linting & Formatting:** ESLint, Prettier

## Installation

To get a local copy up and running, follow these simple steps.

### Prerequisites

- Node.js (LTS version recommended)
- npm or yarn

### Steps

1. **Clone the repository:**

   ```bash
   git clone https://github.com/your-username/aiecho-react-chat.git
   cd aiecho-react-chat
   ```

2. **Install dependencies:**

   ```bash
   npm install
   # or
   yarn install
   ```

3. **Start the development server:**

   ```bash
   npm run dev
   # or
   yarn dev
   ```

   This will open the application in your browser, usually at `http://localhost:5173`.

## Live Demo

Access the live application here: [https://mirzahusadzic.github.io/aiecho-react-chat/](https://mirzahusadzic.github.io/aiecho-react-chat/)

## Usage

The application will load a default chat log (`Painters_And_Programmers.json`) on startup.

**Loading Your Own Chat Logs:**

1. Click the "Choose JSON File" button in the sidebar.
2. Select a JSON file from your local disk. **Currently, the application only supports Gemini chat JSON files.** The file should contain a chat conversation structured with a `chunkedPrompt.chunks` property, where `chunks` is an array of chat message objects.

You can explore the chat history, and if available, use the sidebar for navigation.

Example JSON files in the `public` directory:

- `Painters_And_Programmers.json`

## Deployment

This project is set up for static site deployment, perfect for platforms like GitHub Pages, Netlify, or Vercel.

### Building for Production

To create a production-ready build, run:

```bash
npm run build
# or
yarn build
```

This command will compile and optimize your application into the `dist/` directory.

### Deploying to GitHub Pages

1. **Ensure your `package.json` has a `homepage` field** (if deploying to a project page, e.g., `https://your-username.github.io/your-repo-name/`). For a user page (e.g., `https://your-username.github.io/`), this might not be necessary or should be set to `"./"`.
   - **Note:** Vite typically handles base paths well, but for GitHub Pages, you might need to configure `base` in `vite.config.js` if your project is not at the root of your domain (e.g., `base: '/your-repo-name/'`).

2. **Install `gh-pages` (if not already installed):**

   ```bash
   npm install --save-dev gh-pages
   # or
   yarn add --dev gh-pages
   ```

3. **Add deploy script to `package.json`:**

   ```json
   "scripts": {
     "predeploy": "npm run build",
     "deploy": "gh-pages -d dist"
   }
   ```

4. **Deploy:**

   ```bash
   npm run deploy
   # or
   yarn deploy
   ```

   Your application will be deployed to `https://your-username.github.io/your-repo-name/`.

## Contributing

Contributions are what make the open-source community such an amazing place to learn, inspire, and create. Any contributions you make are **greatly appreciated**.

1. Fork the Project
2. Create your Feature Branch (`git checkout -b feature/AmazingFeature`)
3. Commit your Changes (`git commit -m 'Add some AmazingFeature'`)
4. Push to the Branch (`git push origin feature/AmazingFeature`)
5. Open a Pull Request

## License

Distributed under the MIT License. See `LICENSE` for more information.
