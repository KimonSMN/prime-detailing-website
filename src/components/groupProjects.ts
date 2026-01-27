import { ManifestItem } from "@/components/ResponsivePicture";

export type Project = {
  id: string;
  title: string;
  items: ManifestItem[];
};

function prettyTitleFromId(id: string) {
  return id
    .replace(/^detailing-/, "")
    .replace(/-/g, " ")
    .replace(/\b\w/g, (c) => c.toUpperCase());
}

export function groupProjects(items: ManifestItem[]): Project[] {
  const map = new Map<string, { title: string; items: ManifestItem[] }>();

  for (const item of items) {
    // NEW manifest: item.project.{id,title}
    const projectId =
      (item as any)?.project?.id ?? item.id.replace(/-\d+$/, "");
    const projectTitle =
      (item as any)?.project?.title ?? prettyTitleFromId(projectId);

    if (!map.has(projectId)) {
      map.set(projectId, { title: projectTitle, items: [] });
    }
    map.get(projectId)!.items.push(item);
  }

  return Array.from(map.entries()).map(([id, bucket]) => ({
    id,
    title: bucket.title,
    items: bucket.items.sort((a, b) => a.id.localeCompare(b.id)),
  }));
}
