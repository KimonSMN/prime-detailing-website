import React, { useEffect, useState, useMemo } from "react";
import {
  ResponsivePicture,
  ManifestItem,
} from "@/components/ResponsivePicture";
import ProjectGalleryModal from "@/components/ProjectGalleryModal";
import { groupProjects, Project } from "@/components/groupProjects";

const INITIAL_VISIBLE = 4;
const LOAD_MORE_STEP = 4;

export default function Gallery() {
  const [items, setItems] = useState<ManifestItem[]>([]);
  const [activeProject, setActiveProject] = useState<Project | null>(null);
  const [visibleCount, setVisibleCount] = useState(INITIAL_VISIBLE);

  useEffect(() => {
    fetch("/gallery-manifest.json")
      .then((r) => r.json())
      .then(setItems)
      .catch(() => setItems([]));
  }, []);

  const projects = useMemo(() => groupProjects(items), [items]);

  const visibleProjects = projects.slice(0, visibleCount);
  const hasMore = visibleCount < projects.length;

  return (
    <section className="px-4 py-14 md:py-20 bg-background">
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
                hover:border-amber-400
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

      {/* Load more */}
      {hasMore && (
        <div className="mt-12 flex justify-center">
          <button
            onClick={() =>
              setVisibleCount((c) =>
                Math.min(c + LOAD_MORE_STEP, projects.length)
              )
            }
            className="
              rounded-xl
              border
              border-amber-400/50
              px-6
              py-3
              text-amber-400
              font-semibold
              hover:bg-amber-400
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
    </section>
  );
}
