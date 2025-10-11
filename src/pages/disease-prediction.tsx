import { useEffect, useState } from "react";
import { useAuth } from "../contexts/AuthContext";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "../components/ui/card";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "../components/ui/tabs";
import { History, Zap, ExternalLink } from "lucide-react";
import PredictionHistory from "../components/PredictionHistory";
import { Button } from "../components/ui/button";

export default function DiseasePredictionPage() {
  const { user } = useAuth();
  const [_, setActiveTab] = useState("predict");

  // Set the title when the component mounts
  useEffect(() => {
    document.title = "Disease Prediction | Smart Kuku";
  }, []);

  // Streamlit app URL
  const STREAMLIT_APP_URL = 'https://poultrydisease.streamlit.app/';

  return (
    <div className="container mx-auto p-4 max-w-7xl">
      <div className="flex flex-col space-y-6">
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-3xl font-bold text-gray-900 dark:text-white">Disease Prediction</h1>
            <p className="text-gray-600 dark:text-gray-400">
              Upload an image to detect poultry diseases using our AI model
            </p>
          </div>
        </div>

        <Tabs 
          defaultValue="predict" 
          className="w-full"
          onValueChange={setActiveTab}
        >
          <TabsList className="grid w-full grid-cols-2 max-w-md mb-6">
            <TabsTrigger value="predict" className="flex items-center gap-2">
              <Zap className="h-4 w-4" />
              Predict
            </TabsTrigger>
            <TabsTrigger value="history" className="flex items-center gap-2">
              <History className="h-4 w-4" />
              History
            </TabsTrigger>
          </TabsList>

          <TabsContent value="predict" className="space-y-6">
            <Card>
              <CardHeader>
                <CardTitle>Disease Prediction Tool</CardTitle>
                <CardDescription>
                  Click the button below to open the disease prediction tool in a new tab
                </CardDescription>
              </CardHeader>
              <CardContent className="flex flex-col items-center justify-center p-8 space-y-4">
                <p className="text-gray-600 dark:text-gray-400 text-center">
                  Our disease prediction tool will help you identify potential health issues in your poultry.
                </p>
                <Button 
                  asChild
                  className="mt-4"
                >
                  <a 
                    href={STREAMLIT_APP_URL}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="flex items-center gap-2"
                  >
                    <span>Open Prediction Tool</span>
                    <ExternalLink className="h-4 w-4" />
                  </a>
                </Button>
                <p className="text-sm text-gray-500 dark:text-gray-400 mt-2">
                  The tool will open in a new tab
                </p>
              </CardContent>
            </Card>
          </TabsContent>

          <TabsContent value="history">
            <Card>
              <CardContent className="p-6">
                {user ? (
                  <PredictionHistory />
                ) : (
                  <div className="text-center py-12">
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
