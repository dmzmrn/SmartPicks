import { useEffect, useMemo, useState } from "react";
import { toast } from "sonner";
import {
  parseDrawsFromText,
  generateMockDraws,
  getDrawStats,
  getFrequencyMap,
  normalizeFrequency,
  getAggregateStats,
  getFrequencyExtremes,
} from "./reportCalculations";
import { sampleDraws6_58 } from "./sampleDraws";
import FileUploadCard from "./FileUploadCard";
import SummaryStats from "./SummaryStats";
import SumDistributionChart from "./SumDistributionChart";
import FrequencyDistributionChart from "./FrequencyDistributionChart";
import PatternAnalysisChart from "./PatternAnalysisChart";
import ClusterHeatmap from "./ClusterHeatmap";
import DrawDistributionList from "./DrawDistributionList";

export default function ReportsModule({ pick = 6, max = 58, gameLabel = "Lotto" }) {
  const [draws, setDraws] = useState([]);
  const [fileName, setFileName] = useState("");
  const [errorMessage, setErrorMessage] = useState("");
  const [generated, setGenerated] = useState(false);

  useEffect(() => {
    setDraws([]);
    setFileName("");
    setErrorMessage("");
    setGenerated(false);
  }, [pick, max]);

  const handleFile = async (file) => {
    try {
      const text = await file.text();
      const { draws: parsed, skipped } = parseDrawsFromText(text, pick, max);
      if (parsed.length === 0) {
        setDraws([]);
        setFileName("");
        setErrorMessage(
          `No valid ${pick}-number draws between 1 and ${max} found in this file.`
        );
        setGenerated(false);
        return;
      }
      setDraws(parsed);
      setFileName(file.name);
      setErrorMessage("");
      setGenerated(false);
      toast.success(`${file.name}: ${parsed.length} draws loaded${skipped ? `, ${skipped} skipped` : ""}.`);
    } catch (err) {
      console.error(err);
      setErrorMessage("Could not read this file.");
    }
  };

  const handleLoadDemo = () => {
    const data = pick === 6 && max === 58
      ? sampleDraws6_58
      : generateMockDraws(pick, max, 30);
    setDraws(data);
    setFileName(`demo-${pick}-${max}.txt`);
    setErrorMessage("");
    setGenerated(false);
  };

  const handleClear = () => {
    setDraws([]);
    setFileName("");
    setErrorMessage("");
    setGenerated(false);
  };

  const drawStats = useMemo(() => getDrawStats(draws, max), [draws, max]);
  const frequencyData = useMemo(
    () => normalizeFrequency(getFrequencyMap(draws), max),
    [draws, max]
  );
  const aggregate = useMemo(
    () => getAggregateStats(drawStats, frequencyData),
    [drawStats, frequencyData]
  );
  const { max: hotPeak, min: coldFloor } = useMemo(
    () => getFrequencyExtremes(frequencyData),
    [frequencyData]
  );

  return (
    <div className="space-y-4">
      <div className="text-xs uppercase tracking-wider accent-text-soft opacity-80">
        {gameLabel} · {pick}/{max}
      </div>

      <FileUploadCard
        fileName={fileName}
        drawsCount={draws.length}
        hasDraws={draws.length > 0}
        errorMessage={errorMessage}
        onFile={handleFile}
        onLoadDemo={handleLoadDemo}
        onClear={handleClear}
        onGenerate={() => setGenerated(true)}
      />

      {!generated && (
        <div className="rounded-lg border border-dashed border-white/[0.08] bg-white/[0.01] p-8 text-center text-sm text-muted-foreground">
          Upload a file or load demo data, then click <span className="accent-text-soft">Generate Report</span>.
        </div>
      )}

      {generated && draws.length > 0 && (
        <div className="space-y-4">
          <SummaryStats aggregate={aggregate} />

          <SumDistributionChart drawStats={drawStats} meanSum={aggregate.meanSum} />

          <div className="grid gap-4 lg:grid-cols-3">
            <div className="lg:col-span-2">
              <FrequencyDistributionChart
                frequencyData={frequencyData}
                hotMin={hotPeak}
                coldMin={coldFloor}
              />
            </div>
            <PatternAnalysisChart drawStats={drawStats} />
          </div>

          <ClusterHeatmap frequencyData={frequencyData} max={max} />

          <DrawDistributionList drawStats={drawStats} />
        </div>
      )}
    </div>
  );
}
