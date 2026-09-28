import { getCollection } from 'astro:content';
export async function getPublishedProjects() {
  const projects = await getCollection('projects', ({ data }) => !data.draft);
  return projects.sort(
    (a, b) =>
      a.data.order - b.data.order ||
      b.data.year - a.data.year ||
      a.id.localeCompare(b.id),
  );
}
