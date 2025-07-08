# LegalDocAnalyzer

A modern, multilingual legal document analyzer built with React, Vite, and Tailwind CSS.

## Features

- 🌐 **Multilingual Support:** Switch between English, French, and German.
- 🚩 **Flag Emoji Language Selector:** Easily select your language with flag icons.
- 💾 **Persistent Language Preference:** Remembers your language choice across sessions.
- ⚡ **Fast & Modern:** Built with Vite and React Context API.
- 🎨 **Customizable UI:** Styled with Tailwind CSS and Google Fonts.

## 📋 Prerequisites

- Node.js (v14.x or higher)
- npm or yarn

## 🛠️ Installation

1. Install dependencies:
   ```bash
   npm install
   # or
   yarn install
   ```
   
2. Start the development server:
   ```bash
   npm start
   # or
   yarn start
   ```

## 📁 Project Structure

```
legalanalyzer/
├── public/             # Static assets
├── src/
│   ├── components/     # Reusable UI components
│   ├── contexts/       # Language context
│   ├── i18n/           # Translations (EN, FR, DE)
│   ├── pages/          # Page components
│   ├── styles/         # Global styles and Tailwind configuration
│   ├── App.jsx         # Main application component
│   ├── Routes.jsx      # Application routes
│   └── index.jsx       # Application entry point
├── .env                # Environment variables
├── index.html          # HTML template
├── package.json        # Project dependencies and scripts
├── tailwind.config.js  # Tailwind CSS configuration
└── vite.config.js      # Vite configuration
```

## 🧩 Adding Routes

To add new routes to the application, update the `Routes.jsx` file:

```jsx
import { useRoutes } from "react-router-dom";
import HomePage from "pages/HomePage";
import AboutPage from "pages/AboutPage";

const ProjectRoutes = () => {
  let element = useRoutes([
    { path: "/", element: <HomePage /> },
    { path: "/about", element: <AboutPage /> },
    // Add more routes as needed
  ]);

  return element;
};
```
## 🌐 Internationalization

- All translations are managed in `src/i18n/translations/`.
- Add new languages by updating `src/i18n/index.js` and providing a translation file.

## 🎨 Styling

This project uses Tailwind CSS for styling. The configuration includes:

- Forms plugin for form styling
- Typography plugin for text styling
- Aspect ratio plugin for responsive elements
- Container queries for component-specific responsive design
- Fluid typography for responsive text
- Animation utilities

## 📱 Responsive Design

The app is built with responsive design using Tailwind CSS breakpoints.


## 📦 Deployment

Build the application for production:

```bash
npm run build
```

## 🔓 License

MIT

---

*For questions or contributions, please open an issue or pull request.*
