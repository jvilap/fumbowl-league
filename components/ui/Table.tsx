import React from "react";

export interface Column<T> {
  key: string;
  header: string;
  cell: (row: T, index: number) => React.ReactNode;
  align?: "left" | "center" | "right";
  className?: string;
  headerClassName?: string;
}

interface TableProps<T> {
  columns: Column<T>[];
  rows: T[];
  rowKey: (row: T) => string | number;
}

export function Table<T>({ columns, rows, rowKey }: TableProps<T>) {
  const alignClass = {
    left: "text-left",
    center: "text-center",
    right: "text-right",
  };

  return (
    <div className="overflow-x-auto">
      <table className="w-full border-collapse">
        <thead className="sticky top-0 z-10 bg-surface">
          <tr className="border-b border-rim">
            {columns.map((col) => (
              <th
                key={col.key}
                className={`px-4 py-3 font-cinzel text-xs uppercase tracking-widest text-parchment-faint whitespace-nowrap ${alignClass[col.align ?? "left"]} ${col.headerClassName ?? ""}`}
              >
                {col.header}
              </th>
            ))}
          </tr>
        </thead>
        <tbody>
          {rows.map((row, index) => (
            <tr
              key={rowKey(row)}
              style={
                {
                  "--row-index": index,
                  animationDelay: `${index * 20}ms`,
                  animation: "fadeSlideUp 0.3s ease both",
                } as React.CSSProperties
              }
              className="border-b border-rim bg-surface hover:bg-elevated hover:border-l-2 hover:border-l-gold transition-colors duration-150"
            >
              {columns.map((col) => (
                <td
                  key={col.key}
                  className={`px-4 py-3 ${alignClass[col.align ?? "left"]} ${col.className ?? ""}`}
                >
                  {col.cell(row, index)}
                </td>
              ))}
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}
