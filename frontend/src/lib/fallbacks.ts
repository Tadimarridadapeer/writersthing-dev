export const categoryFallbacks: Record<string, string[]> = {
  "Sci-Fi": [
    "https://images.unsplash.com/photo-1451187580459-43490279c0fa?q=80&w=800",
    "https://images.unsplash.com/photo-1506443432602-ac2fcd6f54e0?q=80&w=800"
  ],
  "Romance": [
    "https://images.unsplash.com/photo-1518199266791-5375a83190b7?q=80&w=800",
    "https://images.unsplash.com/photo-1474552226712-ac0f0961a954?q=80&w=800"
  ],
  "Mystery": [
    "https://images.unsplash.com/photo-1511211756598-a6d17b351052?q=80&w=800",
    "https://images.unsplash.com/photo-1478147427282-58a87a120781?q=80&w=800"
  ],
  "Fantasy": [
    "https://images.unsplash.com/photo-1518709268805-4e9042af9f23?q=80&w=800",
    "https://images.unsplash.com/photo-1534447677768-be436bb09401?q=80&w=800"
  ],
  "General": [
    "https://images.unsplash.com/photo-1456513080510-7bf3a84b82f8?q=80&w=800",
    "https://images.unsplash.com/photo-1543002588-bfa74002ed7e?q=80&w=800"
  ]
};

export const getFallbackImage = (category: string, id: string) => {
  const images = categoryFallbacks[category] || categoryFallbacks["General"];
  let hash = 0;
  for (let i = 0; i < id.length; i++) hash = id.charCodeAt(i) + ((hash << 5) - hash);
  return images[Math.abs(hash) % images.length];
};
