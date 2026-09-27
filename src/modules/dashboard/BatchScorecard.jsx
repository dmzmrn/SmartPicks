import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import Ball from "@/components/ball";
import ScoreBadge from "@/components/score-badge";
import { scoreRow } from "@/lib/scoring";

function ScoredRow({ index, entry, pick, max }) {
  const { score, label, reasons } = scoreRow(entry.picks, entry.relaxed, pick, max);
  return (
    <li className="flex flex-col gap-3 px-6 py-4 sm:flex-row sm:items-center sm:gap-5">
      <span className="w-6 text-xs font-medium tabular-nums text-muted-foreground">
        {String(index + 1).padStart(2, "0")}
      </span>
      <div className="flex-1 space-y-2">
        <div className="flex flex-wrap gap-1.5">
          {entry.picks.map((n) => (
            <Ball key={n} n={n} />
          ))}
        </div>
        <p className="text-xs text-muted-foreground">{reasons.join(" · ")}</p>
      </div>
      <ScoreBadge score={score} label={label} />
    </li>
  );
}

export default function BatchScorecard({ batch, pick, max }) {
  return (
    <Card>
      <CardHeader className="border-b">
        <CardTitle>Latest picks, scored</CardTitle>
        <CardDescription>
          The score is the share of all possible combinations that other players choose more
          often than yours. Higher means a win is less likely to be shared — it never changes
          the odds of winning.
        </CardDescription>
      </CardHeader>
      <CardContent className="p-0">
        <ul className="divide-y">
          {batch.map((entry, i) => (
            <ScoredRow key={entry.picks.join("-")} index={i} entry={entry} pick={pick} max={max} />
          ))}
        </ul>
      </CardContent>
    </Card>
  );
}
