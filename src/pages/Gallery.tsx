import React, { useEffect, useState, useMemo } from "react";
import { supabase } from "@/lib/supabaseClient";
import ProjectGalleryModal from "@/components/ProjectGalleryModal";
import { groupProjects, Project } from "@/components/groupProjects";

const INITIAL_VISIBLE = 4;
const LOAD_MORE_STEP = 4;

// List the 4 projects you want to feature first (use folder names)
const FEATURED_PROJECTS = [
  "Defender",
  "Audi R8",
  "Volvo XC40 Ceramic Coated",
  "GLC 220d",
];

export default function Gallery() {
  const [items, setItems] = useState<ManifestItem[]>([]);
  const [activeProject, setActiveProject] = useState<Project | null>(null);
  const [visibleCount, setVisibleCount] = useState(INITIAL_VISIBLE);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    let isMounted = true;

    async function loadImages() {
      setLoading(true);
      setItems([]);

      try {
        // 1. Get folders (projects)
        const { data: folders, error } = await supabase.storage
          .from("images")
          .list("", { limit: 100 });

        if (error || !folders) {
          console.error("Error fetching folders:", error);
          if (isMounted) setItems([]);
          return;
        }

        // Keep featured folders first, then sort the rest alphabetically.
        const featuredOrder = new Map(
          FEATURED_PROJECTS.map((name, index) => [name, index]),
        );

        folders.sort((a, b) => {
          const aName = a.name ?? "";
          const bName = b.name ?? "";
          const aFeaturedRank =
            featuredOrder.get(aName) ?? Number.MAX_SAFE_INTEGER;
          const bFeaturedRank =
            featuredOrder.get(bName) ?? Number.MAX_SAFE_INTEGER;

          if (aFeaturedRank !== bFeaturedRank) {
            return aFeaturedRank - bFeaturedRank;
          }

          return aName.localeCompare(bName);
        });

        // 2. Loop each folder
        for (const folder of folders) {
          if (!folder.name) continue;

          const { data: files, error: filesError } = await supabase.storage
            .from("images")
            .list(folder.name);

          if (filesError || !files) {
            console.error("Error fetching files:", filesError);
            continue;
          }

          // Sort images alphabetically
          files.sort((a, b) => a.name.localeCompare(b.name));

          // Use Promise.all to create signed URLs for private bucket
          const mapped: ManifestItem[] = await Promise.all(
            files.map(async (file) => {
              const path = `${folder.name}/${file.name}`;
              const { data: signedData, error: signedError } =
                await supabase.storage.from("images").createSignedUrl(path, 60); // URL valid for 60 seconds

              if (signedError || !signedData) {
                console.error("Error creating signed URL:", signedError);
                return null;
              }

              return {
                id: path,
                src: signedData.signedUrl,
                alt: folder.name,
                project: {
                  id: folder.name,
                  title: folder.name,
                },
              };
            }),
          );

          const folderItems = mapped.filter(Boolean) as ManifestItem[];

          if (!isMounted || folderItems.length === 0) {
            continue;
          }

          // Append each folder as soon as it is ready so cards render progressively.
          setItems((prev) => [...prev, ...folderItems]);
        }
      } catch (err) {
        console.error("Gallery load error:", err);
        if (isMounted) setItems([]);
      } finally {
        if (isMounted) setLoading(false);
      }
    }

    loadImages();

    return () => {
      isMounted = false;
    };
  }, []);

  // Group projects
  const projects = useMemo(() => {
    const grouped = groupProjects(items);

    // Featured first
    const featured = FEATURED_PROJECTS.map((id) =>
      grouped.find((p) => p.id === id),
    ).filter(Boolean) as Project[];

    const others = grouped.filter((p) => !FEATURED_PROJECTS.includes(p.id));

    return [...featured, ...others];
  }, [items]);

  const visibleProjects = projects.slice(0, visibleCount);
  const hasMore = visibleCount < projects.length;

  return (
    <section className="px-4 py-14 md:py-20 bg-background">
      {loading && (
        <div className="text-center text-muted-foreground">
          Loading gallery...
        </div>
      )}

      <>
        <div className="max-w-6xl mx-auto grid gap-6 grid-cols-1 md:grid-cols-2">
          {visibleProjects.map((project, idx) => {
            const cover = project.items[0];

            return (
              <div
                key={project.id}
                role="button"
                tabIndex={0}
                onClick={() => setActiveProject(project)}
                onKeyDown={(e) => {
                  if (e.key === "Enter" || e.key === " ") {
                    setActiveProject(project);
                  }
                }}
                className="
                  group
                  relative
                  overflow-hidden
                  rounded-2xl
                  border
                  bg-card
                  text-left
                  cursor-pointer
                  touch-manipulation
                  focus:outline-none
                  hover:border-secondary-hover
                  hover:border-2
                  transition
                "
              >
                <ResponsivePicture
                  item={cover}
                  eager={idx < 2}
                  className="w-full h-auto object-cover"
                />

                <div className="absolute inset-0 bg-black/40 opacity-0 group-hover:opacity-100 transition-opacity" />

                <div className="pointer-events-none absolute bottom-0 left-0 right-0 text-white bg-black/60 px-4 py-3 backdrop-blur-sm">
                  <h3 className="text-lg font-bold leading-tight">
                    {project.title}
                  </h3>
                  <p className="text-sm opacity-80">
                    {project.items.length} photos
                  </p>
                </div>
              </div>
            );
          })}
        </div>

        {!loading && projects.length === 0 && (
          <div className="mt-8 text-center text-muted-foreground">
            No gallery projects available.
          </div>
        )}

        {/* Load more */}
        {hasMore && (
          <div className="mt-12 flex justify-center">
            <button
              onClick={() =>
                setVisibleCount((c) =>
                  Math.min(c + LOAD_MORE_STEP, projects.length),
                )
              }
              className="
                rounded-xl
                border
                border-secondary
                px-6
                py-3
                text-secondary
                font-semibold
                hover:bg-secondary
                hover:text-black
                transition
              "
            >
              Load more
            </button>
          </div>
        )}

        {activeProject && (
          <ProjectGalleryModal
            title={activeProject.title}
            items={activeProject.items}
            onClose={() => setActiveProject(null)}
          />
        )}
      </>
    </section>
  );
}

export type ManifestItem = {
  id: string;
  src: string;
  alt: string;
  project?: { id: string; title: string };
};

export function ResponsivePicture({
  item,
  eager = false,
  className,
}: {
  item: ManifestItem;
  eager?: boolean;
  className?: string;
}) {
  return (
    <img
      src={item.src}
      alt={item.alt}
      loading={eager ? "eager" : "lazy"}
      fetchPriority={eager ? "high" : "auto"}
      decoding="async"
      className={className}
      style={{
        width: "100%",
        height: "auto",
        display: "block",
      }}
    />
  );
}
