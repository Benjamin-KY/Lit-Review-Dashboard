// Simple test runner that can be executed in browser console
import { runAllTests } from './tests/dataProcessing.test';

// Make test runner available globally
declare global {
  interface Window {
    runLiteratureReviewTests: () => void;
  }
}

// Export test runner for browser console
window.runLiteratureReviewTests = runAllTests;

// Also export for module imports
export { runAllTests };