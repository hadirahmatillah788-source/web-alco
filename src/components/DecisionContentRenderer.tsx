"use client";

import React from "react";

interface DecisionContentRendererProps {
  content: string;
}

export function DecisionContentRenderer({ content }: DecisionContentRendererProps) {
  if (!content) return null;

  // Split lines into blocks: tables, headers, lists, paragraphs
  const lines = content.split("\n");
  const blocks: React.ReactNode[] = [];

  let inTable = false;
  let tableLines: string[] = [];

  const flushTable = (indexKey: number) => {
    if (tableLines.length >= 2) {
      // Parse table
      const headerLine = tableLines[0];
      const dataLines = tableLines.slice(2); // Skip separator line | :--- | :--- |

      const headers = headerLine
        .split("|")
        .map((s) => s.trim())
        .filter((s, idx, arr) => (idx === 0 && s === "") || (idx === arr.length - 1 && s === "") ? false : true);

      const rows = dataLines.map((line) => {
        return line
          .split("|")
          .map((s) => s.trim())
          .filter((s, idx, arr) => (idx === 0 && s === "") || (idx === arr.length - 1 && s === "") ? false : true);
      });

      blocks.push(
        <div key={`table-${indexKey}`} className="my-4 border border-slate-200/90 rounded-xl overflow-x-auto shadow-2xs">
          <table className="min-w-full divide-y divide-slate-200 text-left text-xs border-collapse">
            <thead>
              <tr className="bg-slate-100/90 text-slate-700 font-semibold border-b border-slate-200">
                {headers.map((h, hIdx) => (
                  <th key={hIdx} className="px-3.5 py-2.5 font-bold text-[11px] text-slate-800">
                    {formatInline(h)}
                  </th>
                ))}
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100 bg-white">
              {rows.map((row, rIdx) => (
                <tr
                  key={rIdx}
                  className={rIdx % 2 === 0 ? "bg-white hover:bg-slate-50 transition-colors" : "bg-slate-50/50 hover:bg-slate-50 transition-colors"}
                >
                  {row.map((cell, cIdx) => (
                    <td key={cIdx} className="px-3.5 py-2 text-xs text-slate-800 font-normal">
                      {formatInline(cell)}
                    </td>
                  ))}
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      );
    }
    tableLines = [];
    inTable = false;
  };

  for (let i = 0; i < lines.length; i++) {
    const line = lines[i];
    const trimmed = line.trim();

    // Check if table row
    if (trimmed.startsWith("|") && trimmed.endsWith("|")) {
      inTable = true;
      tableLines.push(trimmed);
      continue;
    } else if (inTable) {
      flushTable(i);
    }

    // Skip empty lines
    if (!trimmed) {
      blocks.push(<div key={`spacer-${i}`} className="h-3" />);
      continue;
    }

    // Headers
    if (trimmed.startsWith("### ")) {
      blocks.push(
        <h4 key={`h3-${i}`} className="text-base font-bold text-slate-900 mt-5 mb-2 flex items-center gap-2">
          <span className="w-1.5 h-4 bg-blue-600 rounded-full inline-block" />
          {formatInline(trimmed.replace(/^###\s*/, ""))}
        </h4>
      );
      continue;
    }
    if (trimmed.startsWith("## ")) {
      blocks.push(
        <h3 key={`h2-${i}`} className="text-lg font-bold text-slate-900 mt-6 mb-3 border-b border-slate-200 pb-1.5">
          {formatInline(trimmed.replace(/^##\s*/, ""))}
        </h3>
      );
      continue;
    }

    // Bullet lists
    if (trimmed.startsWith("- ") || trimmed.startsWith("* ")) {
      blocks.push(
        <li key={`li-${i}`} className="ml-5 list-disc text-sm text-slate-700 leading-relaxed mb-1.5 marker:text-blue-500">
          {formatInline(trimmed.replace(/^[-*]\s*/, ""))}
        </li>
      );
      continue;
    }

    // Numbered lists
    const numMatch = trimmed.match(/^(\d+)\.\s+(.*)/);
    if (numMatch) {
      blocks.push(
        <div key={`num-${i}`} className="flex items-start gap-2 text-sm text-slate-700 leading-relaxed mb-1.5 ml-2">
          <span className="font-semibold text-blue-600 min-w-5">{numMatch[1]}.</span>
          <div>{formatInline(numMatch[2])}</div>
        </div>
      );
      continue;
    }

    // Regular paragraph
    blocks.push(
      <p key={`p-${i}`} className="text-sm text-slate-700 leading-relaxed mb-3">
        {formatInline(trimmed)}
      </p>
    );
  }

  if (inTable) {
    flushTable(lines.length);
  }

  return <div className="space-y-0.5 text-slate-800">{blocks}</div>;
}

// Inline formatting for **bold** and `code`
function formatInline(text: string): React.ReactNode {
  if (!text) return "";

  // Split by **bold**
  const parts = text.split(/(\*\*.*?\*\*)/g);
  return parts.map((part, index) => {
    if (part.startsWith("**") && part.endsWith("**")) {
      return (
        <strong key={index} className="font-semibold text-slate-900">
          {part.slice(2, -2)}
        </strong>
      );
    }
    return part;
  });
}
