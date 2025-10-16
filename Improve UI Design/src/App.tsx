<TabsContent value="about">
  <Card>
    <CardHeader>
      <CardTitle>About This Tool</CardTitle>
      <CardDescription>
        Learn more about the FCR Feedback Categorization model
      </CardDescription>
    </CardHeader>
    <CardContent className="space-y-4">
      <p>
        This tool uses a fine-tuned <strong>BERT-based model</strong> to classify
        feedback into <strong>main</strong> and <strong>subcategory</strong> labels,
        helping operations teams identify key trends quickly and accurately.
      </p>

      {/* 🧠 What Does This Model Do */}
      <div className="mt-6 p-6 rounded-lg bg-primary/5 border-2 border-primary/20">
        <h3 className="mb-3">What Does This Model Do? (In Simple Terms)</h3>
        <p className="text-muted-foreground mb-4">
          Imagine you have thousands of customer feedback comments to read. This AI model acts like a super-fast reader that can:
        </p>
        <ul className="space-y-3 text-sm text-muted-foreground">
          <li>📖 <strong>Read and Understand</strong> — It reads each comment and understands what the customer is talking about.</li>
          <li>🏷️ <strong>Put Labels on Comments</strong> — It assigns main/subcategory labels like “Food Quality” and “Temperature Problems.”</li>
          <li>⚡ <strong>Work Super Fast</strong> — It categorizes thousands of comments in seconds.</li>
          <li>🎯 <strong>Show Confidence Levels</strong> — It tells you how confident it is about each prediction.</li>
        </ul>
        <div className="mt-4 p-3 rounded bg-muted/50 text-sm">
          <strong>Think of it like this:</strong> If you sort your emails into folders automatically, 
          this model does the same thing for customer feedback — but it’s much smarter because it actually understands what people are saying!
        </div>
      </div>

      {/* ⚙️ How It Works */}
      <div className="mt-6 p-6 rounded-lg bg-primary/5 border-2 border-primary/20">
        <h3 className="mb-3">How It Works</h3>
        <p className="text-muted-foreground mb-4">
          Here’s what happens behind the scenes every time you enter a comment or upload a CSV:
        </p>
        <ul className="space-y-3 text-sm text-muted-foreground">
          <li>🧩 <strong>1. Tokenization</strong> — The input text is split into smaller units (tokens) using a BERT tokenizer.</li>
          <li>🧠 <strong>2. Embedding Generation</strong> — Each token is converted into a numerical vector that captures its meaning and context.</li>
          <li>🏗️ <strong>3. Dual Classification Heads</strong> — Two parallel layers predict the <em>main category</em> and <em>subcategory</em> simultaneously.</li>
          <li>📊 <strong>4. Confidence Calculation</strong> — The model outputs probabilities for each class, showing how confident it is in its predictions.</li>
        </ul>
        <div className="mt-4 p-3 rounded bg-muted/50 text-sm">
          <strong>In short:</strong> The model reads the comment, understands its meaning, 
          and tags it with accurate categories — just like a human, but faster and more consistent.
        </div>
      </div>

      {/* Model Info Grid */}
      <div className="grid sm:grid-cols-2 gap-4 mt-6">
        <div className="p-4 rounded-lg border border-border bg-muted/30">
          <h4 className="mb-2">Model Architecture</h4>
          <p className="text-sm text-muted-foreground">
            Fine-tuned BERT with two classification heads for main and subcategory prediction.
          </p>
        </div>
        <div className="p-4 rounded-lg border border-border bg-muted/30">
          <h4 className="mb-2">Use Cases</h4>
          <p className="text-sm text-muted-foreground">
            Ideal for categorizing feedback, support tickets, and operational reports at scale.
          </p>
        </div>
        <div className="p-4 rounded-lg border border-border bg-muted/30">
          <h4 className="mb-2">Technology Stack</h4>
          <p className="text-sm text-muted-foreground">
            Built with TensorFlow, Keras, and React. Optimized for real-time inference and batch processing.
          </p>
        </div>
        <div className="p-4 rounded-lg border border-border bg-muted/30">
          <h4 className="mb-2">Version Info</h4>
          <p className="text-sm text-muted-foreground">
            Current version: 2.2<br />Last updated: October 2025
          </p>
        </div>
      </div>
    </CardContent>
  </Card>
</TabsContent>
