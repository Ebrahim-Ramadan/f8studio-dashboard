import React from "react";

export const Table = ({ children, className }: { children: React.ReactNode; className?: string }) => (
  <div style={{ overflowX: "auto" }} className={className}>{children}</div>
);

export const TableElement = ({ children }: { children: React.ReactNode }) => (
  <table style={{ width: "100%", borderCollapse: "collapse", tableLayout: "auto" }}>{children}</table>
);

export const TableHeader = ({ children }: { children: React.ReactNode }) => (
  <thead style={{ background: "rgba(8,17,31,0.6)", color: "#9cafcc" }}>{children}</thead>
);

export const TableBody = ({ children }: { children: React.ReactNode }) => (
  <tbody>{children}</tbody>
);

export const TableRow = ({ children }: { children: React.ReactNode }) => (
  <tr style={{ borderBottom: "1px solid rgba(255,255,255,0.03)" }}>{children}</tr>
);

export const TableHead = ({ children, style }: { children: React.ReactNode; style?: React.CSSProperties }) => (
  <th
    style={{
      textAlign: "left",
      padding: "10px 12px",
      fontSize: 12,
      minWidth: 140,
      whiteSpace: "nowrap",
      ...style
    }}
  >
    {children}
  </th>
);

export const TableCell = ({ children, style }: { children: React.ReactNode; style?: React.CSSProperties }) => (
  <td
    style={{
      padding: "10px 12px",
      fontSize: 13,
      verticalAlign: "top",
      minWidth: 160,
      whiteSpace: "normal",
      wordBreak: "break-word",
      ...style
    }}
  >
    {children}
  </td>
);

export default Table;
