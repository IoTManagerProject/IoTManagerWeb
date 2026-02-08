/**
 * Scenario text sanitization for IoTManager backend compatibility.
 * Matches IoTScenario.cpp lexer: file is read byte-by-byte; isspace() and ';' are skipped;
 * comments # to EOL; strings "..."; identifiers [a-zA-Z_][a-zA-Z0-9_]*; other ASCII as tokens.
 * We normalize line endings and remove control chars that would break the parser.
 */

/**
 * Sanitize scenario text before sending to device (/oiranecs|).
 * - Normalize line endings to LF (\n): \r\n and \r -> \n
 * - Remove control characters (0x00-0x1F) except \n (10) and \t (9)
 * So no NUL, no other control chars; backend expects printable ASCII + \n \t in code.
 * @param {string} text - raw scenario text
 * @returns {string} sanitized text safe for IoTScenario parser
 */
export function sanitizeScenario(text) {
  if (text == null || typeof text !== "string") return "";
  // Normalize line endings to \n only (backend counts curLine on LastChar == 10)
  let out = text.replace(/\r\n/g, "\n").replace(/\r/g, "\n");
  // Remove control chars except \t (9) and \n (10)
  out = out.replace(/[\x00-\x08\x0B\x0C\x0E-\x1F]/g, "");
  return out;
}
