const ELEMENT_TYPE_CONFIG = {
  p: { bg: 'bg-blue-500', text: 'Paragraph' },
  li: { bg: 'bg-purple-500', text: 'List Item' },
  step: { bg: 'bg-emerald-500', text: 'Step' },
  note: { bg: 'bg-amber-500', text: 'Note' },
  table: { bg: 'bg-teal-500', text: 'Table' },
  xref: { bg: 'bg-pink-500', text: 'Xref' },
  ph: { bg: 'bg-indigo-500', text: 'Phrase' },
  prolog: { bg: 'bg-gray-500', text: 'Prolog' },
  context: { bg: 'bg-cyan-500', text: 'Context' },
  index: { bg: 'bg-orange-500', text: 'Index' },
  shortdesc: { bg: 'bg-violet-500', text: 'Short Description' },
  keyword: { bg: 'bg-lime-500', text: 'Keyword' },
  indexterm: { bg: 'bg-rose-500', text: 'Index Term' },
  ul: { bg: 'bg-sky-500', text: 'Unordered List' },
  ol: { bg: 'bg-fuchsia-500', text: 'Ordered List' },
};

const ElementTypeBadge = ({ elementType }) => {
  if (!elementType) return null;
  const config = ELEMENT_TYPE_CONFIG[elementType] || { bg: 'bg-gray-500', text: elementType };

  return (
    <span className={`${config.bg} text-white px-2 py-0.5 rounded-full text-xs font-medium`}>
      {config.text}
    </span>
  );
};

export default ElementTypeBadge;
