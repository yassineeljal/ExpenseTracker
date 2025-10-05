"use client";

import { LineChart, Line, XAxis, YAxis, Tooltip, ResponsiveContainer } from "recharts";

type Tx = {
  date: string;  
  amountCents: number; 
};

export default function MonthlyChart({ transactions }: { transactions: Tx[] }) {
  const byDay = new Map<string, { day: string; income: number; expenses: number }>();

  for (const t of transactions) {
    const d = new Date(t.date);
    const key = d.toISOString().slice(0, 10);
    const dayLabel = `${String(d.getDate()).padStart(2, "0")}`;

    const row = byDay.get(key) ?? { day: dayLabel, income: 0, expenses: 0 };
    if (t.amountCents >= 0) row.income += t.amountCents / 100;
    else row.expenses += Math.abs(t.amountCents) / 100;
    byDay.set(key, row);
  }

  const data = Array.from(byDay.values()).sort((a, b) => Number(a.day) - Number(b.day));

  return (
    <div className="h-64 rounded-xl border bg-white p-3">
      <ResponsiveContainer width="100%" height="100%">
        <LineChart data={data}>
          <XAxis dataKey="day" />
          <YAxis />
          <Tooltip />
          <Line type="monotone" dataKey="income" />
          <Line type="monotone" dataKey="expenses" />
        </LineChart>
      </ResponsiveContainer>
    </div>
  );
}
