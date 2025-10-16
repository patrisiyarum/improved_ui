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

// --- Mock prediction (fallback) ---
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
    mainCategories[1].probability = 88;
    subCategories[4].probability = 82;
  } else if (lowerText.includes("flavor") || lowerText.includes("taste")) {
    mainCategories[0].probability = 86;
    subCategories[0].probability = 84;
  } else if (lowerText.includes("catered")) {
    mainCategories[2].probability = 90;
    subCategories[5].probability = 86;
  } else {
    mainCategories[3].probability = 78;
    subCategories[2].probability = 74;
  }

  mainCategories.sort((a, b) => b.probability - a.probability);
  subCategories.sort((a, b) => b.probability - a.probability);

  return { mainPredictions: mainCategories, subPredictions: subCategories };
}

// --- API helpers ---
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

// --- Main App ---
export default function App() {
  const [commentText, setCommentText] = useState("");
  const [predictions, setPredictions] = useState<any | null>(null);
  const [isAnalyzing, setIsAnalyzing] = useState(false);
  const [apiOnline, setApiOnline] = useState(false);
  const [modelLoaded, setModelLoaded] = useState(false);
  const [checking, setChecking] = useState(true);
  const [useMockData, setUseMockData] = useState(true);

  useEffect(() => {
    checkApiHealth();
  }, []);

  const checkApiHealth = async () => {
    setChecking(true);
    try {
      const health = await checkHealth();
      if (health.status === "healthy") {
        setApiOnline(true);
        setModelLoaded(!!health.model_loaded);
        setUseMockData(!health.model_loaded);
      } else {
        setApiOnline(false);
        setModelLoaded(false);
        setUseMockData(true);
      }
    } catch {
      setApiOnline(false);
      setModelLoaded(false);
      setUseMockData(true);
    } finally {
      setChecking(false);
    }
  };

  const predictComment = async (text: string) => {
    if (useMockData) return predictCommentMock(text);
    try {
      return await predictText(text);
    } catch {
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
              <h1 className="text-foreground text-2xl font-semibold">FCR Feedback Categorization</h1>
              <p className="text-muted-foreground">
                AI-powered classification of feedback into structured categories
              </p>
            </div>
          </div>

          <div className="flex flex-wrap gap-2 items-center">
            <Badge variant="outline">Fine-tuned BERT</Badge>
            <Badge variant="outline">Multi-category Output</Badge>
            <Badge variant="outline">Version 2.2</Badge>

            {checking ? (
              <Badge variant="secondary" className="gap-1">
                <span className="animate-pulse">●</span> Checking Connections...
              </Badge>
            ) : (
              <>
                <Badge
                  variant={apiOnline ? "default" : "secondary"}
                  className={`gap-1 ${apiOnline ? "bg-green-600 hover:bg-green-700" : ""}`}
                >
                  {apiOnline ? "● API Connected" : "API Offline"}
                </Badge>
                <Badge
                  variant={modelLoaded ? "default" : "secondary"}
                  className={`gap-1 ${modelLoaded ? "bg-green-600 hover:bg-green-700" : ""}`}
                >
                  {modelLoaded ? "● Model Loaded" : "Model Unavailable"}
                </Badge>
              </>
            )}
          </div>
        </div>

        {!apiOnline && (
          <Alert className="mb-6">
            <AlertCircle className="h-4 w-4" />
            <AlertDescription>
              Backend API is offline or model unavailable. Using demo mode.
              <Button variant="link" className="p-0 h-auto ml-1" onClick={checkApiHealth}>
                Retry connection
              </Button>
            </AlertDescription>
          </Alert>
        )}

        {/* Tabs */}
        <Tabs defaultValue="home" className="w-full">
          <TabsList className="grid w-full grid-cols-3 mb-6">
            <TabsTrigger value="home"><Sparkles className="w-4 h-4 mr-2" /> Analyze</TabsTrigger>
            <TabsTrigger value="analytics"><BarChart3 className="w-4 h-4 mr-2" /> Analytics</TabsTrigger>
            <TabsTrigger value="about"><Info className="w-4 h-4 mr-2" /> About</TabsTrigger>
          </TabsList>

          {/* Analyze Tab */}
          <TabsContent value="home">
            <SampleComments onSelectSample={handleSelectSample} />
            <Card>
              <CardHeader>
                <CardTitle>Analyze Feedback</CardTitle>
                <CardDescription>Enter a comment to classify it.</CardDescription>
              </CardHeader>
              <CardContent>
                <Textarea
                  placeholder="Example: 'The burger was cold and soggy.'"
                  value={commentText}
                  onChange={(e) => setCommentText(e.target.value)}
                  className="min-h-[120px] mb-4"
                />
                <Button onClick={handleAnalyze} disabled={isAnalyzing} className="w-full">
                  {isAnalyzing ? "Analyzing..." : "Analyze Feedback"}
                </Button>

                {predictions && (
                  <div className="mt-6">
                    <Alert className="mb-4">
                      <CheckCircle2 className="h-4 w-4" />
                      <AlertDescription>Prediction complete! Results displayed below.</AlertDescription>
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

                {/* --- What Does This Model Do --- */}
                <div className="mt-6 p-6 rounded-lg bg-primary/5 border-2 border-primary/20">
                  <h3 className="mb-3">What Does This Model Do? (In Simple Terms)</h3>
                  <p className="text-muted-foreground mb-4">
                    Imagine you have thousands of feedback comments. This AI model acts like a
                    super-fast reader that can:
                  </p>
                  <ul className="space-y-3 text-sm text-muted-foreground">
                    <li>📖 <strong>Read and Understand</strong> — Understands customer intent in each comment.</li>
                    <li>🏷️ <strong>Put Labels on Comments</strong> — Assigns structured categories.</li>
                    <li>⚡ <strong>Work Super Fast</strong> — Processes thousands in seconds.</li>
                    <li>🎯 <strong>Show Confidence Levels</strong> — Reports confidence for each prediction.</li>
                  </ul>
                  <div className="mt-4 p-3 rounded bg-muted/50 text-sm">
                    <strong>Think of it like this:</strong> It’s like automatic email sorting, 
                    but for customer feedback — faster, smarter, and fully contextual.
                  </div>
                </div>

                {/* --- How It Works --- */}
                <div className="mt-6 p-6 rounded-lg bg-primary/5 border-2 border-primary/20">
                  <h3 className="mb-3">How It Works</h3>
                  <p className="text-muted-foreground mb-4">
                    Here’s what happens behind the scenes for every comment or CSV entry:
                  </p>
                  <ul className="space-y-3 text-sm text-muted-foreground">
                    <li>🧩 <strong>1. Tokenization</strong> — Text is broken into tokens using a BERT tokenizer.</li>
                    <li>🧠 <strong>2. Embedding Generation</strong> — Tokens are transformed into numerical embeddings.</li>
                    <li>🏗️ <strong>3. Dual Classification Heads</strong> — Two parallel neural layers predict main and subcategories.</li>
                    <li>📊 <strong>4. Confidence Calculation</strong> — Probabilities are computed for each label.</li>
                  </ul>
                  <div className="mt-4 p-3 rounded bg-muted/50 text-sm">
                    <strong>In short:</strong> The model reads, understands, and classifies each comment 
                    just like a human — only much faster.
                  </div>
                </div>

                {/* --- Model Info Grid --- */}
                <div className="grid sm:grid-cols-2 gap-4 mt-6">
                  <div className="p-4 rounded-lg border border-border bg-muted/30">
                    <h4 className="mb-2">Model Architecture</h4>
                    <p className="text-sm text-muted-foreground">
                      Fine-tuned BERT with two classification heads for main and subcategory prediction.
                    </p>
                  </div>
                  <div className="p-4 rounded-lg border border-border bg-muted/30">
                    <h4 className="mb-2">Use Cases</h4>
                    <p className="text-sm text-muted-foreground">
                      Ideal for categorizing feedback, support tickets, and operational reports.
                    </p>
                  </div>
                  <div className="p-4 rounded-lg border border-border bg-muted/30">
                    <h4 className="mb-2">Technology Stack</h4>
                    <p className="text-sm text-muted-foreground">
                      Built with TensorFlow, Keras, and React. Optimized for real-time inference and batch processing.
                    </p>
                  </div>
                  <div className="p-4 rounded-lg border border-border bg-muted/30">
                    <h4 className="mb-2">Version Info</h4>
                    <p className="text-sm text-muted-foreground">
                      Current version: 2.2<br />Last updated: October 2025
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
