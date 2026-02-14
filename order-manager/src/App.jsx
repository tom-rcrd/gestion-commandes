import { useState, useEffect, useRef, useCallback } from "react";
import { supabase } from "./supabase";

const COUNTRIES = [
  "Afghanistan","Afrique du Sud","Albanie","Algérie","Allemagne","Andorre","Angola","Arabie saoudite",
  "Argentine","Arménie","Australie","Autriche","Azerbaïdjan","Bahamas","Bahreïn","Bangladesh","Belgique",
  "Belize","Bénin","Bhoutan","Biélorussie","Bolivie","Bosnie-Herzégovine","Botswana","Brésil","Brunei",
  "Bulgarie","Burkina Faso","Burundi","Cambodge","Cameroun","Canada","Cap-Vert","Chili","Chine","Chypre",
  "Colombie","Congo","Corée du Sud","Costa Rica","Croatie","Cuba","Danemark","Djibouti","Égypte","Émirats arabes unis",
  "Équateur","Espagne","Estonie","États-Unis","Éthiopie","Finlande","France","Gabon","Gambie","Géorgie",
  "Ghana","Grèce","Guatemala","Guinée","Haïti","Honduras","Hongrie","Inde","Indonésie","Irak","Iran",
  "Irlande","Islande","Israël","Italie","Jamaïque","Japon","Jordanie","Kazakhstan","Kenya","Koweït",
  "Laos","Lettonie","Liban","Libye","Lituanie","Luxembourg","Madagascar","Malaisie","Mali","Maroc",
  "Mexique","Monaco","Mongolie","Namibie","Népal","Nicaragua","Niger","Nigéria","Norvège","Nouvelle-Zélande",
  "Oman","Ouganda","Pakistan","Panama","Paraguay","Pays-Bas","Pérou","Philippines","Pologne","Portugal",
  "Qatar","République tchèque","Roumanie","Royaume-Uni","Russie","Sénégal","Serbie","Singapour","Slovaquie",
  "Slovénie","Suède","Suisse","Thaïlande","Tunisie","Turquie","Ukraine","Uruguay","Vietnam","Zambie","Zimbabwe"
];

const TAX_RATE = 0.00;


const defaultOrder = () => ({
  id: Date.now().toString(36) + Math.random().toString(36).slice(2, 6),
  item: "",
  firstName: "",
  lastName: "",
  address: "",
  city: "",
  postalCode: "",
  country: "France",
  quantity: 1,
  unitPrice: 0,
  shipping: 0,
  paid: false,
  sent: false,
  createdAt: new Date().toISOString(),
  notes: "",
});

const formatPrice = (n) => (Number(n) || 0).toFixed(2).replace(".", ",") + " €";
const calcHT = (o) => (Number(o.quantity) || 0) * (Number(o.unitPrice) || 0);
const calcTTC = (o) => calcHT(o) * (1 + TAX_RATE) + (Number(o.shipping) || 0);

// ─── Icons (inline SVG) ────────────────────────────────────────
const Icon = ({ d, size = 16, stroke = "currentColor", fill = "none" }) => (
  <svg width={size} height={size} viewBox="0 0 24 24" fill={fill} stroke={stroke} strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round">
    <path d={d} />
  </svg>
);

const icons = {
  plus: "M12 5v14M5 12h14",
  trash: "M3 6h18M19 6v14a2 2 0 01-2 2H7a2 2 0 01-2-2V6M8 6V4a2 2 0 012-2h4a2 2 0 012 2v2",
  download: "M21 15v4a2 2 0 01-2 2H5a2 2 0 01-2-2v-4M7 10l5 5 5-5M12 15V3",
  tag: "M20.59 13.41l-7.17 7.17a2 2 0 01-2.83 0L2 12V2h10l8.59 8.59a2 2 0 010 2.82zM7 7h.01",
  search: "M11 17.25a6.25 6.25 0 110-12.5 6.25 6.25 0 010 12.5zM16.65 16.65L21 21",
  edit: "M11 4H4a2 2 0 00-2 2v14a2 2 0 002 2h14a2 2 0 002-2v-7M18.5 2.5a2.121 2.121 0 013 3L12 15l-4 1 1-4 9.5-9.5z",
  check: "M20 6L9 17l-5-5",
  x: "M18 6L6 18M6 6l12 12",
  copy: "M20 9h-9a2 2 0 00-2 2v9a2 2 0 002 2h9a2 2 0 002-2v-9a2 2 0 00-2-2zM5 15H4a2 2 0 01-2-2V4a2 2 0 012-2h9a2 2 0 012 2v1",
  filter: "M22 3H2l8 9.46V19l4 2v-8.54L22 3z",
  stats: "M18 20V10M12 20V4M6 20v-6",
  chevDown: "M6 9l6 6 6-6",
};

// ─── Styles ────────────────────────────────────────────────────
const css = `
  @import url('https://fonts.googleapis.com/css2?family=DM+Sans:ital,opsz,wght@0,9..40,300;0,9..40,400;0,9..40,500;0,9..40,600;1,9..40,300&family=JetBrains+Mono:wght@400;500&display=swap');

  :root {
    --bg: #FAFAF9;
    --surface: #FFFFFF;
    --surface-alt: #F5F5F4;
    --border: #E7E5E4;
    --border-focus: #A8A29E;
    --text: #1C1917;
    --text-secondary: #78716C;
    --text-tertiary: #A8A29E;
    --accent: #1C1917;
    --accent-soft: #F5F5F4;
    --green: #22C55E;
    --green-bg: #F0FDF4;
    --green-border: #BBF7D0;
    --red: #EF4444;
    --red-bg: #FEF2F2;
    --red-border: #FECACA;
    --amber: #F59E0B;
    --amber-bg: #FFFBEB;
    --amber-border: #FDE68A;
    --blue: #3B82F6;
    --blue-bg: #EFF6FF;
    --blue-border: #BFDBFE;
    --radius: 8px;
    --radius-lg: 12px;
    --shadow-sm: 0 1px 2px rgba(0,0,0,0.04);
    --shadow: 0 1px 3px rgba(0,0,0,0.06), 0 1px 2px rgba(0,0,0,0.04);
    --shadow-lg: 0 4px 12px rgba(0,0,0,0.08);
    --font: 'DM Sans', -apple-system, sans-serif;
    --mono: 'JetBrains Mono', monospace;
    --transition: 150ms cubic-bezier(0.4, 0, 0.2, 1);
  }

  * { box-sizing: border-box; margin: 0; padding: 0; }

  body, #root {
    font-family: var(--font);
    background: var(--bg);
    color: var(--text);
    min-height: 100vh;
    -webkit-font-smoothing: antialiased;
  }

  .app {
    max-width: 1400px;
    margin: 0 auto;
    padding: 32px 24px;
  }

  /* ─── Header ─── */
  .header {
    display: flex;
    align-items: center;
    justify-content: space-between;
    margin-bottom: 32px;
    flex-wrap: wrap;
    gap: 16px;
  }

  .header-left { display: flex; align-items: baseline; gap: 12px; }

  .header h1 {
    font-size: 22px;
    font-weight: 600;
    letter-spacing: -0.02em;
    color: var(--text);
  }

  .header .count {
    font-size: 13px;
    font-weight: 400;
    color: var(--text-tertiary);
    font-family: var(--mono);
  }

  .header-actions { display: flex; gap: 8px; flex-wrap: wrap; }

  /* ─── Stats Bar ─── */
  .stats-bar {
    display: grid;
    grid-template-columns: repeat(auto-fit, minmax(160px, 1fr));
    gap: 12px;
    margin-bottom: 24px;
  }

  .stat-card {
    background: var(--surface);
    border: 1px solid var(--border);
    border-radius: var(--radius);
    padding: 16px;
    display: flex;
    flex-direction: column;
    gap: 4px;
  }

  .stat-label {
    font-size: 11px;
    font-weight: 500;
    text-transform: uppercase;
    letter-spacing: 0.06em;
    color: var(--text-tertiary);
  }

  .stat-value {
    font-size: 20px;
    font-weight: 600;
    letter-spacing: -0.02em;
    font-family: var(--mono);
    font-variant-numeric: tabular-nums;
  }

  /* ─── Toolbar ─── */
  .toolbar {
    display: flex;
    gap: 8px;
    margin-bottom: 16px;
    align-items: center;
    flex-wrap: wrap;
  }

  .search-box {
    position: relative;
    flex: 1;
    min-width: 200px;
    max-width: 360px;
  }

  .search-box svg {
    position: absolute;
    left: 12px;
    top: 50%;
    transform: translateY(-50%);
    color: var(--text-tertiary);
    pointer-events: none;
  }

  .search-box input {
    width: 100%;
    padding: 8px 12px 8px 36px;
    border: 1px solid var(--border);
    border-radius: var(--radius);
    font-size: 13px;
    font-family: var(--font);
    background: var(--surface);
    color: var(--text);
    transition: border-color var(--transition);
    outline: none;
  }

  .search-box input:focus { border-color: var(--border-focus); }
  .search-box input::placeholder { color: var(--text-tertiary); }

  .filter-group {
    display: flex;
    gap: 2px;
    background: var(--surface-alt);
    border-radius: var(--radius);
    padding: 2px;
    border: 1px solid var(--border);
  }

  .filter-btn {
    padding: 6px 12px;
    border: none;
    background: transparent;
    border-radius: 6px;
    font-size: 12px;
    font-weight: 500;
    font-family: var(--font);
    color: var(--text-secondary);
    cursor: pointer;
    transition: all var(--transition);
    white-space: nowrap;
  }

  .filter-btn.active {
    background: var(--surface);
    color: var(--text);
    box-shadow: var(--shadow-sm);
  }

  .filter-btn:hover:not(.active) { color: var(--text); }

  /* ─── Buttons ─── */
  .btn {
    display: inline-flex;
    align-items: center;
    gap: 6px;
    padding: 8px 14px;
    border: 1px solid var(--border);
    border-radius: var(--radius);
    font-size: 13px;
    font-weight: 500;
    font-family: var(--font);
    background: var(--surface);
    color: var(--text);
    cursor: pointer;
    transition: all var(--transition);
    white-space: nowrap;
  }

  .btn:hover { border-color: var(--border-focus); box-shadow: var(--shadow-sm); }
  .btn:active { transform: scale(0.98); }

  .btn-primary {
    background: var(--accent);
    color: white;
    border-color: var(--accent);
  }

  .btn-primary:hover { opacity: 0.9; border-color: var(--accent); }

  .btn-danger { color: var(--red); }
  .btn-danger:hover { background: var(--red-bg); border-color: var(--red-border); }

  .btn-sm { padding: 5px 10px; font-size: 12px; }
  .btn-icon { padding: 7px; }

  /* ─── Table ─── */
  .table-wrapper {
    background: var(--surface);
    border: 1px solid var(--border);
    border-radius: var(--radius-lg);
    overflow: hidden;
    box-shadow: var(--shadow-sm);
  }

  .table-scroll { overflow-x: auto; }

  table {
    width: 100%;
    border-collapse: collapse;
    font-size: 13px;
  }

  thead { position: sticky; top: 0; z-index: 2; }

  th {
    padding: 10px 14px;
    text-align: left;
    font-size: 11px;
    font-weight: 600;
    text-transform: uppercase;
    letter-spacing: 0.06em;
    color: var(--text-tertiary);
    background: var(--surface-alt);
    border-bottom: 1px solid var(--border);
    white-space: nowrap;
    cursor: pointer;
    user-select: none;
    transition: color var(--transition);
  }

  th:hover { color: var(--text-secondary); }
  th.sorted { color: var(--text); }

  td {
    padding: 10px 14px;
    border-bottom: 1px solid var(--border);
    vertical-align: middle;
    white-space: nowrap;
  }

  tr:last-child td { border-bottom: none; }
  tr:hover td { background: var(--surface-alt); }

  .cell-mono {
    font-family: var(--mono);
    font-size: 12px;
    font-variant-numeric: tabular-nums;
  }

  /* ─── Status Badges ─── */
  .badge {
    display: inline-flex;
    align-items: center;
    gap: 5px;
    padding: 3px 10px;
    border-radius: 99px;
    font-size: 11px;
    font-weight: 500;
    cursor: pointer;
    transition: all var(--transition);
    border: 1px solid transparent;
    user-select: none;
  }

  .badge-green { background: var(--green-bg); color: #15803D; border-color: var(--green-border); }
  .badge-red { background: var(--red-bg); color: #DC2626; border-color: var(--red-border); }
  .badge-amber { background: var(--amber-bg); color: #B45309; border-color: var(--amber-border); }
  .badge-blue { background: var(--blue-bg); color: #2563EB; border-color: var(--blue-border); }

  .badge:hover { opacity: 0.8; }

  .badge-dot {
    width: 6px; height: 6px;
    border-radius: 50%;
    background: currentColor;
  }

  /* ─── Modal ─── */
  .modal-overlay {
    position: fixed;
    inset: 0;
    background: rgba(0,0,0,0.3);
    backdrop-filter: blur(4px);
    z-index: 100;
    display: flex;
    align-items: center;
    justify-content: center;
    padding: 24px;
    animation: fadeIn 150ms ease;
  }

  @keyframes fadeIn { from { opacity: 0; } to { opacity: 1; } }
  @keyframes slideUp { from { opacity: 0; transform: translateY(8px); } to { opacity: 1; transform: translateY(0); } }

  .modal {
    background: var(--surface);
    border-radius: var(--radius-lg);
    box-shadow: var(--shadow-lg);
    width: 100%;
    max-width: 640px;
    max-height: 90vh;
    overflow-y: auto;
    animation: slideUp 200ms ease;
  }

  .modal-header {
    display: flex;
    align-items: center;
    justify-content: space-between;
    padding: 20px 24px;
    border-bottom: 1px solid var(--border);
  }

  .modal-header h2 {
    font-size: 16px;
    font-weight: 600;
    letter-spacing: -0.01em;
  }

  .modal-body { padding: 24px; }

  .modal-footer {
    display: flex;
    justify-content: flex-end;
    gap: 8px;
    padding: 16px 24px;
    border-top: 1px solid var(--border);
  }

  /* ─── Form ─── */
  .form-grid {
    display: grid;
    grid-template-columns: 1fr 1fr;
    gap: 16px;
  }

  .form-full { grid-column: 1 / -1; }

  .form-group { display: flex; flex-direction: column; gap: 5px; }

  .form-label {
    font-size: 11px;
    font-weight: 600;
    text-transform: uppercase;
    letter-spacing: 0.06em;
    color: var(--text-secondary);
  }

  .form-input {
    padding: 9px 12px;
    border: 1px solid var(--border);
    border-radius: var(--radius);
    font-size: 13px;
    font-family: var(--font);
    color: var(--text);
    background: var(--surface);
    transition: border-color var(--transition);
    outline: none;
  }

  .form-input:focus { border-color: var(--border-focus); }
  .form-input::placeholder { color: var(--text-tertiary); }

  textarea.form-input { resize: vertical; min-height: 60px; }

  .form-row { display: flex; gap: 12px; }
  .form-row > * { flex: 1; }

  .form-section-title {
    font-size: 12px;
    font-weight: 600;
    color: var(--text-secondary);
    padding-top: 8px;
    border-top: 1px solid var(--border);
    grid-column: 1 / -1;
    margin-top: 4px;
  }

  /* ─── Empty State ─── */
  .empty-state {
    padding: 64px 24px;
    text-align: center;
    color: var(--text-tertiary);
  }

  .empty-state p { font-size: 14px; margin-bottom: 16px; }
  .empty-state .hint { font-size: 12px; margin-top: 4px; }

  /* ─── Toast ─── */
  .toast-container {
    position: fixed;
    bottom: 24px;
    right: 24px;
    z-index: 200;
    display: flex;
    flex-direction: column;
    gap: 8px;
  }

  .toast {
    background: var(--text);
    color: white;
    padding: 10px 16px;
    border-radius: var(--radius);
    font-size: 13px;
    font-weight: 500;
    box-shadow: var(--shadow-lg);
    animation: slideUp 200ms ease;
    display: flex;
    align-items: center;
    gap: 8px;
  }

  /* ─── Select ─── */
  .select-wrap { position: relative; }

  .select-wrap select {
    appearance: none;
    width: 100%;
    padding: 9px 32px 9px 12px;
    border: 1px solid var(--border);
    border-radius: var(--radius);
    font-size: 13px;
    font-family: var(--font);
    color: var(--text);
    background: var(--surface);
    cursor: pointer;
    outline: none;
    transition: border-color var(--transition);
  }

  .select-wrap select:focus { border-color: var(--border-focus); }

  .select-wrap svg {
    position: absolute;
    right: 10px;
    top: 50%;
    transform: translateY(-50%);
    pointer-events: none;
    color: var(--text-tertiary);
  }

  /* ─── Checkbox Toggle ─── */
  .toggle-check {
    display: flex;
    align-items: center;
    gap: 10px;
    cursor: pointer;
    padding: 8px 0;
  }

  .toggle-box {
    width: 36px; height: 20px;
    background: var(--border);
    border-radius: 10px;
    position: relative;
    transition: background var(--transition);
    flex-shrink: 0;
  }

  .toggle-box.on { background: var(--green); }

  .toggle-box::after {
    content: '';
    position: absolute;
    width: 16px; height: 16px;
    background: white;
    border-radius: 50%;
    top: 2px; left: 2px;
    transition: transform var(--transition);
    box-shadow: 0 1px 2px rgba(0,0,0,0.15);
  }

  .toggle-box.on::after { transform: translateX(16px); }

  .toggle-label { font-size: 13px; color: var(--text-secondary); }

  /* ─── Responsive ─── */
  @media (max-width: 768px) {
    .app { padding: 16px 12px; }
    .header { margin-bottom: 20px; }
    .header h1 { font-size: 18px; }
    .stats-bar { grid-template-columns: repeat(2, 1fr); gap: 8px; }
    .stat-card { padding: 12px; }
    .stat-value { font-size: 16px; }
    .form-grid { grid-template-columns: 1fr; }
    .toolbar { flex-direction: column; align-items: stretch; }
    .search-box { max-width: none; }
    .filter-group { overflow-x: auto; }
    .header-actions { width: 100%; justify-content: flex-end; }
  }

  /* ─── Keyboard shortcuts hint ─── */
  kbd {
    display: inline-flex;
    align-items: center;
    justify-content: center;
    padding: 1px 5px;
    font-size: 10px;
    font-family: var(--mono);
    color: var(--text-tertiary);
    background: var(--surface-alt);
    border: 1px solid var(--border);
    border-radius: 4px;
    line-height: 1.4;
  }

  .row-actions {
    display: flex;
    gap: 4px;
    opacity: 0;
    transition: opacity var(--transition);
  }

  tr:hover .row-actions { opacity: 1; }

  .row-actions button {
    background: none;
    border: none;
    padding: 4px;
    cursor: pointer;
    color: var(--text-tertiary);
    border-radius: 4px;
    transition: all var(--transition);
    display: flex;
  }

  .row-actions button:hover { color: var(--text); background: var(--surface-alt); }
  .row-actions button.delete-btn:hover { color: var(--red); background: var(--red-bg); }

  /* Bulk actions bar */
  .bulk-bar {
    display: flex;
    align-items: center;
    gap: 12px;
    padding: 10px 16px;
    background: var(--accent);
    color: white;
    border-radius: var(--radius) var(--radius) 0 0;
    font-size: 13px;
    font-weight: 500;
  }

  .bulk-bar button {
    background: rgba(255,255,255,0.15);
    border: none;
    color: white;
    padding: 5px 12px;
    border-radius: 6px;
    font-size: 12px;
    font-weight: 500;
    cursor: pointer;
    font-family: var(--font);
    transition: background var(--transition);
  }

  .bulk-bar button:hover { background: rgba(255,255,255,0.25); }
  .bulk-bar .bulk-spacer { flex: 1; }

  /* Checkbox */
  .checkbox {
    width: 16px; height: 16px;
    border: 1.5px solid var(--border-focus);
    border-radius: 4px;
    display: flex;
    align-items: center;
    justify-content: center;
    cursor: pointer;
    transition: all var(--transition);
    flex-shrink: 0;
    background: var(--surface);
  }

  .checkbox.checked {
    background: var(--accent);
    border-color: var(--accent);
  }

  .checkbox svg { color: white; }
`;

// ─── Product Modal ─────────────────────────────────────────────
function ProductModal({ onSave, onClose }) {
  const [form, setForm] = useState({
    name: "",
    price: 0,
    sku: "",
    stock: "",
    description: ""
  });

  const firstInput = useRef(null);

  useEffect(() => {
    setTimeout(() => firstInput.current?.focus(), 100);
  }, []);

  const set = (field) => (e) =>
    setForm({ ...form, [field]: e.target.value });

  const setNum = (field) => (e) =>
    setForm({ ...form, [field]: Number(e.target.value) || 0 });

  const handleSubmit = () => {
    if (!form.name || form.price <= 0) return;
    onSave(form);
  };

  return (
    <div className="modal-overlay" onClick={onClose}>
      <div className="modal" onClick={(e) => e.stopPropagation()}>
        <div className="modal-header">
          <h2>Nouvel article</h2>
          <button className="btn btn-icon btn-sm" onClick={onClose}>
            <Icon d={icons.x} size={16} />
          </button>
        </div>

        <div className="modal-body">
          <div className="form-grid">

            <div className="form-group form-full">
              <label className="form-label">Nom de l'article</label>
              <input
                ref={firstInput}
                className="form-input"
                placeholder="Riso Japon #1"
                value={form.name}
                onChange={set("name")}
              />
            </div>

            <div className="form-group">
              <label className="form-label">Prix HT (€)</label>
              <input
                className="form-input"
                type="number"
                step="0.01"
                value={form.price}
                onChange={setNum("price")}
              />
            </div>

            <div className="form-group">
              <label className="form-label">SKU / Référence</label>
              <input
                className="form-input"
                placeholder="RISO-JP-01"
                value={form.sku}
                onChange={set("sku")}
              />
            </div>

            <div className="form-group">
              <label className="form-label">Stock</label>
              <input
                className="form-input"
                type="number"
                placeholder="Optionnel"
                value={form.stock}
                onChange={setNum("stock")}
              />
            </div>

            <div className="form-group form-full">
              <label className="form-label">Description interne</label>
              <textarea
                className="form-input"
                placeholder="Notes, détails, édition limitée..."
                value={form.description}
                onChange={set("description")}
              />
            </div>

          </div>
        </div>

        <div className="modal-footer">
          <button className="btn" onClick={onClose}>Annuler</button>
          <button className="btn btn-primary" onClick={handleSubmit}>
            Ajouter
          </button>
        </div>
      </div>
    </div>
  );
}

// ─── Main App ──────────────────────────────────────────────────
export default function OrderManager() {
  const [orders, setOrders] = useState([]);
  const [modalOpen, setModalOpen] = useState(false);
  const [editingOrder, setEditingOrder] = useState(null);
  const [search, setSearch] = useState("");
  const [filter, setFilter] = useState("all");
  const [sortKey, setSortKey] = useState("createdAt");
  const [sortDir, setSortDir] = useState("desc");
  const [selected, setSelected] = useState(new Set());
  const [toasts, setToasts] = useState([]);
  const toastId = useRef(0);
  const [products, setProducts] = useState([]);
  const [productModalOpen, setProductModalOpen] = useState(false);

  // Load from persistent storage
  useEffect(() => {
    loadOrders();
    loadProducts();
  }, []);

  async function loadProducts() {
    const { data } = await supabase.from("products").select("*").order("name");
    if (data) setProducts(data);
  }

  async function loadOrders() {
    const { data, error } = await supabase
      .from("orders")
      .select("*")
      .order("createdAt", { ascending: false });

    if (!error && data) setOrders(data);
  }

  // Save to persistent storage
  const saveOrders = useCallback(async (newOrders) => {
    setOrders(newOrders);

    // On sync chaque ligne avec Supabase
    for (const order of newOrders) {
      await supabase.from("orders").upsert(order);
    }
  }, []);

  const toast = (msg) => {
    const id = ++toastId.current;
    setToasts((t) => [...t, { id, msg }]);
    setTimeout(() => setToasts((t) => t.filter((x) => x.id !== id)), 2500);
  };

  // ─── Product CRUD ───
  const handleSaveProduct = async (product) => {
    const newProduct = {
      id: Date.now().toString(36) + Math.random().toString(36).slice(2, 6),
      ...product,
      createdAt: new Date().toISOString()
    };

    await supabase.from("products").insert(newProduct);
    await loadProducts();
    setProductModalOpen(false);
    toast("Article ajouté");
  };

  // ─── Order CRUD ───
  const handleSave = (order) => {
    const exists = orders.find((o) => o.id === order.id);
    if (exists) {
      saveOrders(orders.map((o) => (o.id === order.id ? order : o)));
      toast("Commande modifiée");
    } else {
      saveOrders([order, ...orders]);
      toast("Commande ajoutée");
    }
    setModalOpen(false);
    setEditingOrder(null);
  };

  const handleDelete = async (ids) => {
    const idSet = new Set(ids);

    const updated = orders.filter((o) => !idSet.has(o.id));
    setOrders(updated);
    setSelected(new Set());
    toast("Supprimé");

    await supabase.from("orders").delete().in("id", ids);
  };

  const toggleField = async (id, field) => {
    const updated = orders.map((o) =>
      o.id === id ? { ...o, [field]: !o[field] } : o
    );
    saveOrders(updated);

    const order = updated.find(o => o.id === id);
    await supabase.from("orders").update({ [field]: order[field] }).eq("id", id);
  };

  // ─── Filter / Sort ───
  const filtered = orders.filter((o) => {
    if (filter === "unpaid") return !o.paid;
    if (filter === "unsent") return o.paid && !o.sent;
    if (filter === "done") return o.paid && o.sent;
    return true;
  }).filter((o) => {
    if (!search) return true;
    const s = search.toLowerCase();
    return (
      o.item.toLowerCase().includes(s) ||
      o.firstName.toLowerCase().includes(s) ||
      o.lastName.toLowerCase().includes(s) ||
      o.city.toLowerCase().includes(s) ||
      o.address.toLowerCase().includes(s) ||
      o.notes.toLowerCase().includes(s)
    );
  });

  const sorted = [...filtered].sort((a, b) => {
    let va = a[sortKey], vb = b[sortKey];
    if (sortKey === "totalHT") { va = calcHT(a); vb = calcHT(b); }
    if (sortKey === "totalTTC") { va = calcTTC(a); vb = calcTTC(b); }
    if (typeof va === "string") { va = va.toLowerCase(); vb = vb.toLowerCase(); }
    if (typeof va === "boolean") { va = va ? 1 : 0; vb = vb ? 1 : 0; }
    if (va < vb) return sortDir === "asc" ? -1 : 1;
    if (va > vb) return sortDir === "asc" ? 1 : -1;
    return 0;
  });

  const handleSort = (key) => {
    if (sortKey === key) setSortDir((d) => (d === "asc" ? "desc" : "asc"));
    else { setSortKey(key); setSortDir("asc"); }
  };

  // ─── Export CSV ───
  const exportCSV = (rows, filename) => {
    const headers = ["Item", "Prénom", "Nom", "Adresse", "Ville", "Code Postal", "Pays", "Quantité", "Prix Unitaire", "Total HT", "Frais Port", "Total TTC", "Payé", "Envoyé", "Date", "Notes"];
    const csv = [
      headers.join(";"),
      ...rows.map((o) =>
        [
          `"${o.item}"`, `"${o.firstName}"`, `"${o.lastName}"`, `"${o.address}"`,
          `"${o.city}"`, `"${o.postalCode}"`, `"${o.country}"`, o.quantity,
          calcHT(o).toFixed(2), (Number(o.unitPrice) || 0).toFixed(2),
          (Number(o.shipping) || 0).toFixed(2), calcTTC(o).toFixed(2),
          o.paid ? "Oui" : "Non", o.sent ? "Oui" : "Non",
          new Date(o.createdAt).toLocaleDateString("fr-FR"), `"${o.notes}"`
        ].join(";")
      ),
    ].join("\n");
    download(csv, filename, "text/csv;charset=utf-8;");
  };

  // ─── Export Labels ───
  const exportLabels = (rows) => {
    const headers = ["Prénom", "Nom", "Adresse", "Code Postal", "Ville", "Pays"];
    const csv = [
      headers.join(";"),
      ...rows.map((o) =>
        [`"${o.firstName}"`, `"${o.lastName}"`, `"${o.address}"`, `"${o.postalCode}"`, `"${o.city}"`, `"${o.country}"`].join(";")
      ),
    ].join("\n");
    download(csv, "etiquettes_envoi.csv", "text/csv;charset=utf-8;");
    toast(`${rows.length} étiquette${rows.length > 1 ? "s" : ""} exportée${rows.length > 1 ? "s" : ""}`);
  };

  const download = (content, name, type) => {
    const BOM = "\uFEFF";
    const blob = new Blob([BOM + content], { type });
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url; a.download = name;
    document.body.appendChild(a); a.click();
    document.body.removeChild(a); URL.revokeObjectURL(url);
  };

  // ─── Selection ───
  const toggleSelect = (id) => {
    setSelected((s) => {
      const n = new Set(s);
      n.has(id) ? n.delete(id) : n.add(id);
      return n;
    });
  };

  const selectAll = () => {
    if (selected.size === sorted.length) setSelected(new Set());
    else setSelected(new Set(sorted.map((o) => o.id)));
  };

  const selectedOrders = orders.filter((o) => selected.has(o.id));

  // ─── Stats ───
  const stats = {
    total: orders.length,
    unpaid: orders.filter((o) => !o.paid).length,
    toSend: orders.filter((o) => o.paid && !o.sent).length,
    revenue: orders.reduce((s, o) => s + calcTTC(o), 0),
  };

  // ─── Keyboard Shortcut ───
  useEffect(() => {
    const handler = (e) => {
      if (e.key === "n" && (e.metaKey || e.ctrlKey) && !modalOpen) {
        e.preventDefault();
        setEditingOrder(null);
        setModalOpen(true);
      }
    };
    window.addEventListener("keydown", handler);
    return () => window.removeEventListener("keydown", handler);
  }, [modalOpen]);

  return (
    <>
      <style>{css}</style>
      <div className="app">
        {/* Header */}
        <div className="header">
          <div className="header-left">
            <h1>Commandes</h1>
            <span className="count">{orders.length} total</span>
          </div>
          <div className="header-actions">
            <button className="btn" onClick={() => setProductModalOpen(true)}>
              <Icon d={icons.plus} size={14} /> Article
            </button>
            <button className="btn" onClick={() => exportCSV(sorted, "commandes.csv")}>
              <Icon d={icons.download} size={14} /> CSV
            </button>
            <button className="btn" onClick={() => exportLabels(orders.filter((o) => o.paid && !o.sent))}>
              <Icon d={icons.tag} size={14} /> Étiquettes
            </button>
            <button className="btn btn-primary" onClick={() => { setEditingOrder(null); setModalOpen(true); }}>
              <Icon d={icons.plus} size={14} stroke="white" /> Commande
            </button>
          </div>
        </div>

        {/* Stats */}
        <div className="stats-bar">
          <div className="stat-card">
            <span className="stat-label">Chiffre d'affaires</span>
            <span className="stat-value">{formatPrice(stats.revenue)}</span>
          </div>
          <div className="stat-card">
            <span className="stat-label">Non payées</span>
            <span className="stat-value" style={{ color: stats.unpaid > 0 ? "var(--red)" : "var(--text)" }}>{stats.unpaid}</span>
          </div>
          <div className="stat-card">
            <span className="stat-label">À envoyer</span>
            <span className="stat-value" style={{ color: stats.toSend > 0 ? "var(--amber)" : "var(--text)" }}>{stats.toSend}</span>
          </div>
          <div className="stat-card">
            <span className="stat-label">Terminées</span>
            <span className="stat-value" style={{ color: "var(--green)" }}>{orders.filter((o) => o.paid && o.sent).length}</span>
          </div>
        </div>

        {/* Toolbar */}
        <div className="toolbar">
          <div className="search-box">
            <Icon d={icons.search} size={15} />
            <input
              placeholder="Rechercher..."
              value={search}
              onChange={(e) => setSearch(e.target.value)}
            />
          </div>
          <div className="filter-group">
            {[
              ["all", "Toutes"],
              ["unpaid", "Non payées"],
              ["unsent", "À envoyer"],
              ["done", "Terminées"],
            ].map(([key, label]) => (
              <button
                key={key}
                className={`filter-btn ${filter === key ? "active" : ""}`}
                onClick={() => setFilter(key)}
              >
                {label}
              </button>
            ))}
          </div>
        </div>

        {/* Table */}
        <div className="table-wrapper">
          {selected.size > 0 && (
            <div className="bulk-bar">
              <span>{selected.size} sélectionnée{selected.size > 1 ? "s" : ""}</span>
              <div className="bulk-spacer" />
              <button onClick={() => exportCSV(selectedOrders, "selection.csv")}>Export CSV</button>
              <button onClick={() => exportLabels(selectedOrders)}>Étiquettes</button>
              <button onClick={() => {
                const upd = orders.map(o => selected.has(o.id) ? { ...o, paid: true } : o);
                saveOrders(upd); setSelected(new Set());
                toast("Marquées comme payées");
              }}>Marquer payé</button>
              <button onClick={() => {
                const upd = orders.map(o => selected.has(o.id) ? { ...o, sent: true } : o);
                saveOrders(upd); setSelected(new Set());
                toast("Marquées comme envoyées");
              }}>Marquer envoyé</button>
              <button onClick={() => handleDelete([...selected])}>Supprimer</button>
            </div>
          )}
          <div className="table-scroll">
            <table>
              <thead>
                <tr>
                  <th style={{ width: 40 }}>
                    <div className={`checkbox ${selected.size === sorted.length && sorted.length > 0 ? "checked" : ""}`} onClick={selectAll}>
                      {selected.size === sorted.length && sorted.length > 0 && <Icon d={icons.check} size={11} />}
                    </div>
                  </th>
                  {[
                    ["item", "Item"],
                    ["lastName", "Client"],
                    ["city", "Ville"],
                    ["quantity", "Qté"],
                    ["unitPrice", "P.U."],
                    ["totalHT", "Total HT"],
                    ["shipping", "Port"],
                    ["totalTTC", "Total TTC"],
                    ["paid", "Payé"],
                    ["sent", "Envoyé"],
                    ["createdAt", "Date"],
                  ].map(([key, label]) => (
                    <th
                      key={key}
                      className={sortKey === key ? "sorted" : ""}
                      onClick={() => handleSort(key)}
                    >
                      {label} {sortKey === key ? (sortDir === "asc" ? "↑" : "↓") : ""}
                    </th>
                  ))}
                  <th style={{ width: 60 }}></th>
                </tr>
              </thead>
              <tbody>
                {sorted.length === 0 ? (
                  <tr>
                    <td colSpan="13">
                      <div className="empty-state">
                        <p>Aucune commande{search ? " trouvée" : ""}</p>
                        {!search && (
                          <button className="btn btn-primary" onClick={() => { setEditingOrder(null); setModalOpen(true); }}>
                            <Icon d={icons.plus} size={14} stroke="white" /> Ajouter une commande
                          </button>
                        )}
                        <p className="hint"><kbd>⌘</kbd> + <kbd>N</kbd> pour ajouter rapidement</p>
                      </div>
                    </td>
                  </tr>
                ) : (
                  sorted.map((o) => (
                    <tr key={o.id}>
                      <td>
                        <div className={`checkbox ${selected.has(o.id) ? "checked" : ""}`} onClick={() => toggleSelect(o.id)}>
                          {selected.has(o.id) && <Icon d={icons.check} size={11} />}
                        </div>
                      </td>
                      <td style={{ fontWeight: 500 }}>{o.item || "—"}</td>
                      <td>{o.firstName} {o.lastName}</td>
                      <td>{o.city || "—"}</td>
                      <td className="cell-mono">{o.quantity}</td>
                      <td className="cell-mono">{formatPrice(o.unitPrice)}</td>
                      <td className="cell-mono">{formatPrice(calcHT(o))}</td>
                      <td className="cell-mono">{formatPrice(o.shipping)}</td>
                      <td className="cell-mono" style={{ fontWeight: 600 }}>{formatPrice(calcTTC(o))}</td>
                      <td>
                        <span className={`badge ${o.paid ? "badge-green" : "badge-red"}`} onClick={() => toggleField(o.id, "paid")}>
                          <span className="badge-dot" /> {o.paid ? "Payé" : "Non payé"}
                        </span>
                      </td>
                      <td>
                        <span className={`badge ${o.sent ? "badge-blue" : "badge-amber"}`} onClick={() => toggleField(o.id, "sent")}>
                          <span className="badge-dot" /> {o.sent ? "Envoyé" : "En attente"}
                        </span>
                      </td>
                      <td className="cell-mono" style={{ color: "var(--text-tertiary)", fontSize: 11 }}>
                        {new Date(o.createdAt).toLocaleDateString("fr-FR")}
                      </td>
                      <td>
                        <div className="row-actions">
                          <button title="Modifier" onClick={() => { setEditingOrder(o); setModalOpen(true); }}>
                            <Icon d={icons.edit} size={14} />
                          </button>
                          <button title="Dupliquer" onClick={() => {
                            const dup = { ...o, id: Date.now().toString(36) + Math.random().toString(36).slice(2, 6), createdAt: new Date().toISOString(), paid: false, sent: false };
                            saveOrders([dup, ...orders]); toast("Commande dupliquée");
                          }}>
                            <Icon d={icons.copy} size={14} />
                          </button>
                          <button className="delete-btn" title="Supprimer" onClick={() => handleDelete([o.id])}>
                            <Icon d={icons.trash} size={14} />
                          </button>
                        </div>
                      </td>
                    </tr>
                  ))
                )}
              </tbody>
            </table>
          </div>
        </div>
      </div>

      {/* Order Modal */}
      {modalOpen && (
        <OrderModal
          order={editingOrder}
          products={products}
          onSave={handleSave}
          onClose={() => { setModalOpen(false); setEditingOrder(null); }}
        />
      )}

      {/* Product Modal */}
      {productModalOpen && (
        <ProductModal
          onSave={handleSaveProduct}
          onClose={() => setProductModalOpen(false)}
        />
      )}

      {/* Toasts */}
      <div className="toast-container">
        {toasts.map((t) => (
          <div key={t.id} className="toast">
            <Icon d={icons.check} size={14} stroke="#22C55E" /> {t.msg}
          </div>
        ))}
      </div>
    </>
  );
}

// ─── Order Modal ───────────────────────────────────────────────
function OrderModal({ order, products, onSave, onClose }) {
  const [form, setForm] = useState(order || defaultOrder());
  const firstInput = useRef(null);

  useEffect(() => {
    setTimeout(() => firstInput.current?.focus(), 100);
  }, []);

  const set = (field) => (e) => setForm({ ...form, [field]: e.target.value });
  const setNum = (field) => (e) => setForm({ ...form, [field]: e.target.value === "" ? "" : Number(e.target.value) || 0 });

  const handleSubmit = () => {
    if (!form.item && !form.lastName) return;
    onSave(form);
  };

  return (
    <div className="modal-overlay" onClick={onClose}>
      <div className="modal" onClick={(e) => e.stopPropagation()}>
        <div className="modal-header">
          <h2>{order ? "Modifier la commande" : "Nouvelle commande"}</h2>
          <button className="btn btn-icon btn-sm" onClick={onClose}>
            <Icon d={icons.x} size={16} />
          </button>
        </div>
        <div className="modal-body">
          <div className="form-grid">
            {/* Item */}
            <div className="form-group form-full">
              <label className="form-label">Article</label>
              <div className="select-wrap">
                <select
                  value={form.item}
                  onChange={(e) => {
                    const product = products.find(p => p.name === e.target.value);
                    if (!product) return;

                    setForm({
                      ...form,
                      item: product.name,
                      unitPrice: product.price
                    });
                  }}
                >
                  <option value="">Choisir un article</option>
                  {products.map(p => (
                    <option key={p.id} value={p.name}>
                      {p.name} — {p.price}€
                    </option>
                  ))}
                </select>
                <Icon d={icons.chevDown} size={14} />
              </div>
            </div>

            <div className="form-section-title">Client</div>

            <div className="form-group">
              <label className="form-label">Prénom</label>
              <input className="form-input" placeholder="Prénom" value={form.firstName} onChange={set("firstName")} />
            </div>
            <div className="form-group">
              <label className="form-label">Nom</label>
              <input className="form-input" placeholder="Nom" value={form.lastName} onChange={set("lastName")} />
            </div>

            <div className="form-section-title">Adresse d'envoi</div>

            <div className="form-group form-full">
              <label className="form-label">Adresse</label>
              <input className="form-input" placeholder="Rue, numéro" value={form.address} onChange={set("address")} />
            </div>
            <div className="form-group">
              <label className="form-label">Code postal</label>
              <input className="form-input" placeholder="75001" value={form.postalCode} onChange={set("postalCode")} />
            </div>
            <div className="form-group">
              <label className="form-label">Ville</label>
              <input className="form-input" placeholder="Paris" value={form.city} onChange={set("city")} />
            </div>
            <div className="form-group">
              <label className="form-label">Pays</label>
              <div className="select-wrap">
                <select value={form.country} onChange={set("country")}>
                  {COUNTRIES.map(c => <option key={c}>{c}</option>)}
                </select>
                <Icon d={icons.chevDown} size={14} />
              </div>
            </div>

            <div className="form-section-title">Tarification</div>

            <div className="form-group">
              <label className="form-label">Quantité</label>
              <input className="form-input" type="number" min="1" value={form.quantity} onChange={setNum("quantity")} />
            </div>
            <div className="form-group">
              <label className="form-label">Prix unitaire HT (€)</label>
              <input className="form-input" type="number" min="0" step="0.01" value={form.unitPrice} onChange={setNum("unitPrice")} />
            </div>
            <div className="form-group">
              <label className="form-label">Frais de port (€)</label>
              <input className="form-input" type="number" min="0" step="0.01" value={form.shipping} onChange={setNum("shipping")} />
            </div>
            <div className="form-group">
              <label className="form-label">Total TTC (auto)</label>
              <div className="form-input" style={{ background: "var(--surface-alt)", fontFamily: "var(--mono)", fontWeight: 600 }}>
                {formatPrice(calcTTC(form))}
              </div>
            </div>

            <div className="form-section-title">Statut</div>

            <div className="form-group">
              <label className="toggle-check" onClick={() => setForm({ ...form, paid: !form.paid })}>
                <div className={`toggle-box ${form.paid ? "on" : ""}`} />
                <span className="toggle-label">Commande payée</span>
              </label>
            </div>
            <div className="form-group">
              <label className="toggle-check" onClick={() => setForm({ ...form, sent: !form.sent })}>
                <div className={`toggle-box ${form.sent ? "on" : ""}`} />
                <span className="toggle-label">Commande envoyée</span>
              </label>
            </div>

            <div className="form-group form-full">
              <label className="form-label">Notes</label>
              <textarea className="form-input" placeholder="Notes internes, instructions spéciales..." value={form.notes} onChange={set("notes")} />
            </div>
          </div>
        </div>
        <div className="modal-footer">
          <button className="btn" onClick={onClose}>Annuler</button>
          <button className="btn btn-primary" onClick={handleSubmit}>
            {order ? "Enregistrer" : "Ajouter"}
          </button>
        </div>
      </div>
    </div>
  );
}