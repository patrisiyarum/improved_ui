import { Badge } from "./ui/badge";
import { Card, CardContent } from "./ui/card";

interface Prediction {
  label: string;
  probability: number;
}

interface PredictionCardProps {
  // Removed mainPredictions prop
  subPredictions: Prediction[];
}

export function PredictionCard({ subPredictions }: PredictionCardProps) {
  return (
    <div className="mt-6 max-w-2xl mx-auto">
      <Card className="border-primary/20 shadow-lg">
        <CardContent className="pt-6">
          <div className="flex items-center gap-2 mb-6">
            <div className="w-3 h-3 rounded-full bg-chart-2 animate-pulse"></div>
            <h3 className="text-lg font-semibold">Predicted Subcategory</h3>
          </div>
          <div className="space-y-4">
            {subPredictions.slice(0, 5).map((pred, idx) => (
              <div key={idx} className="flex items-center justify-between p-2 rounded hover:bg-muted/50 transition-colors">
                <span className={`text-sm ${idx === 0 ? "font-medium text-foreground" : "text-muted-foreground"}`}>
                  {pred.label}
                </span>
                <Badge variant={idx === 0 ? "default" : "secondary"}>
                  {pred.probability.toFixed(1)}%
                </Badge>
              </div>
            ))}
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
