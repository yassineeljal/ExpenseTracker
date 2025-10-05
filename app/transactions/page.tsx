import { prisma } from "@/lib/prisma";
import { formatCents } from "@/lib/money";
import { revalidatePath } from "next/cache";
import { Card, CardHeader, CardTitle, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Select } from "@/components/ui/select";
import { Table, THead, TBody, TR, TH, TD } from "@/components/ui/table";
import ClientOnly from "@/components/client-only";

function todayISO() {
  const d = new Date();
  const off = d.getTimezoneOffset();
  const local = new Date(d.getTime() - off * 60000);
  return local.toISOString().slice(0, 10);
}

export default async function TransactionsPage() {
  const categories = await prisma.category.findMany({ orderBy: { name: "asc" } });
  const transactions = await prisma.transaction.findMany({
    include: { category: true },
    orderBy: [{ date: "desc" }, { createdAt: "desc" }],
  });

  const total = transactions.reduce((s, t) => s + t.amountCents, 0);
  const income = transactions.filter(t => t.amountCents > 0).reduce((s, t) => s + t.amountCents, 0);
  const expenses = transactions.filter(t => t.amountCents < 0).reduce((s, t) => s + t.amountCents, 0);

  async function addTx(formData: FormData) {
    "use server";
    const dateStr = String(formData.get("date") || "");
    const amount = Number(formData.get("amount"));
    const description = String(formData.get("description") || "").trim();
    const categoryId = String(formData.get("categoryId") || "");
    if (!dateStr || Number.isNaN(amount)) return;

    await prisma.transaction.create({
      data: {
        date: new Date(dateStr),
        amountCents: Math.round(amount * 100),
        description: description || null,
        categoryId: categoryId || null,
        source: "manual",
      },
    });
    revalidatePath("/transactions");
  }

  async function deleteTx(formData: FormData) {
    "use server";
    const id = String(formData.get("id") || "");
    if (!id) return;
    await prisma.transaction.delete({ where: { id } });
    revalidatePath("/transactions");
  }

  return (
    <div className="space-y-6">
      <h1 className="text-2xl font-semibold">Transactions</h1>

      <div className="grid gap-3 sm:grid-cols-3">
        <Card>
          <CardHeader><CardTitle>Revenus</CardTitle></CardHeader>
          <CardContent><div className="text-2xl font-semibold">{formatCents(income)}</div></CardContent>
        </Card>
        <Card>
          <CardHeader><CardTitle>Dépenses</CardTitle></CardHeader>
          <CardContent><div className="text-2xl font-semibold">{formatCents(expenses)}</div></CardContent>
        </Card>
        <Card>
          <CardHeader><CardTitle>Solde</CardTitle></CardHeader>
          <CardContent><div className="text-2xl font-semibold">{formatCents(total)}</div></CardContent>
        </Card>
      </div>

      <Card>
        <CardContent className="pt-4">
          <ClientOnly>
            <form action={addTx} className="grid gap-2 sm:grid-cols-5" autoComplete="off">
              <Input name="date" type="date" defaultValue={todayISO()} required />
              <Input
                name="amount"
                type="number"
                step="0.01"
                placeholder="Montant (+ revenu / - dépense)"
                required
                className="sm:col-span-2"
                autoComplete="off"
              />
              <Select name="categoryId">
                <option value="">Sans catégorie</option>
                {categories.map((c) => (
                  <option key={c.id} value={c.id}>{c.name}</option>
                ))}
              </Select>
              <Input name="description" placeholder="Description (facultatif)" className="sm:col-span-2" autoComplete="off" />
              <Button className="sm:col-span-1">Ajouter</Button>
            </form>
          </ClientOnly>
        </CardContent>
      </Card>

      <Card>
        <CardContent className="pt-4 overflow-x-auto">
          <Table>
            <THead>
              <TR>
                <TH>Date</TH>
                <TH>Montant</TH>
                <TH>Catégorie</TH>
                <TH>Description</TH>
                <TH>Actions</TH>
              </TR>
            </THead>
            <TBody>
              {transactions.map((t) => (
                <TR key={t.id}>
                  <TD>{new Date(t.date).toLocaleDateString("fr-CA")}</TD>
                  <TD className={t.amountCents < 0 ? "text-red-600" : "text-green-600"}>
                    {formatCents(t.amountCents)}
                  </TD>
                  <TD>{t.category?.name ?? "—"}</TD>
                  <TD>{t.description ?? "—"}</TD>
                  <TD>
                    <form action={deleteTx} className="inline">
                      <input type="hidden" name="id" value={t.id} />
                      <Button variant="outline" size="sm">Supprimer</Button>
                    </form>
                  </TD>
                </TR>
              ))}
              {transactions.length === 0 && (
                <TR>
                  <TD colSpan={5} className="text-center text-neutral-500 py-6">
                    Aucune transaction pour l’instant.
                  </TD>
                </TR>
              )}
            </TBody>
          </Table>
        </CardContent>
      </Card>
    </div>
  );
}
