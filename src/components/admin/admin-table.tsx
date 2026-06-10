export function AdminTable({ children }: { children: React.ReactNode }) {
  return <div className="admin-table-wrap"><table className="admin-table">{children}</table></div>;
}

export function AdminEmpty({ text }: { text: string }) {
  return <div className="admin-empty">{text}</div>;
}
