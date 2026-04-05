"use client";

import { useEffect, useMemo, useState } from "react";
import { Plus, Pencil, Trash2, X, RefreshCcw } from "lucide-react";
import { ProjectImage, ProjectRecord } from "@/lib/types";
import { compressImage } from "@/lib/image-compression";

const ADMIN_PASSWORD = "admin1passwd";

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
  images: ProjectImage[];
  pendingFiles: DraftImage[];
};

type PendingAction =
  | { type: "create" }
  | { type: "edit"; project: ProjectRecord }
  | { type: "delete"; projectId: string };

const emptyEditor = (): EditorState => ({
  mode: "create",
  name: "",
  description: "",
  images: [],
  pendingFiles: []
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

export function Dashboard() {
  const [projects, setProjects] = useState<ProjectRecord[]>([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [editor, setEditor] = useState<EditorState | null>(null);
  const [pendingAction, setPendingAction] = useState<PendingAction | null>(null);
  const [adminPassword, setAdminPassword] = useState("");
  const [adminPasswordError, setAdminPasswordError] = useState("");
  const [saving, setSaving] = useState(false);
  const [deletingId, setDeletingId] = useState<string | null>(null);
  const [toast, setToast] = useState<{ kind: "success" | "error"; message: string } | null>(null);

  useEffect(() => {
    void loadProjects();
  }, []);

  useEffect(() => {
    if (!toast) return;

    const timer = window.setTimeout(() => setToast(null), 4000);
    return () => window.clearTimeout(timer);
  }, [toast]);

  const totalImages = useMemo(
    () => projects.reduce((count, project) => count + project.images.length, 0),
    [projects]
  );

  function openAdminPasswordModal(action: PendingAction) {
    setPendingAction(action);
    setAdminPassword("");
    setAdminPasswordError("");
  }

  function closeAdminPasswordModal() {
    setPendingAction(null);
    setAdminPassword("");
    setAdminPasswordError("");
  }

  async function loadProjects() {
    try {
      setLoading(true);
      const response = await fetch("/api/projects", { cache: "no-store" });
      if (!response.ok) throw new Error("Failed to load projects.");
      const data = (await response.json()) as ProjectRecord[];
      setProjects(data);
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
      await loadProjects();
      setToast({ kind: "success", message: "Projects refreshed." });
    } finally {
      setRefreshing(false);
    }
  }

  function openCreate() {
    setEditor(emptyEditor());
  }

  function openEdit(project: ProjectRecord) {
    setEditor({
      mode: "edit",
      id: project.id,
      name: project.name,
      description: project.description,
      images: project.images,
      pendingFiles: []
    });
  }

  function requestCreate() {
    openAdminPasswordModal({ type: "create" });
  }

  function requestEdit(project: ProjectRecord) {
    openAdminPasswordModal({ type: "edit", project });
  }

  function requestDelete(projectId: string) {
    openAdminPasswordModal({ type: "delete", projectId });
  }

  async function confirmAdminPassword(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault();

    if (adminPassword !== ADMIN_PASSWORD) {
      setAdminPasswordError("Incorrect password.");
      return;
    }

    const action = pendingAction;
    closeAdminPasswordModal();

    if (!action) return;

    if (action.type === "create") {
      openCreate();
      return;
    }

    if (action.type === "edit") {
      openEdit(action.project);
      return;
    }

    if (action.type === "delete") {
      await deleteProject(action.projectId);
    }
  }

  function closeEditor() {
    if (!editor) return;
    editor.pendingFiles.forEach((item) => URL.revokeObjectURL(item.previewUrl));
    setEditor(null);
  }

  function updateField(field: "name" | "description", value: string) {
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

    setEditor({ ...editor, pendingFiles: [...editor.pendingFiles, ...nextFiles] });

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
    setEditor({ ...editor, pendingFiles: editor.pendingFiles.filter((item) => item.id !== id) });
  }

  function removeExistingImage(imageId: string) {
    if (!editor) return;
    setEditor({
      ...editor,
      images: editor.images.filter((image) => image.id !== imageId)
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
        mimeType: image.mimeType
      }));

      const payload = {
        name: editor.name.trim(),
        description: editor.description.trim(),
        images: [...existingImagesPayload, ...uploaded]
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

      editor.pendingFiles.forEach((item) => URL.revokeObjectURL(item.previewUrl));
      setEditor(null);
      await loadProjects();
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
      await loadProjects();
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
            <strong>{projects.length}</strong>
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
                  {project.images[0] ? (
                    // eslint-disable-next-line @next/next/no-img-element
                    <img src={project.images[0].url} alt={project.name} />
                  ) : null}
                </div>
                <div className="project-body">
                  <div>
                    <h3>{project.name}</h3>
                    <p>{project.description}</p>
                  </div>
                  <div className="project-footer">
                    <span className="pill">{project.images.length} images</span>
                    <div className="actions">
                      <button
                        className="btn btn-ghost"
                        type="button"
                        onClick={() => requestEdit(project)}
                      >
                        <Pencil size={16} /> Edit
                      </button>
                      <button
                        className="btn btn-danger gap-2"
                        type="button"
                        onClick={() => requestDelete(project.id)}
                        disabled={deletingId === project.id}
                      >
                        <Trash2 size={16} />
                        {deletingId === project.id ? "Deleting" : "Delete"}
                      </button>
                    </div>
                  </div>
                </div>
              </article>
            ))}
          </div>
        )}
      </div>

      {editor ? (
        <div className="modal-backdrop" role="presentation" onClick={closeEditor}>
          <div className="modal" role="dialog" aria-modal="true" onClick={(event) => event.stopPropagation()}>
            <div className="modal-header">
              <div>
                <div className="section-label">
                  {editor.mode === "create" ? "New project" : "Edit project"}
                </div>
                <h2>{editor.mode === "create" ? "Add project" : editor.name}</h2>
              </div>
              <button className="btn btn-ghost" type="button" onClick={closeEditor}>
                <X size={16} /> Close
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
                  <label htmlFor="images">Add images</label>
                  <input
                    id="images"
                    type="file"
                    multiple
                    accept="image/*"
                    onChange={(event) => addFiles(event.target.files)}
                  />
                </div>
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
                <div className="section-label">Current images</div>
                {editor.images.length === 0 && editor.pendingFiles.length === 0 ? (
                  <p className="help">Add at least one image before saving.</p>
                ) : null}

                <div className="image-grid" style={{ marginTop: 12 }}>
                  {editor.images.map((image) => (
                    <div key={image.id} className="image-chip">
                      {/* eslint-disable-next-line @next/next/no-img-element */}
                      <img src={image.url} alt={image.filename} />
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
                          fontSize: "0.75rem",
                          background: "rgba(8,17,31,0.9)",
                          borderRadius: "4px",
                          padding: "4px 6px",
                          color: "#9cafcc"
                        }}
                      >
                        {image.filename}
                      </div>
                    </div>
                  ))}
                  {editor.pendingFiles.map((image) => (
                    <div key={image.id} className="image-chip">
                      {/* eslint-disable-next-line @next/next/no-img-element */}
                      <img src={image.previewUrl} alt={image.file.name} />
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
                          fontSize: "0.75rem",
                          background: "rgba(8,17,31,0.9)",
                          borderRadius: "4px",
                          padding: "4px 6px",
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
                <button className="btn btn-ghost" type="button" onClick={closeEditor}>
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
          onClick={closeAdminPasswordModal}
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
              <button className="btn btn-ghost" type="button" onClick={closeAdminPasswordModal}>
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
                />
                {adminPasswordError ? <p className="help" style={{ color: "#ffb3b3" }}>{adminPasswordError}</p> : null}
              </div>

              <div className="form-actions">
                <button className="btn btn-ghost" type="button" onClick={closeAdminPasswordModal}>
                  Cancel
                </button>
                <button className="btn btn-primary" type="submit">
                  Continue
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