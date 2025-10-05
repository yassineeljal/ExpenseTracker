import { prisma } from "@/lib/prisma";
import { formatCents } from "@/lib/money";
import { revalidatePath } from "next/cache";
import { Card, CardHeader, CardTitle, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Select } from "@/components/ui/select";
import { Progress } from "@/components/ui/progress";
import ClientOnly from "@/components/client-only";

function startOfMonth(d = new Date()) {
  return new Date(d.getFullYear(), d.getMonth(), 1, 0, 0, 0, 0);
}
function endOfMonth(d = new Date()) {
  return new Date(d.getFullYear(), d.getMonth() + 1, 0, 23, 59, 59, 999);
}
function currentYearMonth(d = new Date()) {
  return { year: d.getFullYear(), month: d.getMonth() + 1 };
}

export default async function BudgetsPage() {
  const now = new Date();
  const from = startOfMonth(now);
  const to = endOfMonth(now);
  const { year, month } = currentYearMonth(now);

  const [categories, budgets, monthTx] = await Promise.all([
    prisma.category.findMany({ orderBy: { name: "asc" } }),
    prisma.budget.findMany({
      where: { year, month },
      include: { category: true },
      orderBy: { category: { name: "asc" } },
    }),
    prisma.transaction.findMany({
      where: { date: { gte: from, lte: to }, amountCents: { lt: 0 } },
      select: { amountCents: true, categoryId: true },
    }),
  ]);

  const spentByCat = new Map<string, number>();
  for (const t of monthTx) {
    const key = t.categoryId ?? "__uncat__";
    spentByCat.set(key, (spentByCat.get(key) ?? 0) + Math.abs(t.amountCents));
  }

  const budgetByCat = new Map(budgets.map(b => [b.categoryId, b]));
  const totalLimit = budgets.reduce((s, b) => s + b.limitCents, 0);
  const totalSpent = budgets.reduce((s, b) => s + (spentByCat.get(b.categoryId) ?? 0), 0);

  async function upsertBudget(formData: FormData) {
    "use server";
    const categoryId = String(formData.get("categoryId") || "");
    const limit = Number(formData.get("limit") || 0);
    if (!categoryId || Number.isNaN(limit)) return;

    const { year, month } = currentYearMonth(new Date());
    await prisma.budget.upsert({
      where: { year_month_categoryId: { year, month, categoryId } },
      update: { limitCents: Math.round(limit * 100) },
      create: { year, month, categoryId, limitCents: Math.round(limit * 100) },
    });
    revalidatePath("/budgets");
  }

  return (
    <div className="space-y-6">
      <header className="space-y-1">
        <h1 className="text-2xl font-semibold">Budgets — {month}/{year}</h1>
        <p className="text-sm text-neutral-600 dark:text-neutral-400">
          Définis un budget mensuel par catégorie. Le dépensé se base sur les transactions du mois.
        </p>
      </header>

      <div className="grid gap-3 sm:grid-cols-3">
        <Card>
          <CardHeader><CardTitle>Budget total</CardTitle></CardHeader>
          <CardContent><div className="text-2xl font-semibold">{formatCents(totalLimit)}</div></CardContent>
        </Card>
        <Card>
          <CardHeader><CardTitle>Dépensé (mois)</CardTitle></CardHeader>
          <CardContent><div className="text-2xl font-semibold">{formatCents(totalSpent)}</div></CardContent>
        </Card>
        <Card>
          <CardHeader><CardTitle>Reste</CardTitle></CardHeader>
          <CardContent><div className="text-2xl font-semibold">{formatCents(totalLimit - totalSpent)}</div></CardContent>
        </Card>
      </div>

      <Card>
        <CardContent className="pt-4">
          <ClientOnly>
            <form
              action={upsertBudget}
              className="grid gap-2 sm:grid-cols-5"
              autoComplete="off"
            >
              <Select name="categoryId" required>
                {categories.map((c) => (
                  <option key={c.id} value={c.id}>{c.name}</option>
                ))}
              </Select>
              <Input
                name="limit"
                type="number"
                step="0.01"
                min="0"
                placeholder="Montant mensuel (ex: 200)"
                className="sm:col-span-2"
                required
                autoComplete="off"
              />
              <div className="sm:col-span-2" />
              <Button className="sm:col-span-1">Sauvegarder</Button>
            </form>
          </ClientOnly>
        </CardContent>
      </Card>

      <Card>
        <CardContent className="pt-4">
          {budgets.length === 0 ? (
            <div className="text-neutral-500">Aucun budget défini pour ce mois.</div>
          ) : (
            <ul className="divide-y divide-[rgb(var(--border))]">
              {categories
                .filter((c) => budgetByCat.has(c.id))
                .map((c) => {
                  const b = budgetByCat.get(c.id)!;
                  const spent = spentByCat.get(c.id) ?? 0;
                  const pct = b.limitCents > 0 ? Math.min(100, Math.round((spent / b.limitCents) * 100)) : 0;
                  const remaining = b.limitCents - spent;

                  return (
                    <li key={b.id} className="py-4">
                      <div className="flex items-center justify-between gap-4">
                        <div className="min-w-0">
                          <div className="text-sm text-neutral-500">{c.name}</div>
                          <div className="text-lg font-semibold">
                            {formatCents(spent)} / {formatCents(b.limitCents)}
                          </div>
                        </div>
                        <div className="min-w-[140px] text-right text-sm">
                          <div className={remaining >= 0 ? "text-neutral-600 dark:text-neutral-300" : "text-red-600"}>
                            Reste&nbsp;: {formatCents(remaining)}
                          </div>
                          <div className="text-neutral-500">{pct}%</div>
                        </div>
                      </div>
                      <div className="mt-2">
                        <Progress value={pct} />
                      </div>
                    </li>
                  );
                })}
            </ul>
          )}
        </CardContent>
      </Card>
    </div>
  );
}
