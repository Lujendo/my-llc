import React from "react";
import { ArrowLeft } from "lucide-react";

// ponytail: tiny markdown renderer, no dependency. Covers exactly what the
// legal docs use (headings, bold, code, links, lists, tables, blockquote, hr).
// Content is our own trusted files, so dangerouslySetInnerHTML is acceptable.
const esc = (s: string) =>
  s.replace(/&/g, "&amp;").replace(/</g, "&lt;").replace(/>/g, "&gt;");

const inline = (s: string) =>
  esc(s)
    .replace(/\*\*(.+?)\*\*/g, "<strong>$1</strong>")
    .replace(
      /`(.+?)`/g,
      '<code class="px-1 py-0.5 rounded bg-gray-100 dark:bg-gray-700 text-sm">$1</code>'
    )
    .replace(
      /\[([^\]]+)\]\(([^)]+)\)/g,
      '<a href="$2" class="text-blue-600 underline">$1</a>'
    );

const cells = (row: string) =>
  row.trim().replace(/^\|/, "").replace(/\|$/, "").split("|").map((c) => c.trim());

function renderTable(rows: string[]): string {
  const head = cells(rows[0]);
  const body = rows.slice(2).map(cells);
  const th = head
    .map(
      (c) =>
        `<th class="border border-gray-300 dark:border-gray-600 px-3 py-2 text-left font-semibold">${inline(c)}</th>`
    )
    .join("");
  const trs = body
    .map(
      (r) =>
        `<tr>${r
          .map(
            (c) =>
              `<td class="border border-gray-300 dark:border-gray-600 px-3 py-2 align-top">${inline(c)}</td>`
          )
          .join("")}</tr>`
    )
    .join("");
  return `<div class="overflow-x-auto my-4"><table class="w-full border-collapse text-sm"><thead><tr>${th}</tr></thead><tbody>${trs}</tbody></table></div>`;
}

export function renderMarkdown(md: string): string {
  const lines = md.split("\n");
  const html: string[] = [];
  let i = 0;
  while (i < lines.length) {
    const line = lines[i];

    if (/^\s*\|/.test(line)) {
      const rows: string[] = [];
      while (i < lines.length && /^\s*\|/.test(lines[i])) rows.push(lines[i++]);
      html.push(renderTable(rows));
      continue;
    }

    if (/^>\s?/.test(line)) {
      const buf: string[] = [];
      while (i < lines.length && /^>\s?/.test(lines[i]))
        buf.push(lines[i++].replace(/^>\s?/, ""));
      html.push(
        `<blockquote class="my-4 border-l-4 border-amber-400 bg-amber-50 dark:bg-amber-900/20 px-4 py-3 text-sm text-amber-900 dark:text-amber-200 rounded-r">${buf
          .map(inline)
          .join("<br/>")}</blockquote>`
      );
      continue;
    }

    const h = line.match(/^(#{1,6})\s+(.*)$/);
    if (h) {
      const lvl = h[1].length;
      const sizes: Record<number, string> = {
        1: "text-3xl mt-8 mb-4",
        2: "text-2xl mt-8 mb-3",
        3: "text-xl mt-6 mb-2",
        4: "text-lg mt-4 mb-2",
        5: "text-base mt-4 mb-1",
        6: "text-sm mt-4 mb-1",
      };
      html.push(
        `<h${lvl} class="font-bold text-gray-900 dark:text-white ${sizes[lvl]}">${inline(h[2])}</h${lvl}>`
      );
      i++;
      continue;
    }

    if (/^---+\s*$/.test(line)) {
      html.push('<hr class="my-6 border-gray-200 dark:border-gray-700"/>');
      i++;
      continue;
    }

    if (/^\s*[-*]\s+/.test(line)) {
      const items: string[] = [];
      while (i < lines.length && /^\s*[-*]\s+/.test(lines[i]))
        items.push(lines[i++].replace(/^\s*[-*]\s+/, ""));
      html.push(
        `<ul class="list-disc pl-6 my-3 space-y-1 text-gray-700 dark:text-gray-300">${items
          .map((t) => `<li>${inline(t)}</li>`)
          .join("")}</ul>`
      );
      continue;
    }

    if (/^\s*\d+\.\s+/.test(line)) {
      const items: string[] = [];
      while (i < lines.length && /^\s*\d+\.\s+/.test(lines[i]))
        items.push(lines[i++].replace(/^\s*\d+\.\s+/, ""));
      html.push(
        `<ol class="list-decimal pl-6 my-3 space-y-1 text-gray-700 dark:text-gray-300">${items
          .map((t) => `<li>${inline(t)}</li>`)
          .join("")}</ol>`
      );
      continue;
    }

    if (/^\s*$/.test(line)) {
      i++;
      continue;
    }

    html.push(
      `<p class="my-3 text-gray-700 dark:text-gray-300 leading-relaxed">${inline(line)}</p>`
    );
    i++;
  }
  return html.join("\n");
}

interface LegalPageProps {
  title: string;
  markdown: string;
  onBack: () => void;
}

export const LegalPage: React.FC<LegalPageProps> = ({ title, markdown, onBack }) => (
  <div className="min-h-screen bg-white dark:bg-gray-900">
    <div className="sticky top-0 z-10 bg-white/95 dark:bg-gray-900/95 border-b border-gray-200 dark:border-gray-700">
      <div className="max-w-3xl mx-auto px-4 py-3 flex items-center gap-3">
        <button
          onClick={onBack}
          className="inline-flex items-center gap-1 text-blue-600 hover:underline text-sm font-medium"
        >
          <ArrowLeft className="w-4 h-4" /> Back
        </button>
        <h1 className="text-lg font-bold text-gray-900 dark:text-white">{title}</h1>
      </div>
    </div>
    <article
      className="max-w-3xl mx-auto px-4 py-8"
      dangerouslySetInnerHTML={{ __html: renderMarkdown(markdown) }}
    />
  </div>
);
