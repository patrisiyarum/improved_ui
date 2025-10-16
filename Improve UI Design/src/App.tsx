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

const API_URL = "https://feedback-webapp-5zc2.onrender.com";

// Mock prediction function (fallback if API or model not connected)
function predictCommentMock(text: string) {
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
  if (lowerText.includes("sick") || lowerText.includes("smell")) {
    mainCategories[1].probability = 90;
    subCategories[4].probability = 85;
  } else if (lowerText.includes("flavor") || lowerText.includes("taste")) {
    mainCategories[0].probability = 88;
    subCategories[0].probability = 86;
  } else if (lowerText.includes("catered")) {
    mainCategories[2].probability = 92;
    subCategories[5].probability = 88;
  } else {
    mainCategories[3].probability = 80;
    subCategories[2].probability = 75;
  }

  mainCategories.sort((a, b) => b.probability - a.probability);
  subCategories.sort((a, b) => b.probability - a.probability);

  return { mainPredictions: mainCategories, subPredictions: subCategories };
}

// --- API Helpers ---
async function checkHealth() {
  try {
    const response = await fetch(`${API_URL}/health`);
    if (!response.ok) throw new Error("Health check failed");
    return await response.json();
  } catch {
    return { status: "offline", model_loaded: false };
  }
}

async function predictText(text: string) {
  const response = await fetch(`${API_URL}/predict`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ text }),
  });
  if (!response.ok) throw new Error("Prediction failed");
  return await response.json();
}

export default function App() {
  const [commentText, setCommentText] = useState("");
  const [predictions, setPredictions] = useState<any | null>(null);
  const [isAnalyzing, setIsAnalyzing] = useState(false);

  // Separate status checks
  const [apiConnected, setApiConnected] = useState<"checking" | "online" | "offline">("checking");
  const [modelConnected, setModelConnected] = useState<"checking" | "online" | "offline">("checking");

  const [useMockData, setUseMockData] = useState(true);

  useEffect(() => {
    checkApiHealth();
  }, []);

  const checkApiHealth = async () => {
    const health = await checkHealth();

    // API connected if reachable
    if (health.status === "healthy") setApiConnected("online");
    else setApiConnected("offline");

    // Model connected if model_loaded = true
    if (health.model_loaded === true) {
      setModelConnected("online");
      setUseMockData(false);
    } else {
      setModelConnected("offline");
      setUseMockData(true);
    }
  };

  const predictComment = async (text: string) => {
    if (useMockData) return predictCommentMock(text);

    try {
      return await predictText(text);
    } catch {
      console.warn("Prediction failed, falling back to mock");
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
    } catch {
      alert("Failed to analyze feedback.");
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
              <h1 className="text-foreground text-xl font-semibold">
                FCR Feedback Categorization
              </h1>
              <p className="text-muted-foreground">
                AI-powered classification of feedback into structured categories
              </p>
            </div>
          </div>

          {/* Badges */}
          <div className="flex flex-wrap gap-2 items-center">
            <Badge variant="outline">Fine-tuned BERT</Badge>
            <Badge variant="outline">Multi-category Output</Badge>
            <Badge variant="outline">Version 2.2</Badge>

            {/* --- API Status --- */}
            {apiConnected === "checking" && (
              <Badge variant="secondary" className="gap-1">
                <span className="animate-pulse">●</span> Checking API...
              </Badge>
            )}
            {apiConnected === "online" && (
              <Badge
                variant="default"
                className="bg-green-600 hover:bg-green-700 gap-1"
              >
                <span>●</span> API Connected
              </Badge>
            )}
            {apiConnected === "offline" && (
              <Badge variant="secondary" className="gap-1">
                <AlertCircle className="w-3 h-3" /> API Offline
              </Badge>
            )}

            {/* --- Model Status --- */}
            {modelConnected === "checking" && (
              <Badge variant="secondary" className="gap-1">
                <span className="animate-pulse">●</span> Checking Model...
              </Badge>
            )}
            {modelConnected === "online" && (
              <Badge
                variant="default"
                className="bg-green-600 hover:bg-green-700 gap-1"
              >
                <span>●</span> Model Loaded
              </Badge>
            )}
            {modelConnected === "offline" && (
              <Badge variant="secondary" className="gap-1">
                <AlertCircle className="w-3 h-3" /> Model Offline
              </Badge>
            )}
          </div>
        </div>

        {/* Alert when offline */}
        {(apiConnected === "offline" || modelConnected === "offline") && (
          <Alert className="mb-6">
            <AlertCircle className="h-4 w-4" />
            <AlertDescription>
              {apiConnected === "offline"
                ? "API is not reachable."
                : "Model not loaded on server."}{" "}
              Using demo predictions.{" "}
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

        {/* Tabs */}
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

          {/* Analyze Tab */}
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
                  placeholder="Example: 'The burger was cold and soggy.'"
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
                    <span className="animate-pulse">Analyzing...</span>
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
              <CardContent className="py-12 text-center text-muted-foreground">
                <BarChart3 className="w-16 h-16 mx-auto mb-4 opacity-50" />
                <p>Analytics will appear after bulk uploads are processed.</p>
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
                  This tool uses a fine-tuned <strong>BERT model</strong> to
                  classify feedback into <strong>main</strong> and{" "}
                  <strong>subcategories</strong>, helping operations teams
                  identify key trends quickly and accurately.
                </p>
              </CardContent>
            </Card>
          </TabsContent>
        </Tabs>
      </div>
    </div>
  );
}
