import { getCollection, type CollectionEntry } from 'astro:content';

type Category = CollectionEntry<'posts'>['data']['category'];

// Front matter uses short ids; readers see these labels.
export const categoryLabels: Record<Category, string> = {
  reflection: 'Reflection',
  'project-log': 'Project Log',
  'concepts-explained': 'Concepts Explained',
};

export async function getPublishedPosts() {
  const posts = await getCollection('posts', ({ data }) => !data.draft);
  return posts.sort(
    (a, b) =>
      b.data.date.getTime() - a.data.date.getTime() || a.id.localeCompare(b.id),
  );
}

// Dates in front matter are parsed as UTC midnight, so format in UTC too;
// otherwise a reader west of London sees the previous day.
export function formatPostDate(date: Date, style: 'short' | 'long' = 'long') {
  return date.toLocaleDateString('en-US', {
    timeZone: 'UTC',
    year: 'numeric',
    month: style === 'short' ? 'short' : 'long',
    day: style === 'short' ? undefined : 'numeric',
  });
}
