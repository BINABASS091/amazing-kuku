import { AlertTriangle, CheckCircle, AlertCircle, HelpCircle, Lightbulb, Activity, Clock } from 'lucide-react';
import { Card, CardContent, CardHeader, CardTitle } from './ui/card';
import { DiseaseInterpreter } from '../services/diseaseInterpreter';

interface PredictionResult {
  prediction: string;
  confidence: number;
  confidence_percentage: string;
  timestamp: string;
  filename: string;
  image_size: string;
  source: string;
  error?: string;
}

interface PredictionResultsDisplayProps {
  result: PredictionResult;
}

export function PredictionResultsDisplay({ result }: PredictionResultsDisplayProps) {
  const interpretation = DiseaseInterpreter.interpretPrediction(result.prediction, result.confidence);
  
  const getStatusIcon = (status: string) => {
    switch (status) {
      case 'healthy':
        return <CheckCircle className="h-6 w-6 text-green-600" />;
      case 'warning':
        return <AlertTriangle className="h-6 w-6 text-yellow-600" />;
      case 'critical':
        return <AlertCircle className="h-6 w-6 text-red-600" />;
      default:
        return <HelpCircle className="h-6 w-6 text-gray-600" />;
    }
  };
  
  const getStatusColors = (status: string) => {
    switch (status) {
      case 'healthy':
        return 'border-green-200 bg-green-50';
      case 'warning':
        return 'border-yellow-200 bg-yellow-50';
      case 'critical':
        return 'border-red-200 bg-red-50';
      default:
        return 'border-gray-200 bg-gray-50';
    }
  };
  
  const getSeverityBadge = (severity: string) => {
    const colors = {
      low: 'bg-green-100 text-green-800',
      medium: 'bg-yellow-100 text-yellow-800',
      high: 'bg-red-100 text-red-800'
    };
    
    return (
      <span className={`px-2 py-1 rounded-full text-xs font-medium ${colors[severity as keyof typeof colors]}`}>
        {severity.charAt(0).toUpperCase() + severity.slice(1)} Priority
      </span>
    );
  };
  
  return (
    <div className="space-y-4">
      {/* Main Status Card */}
      <Card className={`border-l-4 ${getStatusColors(interpretation.status)}`}>
        <CardHeader className="pb-3">
          <CardTitle className="flex items-center gap-3">
            {getStatusIcon(interpretation.status)}
            <div>
              <h3 className="text-xl font-semibold">Analysis Results</h3>
              <div className="flex items-center gap-2 mt-1">
                {getSeverityBadge(interpretation.severity)}
                <span className="text-sm text-gray-500">
                  <Clock className="h-4 w-4 inline mr-1" />
                  {new Date(result.timestamp).toLocaleString()}
                </span>
              </div>
            </div>
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          {/* Main Message */}
          <div className="p-4 rounded-lg bg-white border">
            <p className="text-lg font-medium text-gray-900 mb-2">
              {interpretation.message}
            </p>
            <p className="text-sm text-gray-600">
              {interpretation.confidenceDescription}
            </p>
          </div>
          
          {/* Technical Details (Collapsible) */}
          <details className="border rounded-lg">
            <summary className="p-3 cursor-pointer hover:bg-gray-50 font-medium text-sm">
              Technical Details
            </summary>
            <div className="p-3 border-t bg-gray-50 text-sm space-y-2">
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <span className="font-medium">Raw Prediction:</span>
                  <br />
                  <span className="text-gray-600">{result.prediction}</span>
                </div>
                <div>
                  <span className="font-medium">Confidence:</span>
                  <br />
                  <span className="text-gray-600">{result.confidence_percentage}</span>
                </div>
                <div>
                  <span className="font-medium">Image Size:</span>
                  <br />
                  <span className="text-gray-600">{result.image_size}</span>
                </div>
                <div>
                  <span className="font-medium">Source:</span>
                  <br />
                  <span className="text-gray-600">{result.source}</span>
                </div>
              </div>
            </div>
          </details>
        </CardContent>
      </Card>
      
      {/* Recommendations Card */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Lightbulb className="h-5 w-5 text-blue-600" />
            Recommended Actions
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="grid md:grid-cols-2 gap-6">
            {/* Immediate Actions */}
            <div>
              <h4 className="font-semibold text-gray-900 mb-3 flex items-center gap-2">
                <Activity className="h-4 w-4" />
                Immediate Actions
              </h4>
              <ul className="space-y-2">
                {interpretation.actions.map((action, index) => (
                  <li key={index} className="flex items-start gap-2 text-sm">
                    <span className="mt-1.5 h-2 w-2 bg-blue-500 rounded-full flex-shrink-0"></span>
                    {action}
                  </li>
                ))}
              </ul>
            </div>
            
            {/* General Recommendations */}
            <div>
              <h4 className="font-semibold text-gray-900 mb-3">
                General Care Recommendations
              </h4>
              <ul className="space-y-2">
                {interpretation.recommendations.map((recommendation, index) => (
                  <li key={index} className="flex items-start gap-2 text-sm">
                    <span className="mt-1.5 h-2 w-2 bg-green-500 rounded-full flex-shrink-0"></span>
                    {recommendation}
                  </li>
                ))}
              </ul>
            </div>
          </div>
        </CardContent>
      </Card>
      
      {/* Important Notes */}
      {interpretation.status !== 'healthy' && (
        <Card className="border-amber-200 bg-amber-50">
          <CardContent className="p-4">
            <div className="flex items-start gap-3">
              <AlertTriangle className="h-5 w-5 text-amber-600 flex-shrink-0 mt-0.5" />
              <div className="text-sm">
                <p className="font-medium text-amber-800 mb-1">Important Note</p>
                <p className="text-amber-700">
                  This AI analysis is a preliminary assessment tool. Always consult with a qualified 
                  poultry veterinarian for professional diagnosis and treatment recommendations. 
                  Early intervention can significantly improve outcomes for your flock.
                </p>
              </div>
            </div>
          </CardContent>
        </Card>
      )}
      
      {/* Confidence Level Explanation */}
      <Card className="bg-blue-50 border-blue-200">
        <CardContent className="p-4">
          <h4 className="font-medium text-blue-900 mb-2">Understanding the Analysis</h4>
          <div className="text-sm text-blue-800 space-y-1">
            <p>• <strong>Very High Confidence (95-100%):</strong> Strong indicators present, recommendations highly reliable</p>
            <p>• <strong>High Confidence (85-94%):</strong> Clear patterns detected, recommendations are reliable</p>
            <p>• <strong>Medium Confidence (70-84%):</strong> Some indicators present, consider additional assessment</p>
            <p>• <strong>Low Confidence (&lt;70%):</strong> Unclear indicators, professional assessment recommended</p>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
