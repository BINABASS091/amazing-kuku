import { useState, useCallback } from 'react';
import { Upload, X, Zap, AlertCircle, CheckCircle, Clock, FileImage } from 'lucide-react';
import { Button } from './ui/button';
import { Card, CardContent, CardHeader, CardTitle } from './ui/card';
import { apiService, PredictionResult } from '../services/apiService';

interface DiseasePredictionFormProps {
  onPredictionComplete?: (result: PredictionResult) => void;
}

export function DiseasePredictionForm({ onPredictionComplete }: DiseasePredictionFormProps) {
  const [selectedFile, setSelectedFile] = useState<File | null>(null);
  const [previewUrl, setPreviewUrl] = useState<string | null>(null);
  const [isLoading, setIsLoading] = useState(false);
  const [result, setResult] = useState<PredictionResult | null>(null);
  const [error, setError] = useState<string | null>(null);

  const handleFileSelect = useCallback((file: File) => {
    if (!file.type.startsWith('image/')) {
      setError('Please select a valid image file');
      return;
    }

    if (file.size > 10 * 1024 * 1024) { // 10MB limit
      setError('Image file must be smaller than 10MB');
      return;
    }

    setSelectedFile(file);
    setError(null);
    setResult(null);

    // Create preview URL
    const url = URL.createObjectURL(file);
    setPreviewUrl(url);
  }, []);

  const handleDrop = useCallback((e: React.DragEvent<HTMLDivElement>) => {
    e.preventDefault();
    const file = e.dataTransfer.files[0];
    if (file) {
      handleFileSelect(file);
    }
  }, [handleFileSelect]);

  const handleFileInput = useCallback((e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      handleFileSelect(file);
    }
  }, [handleFileSelect]);

  const clearSelection = useCallback(() => {
    setSelectedFile(null);
    if (previewUrl) {
      URL.revokeObjectURL(previewUrl);
    }
    setPreviewUrl(null);
    setResult(null);
    setError(null);
  }, [previewUrl]);

  const handlePredict = async () => {
    if (!selectedFile) return;

    setIsLoading(true);
    setError(null);

    try {
      const data = await apiService.predictDisease(selectedFile, 'poultry');
      setResult(data);
      
      if (onPredictionComplete) {
        onPredictionComplete(data);
      }
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : 'An unexpected error occurred';
      setError(errorMessage);
      console.error('Prediction error:', err);
    } finally {
      setIsLoading(false);
    }
  };

  const getPredictionColor = (prediction: string, confidence: number) => {
    if (prediction.toLowerCase().includes('healthy')) {
      return 'text-green-600 bg-green-50 border-green-200';
    } else if (confidence < 0.7) {
      return 'text-yellow-600 bg-yellow-50 border-yellow-200';
    } else {
      return 'text-red-600 bg-red-50 border-red-200';
    }
  };

  return (
    <Card className="w-full max-w-2xl mx-auto">
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <FileImage className="h-5 w-5" />
          Poultry Disease Detection
        </CardTitle>
      </CardHeader>
      <CardContent className="space-y-6">
        {/* File Upload Area */}
        <div
          onDrop={handleDrop}
          onDragOver={(e) => e.preventDefault()}
          className="border-2 border-dashed border-gray-300 rounded-lg p-8 text-center hover:border-gray-400 transition-colors"
        >
          {!selectedFile ? (
            <>
              <Upload className="h-12 w-12 text-gray-400 mx-auto mb-4" />
              <p className="text-lg font-medium text-gray-700 mb-2">
                Upload a photo of your poultry
              </p>
              <p className="text-sm text-gray-500 mb-4">
                Drag and drop or click to select an image
              </p>
              <input
                type="file"
                accept="image/*"
                onChange={handleFileInput}
                className="absolute inset-0 w-full h-full opacity-0 cursor-pointer"
              />
              <Button variant="outline" className="relative z-10 pointer-events-none">
                Choose File
              </Button>
            </>
          ) : (
            <div className="space-y-4">
              <div className="relative inline-block">
                <img
                  src={previewUrl!}
                  alt="Preview"
                  className="max-h-64 max-w-full rounded-lg shadow-md"
                />
                <button
                  onClick={clearSelection}
                  className="absolute -top-2 -right-2 bg-red-500 text-white rounded-full p-1 hover:bg-red-600 transition-colors"
                >
                  <X className="h-4 w-4" />
                </button>
              </div>
              <p className="text-sm text-gray-600">
                {selectedFile.name} ({(selectedFile.size / 1024 / 1024).toFixed(1)} MB)
              </p>
            </div>
          )}
        </div>

        {/* Error Message */}
        {error && (
          <div className="flex items-start gap-2 p-4 bg-red-50 border border-red-200 rounded-lg text-red-700">
            <AlertCircle className="h-5 w-5 flex-shrink-0 mt-0.5" />
            <div>
              <p className="font-medium">Error</p>
              <p className="text-sm mt-1">{error}</p>
            </div>
          </div>
        )}

        {/* Predict Button */}
        {selectedFile && (
          <Button
            onClick={handlePredict}
            disabled={isLoading}
            className="w-full flex items-center justify-center gap-2"
            size="lg"
          >
            {isLoading ? (
              <>
                <Clock className="h-5 w-5 animate-spin" />
                Analyzing...
              </>
            ) : (
              <>
                <Zap className="h-5 w-5" />
                Detect Disease
              </>
            )}
          </Button>
        )}

        {/* Results */}
        {result && (
          <Card className="border-l-4 border-l-blue-500">
            <CardContent className="p-4">
              <h3 className="font-semibold text-lg mb-3 flex items-center gap-2">
                <CheckCircle className="h-5 w-5 text-green-600" />
                Analysis Results
              </h3>
              
              <div className="space-y-3">
                <div className={`p-3 rounded-lg border ${getPredictionColor(result.prediction, result.confidence)}`}>
                  <div className="flex justify-between items-center">
                    <span className="font-medium">Prediction:</span>
                    <span className="font-bold">{result.prediction}</span>
                  </div>
                  <div className="flex justify-between items-center mt-1">
                    <span className="font-medium">Confidence:</span>
                    <span className="font-bold">{result.confidence_percentage}</span>
                  </div>
                </div>

                <div className="grid grid-cols-2 gap-3 text-sm text-gray-600">
                  <div>
                    <span className="font-medium">Image Size:</span>
                    <br />
                    {result.image_size}
                  </div>
                  <div>
                    <span className="font-medium">Analysis Time:</span>
                    <br />
                    {new Date(result.timestamp).toLocaleString()}
                  </div>
                </div>

                {result.source && (
                  <div className="text-xs text-gray-500 border-t pt-2">
                    Source: {result.source}
                  </div>
                )}

                {result.error && (
                  <div className="text-xs text-yellow-600 bg-yellow-50 p-2 rounded">
                    Note: {result.error}
                  </div>
                )}
              </div>
            </CardContent>
          </Card>
        )}

        {/* Tips */}
        <div className="bg-blue-50 border border-blue-200 rounded-lg p-4">
          <h4 className="font-medium text-blue-900 mb-2">Tips for better results:</h4>
          <ul className="text-sm text-blue-800 space-y-1">
            <li>• Use clear, well-lit photos</li>
            <li>• Ensure the poultry is the main subject</li>
            <li>• Avoid blurry or low-resolution images</li>
            <li>• Multiple angles can provide better insights</li>
          </ul>
        </div>
      </CardContent>
    </Card>
  );
}
