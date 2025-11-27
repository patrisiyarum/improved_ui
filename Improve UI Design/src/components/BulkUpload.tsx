import { useState } from "react";
import { Card, CardContent } from "./ui/card";
import { Button } from "./ui/button";
import { Progress } from "./ui/progress";
import { Alert, AlertDescription } from "./ui/alert";
import { Upload, Download, CheckCircle2, AlertTriangle } from "lucide-react";
import Papa from "papaparse";

interface BulkUploadProps {
  onPredict: (text: string) => Promise<{ subPredictions: any[] }>;
  onUploadComplete: (results: any[]) => void;
}

export function BulkUpload({ onPredict, onUploadComplete }: BulkUploadProps) {
  const [file, setFile] = useState<File | null>(null);
  const [processing, setProcessing] = useState(false);
  const [progress, setProgress] = useState(0);
  const [results, setResults] = useState<any[] | null>(null);
  const [previewData, setPreviewData] = useState<any[] | null>(null);
  const [columns, setColumns] = useState<string[]>([]);
  const [stitchCount, setStitchCount] = useState(0);

  const handleFileUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const uploadedFile = e.target.files?.[0];
    if (uploadedFile) {
      setFile(uploadedFile);
      setResults(null);
      setProgress(0);
      setStitchCount(0);
      
      Papa.parse(uploadedFile, {
        header: true,
        preview: 5,
        skipEmptyLines: "greedy",
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
    setStitchCount(0);

    Papa.parse(file, {
      header: true,
      skipEmptyLines: "greedy",
      complete: async (results) => {
        let rawData = results.data as any[];
        const originalHeaders = results.meta.fields || (rawData.length > 0 ? Object.keys(rawData[0]) : []);
        
        // 1. Identify Text Column
        const textCol = originalHeaders.find(h => {
          const headerLower = h.toLowerCase().trim();
          return [
            "text", "comment", "comments", "feedback", "review", 
            "pilot's questions/answers", "pilots questions/answers", 
            "questions/answers"
          ].some(keyword => headerLower.includes(keyword));
        });
        
        if (!textCol) {
          alert("Could not find a valid text column (e.g., 'Comments' or 'Pilot's Questions/Answers').");
          setProcessing(false);
          return;
        }

        // 2. Smart Stitching Logic (Fixes broken rows)
        const cleanData: any[] = [];
        let lastValidRow: any = null;
        let stitched = 0;

        // Heuristic: A valid row usually has data in the first 2 columns.
        // If columns 2, 3, 4 are undefined/empty, it's likely a text fragment.
        const keyCol1 = originalHeaders[0]; // e.g. RPT#
        const keyCol2 = originalHeaders[1]; // e.g. Date

        for (const row of rawData) {
          // Check if this row looks like a valid new record
          // It's valid if it has a value in the first column that isn't super long text
          const firstVal = row[keyCol1];
          const looksLikeKey = firstVal && String(firstVal).length < 50; 
          const hasSecondCol = row[keyCol2] !== undefined && row[keyCol2] !== "";

          if (looksLikeKey || hasSecondCol) {
            // It's a new valid row
            cleanData.push(row);
            lastValidRow = row;
          } else if (lastValidRow) {
            // It's a fragment! Stitch it to the previous row's text column.
            // PapaParse usually puts the fragment text in the first column if formatting is broken.
            const fragment = Object.values(row).filter(v => v).join(" ");
            if (fragment) {
              lastValidRow[textCol] += "\n" + fragment;
              stitched++;
            }
          }
        }
        
        setStitchCount(stitched);
        console.log(`Stitched ${stitched} broken rows.`);

        // 3. Save Headers for Export
        const finalHeaders = [...originalHeaders, "Predicted_Subcategory", "Subcategory_Confidence"];
        setColumns(finalHeaders);

        // 4. Process Data
        const processedResults = [];
        for (let i = 0; i < cleanData.length; i++) {
          const row = cleanData[i];
          const commentText = row[textCol]?.trim() || '';
          
          if (!commentText) {
             processedResults.push(row);
             continue;
          }

          try {
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

          setProgress(((i + 1) / cleanData.length) * 100);
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

    // 5. Safe Export with Quotes
    // quotes: true ensures newlines in your data don't break the file again
    const csv = Papa.unparse({
      fields: columns,
      data: results
    }, {
      quotes: true, 
    });

    const blob = new Blob([csv], { type: 'text/csv;charset=utf-8;' });
    const url = window.URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = 'categorized_feedback_fixed.csv';
    a.click();
    window.URL.revokeObjectURL(url);
  };

  return (
    <Card>
      <CardContent className="pt-6">
        <h3 className="mb-4 font-semibold">Bulk CSV Prediction</h3>
        
        <div className="border-2 border-dashed border-border rounded-lg p-8 text-center mb-4 hover:bg-muted/50 transition-colors">
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
            <Button variant="outline" asChild className="cursor-pointer">
              <span>Choose File</span>
            </Button>
          </label>
          {file && <p className="mt-3 text-sm text-muted-foreground font-medium">Selected: {file.name}</p>}
        </div>

        {previewData && (
          <div className="mb-6">
            <Alert>
              <CheckCircle2 className="h-4 w-4" />
              <AlertDescription>File ready! Preview of first 5 rows shown below.</AlertDescription>
            </Alert>
            <div className="mt-4 overflow-x-auto border rounded-lg">
              <table className="w-full text-sm">
                <thead className="bg-muted">
                  <tr>
                    {Object.keys(previewData[0]).map((header, idx) => (
                      <th key={idx} className="px-4 py-2 text-left whitespace-nowrap font-medium">{header}</th>
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
              <span className="text-sm font-medium">{Math.round(progress)}%</span>
            </div>
            <Progress value={progress} className="h-2" />
          </div>
        )}

        {results && (
          <div>
            <Alert className="mb-4 border-green-500/50 text-green-600 dark:text-green-400 bg-green-500/10">
              <CheckCircle2 className="h-4 w-4" />
              <AlertDescription>
                Success! {results.length} rows categorized.
                {stitchCount > 0 && ` (Repaired ${stitchCount} broken text rows automatically)`}
              </AlertDescription>
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
