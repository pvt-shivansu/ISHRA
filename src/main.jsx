import React, { useEffect, useMemo, useRef, useState } from "react";
import { createRoot } from "react-dom/client";
import {
  Activity,
  ArrowLeft,
  ArrowRight,
  BookOpen,
  CalendarDays,
  Check,
  CheckCircle2,
  ChevronRight,
  CircleUserRound,
  Download,
  FileImage,
  FileText,
  GraduationCap,
  Languages,
  LogIn,
  Mic,
  Paperclip,
  Plus,
  Search,
  Settings,
  Sparkles,
  Upload,
  X,
  MessageCircle,
  Trash2,
  Target,
  Play,
  RotateCcw,
  Trophy,
  Clock3
} from "lucide-react";
import { supabase } from "./supabase";
import "./styles.css";

const API_BASE = "https://ishra-ai-backend.onrender.com/api";
const API_URL = `${API_BASE}/chat`;
const IMAGE_API_URL = `${API_BASE}/generate-image`;

const CLASS_MAP = {
  CHEM: { subject: "Applied Chemistry", short: "CHEM", teacher: "Dr. Kavita Dhariyal", code: "AAS102" },
  MATH: { subject: "Calculus & Linear Algebra", short: "MATH", teacher: "Dr. Shah Alam Siddiqui", code: "AAS103" },
  EE: { subject: "Fundamentals of Electrical Engineering", short: "EE", teacher: "Dr. Apoorva Srivastava", code: "AEE101" },
  PL: { subject: "Programming Languages", short: "PL", teacher: "Ms. Noorshaba Khatoon", code: "ACS101" },
  IKS: { subject: "Indian Knowledge System", short: "IKS", teacher: "Dr. Kaushal Yadav", code: "AAI104" },
  AI: { subject: "Introduction to AI & Prompt Engineering", short: "AI", teacher: "Ms. Kishu Kumari", code: "AAI101" },
  EVS: { subject: "Environment & Sustainability", short: "EVS", teacher: "Mr. Gaurav Kumar Gupta", code: "AAC101" },
  LIBRARY: { subject: "Library", short: "Library", teacher: "Mr. Udit Narain", code: "LIB" },
  LUNCH: { subject: "Lunch Break", short: "Lunch", teacher: "", code: "" },
  IDT1: { subject: "Innovation & Design Thinking Lab", short: "IDT Lab-I", teacher: "Mr. Gaurav Kumar Gupta", code: "AID151" },
  IDT2: { subject: "Innovation & Design Thinking Lab", short: "IDT Lab-II", teacher: "Mr. Gaurav Kumar Gupta", code: "AID151" },
  EE_LAB1: { subject: "Electrical Engineering Lab", short: "EE Lab-I", teacher: "Dr. Apoorva Srivastava", code: "AEE151" },
  EE_LAB2: { subject: "Electrical Engineering Lab", short: "EE Lab-II", teacher: "Dr. Apoorva Srivastava", code: "AEE151" },
  CHEM_LAB1: { subject: "Applied Chemistry Lab", short: "Chem Lab-I", teacher: "Dr. Kavita Dhariyal", code: "AAS152" },
  CHEM_LAB2: { subject: "Applied Chemistry Lab", short: "Chem Lab-II", teacher: "Dr. Kavita Dhariyal", code: "AAS152" },
  T_PL: { subject: "Programming Languages", short: "T/PL", teacher: "Ms. Noorshaba Khatoon", code: "ACS101" },
  T_MATH: { subject: "Calculus & Linear Algebra", short: "T/MATH", teacher: "Dr. Shah Alam Siddiqui", code: "AAS103" },
  T_EE: { subject: "Fundamentals of Electrical Engineering", short: "T/EE", teacher: "Dr. Apoorva Srivastava", code: "AEE101" }
};

const DAY_ORDER = [
  "Monday",
  "Tuesday",
  "Wednesday",
  "Thursday",
  "Friday",
  "Saturday"
];

const WEEKLY_TIMETABLE = {
  Monday: [
    ["09:00", "10:00", "CHEM"],
    ["10:00", "11:00", "EE"],
    ["11:00", "12:00", "PL"],
    ["12:00", "13:00", "MATH"],
    ["13:00", "14:00", "LUNCH"],
    ["14:00", "17:00", "EE_LAB2 + CHEM_LAB1", "EE Lab-II / Chem Lab-I"]
  ],

  Tuesday: [
    ["09:00", "11:00", "IDT1"],
    ["11:00", "12:00", "MATH"],
    ["12:00", "13:00", "EE"],
    ["13:00", "14:00", "LUNCH"],
    ["14:00", "15:00", "T_PL"],
    ["15:00", "16:00", "CHEM"],
    ["16:00", "17:00", "LIBRARY"]
  ],

  Wednesday: [
    ["09:00", "10:00", "EE"],
    ["10:00", "11:00", "CHEM"],
    ["11:00", "12:00", "IKS"],
    ["12:00", "13:00", "PL"],
    ["13:00", "14:00", "LUNCH"],
    ["14:00", "15:00", "MATH"],
    ["15:00", "17:00", "IDT2 + EE_LAB1", "IDT Lab-II / EE Lab-I"]
  ],

  Thursday: [
    ["09:00", "10:00", "AI"],
    ["10:00", "11:00", "MATH"],
    ["11:00", "12:00", "PL"],
    ["12:00", "13:00", "CHEM"],
    ["13:00", "14:00", "LUNCH"],
    ["14:00", "15:00", "EVS"],
    ["15:00", "16:00", "T_MATH"],
    ["16:00", "17:00", "AI"]
  ],

  Friday: [
    ["09:00", "10:00", "MATH"],
    ["10:00", "11:00", "MATH"],
    ["11:00", "12:00", "AI"],
    ["12:00", "13:00", "PL"],
    ["13:00", "14:00", "LUNCH"],
    ["14:00", "15:00", "T_EE"],
    ["15:00", "16:00", "CHEM"],
    ["16:00", "17:00", "EVS"]
  ],

  Saturday: []
};

const MATERIAL_DB = "ishra_material_files";
const MATERIAL_STORE = "files";

function makeId() {
  return crypto.randomUUID
    ? crypto.randomUUID()
    : `${Date.now()}-${Math.random().toString(36).slice(2)}`;
}

function makeChatTitle(messages = []) {
  const first = messages.find(
    (item) => item.role === "student" && item.text
  );

  if (!first) return "New Chat";

  const clean = String(first.text)
    .replace(/\s+/g, " ")
    .trim();

  return clean.length > 34
    ? `${clean.slice(0, 34)}…`
    : clean;
}

function createChatSession(messages = [], context = null) {
  return {
    id: makeId(),
    title: makeChatTitle(messages),
    messages,
    context,
    createdAt: Date.now(),
    updatedAt: Date.now()
  };
}

function loadChatSessions() {
  try {
    const stored = JSON.parse(
      localStorage.getItem("ishra_chat_sessions") || "null"
    );

    if (Array.isArray(stored) && stored.length) {
      return stored;
    }

    const oldMessages = JSON.parse(
      localStorage.getItem("ishra_chat_history") || "[]"
    );

    if (Array.isArray(oldMessages) && oldMessages.length) {
      return [createChatSession(oldMessages)];
    }
  } catch {
    // ignore corrupted local data
  }

  return [createChatSession()];
}

function openMaterialDB() {
  return new Promise((resolve, reject) => {
    if (!("indexedDB" in window)) return resolve(null);

    const request = indexedDB.open(MATERIAL_DB, 1);

    request.onupgradeneeded = () => {
      if (
        !request.result.objectStoreNames.contains(
          MATERIAL_STORE
        )
      ) {
        request.result.createObjectStore(
          MATERIAL_STORE
        );
      }
    };

    request.onsuccess = () => resolve(request.result);
    request.onerror = () => reject(request.error);
  });
}

async function saveMaterialFile(id, file) {
  try {
    const db = await openMaterialDB();

    if (!db) return false;

    await new Promise((resolve, reject) => {
      const tx = db.transaction(
        MATERIAL_STORE,
        "readwrite"
      );

      tx.objectStore(MATERIAL_STORE).put(
        file,
        id
      );

      tx.oncomplete = resolve;
      tx.onerror = () => reject(tx.error);
    });

    return true;
  } catch {
    return false;
  }
}

async function readMaterialFile(id) {
  try {
    const db = await openMaterialDB();

    if (!db) return null;

    return await new Promise((resolve, reject) => {
      const tx = db.transaction(
        MATERIAL_STORE,
        "readonly"
      );

      const request = tx
        .objectStore(MATERIAL_STORE)
        .get(id);

      request.onsuccess = () =>
        resolve(request.result || null);

      request.onerror = () =>
        reject(request.error);
    });
  } catch {
    return null;
  }
}

function fileToDataURL(file) {
  return new Promise((resolve, reject) => {
    const reader = new FileReader();

    reader.onload = () =>
      resolve(reader.result);

    reader.onerror = reject;

    reader.readAsDataURL(file);
  });
}

async function prepareImageForAI(file) {
  if (!file) return null;

  return new Promise((resolve, reject) => {
    const reader = new FileReader();

    reader.onload = () => {
      const img = new Image();

      img.onload = () => {
        try {
          const maxSize = 1800;

          let width = img.naturalWidth || img.width;
          let height = img.naturalHeight || img.height;

          if (!width || !height) {
            reject(new Error("Invalid image dimensions"));
            return;
          }

          if (width > maxSize || height > maxSize) {
            const scale = Math.min(
              maxSize / width,
              maxSize / height
            );

            width = Math.round(width * scale);
            height = Math.round(height * scale);
          }

          const canvas = document.createElement("canvas");

          canvas.width = width;
          canvas.height = height;

          const ctx = canvas.getContext("2d");

          if (!ctx) {
            reject(new Error("Canvas context unavailable"));
            return;
          }

          ctx.drawImage(
            img,
            0,
            0,
            width,
            height
          );

          const dataUrl = canvas.toDataURL(
            "image/jpeg",
            0.88
          );

          if (
            !dataUrl ||
            !dataUrl.startsWith("data:image/jpeg;base64,")
          ) {
            reject(new Error("Image conversion failed"));
            return;
          }

          resolve(dataUrl);
        } catch (error) {
          reject(error);
        }
      };

      img.onerror = () => {
        reject(new Error("Browser could not decode image"));
      };

      img.src = reader.result;
    };

    reader.onerror = () => {
      reject(new Error("File could not be read"));
    };

    reader.readAsDataURL(file);
  });
}



function classEntriesForDay(
  day,
  date = new Date()
) {
  if (day === "Saturday") {
    const dayOfMonth = date.getDate();
    const weekOfMonth =
      Math.ceil(dayOfMonth / 7);

    if (weekOfMonth !== 5) return [];

    return WEEKLY_TIMETABLE.Monday;
  }

  return WEEKLY_TIMETABLE[day] || [];
}

function timeToMinutes(time) {
  if (!time || typeof time !== "string") {
    return 0;
  }

  const parts = time
    .split(":")
    .map(Number);

  if (
    parts.length < 2 ||
    Number.isNaN(parts[0]) ||
    Number.isNaN(parts[1])
  ) {
    return 0;
  }

  return parts[0] * 60 + parts[1];
}

function formatTime(value) {
  const [h, m] = value
    .split(":")
    .map(Number);

  const suffix =
    h >= 12 ? "PM" : "AM";

  const hour =
    h % 12 || 12;

  return `${String(hour).padStart(
    2,
    "0"
  )}:${String(m).padStart(
    2,
    "0"
  )} ${suffix}`;
}

function entryLabel(code) {
  if (code.includes("+")) {
    return code
      .split("+")
      .map(
        (item) =>
          CLASS_MAP[item]?.short || item
      )
      .join(" / ");
  }

  return CLASS_MAP[code]?.short || code;
}

function entryTeacher(code) {
  if (code.includes("+")) {
    return code
      .split("+")
      .map(
        (item) =>
          CLASS_MAP[item]?.teacher
      )
      .filter(Boolean)
      .join(" / ");
  }

  return CLASS_MAP[code]?.teacher || "";
}

function entrySubject(code) {
  if (code.includes("+")) {
    return code
      .split("+")
      .map(
        (item) =>
          CLASS_MAP[item]?.subject
      )
      .filter(Boolean)
      .join(" / ");
  }

  return (
    CLASS_MAP[code]?.subject ||
    code
  );
}

function getDayName(date) {
  return date.toLocaleDateString(
    "en-US",
    {
      weekday: "long"
    }
  );
}

function getDayEntries(date = new Date()) {
  const day = getDayName(date);
  return classEntriesForDay(day, date);
}

function getScheduleState(
  date = new Date()
) {
  const now =
    date.getHours() * 60 +
    date.getMinutes();

  const today = getDayName(date);

  const entries =
    getDayEntries(date);

  const classes = entries.map(
    (item, index) => ({
      id: `${today}-${index}`,
      start: item[0],
      end: item[1],
      code: item[2],
      customLabel: item[3] || "",
      day: today
    })
  );

  const currentIndex =
    classes.findIndex(
      (item) =>
        now >=
          timeToMinutes(item.start) &&
        now <
          timeToMinutes(item.end)
    );

  let previous =
    [...classes]
      .reverse()
      .find(
        (item) =>
          timeToMinutes(item.end) <= now
      ) || null;

  let upcoming =
    classes.find(
      (item) =>
        timeToMinutes(item.start) >
        now
    ) || null;

  const shiftDate = (
    base,
    amount
  ) => {
    const next =
      new Date(base);

    next.setDate(
      next.getDate() + amount
    );

    return next;
  };

  if (!upcoming) {
    for (
      let offset = 1;
      offset <= 7 && !upcoming;
      offset += 1
    ) {
      const d =
        shiftDate(date, offset);

      const dayEntries =
        getDayEntries(d);

      const first =
        dayEntries[0];

      if (first) {
        upcoming = {
          start: first[0],
          end: first[1],
          code: first[2],
          customLabel:
            first[3] || "",
          day: getDayName(d),
          nextDay: true
        };
      }
    }
  }

  if (!previous) {
    for (
      let offset = 1;
      offset <= 7 && !previous;
      offset += 1
    ) {
      const d =
        shiftDate(date, -offset);

      const dayEntries =
        getDayEntries(d);

      const last =
        dayEntries[
          dayEntries.length - 1
        ];

      if (last) {
        previous = {
          start: last[0],
          end: last[1],
          code: last[2],
          customLabel:
            last[3] || "",
          day: getDayName(d),
          previousDay: true
        };
      }
    }
  }

  return {
    classes,
    currentIndex,
    current:
      currentIndex >= 0
        ? classes[currentIndex]
        : null,
    previous,
    upcoming
  };
}

function IshraLogo({
  size = "normal",
  className = ""
}) {
  return (
    <img
      src="/ishra.png"
      alt="ISHRA"
      className={`ishra-logo ${size} ${className}`}
    />
  );
}

/* =========================================================
   MARKDOWN RENDERER
========================================================= */

function escapeMathHtml(value) {
  return String(value)
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/"/g, "&quot;")
    .replace(/'/g, "&#39;");
}

function mathToHtml(value) {
  let html = escapeMathHtml(value)
    .replace(/\\left/g, "")
    .replace(/\\right/g, "")
    .replace(/\\,/g, " ")
    .replace(/\\times/g, "×")
    .replace(/\\cdot/g, "·")
    .replace(/\\leq/g, "≤")
    .replace(/\\geq/g, "≥")
    .replace(/\\neq/g, "≠")
    .replace(/\\pm/g, "±")
    .replace(/\\infty/g, "∞")
    .replace(/\\pi/g, "π")
    .replace(/\\theta/g, "θ")
    .replace(/\\alpha/g, "α")
    .replace(/\\beta/g, "β")
    .replace(/\\gamma/g, "γ")
    .replace(/\\lambda/g, "λ")
    .replace(/\\Delta/g, "Δ")
    .replace(/\\sum/g, "Σ")
    .replace(/\\sqrt\{([^{}]+)\}/g, '<span class="math-root">√<span>$1</span></span>')
    .replace(/\\frac\{([^{}]+)\}\{([^{}]+)\}/g, '<span class="math-frac"><span>$1</span><span>$2</span></span>')
    .replace(/\\(sin|cos|tan|log|ln)/g, '$1')
    .replace(/\^\{([^{}]+)\}/g, '<sup>$1</sup>')
    .replace(/_\{([^{}]+)\}/g, '<sub>$1</sub>')
    .replace(/\^([A-Za-z0-9]+)/g, '<sup>$1</sup>')
    .replace(/_([A-Za-z0-9]+)/g, '<sub>$1</sub>');
  return html;
}

function MathText({ text }) {
  const value = String(text || "");
  const parts = value.split(/(\$\$[\s\S]+?\$\$|\\\[[\s\S]+?\\\]|\\\([\s\S]+?\\\))/g);
  return <span className="math-text">{parts.map((part, index) => {
    const isMath = /^\$\$[\s\S]+\$\$$/.test(part) || /^\\\[[\s\S]+\\\]$/.test(part) || /^\\\([\s\S]+\\\)$/.test(part);
    if (!isMath) return <React.Fragment key={index}>{part}</React.Fragment>;
    const expression = part.replace(/^\$\$|\$\$$/g, "").replace(/^\\\[|\\\]$/g, "").replace(/^\\\(|\\\)$/g, "").trim();
    return <span key={index} className="math-expression" dangerouslySetInnerHTML={{ __html: mathToHtml(expression) }} />;
  })}</span>;
}

function renderInline(value) {
  const cleanedValue = String(value).replace(/--+/g, "—");
  if (/^\s*(\$\$[\s\S]+\$\$|\\\[[\s\S]+\\\]|\\\([\s\S]+\\\))\s*$/.test(cleanedValue)) {
    return <MathText text={cleanedValue} />;
  }
  const parts = cleanedValue.split(
    /(\$\$[\s\S]+?\$\$|\\\[[\s\S]+?\\\]|\\\([\s\S]+?\\\)|\*\*[^*]+\*\*|__[^_]+__|`[^`]+`|\[[^\]]+\]\([^)]+\))/
  );

  return parts.map(
    (part, index) => {
      if (/^\$\$[\s\S]+\$\$$/.test(part) || /^\\\[[\s\S]+\\\]$/.test(part) || /^\\\([\s\S]+\\\)$/.test(part)) {
        return <MathText key={index} text={part} />;
      }

      if (
        part.startsWith("**") &&
        part.endsWith("**")
      ) {
        return (
          <strong key={index}>
            {part.slice(2, -2)}
          </strong>
        );
      }

      if (
        part.startsWith("__") &&
        part.endsWith("__")
      ) {
        return (
          <strong key={index}>
            {part.slice(2, -2)}
          </strong>
        );
      }

      if (
        part.startsWith("`") &&
        part.endsWith("`")
      ) {
        return (
          <code key={index}>
            {part.slice(1, -1)}
          </code>
        );
      }

      const link =
        part.match(
          /^\[([^\]]+)\]\(([^)]+)\)$/
        );

      if (link) {
        return (
          <a
            key={index}
            href={link[2]}
            target="_blank"
            rel="noreferrer"
          >
            {link[1]}
          </a>
        );
      }

      return part;
    }
  );
}

function parseTableRow(line) {
  return line
    .trim()
    .replace(/^\|/, "")
    .replace(/\|$/, "")
    .split("|")
    .map((cell) => cell.trim());
}

function isTableSeparator(line) {
  const cells =
    parseTableRow(line);

  return (
    cells.length >= 2 &&
    cells.every((cell) =>
      /^:?-{3,}:?$/.test(cell)
    )
  );
}

function MarkdownText({ text }) {
  const lines =
    String(text || "").split("\n");

  const blocks = [];
  let i = 0;

  while (i < lines.length) {
    const line =
      lines[i] || "";

    const trimmed =
      line.trim();

    if (!trimmed) {
      blocks.push({
        type: "space",
        key: i
      });

      i += 1;
      continue;
    }

    /* CODE BLOCK */
    if (
      trimmed.startsWith("```")
    ) {
      const language =
        trimmed
          .replace(/^```/, "")
          .trim();

      const codeLines = [];

      i += 1;

      while (
        i < lines.length &&
        !lines[i]
          .trim()
          .startsWith("```")
      ) {
        codeLines.push(
          lines[i]
        );

        i += 1;
      }

      i += 1;

      blocks.push({
        type: "code",
        language,
        code: codeLines.join("\n"),
        key: `code-${i}`
      });

      continue;
    }

    /* TABLE */
    if (
      i + 1 < lines.length &&
      trimmed.includes("|") &&
      isTableSeparator(
        lines[i + 1]
      )
    ) {
      const headers =
        parseTableRow(line);

      const rows = [];

      i += 2;

      while (
        i < lines.length &&
        lines[i].trim() &&
        lines[i].includes("|")
      ) {
        rows.push(
          parseTableRow(
            lines[i]
          )
        );

        i += 1;
      }

      blocks.push({
        type: "table",
        headers,
        rows,
        key: `table-${i}`
      });

      continue;
    }

    if (
      /^#{1,6}\s/.test(trimmed)
    ) {
      const match =
        trimmed.match(
          /^(#{1,6})\s+(.*)$/
        );

      blocks.push({
        type: "heading",
        level:
          match?.[1]?.length || 3,
        text:
          match?.[2] || "",
        key: i
      });

      i += 1;
      continue;
    }

    if (
      /^[-*]\s+/.test(trimmed)
    ) {
      const bulletItems = [];

      while (
        i < lines.length &&
        /^[-*]\s+/.test(
          lines[i].trim()
        )
      ) {
        bulletItems.push(
          lines[i]
            .trim()
            .replace(
              /^[-*]\s+/,
              ""
            )
        );

        i += 1;
      }

      blocks.push({
        type: "bullets",
        items: bulletItems,
        key: `bullets-${i}`
      });

      continue;
    }

    if (
      /^\d+[.)]\s+/.test(trimmed)
    ) {
      const numberItems = [];

      while (
        i < lines.length &&
        /^\d+[.)]\s+/.test(
          lines[i].trim()
        )
      ) {
        const match =
          lines[i]
            .trim()
            .match(
              /^(\d+)[.)]\s+(.*)$/
            );

        numberItems.push({
          number:
            match?.[1] || "",
          text:
            match?.[2] || ""
        });

        i += 1;
      }

      blocks.push({
        type: "numbers",
        items: numberItems,
        key: `numbers-${i}`
      });

      continue;
    }

    blocks.push({
      type: "paragraph",
      text: trimmed,
      key: i
    });

    i += 1;
  }

  return (
    <div className="markdown-content">
      {blocks.map((block) => {
        if (block.type === "space") {
          return (
            <div
              className="md-space"
              key={block.key}
            />
          );
        }

        if (block.type === "heading") {
          return (
            <h4
              key={block.key}
              className={
                block.level <= 2
                  ? "md-heading-main"
                  : "md-heading"
              }
            >
              {renderInline(
                block.text
              )}
            </h4>
          );
        }

        if (block.type === "code") {
          return (
            <div
              className="md-code-box"
              key={block.key}
            >
              {block.language && (
                <div className="md-code-language">
                  {block.language}
                </div>
              )}

              <pre>
                <code>
                  {block.code}
                </code>
              </pre>
            </div>
          );
        }

        if (block.type === "table") {
          return (
            <div
              className="md-table-wrap"
              key={block.key}
            >
              <table className="md-table">
                <thead>
                  <tr>
                    {block.headers.map(
                      (header, index) => (
                        <th key={index}>
                          {renderInline(
                            header
                          )}
                        </th>
                      )
                    )}
                  </tr>
                </thead>

                <tbody>
                  {block.rows.map(
                    (row, rowIndex) => (
                      <tr key={rowIndex}>
                        {block.headers.map(
                          (_, cellIndex) => (
                            <td
                              key={
                                cellIndex
                              }
                            >
                              {renderInline(
                                row[
                                  cellIndex
                                ] || ""
                              )}
                            </td>
                          )
                        )}
                      </tr>
                    )
                  )}
                </tbody>
              </table>
            </div>
          );
        }

        if (
          block.type ===
          "bullets"
        ) {
          return (
            <div
              className="md-list"
              key={block.key}
            >
              {block.items.map(
                (item, index) => (
                  <div
                    className="md-bullet"
                    key={index}
                  >
                    <span>•</span>
                    <span>
                      {renderInline(
                        item
                      )}
                    </span>
                  </div>
                )
              )}
            </div>
          );
        }

        if (
          block.type ===
          "numbers"
        ) {
          return (
            <div
              className="md-list"
              key={block.key}
            >
              {block.items.map(
                (item, index) => (
                  <div
                    className="md-number"
                    key={index}
                  >
                    <b>
                      {item.number}.
                    </b>

                    <span>
                      {renderInline(
                        item.text
                      )}
                    </span>
                  </div>
                )
              )}
            </div>
          );
        }

        return (
          <p key={block.key}>
            {renderInline(
              block.text
            )}
          </p>
        );
      })}
    </div>
  );
}

/* =========================================================
   APP
========================================================= */

function App() {
  const initialChats =
    useMemo(
      () => loadChatSessions(),
      []
    );

  const [chatSessions, setChatSessions] =
    useState(initialChats);

  const [activeChatId, setActiveChatId] =
    useState(
      initialChats[0]?.id
    );

  const [chatDrawerOpen, setChatDrawerOpen] =
    useState(false);

  const [chatSearch, setChatSearch] =
    useState("");

  const [pendingImage, setPendingImage] =
    useState(null);

  const [screen, setScreen] =
    useState("login");

  const [name, setName] =
    useState(
      localStorage.getItem(
        "ishraName"
      ) || ""
    );

  const [email, setEmail] =
    useState("");

  const [branch, setBranch] =
    useState(
      localStorage.getItem(
        "ishraBranch"
      ) || ""
    );

  const [section, setSection] =
    useState(
      localStorage.getItem(
        "ishraSection"
      ) || ""
    );

  const [language, setLanguage] =
    useState(
      localStorage.getItem(
        "ishraLanguage"
      ) || ""
    );

  const [showLanguage, setShowLanguage] =
    useState(false);

  const [pendingTopicExplain, setPendingTopicExplain] =
    useState(false);

  const [chatWidth, setChatWidth] =
    useState(68);

  const [selectedSubject, setSelectedSubject] =
    useState(null);

  const [selectedUnit, setSelectedUnit] =
    useState(null);

  const [activeTopic, setActiveTopic] =
    useState(null);

  const [topicContext, setTopicContext] =
    useState(null);

  const [isTyping, setIsTyping] =
    useState(false);

  const [message, setMessage] =
    useState("");

  const [isListening, setIsListening] =
    useState(false);

  const [currentTime, setCurrentTime] =
    useState(new Date());

  const [theme, setTheme] =
    useState("dark");

  const [dbSubjects, setDbSubjects] =
    useState([]);

  const [units, setUnits] =
    useState([]);

  const [topics, setTopics] =
    useState([]);

  const [loadingSubjects, setLoadingSubjects] =
    useState(true);

  const [loadingUnits, setLoadingUnits] =
    useState(false);

  const [loadingTopics, setLoadingTopics] =
    useState(false);

  const [dbError, setDbError] =
    useState("");

  const [completedTopics, setCompletedTopics] =
    useState({});

  const [overallProgress, setOverallProgress] =
    useState(0);

  const [subjectProgress, setSubjectProgress] =
    useState({});

  const [savingProgress, setSavingProgress] =
    useState(false);

  const [materials, setMaterials] =
    useState(() => {
      try {
        return JSON.parse(
          localStorage.getItem(
            "ishra_materials"
          ) || "[]"
        );
      } catch {
        return [];
      }
    });

  const [materialSearch, setMaterialSearch] =
    useState("");

  const [quizConfig, setQuizConfig] =
    useState({
      subjectId: "",
      unitId: "",
      topicId: "",
      difficulty: "Moderate",
      count: 5,
      time: 5
    });

  const [quizUnits, setQuizUnits] = useState([]);
  const [quizTopics, setQuizTopics] = useState([]);
  const [quizQuestions, setQuizQuestions] = useState([]);
  const [quizAnswers, setQuizAnswers] = useState({});
  const [quizIndex, setQuizIndex] = useState(0);
  const [quizStarted, setQuizStarted] = useState(false);
  const [quizFinished, setQuizFinished] = useState(false);
  const [quizLoading, setQuizLoading] = useState(false);
  const [quizError, setQuizError] = useState("");
  const [quizSecondsLeft, setQuizSecondsLeft] = useState(0);
  const [quizHistory, setQuizHistory] = useState(() => {
    try { return JSON.parse(localStorage.getItem("ishra_quiz_history") || "[]"); } catch { return []; }
  });
  const [selectedQuizHistory, setSelectedQuizHistory] = useState(null);

  const [teachBack, setTeachBack] = useState({
    subjectId: "", unitId: "", topicId: "", duration: 2
  });
  const [teachUnits, setTeachUnits] = useState([]);
  const [teachTopics, setTeachTopics] = useState([]);
  const [teachText, setTeachText] = useState("");
  const [teachStarted, setTeachStarted] = useState(false);
  const [teachSeconds, setTeachSeconds] = useState(0);
  const [teachListening, setTeachListening] = useState(false);
  const [teachQuestions, setTeachQuestions] = useState([]);
  const [teachQuestionIndex, setTeachQuestionIndex] = useState(0);
  const [teachQuestionAnswer, setTeachQuestionAnswer] = useState("");
  const [teachResult, setTeachResult] = useState(null);
  const [teachLoading, setTeachLoading] = useState(false);
  const [teachHistory, setTeachHistory] = useState(() => {
    try { return JSON.parse(localStorage.getItem("ishra_teachback_history") || "[]"); } catch { return []; }
  });
  const [selectedTeachHistory, setSelectedTeachHistory] = useState(null);
  const [teachTimeUp, setTeachTimeUp] = useState(false);
  const teachRecognitionRef = useRef(null);

  const [materialSubject, setMaterialSubject] =
    useState("");

  const [showUploadModal, setShowUploadModal] =
    useState(false);

  const [plannerDay, setPlannerDay] =
    useState(
      getDayName(new Date())
    );

  const chatEndRef =
    useRef(null);

  const chatFileInputRef =
    useRef(null);

  const materialFileInputRef =
    useRef(null);

  const studentKey =
    `${branch || "CSE-AI"}-${section || "B-10"}`;

  const activeSession =
    chatSessions.find(
      (session) =>
        session.id === activeChatId
    ) ||
    chatSessions[0];

  const messages =
    activeSession?.messages || [];

  /* =====================================================
     CHAT STORE
  ===================================================== */

  const updateMessages = (
    updater,
    targetChatId = activeChatId
  ) => {
    setChatSessions(
      (previous) =>
        previous.map(
          (session) => {
            if (
              session.id !==
              targetChatId
            ) {
              return session;
            }

            const nextMessages =
              typeof updater ===
              "function"
                ? updater(
                    session.messages ||
                      []
                  )
                : updater;

            return {
              ...session,
              messages:
                nextMessages,
              title:
                makeChatTitle(
                  nextMessages
                ),
              updatedAt:
                Date.now()
            };
          }
        )
    );
  };

  const updateActiveChatContext =
    (context) => {
      setChatSessions(
        (previous) =>
          previous.map(
            (session) =>
              session.id ===
              activeChatId
                ? {
                    ...session,
                    context,
                    updatedAt:
                      Date.now()
                  }
                : session
          )
      );
    };

  useEffect(() => {
    /*
      Do not store image base64 in localStorage.
      It would make chat storage huge.
    */
    const safeSessions =
      chatSessions.map(
        (session) => ({
          ...session,
          messages:
            session.messages.map(
              (item) => {
                const {
                  imageData,
                  ...safeMessage
                } = item;

                return safeMessage;
              }
            )
        })
      );

    localStorage.setItem(
      "ishra_chat_sessions",
      JSON.stringify(
        safeSessions
      )
    );

    localStorage.setItem(
      "ishra_chat_history",
      JSON.stringify(
        messages
          .slice(-40)
          .map((item) => {
            const {
              imageData,
              ...safeMessage
            } = item;

            return safeMessage;
          })
      )
    );
  }, [
    chatSessions,
    messages
  ]);

  const newChat = () => {
    const newSession =
      createChatSession();

    setChatSessions(
      (previous) => [
        newSession,
        ...previous
      ]
    );

    setActiveChatId(
      newSession.id
    );

    setTopicContext(null);
    setActiveTopic(null);
    setPendingImage(null);
    setMessage("");
    setChatDrawerOpen(false);
  };

  const selectChat = (
    chatId
  ) => {
    const session =
      chatSessions.find(
        (item) =>
          item.id === chatId
      );

    if (!session) return;

    setActiveChatId(chatId);

    setTopicContext(
      session.context || null
    );

    setActiveTopic(
      session.context?.topic ||
        null
    );

    setPendingImage(null);
    setMessage("");
    setChatDrawerOpen(false);
    changeScreen("ishra");
  };

  const deleteChat = (
    chatId
  ) => {
    if (
      chatSessions.length ===
      1
    ) {
      newChat();
      return;
    }

    const remaining =
      chatSessions.filter(
        (item) =>
          item.id !== chatId
      );

    setChatSessions(
      remaining
    );

    if (
      chatId ===
      activeChatId
    ) {
      const next =
        remaining[0];

      setActiveChatId(
        next.id
      );

      setTopicContext(
        next.context || null
      );

      setActiveTopic(
        next.context?.topic ||
          null
      );
    }
  };

  const filteredChatSessions =
    useMemo(() => {
      const query =
        chatSearch
          .toLowerCase()
          .trim();

      return [...chatSessions]
        .sort(
          (a, b) =>
            b.updatedAt -
            a.updatedAt
        )
        .filter(
          (session) =>
            !query ||
            session.title
              .toLowerCase()
              .includes(query)
        );
    }, [
      chatSessions,
      chatSearch
    ]);

  /* =====================================================
     OTHER STORAGE
  ===================================================== */

  useEffect(() => {
    localStorage.setItem(
      "ishra_materials",
      JSON.stringify(
        materials.map(
          ({
            url,
            ...meta
          }) => meta
        )
      )
    );
  }, [materials]);

  useEffect(() => {
    localStorage.setItem("ishra_quiz_history", JSON.stringify(quizHistory.slice(0, 30)));
  }, [quizHistory]);

  useEffect(() => {
    localStorage.setItem("ishra_teachback_history", JSON.stringify(teachHistory.slice(0, 30)));
  }, [teachHistory]);

  useEffect(() => {
    let cancelled =
      false;

    (async () => {
      const saved =
        materials.filter(
          (item) =>
            !item.url
        );

      if (!saved.length)
        return;

      const hydrated =
        await Promise.all(
          saved.map(
            async (item) => {
              const file =
                await readMaterialFile(
                  item.id
                );

              return file
                ? {
                    ...item,
                    url:
                      URL.createObjectURL(
                        file
                      )
                  }
                : item;
            }
          )
        );

      if (!cancelled) {
        setMaterials(
          (previous) =>
            previous.map(
              (item) =>
                hydrated.find(
                  (h) =>
                    h.id ===
                    item.id
                ) ||
                item
            )
        );
      }
    })();

    return () => {
      cancelled = true;
    };
  }, []);

  useEffect(() => {
    if (
      chatEndRef.current
    ) {
      chatEndRef.current.scrollIntoView(
        {
          behavior: "smooth"
        }
      );
    }
  }, [
    messages,
    isTyping
  ]);

  useEffect(() => {
    const timer =
      setInterval(
        () =>
          setCurrentTime(
            new Date()
          ),
        30000
      );

    return () =>
      clearInterval(timer);
  }, []);

  useEffect(() => {
    if (!quizStarted || quizFinished) return;
    const timer = setInterval(() => {
      setQuizSecondsLeft((value) => {
        if (value <= 1) {
          clearInterval(timer);
          finishQuiz(true);
          return 0;
        }
        return value - 1;
      });
    }, 1000);
    return () => clearInterval(timer);
  }, [quizStarted, quizFinished]);

  useEffect(() => {
    if (!teachStarted || teachTimeUp) return;
    const timer = setInterval(() => {
      setTeachSeconds((value) => {
        const next = value + 1;
        if (next >= Number(teachBack.duration) * 60) {
          clearInterval(timer);
          setTeachTimeUp(true);
          setTeachStarted(false);
          try { teachRecognitionRef.current?.stop(); } catch {}
          setTeachListening(false);
        }
        return next;
      });
    }, 1000);
    return () => clearInterval(timer);
  }, [teachStarted, teachTimeUp, teachBack.duration]);

  /* =====================================================
     SUPABASE
  ===================================================== */

  useEffect(() => {
    const loadSubjects =
      async () => {
        setLoadingSubjects(
          true
        );

        setDbError("");

        const {
          data,
          error
        } =
          await supabase
            .from(
              "subjects"
            )
            .select("*")
            .order("name");

        if (error) {
          setDbError(
            error.message
          );

          setDbSubjects(
            []
          );
        } else {
          setDbSubjects(
            data || []
          );
        }

        setLoadingSubjects(
          false
        );
      };

    loadSubjects();
  }, []);

  const loadUnits =
    async (subject) => {
      if (!subject?.id)
        return;

      setLoadingUnits(
        true
      );

      setUnits([]);
      setTopics([]);
      setDbError("");

      const {
        data,
        error
      } =
        await supabase
          .from(
            "syllabus_units"
          )
          .select(
            "id, subject_id, unit_number, title"
          )
          .eq(
            "subject_id",
            subject.id
          )
          .order(
            "unit_number"
          );

      if (error) {
        setDbError(
          error.message
        );

        setUnits([]);
      } else {
        setUnits(
          data || []
        );
      }

      setLoadingUnits(
        false
      );
    };

  const loadTopics =
    async (unit) => {
      if (!unit?.id)
        return;

      setLoadingTopics(
        true
      );

      setTopics([]);
      setDbError("");

      const {
        data,
        error
      } =
        await supabase
          .from(
            "topics"
          )
          .select(
            "id, unit_id, title, description, topic_order"
          )
          .eq(
            "unit_id",
            unit.id
          )
          .order(
            "topic_order"
          );

      if (error) {
        setDbError(
          error.message
        );

        setTopics([]);
        setLoadingTopics(
          false
        );

        return;
      }

      setTopics(
        data || []
      );

      if (data?.length) {
        const {
          data:
            progressData
        } =
          await supabase
            .from(
              "student_topic_progress"
            )
            .select(
              "topic_id, completed"
            )
            .eq(
              "student_key",
              studentKey
            )
            .in(
              "topic_id",
              data.map(
                (topic) =>
                  topic.id
              )
            );

        const progressMap =
          {};

        (
          progressData || []
        ).forEach(
          (item) => {
            progressMap[
              item.topic_id
            ] =
              item.completed;
          }
        );

        setCompletedTopics(
          (previous) => ({
            ...previous,
            ...progressMap
          })
        );
      }

      setLoadingTopics(
        false
      );
    };

  const calculateProgress =
    async () => {
      const {
        data: allTopics,
        error:
          topicsError
      } =
        await supabase
          .from("topics")
          .select(
            "id, syllabus_units!inner(subject_id)"
          );

      if (topicsError)
        return;

      const {
        data:
          progressData
      } =
        await supabase
          .from(
            "student_topic_progress"
          )
          .select(
            "topic_id, completed"
          )
          .eq(
            "student_key",
            studentKey
          )
          .eq(
            "completed",
            true
          );

      const completedIds =
        new Set(
          (
            progressData || []
          ).map(
            (item) =>
              item.topic_id
          )
        );

      const total =
        allTopics?.length ||
        0;

      const completed =
        allTopics?.filter(
          (topic) =>
            completedIds.has(
              topic.id
            )
        ).length || 0;

      setOverallProgress(
        total
          ? Math.round(
              (completed /
                total) *
                100
            )
          : 0
      );

      const stats =
        {};

      (
        allTopics || []
      ).forEach(
        (topic) => {
          const subjectId =
            topic
              .syllabus_units
              .subject_id;

          if (
            !stats[
              subjectId
            ]
          ) {
            stats[
              subjectId
            ] = {
              total: 0,
              completed: 0
            };
          }

          stats[
            subjectId
          ].total += 1;

          if (
            completedIds.has(
              topic.id
            )
          ) {
            stats[
              subjectId
            ].completed += 1;
          }
        }
      );

      const calculated =
        {};

      Object.entries(
        stats
      ).forEach(
        ([
          id,
          value
        ]) => {
          calculated[id] =
            value.total
              ? Math.round(
                  (value.completed /
                    value.total) *
                    100
                )
              : 0;
        }
      );

      setSubjectProgress(
        calculated
      );
    };

  useEffect(() => {
    if (
      branch &&
      section
    ) {
      calculateProgress();
    }
  }, [
    branch,
    section
  ]);

  const toggleTopicProgress =
    async (topicId) => {
      const newValue =
        !completedTopics[
          topicId
        ];

      setSavingProgress(
        true
      );

      const {
        error
      } =
        await supabase
          .from(
            "student_topic_progress"
          )
          .upsert(
            {
              student_key:
                studentKey,
              topic_id:
                topicId,
              completed:
                newValue,
              completed_at:
                newValue
                  ? new Date().toISOString()
                  : null
            },
            {
              onConflict:
                "student_key,topic_id"
            }
          );

      if (error) {
        setDbError(
          error.message
        );
      } else {
        setCompletedTopics(
          (previous) => ({
            ...previous,
            [topicId]:
              newValue
          })
        );

        await calculateProgress();
      }

      setSavingProgress(
        false
      );
    };

  const buildAcademicSnapshot = async () => {
    const topicResult = await supabase
      .from("topics")
      .select("id, title, syllabus_units!inner(id, title, subject_id, subjects!inner(name, teacher_name))")
      .order("topic_order");

    const progressResult = await supabase
      .from("student_topic_progress")
      .select("topic_id, completed")
      .eq("student_key", studentKey)
      .eq("completed", true);
    const completed = new Set((progressResult.data || []).map((item) => item.topic_id));
    const rows = topicResult.data || [];
    const bySubject = {};

    rows.forEach((row) => {
      const subject = row.syllabus_units?.subjects;
      const subjectName = subject?.name || "Unknown Subject";
      if (!bySubject[subjectName]) bySubject[subjectName] = { teacher: subject?.teacher_name || "Faculty", total: 0, completed: 0, pendingTopics: [] };
      bySubject[subjectName].total += 1;
      if (completed.has(row.id)) bySubject[subjectName].completed += 1;
      else bySubject[subjectName].pendingTopics.push(row.title);
    });

    return {
      overallProgress,
      subjectProgress,
      subjects: dbSubjects.map((s) => ({ name: s.name, teacher: s.teacher_name, progress: subjectProgress[s.id] || 0 })),
      detailedProgress: bySubject,
      currentTime: new Date().toISOString(),
      studentName: name,
      branch,
      section
    };
  };

  const openStudyNow = async () => {
    const session = createChatSession([], { mode: "study-now" });
    setChatSessions((previous) => [session, ...previous]);
    setActiveChatId(session.id);
    setTopicContext(null);
    setActiveTopic(null);
    setPendingImage(null);
    setMessage("");
    changeScreen("ishra");
    const snapshot = await buildAcademicSnapshot();
    setTimeout(() => sendToAI(
      "What should I study now? Analyze my actual pending topics and progress. Recommend one specific pending topic, explain why it is useful now, estimate the study time, and be ready to adapt if I tell you how much time I have. Keep the reply concise and actionable.",
      { mode: "study-now", academicSnapshot: snapshot, language, studentName: name },
      true,
      null,
      session.id
    ), 120);
  };

  const finishQuiz = (timeUp = false) => {
    if (!quizQuestions.length || quizFinished) return;
    const score = quizQuestions.filter((q, i) => quizAnswers[i] === q.answer).length;
    const subject = dbSubjects.find((s) => s.id === quizConfig.subjectId);
    const unit = quizUnits.find((u) => u.id === quizConfig.unitId);
    const topic = quizTopics.find((t) => t.id === quizConfig.topicId);
    const record = {
      id: makeId(),
      createdAt: Date.now(),
      subject: subject?.name || "Unknown subject",
      unit: unit?.title || "Unknown unit",
      topic: topic?.title || "Unknown topic",
      difficulty: quizConfig.difficulty,
      time: Number(quizConfig.time),
      questions: quizQuestions,
      answers: quizAnswers,
      score,
      timeUp: Boolean(timeUp)
    };
    setQuizHistory((previous) => [record, ...previous].slice(0, 30));
    setSelectedQuizHistory(record);
    setQuizFinished(true);
    setQuizStarted(false);
  };

  const startQuiz = async () => {
    const subject = dbSubjects.find((s) => s.id === quizConfig.subjectId);
    const unit = quizUnits.find((u) => u.id === quizConfig.unitId);
    const topic = quizTopics.find((t) => t.id === quizConfig.topicId);
    if (!subject || !unit || !topic) { setQuizError("Please select subject, unit and topic."); return; }
    setSelectedQuizHistory(null);
    setQuizLoading(true); setQuizError("");
    try {
      const response = await fetch(`${API_BASE}/quiz`, { method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify({ subject: subject.name, unit: unit.title, topic: topic.title, difficulty: quizConfig.difficulty, count: Math.min(20, Math.max(1, Number(quizConfig.count))), time: Math.min(5, Math.max(1, Number(quizConfig.time))) }) });
      const data = await response.json();
      if (!response.ok) throw new Error(data.error || "Quiz generation failed");
      if (!Array.isArray(data.questions) || !data.questions.length) throw new Error("No quiz questions returned.");
      setQuizQuestions(data.questions); setQuizAnswers({}); setQuizIndex(0); setQuizStarted(true); setQuizFinished(false); setQuizSecondsLeft(Math.min(5, Math.max(1, Number(quizConfig.time))) * 60);
    } catch (error) { setQuizError(error.message); } finally { setQuizLoading(false); }
  };

  const startTeachBack = () => {
    const topic = teachTopics.find((t) => t.id === teachBack.topicId);
    if (!topic) return;
    setSelectedTeachHistory(null);
    setTeachText(""); setTeachResult(null); setTeachQuestions([]); setTeachQuestionIndex(0); setTeachQuestionAnswer(""); setTeachSeconds(0); setTeachTimeUp(false); setTeachStarted(true);
  };

  const finishTeachBack = async () => {
    await evaluateTeachBack();
  };

  const evaluateTeachBack = async () => {
    const subject = dbSubjects.find((s) => s.id === teachBack.subjectId);
    const unit = teachUnits.find((u) => u.id === teachBack.unitId);
    const topic = teachTopics.find((t) => t.id === teachBack.topicId);
    if (!topic || !teachText.trim()) return;
    setTeachLoading(true);
    try {
      const response = await fetch(`${API_BASE}/evaluate-teachback`, { method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify({ subject: subject?.name, unit: unit?.title, topic: topic.title, explanation: teachText, questionAnswers: teachQuestions.map((q, i) => ({ question: q, answer: i === teachQuestionIndex ? teachQuestionAnswer : "" })) }) });
      const data = await response.json();
      if (!response.ok) throw new Error(data.error || "Evaluation failed");
      const record = {
        id: makeId(),
        createdAt: Date.now(),
        subject: subject?.name || "Unknown subject",
        unit: unit?.title || "Unknown unit",
        topic: topic.title,
        duration: Number(teachBack.duration),
        explanation: teachText,
        result: data
      };
      setTeachHistory((previous) => [record, ...previous].slice(0, 30));
      setSelectedTeachHistory(record);
      setTeachResult(data); setTeachStarted(false); setTeachTimeUp(false);
    } catch (error) { setTeachResult({ score: null, summary: error.message, improvements: ["Please try again when AI is available."], strengths: [], questions: [] }); setTeachStarted(false); setTeachTimeUp(false); } finally { setTeachLoading(false); }
  };

  /* =====================================================
     NAVIGATION
  ===================================================== */

  const changeScreen =
    (next) => {
      setScreen(next);

      window.scrollTo({
        top: 0,
        behavior: "smooth"
      });
    };

  const chooseLang =
    (lang) => {
      setLanguage(lang);

      localStorage.setItem(
        "ishraLanguage",
        lang
      );

      setShowLanguage(
        false
      );

      if (
        !messages.length &&
        !pendingTopicExplain
      ) {
        updateMessages(
          [
            {
              role: "ishra",
              text:
                lang ===
                "Hinglish"
                  ? "👋 Hi! Main ISHRA hoon.\n\nAap jo bhi padhna chahte hain, main step-by-step samjha deti hoon."
                  : "👋 Hi! I'm ISHRA.\n\nTell me what you want to learn and I'll explain it step by step."
            }
          ]
        );
      }

      if (
        pendingTopicExplain
      ) {
        setTimeout(
          () =>
            sendToAI(
              "Explain this topic from the beginning in a simple, student-friendly way. Give the core idea, important points and one example.",
              topicContext,
              true
            ),
          100
        );
      }

      setPendingTopicExplain(
        false
      );
    };

  const enterChat =
    (
      context = null,
      autoExplain = false
    ) => {
      if (!context) {
        const intro = language === "Hinglish"
          ? { role: "ishra", text: `👋 Hi ${name || ""}! Main ISHRA hoon. Aaj kya scene hai? Padhai karni hai, confusion solve karna hai ya thodi masti bhi chalegi 😄` }
          : { role: "ishra", text: `👋 Hi ${name || ""}! I'm ISHRA. What are we working on today? We can study, solve doubts, or keep it a little fun 😄` };
        const session = createChatSession([intro], null);
        setChatSessions((previous) => [session, ...previous]);
        setActiveChatId(session.id);
        setTopicContext(null);
        setActiveTopic(null);
        setPendingImage(null);
        setMessage("");
        changeScreen("ishra");
        if (!language) setShowLanguage(true);
        return;
      }

      setTopicContext(context);
      setActiveTopic(context.topic || null);
      updateActiveChatContext(context);
      changeScreen("ishra");

      if (!language) {
        setShowLanguage(true);
        setPendingTopicExplain(Boolean(autoExplain));
        return;
      }

      if (autoExplain) {
        setTimeout(() => sendToAI("Explain this topic from the beginning in a simple, student-friendly way. Give the core idea, important points and one example.", context, true), 80);
      }
    };

  const openTopic =
    (topic) => {
      const context = {
        subject:
          selectedSubject?.name,
        unit:
          selectedUnit?.title,
        topic:
          topic.title,
        topicId:
          topic.id
      };

      localStorage.setItem("ishra_last_topic", JSON.stringify(context));

      updateMessages(
        []
      );

      setTopicContext(
        context
      );

      updateActiveChatContext(
        context
      );

      enterChat(
        context,
        true
      );
    };

  /* =====================================================
     IMAGE GENERATION
  ===================================================== */

  const generateAIImage =
    async (
      prompt,
      automatic = false
    ) => {
      const cleanPrompt =
        String(
          prompt || ""
        ).trim();

      if (
        !cleanPrompt ||
        isTyping
      ) {
        return;
      }

      if (!automatic) {
        updateMessages(
          (previous) => [
            ...previous,
            {
              role: "student",
              text: cleanPrompt
            }
          ]
        );

        setMessage("");
      }

      setIsTyping(true);

      try {
        const response =
          await fetch(
            IMAGE_API_URL,
            {
              method:
                "POST",
              headers: {
                "Content-Type":
                  "application/json"
              },
              body:
                JSON.stringify({
                  prompt:
                    cleanPrompt
                })
            }
          );

        const data =
          await response.json();

        if (!response.ok) {
          throw new Error(
            data.error ||
              "Image generation failed"
          );
        }

        if (
          !data.image?.data
        ) {
          throw new Error(
            "No image returned"
          );
        }

        const imageData =
          `data:${data.image.mimeType || "image/png"};base64,${data.image.data}`;

        updateMessages(
          (previous) => [
            ...previous,
            {
              role: "ishra",
              text:
                data.text ||
                "Here is the generated visual.",
              imageData
            }
          ]
        );
      } catch (error) {
        console.error(
          "Image generation error:",
          error
        );

        updateMessages(
          (previous) => [
            ...previous,
            {
              role: "ishra",
              text:
                language ===
                "Hinglish"
                  ? "Image generate karne mein issue aa raha hai. Server aur Gemini image generation setup check kijiye."
                  : "I couldn't generate the image right now. Please check the AI server and image generation setup."
            }
          ]
        );
      } finally {
        setIsTyping(
          false
        );
      }
    };

  const looksLikeImageRequest =
    (text) => {
      const value =
        String(text || "")
          .toLowerCase()
          .trim();

      const action =
        /(generate|create|draw|make|visualize)/i.test(
          value
        );

      const visual =
        /(image|diagram|flowchart|illustration|figure|visual|chart)/i.test(
          value
        );

      return (
        action &&
        visual
      );
    };

  /* =====================================================
     AI CHAT
  ===================================================== */

  const sendToAI =
    async (
      text,
      contextOverride = null,
      isAutomatic = false,
      imageOverride = null,
      targetChatId = activeChatId
    ) => {
      let t = String(
        text || ""
      ).trim();

      const image =
        imageOverride ||
        pendingImage;

      if (
        !t &&
        image
      ) {
        t =
          "Please understand this image and explain or solve everything important in it step-by-step.";
      }

      if (
        !t ||
        isTyping
      ) {
        return;
      }

      /*
        Natural image-generation request.
      */
      if (
        !image &&
        looksLikeImageRequest(t)
      ) {
        await generateAIImage(
          t,
          isAutomatic
        );

        return;
      }

      const context =
        contextOverride ||
        topicContext;

      if (!isAutomatic) {
        updateMessages(
          (previous) => [
            ...previous,
            {
              role: "student",
              text: t,
              imageData:
                image?.dataUrl ||
                null,
              attachment:
                image
                  ? {
                      name:
                        image.name,
                      mimeType:
                        image.mimeType,
                      size:
                        image.size
                    }
                  : null
            }
          ],
          targetChatId
        );

        setMessage("");

        setPendingImage(null);

      }

      setIsTyping(
        true
      );

      try {
        const targetSession = chatSessions.find((session) => session.id === targetChatId);
        const targetMessages = targetSession?.messages || messages;
        const visibleHistory =
          [
            ...targetMessages,
            ...(
              isAutomatic
                ? []
                : [
                    {
                      role:
                        "student",
                      text: t
                    }
                  ]
            )
          ]
            .slice(-18)
            .map(
              (m) => ({
                role:
                  m.role ===
                  "ishra"
                    ? "assistant"
                    : "user",
                content:
                  m.text
              })
            );

        let academicSnapshot = null;
        try {
          academicSnapshot = await buildAcademicSnapshot();
        } catch (academicError) {
          console.warn("Academic context could not be loaded", academicError);
        }

        const body = {
          message: t,
          history:
            visibleHistory,
          context: {
            ...context,
            language,
            studentName:
              name,
            academicSnapshot
          }
        };

        if (image) {
          body.image = {
            data:
              image.dataUrl,
            mimeType:
              image.mimeType
          };
        }

        const response =
          await fetch(
            API_URL,
            {
              method:
                "POST",
              headers: {
                "Content-Type":
                  "application/json"
              },
              body:
                JSON.stringify(
                  body
                )
            }
          );

        const data =
          await response.json();

        if (!response.ok) {
          throw new Error(
            data.error ||
              "AI response failed"
          );
        }

        updateMessages(
          (previous) => [
            ...previous,
            {
              role: "ishra",
              text:
                data.reply,
              sources:
                data.sources ||
                []
            }
          ]
        , targetChatId);

        if (data.audio) {
          try {
            const binary =
              atob(
                data.audio
              );

            const bytes =
              new Uint8Array(
                binary.length
              );

            for (
              let i = 0;
              i <
              binary.length;
              i += 1
            ) {
              bytes[i] =
                binary.charCodeAt(
                  i
                );
            }

            const audio =
              new Audio(
                URL.createObjectURL(
                  new Blob(
                    [bytes],
                    {
                      type: "audio/mpeg"
                    }
                  )
                )
              );

            audio.volume = 1;

            await audio.play();
          } catch (
            error
          ) {
            console.log(
              "Voice playback skipped",
              error
            );
          }
        }
      } catch (error) {
        console.error(
          error
        );

        updateMessages(
          (previous) => [
            ...previous,
            {
              role: "ishra",
              text:
                language ===
                "Hinglish"
                  ? "AI connection mein issue aa raha hai. Server check karke dobara try kijiye."
                  : "I'm having trouble connecting to the AI service. Please check the server and try again."
            }
          ]
        , targetChatId);
      } finally {
        setIsTyping(
          false
        );

        if (
          imageOverride ===
          null
        ) {
          setPendingImage(
            null
          );
        }
      }
    };

  const send = () => {
    sendToAI(
      message,
      null,
      false,
      pendingImage
    );
  };

  /* =====================================================
     VOICE
  ===================================================== */

  const startListening =
    () => {
      const Recognition =
        window.SpeechRecognition ||
        window.webkitSpeechRecognition;

      if (!Recognition) {
        alert(
          "Voice recognition is not supported in this browser."
        );

        return;
      }

      const recognition =
        new Recognition();

      recognition.lang =
        language ===
        "Hinglish"
          ? "en-IN"
          : "en-US";

      recognition.continuous =
        false;

      recognition.interimResults =
        false;

      setIsListening(
        true
      );

      recognition.start();

      recognition.onresult =
        (event) => {
          setMessage(
            event.results[0][0]
              .transcript
          );
        };

      recognition.onerror =
        () =>
          setIsListening(
            false
          );

      recognition.onend =
        () =>
          setIsListening(
            false
          );
    };

  /* =====================================================
     CHAT IMAGE ATTACHMENT
  ===================================================== */

  const attachImage =
    async (event) => {
      const file =
        event.target.files?.[0];

      if (!file) return;

      if (
        !file.type.startsWith(
          "image/"
        )
      ) {
        alert(
          "Please select an image for AI image understanding."
        );

        event.target.value =
          "";

        return;
      }

      try {
        const dataUrl =
          await prepareImageForAI(
            file
          );

        const id =
          makeId();

        await saveMaterialFile(
          id,
          file
        );

        const material = {
          id,
          subject:
            materialSubject ||
            selectedSubject?.name ||
            "General",
          title:
            file.name,
          date:
            new Date().toLocaleDateString(
              "en-IN",
              {
                day: "2-digit",
                month:
                  "short",
                year: "numeric"
              }
            ),
          type: "image",
          size:
            file.size,
          url:
            URL.createObjectURL(
              file
            ),
          topic:
            activeTopic?.title ||
            topicContext?.topic ||
            "",
          mime:
            file.type
        };

        setMaterials(
          (previous) => [
            material,
            ...previous
          ]
        );

        setPendingImage({
          name:
            file.name,
          mimeType:
            
           "image/jpeg",
          size:
            file.size,
          dataUrl,
          materialId:
            id
        });
      } catch (error) {
        console.error(
          error
        );

        alert(
          "Image read nahi ho paayi. Please dobara try kijiye."
        );
      }

      event.target.value =
        "";
    };

  const removePendingImage =
    () => {
      setPendingImage(
        null
      );
    };

  /* =====================================================
     MATERIAL UPLOAD
  ===================================================== */

  const uploadMaterial =
    async (event) => {
      const file =
        event.target.files?.[0];

      if (!file) return;

      const id =
        makeId();

      await saveMaterialFile(
        id,
        file
      );

      const url =
        URL.createObjectURL(
          file
        );

      const material = {
        id,
        subject:
          materialSubject ||
          selectedSubject?.name ||
          "General",
        title:
          file.name,
        date:
          new Date().toLocaleDateString(
            "en-IN",
            {
              day: "2-digit",
              month:
                "short",
              year: "numeric"
            }
          ),
        type:
          file.type.startsWith(
            "image/"
          )
            ? "image"
            : "document",
        size:
          file.size,
        url,
        topic:
          activeTopic?.title ||
          "",
        mime:
          file.type
      };

      setMaterials(
        (previous) => [
          material,
          ...previous
        ]
      );

      setShowUploadModal(
        false
      );

      event.target.value =
        "";
    };

  const filteredMaterials =
    useMemo(
      () =>
        materials.filter(
          (m) => {
            const query =
              materialSearch.toLowerCase();

            return (
              (!materialSubject ||
                m.subject ===
                  materialSubject) &&
              (!query ||
                `${m.title} ${m.subject} ${m.topic}`
                  .toLowerCase()
                  .includes(
                    query
                  ))
            );
          }
        ),
      [
        materials,
        materialSearch,
        materialSubject
      ]
    );

  /* =====================================================
     OPEN SAVED MATERIAL
  ===================================================== */

  const openMaterialChat =
    async (
      material
    ) => {
      const context = {
        subject:
          material.subject,
        unit:
          "Class Material",
        topic:
          material.topic ||
          material.title,
        material:
          material.title
      };

      updateMessages(
        []
      );

      setTopicContext(
        context
      );

      setActiveTopic(
        null
      );

      updateActiveChatContext(
        context
      );

      changeScreen(
        "ishra"
      );

      if (
        material.type ===
        "image"
      ) {
        const file =
          await readMaterialFile(
            material.id
          );

        if (file) {
          const dataUrl =
            await fileToDataURL(
              file
            );

          setTimeout(
            () =>
              sendToAI(
                `Explain this saved class material named "${material.title}" and tell me the important concepts I should understand from it.`,
                context,
                true,
                {
                  name:
                    material.title,
                  mimeType:
                    material.mime ||
                    file.type ||
                    "image/jpeg",
                  size:
                    file.size,
                  dataUrl
                }
              ),
            80
          );

          return;
        }
      }

      setTimeout(
        () =>
          sendToAI(
            `Explain this saved class material named "${material.title}" and tell me the important concepts I should understand from it.`,
            context,
            true
          ),
        80
      );
    };

  /* =====================================================
     SHELL
  ===================================================== */

  const shell =
    (content) => (
      <div
        className={`app ${theme}`}
      >
        {content}
      </div>
    );

  const scheduleState =
    getScheduleState(
      currentTime
    );

  const todayEntries =
    scheduleState.classes;

  const page =
    (
      content,
      className =
        "screen-view"
    ) => (
      <div
        className={
          className
        }
      >
        {content}
      </div>
    );

  /* =====================================================
   LOGIN
===================================================== */

if (
  screen ===
  "login"
) {
  return shell(
    page(
      <main className="auth-page">
        <div className="auth-orbit" />

        <div className="auth-card animated-card">

          {/* ISHRA BRAND */}
          <div className="ishra-login-brand">
            <div className="ishra-login-brand-inner">

              <div className="brand-mark">
                <IshraLogo />
              </div>

              <div className="brand-name">
                ISHRA
              </div>

            </div>
          </div>

          {/* FULL FORM */}
          <div className="eyebrow ishra-full-form">
            Intelligent Study &amp; Holistic Resource Assistant
          </div>

          {/* TAGLINE */}
          <h1 className="ishra-tagline">
            Turning Academic Confusion into Clear Direction.
          </h1>

          {/* COLLEGE EMAIL */}
          <label>
            College Email
          </label>

          <input
            placeholder="Student@bbditm.ac.in"
            type="email"
            value={email}
            onChange={(e) =>
              setEmail(
                e.target.value
              )
            }
          />

          {/* NAME */}
          <label>
            Name
          </label>

          <input
            placeholder="Enter your name"
            type="text"
            value={name}
            onChange={(e) =>
              setName(
                e.target.value
              )
            }
          />

          {/* PASSWORD */}
          <label>
            Password
          </label>

          <input
            placeholder="••••••••"
            type="password"
          />

          {/* LOGIN BUTTON */}
          <button
            className="primary full magnetic-button"
            onClick={() => {
              localStorage.setItem(
                "ishraName",
                name
              );

              setScreen(
                "branch"
              );
            }}
          >
            <LogIn size={18} />
            Login
            <ArrowRight
              size={17}
            />
          </button>

        </div>
      </main>
    )
  );
}

  /* =====================================================
     BRANCH
  ===================================================== */

  if (
    screen ===
    "branch"
  ) {
    return shell(
      page(
        <main className="auth-page">
          <div className="auth-card animated-card">
            <div className="brand-mark">
              <GraduationCap />
            </div>

            <div className="eyebrow">
              YOUR ACADEMIC PROFILE
            </div>

            <h1>
              Choose your branch
            </h1>

            <p className="muted">
              Select your branch and section to personalize your ISHRA experience.
            </p>

            <label>
              Branch
            </label>

            <select
              value={branch}
              onChange={(e) =>
                setBranch(
                  e.target.value
                )
              }
            >
              <option value="">
                Select Branch
              </option>

              <option>
                CSE-AI
              </option>

              <option>
                CSE
              </option>

              <option>
                IT
              </option>

              <option>
                ECE
              </option>

              <option>
                EEE
              </option>

              <option>
                ME
              </option>

              <option>
                CE
              </option>
            </select>

            <label>
              Section
            </label>

            <select
              value={section}
              onChange={(e) =>
                setSection(
                  e.target.value
                )
              }
            >
              <option value="">
                Select Section
              </option>

              {Array.from(
                {
                  length: 12
                },
                (_, i) => (
                  <option
                    key={i}
                  >
                    B-{i + 1}
                  </option>
                )
              )}
            </select>

            <button
              className="primary full magnetic-button"
              disabled={
                !branch ||
                !section
              }
              onClick={() => {
                localStorage.setItem(
                  "ishraBranch",
                  branch
                );

                localStorage.setItem(
                  "ishraSection",
                  section
                );

                changeScreen(
                  branch ===
                    "CSE-AI" &&
                  section ===
                    "B-10"
                    ? "welcome"
                    : "ishra"
                );
              }}
            >
              Continue
              <ArrowRight
                size={18}
              />
            </button>
          </div>
        </main>
      )
    );
  }

  /* =====================================================
     WELCOME
  ===================================================== */

  if (
    screen ===
    "welcome"
  ) {
    return shell(
      page(
        <main className="welcome-page">
          <div className="welcome-card animated-card">
            <div className="brand-mark large">
              <IshraLogo size="large" />
            </div>

            <div className="eyebrow">
              WELCOME TO ISHRA
            </div>

            <h1>
              Welcome,{" "}
              {name ||
                "Student"}{" "}
              👋
            </h1>

            <div className="profile-pills">
              <span>
                {branch}
              </span>

              <span>
                Section{" "}
                {section}
              </span>

              <span>
                Semester 1
              </span>
            </div>

            <p className="muted">
              Your classes, syllabus, progress, materials and AI study help — together.
            </p>

            <button
              className="primary magnetic-button"
              onClick={() =>
                changeScreen(
                  "dashboard"
                )
              }
            >
              Continue to ISHRA
              <ArrowRight
                size={18}
              />
            </button>
          </div>
        </main>
      )
    );
  }

  /* =====================================================
     ISHRA CHAT
  ===================================================== */

  if (
    screen ===
    "ishra"
  ) {
    return shell(
      page(
        <main className="ishra-page">
          <header className="ishra-top">
            <button
              className="ghost"
              onClick={() => {
                setShowLanguage(
                  false
                );

                setChatDrawerOpen(
                  false
                );

                changeScreen(
                  "dashboard"
                );
              }}
            >
              <ArrowLeft
                size={18}
              />
              Exit ISHRA
            </button>

            <div className="ishra-brand">
              <IshraLogo size="small" />

              <span>
                ISHRA
              </span>

              {topicContext?.topic && (
                <span className="context-chip">
                  {
                    topicContext.topic
                  }
                </span>
              )}
            </div>

            <div
              style={{
                display:
                  "flex",
                gap: 8,
                alignItems:
                  "center"
              }}
            >
              <button
                className="ghost"
                onClick={() =>
                  setChatDrawerOpen(
                    true
                  )
                }
                title="Chat history"
              >
                <MessageCircle
                  size={17}
                />
                Chats
              </button>

              <button
                className="ghost"
                onClick={
                  newChat
                }
                title="New chat"
              >
                <Plus
                  size={17}
                />
                New Chat
              </button>

              <button
                className="language-chip"
                onClick={() =>
                  setShowLanguage(
                    true
                  )
                }
              >
                <Languages
                  size={15}
                />
                {language ||
                  "Language"}
              </button>
            </div>
          </header>

          {/* CHAT STORE DRAWER */}

          {chatDrawerOpen && (
            <>
              <div
                onClick={() =>
                  setChatDrawerOpen(
                    false
                  )
                }
                style={{
                  position:
                    "fixed",
                  inset: 0,
                  background:
                    "rgba(0,0,0,.45)",
                  zIndex: 998
                }}
              />

              <aside
                style={{
                  position:
                    "fixed",
                  top: 0,
                  right: 0,
                  bottom: 0,
                  width:
                    "min(390px, 88vw)",
                  zIndex: 999,
                  background:
                    theme ===
                    "dark"
                      ? "#10151d"
                      : "#ffffff",
                  borderLeft:
                    "1px solid rgba(128,128,128,.22)",
                  padding: 18,
                  display:
                    "flex",
                  flexDirection:
                    "column",
                  boxShadow:
                    "-12px 0 40px rgba(0,0,0,.18)"
                }}
              >
                <div
                  style={{
                    display:
                      "flex",
                    alignItems:
                      "center",
                    justifyContent:
                      "space-between",
                    gap: 10,
                    marginBottom:
                      16
                  }}
                >
                  <div>
                    <div className="eyebrow">
                      ISHRA
                      STORAGE
                    </div>

                    <h2
                      style={{
                        margin:
                          "4px 0 0"
                      }}
                    >
                      Your Chats
                    </h2>
                  </div>

                  <button
                    className="icon-btn"
                    onClick={() =>
                      setChatDrawerOpen(
                        false
                      )
                    }
                  >
                    <X
                      size={18}
                    />
                  </button>
                </div>

                <button
                  className="primary full"
                  onClick={
                    newChat
                  }
                  style={{
                    marginBottom:
                      12
                  }}
                >
                  <Plus
                    size={17}
                  />
                  New Chat
                </button>

                <div
                  className="search-field"
                  style={{
                    marginBottom:
                      12
                  }}
                >
                  <Search
                    size={17}
                  />

                  <input
                    value={
                      chatSearch
                    }
                    onChange={(
                      e
                    ) =>
                      setChatSearch(
                        e.target
                          .value
                      )
                    }
                    placeholder="Search chats..."
                  />
                </div>

                <div
                  style={{
                    flex: 1,
                    overflowY:
                      "auto",
                    display:
                      "flex",
                    flexDirection:
                      "column",
                    gap: 7
                  }}
                >
                  {filteredChatSessions.map(
                    (
                      session
                    ) => (
                      <div
                        key={
                          session.id
                        }
                        style={{
                          display:
                            "flex",
                          alignItems:
                            "stretch",
                          gap: 5
                        }}
                      >
                        <button
                          onClick={() =>
                            selectChat(
                              session.id
                            )
                          }
                          style={{
                            flex: 1,
                            textAlign:
                              "left",
                            border:
                              "1px solid rgba(128,128,128,.16)",
                            background:
                              session.id ===
                              activeChatId
                                ? "rgba(70,130,180,.14)"
                                : "transparent",
                            borderRadius:
                              12,
                            padding:
                              "11px 12px",
                            cursor:
                              "pointer",
                            color:
                              "inherit"
                          }}
                        >
                          <div
                            style={{
                              fontWeight:
                                650,
                              fontSize:
                                14,
                              overflow:
                                "hidden",
                              textOverflow:
                                "ellipsis",
                              whiteSpace:
                                "nowrap"
                            }}
                          >
                            {session.title}
                          </div>

                          <div
                            style={{
                              opacity:
                                0.55,
                              fontSize:
                                11,
                              marginTop:
                                4
                            }}
                          >
                            {new Date(
                              session.updatedAt
                            ).toLocaleDateString(
                              "en-IN",
                              {
                                day: "2-digit",
                                month:
                                  "short"
                              }
                            )}
                          </div>
                        </button>

                        <button
                          className="icon-btn"
                          title="Delete chat"
                          onClick={() =>
                            deleteChat(
                              session.id
                            )
                          }
                        >
                          <Trash2
                            size={15}
                          />
                        </button>
                      </div>
                    )
                  )}

                  {!filteredChatSessions.length && (
                    <div className="empty-state">
                      <MessageCircle
                        size={24}
                      />

                      <p>
                        No chats found.
                      </p>
                    </div>
                  )}
                </div>
              </aside>
            </>
          )}

          {showLanguage && (
            <div className="overlay">
              <div className="language-modal modal-pop">
                <button
                  className="modal-close"
                  onClick={() =>
                    setShowLanguage(
                      false
                    )
                  }
                >
                  <X
                    size={18}
                  />
                </button>

                <div className="modal-icon">
                  <Languages />
                </div>

                <h2>
                  Preferred Language
                </h2>

                <p className="muted">
                  Choose how you want to interact with ISHRA.
                </p>

                <button
                  className="language-option"
                  onClick={() =>
                    chooseLang(
                      "English"
                    )
                  }
                >
                  English
                  <ChevronRight />
                </button>

                <button
                  className="language-option"
                  onClick={() =>
                    chooseLang(
                      "Hinglish"
                    )
                  }
                >
                  Hinglish
                  <ChevronRight />
                </button>
              </div>
            </div>
          )}

          <div className="ishra-welcome">
            <div className="avatar logo-avatar">
              <IshraLogo />
            </div>

            <div>
              <div className="eyebrow">
                {topicContext?.topic
                  ? "TOPIC MODE"
                  : "YOUR ACADEMIC COMPANION"}
              </div>

              <h1>
                ISHRA
              </h1>

              <p>
                {topicContext?.topic
                  ? `Context: ${topicContext.subject} • ${topicContext.unit}`
                  : language ===
                    "Hinglish"
                  ? "Pucho, samjho, aur apne notes ke saath seekho."
                  : "Ask, understand, and learn with your class material."}
              </p>
            </div>
          </div>

          {topicContext?.topic && (
            <div className="topic-context-bar">
              <div>
                <span>
                  Studying
                </span>

                <strong>
                  {
                    topicContext.topic
                  }
                </strong>
              </div>

              <div>
                <small>
                  {
                    topicContext.subject
                  }
                </small>

                <small>
                  {
                    topicContext.unit
                  }
                </small>
              </div>

              <button
                className="ghost"
                onClick={() => {
                  setTopicContext(
                    null
                  );

                  setActiveTopic(
                    null
                  );

                  updateActiveChatContext(
                    null
                  );
                }}
              >
                Clear context
              </button>
            </div>
          )}

          <section className="workspace">
            <div
              className="chat-panel"
              style={{
                width: `${chatWidth}%`
              }}
            >
              <div className="chat-messages">
                {messages.map(
                  (m, i) => (
                    <div
                      key={i}
                      className={`message-row ${m.role}`}
                    >
                      <div className="message-bubble">
                        {m.imageData && (
                          <img
                            src={
                              m.imageData
                            }
                            alt={
                              m.attachment
                                ?.name ||
                              "Attached study material"
                            }
                            style={{
                              maxWidth:
                                "100%",
                              width:
                                "min(420px, 100%)",
                              maxHeight:
                                360,
                              objectFit:
                                "contain",
                              borderRadius:
                                12,
                              display:
                                "block",
                              marginBottom:
                                m.text
                                  ? 10
                                  : 0
                            }}
                          />
                        )}

                        {m.role ===
                        "ishra" ? (
                          <MarkdownText
                            text={
                              m.text
                            }
                          />
                        ) : (
                          m.text
                        )}

                        {m.sources?.length >
                          0 && (
                          <div
                            style={{
                              marginTop:
                                12,
                              paddingTop:
                                10,
                              borderTop:
                                "1px solid rgba(128,128,128,.2)"
                            }}
                          >
                            <strong
                              style={{
                                fontSize:
                                  12
                              }}
                            >
                              Sources
                            </strong>

                            <div
                              style={{
                                display:
                                  "flex",
                                flexDirection:
                                  "column",
                                gap: 5,
                                marginTop:
                                  6
                              }}
                            >
                              {m.sources.map(
                                (
                                  source,
                                  index
                                ) => (
                                  <a
                                    key={
                                      index
                                    }
                                    href={
                                      source.url
                                    }
                                    target="_blank"
                                    rel="noreferrer"
                                    style={{
                                      fontSize:
                                        12,
                                      overflow:
                                        "hidden",
                                      textOverflow:
                                        "ellipsis",
                                      whiteSpace:
                                        "nowrap"
                                    }}
                                  >
                                    {source.title ||
                                      source.url}
                                  </a>
                                )
                              )}
                            </div>
                          </div>
                        )}
                      </div>
                    </div>
                  )
                )}

                {isTyping && (
                  <div className="message-row ishra">
                    <div className="message-bubble typing-bubble">
                      <span />
                      <span />
                      <span />
                    </div>
                  </div>
                )}

                <div
                  ref={
                    chatEndRef
                  }
                />
              </div>

              {topicContext?.topic && (
                <div className="quick-actions">
                  <button
                    onClick={() =>
                      sendToAI(
                        "Explain the topic from the beginning in simple terms."
                      )
                    }
                  >
                    <Sparkles
                      size={15}
                    />
                    Explain Topic
                  </button>

                  <button
                    onClick={() =>
                      sendToAI(
                        "Give me the most important points for exam revision."
                      )
                    }
                  >
                    <CheckCircle2
                      size={15}
                    />
                    Important Points
                  </button>

                  <button
                    onClick={() =>
                      sendToAI(
                        "Give me 5 practice questions with answers."
                      )
                    }
                  >
                    <BookOpen
                      size={15}
                    />
                    Give Questions
                  </button>

                  <button
                    onClick={() =>
                      sendToAI(
                        "Start a short 5-question quiz. Ask one question at a time."
                      )
                    }
                  >
                    <GraduationCap
                      size={15}
                    />
                    Start Quiz
                  </button>

                  <button
                    onClick={() =>
                      generateAIImage(
                        `Create a clean educational diagram for the topic "${topicContext.topic}" from the subject "${topicContext.subject}". Show the important components and their relationships.`
                      )
                    }
                  >
                    <FileImage
                      size={15}
                    />
                    Generate Diagram
                  </button>
                </div>
              )}

              {pendingImage && (
                <div
                  style={{
                    display:
                      "flex",
                    alignItems:
                      "center",
                    gap: 10,
                    padding:
                      "8px 12px",
                    borderTop:
                      "1px solid rgba(128,128,128,.16)"
                  }}
                >
                  <img
                    src={
                      pendingImage.dataUrl
                    }
                    alt="Selected attachment"
                    style={{
                      width: 54,
                      height: 54,
                      objectFit:
                        "cover",
                      borderRadius:
                        9
                    }}
                  />

                  <div
                    style={{
                      flex: 1,
                      minWidth: 0
                    }}
                  >
                    <strong
                      style={{
                        display:
                          "block",
                        overflow:
                          "hidden",
                        textOverflow:
                          "ellipsis",
                        whiteSpace:
                          "nowrap"
                      }}
                    >
                      {
                        pendingImage.name
                      }
                    </strong>

                    <small
                      style={{
                        opacity:
                          0.6
                      }}
                    >
                      Image attached — ISHRA can read it
                    </small>
                  </div>

                  <button
                    className="icon-btn"
                    onClick={
                      removePendingImage
                    }
                    title="Remove image"
                  >
                    <X
                      size={17}
                    />
                  </button>
                </div>
              )}

              <div className="chat-input-wrap">
                <button
                  className="icon-btn"
                  onClick={() =>
                    chatFileInputRef.current?.click()
                  }
                  title="Attach image"
                >
                  <Paperclip
                    size={18}
                  />
                </button>

                <input
                  value={
                    message
                  }
                  onChange={(
                    e
                  ) =>
                    setMessage(
                      e.target
                        .value
                    )
                  }
                  onKeyDown={(
                    e
                  ) => {
                    if (
                      e.key ===
                      "Enter"
                    ) {
                      e.preventDefault();
                      send();
                    }
                  }}
                  placeholder={
                    language ===
                    "Hinglish"
                      ? "ISHRA se kuch bhi pucho..."
                      : "Ask ISHRA anything..."
                  }
                />

                <button
                  className={`icon-btn ${
                    isListening
                      ? "listening"
                      : ""
                  }`}
                  onClick={
                    startListening
                  }
                  title="Voice input"
                >
                  <Mic
                    size={18}
                  />
                </button>

                <button
                  className="send-btn"
                  onClick={
                    send
                  }
                  title="Send"
                >
                  <ArrowRight
                    size={18}
                  />
                </button>

                <input
                  ref={
                    chatFileInputRef
                  }
                  hidden
                  type="file"
                  accept="image/*"
                  onChange={
                    attachImage
                  }
                />
              </div>
            </div>

            <div
              className="resize-handle"
              onMouseDown={(
                e
              ) => {
                const move =
                  (ev) => {
                    const r =
                      e.currentTarget.parentElement.getBoundingClientRect();

                    setChatWidth(
                      Math.min(
                        82,
                        Math.max(
                          42,
                          ((ev.clientX -
                            r.left) /
                            r.width) *
                            100
                        )
                      )
                    );
                  };

                const up =
                  () => {
                    window.removeEventListener(
                      "mousemove",
                      move
                    );

                    window.removeEventListener(
                      "mouseup",
                      up
                    );
                  };

                window.addEventListener(
                  "mousemove",
                  move
                );

                window.addEventListener(
                  "mouseup",
                  up
                );
              }}
            >
              <span />
            </div>

            <aside className="progress-panel">
              <div className="panel-heading">
                <div>
                  <div className="eyebrow">
                    YOUR PROGRESS
                  </div>

                  <h3>
                    Keep going
                  </h3>
                </div>

                <Sparkles
                  size={19}
                />
              </div>

              <div className="progress-ring">
                <strong>
                  {
                    overallProgress
                  }
                  %
                </strong>

                <span>
                  Overall
                </span>
              </div>

              {dbSubjects
                .slice(0, 6)
                .map(
                  (s) => (
                    <div
                      className="progress-row"
                      key={s.id}
                    >
                      <div>
                        <span>
                          {
                            s.name
                          }
                        </span>

                        <b>
                          {
                            subjectProgress[
                              s.id
                            ] || 0
                          }
                          %
                        </b>
                      </div>

                      <div className="progress-track">
                        <div
                          style={{
                            width: `${
                              subjectProgress[
                                s.id
                              ] || 0
                            }%`
                          }}
                        />
                      </div>
                    </div>
                  )
                )}
            </aside>
          </section>
        </main>
      )
    );
  }

  /* =====================================================
     CONTINUE LEARNING
  ===================================================== */

  if (screen === "continue") {
    let lastTopic = null;
    try { lastTopic = JSON.parse(localStorage.getItem("ishra_last_topic") || "null"); } catch {}
    return shell(page(
      <main className="page-shell">
        <header className="topbar">
          <button className="ghost" onClick={() => changeScreen("dashboard")}><ArrowLeft /> Dashboard</button>
          <div className="brand-small"><IshraLogo size="small" /><span>ISHRA</span></div>
        </header>
        <div className="page-content narrow">
          <div className="section-head"><div><div className="eyebrow">RESUME LEARNING</div><h1>Continue Learning</h1><p className="muted">Pick up exactly where you left off.</p></div></div>
          {lastTopic ? (
            <div className="feature-hero-card">
              <div className="feature-hero-icon"><Play /></div>
              <div><span className="eyebrow">LAST OPENED</span><h2>{lastTopic.topic}</h2><p>{lastTopic.subject} • {lastTopic.unit}</p></div>
              <button className="primary" onClick={() => enterChat(lastTopic, true)}>Continue <ArrowRight size={17} /></button>
            </div>
          ) : (
            <div className="empty-state"><Play size={28} /><p>No learning session saved yet.</p><button className="secondary-action" onClick={() => changeScreen("subjects")}>Explore Subjects</button></div>
          )}
        </div>
      </main>
    ));
  }

  /* =====================================================
     QUICK QUIZ
  ===================================================== */

  if (screen === "quiz") {
    const currentQuestion = quizQuestions[quizIndex];
    const score = quizQuestions.filter((q, i) => quizAnswers[i] === q.answer).length;
    const showHistoryResult = selectedQuizHistory && !quizStarted && !quizFinished;
    const resultQuestions = selectedQuizHistory?.questions || quizQuestions;
    const resultAnswers = selectedQuizHistory?.answers || quizAnswers;
    const resultScore = selectedQuizHistory?.score ?? score;
    return shell(page(
      <main className="page-shell">
        <header className="topbar">
          <button className="ghost" onClick={() => changeScreen("dashboard")}><ArrowLeft /> Dashboard</button>
          <div className="brand-small"><IshraLogo size="small" /><span>ISHRA</span></div>
        </header>
        <div className="page-content narrow">
          <div className="section-head"><div><div className="eyebrow">PRACTICE MODE</div><h1>Quick Quiz</h1><p className="muted">Create a fresh quiz first. Your previous attempts stay safely below.</p></div></div>

          {!quizStarted && !quizFinished && !showHistoryResult && <div className="quiz-config-card quiz-new-card">
            <div className="feature-hero-icon"><Trophy /></div>
            <div><span className="eyebrow">NEW QUIZ</span><h2>Build your next practice session</h2><p className="muted">Choose a topic, difficulty, question count and time.</p></div>
            <label>Subject</label>
            <select value={quizConfig.subjectId} onChange={async (e) => { const subjectId=e.target.value; setQuizConfig(v=>({...v,subjectId,unitId:"",topicId:""})); const subject=dbSubjects.find(x=>x.id===subjectId); if(subject){ const {data}=await supabase.from("syllabus_units").select("id,subject_id,unit_number,title").eq("subject_id",subjectId).order("unit_number"); setQuizUnits(data||[]); } else setQuizUnits([]); setQuizTopics([]); }}><option value="">Select subject</option>{dbSubjects.map(s=><option key={s.id} value={s.id}>{s.name}</option>)}</select>
            <label>Unit</label>
            <select value={quizConfig.unitId} disabled={!quizConfig.subjectId} onChange={async (e)=>{ const unitId=e.target.value; setQuizConfig(v=>({...v,unitId,topicId:""})); const {data}=await supabase.from("topics").select("id,unit_id,title,description,topic_order").eq("unit_id",unitId).order("topic_order"); setQuizTopics(data||[]); }}><option value="">Select unit</option>{quizUnits.map(u=><option key={u.id} value={u.id}>Unit {u.unit_number} — {u.title}</option>)}</select>
            <label>Topic</label>
            <select value={quizConfig.topicId} disabled={!quizConfig.unitId} onChange={e=>setQuizConfig(v=>({...v,topicId:e.target.value}))}><option value="">Select topic</option>{quizTopics.map(t=><option key={t.id} value={t.id}>{t.title}</option>)}</select>
            <div className="quiz-two-col"><div><label>Difficulty</label><select value={quizConfig.difficulty} onChange={e=>setQuizConfig(v=>({...v,difficulty:e.target.value}))}><option>Easy</option><option>Moderate</option><option>Hard</option></select></div><div><label>Questions (max 20)</label><input type="number" min="1" max="20" value={quizConfig.count} onChange={e=>setQuizConfig(v=>({...v,count:Math.min(20,Math.max(1,Number(e.target.value)||1))}))}/></div></div>
            <label>Time (max 5 minutes)</label><select value={quizConfig.time} onChange={e=>setQuizConfig(v=>({...v,time:Math.min(5,Math.max(1,Number(e.target.value)))}))}><option value="1">1 minute</option><option value="2">2 minutes</option><option value="3">3 minutes</option><option value="4">4 minutes</option><option value="5">5 minutes</option></select>
            {quizError && <p className="error-text">{quizError}</p>}
            <button className="primary full" disabled={quizLoading} onClick={startQuiz}>{quizLoading ? "Creating quiz..." : "Start New Quiz"} <Play size={17}/></button>
          </div>}

          {quizStarted && currentQuestion && <div className="quiz-play-card">
            <div className="quiz-topline"><span>Question {quizIndex+1} / {quizQuestions.length}</span><strong><Clock3 size={15}/> {Math.floor(quizSecondsLeft/60)}:{String(quizSecondsLeft%60).padStart(2,"0")}</strong></div>
            <h2 className="math-question"><MathText text={currentQuestion.question}/></h2>
            <div className="quiz-options">{(currentQuestion.options||[]).map((option,i)=><button key={i} className={quizAnswers[quizIndex]===option?"selected":""} onClick={()=>setQuizAnswers(v=>({...v,[quizIndex]:option}))}><span className="option-letter">{String.fromCharCode(65+i)}</span><MathText text={option}/></button>)}</div>
            <div className="quiz-nav"><button className="secondary-action" disabled={quizIndex===0} onClick={()=>setQuizIndex(i=>i-1)}>Previous</button>{quizIndex===quizQuestions.length-1?<button className="primary" onClick={()=>finishQuiz(false)}>Finish Quiz <Trophy size={16}/></button>:<button className="primary" onClick={()=>setQuizIndex(i=>i+1)}>Next <ArrowRight size={16}/></button>}</div>
          </div>}

          {quizFinished && selectedQuizHistory && <div className="quiz-results">
            <div className="result-hero"><Trophy size={32}/><div><span className="eyebrow">QUIZ COMPLETE{selectedQuizHistory.timeUp ? " • TIME UP" : ""}</span><h2>{resultScore}/{resultQuestions.length}</h2><p>{Math.round((resultScore/Math.max(1,resultQuestions.length))*100)}% correct • {selectedQuizHistory.subject} • {selectedQuizHistory.topic}</p></div></div>
            {resultQuestions.map((q,i)=><div className="quiz-result-row" key={i}><div><b>Q{i+1}. <MathText text={q.question}/></b><p>Your answer: <span className={resultAnswers[i]===q.answer?"correct":"wrong"}><MathText text={resultAnswers[i] || "Not answered"}/></span></p><p>Correct answer: <strong><MathText text={q.answer}/></strong></p><small><MathText text={q.explanation}/></small></div><button className="secondary-action" onClick={()=>{const context={subject:selectedQuizHistory.subject,unit:selectedQuizHistory.unit,topic:selectedQuizHistory.topic};enterChat(context,false);setTimeout(()=>sendToAI(`Explain this quiz question clearly:
${q.question}
My answer: ${resultAnswers[i]||"Not answered"}
Correct answer: ${q.answer}
Give a simple explanation and one similar example.`,context,true),120);}}>Ask ISHRA</button></div>)}
            <button className="primary full" onClick={()=>{setQuizFinished(false);setQuizQuestions([]);setQuizAnswers({});setQuizIndex(0);setSelectedQuizHistory(null);}}>Create Another Quiz <RotateCcw size={16}/></button>
          </div>}

          {!quizStarted && !quizFinished && quizHistory.length > 0 && <div className="history-card">
            <div className="history-head"><div><span className="eyebrow">YOUR HISTORY</span><h2>Previous Quizzes</h2></div><span className="history-count">{quizHistory.length}</span></div>
            <div className="history-list">{quizHistory.map((item)=><button className="history-item" key={item.id} onClick={()=>setSelectedQuizHistory(item)}><div><b>{item.topic}</b><span>{item.subject} • {item.difficulty} • {item.questions.length} questions</span><small>{new Date(item.createdAt).toLocaleString()} {item.timeUp ? "• Time up" : ""}</small></div><strong>{item.score}/{item.questions.length}<ChevronRight size={17}/></strong></button>)}</div>
          </div>}

          {showHistoryResult && <div className="quiz-results history-open-result">
            <div className="result-hero"><Trophy size={32}/><div><span className="eyebrow">SAVED QUIZ RESULT</span><h2>{resultScore}/{resultQuestions.length}</h2><p>{selectedQuizHistory.subject} • {selectedQuizHistory.unit} • {selectedQuizHistory.topic}</p></div></div>
            {resultQuestions.map((q,i)=><div className="quiz-result-row" key={i}><div><b>Q{i+1}. <MathText text={q.question}/></b><p>Your answer: <span className={resultAnswers[i]===q.answer?"correct":"wrong"}><MathText text={resultAnswers[i] || "Not answered"}/></span></p><p>Correct answer: <strong><MathText text={q.answer}/></strong></p><small><MathText text={q.explanation}/></small></div><button className="secondary-action" onClick={()=>{const context={subject:selectedQuizHistory.subject,unit:selectedQuizHistory.unit,topic:selectedQuizHistory.topic};enterChat(context,false);setTimeout(()=>sendToAI(`Explain this saved quiz question clearly:
${q.question}
Correct answer: ${q.answer}`,context,true),120);}}>Ask ISHRA</button></div>)}
            <button className="secondary-action full" onClick={()=>setSelectedQuizHistory(null)}>Back to New Quiz</button>
          </div>}
        </div>
      </main>
    ));
  }

  /* =====================================================
     EXPLAIN IT BACK
  ===================================================== */

  if (screen === "teachback") {
    const topic = teachTopics.find(t=>t.id===teachBack.topicId);
    const minutes = Math.floor(teachSeconds/60);
    const seconds = teachSeconds%60;
    const selectedRecord = selectedTeachHistory;
    return shell(page(
      <main className="page-shell">
        <header className="topbar">
          <button className="ghost" onClick={() => { setTeachStarted(false); setTeachTimeUp(false); changeScreen("dashboard"); }}><ArrowLeft /> Dashboard</button>
          <div className="brand-small"><IshraLogo size="small" /><span>ISHRA</span></div>
        </header>
        <div className="page-content narrow">
          <div className="section-head"><div><div className="eyebrow">ACTIVE LEARNING</div><h1>Explain-It-Back</h1><p className="muted">ISHRA listens like a student. You teach, she evaluates.</p></div></div>

          {!teachStarted && !teachResult && !selectedRecord && <div className="quiz-config-card teachback-new-card">
            <div className="feature-hero-icon"><MessageCircle /></div>
            <div><span className="eyebrow">NEW TEACH-BACK</span><h2>Pick a topic and teach it your way</h2><p className="muted">Type or use your voice. ISHRA stays in student mode until you finish.</p></div>
            <label>Subject</label><select value={teachBack.subjectId} onChange={async e=>{const subjectId=e.target.value;setTeachBack(v=>({...v,subjectId,unitId:"",topicId:""}));const {data}=await supabase.from("syllabus_units").select("id,subject_id,unit_number,title").eq("subject_id",subjectId).order("unit_number");setTeachUnits(data||[]);setTeachTopics([]);}}><option value="">Select subject</option>{dbSubjects.map(s=><option key={s.id} value={s.id}>{s.name}</option>)}</select>
            <label>Unit / Chapter</label><select value={teachBack.unitId} disabled={!teachBack.subjectId} onChange={async e=>{const unitId=e.target.value;setTeachBack(v=>({...v,unitId,topicId:""}));const {data}=await supabase.from("topics").select("id,unit_id,title,description,topic_order").eq("unit_id",unitId).order("topic_order");setTeachTopics(data||[]);}}><option value="">Select unit</option>{teachUnits.map(u=><option key={u.id} value={u.id}>Unit {u.unit_number} — {u.title}</option>)}</select>
            <label>Topic</label><select value={teachBack.topicId} disabled={!teachBack.unitId} onChange={e=>setTeachBack(v=>({...v,topicId:e.target.value}))}><option value="">Select topic</option>{teachTopics.map(t=><option key={t.id} value={t.id}>{t.title}</option>)}</select>
            <label>Explain time</label><select value={teachBack.duration} onChange={e=>setTeachBack(v=>({...v,duration:Number(e.target.value)}))}>{[1,2,3,4,5,6,7,8,9,10].map(n=><option key={n} value={n}>{n} minute{n>1?"s":""}</option>)}</select>
            <button className="primary full" disabled={!topic} onClick={startTeachBack}>Start Explaining <Play size={16}/></button>
          </div>}

          {teachStarted && <div className="teachback-live-card">
            <div className="teachback-timer"><Clock3/> {minutes}:{String(seconds).padStart(2,"0")} / {teachBack.duration}:00</div>
            <div className="ishra-listener"><IshraLogo size="small"/><div><b>Okay, I'm listening 👀</b><span>Topic: {topic?.title}</span><small>What will you teach me today?</small></div></div>
            <textarea value={teachText} onChange={e=>setTeachText(e.target.value)} placeholder="Start teaching ISHRA in your own words..." rows="11"/>
            <div className="teachback-actions"><button className={teachListening?"danger-btn":"secondary-action"} onClick={()=>{const SpeechRecognition=window.SpeechRecognition||window.webkitSpeechRecognition;if(!SpeechRecognition){setTeachText(v=>v+"\nVoice input is not supported in this browser.");return;}if(teachListening){teachRecognitionRef.current?.stop();setTeachListening(false);return;}const recognition=new SpeechRecognition();recognition.lang=language==="Hinglish"?"en-IN":"en-US";recognition.continuous=true;recognition.interimResults=false;recognition.onresult=e=>{const text=Array.from(e.results).map(r=>r[0].transcript).join(" ");setTeachText(v=>(v?`${v} `:"")+text);};recognition.onend=()=>setTeachListening(false);teachRecognitionRef.current=recognition;recognition.start();setTeachListening(true);}}><Mic size={16}/>{teachListening?"Stop Voice":"Explain by Voice"}</button><button className="primary" onClick={finishTeachBack} disabled={teachLoading||!teachText.trim()}>{teachLoading?"Evaluating...":"Finish & Evaluate"} <Trophy size={16}/></button></div>
          </div>}

          {teachTimeUp && <div className="time-up-modal-backdrop"><div className="time-up-modal"><div className="time-up-icon"><Clock3/></div><span className="eyebrow">TIME UP</span><h2>Your explaining time is over ⏰</h2><p>You can finish now, or take one more minute to complete your explanation.</p><div className="teachback-actions"><button className="secondary-action" onClick={()=>{setTeachBack(v=>({...v,duration:Number(v.duration)+1}));setTeachTimeUp(false);setTeachStarted(true);}}>Add 1 min more</button><button className="primary" onClick={finishTeachBack} disabled={teachLoading||!teachText.trim()}>{teachLoading?"Evaluating...":"Finish & Evaluate"}</button></div></div></div>}

          {teachResult && selectedTeachHistory && <div className="teachback-result">
            <div className="result-hero"><Trophy size={32}/><div><span className="eyebrow">YOUR TEACH-BACK SCORE</span><h2>{teachResult.score ?? "—"}/10</h2><p>{teachResult.summary}</p></div></div>
            {teachResult.questions?.length>0 && <div className="teachback-question-card"><span className="eyebrow">ISHRA'S FOLLOW-UP</span><h3><MathText text={teachResult.questions[0]}/></h3><p className="muted">Try answering it yourself. If you get stuck, ask ISHRA to explain it.</p><div className="teachback-actions"><button className="secondary-action" onClick={()=>{const context={subject:selectedTeachHistory.subject,unit:selectedTeachHistory.unit,topic:selectedTeachHistory.topic};enterChat(context,false);setTimeout(()=>sendToAI(`I just finished Explain-It-Back. Please ask me this follow-up question and then explain the concept if I get stuck: ${teachResult.questions[0]}`,context,true),120);}}>Ask ISHRA</button></div></div>}
            <div className="teachback-feedback-grid"><div><b>What you did well</b><ul>{(teachResult.strengths||[]).map((x,i)=><li key={i}><MathText text={x}/></li>)}</ul></div><div><b>What to improve</b><ul>{(teachResult.improvements||[]).map((x,i)=><li key={i}><MathText text={x}/></li>)}</ul></div></div>
            <button className="primary full" onClick={()=>{setTeachResult(null);setTeachText("");setSelectedTeachHistory(null);setTeachTimeUp(false);}}>Start New Teach-Back <RotateCcw size={16}/></button>
          </div>}

          {!teachStarted && !teachResult && !selectedRecord && teachHistory.length > 0 && <div className="history-card"><div className="history-head"><div><span className="eyebrow">YOUR HISTORY</span><h2>Previous Teach-Backs</h2></div><span className="history-count">{teachHistory.length}</span></div><div className="history-list">{teachHistory.map((item)=><button className="history-item" key={item.id} onClick={()=>{setSelectedTeachHistory(item);setTeachResult(item.result);setTeachBack(v=>({...v,duration:item.duration}));}}><div><b>{item.topic}</b><span>{item.subject} • {item.duration} min</span><small>{new Date(item.createdAt).toLocaleString()}</small></div><strong>{item.result?.score ?? "—"}/10<ChevronRight size={17}/></strong></button>)}</div></div>}

          {selectedRecord && !teachResult && <div className="teachback-result history-open-result"><div className="result-hero"><Trophy size={32}/><div><span className="eyebrow">SAVED TEACH-BACK RESULT</span><h2>{selectedRecord.result?.score ?? "—"}/10</h2><p>{selectedRecord.subject} • {selectedRecord.unit} • {selectedRecord.topic}</p></div></div><div className="teachback-history-explanation"><span className="eyebrow">YOUR EXPLANATION</span><p>{selectedRecord.explanation}</p></div><button className="secondary-action full" onClick={()=>setSelectedTeachHistory(null)}>Back to New Teach-Back</button></div>}
        </div>
      </main>
    ));
  }

  /* =====================================================
     SUBJECTS
  ===================================================== */

  if (
    screen ===
    "subjects"
  ) {
    return shell(
      page(
        <main className="page-shell">
          <header className="topbar">
            <button
              className="ghost"
              onClick={() =>
                changeScreen(
                  "dashboard"
                )
              }
            >
              <ArrowLeft />
              Dashboard
            </button>

            <div className="brand-small">
              <IshraLogo size="small" />
              <span>
                ISHRA
              </span>
            </div>
          </header>

          <div className="page-content">
            <div className="section-head">
              <div>
                <div className="eyebrow">
                  ACADEMICS
                </div>

                <h1>
                  Subjects
                </h1>

                <p className="muted">
                  Your Semester 1 subjects from the AKTU syllabus.
                </p>
              </div>

              <button
                className="secondary-action"
                onClick={() => {
                  setMaterialSubject(
                    ""
                  );

                  changeScreen(
                    "material"
                  );
                }}
              >
                <FileText
                  size={17}
                />
                My Study Vault
              </button>
            </div>

            {loadingSubjects && (
              <div className="empty-state">
                Loading subjects...
              </div>
            )}

            {dbError && (
              <div className="empty-state">
                <p>
                  Could not load subjects.
                </p>

                <small>
                  {dbError}
                </small>
              </div>
            )}

            <div className="subject-grid">
              {dbSubjects.map(
                (s, i) => (
                  <button
                    className="subject-card stagger"
                    style={{
                      "--i":
                        i
                    }}
                    key={s.id}
                    onClick={async () => {
                      setSelectedSubject(
                        s
                      );

                      setSelectedUnit(
                        null
                      );

                      setTopics(
                        []
                      );

                      await loadUnits(
                        s
                      );

                      changeScreen(
                        "units"
                      );
                    }}
                  >
                    <div className="subject-icon">
                      <BookOpen
                        size={21}
                      />
                    </div>

                    <h3>
                      {s.name}
                    </h3>

                    <p>
                      {s.teacher_name ||
                        "Faculty"}
                    </p>

                    <div className="mini-progress">
                      <span
                        style={{
                          width: `${
                            subjectProgress[
                              s.id
                            ] || 0
                          }%`
                        }}
                      />
                    </div>

                    <small>
                      {
                        subjectProgress[
                          s.id
                        ] || 0
                      }
                      % complete
                      <ChevronRight
                        size={14}
                      />
                    </small>
                  </button>
                )
              )}
            </div>
          </div>
        </main>
      )
    );
  }

  /* =====================================================
     UNITS
  ===================================================== */

  if (
    screen ===
    "units"
  ) {
    return shell(
      page(
        <main className="page-shell">
          <header className="topbar">
            <button
              className="ghost"
              onClick={() =>
                changeScreen(
                  "subjects"
                )
              }
            >
              <ArrowLeft />
              Subjects
            </button>

            <div className="brand-small">
              <IshraLogo size="small" />
              <span>
                ISHRA
              </span>
            </div>
          </header>

          <div className="page-content">
            <div className="section-head">
              <div>
                <div className="eyebrow">
                  {
                    selectedSubject?.code ||
                    "SUBJECT"
                  }
                </div>

                <h1>
                  {
                    selectedSubject?.name
                  }
                </h1>

                <p className="muted">
                  {
                    selectedSubject?.teacher_name ||
                    "Faculty"
                  }
                </p>
              </div>
            </div>

            {loadingUnits && (
              <div className="empty-state">
                Loading units...
              </div>
            )}

            {dbError && (
              <div className="empty-state">
                <p>
                  Could not load units.
                </p>

                <small>
                  {dbError}
                </small>
              </div>
            )}

            <div className="subject-grid">
              {units.map(
                (unit, i) => (
                  <button
                    className="subject-card stagger"
                    style={{
                      "--i":
                        i
                    }}
                    key={unit.id}
                    onClick={async () => {
                      setSelectedUnit(
                        unit
                      );

                      await loadTopics(
                        unit
                      );

                      changeScreen(
                        "topics"
                      );
                    }}
                  >
                    <div className="subject-icon">
                      <BookOpen
                        size={21}
                      />
                    </div>

                    <div className="eyebrow">
                      UNIT{" "}
                      {
                        unit.unit_number
                      }
                    </div>

                    <h3>
                      {
                        unit.title
                      }
                    </h3>

                    <small>
                      View topics
                      <ChevronRight
                        size={14}
                      />
                    </small>
                  </button>
                )
              )}
            </div>
          </div>
        </main>
      )
    );
  }

  /* =====================================================
     TOPICS
  ===================================================== */

  if (
    screen ===
    "topics"
  ) {
    return shell(
      page(
        <main className="page-shell">
          <header className="topbar">
            <button
              className="ghost"
              onClick={() =>
                changeScreen(
                  "units"
                )
              }
            >
              <ArrowLeft />
              Units
            </button>

            <div className="brand-small">
              <IshraLogo size="small" />
              <span>
                ISHRA
              </span>
            </div>
          </header>

          <div className="page-content">
            <div className="section-head">
              <div>
                <div className="eyebrow">
                  {
                    selectedSubject?.name
                  }
                </div>

                <h1>
                  Unit{" "}
                  {
                    selectedUnit?.unit_number
                  }
                </h1>

                <p className="muted">
                  {
                    selectedUnit?.title
                  }
                </p>
              </div>
            </div>

            {loadingTopics && (
              <div className="empty-state">
                Loading topics...
              </div>
            )}

            {dbError && (
              <div className="empty-state">
                <p>
                  Could not load topics.
                </p>

                <small>
                  {dbError}
                </small>
              </div>
            )}

            <div className="material-list">
              {topics.map(
                (topic, i) => (
                  <div
                    className={`material-card topic-row stagger ${
                      completedTopics[
                        topic.id
                      ]
                        ? "topic-completed"
                        : ""
                    }`}
                    style={{
                      "--i":
                        i
                    }}
                    key={topic.id}
                  >
                    <div className="material-icon">
                      {completedTopics[
                        topic.id
                      ] ? (
                        <CheckCircle2 />
                      ) : (
                        <BookOpen />
                      )}
                    </div>

                    <div className="topic-main">
                      <h3>
                        {
                          topic.title
                        }
                      </h3>

                      {topic.description && (
                        <p>
                          {
                            topic.description
                          }
                        </p>
                      )}

                      <small>
                        Topic{" "}
                        {
                          topic.topic_order
                        }
                      </small>
                    </div>

                    <button
                      className="topic-ai-btn"
                      onClick={() =>
                        openTopic(
                          topic
                        )
                      }
                      title="Study this topic with ISHRA"
                    >
                      <IshraLogo size="tiny" />
                      <span>
                        Ask ISHRA
                      </span>
                    </button>

                    <button
                      className={
                        completedTopics[
                          topic.id
                        ]
                          ? "success-btn"
                          : "complete-btn"
                      }
                      onClick={() =>
                        toggleTopicProgress(
                          topic.id
                        )
                      }
                      disabled={
                        savingProgress
                      }
                    >
                      {completedTopics[
                        topic.id
                      ] ? (
                        <>
                          <Check
                            size={15}
                          />
                          Completed
                        </>
                      ) : (
                        "Mark Complete"
                      )}
                    </button>
                  </div>
                )
              )}
            </div>
          </div>
        </main>
      )
    );
  }

  /* =====================================================
     MATERIALS
  ===================================================== */

  if (
    screen ===
    "material"
  ) {
    return shell(
      page(
        <main className="page-shell">
          <header className="topbar">
            <button
              className="ghost"
              onClick={() =>
                changeScreen(
                  "subjects"
                )
              }
            >
              <ArrowLeft />
              Subjects
            </button>

            <div className="brand-small">
              <IshraLogo size="small" />
              <span>
                ISHRA
              </span>
            </div>

            <button
              className="upload-button"
              onClick={() =>
                setShowUploadModal(
                  true
                )
              }
            >
              <Upload
                size={17}
              />
              Upload Material
            </button>
          </header>

          <div className="page-content">
            <div className="section-head">
              <div>
                <div className="eyebrow">
                  MY STUDY MATERIAL
                </div>

                <h1>
                  My Study Vault
                </h1>

                <p className="muted">
                  Save board photos, notes, PDFs and documents so they stay organized for your study.
                </p>
              </div>
            </div>

            <div className="material-toolbar">
              <div className="search-field">
                <Search
                  size={17}
                />

                <input
                  value={
                    materialSearch
                  }
                  onChange={(
                    e
                  ) =>
                    setMaterialSearch(
                      e.target
                        .value
                    )
                  }
                  placeholder="Search saved material..."
                />
              </div>

              <select
                value={
                  materialSubject
                }
                onChange={(
                  e
                ) =>
                  setMaterialSubject(
                    e.target
                      .value
                  )
                }
              >
                <option value="">
                  All subjects
                </option>

                {dbSubjects.map(
                  (s) => (
                    <option
                      key={s.id}
                      value={
                        s.name
                      }
                    >
                      {s.name}
                    </option>
                  )
                )}
              </select>
            </div>

            <div className="material-info">
              <Sparkles
                size={17}
              />

              <span>
                Tip: board photos can be attached directly to ISHRA so it can read and explain them.
              </span>
            </div>

            <div className="material-list">
              {filteredMaterials.length ? (
                filteredMaterials.map(
                  (m, i) => (
                    <div
                      className="material-card stagger"
                      style={{
                        "--i":
                          i
                      }}
                      key={m.id}
                    >
                      <div className="material-icon">
                        {m.type ===
                        "image" ? (
                          <FileImage />
                        ) : (
                          <FileText />
                        )}
                      </div>

                      <div className="topic-main">
                        <h3>
                          {m.title}
                        </h3>

                        <p>
                          {m.subject}
                          {m.topic
                            ? ` • ${m.topic}`
                            : ""}
                        </p>

                        <small>
                          {m.date} •{" "}
                          {m.size
                            ? `${Math.max(
                                1,
                                Math.round(
                                  m.size /
                                    1024
                                )
                              )} KB`
                            : "Saved"}
                        </small>
                      </div>

                      <button
                        className="icon-btn"
                        onClick={() =>
                          openMaterialChat(
                            m
                          )
                        }
                        title="Ask ISHRA about this"
                      >
                        <Sparkles
                          size={17}
                        />
                      </button>

                      {m.url && (
                        <a
                          className="icon-btn"
                          href={
                            m.url
                          }
                          target="_blank"
                          rel="noreferrer"
                          download={
                            m.title
                          }
                        >
                          <Download
                            size={17}
                          />
                        </a>
                      )}
                    </div>
                  )
                )
              ) : (
                <div className="empty-state">
                  <FileText
                    size={24}
                  />

                  <p>
                    No saved material yet.
                  </p>

                  <small>
                    Upload your first board photo, note or PDF.
                  </small>
                </div>
              )}
            </div>
          </div>

          {showUploadModal && (
            <div className="overlay">
              <div className="upload-modal modal-pop">
                <button
                  className="modal-close"
                  onClick={() =>
                    setShowUploadModal(
                      false
                    )
                  }
                >
                  <X
                    size={18}
                  />
                </button>

                <div className="modal-icon">
                  <Upload />
                </div>

                <h2>
                  Add class material
                </h2>

                <p className="muted">
                  Choose the subject first, then select your file.
                </p>

                <label>
                  Subject
                </label>

                <select
                  value={
                    materialSubject
                  }
                  onChange={(
                    e
                  ) =>
                    setMaterialSubject(
                      e.target
                        .value
                    )
                  }
                >
                  <option value="">
                    General
                  </option>

                  {dbSubjects.map(
                    (s) => (
                      <option
                        key={s.id}
                        value={
                          s.name
                        }
                      >
                        {s.name}
                      </option>
                    )
                  )}
                </select>

                <button
                  className="primary full"
                  onClick={() =>
                    materialFileInputRef.current?.click()
                  }
                >
                  <Upload
                    size={17}
                  />
                  Choose file
                </button>

                <input
                  ref={
                    materialFileInputRef
                  }
                  hidden
                  type="file"
                  accept="image/*,.pdf,.txt,.doc,.docx,.ppt,.pptx"
                  onChange={
                    uploadMaterial
                  }
                />
              </div>
            </div>
          )}
        </main>
      )
    );
  }

  /* =====================================================
     PLANNER
  ===================================================== */

  if (
    screen ===
    "planner"
  ) {
    return shell(
      page(
        <main className="page-shell">
          <header className="topbar">
            <button
              className="ghost"
              onClick={() =>
                changeScreen(
                  "dashboard"
                )
              }
            >
              <ArrowLeft />
              Dashboard
            </button>

            <div className="brand-small">
              <IshraLogo size="small" />
              <span>
                ISHRA Planner
              </span>
            </div>
          </header>

          <div className="page-content planner-page">
            <div className="section-head">
              <div>
                <div className="eyebrow">
                  WEEKLY TIMETABLE • B-10 CSE-AI
                </div>

                <h1>
                  Class Planner
                </h1>

                <p className="muted">
                  Complete day-wise timetable based on the college schedule.
                </p>
              </div>
            </div>

            <div className="day-tabs">
              {DAY_ORDER.map(
                (day) => (
                  <button
                    key={day}
                    className={
                      plannerDay ===
                      day
                        ? "active"
                        : ""
                    }
                    onClick={() =>
                      setPlannerDay(
                        day
                      )
                    }
                  >
                    {day.slice(
                      0,
                      3
                    )}
                    <span>
                      {day}
                    </span>
                  </button>
                )
              )}
            </div>

            <div className="planner-date-note">
              {plannerDay ===
              "Saturday"
                ? "Saturday follows Monday timetable only on the 5th Saturday."
                : `${plannerDay}'s classes`}
            </div>

            <div className="planner-list">
              {classEntriesForDay(
                plannerDay,
                currentTime
              ).map(
                (item, i) => {
                  const code =
                    item[2];

                  return (
                    <div
                      className={`planner-item ${
                        code ===
                        "LUNCH"
                          ? "lunch"
                          : ""
                      }`}
                      key={i}
                    >
                      <div className="planner-time">
                        <b>
                          {formatTime(
                            item[0]
                          )}
                        </b>

                        <span>
                          {formatTime(
                            item[1]
                          )}
                        </span>
                      </div>

                      <div className="planner-line" />

                      <div className="planner-info">
                        <div className="planner-badge">
                          {entryLabel(
                            code
                          )}
                        </div>

                        <h3>
                          {item[3] ||
                            entrySubject(
                              code
                            )}
                        </h3>

                        <p>
                          {entryTeacher(
                            code
                          )}
                        </p>
                      </div>
                    </div>
                  );
                }
              )}
            </div>
          </div>
        </main>
      )
    );
  }

  /* =====================================================
     PROGRESS
  ===================================================== */

  if (
    screen ===
    "progress"
  ) {
    return shell(
      page(
        <main className="page-shell">
          <header className="topbar">
            <button
              className="ghost"
              onClick={() =>
                changeScreen(
                  "dashboard"
                )
              }
            >
              <ArrowLeft />
              Dashboard
            </button>

            <div className="brand-small">
              <IshraLogo size="small" />
              <span>
                ISHRA
              </span>
            </div>
          </header>

          <div className="page-content">
            <div className="section-head">
              <div>
                <div className="eyebrow">
                  STUDENT PROGRESS
                </div>

                <h1>
                  My Progress
                </h1>

                <p className="muted">
                  Based on the topics you mark as completed.
                </p>
              </div>
            </div>

            <div className="overall-card">
              <div>
                <span className="eyebrow">
                  OVERALL
                </span>

                <strong>
                  {
                    overallProgress
                  }
                  %
                </strong>
              </div>

              <div className="overall-track">
                <span
                  style={{
                    width: `${overallProgress}%`
                  }}
                />
              </div>
            </div>

            <div className="academic-health-card">
              <div className="health-icon"><Activity /></div>
              <div className="health-copy">
                <span className="eyebrow">ACADEMIC HEALTH</span>
                <h2>{overallProgress >= 70 ? "On Track" : overallProgress >= 40 ? "Needs Attention" : "At Risk"}</h2>
                <p>{overallProgress >= 70 ? "Your overall learning progress is moving well. Keep the momentum." : overallProgress >= 40 ? "A few subjects need focused attention and revision." : "Several topics are still pending. ISHRA recommends focused study sessions."}</p>
              </div>
              <strong>{overallProgress}%</strong>
            </div>

            <div className="subject-progress-grid">
              {dbSubjects.map((s) => {
                const value = subjectProgress[s.id] || 0;
                const status = value >= 70 ? "On Track" : value >= 40 ? "Needs Attention" : "At Risk";
                const healthClass = value >= 70 ? "good" : value >= 40 ? "attention" : "risk";
                return (
                  <div className="progress-card" key={s.id}>
                    <div>
                      <b>{s.name}</b>
                      <span>{value}%</span>
                    </div>
                    <div className={`subject-health-badge health-${healthClass}`}>{status}</div>
                    <div className="progress-track">
                      <div style={{ width: `${value}%` }} />
                    </div>
                  </div>
                );
              })}
            </div>
          </div>
        </main>
      )
    );
  }

  /* =====================================================
     PROFILE
  ===================================================== */

  if (
    screen ===
    "profile"
  ) {
    return shell(
      page(
        <main className="page-shell">
          <header className="topbar">
            <button
              className="ghost"
              onClick={() =>
                changeScreen(
                  "dashboard"
                )
              }
            >
              <ArrowLeft />
              Dashboard
            </button>

            <div className="brand-small">
              <IshraLogo size="small" />
              <span>
                ISHRA
              </span>
            </div>
          </header>

          <div className="page-content narrow">
            <div className="profile-hero">
              <div className="profile-avatar">
                {(
                  name ||
                  "S"
                )
                  .slice(
                    0,
                    1
                  )
                  .toUpperCase()}
              </div>

              <div>
                <div className="eyebrow">
                  STUDENT PROFILE
                </div>

                <h1>
                  {name ||
                    "Student"}
                </h1>

                <p>
                  {email ||
                    "Student@bbditm.ac.in"}
                </p>
              </div>
            </div>

            <div className="settings-card">
              <div>
                <span>
                  Branch
                </span>

                <b>
                  {branch ||
                    "CSE-AI"}
                </b>
              </div>

              <div>
                <span>
                  Section
                </span>

                <b>
                  {section ||
                    "B-10"}
                </b>
              </div>

              <div>
                <span>
                  Semester
                </span>

                <b>
                  1
                </b>
              </div>

              <div>
                <span>
                  Preferred Language
                </span>

                <b>
                  {language ||
                    "Not selected"}
                </b>
              </div>

              <div className="setting-action">
                <span>
                  Theme
                </span>

                <button
                  className="ghost"
                  onClick={() =>
                    setTheme(
                      theme ===
                        "dark"
                        ? "light"
                        : "dark"
                    )
                  }
                >
                  {theme ===
                  "dark"
                    ? "Dark"
                    : "Light"}
                </button>
              </div>

              <div className="setting-action">
                <span>
                  Change language
                </span>

                <button
                  className="ghost"
                  onClick={() => {
                    changeScreen(
                      "ishra"
                    );

                    setShowLanguage(
                      true
                    );
                  }}
                >
                  Change
                </button>
              </div>
            </div>
          </div>
        </main>
      )
    );
  }

  /* =====================================================
     DASHBOARD
  ===================================================== */

  return shell(
    page(
      <main className="dashboard">
        <header className="dashboard-top">
          <div className="brand-small">
            <IshraLogo size="small" />
            <span>
              ISHRA
            </span>
          </div>

          <div className="top-actions">
            <button
              className="icon-btn"
              onClick={() =>
                changeScreen(
                  "planner"
                )
              }
              title="Weekly planner"
            >
              <CalendarDays
                size={19}
              />
            </button>

            <button
              className="icon-btn"
              onClick={() =>
                changeScreen(
                  "material"
                )
              }
              title="My Study Vault"
            >
              <FileText
                size={19}
              />
            </button>

            <button
              className="profile-button"
              onClick={() =>
                changeScreen(
                  "profile"
                )
              }
            >
              <CircleUserRound
                size={21}
              />
            </button>
          </div>
        </header>

        <div className="dashboard-content">
          <div className="greeting">
            <div>
              <div className="eyebrow">
                B-10 • CSE-AI • SEMESTER 1
              </div>

              <h1>
                {currentTime.getHours() <
                12
                  ? "Good morning"
                  : currentTime.getHours() <
                    17
                  ? "Good afternoon"
                  : "Good evening"}
                ,{" "}
                {name ||
                  "Student"}{" "}
                👋
              </h1>
               
               
              <div className="ppt-qr-card">
  <div className="ppt-qr-image-wrap">
    <img
      src="/ppt-qr.jpeg"
      alt="VisionX Team Presentation QR Code"
    />
  </div>

  <div className="ppt-qr-info">
    <div className="ppt-qr-title">
      VisionX Team Presentation
    </div>

    <a
      className="ppt-qr-link"
      href="https://drive.google.com/file/d/1UiwgvR-_JvcFYetu2sG76BwmZ5EqX-P7/view?usp=drivesdk"
      target="_blank"
      rel="noopener noreferrer"
    >
      Scan or Click here to view
    </a>
  </div>
</div>


              <p className="muted">
                Here’s what your academic day looks like.
              </p>
            </div>
          </div>

          <section className="schedule-section">
            <div className="section-head compact">
              <div>
                <div className="eyebrow">
                  TODAY'S SCHEDULE
                </div>

                <h2>
                  {currentTime.toLocaleDateString(
                    "en-IN",
                    {
                      weekday:
                        "long",
                      day: "numeric",
                      month:
                        "long",
                      year:
                        "numeric"
                    }
                  )}
                </h2>
              </div>

              <button
                className="calendar-action"
                onClick={() => {
                  setPlannerDay(
                    getDayName(
                      currentTime
                    )
                  );

                  changeScreen(
                    "planner"
                  );
                }}
                title="Open weekly planner"
              >
                <CalendarDays
                  size={22}
                />
              </button>
            </div>

            <div className="schedule-card">
              <div className="status-grid">
                <div className="schedule-status previous">
                  <small>
                    LAST CLASS
                  </small>

                  <strong>
                    {scheduleState.previous
                      ? entryLabel(
                          scheduleState
                            .previous
                            .code
                        )
                      : "—"}
                  </strong>

                  <span>
                    {scheduleState.previous
                      ? `${formatTime(
                          scheduleState
                            .previous
                            .start
                        )} – ${formatTime(
                          scheduleState
                            .previous
                            .end
                        )}`
                      : "No previous class"}
                  </span>
                </div>

                <div className="schedule-status current">
                  <small>
                    {scheduleState.current
                      ? "CURRENT CLASS"
                      : "CLASS STATUS"}
                  </small>

                  <strong>
                    {scheduleState.current
                      ? entryLabel(
                          scheduleState
                            .current
                            .code
                        )
                      : "No class right now"}
                  </strong>

                  <span>
                    {scheduleState.current
                      ? `${formatTime(
                          scheduleState
                            .current
                            .start
                        )} – ${formatTime(
                          scheduleState
                            .current
                            .end
                        )}`
                      : scheduleState.upcoming
                      ? `Next at ${formatTime(
                          scheduleState
                            .upcoming
                            .start
                        )}`
                      : "Day completed"}
                  </span>

                  {scheduleState.current && (
                    <em>
                      {entryTeacher(
                        scheduleState
                          .current
                          .code
                      )}
                    </em>
                  )}
                </div>

                <div className="schedule-status upcoming">
                  <small>
                    UPCOMING CLASS
                  </small>

                  <strong>
                    {scheduleState.upcoming
                      ? entryLabel(
                          scheduleState
                            .upcoming
                            .code
                        )
                      : "—"}
                  </strong>

                  <span>
                    {scheduleState.upcoming
                      ? `${formatTime(
                          scheduleState
                            .upcoming
                            .start
                        )} – ${formatTime(
                          scheduleState
                            .upcoming
                            .end
                        )}`
                      : "No upcoming class"}
                  </span>
                </div>
              </div>

              <div className="schedule-strip">
                {todayEntries.map(
                  (
                    item,
                    i
                  ) => {
                    const active =
                      i ===
                      scheduleState.currentIndex;

                    const startMinutes =
                      timeToMinutes(
                        item?.start
                      );

                    const nowMinutes =
                      currentTime.getHours() *
                        60 +
                      currentTime.getMinutes();

                    return (
                      <button
                        key={i}
                        className={
                          active
                            ? "active"
                            : ""
                        }
                        onClick={() => {}}
                      >
                        <small>
                          {active
                            ? "Current"
                            : startMinutes <
                              nowMinutes
                            ? "Done"
                            : "Upcoming"}
                        </small>

                        <b>
                          {entryLabel(
                            item?.code
                          )}
                        </b>

                        <span>
                          {formatTime(
                            item?.start
                          )}{" "}
                          –{" "}
                          {formatTime(
                            item?.end
                          )}
                        </span>
                      </button>
                    );
                  }
                )}
              </div>
            </div>
          </section>

          <button
            className="dive-bar"
            onClick={() =>
              enterChat()
            }
          >
            <div className="dive-icon">
              <Sparkles
                size={19}
              />
            </div>

            <div className="dive-copy">
              <strong>
                Dive into ISHRA
              </strong>

              <span>
                Your intelligent academic companion
              </span>
            </div>

            <ChevronRight className="dive-arrow" />
          </button>

          <div className="dashboard-links dashboard-core-links">
            <button onClick={() => changeScreen("subjects")}><BookOpen /><span>Subjects</span><ChevronRight /></button>
            <button onClick={() => changeScreen("material")}><FileText /><span>My Study Vault</span><ChevronRight /></button>
            <button onClick={() => changeScreen("progress")}><Sparkles /><span>My Progress</span><ChevronRight /></button>
          </div>

          <section className="smart-tools-grid">
            <button className="smart-tool-card featured" onClick={openStudyNow}>
              <Target />
              <div><span>PERSONALIZED RECOMMENDATION</span><h3>What Should I Study Now?</h3><p>Let ISHRA choose your next useful topic from your real progress.</p></div>
              <ChevronRight />
            </button>
            <button className="smart-tool-card" onClick={() => changeScreen("continue")}>
              <Play />
              <div><span>RESUME</span><h3>Continue Learning</h3><p>Jump back into your latest topic.</p></div>
              <ChevronRight />
            </button>
            <button className="smart-tool-card" onClick={() => { setQuizStarted(false); setQuizFinished(false); setQuizQuestions([]); setQuizAnswers({}); setQuizIndex(0); setSelectedQuizHistory(null); changeScreen("quiz"); }}>
              <Trophy />
              <div><span>PRACTICE</span><h3>Quick Quiz</h3><p>Build a timed MCQ quiz in seconds.</p></div>
              <ChevronRight />
            </button>
            <button className="smart-tool-card" onClick={() => { setTeachStarted(false); setTeachResult(null); setSelectedTeachHistory(null); setTeachTimeUp(false); changeScreen("teachback"); }}>
              <MessageCircle />
              <div><span>ACTIVE LEARNING</span><h3>Explain-It-Back</h3><p>Teach ISHRA the topic and test your understanding.</p></div>
              <ChevronRight />
            </button>
          </section>


        </div>
      </main>
    )
  );
}

createRoot(
  document.getElementById(
    "root"
  )
).render(
  <App />
);
