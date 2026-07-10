import { useState, useEffect, useCallback, useRef } from 'react';
import { searchAPI } from '../services/api';
import './AdvancedSearchFilters.css';

const SORT_OPTIONS = [
  { value: 'name_asc', label: 'Name A→Z' },
  { value: 'name_desc', label: 'Name Z→A' },
  { value: 'price_asc', label: 'Price Low→High' },
  { value: 'price_desc', label: 'Price High→Low' },
  { value: 'stock_asc', label: 'Stock Low→High' },
  { value: 'stock_desc', label: 'Stock High→Low' },
  { value: 'date_desc', label: 'Newest First' },
];

const DEFAULT_FILTERS = {
  query: '',
  category: '',
  price_min: '',
  price_max: '',
  stock_min: '',
  stock_max: '',
  in_stock_only: false,
  low_stock_only: false,
  sort_by: 'name',
  sort_dir: 'asc',
};

export default function AdvancedSearchFilters() {
  const [filters, setFilters] = useState(DEFAULT_FILTERS);
  const [results, setResults] = useState([]);
  const [totalResults, setTotalResults] = useState(0);
  const [page, setPage] = useState(1);
  const [totalPages, setTotalPages] = useState(1);
  const [loading, setLoading] = useState(false);
  const [searched, setSearched] = useState(false);

  const [suggestions, setSuggestions] = useState([]);
  const [showSugg, setShowSugg] = useState(false);

  const [savedFilters, setSavedFilters] = useState([]);
  const [saveName, setSaveName] = useState('');
  const [showSaveInput, setShowSaveInput] = useState(false);

  const debounceRef = useRef(null);
  const inputRef = useRef(null);

  // ── Load saved filters on mount ────────────────────────────────────────────
  useEffect(() => {
    loadSavedFilters();
  }, []);

  const loadSavedFilters = async () => {
    try {
      const { data } = await searchAPI.listFilters();
      setSavedFilters(data.filters || []);
    } catch { /* silent */ }
  };

  // ── Autocomplete ───────────────────────────────────────────────────────────
  const handleQueryChange = (val) => {
    setFilters(f => ({ ...f, query: val }));
    clearTimeout(debounceRef.current);
    if (val.length >= 1) {
      debounceRef.current = setTimeout(async () => {
        try {
          const { data } = await searchAPI.getSuggestions(val);
          setSuggestions(data.suggestions || []);
          setShowSugg(true);
        } catch { setSuggestions([]); }
      }, 300);
    } else {
      setSuggestions([]);
      setShowSugg(false);
    }
  };

  const applySuggestion = (s) => {
    setFilters(f => ({
      ...f,
      query: s.label,
      ...(s.type === 'category' ? { category: s.label } : {}),
    }));
    setShowSugg(false);
    setTimeout(() => doSearch(1, { ...filters, query: s.label }), 0);
  };

  // ── Search ─────────────────────────────────────────────────────────────────
  const doSearch = useCallback(async (p = 1, overrideFilters) => {
    const f = overrideFilters || filters;
    const [sort_by, sort_dir] = (f.sort_by + '_' + f.sort_dir).includes('_')
      ? [f.sort_by, f.sort_dir]
      : [f.sort_by, 'asc'];

    setLoading(true);
    setShowSugg(false);
    try {
      const payload = {
        query: f.query,
        category: f.category,
        price_min: f.price_min !== '' ? Number(f.price_min) : undefined,
        price_max: f.price_max !== '' ? Number(f.price_max) : undefined,
        stock_min: f.stock_min !== '' ? Number(f.stock_min) : undefined,
        stock_max: f.stock_max !== '' ? Number(f.stock_max) : undefined,
        in_stock_only: f.in_stock_only,
        low_stock_only: f.low_stock_only,
        sort_by: f.sort_by,
        sort_dir: f.sort_dir,
        page: p,
        per_page: 15,
      };
      const { data } = await searchAPI.searchProducts(payload);
      setResults(data.products || []);
      setTotalResults(data.total || 0);
      setTotalPages(data.pages || 1);
      setPage(p);
      setSearched(true);
    } catch {
      setResults([]);
    } finally {
      setLoading(false);
    }
  }, [filters]);

  const handleSortChange = (val) => {
    const [sort_by, sort_dir] = val.split('_last_').length > 1
      ? val.split('_last_')
      : (() => {
          const parts = val.split('_');
          const dir = parts.pop();
          return [parts.join('_'), dir];
        })();
    setFilters(f => ({ ...f, sort_by, sort_dir }));
  };

  const handleReset = () => {
    setFilters(DEFAULT_FILTERS);
    setResults([]);
    setSearched(false);
    setPage(1);
  };

  // ── Saved filters ──────────────────────────────────────────────────────────
  const handleSaveFilter = async () => {
    if (!saveName.trim()) return;
    try {
      await searchAPI.saveFilter({ name: saveName, filter_type: 'product', filters });
      setSaveName('');
      setShowSaveInput(false);
      loadSavedFilters();
    } catch { /* silent */ }
  };

  const handleApplyFilter = (sf) => {
    setFilters({ ...DEFAULT_FILTERS, ...sf.filters });
    setTimeout(() => doSearch(1, { ...DEFAULT_FILTERS, ...sf.filters }), 0);
  };

  const handleDeleteFilter = async (id, e) => {
    e.stopPropagation();
    await searchAPI.deleteFilter(id);
    setSavedFilters(prev => prev.filter(f => f.id !== id));
  };

  const activeFilterCount = [
    filters.category,
    filters.price_min,
    filters.price_max,
    filters.stock_min,
    filters.stock_max,
    filters.in_stock_only,
    filters.low_stock_only,
  ].filter(Boolean).length;

  return (
    <div className="asf-container">
      {/* Header */}
      <div className="asf-header">
        <div className="asf-header-left">
          <span className="asf-icon">🔍</span>
          <div>
            <h2>Advanced Search</h2>
            <p>Search, filter, and save your frequently-used queries</p>
          </div>
        </div>
      </div>

      {/* Search bar */}
      <div className="asf-searchbar-wrap" ref={inputRef}>
        <div className="asf-searchbar">
          <span className="asf-search-icon">🔍</span>
          <input
            className="asf-search-input"
            type="text"
            placeholder="Search by name, SKU, barcode, or category…"
            value={filters.query}
            onChange={e => handleQueryChange(e.target.value)}
            onKeyDown={e => { if (e.key === 'Enter') doSearch(1); if (e.key === 'Escape') setShowSugg(false); }}
            onFocus={() => suggestions.length && setShowSugg(true)}
          />
          {filters.query && (
            <button className="asf-clear-input" onClick={() => { setFilters(f => ({ ...f, query: '' })); setSuggestions([]); }}>✕</button>
          )}
          <button className="asf-search-btn" onClick={() => doSearch(1)} disabled={loading}>
            {loading ? <span className="asf-spinner" /> : 'Search'}
          </button>
        </div>

        {/* Autocomplete */}
        {showSugg && suggestions.length > 0 && (
          <div className="asf-suggestions">
            {suggestions.map((s, i) => (
              <button key={i} className="asf-suggestion-item" onMouseDown={() => applySuggestion(s)}>
                <span className="asf-sugg-type">{s.type === 'category' ? '🏷️' : '📦'}</span>
                <span className="asf-sugg-label">{s.label}</span>
                <span className="asf-sugg-sub">{s.sub}</span>
              </button>
            ))}
          </div>
        )}
      </div>

      {/* Saved filter chips */}
      {savedFilters.length > 0 && (
        <div className="asf-saved-chips">
          <span className="asf-chips-label">Saved:</span>
          {savedFilters.map(sf => (
            <button key={sf.id} className="asf-chip" onClick={() => handleApplyFilter(sf)}>
              {sf.name}
              <span className="asf-chip-del" onMouseDown={e => handleDeleteFilter(sf.id, e)}>✕</span>
            </button>
          ))}
        </div>
      )}

      {/* Filter panel */}
      <div className="asf-filter-panel">
        <div className="asf-filter-header">
          <span>Filters {activeFilterCount > 0 && <span className="asf-filter-count">{activeFilterCount} active</span>}</span>
          <div className="asf-filter-actions">
            <button className="asf-btn-ghost" onClick={() => setShowSaveInput(s => !s)}>💾 Save Filter</button>
            {activeFilterCount > 0 && <button className="asf-btn-ghost red" onClick={handleReset}>Reset</button>}
          </div>
        </div>

        {showSaveInput && (
          <div className="asf-save-row">
            <input
              className="asf-save-input"
              type="text"
              placeholder="Filter name…"
              value={saveName}
              onChange={e => setSaveName(e.target.value)}
              onKeyDown={e => e.key === 'Enter' && handleSaveFilter()}
            />
            <button className="asf-btn-primary" onClick={handleSaveFilter}>Save</button>
            <button className="asf-btn-ghost" onClick={() => setShowSaveInput(false)}>Cancel</button>
          </div>
        )}

        <div className="asf-filter-grid">
          <div className="asf-field">
            <label>Category</label>
            <input
              className="asf-input"
              type="text"
              placeholder="e.g. Electronics"
              value={filters.category}
              onChange={e => setFilters(f => ({ ...f, category: e.target.value }))}
            />
          </div>
          <div className="asf-field">
            <label>Price Range ($)</label>
            <div className="asf-range-row">
              <input className="asf-input" type="number" placeholder="Min" value={filters.price_min} onChange={e => setFilters(f => ({ ...f, price_min: e.target.value }))} />
              <span className="asf-range-sep">—</span>
              <input className="asf-input" type="number" placeholder="Max" value={filters.price_max} onChange={e => setFilters(f => ({ ...f, price_max: e.target.value }))} />
            </div>
          </div>
          <div className="asf-field">
            <label>Stock Level</label>
            <div className="asf-range-row">
              <input className="asf-input" type="number" placeholder="Min" value={filters.stock_min} onChange={e => setFilters(f => ({ ...f, stock_min: e.target.value }))} />
              <span className="asf-range-sep">—</span>
              <input className="asf-input" type="number" placeholder="Max" value={filters.stock_max} onChange={e => setFilters(f => ({ ...f, stock_max: e.target.value }))} />
            </div>
          </div>
          <div className="asf-field">
            <label>Sort By</label>
            <select
              className="asf-select"
              value={`${filters.sort_by}_${filters.sort_dir}`}
              onChange={e => handleSortChange(e.target.value)}
            >
              {SORT_OPTIONS.map(o => (
                <option key={o.value} value={o.value}>{o.label}</option>
              ))}
            </select>
          </div>
          <div className="asf-field asf-toggles">
            <label className="asf-toggle">
              <input type="checkbox" checked={filters.in_stock_only} onChange={e => setFilters(f => ({ ...f, in_stock_only: e.target.checked, low_stock_only: false }))} />
              <span className="asf-toggle-track" />
              In Stock Only
            </label>
            <label className="asf-toggle">
              <input type="checkbox" checked={filters.low_stock_only} onChange={e => setFilters(f => ({ ...f, low_stock_only: e.target.checked, in_stock_only: false }))} />
              <span className="asf-toggle-track" />
              Low Stock Only
            </label>
          </div>
        </div>

        <button className="asf-btn-primary asf-search-full" onClick={() => doSearch(1)} disabled={loading}>
          {loading ? <span className="asf-spinner" /> : '🔍 Search Products'}
        </button>
      </div>

      {/* Results */}
      {searched && (
        <div className="asf-results">
          <div className="asf-results-header">
            <span className="asf-results-count">
              {totalResults} result{totalResults !== 1 ? 's' : ''}
            </span>
          </div>

          {results.length === 0
            ? (
              <div className="asf-no-results">
                <span>🔍</span>
                <p>No products match your filters</p>
                <button className="asf-btn-ghost" onClick={handleReset}>Clear filters</button>
              </div>
            )
            : (
              <>
                <div className="asf-results-grid">
                  {results.map(p => (
                    <div key={p.id} className="asf-product-card">
                      <div className="asf-card-header">
                        <div>
                          <strong>{p.name}</strong>
                          <span className="asf-card-sku">{p.sku}</span>
                        </div>
                        <span className={`asf-card-badge ${p.current_stock <= p.reorder_level ? 'low' : p.current_stock === 0 ? 'out' : 'ok'}`}>
                          {p.current_stock === 0 ? 'Out' : p.current_stock <= p.reorder_level ? 'Low' : 'In Stock'}
                        </span>
                      </div>
                      <div className="asf-card-body">
                        <div className="asf-card-stat">
                          <span>Price</span><strong>${p.price?.toFixed(2)}</strong>
                        </div>
                        <div className="asf-card-stat">
                          <span>Stock</span><strong>{p.current_stock}</strong>
                        </div>
                        <div className="asf-card-stat">
                          <span>Category</span><strong>{p.category}</strong>
                        </div>
                      </div>
                    </div>
                  ))}
                </div>

                {/* Pagination */}
                {totalPages > 1 && (
                  <div className="asf-pagination">
                    <button className="asf-page-btn" disabled={page === 1} onClick={() => doSearch(page - 1)}>← Prev</button>
                    <span className="asf-page-info">Page {page} of {totalPages}</span>
                    <button className="asf-page-btn" disabled={page === totalPages} onClick={() => doSearch(page + 1)}>Next →</button>
                  </div>
                )}
              </>
            )
          }
        </div>
      )}
    </div>
  );
}
