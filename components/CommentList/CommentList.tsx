"use client";
import { useState } from "react";

interface Comment {
  id: number;
  initials: string;
  color: string;
  username: string;
  time: string;
  text: string;
  likes: number;
}

interface Props {
  comments: Comment[];
}

export const CommentList = ({ comments }: Props) => {
  return (
    <div>
      <p className="text-xs font-semibold tracking-widest text-gray-500 mb-3 uppercase">
        Recentes
      </p>
      <div className="flex flex-col gap-3">
        {comments.map((c) => (
          <CommentCard key={c.id} comment={c} />
        ))}
      </div>
    </div>
  );
};

const CommentCard = ({ comment }: { comment: Comment }) => {
  const [liked, setLiked] = useState(false);
  const [likes, setLikes] = useState(comment.likes);

  const toggleLike = () => {
    setLiked((v) => !v);
    setLikes((v) => (liked ? v - 1 : v + 1));
  };

  return (
    <div className="bg-[#1a1a1a] border border-[var(--border-muted)] rounded-xl p-4">
      <div className="flex items-center justify-between mb-3">
        <div className="flex items-center gap-2">
          <div
            className="w-8 h-8 rounded-lg flex items-center justify-center text-xs font-bold shrink-0"
            style={{ backgroundColor: comment.color }}
          >
            {comment.initials}
          </div>
          <span className="text-sm font-medium">{comment.username}</span>
        </div>
        <span className="text-xs text-gray-500">{comment.time}</span>
      </div>
      <p className="text-sm text-gray-300 leading-relaxed mb-3">{comment.text}</p>
      <div className="flex gap-2">
        <button
          onClick={toggleLike}
          className={`flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-medium border transition-colors ${
            liked
              ? "border-[var(--brand-yellow)] text-[var(--brand-yellow)]"
              : "border-[var(--border-muted)] text-gray-400 hover:border-gray-500"
          }`}
        >
          ♥ {likes}
        </button>
        <button className="px-3 py-1.5 rounded-lg text-xs font-medium border border-[var(--border-muted)] text-gray-400 hover:border-gray-500 transition-colors">
          ↩ Reply
        </button>
        <button className="px-3 py-1.5 rounded-lg text-xs font-medium border border-[var(--border-muted)] text-gray-400 hover:border-gray-500 transition-colors">
          " Quote
        </button>
      </div>
    </div>
  );
};
