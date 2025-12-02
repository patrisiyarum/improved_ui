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
import { 
  BarChart, Bar, LineChart, Line, PieChart, Pie, Cell, 
  XAxis, YAxis, CartesianGrid, Tooltip, Legend, ResponsiveContainer 
} from "recharts";

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
  
  // 1. Operational Hotspots (Top 10 Airports)
  const airportData = useMemo(() => {
    if (!results.length) return [];
    const counts: { [key: string]: number } = {};
    results.forEach(row => {
      // Try to find the airport column (case insensitive)
      const apKey = Object.keys(row).find(k => k.includes("Dpt") || k.includes("Base") || k.includes("Station"));
      const ap = row[apKey || "Dpt A/P"] || "Unknown";
      counts[ap] = (counts[ap] || 0) + 1;
    });
    return Object.entries(counts)
      .map(([name, count]) => ({ name, count }))
      .sort((a, b) => b.count - a.count)
      .slice(0, 10);
  }, [results]);

  // 2. Trends Over Time (Daily Volume)
  const trendData = useMemo(() => {
    if (!results.length) return [];
    const counts: { [key: string]: number } = {};
    results.forEach(row => {
      // Try to find a date column
      const dateKey = Object.keys(row).find(k => k.includes("Date"));
      const dateVal = row[dateKey || "Flt Date"];
      const date = dateVal ? new Date(dateVal).toLocaleDateString() : "Unknown";
      
      if (date !== "Unknown" && date !== "Invalid Date") {
        counts[date] = (counts[date] || 0) + 1;
      }
    });
    return Object.entries(counts)
      .map(([date, count]) => ({ date, count }))
      .sort((a, b) => new Date(a.date).getTime() - new Date(b.date).getTime());
  }, [results]);

  // 3. Aircraft Fleet Breakdown
  const fleetData = useMemo(() => {
    if (!results.length) return [];
    const counts: { [key: string]: number } = {};
    results.forEach(row => {
      const acKey = Object.keys(row).find(k => k === "A/C" || k === "Aircraft");
      const ac = row[acKey || "A/C"] || "Unknown";
      counts[ac] = (counts[ac] || 0) + 1;
    });
    return Object.entries(counts)
      .map(([name, value]) => ({ name, value }))
      .sort((a, b) => b.value - a.value);
  }, [results]);

  // 4. Crew vs. Passenger Breakdown
  const sourceData = useMemo(() => {
    if (!results.length) return [];
    const counts: { [key: string]: number } = {};
    results.forEach(row => {
      const typeKey = Object.keys(row).find(k => k.includes("Meal Type"));
      const type = row[typeKey || "Meal Type"] || "Unknown";
      counts[type] = (counts[type] || 0) + 1;
    });
    return Object.entries(counts).map(([name, value]) => ({ name, value }));
  }, [results]);

  // 5. Model Confidence Health
  const confidenceData = useMemo(() => {
    if (!results.length) return [];
    const buckets = { "Low (<70%)": 0, "Medium (70-90%)": 0, "High (>90%)": 0 };
    
    results.forEach(row => {
      const confStr = row["Subcategory_Confidence"];
      if (confStr) {
        const val = parseFloat(confStr.replace("%", ""));
        if (val < 70) buckets["Low (<70%)"]++;
        else if (val < 90) buckets["Medium (70-90%)"]++;
        else buckets["High (>90%)"]++;
      }
    });
    return Object.entries(buckets).map(([name, count]) => ({ name, count }));
  }, [results]);

  if (!results.length) {
    return (
      <Card>
        <CardHeader>
          <CardTitle>Analytics Dashboard</CardTitle>
          <CardDescription>Upload a file to see comprehensive insights.</CardDescription>
        </CardHeader>
        <CardContent className="py-12 text-center text-muted-foreground">
          <BarChart3 className="w-16 h-16 mx-auto mb-4 opacity-50" />
          <p>No data to display.</p>
          <p className="text-sm mt-2">Upload a CSV/Excel file in the "Analyze" tab first.</p>
        </CardContent>
      </Card>
    );
  }

  const COLORS = ['#0088FE', '#00C49F', '#FFBB28', '#FF8042', '#8884d8', '#82ca9d'];
  const labelColor = "var(--muted-foreground)";
  const tooltipStyle = {
    backgroundColor: "var(--background)",
    color: "var(--foreground)",
    border: "1px solid var(--border)",
    borderRadius: "var(--radius)",
  };

  return (
    <div className="space-y-6">
      {/* Row 1: Operations & Trends */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        <Card>
          <CardHeader>
            <CardTitle>Top 10 Problem Airports</CardTitle>
            <CardDescription>Volume of reports by Departure Airport</CardDescription>
          </CardHeader>
          <CardContent>
            <ResponsiveContainer width="100%" height={300}>
              <BarChart data={airportData} layout="vertical" margin={{ left: 20 }}>
                <XAxis type="number" hide />
                <YAxis dataKey="name" type="category" width={50} tick={{ fill: labelColor }} />
                <Tooltip contentStyle={tooltipStyle} cursor={{fill: 'transparent'}} />
                <Bar dataKey="count" fill="#8884d8" radius={[0, 4, 4, 0]} name="Reports" />
              </BarChart>
            </ResponsiveContainer>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle>Issue Volume Over Time</CardTitle>
            <CardDescription>Daily trend based on Flight Date</CardDescription>
          </CardHeader>
          <CardContent>
            <ResponsiveContainer width="100%" height={300}>
              <LineChart data={trendData}>
                <CartesianGrid strokeDasharray="3 3" opacity={0.2} />
                <XAxis dataKey="date" tick={{ fill: labelColor }} fontSize={12} />
                <YAxis tick={{ fill: labelColor }} />
                <Tooltip contentStyle={tooltipStyle} />
                <Line type="monotone" dataKey="count" stroke="#82ca9d" strokeWidth={2} dot={false} />
              </LineChart>
            </ResponsiveContainer>
          </CardContent>
        </Card>
      </div>

      {/* Row 2: Fleet, Source, Confidence */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        <Card className="md:col-span-1">
          <CardHeader>
            <CardTitle>Fleet Breakdown</CardTitle>
            <CardDescription>Issues by Aircraft</CardDescription>
          </CardHeader>
          <CardContent>
            <ResponsiveContainer width="100%" height={250}>
              <PieChart>
                <Pie 
                  data={fleetData} 
                  cx="50%" cy="50%" 
                  innerRadius={60} 
                  outerRadius={80} 
                  paddingAngle={5} 
                  dataKey="value"
                >
                  {fleetData.map((entry, index) => (
                    <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
                  ))}
                </Pie>
                <Tooltip contentStyle={tooltipStyle} />
                <Legend />
              </PieChart>
            </ResponsiveContainer>
          </CardContent>
        </Card>

        <Card className="md:col-span-1">
          <CardHeader>
            <CardTitle>Report Source</CardTitle>
            <CardDescription>Crew vs. Passenger</CardDescription>
          </CardHeader>
          <CardContent>
            <ResponsiveContainer width="100%" height={250}>
              <PieChart>
                <Pie 
                  data={sourceData} 
                  cx="50%" cy="50%" 
                  outerRadius={80} 
                  dataKey="value" 
                  label
                >
                  {sourceData.map((entry, index) => (
                    <Cell key={`cell-${index}`} fill={index === 0 ? "#FF8042" : "#0088FE"} />
                  ))}
                </Pie>
                <Tooltip contentStyle={tooltipStyle} />
                <Legend />
              </PieChart>
            </ResponsiveContainer>
          </CardContent>
        </Card>

        <Card className="md:col-span-1">
          <CardHeader>
            <CardTitle>AI Confidence</CardTitle>
            <CardDescription>Certainty levels</CardDescription>
          </CardHeader>
          <CardContent>
            <ResponsiveContainer width="100%" height={250}>
              <BarChart data={confidenceData}>
                <XAxis dataKey="name" tick={{ fill: labelColor, fontSize: 10 }} />
                <Tooltip contentStyle={tooltipStyle} cursor={{fill: 'transparent'}} />
                <Bar dataKey="count" fill="#FFBB28" radius={[4, 4, 0, 0]} />
              </BarChart>
            </ResponsiveContainer>
          </CardContent>
        </Card>
      </div>
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
        // Correct check for new backend response
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

  const handleAnalyze = async () => {
    if (!commentText.trim()) {
      alert("Please enter a comment first.");
      return;
    }
    setIsAnalyzing(true);
    try {
      const result = await predictText(commentText);
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
                </div>

                <div className="grid sm:grid-cols-2 gap-4 mt-6">
                  <div className="p-4 rounded-lg border border-border bg-muted/30">
                    <h4 className="mb-2">Project Owner</h4>
                    <p className="text-sm text-muted-foreground">
                      Patrisiya Rumyantseva
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
