import { useState } from "react";
import { Card, CardContent } from "./ui/card";
import { Button } from "./ui/button";
import { Progress } from "./ui/progress";
import { Alert, AlertDescription } from "./ui/alert";
import { Upload, Download, CheckCircle2 } from "lucide-react";
import Papa from "papaparse";

interface BulkUploadProps {
  // Updated return type to match new API response
  onPredict: (text: string) => Promise<{ subPredictions: any[] }>;
  onUploadComplete: (results: any[]) => void;
}

export function BulkUpload({ onPredict, onUploadComplete }: BulkUploadProps) {
  const [file, setFile] = useState<File | null>(null);
  const [processing, setProcessing] = useState(false);
  const [progress, setProgress] = useState(0);
  const [results, setResults] = useState<any[] | null>(null);
  const [previewData, setPreviewData] = useState<any[] | null>(null);

  const handleFileUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const uploadedFile = e.target.files?.[0];
    if (uploadedFile) {
      setFile(uploadedFile);
      setResults(null);
      setProgress(0);
      
      Papa.parse(uploadedFile, {
        header: true,
        preview: 5,
        skipEmptyLines: true,
        complete: (results) => {
          setPreviewData(results.data as any[]);
        },
        error: (error) => {
          console.error("Error parsing CSV:", error);
          alert("Failed to read CSV file");
        }
      });
    }
  };

  const handleProcess = async () => {
    if (!file) return;

    setProcessing(true);
    setProgress(0);

    Papa.parse(file, {
      header: true,
      skipEmptyLines: true,
      complete: async (results) => {
        const data = results.data as any[];
        const headers = results.meta.fields || (data.length > 0 ? Object.keys(data[0]) : []);
        
        const textCol = headers.find(h => 
          ["text", "comment", "comments", "feedback", "review", "pilot's questions/answers"]
            .some(keyword => h.toLowerCase().includes(keyword))
        );
        
        if (!textCol) {
          alert("Could not find a valid text column.");
          setProcessing(false);
          return;
        }

        const processedResults = [];

        for (let i = 0; i < data.length; i++) {
          const row = data[i];
          const commentText = row[textCol]?.trim() || '';
          
          if (!commentText) continue;

          try {
            // Updated destructuring: ONLY subPredictions
            const { subPredictions } = await onPredict(commentText);
            
            const newRow = {
              ...row,
              'Predicted_Subcategory': subPredictions[0]?.label || 'Unknown',
              'Subcategory_Confidence': subPredictions[0]?.probability 
                ? `${subPredictions[0].probability.toFixed(2)}%` 
                : '0%'
            };
            
            processedResults.push(newRow);
          } catch (err) {
            console.error(`Error processing row ${i}:`, err);
            processedResults.push({
              ...row,
              'Predicted_Subcategory': 'Error',
              'Subcategory_Confidence': '0%'
            });
          }

          setProgress(((i + 1) / data.length) * 100);
          if (i % 5 === 0) await new Promise(resolve => setTimeout(resolve, 10));
        }

        setResults(processedResults);
        onUploadComplete(processedResults);
        setProcessing(false);
      },
      error: (err) => {
        console.error("Full parse error:", err);
        alert("Error processing file");
        setProcessing(false);
      }
    });
  };

  const handleDownload = () => {
    if (!results || results.length === 0) return;
    const csv = Papa.unparse(results);
    const blob = new Blob([csv], { type: 'text/csv' });
    const url = window.URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = 'categorized_feedback.csv';
    a.click();
    window.URL.revokeObjectURL(url);
  };

  return (
    <Card>
      <CardContent className="pt-6">
        <h3 className="mb-4">Bulk CSV Prediction</h3>
        
        <div className="border-2 border-dashed border-border rounded-lg p-8 text-center mb-4">
          <Upload className="mx-auto mb-4 w-12 h-12 text-muted-foreground" />
          <p className="text-muted-foreground mb-4">
            Upload a CSV file with feedback comments
          </p>
          <input
            type="file"
            accept=".csv"
            onChange={handleFileUpload}
            className="hidden"
            id="csv-upload"
          />
          <label htmlFor="csv-upload">
            <Button variant="outline" asChild>
              <span>Choose File</span>
            </Button>
          </label>
          {file && <p className="mt-3 text-sm text-muted-foreground">Selected: {file.name}</p>}
        </div>

        {previewData && (
          <div className="mb-6">
            <Alert>
              <CheckCircle2 className="h-4 w-4" />
              <AlertDescription>File ready. Preview of first 5 rows shown below.</AlertDescription>
            </Alert>
            <div className="mt-4 overflow-x-auto border rounded-lg">
              <table className="w-full text-sm">
                <thead className="bg-muted">
                  <tr>
                    {Object.keys(previewData[0]).map((header, idx) => (
                      <th key={idx} className="px-4 py-2 text-left whitespace-nowrap">{header}</th>
                    ))}
                  </tr>
                </thead>
                <tbody>
                  {previewData.map((row, idx) => (
                    <tr key={idx} className="border-t border-border">
                      {Object.values(row).map((value: any, cellIdx) => (
                        <td key={cellIdx} className="px-4 py-2 whitespace-nowrap">
                          {String(value).length > 50 ? String(value).substring(0, 50) + '...' : value}
                        </td>
                      ))}
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
            <Button onClick={handleProcess} disabled={processing} className="mt-4 w-full">
              {processing ? 'Processing...' : 'Start Prediction'}
            </Button>
          </div>
        )}

        {processing && (
          <div className="mb-6">
            <div className="flex items-center justify-between mb-2">
              <span className="text-sm text-muted-foreground">Processing...</span>
              <span className="text-sm">{Math.round(progress)}%</span>
            </div>
            <Progress value={progress} />
          </div>
        )}

        {results && (
          <div>
            <Alert className="mb-4">
              <CheckCircle2 className="h-4 w-4" />
              <AlertDescription>Processing complete! {results.length} rows categorized.</AlertDescription>
            </Alert>
            <Button onClick={handleDownload} className="w-full" variant="default">
              <Download className="mr-2 h-4 w-4" /> Download Updated CSV
            </Button>
          </div>
        )}
      </CardContent>
    </Card>
  );
}
