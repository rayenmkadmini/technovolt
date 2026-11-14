"use client";

import { useState, useEffect, useRef, useCallback } from "react";
import { Button } from "@/components/ui/Button";
import { Input } from "@/components/ui/Input";
import { OptimizedImage } from "@/components/media/OptimizedImage";
import { uploadMediaAction } from "@/app/actions/adminActions";
import { resolveMediaSrc } from "@/lib/media/imageUrl";
import {
  Image as ImageIcon,
  Upload,
  X,
  Trash2,
  Folder,
  Copy,
  Check,
  AlertCircle,
  Search,
  RefreshCw,
  Pencil,
  ChevronLeft,
  ChevronRight,
  RotateCcw,
  Loader2,
  CheckCircle2,
} from "lucide-react";

interface MediaAssetRecord {
  id: string;
  file_name: string;
  original_filename?: string | null;
  file_path: string;
  object_key?: string | null;
  file_url: string;
  public_url?: string | null;
  legacy_public_url?: string | null;
  mime_type?: string | null;
  file_size?: number | null;
  size_bytes?: number | null;
  width?: number | null;
  height?: number | null;
  alt_text_fr?: string | null;
  alt_text_ar?: string | null;
  alt_text_en?: string | null;
  folder?: string | null;
  category?: string | null;
  storage_provider?: string | null;
  migration_status?: string | null;
  created_at: string;
  resolvedUrl?: string;
}

interface UploadQueueItem {
  localId: string;
  file: File;
  previewUrl: string;
  name: string;
  sizeBytes: number;
  width: number | null;
  height: number | null;
  status: "queued" | "uploading" | "verifying" | "done" | "duplicate" | "error";
  progress: number;
  error?: string;
}

const VALID_MIME_TYPES = new Set([
  "image/png",
  "image/jpeg",
  "image/jpg",
  "image/webp",
  "image/avif",
  "image/svg+xml",
]);
const MAX_FILE_SIZE_BYTES = 5 * 1024 * 1024; // 5 MB
const PAGE_SIZE = 24;

function formatBytes(bytes?: number | null): string {
  if (!bytes || bytes <= 0) return "-";
  if (bytes < 1024) return `${bytes} B`;
  if (bytes < 1024 * 1024) return `${Math.round(bytes / 1024)} KB`;
  return `${(bytes / (1024 * 1024)).toFixed(2)} MB`;
}

async function computeFileSha256Hex(file: File): Promise<string | undefined> {
  try {
    if (typeof crypto === "undefined" || !crypto.subtle) return undefined;
    const buf = await file.arrayBuffer();
    const digest = await crypto.subtle.digest("SHA-256", buf);
    return Array.from(new Uint8Array(digest))
      .map((b) => b.toString(16).padStart(2, "0"))
      .join("");
  } catch {
    return undefined;
  }
}

function readImageDimensions(
  previewUrl: string
): Promise<{ width: number | null; height: number | null }> {
  return new Promise((resolve) => {
    if (typeof window === "undefined") {
      resolve({ width: null, height: null });
      return;
    }
    const img = new window.Image();
    img.onload = () => {
      resolve({
        width: img.naturalWidth || null,
        height: img.naturalHeight || null,
      });
    };
    img.onerror = () => resolve({ width: null, height: null });
    img.src = previewUrl;
  });
}

function uploadViaXhr(
  uploadUrl: string,
  file: File,
  headers: Record<string, string>,
  onProgress: (pct: number) => void
): Promise<void> {
  return new Promise((resolve, reject) => {
    const xhr = new XMLHttpRequest();
    xhr.open("PUT", uploadUrl, true);
    for (const [k, v] of Object.entries(headers)) {
      xhr.setRequestHeader(k, v);
    }
    xhr.upload.onprogress = (evt) => {
      if (evt.lengthComputable && evt.total > 0) {
        onProgress(Math.min(99, Math.round((evt.loaded / evt.total) * 100)));
      }
    };
    xhr.onload = () => {
      if (xhr.status >= 200 && xhr.status < 300) {
        onProgress(100);
        resolve();
      } else {
        reject(new Error(`Échec du téléversement R2 (HTTP ${xhr.status}).`));
      }
    };
    xhr.onerror = () => reject(new Error("Erreur réseau lors du téléversement direct vers R2."));
    xhr.ontimeout = () => reject(new Error("Délai d'attente dépassé lors du téléversement."));
    xhr.timeout = 60_000;
    xhr.send(file);
  });
}

export default function AdminMediaPage() {
  const [mediaList, setMediaList] = useState<MediaAssetRecord[]>([]);
  const [totalCount, setTotalCount] = useState(0);
  const [page, setPage] = useState(1);
  const [totalPages, setTotalPages] = useState(1);
  const [isLoading, setIsLoading] = useState(true);
  const [loadError, setLoadError] = useState<string | null>(null);

  const [selectedFolder, setSelectedFolder] = useState<string>("all");
  const [searchQuery, setSearchQuery] = useState("");
  const [debouncedSearch, setDebouncedSearch] = useState("");
  const [sortBy, setSortBy] = useState<"created_at" | "file_name" | "size_bytes">("created_at");
  const [sortDir, setSortDir] = useState<"desc" | "asc">("desc");

  const [copiedId, setCopiedId] = useState<string | null>(null);
  const [toastMessage, setToastMessage] = useState<string | null>(null);

  // Upload / Replace Modal State
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [replaceTarget, setReplaceTarget] = useState<MediaAssetRecord | null>(null);
  const [uploadQueue, setUploadQueue] = useState<UploadQueueItem[]>([]);
  const [formFolder, setFormFolder] = useState("chantiers");
  const [formAltFr, setFormAltFr] = useState("");
  const [formAltAr, setFormAltAr] = useState("");
  const [errorMsg, setErrorMsg] = useState<string | null>(null);
  const [isDragging, setIsDragging] = useState(false);
  const [isUploading, setIsUploading] = useState(false);
  const uploadLockRef = useRef(false);
  const fileInputRef = useRef<HTMLInputElement>(null);

  // Alt-text & metadata edit modal
  const [editingItem, setEditingItem] = useState<MediaAssetRecord | null>(null);
  const [editAltFr, setEditAltFr] = useState("");
  const [editAltAr, setEditAltAr] = useState("");
  const [editAltEn, setEditAltEn] = useState("");
  const [editFolder, setEditFolder] = useState("chantiers");
  const [isSavingEdit, setIsSavingEdit] = useState(false);

  // Safe delete confirmation state
  const [deleteTarget, setDeleteTarget] = useState<MediaAssetRecord | null>(null);
  const [isDeleting, setIsDeleting] = useState(false);

  const folders = [
    { id: "all", label: "Tous les fichiers" },
    { id: "branding", label: "Branding" },
    { id: "chantiers", label: "Chantiers" },
    { id: "climatisation", label: "Climatisation" },
    { id: "domotique", label: "Domotique" },
    { id: "services", label: "Services" },
    { id: "projects", label: "Projets" },
  ];

  const showToast = (msg: string) => {
    setToastMessage(msg);
    setTimeout(() => setToastMessage(null), 3500);
  };

  useEffect(() => {
    const t = setTimeout(() => {
      setDebouncedSearch(searchQuery.trim());
      setPage(1);
    }, 300);
    return () => clearTimeout(t);
  }, [searchQuery]);

  const fetchMedia = useCallback(async () => {
    setIsLoading(true);
    setLoadError(null);
    try {
      const params = new URLSearchParams({
        page: String(page),
        limit: String(PAGE_SIZE),
        folder: selectedFolder,
        sortBy,
        sortDir,
      });
      if (debouncedSearch) {
        params.set("search", debouncedSearch);
      }

      const res = await fetch(`/api/media?${params.toString()}`, {
        cache: "no-store",
      });
      const json = await res.json();
      if (!res.ok) {
        throw new Error(json.error || "Erreur lors du chargement des médias.");
      }

      setMediaList(Array.isArray(json.items) ? json.items : []);
      setTotalCount(json.total ?? 0);
      setTotalPages(json.totalPages ?? 1);
    } catch (err: any) {
      setLoadError(err?.message || "Impossible de charger la médiathèque.");
      setMediaList([]);
    } finally {
      setIsLoading(false);
    }
  }, [page, selectedFolder, sortBy, sortDir, debouncedSearch]);

  useEffect(() => {
    const timer = setTimeout(() => {
      void fetchMedia();
    }, 0);
    return () => clearTimeout(timer);
  }, [fetchMedia]);

  // Cleanup any remaining blob URLs on unmount
  useEffect(() => {
    return () => {
      uploadQueue.forEach((item) => {
        if (item.previewUrl.startsWith("blob:")) {
          URL.revokeObjectURL(item.previewUrl);
        }
      });
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const clearUploadModal = () => {
    uploadQueue.forEach((item) => {
      if (item.previewUrl.startsWith("blob:")) {
        URL.revokeObjectURL(item.previewUrl);
      }
    });
    setUploadQueue([]);
    setReplaceTarget(null);
    setFormAltFr("");
    setFormAltAr("");
    setErrorMsg(null);
    setIsModalOpen(false);
  };

  const enqueueFiles = async (files: FileList | File[]) => {
    setErrorMsg(null);
    const incoming = Array.from(files);
    if (incoming.length === 0) return;

    const filesToProcess = replaceTarget ? [incoming[0]] : incoming;
    const rejectedErrors: string[] = [];
    const newItems: UploadQueueItem[] = [];

    for (const file of filesToProcess) {
      if (!VALID_MIME_TYPES.has(file.type)) {
        rejectedErrors.push(`${file.name} : format non valide (PNG, JPG, WebP, AVIF ou SVG).`);
        continue;
      }
      if (file.size <= 0 || file.size > MAX_FILE_SIZE_BYTES) {
        rejectedErrors.push(`${file.name} : taille invalide ou supérieure à 5 Mo.`);
        continue;
      }

      const previewUrl = URL.createObjectURL(file);
      const dims = await readImageDimensions(previewUrl);
      newItems.push({
        localId: `${Date.now()}-${Math.random().toString(36).slice(2, 8)}`,
        file,
        previewUrl,
        name: file.name,
        sizeBytes: file.size,
        width: dims.width,
        height: dims.height,
        status: "queued",
        progress: 0,
      });
    }

    if (rejectedErrors.length > 0) {
      setErrorMsg(rejectedErrors.join(" "));
    }

    if (newItems.length > 0) {
      setUploadQueue((prev) => (replaceTarget ? newItems : [...prev, ...newItems]));
    }
  };

  const updateQueueItem = (localId: string, patch: Partial<UploadQueueItem>) => {
    setUploadQueue((prev) =>
      prev.map((it) => (it.localId === localId ? { ...it, ...patch } : it))
    );
  };

  const removeQueueItem = (localId: string) => {
    setUploadQueue((prev) => {
      const target = prev.find((i) => i.localId === localId);
      if (target?.previewUrl.startsWith("blob:")) {
        URL.revokeObjectURL(target.previewUrl);
      }
      return prev.filter((i) => i.localId !== localId);
    });
  };

  const uploadSingleQueueItem = async (item: UploadQueueItem): Promise<boolean> => {
    try {
      updateQueueItem(item.localId, { status: "uploading", progress: 5, error: undefined });
      const checksumSha256 = await computeFileSha256Hex(item.file);

      const presignRes = await fetch("/api/media/presign", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          filename: item.file.name,
          mimeType: item.file.type,
          sizeBytes: item.file.size,
          folder: formFolder,
          checksumSha256,
          allowDuplicate: Boolean(replaceTarget),
        }),
      });

      const presignJson = await presignRes.json();

      // Transitional fallback when R2 env vars are not yet configured (503)
      if (presignRes.status === 503 && !replaceTarget) {
        const fd = new FormData();
        fd.append("file", item.file);
        fd.append("folder", formFolder);
        fd.append("altFr", formAltFr.trim() || item.name);
        const fallbackRes = await uploadMediaAction(fd);
        if (!fallbackRes.success) {
          throw new Error(fallbackRes.error || "Échec du téléversement.");
        }
        updateQueueItem(item.localId, {
          status: fallbackRes.duplicate ? "duplicate" : "done",
          progress: 100,
        });
        return true;
      }

      if (!presignRes.ok) {
        throw new Error(presignJson.error || "Autorisation de téléversement refusée.");
      }

      if (presignJson.duplicate && !replaceTarget) {
        updateQueueItem(item.localId, { status: "duplicate", progress: 100 });
        return true;
      }

      // Direct browser -> R2 PUT upload with real progress tracking
      await uploadViaXhr(
        presignJson.uploadUrl,
        item.file,
        presignJson.requiredHeaders || { "Content-Type": item.file.type },
        (pct) => updateQueueItem(item.localId, { progress: pct })
      );

      updateQueueItem(item.localId, { status: "verifying", progress: 100 });

      const completeRes = await fetch("/api/media/complete", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          objectKey: presignJson.objectKey,
          originalFilename: item.file.name,
          mimeType: presignJson.normalizedMime || item.file.type,
          sizeBytes: item.file.size,
          folder: formFolder,
          altTextFr: formAltFr.trim() || item.name,
          altTextAr: formAltAr.trim() || "",
          width: item.width,
          height: item.height,
          checksumSha256,
          replaceMediaId: replaceTarget?.id,
        }),
      });

      const completeJson = await completeRes.json();
      if (!completeRes.ok || !completeJson.success) {
        throw new Error(completeJson.error || "Échec de la vérification post-upload.");
      }

      updateQueueItem(item.localId, { status: "done", progress: 100 });
      return true;
    } catch (err: any) {
      updateQueueItem(item.localId, {
        status: "error",
        error: err?.message || "Erreur lors du téléversement.",
      });
      return false;
    }
  };

  const processUploadQueue = async (itemsToProcess: UploadQueueItem[]) => {
    if (uploadLockRef.current || itemsToProcess.length === 0) return;
    uploadLockRef.current = true;
    setIsUploading(true);
    setErrorMsg(null);

    try {
      // Concurrency pool of 2 to avoid browser memory/network saturation on large batches
      const queue = [...itemsToProcess];
      let successCount = 0;

      const worker = async () => {
        while (queue.length > 0) {
          const next = queue.shift();
          if (!next) break;
          const ok = await uploadSingleQueueItem(next);
          if (ok) successCount += 1;
        }
      };

      await Promise.all([worker(), worker()]);

      await fetchMedia();
      if (successCount > 0) {
        showToast(
          replaceTarget
            ? "Image remplacée et vérifiée avec succès !"
            : `${successCount} fichier(s) téléversé(s) et vérifié(s) !`
        );
      }
    } finally {
      uploadLockRef.current = false;
      setIsUploading(false);
    }
  };

  const handleSubmitUploads = async (e: React.FormEvent) => {
    e.preventDefault();
    const pending = uploadQueue.filter(
      (item) => item.status === "queued" || item.status === "error"
    );
    if (pending.length === 0) {
      setErrorMsg("Veuillez sélectionner au moins une image valide.");
      return;
    }
    await processUploadQueue(pending);
  };

  const copyUrl = (url: string, id: string) => {
    navigator.clipboard.writeText(url);
    setCopiedId(id);
    setTimeout(() => setCopiedId(null), 2000);
  };

  const handleSaveAltEdit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!editingItem) return;
    setIsSavingEdit(true);
    try {
      const res = await fetch(`/api/media/${editingItem.id}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          altTextFr: editAltFr,
          altTextAr: editAltAr,
          altTextEn: editAltEn,
          folder: editFolder,
          category: editFolder,
        }),
      });
      const json = await res.json();
      if (!res.ok) throw new Error(json.error || "Erreur de mise à jour.");
      setEditingItem(null);
      await fetchMedia();
      showToast("Métadonnées mises à jour.");
    } catch (err: any) {
      showToast(err?.message || "Échec de la mise à jour.");
    } finally {
      setIsSavingEdit(false);
    }
  };

  const confirmDelete = async () => {
    if (!deleteTarget) return;
    setIsDeleting(true);
    try {
      const res = await fetch(`/api/media/${deleteTarget.id}`, {
        method: "DELETE",
      });
      const json = await res.json();
      if (!res.ok) throw new Error(json.error || "Erreur de suppression.");
      setDeleteTarget(null);
      await fetchMedia();
      showToast("Média retiré de la médiathèque (archives préservées).");
    } catch (err: any) {
      showToast(err?.message || "Erreur lors de la suppression.");
    } finally {
      setIsDeleting(false);
    }
  };

  return (
    <div className="space-y-6 max-w-7xl mx-auto pb-16">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 bg-white p-6 rounded-2xl border border-slate-200 shadow-xs">
        <div>
          <h1 className="text-2xl font-extrabold text-slate-900 tracking-tight flex items-center gap-2.5">
            <ImageIcon className="h-6 w-6 text-[#0B69FF]" />
            <span>Médiathèque & Fichiers (Media Assets)</span>
          </h1>
          <p className="text-sm text-slate-500 mt-1">
            Stockage Cloudflare R2, optimisation CDN et gestion centralisée des médias ({totalCount} actif{totalCount > 1 ? "s" : ""})
          </p>
        </div>

        <Button
          variant="default"
          size="sm"
          className="gap-1.5 font-semibold text-xs"
          onClick={() => {
            setReplaceTarget(null);
            setErrorMsg(null);
            setIsModalOpen(true);
          }}
        >
          <Upload className="h-4 w-4" />
          <span>Téléverser des Fichiers</span>
        </Button>
      </div>

      {/* Filters, Search & Sorting */}
      <div className="bg-white p-4 rounded-xl border border-slate-200 space-y-3">
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-3">
          <div className="relative flex-1 max-w-md">
            <Search className="h-4 w-4 text-slate-400 absolute start-3 top-1/2 -translate-y-1/2" />
            <Input
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              placeholder="Rechercher par nom ou texte alternatif..."
              className="ps-9 h-9 text-xs"
            />
          </div>

          <div className="flex items-center gap-2">
            <select
              value={`${sortBy}:${sortDir}`}
              onChange={(e) => {
                const [col, dir] = e.target.value.split(":") as [
                  "created_at" | "file_name" | "size_bytes",
                  "asc" | "desc",
                ];
                setSortBy(col);
                setSortDir(dir);
                setPage(1);
              }}
              className="h-9 px-3 rounded-lg border border-slate-200 text-xs bg-white text-slate-700"
            >
              <option value="created_at:desc">Plus récents d'abord</option>
              <option value="created_at:asc">Plus anciens d'abord</option>
              <option value="file_name:asc">Nom (A → Z)</option>
              <option value="size_bytes:desc">Taille (décroissante)</option>
            </select>

            <Button
              type="button"
              variant="outline"
              size="sm"
              onClick={fetchMedia}
              className="h-9 px-2.5"
              title="Actualiser"
            >
              <RefreshCw className={`h-3.5 w-3.5 ${isLoading ? "animate-spin" : ""}`} />
            </Button>
          </div>
        </div>

        <div className="flex flex-wrap items-center gap-2 pt-1 border-t border-slate-100">
          <Folder className="h-4 w-4 text-slate-400 ms-1" />
          <span className="text-xs font-semibold text-slate-600 me-1">Catégories :</span>
          {folders.map((f) => (
            <button
              key={f.id}
              onClick={() => {
                setSelectedFolder(f.id);
                setPage(1);
              }}
              className={`px-3 py-1 rounded-lg text-xs font-medium transition-colors ${
                selectedFolder === f.id
                  ? "bg-[#0B69FF] text-white font-semibold"
                  : "bg-slate-100 text-slate-600 hover:bg-slate-200"
              }`}
            >
              {f.label}
            </button>
          ))}
        </div>
      </div>

      {loadError && (
        <div className="p-4 rounded-xl bg-red-50 border border-red-200 text-red-700 text-xs flex items-center gap-2">
          <AlertCircle className="h-4 w-4 shrink-0" />
          <span>{loadError}</span>
        </div>
      )}

      {/* Media Grid */}
      {isLoading ? (
        <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-6">
          {Array.from({ length: 8 }).map((_, idx) => (
            <div
              key={idx}
              className="rounded-2xl border border-slate-200 bg-white overflow-hidden animate-pulse"
            >
              <div className="aspect-[4/3] bg-slate-200" />
              <div className="p-4 space-y-2">
                <div className="h-3 bg-slate-200 rounded w-3/4" />
                <div className="h-3 bg-slate-100 rounded w-1/2" />
              </div>
            </div>
          ))}
        </div>
      ) : (
        <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-6">
          {mediaList.map((item) => {
            const displayUrl = item.resolvedUrl || resolveMediaSrc(item);
            const folderLabel = item.category || item.folder || "general";
            const sizeLabel = formatBytes(item.size_bytes ?? item.file_size);
            const dateLabel = (item.created_at || "").slice(0, 10);

            return (
              <div
                key={item.id}
                className="rounded-2xl border border-slate-200 bg-white overflow-hidden shadow-xs hover:shadow-md transition-all flex flex-col group"
              >
                <div className="relative aspect-[4/3] bg-slate-100">
                  <OptimizedImage
                    src={displayUrl}
                    alt={item.alt_text_fr || item.file_name}
                    variant="thumbnail"
                    fill
                    sizes="(max-width: 768px) 100vw, 25vw"
                    className="object-cover"
                  />
                  <div className="absolute top-2 start-2 flex items-center gap-1.5">
                    <span className="inline-block px-2 py-0.5 rounded bg-slate-900/80 text-white text-[10px] font-semibold backdrop-blur-md capitalize">
                      {folderLabel}
                    </span>
                    <span
                      className={`inline-block px-1.5 py-0.5 rounded text-[9px] font-bold uppercase ${
                        item.storage_provider === "r2"
                          ? "bg-emerald-600/90 text-white"
                          : "bg-amber-500/90 text-slate-950"
                      }`}
                    >
                      {item.storage_provider || "legacy"}
                    </span>
                  </div>
                </div>

                <div className="p-4 flex-1 flex flex-col justify-between space-y-3">
                  <div>
                    <div
                      className="font-bold text-slate-900 text-xs truncate"
                      title={item.original_filename || item.file_name}
                    >
                      {item.original_filename || item.file_name}
                    </div>
                    <div className="flex items-center justify-between text-[11px] text-slate-400 mt-1">
                      <span>
                        {sizeLabel}
                        {item.width && item.height ? ` • ${item.width}×${item.height}` : ""}
                      </span>
                      <span>{dateLabel}</span>
                    </div>
                  </div>

                  <div className="text-[11px] text-slate-600 line-clamp-1 italic bg-slate-50 p-1.5 rounded">
                    ALT: {item.alt_text_fr || "-"}
                  </div>

                  <div className="pt-2 border-t border-slate-100 flex items-center justify-between gap-2">
                    <button
                      onClick={() => copyUrl(displayUrl, item.id)}
                      className="inline-flex items-center gap-1 text-[11px] text-[#0B69FF] hover:underline font-medium"
                    >
                      {copiedId === item.id ? (
                        <>
                          <Check className="h-3.5 w-3.5 text-emerald-600" />
                          <span className="text-emerald-600">Copié !</span>
                        </>
                      ) : (
                        <>
                          <Copy className="h-3.5 w-3.5" />
                          <span>Copier URL</span>
                        </>
                      )}
                    </button>

                    <div className="flex items-center gap-1">
                      <button
                        onClick={() => {
                          setEditingItem(item);
                          setEditAltFr(item.alt_text_fr || "");
                          setEditAltAr(item.alt_text_ar || "");
                          setEditAltEn(item.alt_text_en || "");
                          setEditFolder((item.category || item.folder || "chantiers").toLowerCase());
                        }}
                        className="text-slate-400 hover:text-[#0B69FF] p-1 transition-colors"
                        title="Modifier le texte alternatif"
                      >
                        <Pencil className="h-3.5 w-3.5" />
                      </button>
                      <button
                        onClick={() => {
                          setReplaceTarget(item);
                          setFormFolder((item.category || item.folder || "chantiers").toLowerCase());
                          setFormAltFr(item.alt_text_fr || "");
                          setFormAltAr(item.alt_text_ar || "");
                          setErrorMsg(null);
                          setIsModalOpen(true);
                        }}
                        className="text-slate-400 hover:text-amber-600 p-1 transition-colors"
                        title="Remplacer l'image"
                      >
                        <RotateCcw className="h-3.5 w-3.5" />
                      </button>
                      <button
                        onClick={() => setDeleteTarget(item)}
                        className="text-slate-400 hover:text-red-600 p-1 transition-colors"
                        title="Supprimer"
                      >
                        <Trash2 className="h-3.5 w-3.5" />
                      </button>
                    </div>
                  </div>
                </div>
              </div>
            );
          })}

          {mediaList.length === 0 && !loadError && (
            <div className="col-span-full py-16 text-center text-slate-400 text-sm bg-white rounded-2xl border border-slate-200">
              Aucun fichier média enregistré pour ces critères.
            </div>
          )}
        </div>
      )}

      {/* Pagination */}
      {totalPages > 1 && (
        <div className="flex items-center justify-between bg-white px-4 py-3 rounded-xl border border-slate-200 text-xs text-slate-600">
          <span>
            Page {page} sur {totalPages} ({totalCount} fichiers)
          </span>
          <div className="flex items-center gap-2">
            <Button
              type="button"
              variant="outline"
              size="sm"
              disabled={page <= 1}
              onClick={() => setPage((p) => Math.max(1, p - 1))}
              className="h-8 gap-1 text-xs"
            >
              <ChevronLeft className="h-3.5 w-3.5" />
              <span>Précédent</span>
            </Button>
            <Button
              type="button"
              variant="outline"
              size="sm"
              disabled={page >= totalPages}
              onClick={() => setPage((p) => Math.min(totalPages, p + 1))}
              className="h-8 gap-1 text-xs"
            >
              <span>Suivant</span>
              <ChevronRight className="h-3.5 w-3.5" />
            </Button>
          </div>
        </div>
      )}

      {/* Multi-file Upload / Replace Modal */}
      {isModalOpen && (
        <div className="fixed inset-0 z-50 bg-slate-950/60 backdrop-blur-xs flex items-center justify-center p-4">
          <div className="bg-white rounded-2xl max-w-xl w-full max-h-[90vh] overflow-y-auto p-6 shadow-2xl border border-slate-200 space-y-5">
            <div className="flex items-center justify-between border-b border-slate-100 pb-4">
              <h3 className="text-lg font-bold text-slate-900 flex items-center gap-2">
                <Upload className="h-5 w-5 text-[#0B69FF]" />
                <span>
                  {replaceTarget
                    ? `Remplacer : ${replaceTarget.original_filename || replaceTarget.file_name}`
                    : "Téléverser des Fichiers Médias"}
                </span>
              </h3>
              <button
                onClick={() => {
                  if (!isUploading) clearUploadModal();
                }}
                className="p-1 rounded-md text-slate-400 hover:text-slate-600 hover:bg-slate-100"
              >
                <X className="h-5 w-5" />
              </button>
            </div>

            {errorMsg && (
              <div className="p-3 rounded-xl bg-red-50 border border-red-200 text-red-700 text-xs flex items-center gap-2">
                <AlertCircle className="h-4 w-4 shrink-0 text-red-600" />
                <span>{errorMsg}</span>
              </div>
            )}

            <form onSubmit={handleSubmitUploads} className="space-y-4">
              <div>
                <input
                  type="file"
                  ref={fileInputRef}
                  multiple={!replaceTarget}
                  accept="image/png,image/jpeg,image/webp,image/avif,image/svg+xml"
                  onChange={(e) => {
                    if (e.target.files) enqueueFiles(e.target.files);
                    e.target.value = "";
                  }}
                  className="hidden"
                />

                <div
                  onDragOver={(e) => {
                    e.preventDefault();
                    setIsDragging(true);
                  }}
                  onDragLeave={(e) => {
                    e.preventDefault();
                    setIsDragging(false);
                  }}
                  onDrop={(e) => {
                    e.preventDefault();
                    setIsDragging(false);
                    if (e.dataTransfer.files) enqueueFiles(e.dataTransfer.files);
                  }}
                  onClick={() => fileInputRef.current?.click()}
                  className={`border-2 border-dashed rounded-xl p-5 text-center cursor-pointer transition-colors ${
                    isDragging
                      ? "border-[#0B69FF] bg-blue-50/50"
                      : "border-slate-300 hover:border-[#0B69FF] bg-slate-50/50 hover:bg-slate-50"
                  }`}
                >
                  <Upload
                    className={`h-8 w-8 mx-auto mb-2 ${
                      isDragging ? "text-[#0B69FF]" : "text-slate-400"
                    }`}
                  />
                  <p className="text-xs font-semibold text-slate-700">
                    Glissez {replaceTarget ? "une image" : "plusieurs images"} ici ou{" "}
                    <span className="text-[#0B69FF] underline">parcourez vos fichiers</span>
                  </p>
                  <p className="text-[11px] text-slate-400 mt-1">
                    PNG, JPG, WebP, AVIF ou SVG (Max. 5 Mo par fichier)
                  </p>
                </div>
              </div>

              {/* Upload Queue with progress, status & retry */}
              {uploadQueue.length > 0 && (
                <div className="space-y-2 max-h-56 overflow-y-auto pr-1">
                  {uploadQueue.map((item) => (
                    <div
                      key={item.localId}
                      className="p-2.5 rounded-xl border border-slate-200 bg-slate-50 flex items-center gap-3"
                    >
                      <div className="relative h-12 w-16 rounded-lg bg-white overflow-hidden border border-slate-200 shrink-0">
                        <OptimizedImage
                          src={item.previewUrl}
                          alt={item.name}
                          variant="original"
                          fill
                          unoptimized
                          className="object-cover"
                        />
                      </div>

                      <div className="flex-1 min-w-0 space-y-1">
                        <div className="flex items-center justify-between gap-2">
                          <span className="text-xs font-bold text-slate-900 truncate">
                            {item.name}
                          </span>
                          <span className="text-[10px] font-mono text-slate-500 shrink-0">
                            {formatBytes(item.sizeBytes)}
                          </span>
                        </div>

                        {(item.status === "uploading" || item.status === "verifying") && (
                          <div className="w-full h-1.5 bg-slate-200 rounded-full overflow-hidden">
                            <div
                              className="h-full bg-[#0B69FF] transition-all duration-200"
                              style={{ width: `${item.progress}%` }}
                            />
                          </div>
                        )}

                        <div className="flex items-center justify-between text-[11px]">
                          {item.status === "queued" && (
                            <span className="text-slate-500">En attente d'envoi</span>
                          )}
                          {item.status === "uploading" && (
                            <span className="text-[#0B69FF] flex items-center gap-1">
                              <Loader2 className="h-3 w-3 animate-spin" />
                              Téléversement R2 ({item.progress}%)
                            </span>
                          )}
                          {item.status === "verifying" && (
                            <span className="text-[#0B69FF] flex items-center gap-1">
                              <Loader2 className="h-3 w-3 animate-spin" />
                              Vérification binaire...
                            </span>
                          )}
                          {item.status === "done" && (
                            <span className="text-emerald-700 font-semibold flex items-center gap-1">
                              <CheckCircle2 className="h-3 w-3" />
                              Vérifié & enregistré
                            </span>
                          )}
                          {item.status === "duplicate" && (
                            <span className="text-amber-700 font-semibold">
                              Doublon SHA-256 réutilisé
                            </span>
                          )}
                          {item.status === "error" && (
                            <span className="text-red-600 truncate" title={item.error}>
                              {item.error}
                            </span>
                          )}
                        </div>
                      </div>

                      <div className="flex items-center gap-1 shrink-0">
                        {item.status === "error" && (
                          <Button
                            type="button"
                            variant="outline"
                            size="sm"
                            disabled={isUploading}
                            onClick={() => processUploadQueue([item])}
                            className="h-7 px-2 text-[10px]"
                          >
                            Réessayer
                          </Button>
                        )}
                        {item.status !== "uploading" && item.status !== "verifying" && (
                          <button
                            type="button"
                            onClick={() => removeQueueItem(item.localId)}
                            className="p-1 text-slate-400 hover:text-red-600"
                            title="Retirer"
                          >
                            <X className="h-4 w-4" />
                          </button>
                        )}
                      </div>
                    </div>
                  ))}
                </div>
              )}

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                <div>
                  <label className="block text-xs font-semibold text-slate-700 mb-1">
                    Catégorie / Dossier
                  </label>
                  <select
                    value={formFolder}
                    onChange={(e) => setFormFolder(e.target.value)}
                    className="w-full h-10 px-3 rounded-lg border border-slate-200 text-sm bg-white"
                  >
                    {folders
                      .filter((f) => f.id !== "all")
                      .map((f) => (
                        <option key={f.id} value={f.id}>
                          {f.label}
                        </option>
                      ))}
                  </select>
                </div>

                <div>
                  <label className="block text-xs font-semibold text-slate-700 mb-1">
                    Texte alternatif FR (SEO)
                  </label>
                  <Input
                    value={formAltFr}
                    onChange={(e) => setFormAltFr(e.target.value)}
                    placeholder="Description de l'image"
                    className="h-10 text-sm"
                  />
                </div>
              </div>

              <div className="pt-4 border-t border-slate-100 flex items-center justify-end gap-3">
                <Button
                  type="button"
                  variant="outline"
                  disabled={isUploading}
                  onClick={clearUploadModal}
                  className="text-xs font-medium"
                >
                  Fermer
                </Button>
                <Button
                  type="submit"
                  variant="default"
                  disabled={
                    isUploading ||
                    uploadQueue.every((i) => i.status === "done" || i.status === "duplicate")
                  }
                  className="text-xs font-bold bg-[#0B69FF] hover:bg-[#094FC9]"
                >
                  {isUploading
                    ? "Téléversement en cours..."
                    : replaceTarget
                    ? "Remplacer l'image"
                    : "Téléverser la sélection"}
                </Button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Alt-Text Edit Modal */}
      {editingItem && (
        <div className="fixed inset-0 z-50 bg-slate-950/60 backdrop-blur-xs flex items-center justify-center p-4">
          <div className="bg-white rounded-2xl max-w-md w-full p-6 shadow-2xl border border-slate-200 space-y-4">
            <div className="flex items-center justify-between border-b border-slate-100 pb-3">
              <h3 className="text-base font-bold text-slate-900">
                Modifier les métadonnées SEO
              </h3>
              <button
                onClick={() => setEditingItem(null)}
                className="p-1 text-slate-400 hover:text-slate-600"
              >
                <X className="h-5 w-5" />
              </button>
            </div>
            <form onSubmit={handleSaveAltEdit} className="space-y-3">
              <div>
                <label className="block text-xs font-semibold text-slate-700 mb-1">
                  Catégorie
                </label>
                <select
                  value={editFolder}
                  onChange={(e) => setEditFolder(e.target.value)}
                  className="w-full h-9 px-3 rounded-lg border border-slate-200 text-xs bg-white"
                >
                  {folders
                    .filter((f) => f.id !== "all")
                    .map((f) => (
                      <option key={f.id} value={f.id}>
                        {f.label}
                      </option>
                    ))}
                </select>
              </div>
              <div>
                <label className="block text-xs font-semibold text-slate-700 mb-1">
                  Texte alternatif (FR)
                </label>
                <Input
                  value={editAltFr}
                  onChange={(e) => setEditAltFr(e.target.value)}
                  className="h-9 text-xs"
                />
              </div>
              <div>
                <label className="block text-xs font-semibold text-slate-700 mb-1 text-end">
                  النص البديل (AR)
                </label>
                <Input
                  dir="rtl"
                  value={editAltAr}
                  onChange={(e) => setEditAltAr(e.target.value)}
                  className="h-9 text-xs text-end"
                />
              </div>
              <div>
                <label className="block text-xs font-semibold text-slate-700 mb-1">
                  Alt Text (EN)
                </label>
                <Input
                  value={editAltEn}
                  onChange={(e) => setEditAltEn(e.target.value)}
                  className="h-9 text-xs"
                />
              </div>
              <div className="pt-3 border-t border-slate-100 flex justify-end gap-2">
                <Button
                  type="button"
                  variant="outline"
                  size="sm"
                  onClick={() => setEditingItem(null)}
                  className="text-xs"
                >
                  Annuler
                </Button>
                <Button
                  type="submit"
                  variant="default"
                  size="sm"
                  disabled={isSavingEdit}
                  className="text-xs font-bold bg-[#0B69FF]"
                >
                  {isSavingEdit ? "Enregistrement..." : "Enregistrer"}
                </Button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Safe Delete Confirmation Modal */}
      {deleteTarget && (
        <div className="fixed inset-0 z-50 bg-slate-950/60 backdrop-blur-xs flex items-center justify-center p-4">
          <div className="bg-white rounded-2xl max-w-md w-full p-6 shadow-2xl border border-slate-200 space-y-4">
            <h3 className="text-base font-bold text-slate-900">
              Confirmer la suppression
            </h3>
            <p className="text-xs text-slate-600 leading-relaxed">
              Voulez-vous retirer{" "}
              <span className="font-bold text-slate-900">
                {deleteTarget.original_filename || deleteTarget.file_name}
              </span>{" "}
              de la médiathèque ? Les copies d'archive existantes ne seront pas supprimées de manière destructive.
            </p>
            <div className="flex justify-end gap-2 pt-2">
              <Button
                type="button"
                variant="outline"
                size="sm"
                disabled={isDeleting}
                onClick={() => setDeleteTarget(null)}
                className="text-xs"
              >
                Annuler
              </Button>
              <Button
                type="button"
                variant="default"
                size="sm"
                disabled={isDeleting}
                onClick={confirmDelete}
                className="text-xs font-bold bg-red-600 hover:bg-red-700 text-white"
              >
                {isDeleting ? "Suppression..." : "Supprimer"}
              </Button>
            </div>
          </div>
        </div>
      )}

      {toastMessage && (
        <div className="fixed bottom-5 end-5 z-50 bg-[#0B69FF] text-white px-5 py-3 rounded-xl shadow-xl flex items-center gap-2 text-sm font-semibold animate-in fade-in slide-in-from-bottom-2">
          <span>{toastMessage}</span>
        </div>
      )}
    </div>
  );
}
