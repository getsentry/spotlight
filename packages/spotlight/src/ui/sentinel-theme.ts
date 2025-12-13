import type { ThemeRegistration } from "shiki";

/**
 * Sentry Sentinel Dark Theme for Shiki
 * Based on the VS Code theme from https://github.com/getsentry/sentinel
 */
export const sentinelDarkTheme: ThemeRegistration = {
  name: "sentinel-dark",
  type: "dark",
  colors: {
    "editor.background": "#181225",
    "editor.foreground": "#f9f8f9",
    "editor.selectionBackground": "#8a76ff40",
    "editor.selectionHighlightBackground": "#8a76ff25",
    "editor.lineHighlightBackground": "#24202b15",
    "editor.wordHighlightBackground": "#ff45a820",
    "editor.wordHighlightStrongBackground": "#8a76ff30",
    "editor.findMatchBackground": "#ff45a840",
    "editor.findMatchHighlightBackground": "#ff45a820",
    "editor.hoverHighlightBackground": "#8a76ff15",
    "editorLineNumber.foreground": "#898294",
    "editorLineNumber.activeForeground": "#d5d2da",
    "editorIndentGuide.background1": "#2e2936",
    "editorIndentGuide.activeBackground1": "#9E86FF",
    "editorRuler.foreground": "#2e2936",
    "editorCursor.foreground": "#ff45a8",
    "editorBracketMatch.background": "#8a76ff40",
    "editorBracketMatch.border": "#9E86FF",
  },
  tokenColors: [
    {
      name: "Comment",
      scope: ["comment", "punctuation.definition.comment"],
      settings: {
        foreground: "#898294",
        fontStyle: "italic",
      },
    },
    {
      name: "Variables",
      scope: ["variable", "variable.other"],
      settings: {
        foreground: "#f9f8f9",
      },
    },
    {
      name: "Keywords",
      scope: ["keyword", "storage.modifier"],
      settings: {
        foreground: "#9E86FF",
        fontStyle: "bold",
      },
    },
    {
      name: "Strings",
      scope: ["string", "string.quoted", "string.template"],
      settings: {
        foreground: "#83da90",
      },
    },
    {
      name: "Numbers",
      scope: ["constant.numeric"],
      settings: {
        foreground: "#FDB81B",
      },
    },
    {
      name: "Booleans and Language Constants",
      scope: ["constant.language"],
      settings: {
        foreground: "#9E86FF",
      },
    },
    {
      name: "Functions",
      scope: ["entity.name.function", "support.function", "meta.function-call"],
      settings: {
        foreground: "#226DFC",
        fontStyle: "",
      },
    },
    {
      name: "Type and Class Names",
      scope: ["entity.name.type", "entity.name.class", "entity.name.interface", "support.type", "support.class"],
      settings: {
        foreground: "#FF45A8",
      },
    },
    {
      name: "Constants",
      scope: ["constant", "support.constant"],
      settings: {
        foreground: "#7553FF",
      },
    },
    {
      name: "Properties",
      scope: [
        "variable.other.property",
        "support.variable.property",
        "meta.object-literal.key",
        "meta.definition.property",
        "variable.object.property",
        "meta.property-name",
      ],
      settings: {
        foreground: "#FF70BC",
      },
    },
    {
      name: "Operators",
      scope: ["keyword.operator"],
      settings: {
        foreground: "#FF45A8",
      },
    },
    {
      name: "Punctuation",
      scope: ["punctuation"],
      settings: {
        foreground: "#D5D2DA",
      },
    },
    {
      name: "Tags (HTML/XML)",
      scope: ["entity.name.tag"],
      settings: {
        foreground: "#7553FF",
      },
    },
    {
      name: "Attributes",
      scope: ["entity.other.attribute-name"],
      settings: {
        foreground: "#FF9838",
      },
    },
    {
      name: "CSS Selectors",
      scope: [
        "entity.name.tag.css",
        "entity.other.attribute-name.class.css",
        "entity.other.attribute-name.id.css",
        "meta.selector.css",
      ],
      settings: {
        foreground: "#7553FF",
      },
    },
    {
      name: "CSS Punctuation",
      scope: [
        "punctuation.definition.entity.css",
        "punctuation.definition.entity.begin.bracket",
        "punctuation.definition.entity.end.bracket",
      ],
      settings: {
        foreground: "#7553FF",
      },
    },
    {
      name: "At-rules",
      scope: ["keyword.control.at-rule", "punctuation.definition.keyword"],
      settings: {
        foreground: "#7553FF",
      },
    },
    {
      name: "CSS Properties",
      scope: ["support.type.property-name.css", "variable.css", "variable.other.css"],
      settings: {
        foreground: "#e7e5ea",
      },
    },
    {
      name: "Markdown Headings",
      scope: ["markup.heading", "markup.heading entity.name"],
      settings: {
        foreground: "#ff45a8",
        fontStyle: "bold",
      },
    },
    {
      name: "Markdown Bold",
      scope: ["markup.bold"],
      settings: {
        foreground: "#ebd0a3",
        fontStyle: "bold",
      },
    },
    {
      name: "Markdown Italic",
      scope: ["markup.italic"],
      settings: {
        foreground: "#ebd0a3",
        fontStyle: "italic",
      },
    },
    {
      name: "Markdown Links",
      scope: ["markup.underline.link", "markup.underline.link.image"],
      settings: {
        foreground: "#8a76ff",
      },
    },
    {
      name: "Markdown Raw/Code",
      scope: ["markup.inline.raw", "markup.raw", "markup.raw.inline"],
      settings: {
        foreground: "#5ece73",
      },
    },
    {
      name: "Markdown Deleted",
      scope: ["markup.deleted"],
      settings: {
        foreground: "#EF4444",
      },
    },
    {
      name: "Markdown Inserted",
      scope: ["markup.inserted"],
      settings: {
        foreground: "#5ece73",
      },
    },
    {
      name: "Markdown Changed",
      scope: ["markup.changed"],
      settings: {
        foreground: "#ebd0a3",
      },
    },
    {
      name: "Markdown Quote",
      scope: ["markup.quote"],
      settings: {
        foreground: "#ebd0a3",
        fontStyle: "italic",
      },
    },
    {
      name: "JSON Keys",
      scope: ["support.type.property-name.json"],
      settings: {
        foreground: "#7553FF",
      },
    },
    {
      name: "Invalid/Error",
      scope: ["invalid", "invalid.illegal"],
      settings: {
        foreground: "#fe4144",
        fontStyle: "bold",
      },
    },
    {
      name: "Declaration Keywords",
      scope: [
        "keyword.control.import",
        "keyword.control.export",
        "keyword.control.from",
        "keyword.control.module",
        "keyword.other.import",
        "keyword.other.package",
        "keyword.other.namespace",
        "storage.type.interface",
        "storage.type.type",
        "storage.type.class",
        "storage.type.function",
        "storage.type.const",
        "storage.type.let",
        "storage.type.var",
        "storage.type.enum",
        "storage.type.namespace",
        "storage.type.module",
        "storage.type.struct",
        "storage.type.trait",
        "storage.type.impl",
        "storage.type.def",
        "storage.modifier.import",
        "storage.modifier.package",
        "keyword.declaration",
        "keyword.function",
        "keyword.class",
        "keyword.interface",
        "keyword.struct",
        "keyword.control.def",
        "keyword.control.class",
        "keyword.other.fn",
        "keyword.other.def",
        "keyword.other.special-method",
        "meta.function.python keyword.python",
        "meta.class.python keyword.python",
        "source.go keyword.function",
        "source.go keyword.type",
        "source.go keyword.var",
        "source.go keyword.const",
        "source.rust storage.type",
        "keyword.other.important",
      ],
      settings: {
        foreground: "#7553FF",
        fontStyle: "bold",
      },
    },
    {
      name: "Storage fallback",
      scope: ["storage"],
      settings: {
        foreground: "#7553FF",
      },
    },
    {
      name: "Meta Diff",
      scope: ["meta.diff", "meta.diff.header"],
      settings: {
        foreground: "#71717A",
      },
    },
    {
      name: "Meta Embedded",
      scope: ["meta.embedded", "source.groovy.embedded"],
      settings: {
        foreground: "#f9f8f9",
      },
    },
    {
      name: "Punctuation Section",
      scope: [
        "punctuation.section.embedded",
        "punctuation.section.block",
        "punctuation.section.brackets",
        "punctuation.section.array",
        "punctuation.section.function",
      ],
      settings: {
        foreground: "#A1A1AA",
      },
    },
    {
      name: "Punctuation Terminator",
      scope: ["punctuation.terminator", "punctuation.separator.statement"],
      settings: {
        foreground: "#A1A1AA",
      },
    },
    {
      name: "Entity Name Tag",
      scope: ["entity.name.section", "entity.name.tag", "entity.name.namespace"],
      settings: {
        foreground: "#7553FF",
      },
    },
    {
      name: "CSS Pseudo-classes and Pseudo-elements",
      scope: [
        "entity.other.attribute-name.pseudo-class",
        "entity.other.attribute-name.pseudo-element",
        "entity.other.attribute-name.pseudo-class.css",
        "entity.other.attribute-name.pseudo-element.css",
      ],
      settings: {
        foreground: "#7553FF",
      },
    },
    {
      name: "Library/Support Functions",
      scope: ["support.function.builtin", "support.function.library"],
      settings: {
        foreground: "#8a76ff",
      },
    },
    {
      name: "Invalid - Deprecated",
      scope: ["invalid.deprecated"],
      settings: {
        foreground: "#71717A",
        fontStyle: "strikethrough",
      },
    },
    {
      name: "Regular Expression",
      scope: ["string.regexp"],
      settings: {
        foreground: "#06B6D4",
      },
    },
    {
      name: "Template Expression",
      scope: ["punctuation.definition.template-expression", "punctuation.section.embedded", "meta.template.expression"],
      settings: {
        foreground: "#7553FF",
      },
    },
    {
      name: "Language Variables",
      scope: [
        "variable.language",
        "variable.language.this",
        "variable.language.self",
        "variable.language.super",
        "keyword.other.this",
      ],
      settings: {
        foreground: "#998bff",
        fontStyle: "italic",
      },
    },
    {
      name: "Function Parameters",
      scope: ["variable.parameter", "meta.function.parameter", "entity.name.variable.parameter"],
      settings: {
        foreground: "#d8ab5a",
        fontStyle: "italic",
      },
    },
    {
      name: "Diff Header",
      scope: ["meta.diff.header", "meta.separator.diff", "meta.diff.index", "meta.diff.range"],
      settings: {
        foreground: "#06B6D4",
      },
    },
  ],
};
