// Lightweight, dependency-free recommendation/ranking algorithms.
// These run in-memory over the candidate post set, which is the right
// trade-off at blog-platform scale (hundreds-thousands of posts). At real
// scale you'd push this to a search index (Atlas Search/Elasticsearch) or a
// precomputed batch job, but the scoring logic below would stay the same.

const STOPWORDS = new Set([
  'a', 'an', 'the', 'is', 'are', 'was', 'were', 'be', 'been', 'being', 'to',
  'of', 'in', 'on', 'for', 'with', 'and', 'or', 'but', 'this', 'that', 'it',
  'as', 'at', 'by', 'from', 'i', 'you', 'he', 'she', 'we', 'they', 'not',
  'so', 'if', 'then', 'than', 'do', 'does', 'did', 'his', 'her', 'their',
  'my', 'your', 'our', 'about', 'into', 'over', 'after', 'before', 'up',
  'down', 'out', 'can', 'will', 'just', 'also', 'have', 'has', 'had',
]);

const tokenize = (text = '') =>
  text
    .toLowerCase()
    .replace(/[^a-z0-9\s]/g, ' ')
    .split(/\s+/)
    .filter((w) => w.length > 2 && !STOPWORDS.has(w));

const termFrequency = (tokens) => {
  const tf = new Map();
  tokens.forEach((t) => tf.set(t, (tf.get(t) || 0) + 1));
  return tf;
};

const cosineSimilarity = (mapA, mapB) => {
  let dot = 0;
  let normA = 0;
  let normB = 0;

  mapA.forEach((valA, key) => {
    normA += valA * valA;
    if (mapB.has(key)) dot += valA * mapB.get(key);
  });
  mapB.forEach((valB) => {
    normB += valB * valB;
  });

  if (normA === 0 || normB === 0) return 0;
  return dot / (Math.sqrt(normA) * Math.sqrt(normB));
};

const postVector = (post) =>
  termFrequency([
    ...tokenize(post.title).flatMap((w) => [w, w, w]), // weight title 3x
    ...tokenize(post.content).slice(0, 200),
    ...(post.tags || []).flatMap((t) => [t, t]),
    post.category?.toLowerCase() || '',
  ]);

const ageInHours = (date) => (Date.now() - new Date(date).getTime()) / 36e5;

/**
 * Reddit/HackerNews-style "hot" score: engagement decays with age via a
 * gravity exponent, so fresh posts with modest engagement can still rank
 * above older posts with more raw engagement.
 */
const trendingScore = (post) => {
  const likeCount = post.likes?.length || 0;
  const engagement = likeCount * 1 + (post.commentCount || 0) * 2 + (post.views || 0) * 0.05;
  const gravity = 1.5;
  return engagement / Math.pow(ageInHours(post.createdAt) + 2, gravity);
};

/**
 * Content-based similarity for "related posts": weighted blend of explicit
 * tag/category overlap plus TF-IDF-ish cosine similarity over title+content.
 */
const relatedPosts = (target, candidates, limit = 4) => {
  const targetVec = postVector(target);
  const targetTags = new Set(target.tags || []);

  const scored = candidates
    .filter((p) => String(p._id) !== String(target._id))
    .map((p) => {
      const tagOverlap = (p.tags || []).filter((t) => targetTags.has(t)).length;
      const categoryMatch = p.category === target.category ? 1 : 0;
      const similarity = cosineSimilarity(targetVec, postVector(p));
      const score = tagOverlap * 3 + categoryMatch * 2 + similarity * 6;
      return { post: p, score };
    })
    .filter((s) => s.score > 0)
    .sort((a, b) => b.score - a.score);

  return scored.slice(0, limit).map((s) => s.post);
};

/**
 * Personalized "For You" feed: blends interest-category match, tag overlap
 * with the user's liked/bookmarked history, language preference, trending
 * signal, and recency. Mirrors (a simplified version of) how YouTube/IG
 * rank a home feed: a weighted sum of relevance + freshness + popularity.
 */
const personalizedFeed = (user, posts, { likedTagWeights = new Map() } = {}) => {
  const interests = new Set(user?.interests || []);
  const languages = new Set(user?.preferredLanguages || ['en']);
  const following = new Set((user?.following || []).map(String));

  const scored = posts.map((p) => {
    const interestMatch = interests.has(p.category) ? 3 : 0;
    const languageMatch = languages.has(p.language) ? 2 : 0.2;
    const followBoost = following.has(String(p.author?._id || p.author)) ? 2.5 : 0;
    const tagAffinity = (p.tags || []).reduce(
      (sum, t) => sum + (likedTagWeights.get(t) || 0),
      0
    );
    const trend = trendingScore(p);
    const recency = 1 / Math.pow(ageInHours(p.createdAt) + 4, 0.3);

    const score =
      interestMatch + languageMatch + followBoost + tagAffinity * 1.5 + trend * 0.8 + recency;

    return { post: p, score };
  });

  return scored.sort((a, b) => b.score - a.score).map((s) => s.post);
};

/**
 * Builds a tag -> affinity weight map from a user's liked/bookmarked posts,
 * used to bias the personalized feed toward topics they engage with (a
 * cheap stand-in for collaborative filtering signal).
 */
const buildTagAffinity = (engagedPosts) => {
  const weights = new Map();
  engagedPosts.forEach((p) => {
    (p.tags || []).forEach((t) => weights.set(t, (weights.get(t) || 0) + 1));
  });
  return weights;
};

/**
 * "Because you liked X, people who liked X also liked..." — item-item
 * co-occurrence over the likes graph, a minimal collaborative filter.
 */
const collaborativeRecommendations = (userId, allPosts, limit = 4) => {
  const uid = String(userId);
  const likedByUser = allPosts.filter((p) => (p.likes || []).some((l) => String(l) === uid));
  if (likedByUser.length === 0) return [];

  const coUsers = new Set();
  likedByUser.forEach((p) => (p.likes || []).forEach((l) => coUsers.add(String(l))));
  coUsers.delete(uid);

  const alreadyLiked = new Set(likedByUser.map((p) => String(p._id)));
  const scores = new Map();

  allPosts.forEach((p) => {
    if (alreadyLiked.has(String(p._id))) return;
    const overlap = (p.likes || []).filter((l) => coUsers.has(String(l))).length;
    if (overlap > 0) scores.set(String(p._id), { post: p, score: overlap });
  });

  return Array.from(scores.values())
    .sort((a, b) => b.score - a.score)
    .slice(0, limit)
    .map((s) => s.post);
};

/**
 * Search-as-you-type suggestions: ranks posts by weighted term overlap
 * (title hits count more than body hits), similar in spirit to how a
 * search engine blends field-weighted relevance signals.
 */
const searchSuggestions = (query, posts, limit = 6) => {
  const qTokens = tokenize(query);
  if (qTokens.length === 0) return [];

  const scored = posts
    .map((p) => {
      const titleTokens = tokenize(p.title);
      const tagTokens = (p.tags || []).map((t) => t.toLowerCase());
      const contentTokens = tokenize(p.content).slice(0, 150);

      let score = 0;
      qTokens.forEach((qt) => {
        if (titleTokens.includes(qt)) score += 5;
        if (tagTokens.includes(qt)) score += 4;
        if (contentTokens.includes(qt)) score += 1;
      });

      return { post: p, score };
    })
    .filter((s) => s.score > 0)
    .sort((a, b) => b.score - a.score);

  return scored.slice(0, limit).map((s) => s.post);
};

module.exports = {
  tokenize,
  trendingScore,
  relatedPosts,
  personalizedFeed,
  buildTagAffinity,
  collaborativeRecommendations,
  searchSuggestions,
};
