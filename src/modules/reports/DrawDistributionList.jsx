import { useMemo, useState } from "react";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Button } from "@/components/ui/button";
import { ArrowUp, ArrowDown, ArrowUpDown } from "lucide-react";

const COLUMNS = [
  { key: "index", label: "#" },
  { key: "numbers", label: "Numbers" },
  { key: "sum", label: "Sum" },
  { key: "oe", label: "Odd/Even" },
  { key: "lh", label: "Low/High" },
];

const SortIcon = ({ active, dir }) => {
  if (!active) return <ArrowUpDown className="h-3 w-3 opacity-50" />;
  return dir === "asc" ? <ArrowUp className="h-3 w-3" /> : <ArrowDown className="h-3 w-3" />;
};

export default function DrawDistributionList({ drawStats }) {
  const [sort, setSort] = useState({ key: "index", dir: "asc" });

  const sorted = useMemo(() => {
    const accessor = (d) => {
      if (sort.key === "oe") return d.odd * 100 + d.even;
      if (sort.key === "lh") return d.low * 100 + d.high;
      if (sort.key === "numbers") return d.numbers.join(",");
      return d[sort.key];
    };
    const arr = [...drawStats].sort((a, b) => {
      const av = accessor(a);
      const bv = accessor(b);
      if (av < bv) return sort.dir === "asc" ? -1 : 1;
      if (av > bv) return sort.dir === "asc" ? 1 : -1;
      return 0;
    });
    return arr;
  }, [drawStats, sort]);

  const cycle = (key) => {
    setSort((prev) =>
      prev.key === key
        ? { key, dir: prev.dir === "asc" ? "desc" : "asc" }
        : { key, dir: "asc" }
    );
  };

  return (
    <Card>
      <CardHeader>
        <CardTitle>Past draws</CardTitle>
        <CardDescription>Sort by any column; press again to reverse.</CardDescription>
      </CardHeader>
      <CardContent>
        <div className="mb-3 flex flex-wrap gap-1">
          {COLUMNS.map((c) => (
            <Button
              key={c.key}
              variant={sort.key === c.key ? "secondary" : "ghost"}
              size="sm"
              onClick={() => cycle(c.key)}
              className="h-8 gap-1.5 px-2.5 text-xs"
            >
              <SortIcon active={sort.key === c.key} dir={sort.dir} />
              {c.label}
            </Button>
          ))}
        </div>
        <ScrollArea className="h-[360px] rounded-md border">
          <table className="w-full text-sm tabular-nums">
            <thead className="sticky top-0 bg-card">
              <tr className="border-b text-xs text-muted-foreground">
                <th className="px-3 py-2 text-left font-medium">#</th>
                <th className="px-3 py-2 text-left font-medium">Numbers</th>
                <th className="px-3 py-2 text-right font-medium">Sum</th>
                <th className="px-3 py-2 text-right font-medium">Odd/Even</th>
                <th className="px-3 py-2 text-right font-medium">Low/High</th>
              </tr>
            </thead>
            <tbody>
              {sorted.map((d) => (
                <tr key={d.index} className="border-b last:border-0 hover:bg-muted/50">
                  <td className="px-3 py-1.5 text-muted-foreground">{String(d.index).padStart(3, "0")}</td>
                  <td className="px-3 py-1.5 font-medium">
                    {d.numbers.map((n) => String(n).padStart(2, "0")).join("  ")}
                  </td>
                  <td className="px-3 py-1.5 text-right">{d.sum}</td>
                  <td className="px-3 py-1.5 text-right text-muted-foreground">{d.odd}/{d.even}</td>
                  <td className="px-3 py-1.5 text-right text-muted-foreground">{d.low}/{d.high}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </ScrollArea>
      </CardContent>
    </Card>
  );
}
