import { describe, expect, test } from 'bun:test';
import { readFileSync } from 'node:fs';

// The base CSS is imported globally by every app, next to each app's own CSS. An unprefixed
// class here would silently restyle an app's own `.label` or `.container`, and a bare colour
// would stay light in dark mode, so both are guarded.

const FILES = ['fn-core.css', 'fn-late.css', 'fn-last.css'];
const read = (f: string) =>
	readFileSync(new URL(`../src/lib/styles/${f}`, import.meta.url), 'utf8').replace(
		/\/\*[\s\S]*?\*\//g,
		''
	);

/** Innermost `selector { declarations }` pairs (rules nested in @media included). */
function rules(css: string): { selector: string; body: string }[] {
	return [...css.matchAll(/([^{}]+)\{([^{}]*)\}/g)].map((m) => ({
		selector: m[1].trim(),
		body: m[2]
	}));
}

// Utilities whose name is a literal colour: they mean that colour in either mode.
const LITERAL = /(^|\s)\.fn-(text-gray-\d+|bg-white(-50)?|bg-gray-100|hover-bg-gray-50:hover|border-gray-\d+)$/;

describe('base CSS', () => {
	for (const file of FILES) {
		const css = read(file);

		test(`${file}: every class is fn- or fnk- prefixed`, () => {
			const bad = rules(css)
				.flatMap((r) => [...r.selector.matchAll(/\.(-?[a-zA-Z_][\w-]*)/g)].map((m) => m[1]))
				.filter((c) => !/^-?fnk?-|^is-/.test(c)); // is-* = a state on an fn- element
			expect([...new Set(bad)]).toEqual([]);
		});

		test(`${file}: colours come from tokens`, () => {
			const bad = rules(css)
				.filter((r) => !LITERAL.test(r.selector))
				.flatMap((r) =>
					r.body
						.split(';')
						.map((d) => d.trim())
						.filter((d) => d && !d.startsWith('--'))
						.filter((d) => /#[0-9a-f]{3,8}\b|rgba?\((?!0 0 0)/i.test(d))
						.map((d) => `${r.selector} { ${d} }`)
				);
			expect(bad).toEqual([]);
		});
	}
});
