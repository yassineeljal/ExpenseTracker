import { prisma } from "@/lib/prisma";
import { revalidatePath } from "next/cache";
import { Card, CardHeader, CardTitle, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Table, THead, TBody, TR, TH, TD } from "@/components/ui/table";

export default async function CategoriesPage() {
  const categories = await prisma.category.findMany({ orderBy: { name: "asc" } });

  async function addCategory(formData: FormData) {
    "use server";
    const name = String(formData.get("name") || "").trim();
    const colorHex = String(formData.get("colorHex") || "").trim() || null;
    if (!name) return;
    await prisma.category.create({ data: { name, colorHex } });
    revalidatePath("/categories");
  }

  async function deleteCategory(formData: FormData) {
    "use server";
    const id = String(formData.get("id") || "");
    if (!id) return;
    const countTx = await prisma.transaction.count({ where: { categoryId: id } });
    if (countTx > 0) {
      return;
    }
    await prisma.category.delete({ where: { id } });
    revalidatePath("/categories");
  }

  return (
    <div className="space-y-6">
      <h1 className="text-2xl font-semibold">Catégories</h1>

      <Card>
        <CardHeader><CardTitle>Ajouter une catégorie</CardTitle></CardHeader>
        <CardContent className="pt-2">
          <form action={addCategory} className="grid gap-2 sm:grid-cols-5">
            <Input name="name" placeholder="Nom (ex: Courses)" required className="sm:col-span-3" />
            <Input name="colorHex" type="color" title="Couleur (optionnelle)" className="sm:col-span-1 h-10 p-1" />
            <Button className="sm:col-span-1">Ajouter</Button>
          </form>
        </CardContent>
      </Card>

      <Card>
        <CardHeader><CardTitle>Toutes les catégories</CardTitle></CardHeader>
        <CardContent className="pt-2 overflow-x-auto">
          <Table>
            <THead>
              <TR>
                <TH>Nom</TH>
                <TH>Couleur</TH>
                <TH>Actions</TH>
              </TR>
            </THead>
            <TBody>
              {categories.map((c) => (
                <TR key={c.id}>
                  <TD className="font-medium">{c.name}</TD>
                  <TD>
                    {c.colorHex ? (
                      <div className="inline-flex items-center gap-2">
                        <span
                          className="inline-block h-3 w-3 rounded-full"
                          style={{ backgroundColor: c.colorHex }}
                        />
                        <span className="text-xs text-neutral-500">{c.colorHex}</span>
                      </div>
                    ) : (
                      <span className="text-neutral-500">—</span>
                    )}
                  </TD>
                  <TD>
                    <form action={deleteCategory} className="inline">
                      <input type="hidden" name="id" value={c.id} />
                      <Button variant="outline" size="sm">Supprimer</Button>
                    </form>
                  </TD>
                </TR>
              ))}
              {categories.length === 0 && (
                <TR>
                  <TD colSpan={3} className="text-center text-neutral-500 py-6">
                    Aucune catégorie pour l’instant.
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
