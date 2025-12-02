import { useState, useEffect, useMemo } from "react";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "./components/ui/tabs";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "./components/ui/card";
import { Button } from "./components/ui/button";
import { Textarea } from "./components/ui/textarea";
import { Badge } from "./components/ui/badge";
import { Alert, AlertDescription } from "./components/ui/alert";
import {
  Brain,
  BarChart3,
  Info,
  Sparkles,
  CheckCircle2,
  AlertCircle,
  Tag,
  Zap,
  Percent,
} from "lucide-react";
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
    return { status: "offline", sub_classes_count: 0 };
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
  Predicted_Subcategory: string;
  [key: string]: any;
}

// --- AnalyticsDashboard Component ---
function AnalyticsDashboard({ results }: { results: BulkResultRow[] }) {
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

  const labelColor = "var(--muted-foreground)";
  const tooltipStyle = {
    backgroundColor: "var(--background)",
    color: "var(--foreground)",
    border: "1px solid var(--border)",
    borderRadius: "var(--radius)",
  };

  return (
    <div className="space-y-6">
      <Card>
        <CardHeader>
          <CardTitle>Subcategory Distribution</CardTitle>
          <CardDescription>Based on {results.length} processed rows.</CardDescription>
        </CardHeader>
        <CardContent>
          <ResponsiveContainer width="100%" height={400}>
            <BarChart data={subCategoryData} margin={{ top: 5, right: 20, left: 10, bottom: 80 }}>
              <XAxis
                dataKey="name"
                fontSize={12}
                interval={0}
                angle={-45}
                textAnchor="end"
                height={100}
                tick={{ fill: labelColor }}
              />
              <YAxis
                allowDecimals={false}
                tick={{ fill: labelColor }}
              />
              <Tooltip
                contentStyle={tooltipStyle}
                cursor={{ fill: "rgba(255, 255, 255, 0.1)" }}
              />
              <Legend wrapperStyle={{ color: labelColor }} />
              <Bar
                dataKey="count"
                fill="#82ca9d"
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
  const [bulkResults, setBulkResults] = useState<BulkResultRow[]>([]);

  useEffect(() => {
    checkApiHealth();
  }, []);

  const checkApiHealth = async () => {
    setChecking(true);
    try {
      const health = await checkHealth();
      if (health.status === "healthy") {
        setApiOnline(true);
        // --- FIX IS HERE: Check for sub_classes_count instead of model_loaded ---
        const isLoaded = (health.sub_classes_count && health.sub_classes_count > 0) || false;
        setModelLoaded(isLoaded);
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
            <Badge variant="outline">Augmented BERT</Badge>
            <Badge variant="outline">Subcategory Classification</Badge>
            <Badge variant="outline">Version 3.0</Badge>

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
            <Card>
              <CardHeader>
                <SampleComments onSelectSample={handleSelectSample} /> 
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
                  This tool was developed to address a significant operational challenge: the manual processing of thousands of comments from Delta crew members regarding <strong>critical issues with their on-board meals</strong>.
                </p>
                <p>
                  Previously, this qualitative data was reviewed and categorized by team members, a labor-intensive process that limited the speed of analysis and response.
                </p>

                {/* --- What Does This Model Do --- */}
                <div className="mt-6 p-6 rounded-lg bg-primary/5 border-2 border-primary/20">
                  <h3 className="mb-3">Purpose & Functionality</h3>
                  <p className="text-muted-foreground mb-6">
                    The model automates the manual review process by analyzing each comment and classifying it into a precise <strong>Subcategory</strong> for immediate action.
                  </p>
                  
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <div className="flex items-start gap-3 p-3 rounded-lg bg-muted/30">
                      <Brain className="w-5 h-5 mt-1 text-primary flex-shrink-0" />
                      <div>
                        <h4 className="font-medium">Hybrid Intelligence</h4>
                        <p className="text-sm text-muted-foreground">Combines BERT deep learning with keyword feature extraction.</p>
                      </div>
                    </div>
                    <div className="flex items-start gap-3 p-3 rounded-lg bg-muted/30">
                      <Tag className="w-5 h-5 mt-1 text-primary flex-shrink-0" />
                      <div>
                        <h4 className="font-medium">Structured Classification</h4>
                        <p className="text-sm text-muted-foreground">Sorts feedback into 8 specific operational subcategories.</p>
                      </div>
                    </div>
                    <div className="flex items-start gap-3 p-3 rounded-lg bg-muted/30">
                      <Zap className="w-5 h-5 mt-1 text-primary flex-shrink-0" />
                      <div>
                        <h4 className="font-medium">High-Volume Processing</h4>
                        <p className="text-sm text-muted-foreground">Analyzes thousands of comments from a CSV file in seconds.</p>
                      </div>
                    </div>
                    <div className="flex items-start gap-3 p-3 rounded-lg bg-muted/30">
                      <Percent className="w-5 h-5 mt-1 text-primary flex-shrink-0" />
                      <div>
                        <h4 className="font-medium">Confidence Scoring</h4>
                        <p className="text-sm text-muted-foreground">Provides a probability score to highlight ambiguous feedback.</p>
                      </div>
                    </div>
                  </div>

                  <div className="mt-6 p-3 rounded bg-muted/50 text-sm">
                    <strong>The goal:</strong> Convert unstructured feedback into actionable data at scale, reducing manual effort and accelerating insights.
                  </div>
                </div>

                {/* --- How It Works --- */}
                <div className="mt-6 p-6 rounded-lg bg-primary/5 border-2 border-primary/20">
                  <h3 className="mb-3">Model Development & Training</h3>
                  <p className="text-muted-foreground mb-6">
                    The model's accuracy is derived from being fine-tuned on a historical dataset of comments that had already been expertly classified by the Delta team.
                  </p>

                  <div className="space-y-4">
                    <div className="flex items-start gap-4">
                      <div className="flex-shrink-0 w-8 h-8 rounded-full bg-primary text-primary-foreground flex items-center justify-center font-bold text-sm">1</div>
                      <div>
                        <h4 className="font-medium">Augmented Training Data</h4>
                        <p className="text-sm text-muted-foreground">Trained on expert-classified comments enriched with synonym augmentation.</p>
                      </div>
                    </div>
                    <div className="flex items-start gap-4">
                      <div className="flex-shrink-0 w-8 h-8 rounded-full bg-primary text-primary-foreground flex items-center justify-center font-bold text-sm">2</div>
                      <div>
                        <h4 className="font-medium">BERT + Feature Fusion</h4>
                        <p className="text-sm text-muted-foreground">Uses BERT for context and explicit keyword features for precision.</p>
                      </div>
                    </div>
                    <div className="flex items-start gap-4">
                      <div className="flex-shrink-0 w-8 h-8 rounded-full bg-primary text-primary-foreground flex items-center justify-center font-bold text-sm">3</div>
                      <div>
                        <h4 className="font-medium">Subcategory Focus</h4>
                        <p className="text-sm text-muted-foreground">Optimized to distinguish between specific issues like "Taste" vs "Presentation".</p>
                      </div>
                    </div>
                    <div className="flex items-start gap-4">
                      <div className="flex-shrink-0 w-8 h-8 rounded-full bg-primary text-primary-foreground flex items-center justify-center font-bold text-sm">4</div>
                      <div>
                        <h4 className="font-medium">Performance Validation</h4>
                        <p className="text-sm text-muted-foreground">Rigorously tested using Top-2 and Top-3 accuracy metrics.</p>
                      </div>
                    </div>
                  </div>

                  <div className="mt-6 p-3 rounded bg-muted/50 text-sm">
                    <strong>In short:</strong> The model learned from human expertise to replicate the same classification process, but with much greater speed and scale.
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
                      Current version: 3.0<br />Last updated: November 2025
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
