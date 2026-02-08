<script>
  import { sanitizeScenario } from "../lib/scenarioUtils.js";
  /**
   * Scenario editor with syntax highlighting for IoTManager scenario language.
   * Uses a mirror div behind a transparent textarea so we don't need CodeMirror.
   * Paste is sanitized so control chars and wrong line endings don't enter (IoTScenario compatibility).
   */
  export let value = "";
  export let rows = 10;
  export let placeholder = "";
  export let disabled = false;
  /** Optional CSS class for the wrapper */
  export let className = "";

  const baseClass =
    "px-2 py-1.5 bg-gray-50 border-2 border-gray-200 rounded text-gray-700 leading-tight focus:outline-none focus:bg-white focus:border-indigo-500 w-full font-mono text-sm resize-none";

  // Keywords and built-ins for IoTManager scenario language
  const KEYWORDS = new Set([
    "if",
    "then",
    "else",
    "and",
    "or",
    "not",
  ]);
  const FUNCTIONS = new Set([
    "getIP",
    "getUptime",
    "getHours",
    "getMinutes",
    "getSeconds",
    "sendMsg",
    "createItemFromNet",
  ]);

  function escapeHtml(s) {
    return s
      .replace(/&/g, "&amp;")
      .replace(/</g, "&lt;")
      .replace(/>/g, "&gt;")
      .replace(/"/g, "&quot;");
  }

  function tokenizeLine(line) {
    const tokens = [];
    let i = 0;
    const n = line.length;

    while (i < n) {
      // Comment from # to EOL
      if (line[i] === "#") {
        const start = i;
        while (i < n) i++;
        tokens.push({ type: "comment", text: line.slice(start, i) });
        continue;
      }
      // Double-quoted string
      if (line[i] === '"') {
        const start = i;
        i++;
        while (i < n && line[i] !== '"') {
          if (line[i] === "\\") i++;
          i++;
        }
        if (i < n) i++;
        tokens.push({ type: "string", text: line.slice(start, i) });
        continue;
      }
      // Number
      if (/\d/.test(line[i])) {
        const start = i;
        while (i < n && /[\d.]/.test(line[i])) i++;
        tokens.push({ type: "number", text: line.slice(start, i) });
        continue;
      }
      // Word (identifier / keyword / function)
      if (/[a-zA-Z_]\w*/.test(line[i]) || (line[i] === "_" && line[i + 1]?.match(/\w/))) {
        const start = i;
        while (i < n && /\w/.test(line[i])) i++;
        const word = line.slice(start, i);
        let type = "identifier";
        if (KEYWORDS.has(word)) type = "keyword";
        else if (FUNCTIONS.has(word)) type = "function";
        tokens.push({ type, text: word });
        continue;
      }
      // Single character (operator, brace, etc.)
      tokens.push({ type: "default", text: line[i] });
      i++;
    }
    return tokens;
  }

  function highlight(text) {
    if (text == null) text = "";
    const lines = text.split("\n");
    const out = [];
    for (const line of lines) {
      const tokens = tokenizeLine(line);
      let lineHtml = "";
      for (const t of tokens) {
        const esc = escapeHtml(t.text);
        lineHtml += `<span class="scn-${t.type}">${esc}</span>`;
      }
      out.push(lineHtml);
    }
    return out.join("\n");
  }

  $: highlightedHtml = highlight(value);
  $: containerStyle = `min-height: calc(1.5em * ${rows} + 1rem);`;
  $: validation = validateScenario(value);

  const INDENT = "  "; // 2 spaces per level

  /**
   * Validate scenario: balanced braces { }, no unclosed strings.
   * Returns { valid: boolean, errors: { line: number, message: string }[] }
   */
  function validateScenario(text) {
    const errors = [];
    if (!text || typeof text !== "string") return { valid: true, errors };

    const lines = text.split("\n");
    const stack = []; // { lineNum } for each unmatched {

    for (let lineNum = 1; lineNum <= lines.length; lineNum++) {
      const line = lines[lineNum - 1];
      let i = 0;
      const n = line.length;

      while (i < n) {
        // Comment: skip to EOL
        if (line[i] === "#") break;
        // String: skip to closing "
        if (line[i] === '"') {
          i++;
          while (i < n && line[i] !== '"') {
            if (line[i] === "\\") i++;
            i++;
          }
          if (i < n) i++;
          continue;
        }
        if (line[i] === "{") {
          stack.push(lineNum);
          i++;
          continue;
        }
        if (line[i] === "}") {
          if (stack.length === 0) {
            errors.push({ line: lineNum, message: "Лишняя закрывающая скобка }" });
          } else {
            stack.pop();
          }
          i++;
          continue;
        }
        i++;
      }
    }

    while (stack.length > 0) {
      const openLine = stack.pop();
      errors.push({ line: openLine, message: "Нет закрывающей скобки } для открывающей {" });
    }

    // Unclosed string: odd number of " outside comments
    let quoteCount = 0;
    for (let lineNum = 0; lineNum < lines.length; lineNum++) {
      const line = lines[lineNum];
      for (let i = 0; i < line.length; i++) {
        if (line[i] === "#") break;
        if (line[i] === '"') quoteCount++;
      }
    }
    if (quoteCount % 2 !== 0) {
      errors.push({ line: 1, message: "Незакрытая строка (нечётное число кавычек)" });
    }

    return { valid: errors.length === 0, errors };
  }

  /**
   * Format scenario: indent by block level (then {, else {, }), trim lines, blank line between logical blocks.
   */
  function formatScenario(text) {
    if (!text || typeof text !== "string") return text;
    const lines = text.split("\n");
    const out = [];
    let level = 0;

    for (let i = 0; i < lines.length; i++) {
      let line = lines[i];
      const trimmed = line.trim();
      if (trimmed === "") {
        out.push("");
        continue;
      }
      // Comment-only: keep as-is with current indent
      if (trimmed.startsWith("#")) {
        out.push(INDENT.repeat(level) + trimmed);
        continue;
      }
      // Line that starts with }: decrease level then output
      if (trimmed.startsWith("}")) {
        level = Math.max(0, level - 1);
      }
      out.push(INDENT.repeat(level) + trimmed);
      // Line ends with { (e.g. then {, else {): increase level for next
      if (trimmed.endsWith("{") && !trimmed.startsWith("#")) {
        level++;
      }
    }
    return out.join("\n");
  }

  function handleFormat() {
    value = formatScenario(value);
  }

  function handleInput(e) {
    value = e.target.value;
  }

  function handlePaste(e) {
    const pasted = (e.clipboardData || window.clipboardData)?.getData("text");
    if (pasted == null) return;
    const sanitized = sanitizeScenario(pasted);
    if (sanitized === pasted) return; // let default paste happen
    e.preventDefault();
    const ta = e.target;
    const start = ta.selectionStart;
    const end = ta.selectionEnd;
    value = value.slice(0, start) + sanitized + value.slice(end);
    const newPos = start + sanitized.length;
    setTimeout(() => ta.setSelectionRange(newPos, newPos), 0);
  }
</script>

<div
  class="scenario-editor relative {className}"
  style={containerStyle}
>
  <div class="scenario-toolbar flex justify-end mb-1">
    <button
      type="button"
      class="text-sm px-2 py-1 rounded border border-gray-300 bg-gray-100 hover:bg-gray-200 text-gray-700"
      on:click={handleFormat}
      title="Format scenario (indent blocks)"
    >Форматировать</button>
  </div>
  <div class="scenario-editor-area relative" style={containerStyle}>
    <!-- Mirror: highlighted content behind -->
    <pre
      class="scenario-mirror {baseClass}"
      aria-hidden="true"
      style="margin:0; overflow:auto; white-space: pre; position:absolute; inset:0;"
    >{@html highlightedHtml}</pre>

    <!-- Textarea on top: transparent text, caret visible -->
    <textarea
      class="scenario-input {baseClass}"
      style="position:absolute; inset:0; color:transparent; caret-color: #374151; background:transparent; white-space: pre;"
      wrap="off"
      {rows}
      {placeholder}
      {disabled}
      value={value}
      on:input={handleInput}
      on:scroll={(e) => {
        const mirror = e.target.previousElementSibling;
        if (mirror) {
          mirror.scrollTop = e.target.scrollTop;
          mirror.scrollLeft = e.target.scrollLeft;
        }
      }}
    ></textarea>
  </div>
  {#if validation.errors.length > 0}
    <div class="scenario-errors mt-2 px-2 py-1.5 rounded border border-red-300 bg-red-50 text-red-800 text-sm">
      <div class="font-semibold mb-1">Ошибки синтаксиса:</div>
      <ul class="list-disc list-inside space-y-0.5">
        {#each validation.errors as err}
          <li>Строка {err.line}: {err.message}</li>
        {/each}
      </ul>
    </div>
  {/if}
</div>

<style>
  .scenario-editor .scenario-mirror {
    pointer-events: none;
    min-height: 100%;
  }
  .scenario-editor .scenario-input {
    resize: none;
  }
  /* IoTManager scenario syntax colors */
  :global(.scn-comment) {
    color: #a1a1aa;
    font-style: italic;
  }
  :global(.scn-string) {
    color: #b45309;
  }
  :global(.scn-keyword) {
    color: #7c3aed;
    font-weight: 600;
  }
  :global(.scn-function) {
    color: #0d9488;
  }
  :global(.scn-number) {
    color: #059669;
  }
  :global(.scn-identifier) {
    color: #1e40af;
  }
  :global(.scn-default) {
    color: #374151;
  }
</style>
