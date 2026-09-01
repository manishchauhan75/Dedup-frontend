const MatchBadge = ({ matchPercentage, matchType }) => {
  const isExact = matchType === 'exact';

  return (
    <span
      className={`text-sm px-3 py-1 rounded-full font-medium ${
        isExact ? 'text-purple-400 bg-purple-500/20' : 'text-yellow-400 bg-yellow-500/20'
      }`}
    >
      {Number(matchPercentage).toFixed(2)}% &bull; {matchType}
    </span>
  );
};

export default MatchBadge;
