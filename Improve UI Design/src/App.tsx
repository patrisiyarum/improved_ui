import { useState, useEffect, useMemo } from "react";
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
import { BarChart, Bar, XAxis, YAxis, Tooltip, Legend, ResponsiveContainer } from "recharts";

const API_URL = "https://feedback-webapp-5zc2.onrender.com";

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

// --- Define types for results ---
interface BulkResultRow {
  Predicted_Main_Category: string;
  Predicted_Subcategory: string;
  [key: string]: any;
}

interface ChartData {
  name: string;
  count: number;
}

// --- AnalyticsDashboard Component ---
function AnalyticsDashboard({ results }: { results: BulkResultRow[] }) {
  const mainCategoryData = useMemo(() => {
    if (!results.length) return [];
    const counts: { [key: string]: number } = {};
    results.forEach(row => {
      const category = row.Predicted_Main_Category || "Unknown";
      counts[category] = (counts[category] || 0) + 1;
    });
    return Object.entries(counts).map(([name, count]) => ({ name, count })).sort((a, b) => b.count - a.count);
  }, [results]);

  const subCategoryData = useMemo(() => {
    if (!results.length) return [];
    const counts: { [key: string]: number } = {};
    results.forEach(row => {
      const category = row.Predicted_Subcategory || "Unknown";
      counts[category] = (counts[category] || 0) + 1;
    });
    return Object.entries(counts).map(([name, count]) => ({ name, count })).sort((a, b) => b.count - a.count);
  }, [results]);

  if (!results.length) {
    return (
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
            <p>No data to display.</p>
            <p className="text-sm mt-2">
              Upload a CSV file on the "Analyze" tab to see your charts.
            </p>
          </div>
        </CardContent>
      </Card>
    );
  }

  // Define styles for dark mode
  const labelColor = "var(--muted-foreground)"; // Use a readable color from your CSS
  const tooltipStyle = {
    backgroundColor: "var(--background)", // Use app's background
    color: "var(--foreground)",         // Use app's text color
    border: "1px solid var(--border)",   // Use app's border
    borderRadius: "var(--radius)",     // Use app's border radius
  };

  return (
    <div className="space-y-6">
      <Card>
        <CardHeader>
          <CardTitle>Main Category Distribution</CardTitle>
          <CardDescription>Based on {results.length} processed rows.</CardDescription>
        </CardHeader>
        <CardContent>
          <ResponsiveContainer width="100%" height={300}>
            <BarChart data={mainCategoryData} margin={{ top: 5, right: 20, left: 10, bottom: 5 }}>
              <XAxis 
                dataKey="name" 
                fontSize={12} 
                interval={0} 
                angle={-30} 
                textAnchor="end" 
                height={80} 
                tick={{ fill: labelColor }} // Make X-axis text readable
              />
              <YAxis 
                allowDecimals={false} 
                tick={{ fill: labelColor }} // Make Y-axis text readable
              />
              <Tooltip 
                contentStyle={tooltipStyle} // Style the tooltip
                cursor={{ fill: "rgba(255, 255, 255, 0.1)" }} // Add a subtle hover effect
              />
              <Legend wrapperStyle={{ color: labelColor }} /> {/* Make legend text readable */}
              <Bar 
                dataKey="count" 
                fill="#8884d8" // Use a static color that works on dark bg
                name="Count" 
              />
            </BarChart>
          </ResponsiveContainer>
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle>Subcategory Distribution</CardTitle>
          <CardDescription>Based on {results.length} processed rows.</CardDescription>
        </CardHeader>
        <CardContent>
          <ResponsiveContainer width="100%" height={300}>
            <BarChart data={subCategoryData} margin={{ top: 5, right: 20, left: 10, bottom: 5 }}>
              <XAxis 
                dataKey="name" 
                fontSize={12} 
                interval={0} 
                angle={-30} 
                textAnchor="end" 
                height={80} 
                tick={{ fill: labelColor }} // Make X-axis text readable
              />
              <YAxis 
                allowDecimals={false} 
                tick={{ fill: labelColor }} // Make Y-axis text readable
              />
              <Tooltip 
                contentStyle={tooltipStyle} // Style the tooltip
                cursor={{ fill: "rgba(255, 255, 255, 0.1)" }} // Add a subtle hover effect
              />
              <Legend wrapperStyle={{ color: labelColor }} /> {/* Make legend text readable */}
              <Bar 
                dataKey="count" 
                fill="#82ca9d" // Use a different static color
                name="Count" 
              />
            </BarChart>
          </ResponsiveContainer>
        </CardContent>
      </Card>
    </div>
  );
}


// --- Main App ---
export default function App() {
  const [commentText, setCommentText] = useState("");
  const [predictions, setPredictions] = useState<any | null>(null);
  const [isAnalyzing, setIsAnalyzing] = useState(false);
  const [apiOnline, setApiOnline] = useState(false);
  const [modelLoaded, setModelLoaded] = useState(false);
  const [checking, setChecking] = useState(true);
  const [bulkResults, setBulkResults] = useState<BulkResultRow[]>([]); // New state for analytics

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
      } else {
        setApiOnline(false);
        setModelLoaded(false);
      }
    } catch {
      setApiOnline(false);
      setModelLoaded(false);
    } finally {
      setChecking(false);
    }
  };

  const predictComment = async (text: string) => {
    return await predictText(text);
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
  
  // New callback function to receive results from BulkUpload
  const handleBulkUploadComplete = (results: any[]) => {
    setBulkResults(results as BulkResultRow[]);
    alert("Bulk upload complete! Check the 'Analytics' tab for charts.");
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
                An AI-powered solution for strategic feedback analysis.
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

        {!modelLoaded && (
          <Alert className="mb-6">
            <AlertCircle className="h-4 w-4" />
            <AlertDescription>
              Backend API is offline or the model is unavailable. Analysis is currently disabled.
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
                <Button onClick={handleAnalyze} disabled={isAnalyzing || !modelLoaded} className="w-full">
                  {isAnalyzing ? "Analyzing..." : modelLoaded ? "Analyze Feedback" : "Model Unavailable"}
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
            <BulkUpload 
              onPredict={predictComment} 
              onUploadComplete={handleBulkUploadComplete} 
            />
          </TabsContent>

          {/* Analytics Tab */}
          <TabsContent value="analytics">
            <AnalyticsDashboard results={bulkResults} />
          </TabsContent>

          {/* About Tab */}
          <TabsContent value="about">
            <Card>
              <CardHeader>
                <CardTitle>About This Tool</CardTitle>
                <CardDescription>
                  A project by <strong>Patrisiya Rumyantseva</strong> to automate and scale operational feedback analysis.
                </CardDescription>
              </CardHeader>
              <CardContent className="space-y-4">
                <p>
                  This tool was developed to address a significant operational challenge: the manual processing of thousands of comments from Delta crew members regarding <strong>critical issues with their on-board meals</strong>. Previously, this qualitative data was reviewed and categorized by team members, a labor-intensive process that limited the speed of analysis and response.
                </p>

                {/* --- What Does This Model Do --- */}
                <div className="mt-6 p-6 rounded-lg bg-primary/5 border-2 border-primary/20">
                  <h3 className="mb-3">Purpose & Functionality</h3>
                  <p className="text-muted-foreground mb-4">
                    The model automates the manual review process. It analyzes the context of each crew meal comment and classifies it into a relevant <strong>Main Category</strong> (e.g., "Food Quality", "Catering Error") and <strong>Subcategory</strong> (e.g., "Taste Issues", "Incorrect Meal").
                  </p>
                  <ul className="space-y-3 text-sm text-muted-foreground">
                    <li>📖 <strong>Contextual Analysis</strong> — Understands industry-specific language and nuance.</li>
                    <li>🏷️ <strong>Structured Classification</strong> — Assigns a main and sub-category to each piece of feedback.</li>
                    <li>⚡ <strong>High-Volume Processing</strong> — Classifies thousands of comments from a CSV file in seconds.</li>
                    <li>📈 <strong>Confidence Scoring</strong> — Provides a probability score for each classification to aid in analysis.</li>
                  </ul>
                  <div className="mt-4 p-3 rounded bg-muted/50 text-sm">
                    <strong>The strategic value:</strong> To convert unstructured, critical feedback into structured, actionable data at scale, significantly reducing manual effort and accelerating insight generation.
                  </div>
                </div>

                {/* --- How It Works --- */}
                <div className="mt-6 p-6 rounded-lg bg-primary/5 border-2 border-primary/20">
                  <h3 className="mb-3">Model Development & Training</h3>
                  <p className="text-muted-foreground mb-4">
                    The model's accuracy is derived from being fine-tuned on a historical dataset of comments that had already been expertly classified by the Delta team.
                  </p>
                  <ul className="space-y-3 text-sm text-muted-foreground">
                    <li>🧩 <strong>1. Historical Data Utilization</strong> — Leveraged the existing dataset of manually categorized comments as the source of truth.</li>
                    <li>🧠 <strong>2. Fine-Tuned BERT Model</strong> — A state-of-the-art language model (BERT) was specifically trained to recognize the unique patterns and terminology present in crew meal feedback.</li>
                    <li>🏗️ <strong>3. Dual-Output Architecture</strong> — The model was designed with two parallel classification heads to predict both the main and sub-category simultaneously, ensuring contextual relevance.</li>
                    <li>📊 <strong>4. Performance Validation</strong> — The model's predictions were rigorously tested against human classifications to ensure a high degree of accuracy and reliability.</li>
                  </ul>
                  <div className="mt-4 p-3 rounded bg-muted/50 text-sm">
                    <strong>In essence:</strong> The model has learned from human expertise and now replicates that classification capability with vastly superior speed and scalability.
                  </div>
                </div>

                {/* --- Model Info Grid --- */}
                <div className="grid sm:grid-cols-2 gap-4 mt-6">
                  <div className="p-4 rounded-lg border border-border bg-muted/30">
                    <h4 className="mb-2">Project Owner</h4>
                    <p className="text-sm text-muted-foreground">
                      Patrisiya Rumyantseva
                    </p>
                  </div>
                  <div className="p-4 rounded-lg border border-border bg-muted/30">
                    <h4 className="mb-2">Business Application</h4>
                    <p className="text-sm text-muted-foreground">
                      Automated classification of critical feedback on Delta on-board crew meals for trend analysis and operational improvement.
                    </p>
                  </div>
                  <div className="p-4 rounded-lg border border-border bg-muted/30">
                    <h4 className="mb-2">Technology Stack</h4>
                    <p className="text-sm text-muted-foreground">
                      TensorFlow/Keras (Model), BERT (Base Architecture), React (UI), FastAPI (API).
                    </p>
                  </div>
                  <div className="p-4 rounded-lg border border-border bg-muted/30">
                    <h4 className="mb-2">Version Information</h4>
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
