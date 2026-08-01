export type Column<T> = {
  key: string;
  header: string;
  render: (row: T) => React.ReactNode;
};

export function DataTable<T extends { id: string }>({
  columns,
  rows,
  emptyMessage = 'No records found.',
}: {
  columns: Column<T>[];
  rows: T[];
  emptyMessage?: string;
}) {
  if (rows.length === 0) {
    return <div className="empty-state">{emptyMessage}</div>;
  }

  return (
    <div className="table-wrap">
      <table className="data-table">
        <thead>
          <tr>
            {columns.map((col) => (
              <th key={col.key} scope="col">
                {col.header}
              </th>
            ))}
          </tr>
        </thead>
        <tbody>
          {rows.map((row) => (
            <tr key={row.id}>
              {columns.map((col) => (
                <td key={col.key}>{col.render(row)}</td>
              ))}
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}
