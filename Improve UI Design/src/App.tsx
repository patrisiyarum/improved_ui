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
  Predicted_Subcategory: string;
  [key: string]: any;
}

// --- AnalyticsDashboard Component ---
function AnalyticsDashboard({ results }: { results: BulkResultRow[] }) {
  // Removed Main Category calculation

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
                    {/* UPDATED: Pass only subPredictions */}
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

          <TabsContent value="about">
             {/* ... Content can remain same or be updated for new model ... */}
             <Card>
              <CardHeader>
                <CardTitle>About This Tool (v3.0)</CardTitle>
                <CardDescription>
                  <strong>Patrisiya Rumyantseva</strong> - Subcategory Classification Model
                </CardDescription>
              </CardHeader>
              <CardContent className="space-y-4">
                <p>
                  This tool uses a <strong>fine-tuned BERT model</strong> augmented with keyword features to classify Delta feedback into 8 specific subcategories.
                </p>
              </CardContent>
            </Card>
          </TabsContent>
        </Tabs>
      </div>
    </div>
  );
}
