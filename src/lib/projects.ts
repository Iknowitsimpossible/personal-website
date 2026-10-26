import { getCollection } from 'astro:content';
export async function getPublishedProjects() {
  const projects = await getCollection('projects', ({ data }) => !data.draft);
  return projects.sort(
    (a, b) =>
      b.data.year - a.data.year ||
      b.data.order - a.data.order ||
      a.id.localeCompare(b.id),
  );
}
