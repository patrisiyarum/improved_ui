import { useState } from "react";
import { Card, CardContent } from "./ui/card";
import { Button } from "./ui/button";
import { Progress } from "./ui/progress";
import { Alert, AlertDescription } from "./ui/alert";
import { Upload, Download, CheckCircle2 } from "lucide-react";

interface BulkUploadProps {
  onPredict: (text: string) => Promise<{ mainPredictions: any[]; subPredictions: any[] }>;
}

export function BulkUpload({ onPredict }: BulkUploadProps) {
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
      
      // Parse CSV and show preview
      const reader = new FileReader();
      reader.onload = (event) => {
        const text = event.target?.result as string;
        const lines = text.split('\n').filter(line => line.trim());
        const headers = lines[0].split(',');
        const preview = lines.slice(1, 6).map(line => {
          const values = line.split(',');
          const obj: any = {};
          headers.forEach((header, i) => {
            obj[header.trim()] = values[i]?.trim() || '';
          });
          return obj;
        });
        setPreviewData(preview);
      };
      reader.readAsText(uploadedFile);
    }
  };

  const handleProcess = async () => {
    if (!file || !previewData) return;

    setProcessing(true);
    setProgress(0);

    const reader = new FileReader();
    reader.onload = async (event) => {
      const text = event.target?.result as string;
      const lines = text.split('\n').filter(line => line.trim());
      const headers = lines[0].split(',');
      
      // Find text column
      // 🧩 Find the correct text column
      const cleanedHeaders = headers.map(h => h.trim().replace(/^"|"$/g, '').toLowerCase());
      const textColIndex = cleanedHeaders.findIndex(h =>
        ["text", "comment", "comments", "feedback", "review"].some(keyword => h.includes(keyword))
      );
      
      if (textColIndex === -1) {
        console.warn("CSV headers detected:", headers);
        alert("Could not find a valid text column. Make sure one column is named 'text', 'comment', or 'feedback'.");
        setProcessing(false);
        return;
      }

console.log("✅ Using text column:", headers[textColIndex]);


      const processedResults = [];
      const dataLines = lines.slice(1);

      for (let i = 0; i < dataLines.length; i++) {
        const values = dataLines[i].split(',');
        const commentText = values[textColIndex]?.trim() || '';
        
        const { mainPredictions, subPredictions } = await onPredict(commentText);
        
        const row: any = {};
        headers.forEach((header, idx) => {
          row[header.trim()] = values[idx]?.trim() || '';
        });
        row['Predicted_Main_Category'] = mainPredictions[0]?.label || 'Unknown';
        row['Main_Category_Confidence'] = mainPredictions[0]?.probability 
          ? `${mainPredictions[0].probability.toFixed(2)}%` 
          : '0%';
        row['Predicted_Subcategory'] = subPredictions[0]?.label || 'Unknown';
        row['Subcategory_Confidence'] = subPredictions[0]?.probability 
          ? `${subPredictions[0].probability.toFixed(2)}%` 
          : '0%';
        
        processedResults.push(row);
        setProgress(((i + 1) / dataLines.length) * 100);
        
        // Small delay to show progress
        await new Promise(resolve => setTimeout(resolve, 10));
      }

      setResults(processedResults);
      setProcessing(false);
    };
    
    reader.readAsText(file);
  };

  const handleDownload = () => {
    if (!results) return;

    const headers = Object.keys(results[0]);
    const csv = [
      headers.join(','),
      ...results.map(row => headers.map(h => row[h]).join(','))
    ].join('\n');

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
          {file && (
            <p className="mt-3 text-sm text-muted-foreground">
              Selected: {file.name}
            </p>
          )}
        </div>

        {previewData && (
          <div className="mb-6">
            <Alert>
              <CheckCircle2 className="h-4 w-4" />
              <AlertDescription>
                File uploaded successfully! Preview of first 5 rows shown below.
              </AlertDescription>
            </Alert>
            
            <div className="mt-4 overflow-x-auto border rounded-lg">
              <table className="w-full text-sm">
                <thead className="bg-muted">
                  <tr>
                    {Object.keys(previewData[0]).map((header, idx) => (
                      <th key={idx} className="px-4 py-2 text-left">
                        {header}
                      </th>
                    ))}
                  </tr>
                </thead>
                <tbody>
                  {previewData.map((row, idx) => (
                    <tr key={idx} className="border-t border-border">
                      {Object.values(row).map((value: any, cellIdx) => (
                        <td key={cellIdx} className="px-4 py-2">
                          {value}
                        </td>
                      ))}
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>

            <Button 
              onClick={handleProcess}
              disabled={processing}
              className="mt-4 w-full"
            >
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
              <AlertDescription>
                Processing complete! {results.length} rows categorized.
              </AlertDescription>
            </Alert>
            
            <div className="overflow-x-auto border rounded-lg mb-4">
              <table className="w-full text-sm">
                <thead className="bg-muted">
                  <tr>
                    {Object.keys(results[0]).map((header, idx) => (
                      <th key={idx} className="px-4 py-2 text-left">
                        {header}
                      </th>
                    ))}
                  </tr>
                </thead>
                <tbody>
                  {results.slice(0, 5).map((row, idx) => (
                    <tr key={idx} className="border-t border-border">
                      {Object.values(row).map((value: any, cellIdx) => (
                        <td key={cellIdx} className="px-4 py-2">
                          {value}
                        </td>
                      ))}
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>

            <Button 
              onClick={handleDownload}
              className="w-full"
              variant="default"
            >
              <Download className="mr-2 h-4 w-4" />
              Download Updated CSV
            </Button>
          </div>
        )}
      </CardContent>
    </Card>
  );
}
