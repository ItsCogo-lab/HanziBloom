import type { ReactNode } from 'react'

type DataTableProps = {
  /** id del título que describe la tabla (para lectores de pantalla). */
  labelledBy: string
  headers: readonly string[]
  /** Filas; la primera celda de cada fila hace de encabezado de fila. */
  rows: readonly (readonly ReactNode[])[]
}

/** Tabla sencilla y accesible, con las cifras alineadas a la derecha. */
export function DataTable({ labelledBy, headers, rows }: DataTableProps) {
  return (
    <div className="overflow-x-auto">
      <table aria-labelledby={labelledBy} className="w-full text-left">
        <thead>
          <tr className="border-b border-line text-sm text-ink-muted">
            {headers.map((header, index) => (
              <th key={header} scope="col" className={`py-2 font-medium ${index > 0 ? 'pl-4 text-right' : 'pr-4'}`}>
                {header}
              </th>
            ))}
          </tr>
        </thead>
        <tbody className="divide-y divide-line">
          {rows.map(([first, ...rest], rowIndex) => (
            <tr key={rowIndex}>
              <th scope="row" className="py-2 pr-4 font-normal">
                {first}
              </th>
              {rest.map((cell, cellIndex) => (
                <td key={cellIndex} className="py-2 pl-4 text-right tabular-nums">
                  {cell}
                </td>
              ))}
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  )
}
