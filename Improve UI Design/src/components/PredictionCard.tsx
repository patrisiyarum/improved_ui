import { Badge } from "./ui/badge";
import { Card, CardContent } from "./ui/card";

interface Prediction {
  label: string;
  probability: number;
}

interface PredictionCardProps {
  mainPredictions: Prediction[];
  subPredictions: Prediction[];
}

export function PredictionCard({ mainPredictions, subPredictions }: PredictionCardProps) {
  return (
    <div className="grid md:grid-cols-2 gap-6 mt-6">
      <Card>
        <CardContent className="pt-6">
          <div className="flex items-center gap-2 mb-4">
            <div className="w-2 h-2 rounded-full bg-chart-1"></div>
            <h3>Main Category</h3>
          </div>
          <div className="space-y-3">
            {mainPredictions.slice(0, 3).map((pred, idx) => (
              <div key={idx} className="flex items-center justify-between">
                <span className="text-muted-foreground">{pred.label}</span>
                <Badge variant={idx === 0 ? "default" : "secondary"}>
                  {pred.probability.toFixed(2)}%
                </Badge>
              </div>
            ))}
          </div>
        </CardContent>
      </Card>

      <Card>
        <CardContent className="pt-6">
          <div className="flex items-center gap-2 mb-4">
            <div className="w-2 h-2 rounded-full bg-chart-2"></div>
            <h3>Subcategory</h3>
          </div>
          <div className="space-y-3">
            {subPredictions.slice(0, 3).map((pred, idx) => (
              <div key={idx} className="flex items-center justify-between">
                <span className="text-muted-foreground">{pred.label}</span>
                <Badge variant={idx === 0 ? "default" : "secondary"}>
                  {pred.probability.toFixed(2)}%
                </Badge>
              </div>
            ))}
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
