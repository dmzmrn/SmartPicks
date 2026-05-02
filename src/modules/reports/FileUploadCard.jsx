import { useRef } from "react";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { Upload, FileText, X, AlertCircle } from "lucide-react";

export default function FileUploadCard({
  fileName,
  drawsCount,
  hasDraws,
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
        <CardTitle className="flex items-center gap-2 text-base">
          <FileText className="h-4 w-4 accent-text-soft" /> Historical draws
        </CardTitle>
        <CardDescription>
          Upload a `.txt` / `.csv` file with one draw per line, or load demo data.
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
          <div className="inline-flex items-center gap-2 rounded-md border accent-border-soft accent-bg-soft accent-text-soft px-3 py-1.5 text-xs">
            <FileText className="h-3.5 w-3.5" />
            <span className="font-mono">{fileName}</span>
            <span className="opacity-70">·</span>
            <span>{drawsCount} draws loaded</span>
          </div>
        )}

        {errorMessage && (
          <Alert variant="destructive">
            <AlertCircle className="h-4 w-4" />
            <AlertDescription>{errorMessage}</AlertDescription>
          </Alert>
        )}
      </CardContent>
      <div className="flex items-center justify-between gap-3 border-t border-white/[0.06] px-6 py-3 text-xs text-muted-foreground">
        <span>
          {hasDraws
            ? "Ready — click Generate Report to render charts."
            : "Awaiting draws…"}
        </span>
        <Button
          size="sm"
          disabled={!hasDraws}
          onClick={onGenerate}
          className="accent-grad text-white"
        >
          Generate Report
        </Button>
      </div>
    </Card>
  );
}
