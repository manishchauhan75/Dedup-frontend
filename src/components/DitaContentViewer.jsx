import { useState } from 'react';
import { ChevronDown, ChevronRight } from 'lucide-react';
import toast from 'react-hot-toast';
import { getDitaTopicContent } from '../api/dedup';

// Colors raw DITA/XML source into inline spans using the browser's native
// DOMParser rather than a hand-rolled regex tokenizer. Raw source (unlike
// the normalized canonical_xml used elsewhere) can contain comments, CDATA
// sections, and DOCTYPE internal subsets — a generic tag-matching regex
// would misparse those (e.g. treat a CDATA block's internal '>' as if it
// closed a tag). DOMParser doesn't execute scripts or fetch external
// DTDs/entities, so this stays exactly as safe as plain text rendering.
let keySeed = 0;
const nextKey = () => `k${keySeed++}`;

function renderNode(node, depth, lines) {
  const indent = '  '.repeat(depth);

  if (node.nodeType === Node.COMMENT_NODE) {
    lines.push([<span key={nextKey()} className="text-gray-500 italic">{`${indent}<!--${node.data}-->`}</span>]);
    return;
  }
  if (node.nodeType === Node.CDATA_SECTION_NODE) {
    lines.push([<span key={nextKey()} className="text-yellow-300">{`${indent}<![CDATA[${node.data}]]>`}</span>]);
    return;
  }
  if (node.nodeType === Node.PROCESSING_INSTRUCTION_NODE) {
    lines.push([<span key={nextKey()} className="text-gray-500">{`${indent}<?${node.target} ${node.data}?>`}</span>]);
    return;
  }
  if (node.nodeType === Node.DOCUMENT_TYPE_NODE) {
    lines.push([<span key={nextKey()} className="text-gray-500">{`${indent}<!DOCTYPE ${node.name}>`}</span>]);
    return;
  }
  if (node.nodeType === Node.TEXT_NODE) {
    const text = node.data.trim();
    if (text) lines.push([<span key={nextKey()} className="text-gray-200">{indent}{text}</span>]);
    return;
  }
  if (node.nodeType !== Node.ELEMENT_NODE) return;

  const attrs = Array.from(node.attributes || []);
  const openTag = [<span key={nextKey()} className="text-cyan-400">{`${indent}<${node.nodeName}`}</span>];
  attrs.forEach((attr) => {
    openTag.push(
      <span key={nextKey()}>
        {' '}
        <span className="text-purple-300">{attr.name}</span>
        <span className="text-gray-400">=</span>
        <span className="text-green-400">{`"${attr.value}"`}</span>
      </span>
    );
  });

  const children = Array.from(node.childNodes);
  const hasStructuralChildren = children.some(
    (c) => c.nodeType === Node.ELEMENT_NODE || c.nodeType === Node.COMMENT_NODE || c.nodeType === Node.CDATA_SECTION_NODE
  );

  if (!hasStructuralChildren) {
    const text = node.textContent || '';
    const line = [...openTag, <span key={nextKey()} className="text-cyan-400">{'>'}</span>];
    if (text) line.push(<span key={nextKey()} className="text-gray-200">{text}</span>);
    line.push(<span key={nextKey()} className="text-cyan-400">{`</${node.nodeName}>`}</span>);
    lines.push(line);
    return;
  }

  lines.push([...openTag, <span key={nextKey()} className="text-cyan-400">{'>'}</span>]);
  children.forEach((child) => renderNode(child, depth + 1, lines));
  lines.push([<span key={nextKey()} className="text-cyan-400">{`${indent}</${node.nodeName}>`}</span>]);
}

function buildHighlightedLines(xmlText) {
  try {
    const doc = new DOMParser().parseFromString(xmlText, 'application/xml');
    if (doc.querySelector('parsererror')) return null;

    keySeed = 0;
    const lines = [];
    const declMatch = xmlText.match(/^<\?xml[^>]*\?>/);
    if (declMatch) lines.push([<span key={nextKey()} className="text-gray-500">{declMatch[0]}</span>]);
    Array.from(doc.childNodes).forEach((child) => renderNode(child, 0, lines));
    return lines;
  } catch {
    return null;
  }
}

const DitaContentViewer = ({ snapshotId, topicId }) => {
  const [expanded, setExpanded] = useState(false);
  const [loading, setLoading] = useState(false);
  const [content, setContent] = useState(null);
  const [error, setError] = useState(null);

  const toggle = async () => {
    if (expanded) {
      setExpanded(false);
      return;
    }
    setExpanded(true);
    if (content || loading) return;
    setLoading(true);
    setError(null);
    try {
      const result = await getDitaTopicContent(snapshotId, topicId);
      setContent(result.content);
    } catch (err) {
      const message = err.response?.data?.detail || 'Failed to load DITA content';
      setError(message);
      toast.error(message);
    } finally {
      setLoading(false);
    }
  };

  const highlightedLines = content ? buildHighlightedLines(content) : null;

  return (
    <div className="mt-3">
      <button
        type="button"
        onClick={toggle}
        className="flex items-center space-x-1 text-sm text-cyan-400 hover:text-cyan-300 transition-colors"
      >
        {expanded ? <ChevronDown className="w-4 h-4" /> : <ChevronRight className="w-4 h-4" />}
        <span>{expanded ? 'Hide DITA Content' : 'View DITA Content'}</span>
      </button>

      {expanded && (
        <div className="mt-2 bg-slate-950 rounded-lg border border-slate-700 overflow-hidden">
          {loading && <p className="p-4 text-sm text-gray-400">Loading content…</p>}
          {!loading && error && <p className="p-4 text-sm text-red-400">{error}</p>}
          {!loading && !error && content != null && (
            <div className="max-h-96 overflow-y-auto overflow-x-auto text-xs font-mono">
              {(highlightedLines || content.split('\n').map((l) => [l])).map((line, i) => (
                <div key={i} className="flex hover:bg-slate-800/50 whitespace-pre">
                  <span className="select-none text-gray-600 w-10 flex-shrink-0 text-right pr-3">{i + 1}</span>
                  <span>{highlightedLines ? line : line[0]}</span>
                </div>
              ))}
            </div>
          )}
        </div>
      )}
    </div>
  );
};

export default DitaContentViewer;
