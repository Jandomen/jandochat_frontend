import React, { useState, useEffect, useCallback } from "react";
import {
  Lock,
  Plus,
  Pin,
  Trash2,
  Edit3,
  Save,
  X,
  Search,
  FileText,
  Key,
  File,
  Tag,
  AlertTriangle,
  Eye,
  EyeOff,
  Copy,
  MoreVertical,
  ArrowLeft,
} from "lucide-react";
import { useLanguage } from "../../context/LanguageContext";
import { getNotes, createNote, updateNote, deleteNote, togglePin } from "../../api/safeNotes";
import { toast } from "react-toastify";

const TIPO_ICON = { nota: FileText, credencial: Key, documento: File };
const TIPO_COLOR = { nota: "from-blue-500 to-blue-600", credencial: "from-amber-500 to-amber-600", documento: "from-purple-500 to-purple-600" };
const TIPO_BG = { nota: "bg-blue-50 border-blue-100", credencial: "bg-amber-50 border-amber-100", documento: "bg-purple-50 border-purple-100" };

function NoteCard({ note, onEdit, onDelete, onTogglePin, onView, t }) {
  const [showSecret, setShowSecret] = useState(false);
  const [menuOpen, setMenuOpen] = useState(false);
  const TipoIcon = TIPO_ICON[note.tipo] || FileText;
  const isCredencial = note.tipo === "credencial";

  return (
    <div
      className={`relative p-3 rounded-xl border transition-all active:scale-[0.98] cursor-pointer ${TIPO_BG[note.tipo] || "bg-gray-50 border-gray-100"}`}
      onClick={() => onView(note)}
    >
      <div className="flex items-start gap-2.5">
        <div className={`p-1.5 rounded-lg bg-gradient-to-br ${TIPO_COLOR[note.tipo] || "from-gray-500 to-gray-600"} shadow-sm flex-shrink-0 mt-0.5`}>
          <TipoIcon className="w-3.5 h-3.5 text-white" />
        </div>
        <div className="flex-1 min-w-0">
          <div className="flex items-start justify-between gap-2">
            <div className="min-w-0 flex-1">
              <h3 className="text-[13px] font-black text-gray-900 leading-tight truncate">{note.titulo}</h3>
              <span className="text-[8px] font-bold text-gray-400 uppercase tracking-wider">{t(`tipo_${note.tipo}`) || note.tipo}</span>
            </div>
            <div className="relative flex-shrink-0" onClick={(e) => e.stopPropagation()}>
              <button
                onClick={() => setMenuOpen(!menuOpen)}
                className="p-1 rounded-lg hover:bg-black/5 active:bg-black/10 transition-colors"
              >
                <MoreVertical className="w-4 h-4 text-gray-400" />
              </button>
              {menuOpen && (
                <>
                  <div className="fixed inset-0 z-10" onClick={() => setMenuOpen(false)} />
                  <div className="absolute right-0 top-8 z-20 bg-white rounded-xl shadow-xl border border-gray-100 py-1 w-36 overflow-hidden">
                    <button onClick={() => { setMenuOpen(false); onTogglePin(note._id); }} className="w-full px-3 py-2.5 text-[11px] font-bold text-gray-700 hover:bg-gray-50 flex items-center gap-2">
                      <Pin className={`w-3.5 h-3.5 ${note.pinned ? "fill-red-500 text-red-500" : ""}`} />
                      {note.pinned ? "Desfijar" : "Fijar"}
                    </button>
                    <button onClick={() => { setMenuOpen(false); onEdit(note); }} className="w-full px-3 py-2.5 text-[11px] font-bold text-gray-700 hover:bg-gray-50 flex items-center gap-2">
                      <Edit3 className="w-3.5 h-3.5" /> Editar
                    </button>
                    <button onClick={() => { setMenuOpen(false); onDelete(note._id); }} className="w-full px-3 py-2.5 text-[11px] font-bold text-red-600 hover:bg-red-50 flex items-center gap-2">
                      <Trash2 className="w-3.5 h-3.5" /> Eliminar
                    </button>
                  </div>
                </>
              )}
            </div>
          </div>

          {isCredencial && note.campos?.sitio && (
            <div className="mt-1.5 p-2 bg-white/70 rounded-lg border border-amber-200/60 space-y-0.5">
              <div className="flex items-center gap-1.5 text-[9px] text-gray-500">
                <span className="font-black uppercase text-[7px]">URL:</span>
                <span className="truncate">{note.campos.sitio}</span>
              </div>
              {note.campos.identificador && (
                <div className="flex items-center gap-1.5 text-[9px] text-gray-500">
                  <span className="font-black uppercase text-[7px]">User:</span>
                  <span className="truncate">{note.campos.identificador}</span>
                </div>
              )}
              {note.campos.secreto && (
                <div className="flex items-center gap-1.5 text-[9px] text-gray-500">
                  <span className="font-black uppercase text-[7px]">Pass:</span>
                  <div className="flex items-center gap-1 flex-1 min-w-0">
                    <span className="font-mono truncate">{showSecret ? note.campos.secreto : "••••••••"}</span>
                    <button onClick={() => setShowSecret(!showSecret)} className="text-gray-400 hover:text-gray-600 flex-shrink-0">
                      {showSecret ? <EyeOff className="w-2.5 h-2.5" /> : <Eye className="w-2.5 h-2.5" />}
                    </button>
                  </div>
                </div>
              )}
            </div>
          )}

          {note.contenido && (
            <p className="text-[11px] text-gray-500 mt-1 line-clamp-2 leading-relaxed">{note.contenido}</p>
          )}

          {note.tags?.length > 0 && (
            <div className="flex flex-wrap gap-1 mt-1.5">
              {note.tags.map((tag) => (
                <span key={tag} className="px-1.5 py-0.5 bg-white/70 rounded-md text-[6px] font-bold text-gray-400 uppercase tracking-wider border border-gray-200/60">
                  {tag}
                </span>
              ))}
            </div>
          )}
        </div>
      </div>

      {note.pinned && (
        <div className="absolute top-3 left-3">
          <Pin className="w-3 h-3 text-red-500 fill-red-500" />
        </div>
      )}
    </div>
  );
}

function PasswordField({ value }) {
  const [visible, setVisible] = useState(false);
  return (
    <div>
      <span className="text-[9px] font-black text-amber-700 uppercase tracking-wider">Contraseña</span>
      <div className="flex items-center gap-2 mt-1 p-3 bg-white rounded-xl border border-amber-200">
        <Key className="w-4 h-4 text-amber-500 flex-shrink-0" />
        <span className="font-mono text-sm flex-1 break-all">{visible ? value : "•".repeat(value.length)}</span>
        <button onClick={() => setVisible(!visible)} className="p-1.5 hover:bg-amber-100 rounded-lg transition-colors flex-shrink-0">
          {visible ? <EyeOff className="w-4 h-4 text-amber-600" /> : <Eye className="w-4 h-4 text-amber-600" />}
        </button>
        <button onClick={() => { navigator.clipboard.writeText(value); toast.success("Contraseña copiada"); }}
          className="p-1.5 hover:bg-amber-100 rounded-lg transition-colors flex-shrink-0"
        >
          <Copy className="w-4 h-4 text-amber-600" />
        </button>
      </div>
    </div>
  );
}

export default function CajaFuerte() {
  const { t } = useLanguage();
  const [notes, setNotes] = useState([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState("");
  const [showForm, setShowForm] = useState(false);
  const [editingId, setEditingId] = useState(null);
  const [deleteId, setDeleteId] = useState(null);
  const [viewingNote, setViewingNote] = useState(null);
  const [form, setForm] = useState({
    titulo: "", contenido: "", tipo: "nota",
    campos: { sitio: "", identificador: "", secreto: "" },
    tags: "",
  });

  const loadNotes = useCallback(async () => {
    try {
      const { data } = await getNotes();
      setNotes(data);
    } catch {
      toast.error("Error al cargar la caja fuerte");
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => { loadNotes(); }, [loadNotes]);

  const resetForm = () => {
    setForm({ titulo: "", contenido: "", tipo: "nota", campos: { sitio: "", identificador: "", secreto: "" }, tags: "" });
    setEditingId(null);
    setShowForm(false);
  };

  const openEdit = (note) => {
    setForm({
      titulo: note.titulo,
      contenido: note.contenido || "",
      tipo: note.tipo,
      campos: note.campos || { sitio: "", identificador: "", secreto: "" },
      tags: (note.tags || []).join(", "),
    });
    setEditingId(note._id);
    setShowForm(true);
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!form.titulo.trim()) return toast.error("El título es obligatorio");
    const payload = { ...form, tags: form.tags.split(",").map((s) => s.trim()).filter(Boolean) };
    try {
      if (editingId) {
        await updateNote(editingId, payload);
        toast.success("Nota actualizada");
      } else {
        await createNote(payload);
        toast.success("Nota guardada en la caja fuerte");
      }
      resetForm();
      loadNotes();
    } catch {
      toast.error("Error al guardar la nota");
    }
  };

  const handleDelete = async () => {
    if (!deleteId) return;
    try {
      await deleteNote(deleteId);
      toast.success("Nota eliminada");
      setDeleteId(null);
      loadNotes();
    } catch {
      toast.error("Error al eliminar");
    }
  };

  const handleTogglePin = async (id) => {
    try {
      await togglePin(id);
      loadNotes();
    } catch {
      toast.error("Error al cambiar pin");
    }
  };

  const headerBg = viewingNote ? (
    viewingNote.tipo === "credencial" ? { background: "#fffbeb", borderColor: "#fde68a" } :
    viewingNote.tipo === "documento" ? { background: "#faf5ff", borderColor: "#e9d5ff" } :
    { background: "#eff6ff", borderColor: "#bfdbfe" }
  ) : {};

  const ViewNoteHeader = () => (
    <div className={`flex items-center justify-between px-4 py-3 border-b ${
      viewingNote?.tipo === "credencial" ? "bg-amber-50 border-amber-200" :
      viewingNote?.tipo === "documento" ? "bg-purple-50 border-purple-200" :
      "bg-blue-50 border-blue-200"
    }`}>
      <button onClick={() => setViewingNote(null)} className="p-1 -ml-1 active:scale-90 transition-transform">
        <ArrowLeft className="w-5 h-5 text-gray-600" />
      </button>
      <div className="flex items-center gap-1.5">
        {viewingNote && (
          <>
            <span className={`p-1 rounded-lg bg-gradient-to-br ${TIPO_COLOR[viewingNote.tipo] || "from-gray-500 to-gray-600"}`}>
              {React.createElement(TIPO_ICON[viewingNote.tipo] || FileText, { className: "w-3.5 h-3.5 text-white" })}
            </span>
            <span className="text-[9px] font-bold text-gray-500 uppercase tracking-wider">
              {t(`tipo_${viewingNote.tipo}`) || viewingNote.tipo}
            </span>
          </>
        )}
      </div>
      <div className="flex gap-1">
        <button onClick={() => { setViewingNote(null); openEdit(viewingNote); }}
          className="p-1.5 active:scale-90 transition-transform">
          <Edit3 className="w-4 h-4 text-gray-500" />
        </button>
        <button onClick={() => { const id = viewingNote._id; setViewingNote(null); setDeleteId(id); }}
          className="p-1.5 active:scale-90 transition-transform">
          <Trash2 className="w-4 h-4 text-red-500" />
        </button>
      </div>
    </div>
  );

  const ViewNoteContent = () => viewingNote ? (
    <>
      <div className="flex items-start gap-3">
        <div className={`p-2.5 rounded-xl bg-gradient-to-br ${TIPO_COLOR[viewingNote.tipo] || "from-gray-500 to-gray-600"} shadow`}>
          {React.createElement(TIPO_ICON[viewingNote.tipo] || FileText, { className: "w-5 h-5 text-white" })}
        </div>
        <div className="flex-1 min-w-0">
          <h2 className="text-lg font-black text-gray-900 break-words">{viewingNote.titulo}</h2>
          {viewingNote.pinned && <span className="text-[9px] text-red-500 font-bold">• {t("pinned") || "Fijado"}</span>}
        </div>
      </div>

      {viewingNote.tipo === "credencial" && viewingNote.campos?.sitio && (
        <div className="space-y-3 p-4 bg-amber-50 rounded-xl border border-amber-200">
          <div>
            <span className="text-[9px] font-black text-amber-700 uppercase tracking-wider">Sitio / Servicio</span>
            <p className="text-sm font-medium text-gray-900 mt-0.5 break-all">{viewingNote.campos.sitio}</p>
          </div>
          {viewingNote.campos.identificador && (
            <div>
              <span className="text-[9px] font-black text-amber-700 uppercase tracking-wider">Usuario / Email</span>
              <p className="text-sm font-medium text-gray-900 mt-0.5">{viewingNote.campos.identificador}</p>
            </div>
          )}
          {viewingNote.campos.secreto && <PasswordField value={viewingNote.campos.secreto} />}
        </div>
      )}

      {viewingNote.contenido && (
        <div>
          <h4 className="text-[9px] font-black text-gray-400 uppercase tracking-wider mb-2">{t("content") || "Contenido"}</h4>
          <div className="text-sm text-gray-700 whitespace-pre-wrap leading-relaxed">{viewingNote.contenido}</div>
        </div>
      )}

      {viewingNote.tags?.length > 0 && (
        <div>
          <h4 className="text-[9px] font-black text-gray-400 uppercase tracking-wider mb-2">{t("tags") || "Etiquetas"}</h4>
          <div className="flex flex-wrap gap-1.5">
            {viewingNote.tags.map((tag) => (
              <span key={tag} className="px-2.5 py-1 bg-gray-100 rounded-lg text-[9px] font-bold text-gray-600 uppercase tracking-wider border border-gray-200">
                {tag}
              </span>
            ))}
          </div>
        </div>
      )}

      <div className="pt-3 border-t border-gray-100 space-y-1 text-[9px] text-gray-400 font-bold">
        <p>Creado: {new Date(viewingNote.createdAt).toLocaleString()}</p>
        <p>Actualizado: {new Date(viewingNote.updatedAt).toLocaleString()}</p>
      </div>
    </>
  ) : null;

  const FormFields = () => (
    <>
      <div>
        <label className="block text-[9px] font-black text-gray-500 uppercase tracking-wider mb-1.5">{t("note_type") || "Tipo"}</label>
        <div className="flex gap-2">
          {["nota", "credencial", "documento"].map((tipo) => (
            <button key={tipo} type="button" onClick={() => setForm({ ...form, tipo })}
              className={`flex-1 py-2.5 px-3 rounded-xl text-[9px] font-black uppercase tracking-wider border-2 transition-all active:scale-95 ${
                form.tipo === tipo ? "border-red-500 bg-red-50 text-red-700" : "border-gray-200 text-gray-400"
              }`}
            >
              {t(`tipo_${tipo}`) || tipo}
            </button>
          ))}
        </div>
      </div>

      <div>
        <label className="block text-[9px] font-black text-gray-500 uppercase tracking-wider mb-1.5">{t("title") || "Título"}</label>
        <input type="text" value={form.titulo} onChange={(e) => setForm({ ...form, titulo: e.target.value })}
          className="w-full px-3 py-3 bg-gray-50 border border-gray-200 rounded-xl text-[13px] font-medium focus:outline-none focus:ring-2 focus:ring-red-500/20 focus:border-red-500"
          placeholder={t("note_title_placeholder") || "Título de la nota..."} autoFocus />
      </div>

      {form.tipo === "credencial" && (
        <div className="space-y-3 p-3 bg-amber-50 rounded-xl border border-amber-200">
          <div>
            <label className="block text-[9px] font-black text-amber-700 uppercase tracking-wider mb-1.5">{t("cred_site") || "Sitio / Servicio"}</label>
            <input type="text" value={form.campos.sitio} onChange={(e) => setForm({ ...form, campos: { ...form.campos, sitio: e.target.value } })}
              className="w-full px-3 py-2.5 bg-white border border-amber-200 rounded-xl text-[13px] font-medium focus:outline-none focus:ring-2 focus:ring-amber-500/20 focus:border-amber-500"
              placeholder="ej: github.com" />
          </div>
          <div>
            <label className="block text-[9px] font-black text-amber-700 uppercase tracking-wider mb-1.5">{t("cred_user") || "Usuario / Email"}</label>
            <input type="text" value={form.campos.identificador} onChange={(e) => setForm({ ...form, campos: { ...form.campos, identificador: e.target.value } })}
              className="w-full px-3 py-2.5 bg-white border border-amber-200 rounded-xl text-[13px] font-medium focus:outline-none focus:ring-2 focus:ring-amber-500/20 focus:border-amber-500" />
          </div>
          <div>
            <label className="block text-[9px] font-black text-amber-700 uppercase tracking-wider mb-1.5">{t("cred_password") || "Contraseña"}</label>
            <input type="text" value={form.campos.secreto} onChange={(e) => setForm({ ...form, campos: { ...form.campos, secreto: e.target.value } })}
              className="w-full px-3 py-2.5 bg-white border border-amber-200 rounded-xl text-[13px] font-medium focus:outline-none focus:ring-2 focus:ring-amber-500/20 focus:border-amber-500" />
          </div>
        </div>
      )}

      <div>
        <label className="block text-[9px] font-black text-gray-500 uppercase tracking-wider mb-1.5">{t("content") || "Contenido"}</label>
        <textarea value={form.contenido} onChange={(e) => setForm({ ...form, contenido: e.target.value })}
          rows={5} className="w-full px-3 py-2.5 bg-gray-50 border border-gray-200 rounded-xl text-[13px] font-medium focus:outline-none focus:ring-2 focus:ring-red-500/20 focus:border-red-500 resize-none"
          placeholder={t("note_content_placeholder") || "Escribe tu nota aquí..."} />
      </div>

      <div>
        <label className="block text-[9px] font-black text-gray-500 uppercase tracking-wider mb-1.5">
          <Tag className="w-3 h-3 inline mr-1" />{t("tags") || "Etiquetas"}
        </label>
        <input type="text" value={form.tags} onChange={(e) => setForm({ ...form, tags: e.target.value })}
          className="w-full px-3 py-2.5 bg-gray-50 border border-gray-200 rounded-xl text-[13px] font-medium focus:outline-none focus:ring-2 focus:ring-red-500/20 focus:border-red-500"
          placeholder={t("tags_placeholder") || "personal, trabajo, ideas (separadas por coma)"} />
      </div>

      <div className="flex gap-2">
        <button type="button" onClick={resetForm}
          className="flex-1 py-3 rounded-xl text-[11px] font-black uppercase tracking-wider border-2 border-gray-200 text-gray-500 active:bg-gray-50 transition-all">
          {t("cancel") || "Cancelar"}
        </button>
        <button type="submit"
          className="flex-1 py-3 rounded-xl text-[11px] font-black uppercase tracking-wider bg-gradient-to-r from-red-600 to-red-500 text-white active:scale-[0.97] transition-all flex items-center justify-center gap-2 shadow-lg">
          <Save className="w-4 h-4" />
          {editingId ? (t("save_changes") || "Guardar Cambios") : (t("save") || "Guardar")}
        </button>
      </div>
    </>
  );

  const q = search.toLowerCase().trim();

  const filtered = notes.filter((n) =>
    !q ||
    n.titulo.toLowerCase().includes(q) ||
    (n.contenido || "").toLowerCase().includes(q) ||
    (n.tags || []).some((t) => t.toLowerCase().includes(q))
  );

  const pinned = filtered.filter((n) => n.pinned);
  const unpinned = filtered.filter((n) => !n.pinned);

  if (loading) {
    return (
      <div className="flex items-center justify-center h-64">
        <Lock className="w-8 h-8 text-red-600 animate-pulse" />
      </div>
    );
  }

  return (
    <div className="w-full pb-24">
      {/* ── Mobile Header ── */}
      <div className="sticky top-0 z-30 bg-white/90 backdrop-blur-xl border-b border-gray-100 px-4 pt-3 pb-2">
        <div className="flex items-center justify-between mb-2">
          <div className="flex items-center gap-2.5">
            <div className="p-1.5 bg-gradient-to-br from-red-600 to-red-700 rounded-lg shadow">
              <Lock className="w-4 h-4 text-white" />
            </div>
            <h1 className="text-sm font-black text-gray-900">{t("caja_fuerte") || "Caja Fuerte"}</h1>
            <span className="text-[9px] text-gray-400 font-bold">{notes.length}</span>
          </div>
          <button
            onClick={() => { resetForm(); setShowForm(true); }}
            className="hidden md:flex items-center gap-1.5 bg-gradient-to-r from-red-600 to-red-500 text-white px-3 py-1.5 rounded-lg text-[9px] font-black uppercase tracking-wider shadow active:scale-95 transition-all"
          >
            <Plus className="w-3.5 h-3.5" />
            {t("new_note") || "Nueva"}
          </button>
        </div>
        <div className="relative">
          <Search className="absolute left-2.5 top-1/2 -translate-y-1/2 w-3.5 h-3.5 text-gray-400" />
          <input
            type="text"
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            placeholder={t("search_notes") || "Buscar por título, contenido o tags..."}
            className="w-full pl-8 pr-8 py-2 bg-gray-100 rounded-lg text-[12px] font-medium text-gray-700 placeholder:text-gray-400 focus:outline-none focus:ring-2 focus:ring-red-500/20 focus:bg-white transition-all"
          />
          {search && (
            <button onClick={() => setSearch("")} className="absolute right-2 top-1/2 -translate-y-1/2 p-1 active:scale-90 transition-transform">
              <X className="w-3.5 h-3.5 text-gray-400" />
            </button>
          )}
        </div>
      </div>

      {/* ── Content Area ── */}
      {notes.length === 0 ? (
        <div className="text-center py-20 px-6">
          <div className="p-4 bg-gray-100 rounded-full w-16 h-16 mx-auto mb-4 flex items-center justify-center">
            <Lock className="w-8 h-8 text-gray-400" />
          </div>
          <p className="text-sm font-bold text-gray-500">{t("caja_fuerte_empty") || "Tu caja fuerte está vacía"}</p>
          <p className="text-[11px] text-gray-400 mt-1">{t("caja_fuerte_empty_desc") || "Guarda notas, contraseñas y documentos de forma segura"}</p>
          <button onClick={() => { resetForm(); setShowForm(true); }}
            className="mt-5 bg-gradient-to-r from-red-600 to-red-500 text-white px-6 py-3 rounded-xl text-[11px] font-black uppercase tracking-wider shadow-lg active:scale-95 transition-all">
            <Plus className="w-4 h-4 inline mr-1.5" />
            {t("create_first_note") || "Crear primera nota"}
          </button>
        </div>
      ) : filtered.length === 0 ? (
        <div className="text-center py-20 px-6">
          <div className="p-4 bg-gray-100 rounded-full w-14 h-14 mx-auto mb-4 flex items-center justify-center">
            <Search className="w-6 h-6 text-gray-400" />
          </div>
          <p className="text-sm font-bold text-gray-500">Sin resultados</p>
          <p className="text-[11px] text-gray-400 mt-1">No encontramos "{search}" en tu caja fuerte</p>
          <button onClick={() => setSearch("")}
            className="mt-4 text-red-600 text-[10px] font-black uppercase tracking-wider active:opacity-70">
            Limpiar búsqueda
          </button>
        </div>
      ) : (
        <div className="px-3 pt-3 space-y-2">
          {pinned.length > 0 && (
            <div className="mb-1">
              <h3 className="text-[9px] font-black text-gray-400 uppercase tracking-widest px-1 mb-2 flex items-center gap-1">
                <Pin className="w-3 h-3" /> {t("pinned") || "Fijados"} ({pinned.length})
              </h3>
              <div className="space-y-2">
                {pinned.map((n) => <NoteCard key={n._id} note={n} onEdit={openEdit} onDelete={setDeleteId} onTogglePin={handleTogglePin} onView={setViewingNote} t={t} />)}
              </div>
            </div>
          )}
          {pinned.length > 0 && unpinned.length > 0 && (
            <h3 className="text-[9px] font-black text-gray-300 uppercase tracking-widest px-1 pt-1">
              {t("all_notes") || "Todas las notas"} ({unpinned.length})
            </h3>
          )}
          <div className="space-y-2">
            {unpinned.map((n) => <NoteCard key={n._id} note={n} onEdit={openEdit} onDelete={setDeleteId} onTogglePin={handleTogglePin} onView={setViewingNote} t={t} />)}
          </div>
        </div>
      )}

      {/* ── FAB (mobile only) ── */}
      <button
        onClick={() => { resetForm(); setShowForm(true); }}
        className="md:hidden fixed bottom-28 right-4 z-40 w-12 h-12 bg-gradient-to-br from-red-600 to-red-500 text-white rounded-full shadow-xl active:scale-90 transition-all flex items-center justify-center border-2 border-white/50"
      >
        <Plus className="w-5 h-5" />
      </button>

      {/* ── Form ── */}
      {showForm && (
        <form onSubmit={handleSubmit}>
          {/* Mobile: full-screen */}
          <div className="md:hidden fixed inset-0 z-50 flex flex-col bg-white animate-in slide-in-from-bottom duration-300">
            <div className="flex items-center justify-between px-4 py-3 border-b border-gray-100 bg-white/90 backdrop-blur-xl">
              <button type="button" onClick={resetForm} className="p-1 -ml-1 active:scale-90 transition-transform">
                <ArrowLeft className="w-5 h-5 text-gray-600" />
              </button>
              <h2 className="text-sm font-black text-gray-900">
                {editingId ? (t("edit_note") || "Editar Nota") : (t("new_note") || "Nueva Nota")}
              </h2>
              <div className="w-7" />
            </div>
            <div className="flex-1 overflow-y-auto px-4 py-4 space-y-4">
              {FormFields()}
            </div>
          </div>
          {/* Desktop: centered modal */}
          <div className="hidden md:flex fixed inset-0 z-50 items-center justify-center p-4 bg-black/40 backdrop-blur-sm" onClick={resetForm}>
            <div className="bg-white rounded-2xl shadow-2xl w-full max-w-lg max-h-[90vh] overflow-y-auto" onClick={(e) => e.stopPropagation()}>
              <div className="sticky top-0 bg-white z-10 flex items-center justify-between p-4 border-b border-gray-100">
                <h2 className="text-sm font-black text-gray-900 uppercase tracking-tight">
                  {editingId ? (t("edit_note") || "Editar Nota") : (t("new_note") || "Nueva Nota")}
                </h2>
                <button type="button" onClick={resetForm} className="p-1.5 hover:bg-gray-100 rounded-lg transition-colors">
                  <X className="w-4 h-4 text-gray-500" />
                </button>
              </div>
              <div className="p-4 space-y-4">
                {FormFields()}
              </div>
            </div>
          </div>
        </form>
      )}

      {/* ── View Note ── */}
      {viewingNote && (
        <>
          {/* Mobile: full-screen */}
          <div className="md:hidden fixed inset-0 z-50 flex flex-col bg-white animate-in slide-in-from-bottom duration-200">
            {ViewNoteHeader()}
            <div className="flex-1 overflow-y-auto px-4 py-4 space-y-4">
              {ViewNoteContent()}
            </div>
          </div>
          {/* Desktop: centered modal */}
          <div className="hidden md:flex fixed inset-0 z-50 items-center justify-center p-4 bg-black/40 backdrop-blur-sm" onClick={() => setViewingNote(null)}>
            <div className="bg-white rounded-2xl shadow-2xl w-full max-w-2xl max-h-[85vh] overflow-y-auto" onClick={(e) => e.stopPropagation()}>
              <div className="sticky top-0 z-10 flex items-center justify-between p-4 sm:p-6 border-b" style={headerBg}>
                <div className="flex items-center gap-3 min-w-0">
                  <div className={`p-2.5 rounded-xl bg-gradient-to-br ${TIPO_COLOR[viewingNote.tipo] || "from-gray-500 to-gray-600"} shadow-sm flex-shrink-0`}>
                    {React.createElement(TIPO_ICON[viewingNote.tipo] || FileText, { className: "w-5 h-5 text-white" })}
                  </div>
                  <div className="min-w-0">
                    <h2 className="text-base sm:text-lg font-black text-gray-900 break-words">{viewingNote.titulo}</h2>
                    <span className="text-[9px] font-bold text-gray-500 uppercase tracking-wider">
                      {t(`tipo_${viewingNote.tipo}`) || viewingNote.tipo}
                      {viewingNote.pinned && <span className="ml-2 text-red-500">• {t("pinned") || "Fijado"}</span>}
                    </span>
                  </div>
                </div>
                <button onClick={() => setViewingNote(null)} className="p-2 hover:bg-white/60 rounded-xl transition-colors flex-shrink-0">
                  <X className="w-5 h-5 text-gray-500" />
                </button>
              </div>
              <div className="p-4 sm:p-6 space-y-5">
                {ViewNoteContent()}
              </div>
              <div className="sticky bottom-0 bg-white border-t border-gray-100 p-4 flex gap-2">
                <button onClick={() => { setViewingNote(null); openEdit(viewingNote); }}
                  className="flex-1 py-2.5 rounded-xl text-[10px] font-black uppercase tracking-wider border-2 border-gray-200 text-gray-600 hover:bg-gray-50 transition-all flex items-center justify-center gap-2">
                  <Edit3 className="w-3.5 h-3.5" /> {t("edit_note") || "Editar"}
                </button>
                <button onClick={() => { const id = viewingNote._id; setViewingNote(null); setDeleteId(id); }}
                  className="flex-1 py-2.5 rounded-xl text-[10px] font-black uppercase tracking-wider bg-red-600 text-white hover:bg-red-700 transition-all flex items-center justify-center gap-2">
                  <Trash2 className="w-3.5 h-3.5" /> {t("delete") || "Eliminar"}
                </button>
              </div>
            </div>
          </div>
        </>
      )}

      {/* ── Delete Confirm ── */}
      {deleteId && (
        <>
          {/* Mobile: bottom sheet */}
          <div className="md:hidden fixed inset-0 z-50 flex flex-col justify-end bg-black/40 backdrop-blur-sm" onClick={() => setDeleteId(null)}>
            <div className="bg-white rounded-t-2xl p-6 animate-in slide-in-from-bottom duration-300" onClick={(e) => e.stopPropagation()}>
              <div className="flex flex-col items-center text-center mb-5">
                <div className="p-3 bg-red-100 rounded-full w-14 h-14 mb-3 flex items-center justify-center">
                  <AlertTriangle className="w-7 h-7 text-red-600" />
                </div>
                <h3 className="text-base font-black text-gray-900">{t("delete_confirm_title") || "¿Eliminar nota?"}</h3>
                <p className="text-[11px] text-gray-500 mt-1">{t("delete_confirm_desc") || "Esta acción no se puede deshacer"}</p>
              </div>
              <div className="flex flex-col gap-2">
                <button onClick={handleDelete}
                  className="w-full py-3 rounded-xl text-[11px] font-black uppercase tracking-wider bg-red-600 text-white active:scale-[0.97] transition-all">
                  {t("delete") || "Eliminar"}
                </button>
                <button onClick={() => setDeleteId(null)}
                  className="w-full py-3 rounded-xl text-[11px] font-black uppercase tracking-wider border-2 border-gray-200 text-gray-500 active:bg-gray-50 transition-all">
                  {t("cancel") || "Cancelar"}
                </button>
              </div>
            </div>
          </div>
          {/* Desktop: centered modal */}
          <div className="hidden md:flex fixed inset-0 z-50 items-center justify-center p-4 bg-black/40 backdrop-blur-sm" onClick={() => setDeleteId(null)}>
            <div className="bg-white rounded-2xl shadow-2xl w-full max-w-sm p-6 text-center" onClick={(e) => e.stopPropagation()}>
              <div className="p-3 bg-red-100 rounded-full w-14 h-14 mx-auto mb-4 flex items-center justify-center">
                <AlertTriangle className="w-7 h-7 text-red-600" />
              </div>
              <h3 className="text-sm font-black text-gray-900 mb-1">{t("delete_confirm_title") || "¿Eliminar nota?"}</h3>
              <p className="text-[10px] text-gray-500 mb-5">{t("delete_confirm_desc") || "Esta acción no se puede deshacer"}</p>
              <div className="flex gap-2">
                <button onClick={() => setDeleteId(null)}
                  className="flex-1 py-2.5 rounded-xl text-[10px] font-black uppercase tracking-wider border-2 border-gray-200 text-gray-500 hover:bg-gray-50 transition-all">
                  {t("cancel") || "Cancelar"}
                </button>
                <button onClick={handleDelete}
                  className="flex-1 py-2.5 rounded-xl text-[10px] font-black uppercase tracking-wider bg-red-600 text-white hover:bg-red-700 active:scale-95 transition-all">
                  {t("delete") || "Eliminar"}
                </button>
              </div>
            </div>
          </div>
        </>
      )}
    </div>
  );
}
