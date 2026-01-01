import { ManifestItem } from "@/components/ResponsivePicture";

export type Project = {
  id: string;
  title: string;
  items: ManifestItem[];
};

export function groupProjects(items: ManifestItem[]): Project[] {
  const map = new Map<string, ManifestItem[]>();

  for (const item of items) {
    // Example: detailing-bmw-x1-3 → detailing-bmw-x1
    const projectId = item.id.replace(/-\d+$/, "");
    if (!map.has(projectId)) map.set(projectId, []);
    map.get(projectId)!.push(item);
  }

  return Array.from(map.entries()).map(([id, items]) => ({
    id,
    title: id
      .replace(/^detailing-/, "")
      .replace(/-/g, " ")
      .replace(/\b\w/g, (c) => c.toUpperCase()),
    items: items.sort((a, b) => a.id.localeCompare(b.id)),
  }));
}
