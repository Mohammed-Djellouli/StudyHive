import { useEffect } from 'react';

/**
 * Composant pour la gestion des erreurs globales de l'application
 */
const ErrorBoundary = ({ children }) => {
  useEffect(() => {
    window.onerror = function (message, source, lineno, colno, error) {
      console.error("Global JS Error:", { message, source, lineno, colno, error });
    };
  }, []);

  return children;
};

export default ErrorBoundary; 