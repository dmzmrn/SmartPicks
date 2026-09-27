import { Card, CardContent } from "@/components/ui/card";
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert";
import { AlertTriangle } from "lucide-react";

const SOURCES = [
  {
    label:
      "Baker & McHale (2011), “Investigating the behavioural characteristics of lottery players by using a combination preference model for conscious selection,” JRSS A 174(4)",
    href: "https://academic.oup.com/jrsssa/article/174/4/1071/7077904",
  },
  {
    label: "Henze & Riedwyl (1998), How to Win More: Strategies for Increasing a Lottery Win",
    href: "https://www.routledge.com/How-to-Win-More-Strategies-for-Increasing-a-Lottery-Win/Henze-Riedwyl/p/book/9781568810782",
  },
  {
    label: "Philippine News Agency (2 Oct 2022), 6/55 Grand Lotto draw with 433 winners",
    href: "https://www.pna.gov.ph/articles/1185122",
  },
];

const Section = ({ title, children }) => (
  <section className="space-y-2 px-6 py-5">
    <h2 className="text-base font-semibold tracking-tight">{title}</h2>
    <div className="space-y-2 text-sm leading-relaxed text-muted-foreground">{children}</div>
  </section>
);

const Figure = ({ children }) => (
  <span className="font-medium tabular-nums text-foreground">{children}</span>
);

export default function InfoTab() {
  return (
    <div className="max-w-3xl space-y-6">
      <Card>
        <CardContent className="divide-y p-0">
          <Section title="What this tool does">
            <p>
              Every combination has exactly the same chance of being drawn — no tool can change
              that. What you can change is how many people you share a jackpot with. This
              generator steers away from combinations other players favor, so if you do win, you
              are more likely to keep the whole prize.
            </p>
          </Section>

          <Section title="The crowd score">
            <p>
              Each set gets a score from 0 to 100: the share of all possible combinations that
              other players are likely to choose <em>more</em> often than yours. A score of 90
              means 90% of combinations are more crowded. A random combination averages exactly
              50.
            </p>
            <p>
              The model was fitted to <Figure>3,086</Figure> real PCSO draws (Grand Lotto 6/55 and
              Ultra Lotto 6/58) and their jackpot-winner counts using Poisson regression — the
              standard way statisticians infer how players choose numbers from who wins. Two
              effects were clear. Each number from 1–31 in a winning combination multiplied the
              expected number of co-winners by about <Figure>1.6×</Figure>, and a combination made
              entirely of 1–31 carried a further <Figure>4×</Figure>. Folklore patterns such as
              lucky 7, multiples of 5 or shared last digits showed no measurable effect, so they
              are not scored.
            </p>
          </Section>

          <Section title="Avoid birthday range (tiered weights)">
            <p>
              Numbers 1–12 are sampled with weight <Figure>0.18</Figure>, 13–31 with{" "}
              <Figure>0.40</Figure> and 32+ with <Figure>1.00</Figure>. This nudges picks toward
              the underused upper range without forbidding low numbers.
            </p>
          </Section>

          <Section title="Avoid 3+ in a row">
            <p>
              Runs like 11 · 12 · 13 look attractive and are often played. With this on, any
              sorted run of three consecutive numbers is rejected.
            </p>
          </Section>

          <Section title="Evenly spaced patterns (always on)">
            <p>
              On 1 October 2022, <Figure>433</Figure> people shared the ₱236 million Grand Lotto
              6/55 jackpot because the winning numbers were 9 · 18 · 27 · 36 · 45 · 54 — every
              multiple of 9. Each took home about ₱545,000. The generator rejects any set where
              all numbers, or all but one, are evenly spaced, and such sets score 0.
            </p>
          </Section>

          <Section title="Statistical balance (always on)">
            <ul className="list-disc space-y-1 pl-5">
              <li>Sum must fall between μ − 1.5σ and μ + 2.75σ — players skew low, so the window leans high.</li>
              <li>All-even and all-odd sets are rejected.</li>
              <li>All-low sets are rejected. All-high sets are allowed only with “avoid birthday range” on.</li>
            </ul>
          </Section>

          <Section title="Number spread (always on)">
            <p>
              The lowest and highest numbers must be at least <Figure>40%</Figure> of the range
              apart (23 or more for 6/58). Tight clusters are rejected.
            </p>
          </Section>

          <Section title="Ending-digit diversity (always on)">
            <p>No last digit (0–9) may appear in four or more numbers of the same set.</p>
          </Section>

          <Section title="Sampling method">
            <p>
              Randomness comes only from <code className="text-foreground">crypto.getRandomValues</code>{" "}
              — the generator refuses to run without it. Weighted picks use the
              Efraimidis–Spirakis algorithm (2006), which samples without replacement exactly in
              proportion to the weights.
            </p>
          </Section>

          <Section title="Excluding past winners">
            <p>
              Draws are independent — past winning numbers are not less likely to come up. The
              exclusion list is a preference: use it to skip combinations you consider taken.
              “Recent only” is a convenience, not an edge.
            </p>
          </Section>

          <Section title="Sources">
            <ul className="list-disc space-y-1 pl-5">
              {SOURCES.map((s) => (
                <li key={s.href}>
                  <a
                    href={s.href}
                    target="_blank"
                    rel="noreferrer"
                    className="underline underline-offset-2 hover:text-foreground"
                  >
                    {s.label}
                  </a>
                </li>
              ))}
            </ul>
          </Section>
        </CardContent>
      </Card>

      <Alert variant="destructive">
        <AlertTriangle className="h-4 w-4" />
        <AlertTitle>Honest disclaimer</AlertTitle>
        <AlertDescription>
          No tool can predict lotto numbers. Every combination has the same odds. There is no
          public jackpot data feed, so nothing here is live. Treat lotto as entertainment — never
          spend money you can't afford to lose.
        </AlertDescription>
      </Alert>
    </div>
  );
}
