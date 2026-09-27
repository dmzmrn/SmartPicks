import { useRef } from "react";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { Upload, FileText, X, AlertCircle } from "lucide-react";

export default function FileUploadCard({
  gameLabel,
  fileName,
  drawsCount,
  hasDraws,
  winnersDetected,
  errorMessage,
  onFile,
  onLoadDemo,
  onClear,
  onGenerate,
}) {
  const inputRef = useRef(null);

  const handlePick = (e) => {
    const file = e.target.files?.[0];
    if (file) onFile(file);
    e.target.value = "";
  };

  return (
    <Card>
      <CardHeader>
        <CardTitle>Historical draws</CardTitle>
        <CardDescription>
          Upload past {gameLabel} results as .txt or .csv, one draw per line. Add the jackpot
          winner count at the end of a line to unlock the winner analysis.
        </CardDescription>
      </CardHeader>
      <CardContent className="space-y-3">
        <div className="flex flex-wrap items-center gap-2">
          <input
            ref={inputRef}
            type="file"
            accept=".txt,.csv"
            className="hidden"
            onChange={handlePick}
          />
          <Button
            variant={hasDraws ? "secondary" : "outline"}
            size="sm"
            onClick={() => inputRef.current?.click()}
          >
            <Upload className="mr-2 h-4 w-4" />
            {hasDraws ? "Replace file" : "Upload file"}
          </Button>
          <Button variant="ghost" size="sm" onClick={onLoadDemo}>
            Load demo data
          </Button>
          {hasDraws && (
            <Button variant="ghost" size="sm" onClick={onClear}>
              <X className="mr-1 h-4 w-4" /> Clear
            </Button>
          )}
        </div>

        {hasDraws && (
          <div className="inline-flex flex-wrap items-center gap-2 rounded-md border bg-muted/40 px-3 py-1.5 text-xs text-muted-foreground">
            <FileText className="h-3.5 w-3.5" />
            <span className="font-medium text-foreground">{fileName}</span>
            <span>·</span>
            <span>{drawsCount.toLocaleString()} draws loaded</span>
            <span>·</span>
            <span>
              {winnersDetected ? "winner counts found" : "no winner column"}
            </span>
          </div>
        )}

        {errorMessage && (
          <Alert variant="destructive">
            <AlertCircle className="h-4 w-4" />
            <AlertDescription>{errorMessage}</AlertDescription>
          </Alert>
        )}
      </CardContent>
      <div className="flex items-center justify-between gap-3 border-t px-6 py-3 text-sm text-muted-foreground">
        <span>{hasDraws ? "Ready to build the report." : "Waiting for draws…"}</span>
        <Button size="sm" disabled={!hasDraws} onClick={onGenerate}>
          Generate report
        </Button>
      </div>
    </Card>
  );
}
