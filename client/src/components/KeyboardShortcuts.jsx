import { useEffect } from 'react';
import { useNavigate } from 'react-router-dom';

const isTyping = (el) =>
  el && (el.tagName === 'INPUT' || el.tagName === 'TEXTAREA' || el.isContentEditable);

// Global, unobtrusive shortcuts: "/" jumps to search, "g h" goes home,
// "g d" goes to the dashboard. Ignored entirely while typing in a field.
const KeyboardShortcuts = () => {
  const navigate = useNavigate();

  useEffect(() => {
    let pendingG = false;
    let pendingTimeout;

    const handleKeyDown = (e) => {
      if (isTyping(document.activeElement) || e.metaKey || e.ctrlKey || e.altKey) return;

      if (pendingG) {
        pendingG = false;
        clearTimeout(pendingTimeout);
        if (e.key === 'h') {
          e.preventDefault();
          navigate('/');
        } else if (e.key === 'd') {
          e.preventDefault();
          navigate('/dashboard');
        }
        return;
      }

      if (e.key === '/') {
        const input = document.getElementById('global-search-input');
        if (input) {
          e.preventDefault();
          input.focus();
        }
        return;
      }

      if (e.key === 'g') {
        pendingG = true;
        pendingTimeout = setTimeout(() => {
          pendingG = false;
        }, 600);
      }
    };

    window.addEventListener('keydown', handleKeyDown);
    return () => {
      window.removeEventListener('keydown', handleKeyDown);
      clearTimeout(pendingTimeout);
    };
  }, [navigate]);

  return null;
};

export default KeyboardShortcuts;
