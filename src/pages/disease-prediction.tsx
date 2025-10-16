import { useEffect, useState } from "react";
import { useAuth } from "../contexts/AuthContext";
import { useSubscription } from "../contexts/SubscriptionContext";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "../components/ui/card";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "../components/ui/tabs";
import { History, Zap, Image, AlertCircle, ExternalLink, Play, Crown } from "lucide-react";
import { Button } from "../components/ui/button";
import PredictionHistory from "../components/PredictionHistory";
import { DiseasePredictionForm } from "../components/DiseasePredictionForm";
import { DiseasePredictionDemo } from "../components/DiseasePredictionDemo";
import { supabase } from "../lib/supabase";

export default function DiseasePredictionPage() {
  const { user } = useAuth();
  const { checkLimit, planLimits, getUpgradeMessage } = useSubscription();
  const [activeTab, setActiveTab] = useState("predict");
  const [useLocalAPI, setUseLocalAPI] = useState(true);
  const [monthlyPredictions, setMonthlyPredictions] = useState(0);
  const [isCheckingLimit, setIsCheckingLimit] = useState(false);
  const STREAMLIT_APP_URL = 'https://poultrydisease.streamlit.app/';

  useEffect(() => {
    document.title = "Disease Prediction | Smart Kuku";
    fetchMonthlyPredictions();
  }, [user]);

  const fetchMonthlyPredictions = async () => {
    if (!user) return;

    try {
      const { data: farmer } = await supabase
        .from('farmers')
        .select('id')
        .eq('user_id', user.id)
        .maybeSingle();

      if (!farmer) return;

      const currentMonth = new Date();
      const firstDayOfMonth = new Date(currentMonth.getFullYear(), currentMonth.getMonth(), 1);
      
      const { count } = await supabase
        .from('disease_predictions')
        .select('*', { count: 'exact', head: true })
        .eq('farmer_id', farmer.id)
        .gte('created_at', firstDayOfMonth.toISOString());

      setMonthlyPredictions(count || 0);
    } catch (error) {
      console.error('Error fetching monthly predictions:', error);
    }
  };

  const canMakePrediction = () => {
    return checkLimit('maxPredictions', monthlyPredictions);
  };

  const handleOpenPredictionTool = () => {
    if (!canMakePrediction()) {
      alert(getUpgradeMessage('disease predictions'));
      return;
    }
    window.open(STREAMLIT_APP_URL, '_blank', 'noopener,noreferrer');
  };

  const handlePredictionComplete = (result: any) => {
    console.log('Prediction completed:', result);
    // Refresh the monthly predictions count
    fetchMonthlyPredictions();
  };

  return (
    <div className="container mx-auto p-4 max-w-4xl">
      <div className="flex flex-col space-y-6">
        <div className="text-center">
          <h1 className="text-3xl font-bold text-gray-900 dark:text-white">Poultry Disease Detection</h1>
          <p className="text-gray-600 dark:text-gray-400 mt-2">
            Identify potential health issues in your poultry using our AI-powered detection tool
          </p>
        </div>

        <Tabs 
          value={activeTab}
          onValueChange={setActiveTab}
          className="w-full"
        >
          <TabsList className="grid w-full grid-cols-3 max-w-lg mx-auto mb-8">
            <TabsTrigger value="predict" className="flex items-center gap-2">
              <Zap className="h-4 w-4" />
              Detect Disease
            </TabsTrigger>
            <TabsTrigger value="demo" className="flex items-center gap-2">
              <Play className="h-4 w-4" />
              Demo
            </TabsTrigger>
            <TabsTrigger value="history" className="flex items-center gap-2">
              <History className="h-4 w-4" />
              History
            </TabsTrigger>
          </TabsList>

          <TabsContent value="predict" className="space-y-6">
            {/* Usage Counter */}
            <Card className="bg-gradient-to-r from-blue-50 to-purple-50 border-blue-200">
              <CardContent className="p-4">
                <div className="flex items-center justify-between">
                  <div className="flex items-center space-x-3">
                    <div className="p-2 bg-blue-100 rounded-lg">
                      <Crown className="w-5 h-5 text-blue-600" />
                    </div>
                    <div>
                      <h3 className="font-medium text-gray-900">Disease Predictions</h3>
                      <p className="text-sm text-gray-600">
                        Used {monthlyPredictions} this month
                        {planLimits.maxPredictions !== -1 && ` of ${planLimits.maxPredictions}`}
                      </p>
                    </div>
                  </div>
                  {!canMakePrediction() && (
                    <Button 
                      onClick={() => window.location.href = '/farmer/subscription'}
                      variant="outline"
                      size="sm"
                      className="text-blue-600 border-blue-600 hover:bg-blue-50"
                    >
                      Upgrade Plan
                    </Button>
                  )}
                </div>
              </CardContent>
            </Card>

            <div className="flex justify-center mb-6">
              <div className="flex items-center gap-4 p-2 bg-gray-100 rounded-lg">
                <button
                  onClick={() => setUseLocalAPI(true)}
                  className={`px-4 py-2 rounded-md transition-colors ${
                    useLocalAPI 
                      ? 'bg-green-600 text-white' 
                      : 'bg-transparent text-gray-600 hover:bg-gray-200'
                  }`}
                >
                  Integrated Tool
                </button>
                <button
                  onClick={() => setUseLocalAPI(false)}
                  className={`px-4 py-2 rounded-md transition-colors ${
                    !useLocalAPI 
                      ? 'bg-green-600 text-white' 
                      : 'bg-transparent text-gray-600 hover:bg-gray-200'
                  }`}
                >
                  External Tool
                </button>
              </div>
            </div>

            {useLocalAPI ? (
              <DiseasePredictionForm onPredictionComplete={handlePredictionComplete} />
            ) : (
              <Card className="border border-gray-200 dark:border-gray-700">
                <CardHeader className="text-center">
                  <div className="mx-auto flex h-12 w-12 items-center justify-center rounded-full bg-green-100 dark:bg-green-900/30 mb-4">
                    <Image className="h-6 w-6 text-green-600 dark:text-green-400" />
                  </div>
                  <CardTitle className="text-2xl">AI-Powered Poultry Health Check</CardTitle>
                  <CardDescription className="max-w-2xl mx-auto">
                    Our advanced AI model analyzes images of your poultry to detect potential health issues early
                  </CardDescription>
                </CardHeader>
                <CardContent className="flex flex-col items-center justify-center p-8 pt-0 space-y-6">
                  <div className="space-y-4 text-center">
                    <h3 className="text-lg font-medium">How it works:</h3>
                    <ul className="grid gap-3 text-sm text-gray-600 dark:text-gray-300 text-left max-w-md mx-auto">
                      <li className="flex items-start gap-2">
                        <span className="mt-0.5 flex h-5 w-5 flex-shrink-0 items-center justify-center rounded-full bg-green-100 text-green-700 dark:bg-green-900/50 dark:text-green-400">1</span>
                        <span>Click the button below to open the detection tool</span>
                      </li>
                      <li className="flex items-start gap-2">
                        <span className="mt-0.5 flex h-5 w-5 flex-shrink-0 items-center justify-center rounded-full bg-green-100 text-green-700 dark:bg-green-900/50 dark:text-green-400">2</span>
                        <span>Upload a clear photo of your poultry</span>
                      </li>
                      <li className="flex items-start gap-2">
                        <span className="mt-0.5 flex h-5 w-5 flex-shrink-0 items-center justify-center rounded-full bg-green-100 text-green-700 dark:bg-green-900/50 dark:text-green-400">3</span>
                        <span>Get instant analysis and recommendations</span>
                      </li>
                    </ul>
                  </div>

                  <div className="pt-4 w-full max-w-xs">
                    <Button 
                      onClick={handleOpenPredictionTool}
                      size="lg"
                      className="w-full flex items-center justify-center gap-2 py-6 text-base"
                    >
                      <ExternalLink className="h-5 w-5" />
                      Open External Detection Tool
                    </Button>
                  </div>

                  <div className="mt-4 flex items-start gap-2 rounded-lg border border-amber-100 bg-amber-50 p-4 text-amber-700 dark:border-amber-900 dark:bg-amber-900/30 dark:text-amber-400">
                    <AlertCircle className="h-5 w-5 flex-shrink-0 mt-0.5" />
                    <div className="text-sm">
                      <p className="font-medium">Important Note</p>
                      <p className="mt-1">The detection tool will open in a new tab. Please ensure your browser allows pop-ups for this site.</p>
                    </div>
                  </div>
                </CardContent>
              </Card>
            )}
          </TabsContent>

          <TabsContent value="demo" className="space-y-6">
            <DiseasePredictionDemo />
          </TabsContent>

          <TabsContent value="history">
            <Card>
              <CardContent className="p-6">
                {user ? (
                  <PredictionHistory />
                ) : (
                  <div className="text-center py-12 space-y-4">
                    <div className="mx-auto flex h-16 w-16 items-center justify-center rounded-full bg-blue-100 dark:bg-blue-900/30 mb-4">
                      <AlertCircle className="h-8 w-8 text-blue-600 dark:text-blue-400" />
                    </div>
                    <h3 className="text-lg font-medium text-gray-900 dark:text-white">Sign in to view your prediction history</h3>
                    <p className="text-gray-600 dark:text-gray-400">Your prediction history will be saved and available across devices</p>
                    <Button className="mt-4" variant="outline" onClick={() => window.location.href = '/login?redirect=/disease-prediction?tab=history'}>
                      Sign in to continue
                    </Button>
                    <p className="text-gray-500 dark:text-gray-400">
                      Please sign in to view your prediction history.
                    </p>
                  </div>
                )}
              </CardContent>
            </Card>
          </TabsContent>
        </Tabs>
      </div>
    </div>
  );
}
