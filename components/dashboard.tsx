"use client";

import { useEffect, useMemo, useState } from "react";
import { Plus, Pencil, Trash2, X, RefreshCcw, UploadCloud, ChevronLeft, ChevronRight, Star } from "lucide-react";
import { ProjectImage, ProjectRecord, ProjectsResponse } from "@/lib/types";
import { compressImage } from "@/lib/image-compression";

const ADMIN_PASSWORD = process.env.NEXT_PUBLIC_ADMIN_PASSWORD;

type ProjectImagePayload =
  | { id: string; filename: string; mimeType: string }
  | { filename: string; mimeType: string; dataBase64: string };

type DraftImage = {
  id: string;
  file: File;
  previewUrl: string;
  originalSize: number;
  compressedSize: number;
  isCompressing: boolean;
};

type EditorState = {
  mode: "create" | "edit";
  id?: string;
  name: string;
  description: string;
  createdAt: string;
  images: ProjectImage[];
  pendingFiles: DraftImage[];
  frontSelection?: string | null; // 'existing:<id>' or 'pending:<id>'
  prefetchedImageUrls?: string[];
};

type PendingAction =
  | { type: "create" }
  | { type: "edit"; projectId: string }
  | { type: "delete"; projectId: string };

const emptyEditor = (): EditorState => ({
  mode: "create",
  name: "",
  description: "",
  createdAt: new Date().toISOString().slice(0, 10),
  images: [],
  pendingFiles: []
  , frontSelection: null
  , prefetchedImageUrls: []
});

function fileToBase64(file: File): Promise<string> {
  return new Promise((resolve, reject) => {
    const reader = new FileReader();

    reader.onload = () => {
      const value = typeof reader.result === "string" ? reader.result : "";
      const [, base64 = ""] = value.split(",");
      if (!base64) {
        reject(new Error(`Failed to read image: ${file.name}`));
        return;
      }
      resolve(base64);
    };

    reader.onerror = () => reject(new Error(`Failed to read image: ${file.name}`));
    reader.readAsDataURL(file);
  });
}

export function Dashboard({
  initialData,
  initialLoaded
}: {
  initialData: ProjectsResponse | null;
  initialLoaded: boolean;
}) {
  const [data, setData] = useState<ProjectsResponse | null>(initialData);
  const [loading, setLoading] = useState(!initialLoaded);
  const [refreshing, setRefreshing] = useState(false);
  const [currentPage, setCurrentPage] = useState(1);
  const pageSize = 6;
  const [editor, setEditor] = useState<EditorState | null>(null);
  const [pendingAction, setPendingAction] = useState<PendingAction | null>(null);
  const [adminPassword, setAdminPassword] = useState("");
  const [adminPasswordError, setAdminPasswordError] = useState("");
  const [saving, setSaving] = useState(false);
  const [deletingId, setDeletingId] = useState<string | null>(null);
  const [loadingEditorProjectId, setLoadingEditorProjectId] = useState<string | null>(null);
  const [adminActionLoading, setAdminActionLoading] = useState(false);
  const [toast, setToast] = useState<{ kind: "success" | "error"; message: string } | null>(null);

  const projects = data?.projects ?? [];
  const totalPages = data?.totalPages ?? 1;

  useEffect(() => {
    if (!initialLoaded) {
      void loadProjects(1);
    }
    // Intentionally run only once during hydration.
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  useEffect(() => {
    if (currentPage === 1) return;

    const loadPage = async () => {
      try {
        setLoading(true);
        const response = await fetch(
          `/api/projects?page=${currentPage}&pageSize=${pageSize}&previewImages=1`,
          { cache: "no-store" }
        );
        if (!response.ok) throw new Error("Failed to load projects.");
        const json = (await response.json()) as ProjectsResponse;
        setData(json);
      } catch (error) {
        setToast({
          kind: "error",
          message: error instanceof Error ? error.message : "Unable to load projects."
        });
      } finally {
        setLoading(false);
      }
    };

    void loadPage();
  }, [currentPage]);

  useEffect(() => {
    if (!toast) return;

    const timer = window.setTimeout(() => setToast(null), 4000);
    return () => window.clearTimeout(timer);
  }, [toast]);

  const totalImages = useMemo(
    () => projects.reduce((count, project) => count + project.imageCount, 0),
    [projects]
  );

  function openAdminPasswordModal(action: PendingAction) {
    setPendingAction(action);
    setAdminPassword("");
    setAdminPasswordError("");
    setAdminActionLoading(false);
  }

  function closeAdminPasswordModal() {
    if (adminActionLoading) return;
    setPendingAction(null);
    setAdminPassword("");
    setAdminPasswordError("");
  }

  async function loadProjects(page: number = 1) {
    try {
      setLoading(true);
      const response = await fetch(`/api/projects?page=${page}&pageSize=${pageSize}&previewImages=1`, {
        cache: "no-store"
      });
      if (!response.ok) throw new Error("Failed to load projects.");
      const json = (await response.json()) as ProjectsResponse;
      setData(json);
    } catch (error) {
      setToast({
        kind: "error",
        message: error instanceof Error ? error.message : "Unable to load projects."
      });
    } finally {
      setLoading(false);
    }
  }

  async function refreshProjects() {
    try {
      setRefreshing(true);
      setCurrentPage(1);
      await loadProjects(1);
      setToast({ kind: "success", message: "Projects refreshed." });
    } finally {
      setRefreshing(false);
    }
  }

  function openCreate() {
    setEditor(emptyEditor());
  }

  async function openEdit(projectId: string) {
    try {
      setLoadingEditorProjectId(projectId);
      const response = await fetch(`/api/projects/${projectId}`, { cache: "no-store" });

      if (!response.ok) {
        throw new Error("Unable to load full project details.");
      }

      const project = (await response.json()) as ProjectRecord;

      const frontImage = project.images.find((img) => (img as any).isFront);

      // Prefetch image blobs and replace URLs with object URLs to ensure previews
      const prefetched: string[] = [];
      const imagesWithObjectUrls = await Promise.all(
        project.images.map(async (img) => {
          try {
            const res = await fetch(img.url, { cache: "no-store" });
            if (!res.ok) throw new Error("Failed to fetch image");
            const blob = await res.blob();
            const objUrl = URL.createObjectURL(blob);
            prefetched.push(objUrl);
            return { ...img, url: objUrl };
          } catch {
            // fallback to original URL if prefetch fails
            return img;
          }
        })
      );

      setEditor({
        mode: "edit",
        id: project.id,
        name: project.name,
        description: project.description,
        createdAt: toLocalDateTimeValue(project.createdAt),
        images: imagesWithObjectUrls,
        pendingFiles: [],
        frontSelection: frontImage ? `existing:${frontImage.id}` : null,
        prefetchedImageUrls: prefetched
      });
    } catch (error) {
      setToast({
        kind: "error",
        message: error instanceof Error ? error.message : "Unable to load project details."
      });
    } finally {
      setLoadingEditorProjectId(null);
    }
  }

  function requestCreate() {
    openAdminPasswordModal({ type: "create" });
  }

  function requestEdit(project: ProjectRecord) {
    openAdminPasswordModal({ type: "edit", projectId: project.id });
  }

  function requestDelete(projectId: string) {
    openAdminPasswordModal({ type: "delete", projectId });
  }

  async function confirmAdminPassword(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault();

    if (adminActionLoading) return;

    if (adminPassword !== ADMIN_PASSWORD) {
      setAdminPasswordError("Incorrect password.");
      return;
    }

    const action = pendingAction;

    if (!action) return;

    try {
      setAdminActionLoading(true);

      if (action.type === "create") {
        openCreate();
        return;
      }

      if (action.type === "edit") {
        await openEdit(action.projectId);
        return;
      }

      if (action.type === "delete") {
        await deleteProject(action.projectId);
      }
    } finally {
      setAdminActionLoading(false);
      closeAdminPasswordModal();
    }
  }

  function closeEditor() {
    if (saving) return;
    if (!editor) return;
    editor.pendingFiles.forEach((item) => URL.revokeObjectURL(item.previewUrl));
    editor.prefetchedImageUrls?.forEach((u) => {
      try {
        URL.revokeObjectURL(u);
      } catch {}
    });
    setEditor(null);
  }

  function updateField(field: "name" | "description" | "createdAt", value: string) {
    if (!editor) return;
    setEditor({ ...editor, [field]: value });
  }

  async function addFiles(files: FileList | null) {
    if (!editor || !files?.length) return;

    const nextFiles = Array.from(files).map((file) => ({
      id: crypto.randomUUID(),
      file,
      previewUrl: URL.createObjectURL(file),
      originalSize: file.size,
      compressedSize: 0,
      isCompressing: true
    }));

    // If creating a new project and there are no existing images, do NOT auto-select
    // a single uploaded image as the front. When multiple pending images are present,
    // pick one at random to be the front; otherwise leave frontSelection null.
    const combinedPending = [...editor.pendingFiles, ...nextFiles];
    let nextFront = editor.frontSelection;
    if (editor.mode === "create" && editor.images.length === 0 && !editor.frontSelection) {
      if (combinedPending.length > 1) {
        const rand = Math.floor(Math.random() * combinedPending.length);
        nextFront = `pending:${combinedPending[rand].id}`;
      } else {
        nextFront = null;
      }
    }

    setEditor({
      ...editor,
      pendingFiles: combinedPending,
      frontSelection: nextFront
    });

    // Compress each file in background
    for (const draftImage of nextFiles) {
      try {
        const compressed = await compressImage(draftImage.file, 1920, 1920, 0.75);
        setEditor((prev) => {
          if (!prev) return null;
          return {
            ...prev,
            pendingFiles: prev.pendingFiles.map((item) =>
              item.id === draftImage.id
                ? {
                    ...item,
                    file: compressed,
                    compressedSize: compressed.size,
                    isCompressing: false
                  }
                : item
            )
          };
        });
      } catch (error) {
        setToast({
          kind: "error",
          message: `Failed to compress ${draftImage.file.name}: ${error instanceof Error ? error.message : "Unknown error"}`
        });
      }
    }
  }

  function removeDraftImage(id: string) {
    if (!editor) return;
    const target = editor.pendingFiles.find((item) => item.id === id);
    if (target) URL.revokeObjectURL(target.previewUrl);
    // If the removed draft was the selected front, pick another remaining image
    let nextFront = editor.frontSelection;
    if (editor.frontSelection === `pending:${id}`) {
      const remainingPending = editor.pendingFiles.filter((item) => item.id !== id);
      if (remainingPending.length > 0) {
        nextFront = `pending:${remainingPending[0].id}`;
      } else if (editor.images.length > 0) {
        nextFront = `existing:${editor.images[0].id}`;
      } else {
        nextFront = null;
      }
    }

    // Update images' isFront flags based on the new frontSelection
    const updatedImages = editor.images.map((img) => ({ ...img, isFront: nextFront === `existing:${img.id}` }));

    setEditor({
      ...editor,
      pendingFiles: editor.pendingFiles.filter((item) => item.id !== id),
      frontSelection: nextFront,
      images: updatedImages
    });
  }

  function removeExistingImage(imageId: string) {
    if (!editor) return;
    // If the removed existing image was the selected front, pick another remaining image
    let nextFront = editor.frontSelection;
    if (editor.frontSelection === `existing:${imageId}`) {
      const remainingExisting = editor.images.filter((image) => image.id !== imageId);
      if (remainingExisting.length > 0) {
        nextFront = `existing:${remainingExisting[0].id}`;
      } else if (editor.pendingFiles.length > 0) {
        nextFront = `pending:${editor.pendingFiles[0].id}`;
      } else {
        nextFront = null;
      }
    }
    // revoke object URL if we prefetched it
    const target = editor.images.find((image) => image.id === imageId);
    if (target && editor.prefetchedImageUrls?.includes(target.url)) {
      try {
        URL.revokeObjectURL(target.url);
      } catch {}
    }

    // Update remaining images isFront according to the nextFront selection
    const remainingImages = editor.images.filter((image) => image.id !== imageId).map((img) => ({
      ...img,
      isFront: nextFront === `existing:${img.id}`
    }));

    setEditor({
      ...editor,
      images: remainingImages,
      prefetchedImageUrls: editor.prefetchedImageUrls?.filter((u) => u !== (target?.url)) ?? [],
      frontSelection: nextFront
    });
  }

  function setFrontSelection(kind: "existing" | "pending", id: string) {
    if (!editor) return;
    // When selecting an existing image as front, immediately update the local
    // `isFront` flags so the UI reflects the change without waiting for the server.
    if (kind === "existing") {
      setEditor({
        ...editor,
        frontSelection: `existing:${id}`,
        images: editor.images.map((img) => ({ ...img, isFront: img.id === id }))
      });
      return;
    }

    // Selecting a pending image - clear any `isFront` on existing images.
    setEditor({
      ...editor,
      frontSelection: `pending:${id}`,
      images: editor.images.map((img) => ({ ...img, isFront: false }))
    });
  }

  function clearAllImages() {
    if (!editor) return;
    // revoke object URLs for pending previews
    editor.pendingFiles.forEach((p) => {
      try {
        URL.revokeObjectURL(p.previewUrl);
      } catch {}
    });
    // revoke any prefetched object URLs
    editor.prefetchedImageUrls?.forEach((u) => {
      try {
        URL.revokeObjectURL(u);
      } catch {}
    });

    setEditor({
      ...editor,
      images: [],
      pendingFiles: [],
      prefetchedImageUrls: [],
      frontSelection: null
    });
  }

  async function submitEditor(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault();
    if (!editor) return;

    try {
      setSaving(true);

      if (!editor.name.trim() || !editor.description.trim()) {
        throw new Error("Name and description are required.");
      }

      const uploaded = await Promise.all(
        editor.pendingFiles.map(async (item) => ({
          filename: item.file.name,
          mimeType: item.file.type || "application/octet-stream",
          dataBase64: await fileToBase64(item.file)
        }))
      );

      const existingImagesPayload: ProjectImagePayload[] = editor.images.map((image) => ({
        id: image.id,
        filename: image.filename,
        mimeType: image.mimeType,
        isFront: editor.frontSelection === `existing:${image.id}`
      }));

      const uploadedWithFront = uploaded.map((u, idx) => {
        const draft = editor.pendingFiles[idx];
        return {
          ...u,
          isFront: editor.frontSelection === `pending:${draft.id}`
        };
      });

      const payload = {
        name: editor.name.trim(),
        description: editor.description.trim(),
        createdAt: toIsoDateTime(editor.createdAt),
        images: [...existingImagesPayload, ...uploadedWithFront]
      };

      if (payload.images.length < 1) {
        throw new Error("Add at least one image.");
      }

      const response = await fetch(
        editor.mode === "create" ? "/api/projects" : `/api/projects/${editor.id}`,
        {
          method: editor.mode === "create" ? "POST" : "PATCH",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify(payload)
        }
      );

      if (!response.ok) {
        const error = (await response.json().catch(() => null)) as { error?: unknown } | null;
        throw new Error(
          typeof error?.error === "string" ? error.error : "Unable to save project."
        );
      }

      // revoke pending file object URLs
      editor.pendingFiles.forEach((item) => URL.revokeObjectURL(item.previewUrl));
      // revoke prefetched image object URLs
      editor.prefetchedImageUrls?.forEach((u) => {
        try {
          URL.revokeObjectURL(u);
        } catch {}
      });
      setEditor(null);
      await loadProjects(currentPage);
      setToast({
        kind: "success",
        message: editor.mode === "create" ? "Project created." : "Project updated."
      });
    } catch (error) {
      setToast({
        kind: "error",
        message: error instanceof Error ? error.message : "Unable to save project."
      });
    } finally {
      setSaving(false);
    }
  }

  async function deleteProject(id: string) {
    try {
      setDeletingId(id);
      const response = await fetch(`/api/projects/${id}`, { method: "DELETE" });
      if (!response.ok) throw new Error("Unable to delete project.");
      await loadProjects(currentPage);
      setToast({ kind: "success", message: "Project deleted." });
    } catch (error) {
      setToast({
        kind: "error",
        message: error instanceof Error ? error.message : "Unable to delete project."
      });
    } finally {
      setDeletingId(null);
    }
  }

  return (
    <section className="dashboard">
      <div className="toolbar">
        <div className="stats">
          <div className="stat">
            <span>Projects</span>
            <strong>{data?.total ?? 0}</strong>
          </div>
          <div className="stat">
            <span>Total images</span>
            <strong>{totalImages}</strong>
          </div>
          <div className="stat">
            <span>Status</span>
            <strong className={loading ? "stat-status loading" : "stat-status ready"}>
              {loading ? "Loading" : "Ready"}
            </strong>
          </div>
        </div>

        <div className="actions">
          {/* <a href="/submissions" className="btn btn-ghost" style={{ textDecoration: 'none' }}>
            📬 Submissions
          </a> */}
          <button className="btn btn-ghost" onClick={refreshProjects} type="button">
            <RefreshCcw size={16} /> {refreshing ? "Refreshing" : "Refresh"}
          </button>
          <button className="btn btn-primary" onClick={requestCreate} type="button">
            <Plus size={16} /> New project
          </button>
        </div>
      </div>

      <div className="panel">
        {/* <div className="section-label">Projects</div> */}

        {loading ? (
          <div className="loading-state">
Loading...
          </div>
        ) : projects.length === 0 ? (
          <div className="empty-state">
            <strong>No projects yet.</strong>
            <p>Add the first project to start building the portfolio dashboard.</p>
          </div>
        ) : (
          <div className="grid">
            {projects.map((project) => (
              <article key={project.id} className="project-card">
                <div className="project-cover">
                  {project.images && project.images.length > 0 ? (
                    // prefer image marked as front
                    (() => {
                      const front = project.images.find((img: any) => img.isFront) || project.images[0];
                      // eslint-disable-next-line @next/next/no-img-element
                      return <img src={front.url} alt={project.name} loading="lazy" decoding="async" />;
                    })()
                  ) : null}
                </div>
                <div className="project-body">
                  <div>
                    <h3>{project.name}</h3>
                    <p>{project.description}</p>
                  </div>
                  <div className="project-footer">
                    <span className="pill">{project.imageCount} images</span>
                    <div className="actions">
                      <button
                        className="btn btn-ghost"
                        type="button"
                        onClick={() => requestEdit(project)}
                        disabled={loadingEditorProjectId === project.id}
                      >
                        <Pencil size={16} />
                         {/* {loadingEditorProjectId === project.id ? "Loading..." : "Edit"} */}
                      </button>
                      <button
                        className="btn btn-danger gap-2"
                        type="button"
                        onClick={() => requestDelete(project.id)}
                        disabled={deletingId === project.id}
                      >
                        <Trash2 size={16} />
                        {/* {deletingId === project.id ? "Deleting" : "Delete"} */}
                      </button>
                    </div>
                  </div>
                </div>
              </article>
            ))}
          </div>
        )}

        {/* Pagination Controls */}
        {!loading && projects.length > 0 && (
          <div
            style={{
              display: "flex",
              flexDirection: "column",
              gap: "1rem",
              marginTop: "2rem",
              padding: "1rem",
              borderRadius: "20px",
              border: "1px solid rgba(98, 133, 202, 0.26)",
              background: "linear-gradient(180deg, rgba(23, 31, 51, 0.5), rgba(14, 19, 31, 0.7))"
            }}
          >
            {/* Buttons Row */}
            <div style={{ display: "flex", gap: "0.75rem", alignItems: "center", justifyContent: "center", flexWrap: "wrap" }}>
              <button
                onClick={() => setCurrentPage(currentPage - 1)}
                disabled={currentPage === 1}
                className="btn btn-ghost"
                style={{
                  opacity: currentPage === 1 ? 0.5 : 1,
                  cursor: currentPage === 1 ? "not-allowed" : "pointer",
                  fontSize: "0.85rem",
                  padding: "0.5rem 0.75rem",
                  display: "flex",
                  alignItems: "center",
                  gap: "0.25rem",
                  whiteSpace: "nowrap"
                }}
              >
                <ChevronLeft size={14} />
                {/* Previous */}
              </button>

              <span style={{ color: "#9cafcc", fontSize: "0.85rem", textAlign: "center" }}>
                Page <strong style={{ color: "#f2f6ff" }}>{currentPage}</strong> of{" "}
                <strong style={{ color: "#f2f6ff" }}>{totalPages}</strong>
              </span>

              <button
                onClick={() => setCurrentPage(currentPage + 1)}
                disabled={currentPage >= totalPages}
                className="btn btn-ghost"
                style={{
                  opacity: currentPage >= totalPages ? 0.5 : 1,
                  cursor: currentPage >= totalPages ? "not-allowed" : "pointer",
                  fontSize: "0.85rem",
                  padding: "0.5rem 0.75rem",
                  display: "flex",
                  alignItems: "center",
                  gap: "0.25rem",
                  whiteSpace: "nowrap"
                }}
              >
                {/* Next */}
                <ChevronRight size={14} />
              </button>
            </div>
          </div>
        )}
      </div>

      {editor ? (
        <div className="modal-backdrop" role="presentation" onClick={saving ? undefined : closeEditor}>
          <div className="modal" role="dialog" aria-modal="true" onClick={(event) => event.stopPropagation()}>
            <div className="modal-header">
              <div>
                {/* <div className="section-label">
                  {editor.mode === "create" ? "New" : "Edit"}
                </div> */}
                <h2>{editor.mode === "create" ? "Add project" : editor.name}</h2>
              </div>
              <button className="btn btn-ghost" type="button" onClick={closeEditor} disabled={saving}>
                <X size={20} /> 
              </button>
            </div>

            <form className="form-grid" onSubmit={submitEditor}>
              <div className="field-grid">
                <div className="field">
                  <label htmlFor="name">Project name</label>
                  <input
                    id="name"
                    value={editor.name}
                    onChange={(event) => updateField("name", event.target.value)}
                    placeholder="House in the valley"
                  />
                </div>

                <div className="field">
                  <label>Images</label>
                  <label
                    htmlFor="images"
                    style={{
                      display: "flex",
                      alignItems: "center",
                      gap: 14,
                      padding: "10px 18px",
                      borderRadius: 18,
                      border: "1px solid rgba(98, 133, 202, 0.26)",
                      background: "linear-gradient(180deg, rgba(23, 31, 51, 0.9), rgba(14, 19, 31, 0.95))",
                      cursor: "pointer",
                      boxShadow: "inset 0 0 0 1px rgba(255,255,255,0.02)"
                    }}
                  >
                    <div
                      style={{
                        width: 36,
                        height: 36,
                        borderRadius: 14,
                        display: "grid",
                        placeItems: "center",
                        background: "linear-gradient(135deg, rgba(88, 156, 255, 0.22), rgba(88, 156, 255, 0.08))",
                        border: "1px solid rgba(111, 163, 255, 0.24)",
                        color: "#8cc0ff",
                        flex: "0 0 auto"
                      }}
                    >
                      <UploadCloud size={20} strokeWidth={2.2} />
                    </div>
                    <div style={{ display: "grid", gap: 2 }}>
                      <strong style={{ color: "#f2f6ff", fontSize: "0.85rem" }}>Upload images</strong>
                      <span style={{ color: "#9cafcc", fontSize: "0.62rem" }}>
                        PNG, JPG, WEBP. Click to choose multiple files.
                      </span>
                    </div>
                  </label>
                  <input
                    id="images"
                    type="file"
                    multiple
                    accept="image/*"
                    onChange={(event) => addFiles(event.target.files)}
                    style={{
                      position: "absolute",
                      width: 1,
                      height: 1,
                      padding: 0,
                      margin: -1,
                      overflow: "hidden",
                      clip: "rect(0, 0, 0, 0)",
                      border: 0
                    }}
                  />
                </div>
              </div>

              <div className="field">
                <label htmlFor="created-at">Created at</label>
                <input
                  id="created-at"
                  type="date"
                  value={editor.createdAt}
                  onChange={(event) => updateField("createdAt", event.target.value)}
                />
              </div>

              <div className="field">
                <label htmlFor="description">Description</label>
                <textarea
                  id="description"
                  value={editor.description}
                  onChange={(event) => updateField("description", event.target.value)}
                  placeholder="Brief project details, materials, site context, or notes."
                />
              </div>

              <div>
                <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
                  <div className="section-label">Current images</div>
                  {(editor.images.length > 0 || editor.pendingFiles.length > 0) && (
                    <button className="" type="button" onClick={clearAllImages}>
                      X
                    </button>
                  )}
                </div>
                {editor.images.length === 0 && editor.pendingFiles.length === 0 ? (
                  <p className="help">Add at least one image before saving.</p>
                ) : null}

                <div
                  className="image-grid"
                  style={{
                    marginTop: 12,
                    display: "grid",
                    gap: 12,
                    gridTemplateColumns:
                      (editor.images.length + editor.pendingFiles.length) === 1
                        ? "repeat(3, minmax(0, 1fr))"
                        : "repeat(auto-fill, minmax(200px, 1fr))"
                  }}
                >
                  {editor.images.map((image) => (
                    <div key={image.id} className="image-chip">
                      {/* eslint-disable-next-line @next/next/no-img-element */}
                      <img src={image.url} alt={image.filename} loading="lazy" decoding="async" />
                     <button
                        type="button"
                        onClick={() => setFrontSelection("existing", image.id)}
                        aria-label={`Set ${image.filename} as front`}
                        style={{
                          position: "absolute",
                          top: 8,
                          right: 48,
                          padding: "4px 6px",
                          borderRadius: 9999,
                          background:
                            editor.frontSelection === `existing:${image.id}` || (image as any).isFront
                              ? "rgba(255,217,102,0.92)"
                              : "rgba(255, 255, 255, 0.4)",
                          color: "#07101d",
                          fontSize: "0.75rem",
                          border: 0,
                          backdropFilter: "blur(6px)",
                          WebkitBackdropFilter: "blur(6px)"
                        }}
                      >
                        <Star size={14} strokeWidth={2} />
                      </button>
                      <button
                        type="button"
                        onClick={() => removeExistingImage(image.id)}
                        aria-label={`Remove ${image.filename}`}
                      >
                        ×
                      </button>
                      
                      <div
                        style={{
                          position: "absolute",
                          bottom: 10,
                          left: 10,
                          fontSize: "0.65rem",
                          background: "rgba(8,17,31,0.9)",
                          borderRadius: "4px",
                          padding: "2px 3px",
                          color: "#9cafcc"
                        }}
                      >
                        {image.filename.length > 30 ? image.filename.slice(0, 30) + "..." : image.filename}
                      </div>
                    </div>
                  ))}
                  {editor.pendingFiles.map((image) => (
                    <div key={image.id} className="image-chip">
                      {/* eslint-disable-next-line @next/next/no-img-element */}
                      <img src={image.previewUrl} alt={image.file.name} />
                      
                      <button
                        type="button"
                        onClick={() => setFrontSelection("pending", image.id)}
                        aria-label={`Set ${image.file.name} as front`}
                        style={{
                          position: "absolute",
                          top: 8,
                          right: 48,
                          padding: "4px 6px",
                          borderRadius: 999,
                          background: editor.frontSelection === `pending:${image.id}` ? "rgba(255,217,102,0.92)" : "rgba(255, 255, 255, 0.4)",
                          color: "#07101d",
                          fontSize: "0.75rem",
                          border: 0,
                          backdropFilter: "blur(6px)",
                          WebkitBackdropFilter: "blur(6px)"
                        }}
                        >
                        <Star size={14} strokeWidth={2} />
                      </button>
                      <button
                        type="button"
                        onClick={() => removeDraftImage(image.id)}
                        aria-label={`Remove ${image.file.name}`}
                        disabled={image.isCompressing}
                      >
                        {image.isCompressing ? "⟳" : "×"}
                      </button>
                      <div
                        style={{
                          position: "absolute",
                          bottom: 10,
                          left: 10,
                          fontSize: "0.65rem",
                          background: "rgba(8,17,31,0.9)",
                          borderRadius: "4px",
                          padding: "2px 3px",
                          color: image.isCompressing ? "#8bb8ff" : "#67d39b"
                        }}
                      >
                        {image.isCompressing ? (
                          "Compressing..."
                        ) : (
                          <>
                            {Math.round(image.originalSize / 1024)}KB →{" "}
                            {Math.round(image.compressedSize / 1024)}KB
                          </>
                        )}
                      </div>
                    </div>
                  ))}
                </div>
              </div>

              <div className="form-actions">
                <button className="btn btn-ghost" type="button" onClick={closeEditor} disabled={saving}>
                  Cancel
                </button>
                <button className="btn btn-primary" type="submit" disabled={saving}>
                  {saving ? "Saving…" : editor.mode === "create" ? "Create project" : "Update project"}
                </button>
              </div>
            </form>
          </div>
        </div>
      ) : null}

      {pendingAction ? (
        <div
          className="modal-backdrop"
          role="presentation"
          onClick={adminActionLoading ? undefined : closeAdminPasswordModal}
        >
          <div
            className="modal"
            role="dialog"
            aria-modal="true"
            onClick={(event) => event.stopPropagation()}
          >
            <div className="modal-header">
              <div>
                <div className="section-label">Admin access</div>
                <h2>Password required</h2>
              </div>
              <button
                className="btn btn-ghost"
                type="button"
                onClick={closeAdminPasswordModal}
                disabled={adminActionLoading}
              >
                <X size={16} /> Close
              </button>
            </div>

            <form className="form-grid" onSubmit={confirmAdminPassword}>
              <div className="field">
                <label htmlFor="admin-password">Admin password</label>
                <input
                  id="admin-password"
                  type="password"
                  value={adminPassword}
                  onChange={(event) => {
                    setAdminPassword(event.target.value);
                    if (adminPasswordError) setAdminPasswordError("");
                  }}
                  placeholder="Enter admin password"
                  autoFocus
                  disabled={adminActionLoading}
                />
                {adminPasswordError ? <p className="help" style={{ color: "#ffb3b3" }}>{adminPasswordError}</p> : null}
              </div>

              <div className="form-actions">
                <button
                  className="btn btn-ghost"
                  type="button"
                  onClick={closeAdminPasswordModal}
                  disabled={adminActionLoading}
                >
                  Cancel
                </button>
                <button className="btn btn-primary" type="submit" disabled={adminActionLoading}>
                  {adminActionLoading ? "Loading..." : "Continue"}
                </button>
              </div>
            </form>
          </div>
        </div>
      ) : null}

      {toast ? <div className={`toast ${toast.kind}`}>{toast.message}</div> : null}
    </section>
  );
}

function toLocalDateTimeValue(value: string) {
  const date = new Date(value);

  if (Number.isNaN(date.getTime())) {
    return new Date().toISOString().slice(0, 10);
  }

  const pad = (part: number) => String(part).padStart(2, "0");

  return `${date.getFullYear()}-${pad(date.getMonth() + 1)}-${pad(date.getDate())}`;
}

function toIsoDateTime(value: string) {
  const date = new Date(`${value}T00:00:00`);

  if (Number.isNaN(date.getTime())) {
    throw new Error("Invalid created date.");
  }

  return date.toISOString();
}