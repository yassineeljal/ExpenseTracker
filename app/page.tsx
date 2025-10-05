import { prisma } from "@/lib/prisma";
import { Card, CardHeader, CardTitle, CardContent } from "@/components/ui/card";
import MonthlyChart from "@/components/charts/MonthlyChart";

function startOfMonth(d = new Date()) {
  return new Date(d.getFullYear(), d.getMonth(), 1, 0, 0, 0, 0);
}
function endOfMonth(d = new Date()) {
  return new Date(d.getFullYear(), d.getMonth() + 1, 0, 23, 59, 59, 999);
}
function formatCents(c: number) {
  return new Intl.NumberFormat("fr-CA", { style: "currency", currency: "CAD" }).format(c / 100);
}

export default async function DashboardPage() {
  const now = new Date();
  const from = startOfMonth(now);
  const to = endOfMonth(now);

  const tx = await prisma.transaction.findMany({
    where: { date: { gte: from, lte: to } },
    orderBy: { date: "asc" },
    include: { category: true },
  });

  const income = tx.filter(t => t.amountCents > 0).reduce((s, t) => s + t.amountCents, 0);
  const expenses = tx.filter(t => t.amountCents < 0).reduce((s, t) => s + t.amountCents, 0);
  const balance = income + expenses;

  const spentByCat = new Map<string, { name: string; cents: number }>();
  for (const t of tx) {
    if (t.amountCents >= 0) continue;
    const key = t.category?.id ?? "__uncat__";
    const name = t.category?.name ?? "Sans catégorie";
    const prev = spentByCat.get(key)?.cents ?? 0;
    spentByCat.set(key, { name, cents: prev + Math.abs(t.amountCents) });
  }
  const spentList = Array.from(spentByCat.values()).sort((a, b) => b.cents - a.cents);
  const totalSpentAbs = Math.abs(expenses);

  return (
    <div className="space-y-6">
      <h1 className="text-2xl font-semibold">Tableau de bord — {now.toLocaleDateString("fr-CA", { month: "long", year: "numeric" })}</h1>

      <div className="grid gap-3 sm:grid-cols-3">
        <Card>
          <CardHeader><CardTitle>Revenus (mois)</CardTitle></CardHeader>
          <CardContent><div className="text-2xl font-semibold">{formatCents(income)}</div></CardContent>
        </Card>
        <Card>
          <CardHeader><CardTitle>Dépenses (mois)</CardTitle></CardHeader>
          <CardContent><div className="text-2xl font-semibold">{formatCents(expenses)}</div></CardContent>
        </Card>
        <Card>
          <CardHeader><CardTitle>Solde (mois)</CardTitle></CardHeader>
          <CardContent><div className="text-2xl font-semibold">{formatCents(balance)}</div></CardContent>
        </Card>
      </div>

      <section className="space-y-2">
        <h2 className="text-xl font-medium">Évolution du mois</h2>
        <Card>
          <CardContent className="pt-4">
            <MonthlyChart
              transactions={tx.map(t => ({
                date: t.date.toISOString(),
                amountCents: t.amountCents,
              }))}
            />
          </CardContent>
        </Card>
      </section>

      <section className="space-y-2">
        <h2 className="text-xl font-medium">Dépenses par catégorie (mois)</h2>
        <Card>
          <CardContent className="pt-4">
            {spentList.length === 0 ? (
              <div className="text-neutral-500">Aucune dépense saisie ce mois-ci.</div>
            ) : (
              <ul className="space-y-3">
                {spentList.slice(0, 6).map((c) => {
                  const pct = totalSpentAbs > 0 ? Math.round((c.cents / totalSpentAbs) * 100) : 0;
                  return (
                    <li key={c.name} className="space-y-1">
                      <div className="flex items-center justify-between gap-2">
                        <span className="text-sm text-neutral-500">{c.name}</span>
                        <span className="text-sm font-medium">{formatCents(c.cents)}</span>
                      </div>
                      <div className="h-2 w-full overflow-hidden rounded-full bg-neutral-200 dark:bg-neutral-800">
                        <div className="h-full bg-black dark:bg-white" style={{ width: `${pct}%` }} />
                      </div>
                    </li>
                  );
                })}
              </ul>
            )}
          </CardContent>
        </Card>
      </section>
    </div>
  );
}
