import { extractText, parseJsonFromAI, parseObjectFromAI, parseArrayFromAI } from './ai-response';
import Anthropic from '@anthropic-ai/sdk';

describe('extractText', () => {
  it('extracts text from a text content block', () => {
    const msg = { content: [{ type: 'text', text: 'hello' }] } as Anthropic.Message;
    expect(extractText(msg)).toBe('hello');
  });

  it('returns empty string for non-text content', () => {
    const msg = { content: [{ type: 'tool_use', id: 'x', name: 'y', input: {} }] } as Anthropic.Message;
    expect(extractText(msg)).toBe('');
  });

  it('returns empty string for empty content array', () => {
    const msg = { content: [] } as unknown as Anthropic.Message;
    expect(extractText(msg)).toBe('');
  });
});

describe('parseJsonFromAI', () => {
  it('parses direct JSON object', () => {
    expect(parseJsonFromAI('{"a":1}')).toEqual({ a: 1 });
  });

  it('parses direct JSON array', () => {
    expect(parseJsonFromAI('[1,2,3]')).toEqual([1, 2, 3]);
  });

  it('extracts JSON from markdown code block', () => {
    const raw = 'Here is the result:\n```json\n{"key":"value"}\n```\nDone.';
    expect(parseJsonFromAI(raw)).toEqual({ key: 'value' });
  });

  it('extracts JSON from code block without json tag', () => {
    const raw = '```\n[1,2]\n```';
    expect(parseJsonFromAI(raw)).toEqual([1, 2]);
  });

  it('falls back to regex extraction for object', () => {
    const raw = 'The result is {"name":"test"} and more text.';
    expect(parseJsonFromAI(raw)).toEqual({ name: 'test' });
  });

  it('falls back to regex extraction for array', () => {
    const raw = 'Here: [{"a":1}] end';
    expect(parseJsonFromAI(raw)).toEqual([{ a: 1 }]);
  });

  it('returns undefined for unparseable text', () => {
    expect(parseJsonFromAI('just some text')).toBeUndefined();
  });

  it('returns undefined for empty string', () => {
    expect(parseJsonFromAI('')).toBeUndefined();
  });
});

describe('parseObjectFromAI', () => {
  it('returns object when parsed result is an object', () => {
    expect(parseObjectFromAI('{"a":1}')).toEqual({ a: 1 });
  });

  it('returns undefined when parsed result is an array', () => {
    expect(parseObjectFromAI('[1,2]')).toBeUndefined();
  });

  it('returns undefined for unparseable text', () => {
    expect(parseObjectFromAI('nope')).toBeUndefined();
  });
});

describe('parseArrayFromAI', () => {
  it('returns array when parsed result is an array', () => {
    expect(parseArrayFromAI('[1,2]')).toEqual([1, 2]);
  });

  it('returns undefined when parsed result is an object', () => {
    expect(parseArrayFromAI('{"a":1}')).toBeUndefined();
  });

  it('returns undefined for unparseable text', () => {
    expect(parseArrayFromAI('nope')).toBeUndefined();
  });
});
