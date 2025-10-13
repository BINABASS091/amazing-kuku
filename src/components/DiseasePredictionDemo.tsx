import { useState } from 'react';
import { Play, RefreshCw } from 'lucide-react';
import { Button } from './ui/button';
import { Card, CardContent, CardHeader, CardTitle } from './ui/card';
import { PredictionResultsDisplay } from './PredictionResultsDisplay';
import { exampleScenarios } from '../services/diseaseExamples';

interface DemoResult {
  prediction: string;
  confidence: number;
  confidence_percentage: string;
  timestamp: string;
  filename: string;
  image_size: string;
  source: string;
}

export function DiseasePredictionDemo() {
  const [currentDemo, setCurrentDemo] = useState<number | null>(null);
  const [demoResult, setDemoResult] = useState<DemoResult | null>(null);

  const runDemo = (scenarioIndex: number) => {
    const scenario = exampleScenarios[scenarioIndex];
    setCurrentDemo(scenarioIndex);
    
    // Simulate the API response format
    const result: DemoResult = {
      prediction: scenario.apiResponse.prediction,
      confidence: scenario.apiResponse.confidence,
      confidence_percentage: `${Math.round(scenario.apiResponse.confidence * 100)}%`,
      timestamp: new Date().toISOString(),
      filename: "demo_image.jpg",
      image_size: "800x600",
      source: "demo_mode"
    };
    
    setDemoResult(result);
  };

  const resetDemo = () => {
    setCurrentDemo(null);
    setDemoResult(null);
  };

  return (
    <div className="max-w-4xl mx-auto space-y-6">
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Play className="h-5 w-5" />
            Enhanced Disease Prediction Demo
          </CardTitle>
        </CardHeader>
        <CardContent>
          <p className="text-gray-600 mb-4">
            Experience how our AI provides farmer-friendly interpretations instead of just raw percentages.
            Click on any scenario below to see how the system interprets different prediction results.
          </p>
          
          <div className="grid md:grid-cols-2 gap-3 mb-4">
            {exampleScenarios.map((scenario, index) => (
              <Button
                key={index}
                variant={currentDemo === index ? "default" : "outline"}
                className="text-left h-auto p-3 flex-col items-start"
                onClick={() => runDemo(index)}
              >
                <div className="w-full">
                  <div className="font-medium text-sm mb-1">{scenario.name}</div>
                  <div className="text-xs opacity-75 mb-1">
                    {scenario.apiResponse.prediction} ({Math.round(scenario.apiResponse.confidence * 100)}%)
                  </div>
                  <div className="text-xs text-gray-600 italic">
                    {scenario.description}
                  </div>
                </div>
              </Button>
            ))}
          </div>
          
          {demoResult && (
            <div className="flex justify-center">
              <Button onClick={resetDemo} variant="outline" size="sm">
                <RefreshCw className="h-4 w-4 mr-2" />
                Reset Demo
              </Button>
            </div>
          )}
        </CardContent>
      </Card>

      {demoResult && (
        <div>
          <div className="mb-4 p-3 bg-blue-50 border border-blue-200 rounded-lg">
            <p className="text-sm text-blue-800">
              <strong>Demo Mode:</strong> This shows how our enhanced interpretation system converts raw AI predictions 
              into actionable insights for farmers. The actual system works with real poultry images.
            </p>
          </div>
          <PredictionResultsDisplay result={demoResult} />
        </div>
      )}

      {!demoResult && (
        <Card className="border-dashed border-2 border-gray-300">
          <CardContent className="p-8 text-center">
            <div className="text-gray-500">
              <Play className="h-12 w-12 mx-auto mb-4 opacity-50" />
              <p>Select a demo scenario above to see how our enhanced disease prediction works</p>
              <p className="text-sm mt-2">
                Instead of showing confusing percentages, we provide clear explanations and actionable recommendations
              </p>
            </div>
          </CardContent>
        </Card>
      )}
    </div>
  );
}
