import { useState, useEffect } from "react";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "./components/ui/tabs";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "./components/ui/card";
import { Button } from "./components/ui/button";
import { Textarea } from "./components/ui/textarea";
import { Badge } from "./components/ui/badge";
import { Alert, AlertDescription } from "./components/ui/alert";
import { Brain, BarChart3, Info, Sparkles, CheckCircle2, AlertCircle } from "lucide-react";
import { PredictionCard } from "./components/PredictionCard";
import { SampleComments } from "./components/SampleComments";
import { BulkUpload } from "./components/BulkUpload";

// Mock prediction function (fallback if API is not available)
function predictCommentMock(text: string) {
  // Mock categories based on keywords
  const mainCategories = [
    { label: "Food Quality", probability: 0 },
    { label: "Food Safety", probability: 0 },
    { label: "Catering Error", probability: 0 },
    { label: "Service Issue", probability: 0 },
    { label: "Missing Items", probability: 0 },
  ];

  const subCategories = [
    { label: "Taste Issues", probability: 0 },
    { label: "Temperature Problems", probability: 0 },
    { label: "Portion Size", probability: 0 },
    { label: "Presentation", probability: 0 },
    { label: "Hygiene Concerns", probability: 0 },
    { label: "Wrong Order", probability: 0 },
    { label: "Beverage Issues", probability: 0 },
  ];

  const lowerText = text.toLowerCase();

  // Simple keyword-based mock predictions
  if (lowerText.includes("sick") || lowerText.includes("smell")) {
    mainCategories[1].probability = 85.3 + Math.random() * 10;
    mainCategories[0].probability = 8.2 + Math.random() * 5;
    subCategories[4].probability = 82.1 + Math.random() * 10;
    subCategories[0].probability = 12.3 + Math.random() * 5;
  } else if (lowerText.includes("flavor") || lowerText.includes("taste") || lowerText.includes("overcooked")) {
    mainCategories[0].probability = 88.5 + Math.random() * 8;
    mainCategories[3].probability = 7.1 + Math.random() * 4;
    subCategories[0].probability = 89.2 + Math.random() * 8;
    subCategories[1].probability = 6.8 + Math.random() * 3;
  } else if (lowerText.includes("catered") || lowerText.includes("wrong") || lowerText.includes("incorrect")) {
    mainCategories[2].probability = 91.2 + Math.random() * 6;
    mainCategories[0].probability = 5.3 + Math.random() * 3;
    subCategories[5].probability = 87.6 + Math.random() * 8;
    subCategories[0].probability = 8.1 + Math.random() * 4;
  } else if (lowerText.includes("beverage") || lowerText.includes("drink") || lowerText.includes("insufficient")) {
    mainCategories[4].probability = 84.7 + Math.random() * 10;
    mainCategories[0].probability = 9.2 + Math.random() * 5;
    subCategories[6].probability = 86.3 + Math.random() * 9;
    subCategories[2].probability = 7.9 + Math.random() * 4;
  } else {
    // Default prediction
    mainCategories[0].probability = 75.0 + Math.random() * 15;
    mainCategories[3].probability = 15.0 + Math.random() * 8;
    subCategories[0].probability = 70.0 + Math.random() * 20;
    subCategories[3].probability = 18.0 + Math.random() * 10;
  }

  // Fill in remaining probabilities
  mainCategories.forEach(cat => {
    if (cat.probability === 0) cat.probability = Math.random() * 5;
  });
  subCategories.forEach(cat => {
    if (cat.probability === 0) cat.probability = Math.random() * 5;
  });

  // Sort by probability
  mainCategories.sort((a, b) => b.probability - a.probability);
  subCategories.sort((a, b) => b.probability - a.probability);

  return {
    mainPredictions: mainCategories,
    subPredictions: subCategories,
  };
}

const API_URL = "https://feedback-webapp-5zc2.onrender.com";

// API helper functions
async function checkHealth() {
  try {
    const response = await fetch(`${API_URL}/health`, {
      method: 'GET',
      headers: { 'Content-Type': 'application/json' },
    });
    if (!response.ok) throw new Error('Health check failed');
    return await response.json();
  } catch (error) {
    return { status: 'offline', model_loaded: false };
  }
}

async function predictText(text: string) {
  const response = await fetch(`${API_URL}/predict`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ text }),
  });
  if (!response.ok) throw new Error('Prediction failed');
  return await response.json();
}

export default function App() {
  const [commentText, setCommentText] = useState("");
  const [predictions, setPredictions] = useState<{
    mainPredictions: any[];
    subPredictions: any[];
  } | null>(null);
  const [isAnalyzing, setIsAnalyzing] = useState(false);
  const [apiStatus, setApiStatus] = useState<"checking" | "online" | "offline">("checking");
  const [useMockData, setUseMockData] = useState(true);

  // Check API health on mount
  useEffect(() => {
    checkApiHealth();
  }, []);

  const checkApiHealth = async () => {
    try {
      const health = await checkHealth();
      if (health.status === "healthy" && health.model_loaded) {
        setApiStatus("online");
        setUseMockData(false);
      } else {
        setApiStatus("offline");
        setUseMockData(true);
      }
    } catch (error) {
      setApiStatus("offline");
      setUseMockData(true);
    }
  };

  const predictComment = async (text: string) => {
    if (useMockData) {
      return predictCommentMock(text);
    }

    try {
      const result = await predictText(text);
      return result;
    } catch (error) {
      console.error("API prediction failed, using mock data:", error);
      return predictCommentMock(text);
    }
  };

  const handleAnalyze = async () => {
    if (!commentText.trim()) {
      alert("Please enter a comment first.");
      return;
    }

    setIsAnalyzing(true);
    
    try {
      const result = await predictComment(commentText);
      setPredictions(result);
    } catch (error) {
      alert("Failed to analyze feedback. Please try again.");
    } finally {
      setIsAnalyzing(false);
    }
  };

  const handleSelectSample = (text: string) => {
    setCommentText(text);
    setPredictions(null);
  };

  return (
    <div className="min-h-screen bg-background dark">
      <div className="container mx-auto px-4 py-8 max-w-6xl">
        {/* Header */}
        <div className="mb-8">
          <div className="flex items-center gap-3 mb-3">
            <div className="p-2 rounded-lg bg-primary/10">
              <Brain className="w-8 h-8 text-foreground" />
            </div>
            <div>
              <h1 className="text-foreground">FCR Feedback Categorization</h1>
              <p className="text-muted-foreground">
                AI-powered classification of feedback into structured categories
              </p>
            </div>
          </div>
          
          <div className="flex flex-wrap gap-2 items-center">
            <Badge variant="outline">Fine-tuned BERT</Badge>
            <Badge variant="outline">Multi-category Output</Badge>
            <Badge variant="outline">Version 2.2</Badge>
            
            {apiStatus === "checking" && (
              <Badge variant="secondary" className="gap-1">
                <span className="animate-pulse">●</span> Checking API...
              </Badge>
            )}
            {apiStatus === "online" && (
              <Badge variant="default" className="bg-green-600 hover:bg-green-700 gap-1">
                <span>●</span> API Connected
              </Badge>
            )}
            {apiStatus === "offline" && (
              <Badge variant="secondary" className="gap-1">
                <AlertCircle className="w-3 h-3" /> Using Demo Mode
              </Badge>
            )}
          </div>
        </div>

        {/* API Status Alert */}
        {apiStatus === "offline" && (
          <Alert className="mb-6">
            <AlertCircle className="h-4 w-4" />
            <AlertDescription>
              Backend API is not connected. Using demo mode with mock predictions. 
              To use the real model, start the Python API server. 
              <Button 
                variant="link" 
                className="p-0 h-auto ml-1"
                onClick={checkApiHealth}
              >
                Retry connection
              </Button>
            </AlertDescription>
          </Alert>
        )}

        {/* Main Content */}
        <Tabs defaultValue="home" className="w-full">
          <TabsList className="grid w-full grid-cols-3 mb-6">
            <TabsTrigger value="home" className="flex items-center gap-2">
              <Sparkles className="w-4 h-4" />
              Analyze
            </TabsTrigger>
            <TabsTrigger value="analytics" className="flex items-center gap-2">
              <BarChart3 className="w-4 h-4" />
              Analytics
            </TabsTrigger>
            <TabsTrigger value="about" className="flex items-center gap-2">
              <Info className="w-4 h-4" />
              About
            </TabsTrigger>
          </TabsList>

          {/* Home Tab */}
          <TabsContent value="home" className="space-y-6">
            <SampleComments onSelectSample={handleSelectSample} />

            <Card>
              <CardHeader>
                <CardTitle>Analyze Feedback</CardTitle>
                <CardDescription>
                  Enter a comment to classify it into main and subcategories
                </CardDescription>
              </CardHeader>
              <CardContent>
                <Textarea
                  placeholder="Example: 'The burger was juicy and perfectly cooked.'"
                  value={commentText}
                  onChange={(e) => setCommentText(e.target.value)}
                  className="min-h-[120px] mb-4"
                />
                <Button 
                  onClick={handleAnalyze}
                  disabled={isAnalyzing}
                  className="w-full"
                >
                  {isAnalyzing ? (
                    <>
                      <span className="animate-pulse">Analyzing...</span>
                    </>
                  ) : (
                    <>
                      <Sparkles className="mr-2 h-4 w-4" />
                      Analyze Feedback
                    </>
                  )}
                </Button>

                {predictions && (
                  <div className="mt-6">
                    <Alert className="mb-4">
                      <CheckCircle2 className="h-4 w-4" />
                      <AlertDescription>
                        Prediction complete! Results displayed below.
                      </AlertDescription>
                    </Alert>
                    <PredictionCard 
                      mainPredictions={predictions.mainPredictions}
                      subPredictions={predictions.subPredictions}
                    />
                  </div>
                )}
              </CardContent>
            </Card>

            <BulkUpload onPredict={predictComment} />
          </TabsContent>

          {/* Analytics Tab */}
          <TabsContent value="analytics">
            <Card>
              <CardHeader>
                <CardTitle>Analytics Dashboard</CardTitle>
                <CardDescription>
                  View category trends and feedback distributions
                </CardDescription>
              </CardHeader>
              <CardContent className="py-12">
                <div className="text-center text-muted-foreground">
                  <BarChart3 className="w-16 h-16 mx-auto mb-4 opacity-50" />
                  <p>Analytics will appear after bulk uploads are processed.</p>
                  <p className="text-sm mt-2">
                    Upload CSV files to see distribution charts and trend analysis.
                  </p>
                </div>
              </CardContent>
            </Card>
          </TabsContent>

          {/* About Tab */}
          <TabsContent value="about">
            <Card>
              <CardHeader>
                <CardTitle>About This Tool</CardTitle>
                <CardDescription>
                  Learn more about the FCR Feedback Categorization model
                </CardDescription>
              </CardHeader>
              <CardContent className="space-y-4">
                <p>
                  This tool uses a fine-tuned <strong>BERT-based model</strong> to classify 
                  feedback into <strong>main</strong> and <strong>subcategory</strong> labels, 
                  helping operations teams identify key trends quickly and accurately.
                </p>

                {/* Elementary Explanation */}
                <div className="mt-6 p-6 rounded-lg bg-primary/5 border-2 border-primary/20">
                  <h3 className="mb-3">What Does This Model Do? (In Simple Terms)</h3>
                  <p className="text-muted-foreground mb-4">
                    Imagine you have thousands of customer feedback comments to read. This AI model 
                    acts like a super-fast reader that can:
                  </p>
                  <div className="space-y-3">
                    <div className="flex gap-3">
                      <div className="shrink-0 w-8 h-8 rounded-full bg-chart-1/20 flex items-center justify-center">
                        <span>📖</span>
                      </div>
                      <div>
                        <h4>Read and Understand</h4>
                        <p className="text-sm text-muted-foreground">
                          It reads each comment and understands what the customer is talking about, 
                          just like a human would.
                        </p>
                      </div>
                    </div>
                    
                    <div className="flex gap-3">
                      <div className="shrink-0 w-8 h-8 rounded-full bg-chart-2/20 flex items-center justify-center">
                        <span>🏷️</span>
                      </div>
                      <div>
                        <h4>Put Labels on Comments</h4>
                        <p className="text-sm text-muted-foreground">
                          It automatically assigns labels to each comment. For example, "The food was cold" 
                          might get labeled as "Food Quality" (main category) and "Temperature Problems" (subcategory).
                        </p>
                      </div>
                    </div>
                    
                    <div className="flex gap-3">
                      <div className="shrink-0 w-8 h-8 rounded-full bg-chart-3/20 flex items-center justify-center">
                        <span>⚡</span>
                      </div>
                      <div>
                        <h4>Work Super Fast</h4>
                        <p className="text-sm text-muted-foreground">
                          What might take a person hours to categorize, this model can do in seconds—even 
                          for thousands of comments at once.
                        </p>
                      </div>
                    </div>
                    
                    <div className="flex gap-3">
                      <div className="shrink-0 w-8 h-8 rounded-full bg-chart-4/20 flex items-center justify-center">
                        <span>🎯</span>
                      </div>
                      <div>
                        <h4>Show Confidence Levels</h4>
                        <p className="text-sm text-muted-foreground">
                          The model tells you how confident it is about each prediction. A 95% confidence 
                          means it's very sure, while 60% means it's less certain.
                        </p>
                      </div>
                    </div>
                  </div>
                  
                  <div className="mt-4 p-3 rounded bg-muted/50">
                    <p className="text-sm">
                      <strong>Think of it like this:</strong> If you sort your emails into folders automatically, 
                      this model does the same thing for customer feedback, but it's much smarter because 
                      it actually understands what people are saying!
                    </p>
                  </div>
                </div>
                
                <div className="grid sm:grid-cols-2 gap-4 mt-6">
                  <div className="p-4 rounded-lg border border-border bg-muted/30">
                    <h4 className="mb-2">Model Architecture</h4>
                    <p className="text-sm text-muted-foreground">
                      Fine-tuned BERT with two classification heads for simultaneous 
                      main category and subcategory prediction.
                    </p>
                  </div>
                  
                  <div className="p-4 rounded-lg border border-border bg-muted/30">
                    <h4 className="mb-2">Use Cases</h4>
                    <p className="text-sm text-muted-foreground">
                      Ideal for categorizing customer feedback, support tickets, 
                      and operational reports at scale.
                    </p>
                  </div>
                  
                  <div className="p-4 rounded-lg border border-border bg-muted/30">
                    <h4 className="mb-2">Technology Stack</h4>
                    <p className="text-sm text-muted-foreground">
                      Built with TensorFlow, Keras, and React. Optimized for 
                      real-time inference and batch processing.
                    </p>
                  </div>
                  
                  <div className="p-4 rounded-lg border border-border bg-muted/30">
                    <h4 className="mb-2">Version Info</h4>
                    <p className="text-sm text-muted-foreground">
                      Current version: 2.2<br />
                      Last updated: October 2025
                    </p>
                  </div>
                </div>

                
              </CardContent>
            </Card>
          </TabsContent>
        </Tabs>
      </div>
    </div>
  );
}
