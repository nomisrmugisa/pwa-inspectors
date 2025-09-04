import fs from 'fs';
import path from 'path';
import * as mammoth from 'mammoth';
import { load as loadHtml } from 'cheerio';

const DOCX_PATH = path.resolve('Hospital Checklist 2025 working document August(2).docx');
const OUTPUT_PATH = path.resolve('extracted-questions.md');
const HTML_EXPORT_PATH = path.resolve('HospitalChecklist2025.html');

function normalizeText(txt) {
  return (txt || '').trim();
}

function groupIntoSections($) {
  // Heuristics: assume headings for sections are strong/bold paragraphs or h1/h2/h3
  const bodyChildren = $('body').children().toArray();
  const sections = [];
  let current = { title: 'Untitled Section', items: [] };

  function isSectionHeader(el) {
    const tag = el.tagName?.toLowerCase();
    if (tag === 'h1' || tag === 'h2' || tag === 'h3') return true;
    if (tag === 'p') {
      const className = $(el).attr('class') || '';
      if (/MsoHeading/i.test(className)) return true;
      const hasStrong = $(el).find('strong, b').length > 0;
      const textLen = normalizeText($(el).text()).length;
      return hasStrong && textLen > 0 && textLen < 140; // short bold line
    }
    return false;
  }

  function pushCurrent() {
    if (current.items.length > 0 || sections.length === 0) {
      sections.push(current);
    }
  }

  for (const el of bodyChildren) {
    if (isSectionHeader(el)) {
      // Start a new section
      pushCurrent();
      current = { title: normalizeText($(el).text()), items: [] };
      continue;
    }
    // Collect paragraphs and lists as potential questions/options
    const tag = el.tagName?.toLowerCase();
    if (!tag) continue;

    if (tag === 'p') {
      const text = normalizeText($(el).text());
      if (text) current.items.push({ type: 'p', text });
    } else if (tag === 'ul' || tag === 'ol') {
      const options = [];
      $(el)
        .find('li')
        .each((_, li) => {
          const t = normalizeText($(li).text());
          if (t) options.push(t);
        });
      if (options.length) current.items.push({ type: 'list', options });
    } else if (tag === 'table') {
      // Preserve any table content as lines per cell joined by ' | '
      const lines = [];
      $(el)
        .find('tr')
        .each((_, tr) => {
          const cells = [];
          $(tr)
            .find('th, td')
            .each((__, c) => cells.push(normalizeText($(c).text())));
          if (cells.length) lines.push(cells.join(' | '));
        });
      if (lines.length) current.items.push({ type: 'table', lines });
    }
  }
  pushCurrent();
  return sections.filter((s) => normalizeText(s.title));
}

function buildQuestionGroups(section) {
  // Heuristic: a question is a paragraph line, followed by an optional list of options
  const groups = [];
  let pendingQuestion = null;
  for (const item of section.items) {
    if (item.type === 'p') {
      // Start a new question if the paragraph looks like a question statement
      const text = item.text;
      const looksLikeQuestion = /\?$/.test(text) || /:\s*$/.test(text) || text.length > 0;
      if (looksLikeQuestion) {
        if (pendingQuestion) groups.push(pendingQuestion);
        pendingQuestion = { question: text, options: [] };
      }
    } else if (item.type === 'list' && pendingQuestion) {
      pendingQuestion.options.push(...item.options);
    } else if (item.type === 'table' && pendingQuestion) {
      // Treat table lines as options content
      pendingQuestion.options.push(...item.lines);
    }
  }
  if (pendingQuestion) groups.push(pendingQuestion);
  return groups;
}

function renderMarkdown(sections) {
  const lines = [];
  lines.push('# Extracted Questions');
  for (const sec of sections) {
    const groups = buildQuestionGroups(sec);
    if (groups.length === 0) continue;
    lines.push(`\n## ${sec.title}`);
    // Section table header
    lines.push('\n');
    lines.push('| Question | Options |');
    lines.push('|---|---|');
    for (const group of groups) {
      const questionText = group.question.replace(/\|/g, '\\|');
      const optionsText = (group.options && group.options.length
        ? group.options.map(o => (o || '').replace(/\|/g, '\\|')).join('<br/>')
        : '').trim();
      lines.push(`| ${questionText} | ${optionsText} |`);
    }
  }
  return lines.join('\n');
}

async function main() {
  let htmlContent = '';
  if (fs.existsSync(HTML_EXPORT_PATH)) {
    htmlContent = fs.readFileSync(HTML_EXPORT_PATH, 'utf8');
  } else {
    if (!fs.existsSync(DOCX_PATH)) {
      console.error('DOCX not found at', DOCX_PATH);
      process.exit(1);
    }
    try {
      const { value } = await mammoth.convertToHtml({ path: DOCX_PATH }, {
        styleMap: [
          'p[style-name="Heading 1"] => h1:fresh',
          'p[style-name="Heading 2"] => h2:fresh',
          'p[style-name="Heading 3"] => h3:fresh'
        ]
      });
      htmlContent = value;
    } catch (e) {
      console.error('Failed to read DOCX via mammoth. If you have Word, export to HTML as', HTML_EXPORT_PATH, 'and rerun. Error:', e.message);
      process.exit(1);
    }
  }
  const $ = loadHtml(htmlContent);
  const sections = groupIntoSections($);
  const md = renderMarkdown(sections);
  fs.writeFileSync(OUTPUT_PATH, md, 'utf8');
  console.log('Wrote', OUTPUT_PATH);
}

main().catch((err) => {
  console.error(err);
  process.exit(1);
});


