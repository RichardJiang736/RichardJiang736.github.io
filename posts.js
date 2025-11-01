(function () {
  const BLOG_POSTS = [
    {
      id: 'lincoln-film-review',
      title: 'Lincoln',
      subtitle: 'A Film Review and Reflection',
      excerpt: "A masterpiece, like so many of Spielberg's films are. A true endeavour dedicated to the great president",
      image: 'resources/movies/lincoln.jpg',
      alt: 'Lincoln film still',
      date: '2025-10-04',
      readTime: '8 min read',
      category: 'film',
      categoryLabel: 'Film Review',
      genres: ['History', 'Drama'],
      year: 2012,
      href: 'blogs/movies/lincoln_review',
      rating: 5,
    },
    {
      id: '2001-film-review',
      title: '2001: A Space Odyssey',
      subtitle: 'A Reminiscent Review',
      excerpt: "The aboriginal Sci-Fi Revolution. A Review of Kubrick's monumental <em>2001: A Space Odyssey</em>",
      image: 'resources/movies/2001.jpg',
      alt: '2001 film still',
      date: '2025-10-15',
      readTime: '4 min read',
      category: 'film',
      categoryLabel: 'Film Review',
      genres: ['Sci-Fi', 'Horror'],
      year: 1968,
      href: 'blogs/movies/2001_review',
      rating: 5,
    },
    {
      id: 'ok-computer-music-review',
      title: 'OK Computer',
      subtitle: 'A Retrospective Review',
      excerpt: 'An eternal and profound delve into technological age. Unveiling a blend in computer mechanics and artistic wisdom',
      image: 'resources/music/ok_computer.jpeg',
      alt: 'OK Computer album cover',
      date: '2025-10-15',
      readTime: '8 min read',
      category: 'music',
      categoryLabel: 'Music Review',
      genres: ['Alternative'],
      href: 'blogs/music/ok_computer_review',
      rating: 5,
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

    const generateStarRating = (rating) => {
      if (!rating) return '';
      const fullStars = Math.floor(rating);
      const hasHalfStar = rating % 1 !== 0;
      const emptyStars = 5 - fullStars - (hasHalfStar ? 1 : 0);
      
      let starsHtml = '';
      for (let i = 0; i < fullStars; i++) {
        starsHtml += '<span class="star filled"></span>';
      }
      if (hasHalfStar) {
        starsHtml += '<span class="star half"></span>';
      }
      for (let i = 0; i < emptyStars; i++) {
        starsHtml += '<span class="star"></span>';
      }
      
      return `
        <div class="flex items-center mb-4">
          <div class="rating-stars mr-3">
            ${starsHtml}
          </div>
          <span class="text-sm text-gray-600">${rating}/5</span>
        </div>
      `;
    };

    const generateGenreTags = (genres) => {
      if (!genres || !Array.isArray(genres) || genres.length === 0) return '';
      return genres.map(genre => `<span class="genre-tag">${genre}</span>`).join('');
    };

    if (cardType === 'blog') {
      article.innerHTML = `
        <div class="aspect-video overflow-hidden">
          <img src="${post.image}" alt="${post.alt || post.title}" class="w-full h-full object-cover">
        </div>
        <div class="p-6">
          <div class="flex items-center mb-3">
            <span class="${categoryClass} genre-tag">${post.categoryLabel}</span>
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
            ${generateGenreTags(post.genres)}
            <span class="ml-auto text-sm text-gray-500">${post.year}</span>
          </div>
          <h3 class="font-primary text-xl font-semibold mb-3">${post.title}</h3>
          ${generateStarRating(post.rating)}
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
            ${generateGenreTags(post.genres)}
            <span class="ml-auto text-sm text-gray-500">1997</span>
          </div>
          <h3 class="font-primary text-xl font-semibold mb-3">${post.title}</h3>
          ${generateStarRating(post.rating)}
          <p class="text-gray-600 mb-4 line-clamp-3">${post.excerpt}</p>
          <div class="text-sm font-medium"><a href="${post.href}">Read Review →</a></div>
        </div>
      `;
    }

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
    
    // Sort by date (latest to earliest) if cardType is 'blog'
    let sortedPosts = posts;
    if (cardType === 'blog') {
      sortedPosts = [...posts].sort((a, b) => {
        const dateA = new Date(a.date);
        const dateB = new Date(b.date);
        return dateB - dateA; // Latest first
      });
    }
    
    sortedPosts.forEach((p) => container.appendChild(createCard(p, cardType)));
  }

  window.BLOG_POSTS = BLOG_POSTS;
  window.renderBlogCards = renderBlogCards;
})();