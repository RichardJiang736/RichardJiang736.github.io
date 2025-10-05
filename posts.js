// Shared blog post data and simple renderer
// Add new posts here to have them show on Film, Music, and All Posts pages

(function () {
  const BLOG_POSTS = [
    {
      id: 'lincoln-film-review',
      title: 'Lincoln',
      subtitle: 'A Film Review and Reflection',
      excerpt:
        'A reflective review of Steven Spielberg\'s Lincoln, exploring its historical nuance, character depth, and cinematic craftsmanship.',
      image: 'resources/movies/lincoln.jpg',
      alt: 'Lincoln film still',
      date: '2025-10-04',
      readTime: '8 min read',
      category: 'film', // used for filtering
      categoryLabel: 'Film Review', // shown on the chip
      href: 'blogs/movies/lincoln_review.html',
    },
    {
      id: 'ok-computer-music-review',
      title: 'OK Computer',
      subtitle: 'A Retrospective Review',
      excerpt:
        'Revisiting Radiohead\'s OK Computer — a study in texture, tension, and the eerie clarity of late-90s alienation.',
      image: 'resources/music/ok_computer.jpeg',
      alt: 'OK Computer album cover',
      date: '2025-10-04',
      readTime: '8 min read',
      category: 'music',
      categoryLabel: 'Music',
      href: 'blogs/music/ok_computer_review.html',
    },
  ];

  function formatDate(iso) {
    try {
      const d = new Date(iso);
      return d.toLocaleDateString(undefined, {
        year: 'numeric',
        month: 'short',
        day: 'numeric',
      });
    } catch (e) {
      return iso;
    }
  }

  function createCard(post, cardType = 'blog') {
    const article = document.createElement('article');
    const baseCardClass =
      cardType === 'film'
        ? 'film-card bg-white shadow-lg cursor-pointer'
        : cardType === 'music'
        ? 'music-card bg-white shadow-lg cursor-pointer'
        : 'blog-card bg-white border border-black/10 cursor-pointer';
    article.className = baseCardClass;
    article.dataset.category = post.category;

    const categoryClass =
      post.category === 'film'
        ? 'category-film'
        : post.category === 'music'
        ? 'category-music'
        : post.category === 'research'
        ? 'category-research'
        : 'category-projects';

    if (cardType === 'blog') {
      article.innerHTML = `
        <div class="aspect-video overflow-hidden">
          <img src="${post.image}" alt="${post.alt || post.title}" class="w-full h-full object-cover">
        </div>
        <div class="p-6">
          <div class="flex items-center mb-3">
            <span class="${categoryClass} px-3 py-1 text-xs font-medium bg-gray-100">${post.categoryLabel}</span>
            <span class="ml-auto text-sm text-gray-500">${formatDate(post.date)}</span>
          </div>
          <h3 class="font-primary text-xl font-semibold mb-3">${post.title}</h3>
          <p class="text-gray-600 mb-4 line-clamp-3">${post.excerpt}</p>
          <div class="flex items-center justify-between">
            <span class="text-sm text-gray-500">${post.readTime}</span>
            <a class="text-sm font-medium" href="${post.href}">Read More →</a>
          </div>
        </div>
      `;
    } else if (cardType === 'film') {
      article.innerHTML = `
        <div class="aspect-video overflow-hidden">
          <img src="${post.image}" alt="${post.alt || post.title}" class="w-full h-full object-cover">
        </div>
        <div class="p-6">
          <div class="flex items-center mb-3">
            <span class="genre-tag">${post.categoryLabel}</span>
            <span class="ml-auto text-sm text-gray-500">${new Date(post.date).getFullYear()}</span>
          </div>
          <h3 class="font-primary text-xl font-semibold mb-3">${post.title}</h3>
          <p class="text-gray-600 mb-4 line-clamp-3">${post.excerpt}</p>
          <div class="text-sm font-medium"><a href="${post.href}">Read Review →</a></div>
        </div>
      `;
    } else if (cardType === 'music') {
      article.innerHTML = `
        <div class="aspect-square overflow-hidden">
          <img src="${post.image}" alt="${post.alt || post.title}" class="w-full h-full object-cover">
        </div>
        <div class="p-6">
          <div class="flex items-center mb-3">
            <span class="genre-tag">${post.categoryLabel}</span>
            <span class="ml-auto text-sm text-gray-500">Review</span>
          </div>
          <h3 class="font-primary text-xl font-semibold mb-3">${post.title}</h3>
          <p class="text-gray-600 mb-4 line-clamp-3">${post.excerpt}</p>
          <div class="text-sm font-medium"><a href="${post.href}">Read Review →</a></div>
        </div>
      `;
    }

    // Make the whole card clickable
    article.addEventListener('click', (e) => {
      const isLink = e.target.closest('a');
      if (!isLink && post.href) {
        window.location.href = post.href;
      }
    });

    return article;
  }

  function renderBlogCards(containerOrSelector, posts, options = {}) {
    const container =
      typeof containerOrSelector === 'string'
        ? document.querySelector(containerOrSelector)
        : containerOrSelector;
    if (!container) return;
    container.innerHTML = '';
    const cardType = options.cardType || 'blog';
    posts.forEach((p) => container.appendChild(createCard(p, cardType)));
  }

  // Expose globals
  window.BLOG_POSTS = BLOG_POSTS;
  window.renderBlogCards = renderBlogCards;
})();
