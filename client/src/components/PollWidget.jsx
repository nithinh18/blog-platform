import { useState } from 'react';
import { useTranslation } from 'react-i18next';
import { BarChart3 } from 'lucide-react';
import { voteOnPoll } from '../services/postService';

const PollWidget = ({ postId, poll, myVote, onVoted }) => {
  const { t } = useTranslation();
  const [submitting, setSubmitting] = useState(false);
  const hasVoted = myVote !== null && myVote !== undefined;
  const totalVotes = poll.options.reduce((sum, o) => sum + (o.voteCount ?? o.votes?.length ?? 0), 0);

  const handleVote = async (idx) => {
    if (submitting) return;
    setSubmitting(true);
    try {
      const data = await voteOnPoll(postId, idx);
      onVoted(data.poll);
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <div className="my-8 bg-slate-50 dark:bg-slate-800/60 rounded-lg border border-slate-200 dark:border-slate-800 p-5">
      <h3 className="flex items-center gap-2 text-sm font-semibold text-slate-900 dark:text-white mb-4">
        <BarChart3 size={15} /> {poll.question}
      </h3>
      <div className="space-y-2">
        {poll.options.map((opt, idx) => {
          const count = opt.voteCount ?? opt.votes?.length ?? 0;
          const pct = totalVotes > 0 ? Math.round((count / totalVotes) * 100) : 0;
          const isMine = myVote === idx;
          return (
            <button
              key={idx}
              type="button"
              onClick={() => handleVote(idx)}
              disabled={submitting}
              className="w-full text-left relative overflow-hidden rounded-lg border border-slate-200 dark:border-slate-700 px-3 py-2 text-sm hover:border-brand-400 disabled:cursor-default transition-colors"
            >
              {hasVoted && (
                <span
                  className="absolute inset-y-0 left-0 bg-brand-100 dark:bg-brand-500/15"
                  style={{ width: `${pct}%` }}
                />
              )}
              <span className="relative flex items-center justify-between">
                <span className={isMine ? 'font-semibold text-brand-700 dark:text-brand-300' : 'text-slate-700 dark:text-slate-200'}>
                  {opt.text}
                </span>
                {hasVoted && (
                  <span className="text-xs text-slate-500 dark:text-slate-400">{pct}%</span>
                )}
              </span>
            </button>
          );
        })}
      </div>
      <p className="text-xs text-slate-400 mt-3">{t('poll.votes', { count: totalVotes })}</p>
    </div>
  );
};

export default PollWidget;
