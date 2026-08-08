"use client";

import { useState } from "react";
import Link from "next/link";
import { Heart, X, Search, User } from "lucide-react";

export interface LikedUser {
  id: string;
  name: string;
  avatar_url?: string | null;
  liked_at?: string;
}

interface LikedByUsersProps {
  likedUsers: LikedUser[];
  likesCount: number;
  isLiked?: boolean;
  onLikeToggle?: () => void;
  className?: string;
}

export default function LikedByUsers({
  likedUsers = [],
  likesCount = 0,
  isLiked = false,
  onLikeToggle,
  className = ""
}: LikedByUsersProps) {
  const [showModal, setShowModal] = useState(false);
  const [searchQuery, setSearchQuery] = useState("");

  const displayUsers = likedUsers.slice(0, 4);
  const totalLikes = Math.max(likesCount, likedUsers.length);
  const remainingCount = Math.max(0, totalLikes - displayUsers.length);

  const filteredUsers = likedUsers.filter(u =>
    u.name.toLowerCase().includes(searchQuery.toLowerCase())
  );

  const formatSummaryText = () => {
    if (totalLikes === 0) {
      return "No likes yet. Be the first to like this story!";
    }

    if (likedUsers.length === 0) {
      return `${totalLikes} ${totalLikes === 1 ? "person liked" : "people liked"} this story`;
    }

    const firstName = likedUsers[0]?.name || "Someone";

    if (totalLikes === 1) {
      return (
        <>
          Liked by <span className="font-bold text-zinc-900">{firstName}</span>
        </>
      );
    }

    if (totalLikes === 2 && likedUsers.length >= 2) {
      const secondName = likedUsers[1]?.name || "Someone else";
      return (
        <>
          Liked by <span className="font-bold text-zinc-900">{firstName}</span> and{" "}
          <span className="font-bold text-zinc-900">{secondName}</span>
        </>
      );
    }

    return (
      <>
        Liked by <span className="font-bold text-zinc-900">{firstName}</span> and{" "}
        <span className="font-bold text-zinc-900 cursor-pointer hover:underline" onClick={() => setShowModal(true)}>
          {totalLikes - 1} others
        </span>
      </>
    );
  };

  return (
    <div className={`space-y-3 ${className}`}>
      {/* Inline Liked By Header */}
      <div className="flex flex-wrap items-center gap-3">
        {/* Avatars Stack */}
        {likedUsers.length > 0 && (
          <div
            onClick={() => setShowModal(true)}
            className="flex items-center -space-x-2.5 overflow-hidden cursor-pointer group shrink-0"
            title="View everyone who liked this story"
          >
            {displayUsers.map((u, idx) => (
              <div
                key={u.id || idx}
                className="inline-block w-8 h-8 rounded-full ring-2 ring-white bg-zinc-100 overflow-hidden text-center transition-transform group-hover:scale-105"
                style={{ zIndex: 10 - idx }}
              >
                {u.avatar_url ? (
                  <img
                    src={u.avatar_url}
                    alt={u.name}
                    className="w-full h-full object-cover"
                  />
                ) : (
                  <div className="w-full h-full flex items-center justify-center font-bold text-xs bg-zinc-900 text-white uppercase">
                    {u.name ? u.name.charAt(0) : "U"}
                  </div>
                )}
              </div>
            ))}
            {remainingCount > 0 && (
              <div
                className="w-8 h-8 rounded-full ring-2 ring-white bg-zinc-200 text-zinc-800 font-extrabold text-[10px] flex items-center justify-center shrink-0 z-0"
                style={{ zIndex: 5 }}
              >
                +{remainingCount}
              </div>
            )}
          </div>
        )}

        {/* Text description */}
        <div className="text-xs text-zinc-600 font-medium leading-tight flex items-center gap-2">
          <span>{formatSummaryText()}</span>

          {totalLikes > 0 && (
            <button
              type="button"
              onClick={() => setShowModal(true)}
              className="text-[10px] font-black uppercase tracking-wider text-zinc-400 hover:text-black transition-colors underline decoration-zinc-300 underline-offset-2 ml-1"
            >
              See all
            </button>
          )}
        </div>
      </div>

      {/* Liked By Users Modal */}
      {showModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-sm p-4 animate-in fade-in duration-200">
          <div className="bg-white border border-zinc-200 w-full max-w-md rounded-2xl shadow-2xl overflow-hidden flex flex-col max-h-[85vh] animate-in zoom-in-95 duration-200">
            {/* Modal Header */}
            <div className="p-5 border-b border-zinc-100 flex items-center justify-between bg-zinc-50/50">
              <div className="flex items-center gap-2.5">
                <div className="w-8 h-8 rounded-full bg-rose-50 border border-rose-150 flex items-center justify-center text-rose-600">
                  <Heart size={16} className="fill-rose-500 text-rose-500" />
                </div>
                <div>
                  <h3 className="font-heading font-black text-lg uppercase tracking-tight text-zinc-900">
                    Liked by Users ({totalLikes})
                  </h3>
                  <p className="text-xs text-zinc-400 font-medium">
                    People who appreciated this story
                  </p>
                </div>
              </div>
              <button
                onClick={() => setShowModal(false)}
                className="p-2 text-zinc-400 hover:text-black hover:bg-zinc-100 rounded-full transition-all"
              >
                <X size={18} />
              </button>
            </div>

            {/* Search Input */}
            {likedUsers.length > 5 && (
              <div className="px-5 pt-4 pb-2">
                <div className="relative">
                  <Search size={14} className="absolute left-3.5 top-1/2 -translate-y-1/2 text-zinc-400" />
                  <input
                    type="text"
                    value={searchQuery}
                    onChange={(e) => setSearchQuery(e.target.value)}
                    placeholder="Search users..."
                    className="w-full pl-9 pr-4 py-2 bg-zinc-50 border border-zinc-200 focus:border-black rounded-xl text-xs outline-none transition-all placeholder:text-zinc-400 text-zinc-900"
                  />
                </div>
              </div>
            )}

            {/* Users List */}
            <div className="p-5 overflow-y-auto space-y-3 flex-1 divide-y divide-zinc-50">
              {filteredUsers.length > 0 ? (
                filteredUsers.map((user) => (
                  <div key={user.id} className="pt-3 first:pt-0 flex items-center justify-between gap-3 group">
                    <Link
                      href={`/authors/${user.id}`}
                      onClick={() => setShowModal(false)}
                      className="flex items-center gap-3 group-hover:opacity-80 transition-opacity min-w-0"
                    >
                      {user.avatar_url ? (
                        <img
                          src={user.avatar_url}
                          alt={user.name}
                          className="w-10 h-10 rounded-full object-cover shrink-0 border border-zinc-100"
                        />
                      ) : (
                        <div className="w-10 h-10 rounded-full bg-zinc-950 text-white flex items-center justify-center font-bold text-sm uppercase shrink-0">
                          {user.name ? user.name.charAt(0) : <User size={16} />}
                        </div>
                      )}
                      <div className="min-w-0">
                        <p className="text-sm font-bold text-zinc-900 truncate">
                          {user.name}
                        </p>
                        {user.liked_at && (
                          <p className="text-[10px] text-zinc-400 font-medium">
                            Liked {new Date(user.liked_at).toLocaleDateString()}
                          </p>
                        )}
                      </div>
                    </Link>
                  </div>
                ))
              ) : (
                <div className="py-12 text-center text-zinc-400 italic text-sm">
                  {searchQuery ? "No matching users found" : "No user details available yet."}
                </div>
              )}
            </div>

            {/* Modal Footer */}
            <div className="p-4 border-t border-zinc-100 bg-zinc-50/50 flex justify-end">
              <button
                onClick={() => setShowModal(false)}
                className="px-5 py-2 bg-black text-white text-xs font-black uppercase tracking-widest rounded-xl hover:bg-zinc-800 transition-all"
              >
                Close
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
