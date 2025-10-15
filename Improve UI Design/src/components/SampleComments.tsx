import { Card, CardContent } from "./ui/card";
import { Button } from "./ui/button";

interface SampleCommentsProps {
  onSelectSample: (text: string) => void;
}

const samples = {
  "Food Safety": "The meal smelled funny and made me sick.",
  "Catering Error": "Required meals not catered.",
  "Food Quality": "The soup lacked flavor and the chicken was overcooked.",
  "Missing Items": "Insufficient beverages for expected load."
};

export function SampleComments({ onSelectSample }: SampleCommentsProps) {
  return (
    <Card className="mb-6">
      <CardContent className="pt-6">
        <h3 className="mb-4">Sample Comments by Category</h3>
        <div className="grid sm:grid-cols-2 gap-3">
          {Object.entries(samples).map(([label, text]) => (
            <div
              key={label}
              className="p-4 rounded-lg border border-border bg-muted/30 hover:bg-muted/50 transition-colors"
            >
              <div className="flex items-start justify-between gap-3 mb-2">
                <h4 className="text-muted-foreground">{label}</h4>
                <Button
                  size="sm"
                  variant="outline"
                  onClick={() => onSelectSample(text)}
                  className="shrink-0"
                >
                  Try it
                </Button>
              </div>
              <p className="text-muted-foreground text-sm">{text}</p>
            </div>
          ))}
        </div>
      </CardContent>
    </Card>
  );
}
