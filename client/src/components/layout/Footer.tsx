export default function Footer() {
  return (
    <footer className="bg-white border-t border-neutral-300 py-4 px-6 text-center text-sm text-accent-500">
      <div className="flex flex-col items-center space-y-2">
        <p>© 2025 XFT Labs. All rights reserved.</p>
        <div className="flex space-x-4">
          <a 
            href="/monitoring" 
            target="_blank" 
            rel="noopener noreferrer"
            className="text-primary-500 hover:text-primary-700 transition-colors"
          >
            CI/CD Monitoring
          </a>
          <a 
            href="/docs" 
            target="_blank" 
            rel="noopener noreferrer"
            className="text-primary-500 hover:text-primary-700 transition-colors"
          >
            API Documentation
          </a>
        </div>
      </div>
    </footer>
  );
}
