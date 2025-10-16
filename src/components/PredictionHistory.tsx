import { useEffect, useState } from "react";
import { supabase } from "../lib/supabase";
import { format } from "date-fns";
import { Loader2, RefreshCw } from "lucide-react";
import { Card, CardHeader, CardTitle } from "./ui/card";
import { Button } from "./ui/button";
import { useToast } from "./ui/use-toast";

interface Prediction {
  id: string;
  crop_name: string;
  image_url: string;
  prediction: string;
  confidence: number;
  created_at: string;
}

export default function PredictionHistory() {
  const [predictions, setPredictions] = useState<Prediction[]>([]);
  const [loading, setLoading] = useState(true);
  const { toast } = useToast();

  useEffect(() => {
    fetchPredictions();
  }, []);

  const fetchPredictions = async () => {
    try {
      setLoading(true);
      const { data, error } = await supabase
        .from("disease_predictions")
        .select("*")
        .order("created_at", { ascending: false });

      if (error) {
        // Handle case where table doesn't exist (like 404 error)
        if (error.code === 'PGRST116' || error.message.includes('does not exist')) {
          console.log('Disease predictions table not found, showing empty history');
          setPredictions([]);
          return;
        }
        throw error;
      }
      setPredictions(data || []);
    } catch (error) {
      console.error("Error fetching predictions:", error);
      toast({
        title: "Error",
        description: "Failed to load prediction history",
        variant: "destructive",
      });
      setPredictions([]);
    } finally {
      setLoading(false);
    }
  };

  if (loading) {
    return (
      <div className="flex justify-center items-center h-32">
        <Loader2 className="w-6 h-6 animate-spin text-gray-500" />
      </div>
    );
  }

  if (predictions.length === 0) {
    return (
      <div className="text-center py-8 text-gray-500">
        <p>No prediction history found. Make your first prediction to see results here.</p>
      </div>
    );
  }

  return (
    <div className="space-y-4">
      <div className="flex justify-between items-center">
        <h3 className="text-lg font-medium">Prediction History</h3>
        <Button variant="outline" size="sm" onClick={fetchPredictions}>
          <RefreshCw className="mr-2 h-4 w-4" />
          Refresh
        </Button>
      </div>
      
      <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
        {predictions.map((prediction) => (
          <Card key={prediction.id} className="overflow-hidden">
            <div className="relative h-40 bg-gray-100">
              <img
                src={prediction.image_url}
                alt={`${prediction.crop_name} prediction`}
                className="w-full h-full object-cover"
                onError={(e) => {
                  const target = e.target as HTMLImageElement;
                  target.onerror = null;
                  target.src = "data:image/svg+xml,%3Csvg xmlns='http://www.w3.org/2000/svg' fill='%239ca3af' viewBox='0 0 24 24'%3E%3Cpath d='M19 3H5c-1.1 0-2 .9-2 2v14c0 1.1.9 2 2 2h14c1.1 0 2-.9 2-2V5c0-1.1-.9-2-2-2zm-1 16H6c-.55 0-1-.45-1-1V6c0-.55.45-1 1-1h12c.55 0 1 .45 1 1v12c0 .55-.45 1-1 1zm-4.44-6.19l-2.35 3.02-1.56-1.88c-.2-.25-.58-.24-.78.01l-1.74 2.23c-.26.33-.02.81.39.81h8.98c.41 0 .65-.47.4-.8l-2.55-3.39c-.19-.26-.59-.26-.79 0z'/%3E%3C/svg%3E";
                }}
              />
            </div>
            <CardHeader className="p-4">
              <div className="flex justify-between items-start">
                <div>
                  <CardTitle className="text-lg">{prediction.prediction}</CardTitle>
                  <p className="text-sm text-gray-500">
                    {prediction.crop_name} • {format(new Date(prediction.created_at), 'MMM d, yyyy')}
                  </p>
                </div>
                <span className="px-2 py-1 text-xs font-medium rounded-full bg-green-100 text-green-800">
                  {prediction.confidence}%
                </span>
              </div>
            </CardHeader>
          </Card>
        ))}
      </div>
    </div>
  );
}
