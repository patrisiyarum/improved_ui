import { useState } from "react";
import { Card, CardContent } from "./ui/card";
import { Button } from "./ui/button";
import { Progress } from "./ui/progress";
import { Alert, AlertDescription } from "./ui/alert";
import { Upload, Download, CheckCircle2 } from "lucide-react";
import Papa from "papaparse";
import * as XLSX from "xlsx";

interface BulkUploadProps {
  onPredict: (text: string) => Promise<{ subPredictions: any[] }>;
  onUploadComplete: (results: any[]) => void;
}

// Keywords to look for in the header row (Case Insensitive)
const COLUMN_KEYWORDS = [
  "text", "comment", "comments", "feedback", "review", 
  "pilot's questions/answers", "pilots questions/answers", 
  "pilot's questions", "questions/answers"
];

export function BulkUpload({ onPredict, onUploadComplete }: BulkUploadProps) {
  const [file, setFile] = useState<File | null>(null);
  const [processing, setProcessing] = useState(false);
  const [progress, setProgress] = useState(0);
  const [results, setResults] = useState<any[] | null>(null);
  const [previewData, setPreviewData] = useState<any[] | null>(null);
  const [columns, setColumns] = useState<string[]>([]);
  const [stitchCount, setStitchCount] = useState(0);

  // --- Helper: Parse Excel File (Searches ALL Sheets) ---
  const parseExcel = (file: File): Promise<any[]> => {
    return new Promise((resolve, reject) => {
      const reader = new FileReader();
      
      reader.onload = (e) => {
        try {
          const data = e.target?.result;
          const workbook = XLSX.read(data, { type: "array" }); // Use 'array' for best compatibility
          
          let foundSheetData: any[] = [];
          let foundHeaderRow = 0;
          let sheetFound = false;

          // Loop through ALL sheets to find the one with the correct headers
          for (const sheetName of workbook.SheetNames) {
            const sheet = workbook.Sheets[sheetName];
            
            // Convert to raw array to scan headers
            const rawData = XLSX.utils.sheet_to_json(sheet, { header: 1 }) as any[][];
            
            // Search first 20 rows for a valid header
            const rowIndex = rawData.slice(0, 20).findIndex(row => 
              row && row.some(cell => 
                typeof cell === 'string' && 
                COLUMN_KEYWORDS.some(k => cell.toLowerCase().trim().includes(k))
              )
            );

            if (rowIndex !== -1) {
              console.log(`✅ Found valid headers in sheet: "${sheetName}" on row ${rowIndex + 1}`);
              foundHeaderRow = rowIndex;
              
              // Re-parse ONLY this sheet using the correct header row
              foundSheetData = XLSX.utils.sheet_to_json(sheet, { 
                defval: "",
                range: foundHeaderRow 
              });
              
              sheetFound = true;
              break; // Stop searching once we find a valid sheet
            }
          }

          if (!sheetFound) {
            console.warn("⚠️ No sheet matched the required columns. Defaulting to first sheet.");
            // Fallback: Just load the first sheet if nothing matched
            const firstSheet = workbook.Sheets[workbook.SheetNames[0]];
            foundSheetData = XLSX.utils.sheet_to_json(firstSheet, { defval: "" });
          }
          
          resolve(foundSheetData);
        } catch (error) {
          console.error("XLSX Read Error:", error);
          reject(error);
        }
      };
      
      reader.onerror = (error) => reject(error);
      reader.readAsArrayBuffer(file); // Changed to ArrayBuffer for robustness
    });
  };

  // --- Helper: Parse CSV File ---
  const parseCSV = (file: File): Promise<any[]> => {
    return new Promise((resolve, reject) => {
      Papa.parse(file, {
        header: true,
        skipEmptyLines: "greedy",
        complete: (results) => resolve(results.data as any[]),
        error: (error) => reject(error),
      });
    });
  };

  const handleFileUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const uploadedFile = e.target.files?.[0];
    if (uploadedFile) {
      setFile(uploadedFile);
      setResults(null);
      setProgress(0);
      setStitchCount(0);

      try {
        let data: any[] = [];
        if (uploadedFile.name.endsWith(".xlsx") || uploadedFile.name.endsWith(".xls")) {
          data = await parseExcel(uploadedFile);
        } else {
          data = await parseCSV(uploadedFile);
        }
        
        // Safety check: ensure data is an array
        if (!Array.isArray(data)) {
            throw new Error("Parsed data is not an array");
        }
        
        setPreviewData(data.slice(0, 5));
      } catch (error) {
        console.error("Error reading file:", error);
        alert("Failed to read file. Please ensure it is a valid CSV or Excel file.");
      }
    }
  };

  const handleProcess = async () => {
    if (!file) return;

    setProcessing(true);
    setProgress(0);
    setStitchCount(0);

    try {
      // 1. Parse File
      let rawData: any[] = [];
      if (file.name.endsWith(".xlsx") || file.name.endsWith(".xls")) {
        rawData = await parseExcel(file);
      } else {
        rawData = await parseCSV(file);
      }

      if (!rawData || rawData.length === 0) {
          alert("File appears to be empty.");
          setProcessing(false);
          return;
      }

      const originalHeaders = Object.keys(rawData[0]);

      // 2. Identify Text Column (using shared keyword list)
      const textCol = originalHeaders.find((h) => {
        const headerLower = h.toLowerCase().trim();
        return COLUMN_KEYWORDS.some((keyword) => headerLower.includes(keyword));
      });

      if (!textCol) {
        alert("Could not find a valid text column (e.g., 'Comments' or 'Pilot's Questions/Answers').");
        setProcessing(false);
        return;
      }

      // 3. Smart Stitching (Mainly for CSVs, but kept safe for Excel)
      const cleanData: any[] = [];
      let lastValidRow: any = null;
      let stitched = 0;
      
      const keyCol1 = originalHeaders[0]; 

      for (const row of rawData) {
        const firstVal = row[keyCol1];
        if (firstVal !== undefined && firstVal !== "") {
          cleanData.push(row);
          lastValidRow = row;
        } else if (lastValidRow && !file.name.endsWith(".xlsx") && !file.name.endsWith(".xls")) {
          // Only stitch fragments for CSVs
          const fragment = Object.values(row).filter(v => v).join(" ");
          if (fragment) {
            lastValidRow[textCol] += "\n" + fragment;
            stitched++;
          }
        } else {
            // For Excel, if a row is totally empty or invalid, we skip it
            // unless it has data in other columns we care about. 
            // Usually Excel parsing is cleaner so we just push valid rows.
             if (row[textCol]) cleanData.push(row);
        }
      }
      setStitchCount(stitched);

      // 4. Save Headers for Export
      const finalHeaders = [...originalHeaders, "Predicted_Subcategory", "Subcategory_Confidence"];
      setColumns(finalHeaders);

      // 5. Process Data
      const processedResults = [];
      for (let i = 0; i < cleanData.length; i++) {
        const row = cleanData[i];
        const commentText = row[textCol]?.trim() || "";

        if (!commentText) {
          processedResults.push(row);
          continue;
        }

        try {
          const { subPredictions } = await onPredict(commentText);
          const newRow = {
            ...row,
            Predicted_Subcategory: subPredictions[0]?.label || "Unknown",
            Subcategory_Confidence: subPredictions[0]?.probability
              ? `${subPredictions[0].probability.toFixed(2)}%`
              : "0%",
          };
          processedResults.push(newRow);
        } catch (err) {
          console.error(`Error processing row ${i}:`, err);
          processedResults.push({
            ...row,
            Predicted_Subcategory: "Error",
            Subcategory_Confidence: "0%",
          });
        }

        setProgress(((i + 1) / cleanData.length) * 100);
        if (i % 5 === 0) await new Promise((resolve) => setTimeout(resolve, 10));
      }

      setResults(processedResults);
      onUploadComplete(processedResults);
    } catch (err) {
      console.error("Processing error:", err);
      alert("An error occurred during processing.");
    } finally {
      setProcessing(false);
    }
  };

  const handleDownload = () => {
    if (!results || results.length === 0) return;

    const csv = Papa.unparse(
      {
        fields: columns,
        data: results,
      },
      {
        quotes: true,
      }
    );

    const blob = new Blob([csv], { type: "text/csv;charset=utf-8;" });
    const url = window.URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = "categorized_feedback.csv";
    a.click();
    window.URL.revokeObjectURL(url);
  };

  return (
    <Card>
      <CardContent className="pt-6">
        <h3 className="mb-4 font-semibold">Bulk Upload Prediction</h3>

        <div className="border-2 border-dashed border-border rounded-lg p-8 text-center mb-4 hover:bg-muted/50 transition-colors">
          <Upload className="mx-auto mb-4 w-12 h-12 text-muted-foreground" />
          <p className="text-muted-foreground mb-4">
            Upload a CSV or Excel file with feedback comments
          </p>
          <input
            type="file"
            accept=".csv, .xlsx, .xls"
            onChange={handleFileUpload}
            className="hidden"
            id="file-upload"
          />
          <label htmlFor="file-upload">
            <Button variant="outline" asChild className="cursor-pointer">
              <span>Choose File</span>
            </Button>
          </label>
          {file && (
            <p className="mt-3 text-sm text-muted-foreground font-medium">
              Selected: {file.name}
            </p>
          )}
        </div>

        {previewData && (
          <div className="mb-6">
            <Alert>
              <CheckCircle2 className="h-4 w-4" />
              <AlertDescription>
                File ready! Preview of first 5 rows shown below.
              </AlertDescription>
            </Alert>

            <div className="mt-4 overflow-x-auto border rounded-lg">
              <table className="w-full text-sm">
                <thead className="bg-muted">
                  <tr>
                    {Object.keys(previewData[0]).map((header, idx) => (
                      <th
                        key={idx}
                        className="px-4 py-2 text-left whitespace-nowrap font-medium"
                      >
                        {header}
                      </th>
                    ))}
                  </tr>
                </thead>
                <tbody>
                  {previewData.map((row, idx) => (
                    <tr key={idx} className="border-t border-border">
                      {Object.values(row).map((value: any, cellIdx) => (
                        <td
                          key={cellIdx}
                          className="px-4 py-2 whitespace-nowrap"
                        >
                          {String(value).length > 50
                            ? String(value).substring(0, 50) + "..."
                            : value}
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
              {processing ? "Processing..." : "Start Prediction"}
            </Button>
          </div>
        )}

        {processing && (
          <div className="mb-6">
            <div className="flex items-center justify-between mb-2">
              <span className="text-sm text-muted-foreground">Processing...</span>
              <span className="text-sm font-medium">
                {Math.round(progress)}%
              </span>
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
                {stitchCount > 0 &&
                  ` (Repaired ${stitchCount} broken text rows automatically)`}
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
