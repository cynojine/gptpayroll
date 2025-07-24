import * as React from 'react';

export interface Column<T> {
  header: string;
  accessor: keyof T;
  render?: (item: T) => React.ReactNode;
}

interface TableProps<T> {
  columns: Column<T>[];
  data: T[];
}

export const Table = <T extends { id: string | number },>({
  columns,
  data,
}: TableProps<T>): React.ReactNode => {
  return (
    <div className="overflow-x-auto bg-slate-800 rounded-lg shadow-lg">
      <table className="min-w-full text-sm text-left text-slate-300">
        <thead className="bg-slate-700 text-xs text-slate-400 uppercase tracking-wider">
          <tr>
            {columns.map((col) => (
              <th key={String(col.accessor)} scope="col" className="px-6 py-3">
                {col.header}
              </th>
            ))}
          </tr>
        </thead>
        <tbody>
          {data.map((item) => (
            <tr
              key={item.id}
              className="border-b border-slate-700 hover:bg-slate-700/50 transition-colors duration-150"
            >
              {columns.map((col) => (
                <td
                  key={`${item.id}-${String(col.accessor)}`}
                  className="px-6 py-4"
                >
                  {col.render ? col.render(item) : String(item[col.accessor])}
                </td>
              ))}
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
};
