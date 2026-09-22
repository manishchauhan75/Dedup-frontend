const TOPIC_TYPE_CONFIG = {
  concept: { bg: 'bg-purple-500', text: 'Concept' },
  task: { bg: 'bg-blue-500', text: 'Task' },
  reference: { bg: 'bg-teal-500', text: 'Reference' },
  topic: { bg: 'bg-gray-500', text: 'Topic' },
  glossary: { bg: 'bg-amber-500', text: 'Glossary' },
};

const TopicTypeBadge = ({ topicType }) => {
  if (!topicType) return null;
  const config = TOPIC_TYPE_CONFIG[topicType] || { bg: 'bg-gray-500', text: topicType };

  return (
    <span className={`${config.bg} text-white px-2 py-0.5 rounded-full text-xs font-medium`}>
      {config.text}
    </span>
  );
};

export default TopicTypeBadge;
