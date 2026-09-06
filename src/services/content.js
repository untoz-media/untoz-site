const base = import.meta.env.BASE_URL;

async function loadJson(path, fallback) {
  try {
    const response = await fetch(`${base}${path}`, { cache: 'no-store' });
    if (!response.ok) throw new Error(`Failed to load ${path}`);
    return await response.json();
  } catch {
    return fallback;
  }
}

export function loadHomepage(fallback = {}) {
  return loadJson('content/homepage.json', fallback);
}

export function loadPosts(fallback = []) {
  return loadJson('content/posts.json', fallback);
}

export function loadSite(fallback = {}) {
  return loadJson('content/site.json', fallback);
}

export async function loadUntozContent(fallback = {}) {
  const [homepage, posts, site] = await Promise.all([
    loadHomepage(fallback.homepage ?? {}),
    loadPosts(fallback.posts ?? []),
    loadSite(fallback.site ?? {}),
  ]);

  return { homepage, posts, site };
}
