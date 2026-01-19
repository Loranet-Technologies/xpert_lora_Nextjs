'use client';

import * as React from 'react';
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table';

interface ColumnDef<T> {
  accessorKey?: string;
  id?: string;
  header: string;
  cell?: (info: { row: { original: T; getValue: (key: string) => any } }) => React.ReactNode;
}

interface DataTableProps<T> {
  data: T[];
  columns: ColumnDef<T>[];
  header?: React.ReactNode;
}

export function DataTable<T>({ data, columns, header }: DataTableProps<T>) {
  return (
    <div className="space-y-4">
      {header && (
        <div className="flex items-center justify-between">
          {header}
        </div>
      )}
      <div className="rounded-md border">
        <Table>
          <TableHeader>
            <TableRow>
              {columns.map((column) => (
                <TableHead key={column.id || column.accessorKey || column.header}>
                  {column.header}
                </TableHead>
              ))}
            </TableRow>
          </TableHeader>
          <TableBody>
            {data.length === 0 ? (
              <TableRow>
                <TableCell colSpan={columns.length} className="h-24 text-center">
                  No results.
                </TableCell>
              </TableRow>
            ) : (
              data.map((row, rowIndex) => (
                <TableRow key={rowIndex}>
                  {columns.map((column) => {
                    const value = column.accessorKey
                      ? (row as any)[column.accessorKey]
                      : undefined;
                    return (
                      <TableCell key={column.id || column.accessorKey || column.header}>
                        {column.cell
                          ? column.cell({
                              row: {
                                original: row,
                                getValue: (key: string) => (row as any)[key],
                              },
                            })
                          : value !== undefined
                            ? String(value)
                            : ''}
                      </TableCell>
                    );
                  })}
                </TableRow>
              ))
            )}
          </TableBody>
        </Table>
      </div>
    </div>
  );
}
