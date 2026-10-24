"use client";

import {
  BarChart,
  Bar,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
  Legend,
} from "recharts";

const data = [
  { month: "Jan", revenue: 2100, expenses: 850, profit: 1250 },
  { month: "Fév", revenue: 3450, expenses: 1450, profit: 2000 },
  { month: "Mar", revenue: 2800, expenses: 980, profit: 1820 },
  { month: "Avr", revenue: 1950, expenses: 720, profit: 1230 },
  { month: "Mai", revenue: 4200, expenses: 1600, profit: 2600 },
  { month: "Juin", revenue: 3800, expenses: 1300, profit: 2500 },
  { month: "Juil", revenue: 4900, expenses: 1850, profit: 3050 },
  { month: "Août", revenue: 5200, expenses: 1900, profit: 3300 },
  { month: "Sept", revenue: 3600, expenses: 1100, profit: 2500 },
  { month: "Oct", revenue: 2180, expenses: 800, profit: 1380 },
];

export function RevenueExpenseChart() {
  return (
    <div className="w-full h-72">
      <ResponsiveContainer width="100%" height="100%">
        <BarChart data={data} margin={{ top: 10, right: 10, left: -20, bottom: 0 }}>
          <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#E2E8F0" />
          <XAxis
            dataKey="month"
            axisLine={false}
            tickLine={false}
            tick={{ fontSize: 11, fill: "#64748B" }}
          />
          <YAxis
            axisLine={false}
            tickLine={false}
            tick={{ fontSize: 11, fill: "#64748B" }}
            tickFormatter={(value) => `${value} DT`}
          />
          <Tooltip
            formatter={(value: any) => [`${value} TND`, ""]}
            contentStyle={{
              borderRadius: "8px",
              border: "1px solid #E2E8F0",
              boxShadow: "0 4px 6px -1px rgba(0, 0, 0, 0.1)",
              fontSize: "12px",
            }}
          />
          <Legend
            verticalAlign="top"
            align="right"
            wrapperStyle={{ paddingBottom: "12px", fontSize: "11px" }}
          />
          <Bar
            name="Chiffre d'Affaires (TND)"
            dataKey="revenue"
            fill="#0B69FF"
            radius={[4, 4, 0, 0]}
          />
          <Bar
            name="Dépenses & Achats (TND)"
            dataKey="expenses"
            fill="#F5A623"
            radius={[4, 4, 0, 0]}
          />
        </BarChart>
      </ResponsiveContainer>
    </div>
  );
}
