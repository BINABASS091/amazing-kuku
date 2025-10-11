import React, { useCallback, useEffect, useRef, useState } from 'react';
import ErrorBoundary from './ErrorBoundary';

interface StreamlitAppEmbedProps {
  src: string;
  className?: string;
  title?: string;
  maxRetries?: number;
  retryDelay?: number;
}

const StreamlitAppEmbed: React.FC<StreamlitAppEmbedProps> = ({
  src,
  className = '',
  title = 'Disease Prediction',
  maxRetries = 3,
  retryDelay = 2000,
}) => {
  const iframeRef = useRef<HTMLIFrameElement>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [retryCount, setRetryCount] = useState(0);
  const [currentSrc, setCurrentSrc] = useState('');

  // Generate a direct URL to avoid redirects and caching
  const generateUrl = useCallback((url: string) => {
    try {
      const urlObj = new URL(url);
      // Add a timestamp to prevent caching issues
      urlObj.searchParams.set('_', Date.now().toString());
      return urlObj.toString();
    } catch (e) {
      return url;
    }
  }, []);

  const loadIframe = useCallback(() => {
    setIsLoading(true);
    setError(null);
    setCurrentSrc(generateUrl(src));
  }, [generateUrl, src]);

  // Handle iframe load and error events
  const handleLoad = useCallback(() => {
    setIsLoading(false);
    setError(null);
  }, []);

  const handleError = useCallback(() => {
    if (retryCount < maxRetries) {
      // Retry with exponential backoff
      const delay = retryDelay * Math.pow(2, retryCount);
      setTimeout(() => {
        setRetryCount(prev => prev + 1);
        loadIframe();
      }, delay);
    } else {
      setIsLoading(false);
      setError('Failed to load the prediction tool. Please try again later.');
    }
  }, [retryCount, maxRetries, retryDelay, loadIframe]);

  // Initialize the iframe
  useEffect(() => {
    loadIframe();
    return () => {
      // Cleanup
      setIsLoading(true);
      setError(null);
      setRetryCount(0);
    };
  }, [loadIframe]);

  // Loading skeleton
  const LoadingSkeleton = () => (
    <div className="space-y-4 p-4">
      <div className="animate-pulse flex space-x-4">
        <div className="flex-1 space-y-6 py-1">
          <div className="h-4 bg-gray-200 dark:bg-gray-700 rounded w-3/4"></div>
          <div className="space-y-3">
            <div className="grid grid-cols-3 gap-4">
              <div className="h-4 bg-gray-200 dark:bg-gray-700 rounded col-span-2"></div>
              <div className="h-4 bg-gray-200 dark:bg-gray-700 rounded col-span-1"></div>
            </div>
            <div className="h-4 bg-gray-200 dark:bg-gray-700 rounded"></div>
          </div>
        </div>
      </div>
    </div>
  );

  // Error state with retry button
  const ErrorState = () => (
    <div className="h-[600px] flex flex-col items-center justify-center bg-gray-50 dark:bg-gray-900 rounded-lg p-6 text-center">
      <div className="mb-4">
        <svg
          className="mx-auto h-12 w-12 text-red-500"
          fill="none"
          viewBox="0 0 24 24"
          stroke="currentColor"
          aria-hidden="true"
        >
          <path
            strokeLinecap="round"
            strokeLinejoin="round"
            strokeWidth={2}
            d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z"
          />
        </svg>
        <h3 className="mt-2 text-lg font-medium text-gray-900 dark:text-white">
          Something went wrong
        </h3>
        <p className="mt-1 text-gray-600 dark:text-gray-300">
          {error || 'Failed to load the prediction tool.'}
        </p>
      </div>
      <div className="mt-6 flex gap-3">
        <button
          onClick={loadIframe}
          className="inline-flex items-center px-4 py-2 border border-transparent text-sm font-medium rounded-md shadow-sm text-white bg-green-600 hover:bg-green-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-green-500"
        >
          Try again
        </button>
        <a
          href={src}
          target="_blank"
          rel="noopener noreferrer"
          className="inline-flex items-center px-4 py-2 border border-gray-300 dark:border-gray-600 text-sm font-medium rounded-md shadow-sm text-gray-700 dark:text-gray-200 bg-white dark:bg-gray-800 hover:bg-gray-50 dark:hover:bg-gray-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-green-500"
        >
          Open in new tab
        </a>
      </div>
    </div>
  );

  return (
    <ErrorBoundary
      fallback={
        <div className="p-4 bg-red-50 dark:bg-red-900/20 rounded-lg">
          <h3 className="text-lg font-medium text-red-800 dark:text-red-200">
            Something went wrong
          </h3>
          <button
            onClick={loadIframe}
            className="mt-2 px-4 py-2 bg-red-100 dark:bg-red-900 text-red-700 dark:text-red-200 rounded-md hover:bg-red-200 dark:hover:bg-red-800 transition-colors"
          >
            Reload
          </button>
        </div>
      }
    >
      <div className={`w-full h-full ${className} relative`}>
        {isLoading && <LoadingSkeleton />}
        
        {error ? (
          <ErrorState />
        ) : (
          <iframe
            ref={iframeRef}
            src={currentSrc}
            title={title}
            className={`w-full h-[800px] border-0 rounded-lg shadow-lg transition-opacity duration-300 ${
              isLoading ? 'opacity-0 h-0' : 'opacity-100'
            }`}
            onLoad={handleLoad}
            onError={handleError}
            sandbox="allow-same-origin allow-scripts allow-forms allow-popups allow-modals"
            allow="camera;microphone"
            loading="eager"
          />
        )}
      </div>
    </ErrorBoundary>
  );
};

export default StreamlitAppEmbed;
