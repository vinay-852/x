import './App.css';
import React from 'react';
import Filter from './components/filter';
import EnhancedTable from './components/table';
import {data, withoutScripts} from './components/data';
function getUniqueOptions(data, key) {
  return Array.from(new Set(data.map(item => item[key])))
    .filter(Boolean)
    .sort()
    .map(v => ({ value: v, label: v }));
}

const filterFields = [
  { id: 'workstream', label: 'Workstream', key: 'Workstream' },
  { id: 'country', label: 'Country', key: 'Country' },
  { id: 'region', label: 'Region', key: 'Region' },
  { id: 'plant-name', label: 'Plant Name', key: 'Plant_Name' },
  { id: 'plant-number', label: 'Plant Number', key: 'Plant_Number' },
  { id: 'company-code', label: 'Company Code', key: 'Company_Code' },
  { id: 'interface', label: 'Interface', key: 'Interface' },
];

const dependencies = {
  "workstream": ["country", "region", "plant-name", "plant-number", "company-code", "interface"],
  "country": ["region", "plant-name", "plant-number", "company-code", "interface"],
  "region": ["plant-name", "plant-number", "company-code", "interface"],
  "plant-name": ["plant-number", "company-code", "interface"],
  "plant-number": ["company-code", "interface"],
  "company-code": ["interface"]
};

function downloadCSV(rows, filename) {
  if (!rows || !rows.length) {
    alert("No data to download.");
    return;
  }
  const keys = Object.keys(rows[0]);
  const csv = [
    keys.join(','),
    ...rows.map(row =>
      keys.map(k => `"${(row[k] ?? '').toString().replace(/"/g, '""')}"`).join(',')
    )
  ].join('\n');

  const blob = new Blob([csv], { type: 'text/csv;charset=utf-8;' });
  const url = window.URL.createObjectURL(blob);
  const a = document.createElement('a');
  a.href = url;
  a.download = filename;
  document.body.appendChild(a);
  a.click();
  document.body.removeChild(a);
  window.URL.revokeObjectURL(url);
}
const timestamp = new Date().toISOString().replace(/[:.]/g, '-');

const getInitialFilterState = () => Object.fromEntries(filterFields.map(f => [f.id, []]));

const rawFullData = data;
const rawWithoutScripts = withoutScripts;
function ensureIds(arr) {
  return (arr || []).map((row, idx) => (row && row.ID != null) ? row : { ...row, ID: idx + 1 });
}
function App() {
  const [filterValues, setFilterValues] = React.useState(getInitialFilterState());
  const [appliedFilters, setAppliedFilters] = React.useState(getInitialFilterState());
  const [deletedIds, setDeletedIds] = React.useState([]);
  const [selectedIds, setSelectedIds] = React.useState([]);
  const [showScripts, setShowScripts] = React.useState(false);
  
  const fullData = React.useMemo(() => ensureIds(rawFullData), [rawFullData]);
  const withoutScriptsData = React.useMemo(() => ensureIds(rawWithoutScripts), [rawWithoutScripts]);

  const currentDataSource = React.useMemo(() => {
    return showScripts ? fullData : withoutScriptsData;
  }, [showScripts, fullData, withoutScriptsData]);

  const getDependentOptions = React.useCallback((key) => {
    let filtered = currentDataSource;
    for (const f of filterFields) {
      if (f.id === key) break;
      const activeFilterValues = filterValues[f.id];
      if (activeFilterValues && activeFilterValues.length > 0) {
        filtered = filtered.filter(item =>
          activeFilterValues.some(v => v.value === item[f.key])
        );
      }
    }
    return getUniqueOptions(filtered, filterFields.find(f => f.id === key).key);
  }, [filterValues, currentDataSource]);
  const filteredData = React.useMemo(() => {
    let filtered = currentDataSource;
    for (const f of filterFields) {
      const activeFilterValues = appliedFilters[f.id];
      if (activeFilterValues && activeFilterValues.length > 0) {
        filtered = filtered.filter(item =>
          activeFilterValues.some(v => v.value === item[f.key])
        );
      }
    }
    if (deletedIds.length > 0) {
      filtered = filtered.filter(item => !deletedIds.includes(item.ID));
    }
    return filtered;
  }, [appliedFilters, deletedIds, currentDataSource]);
  function handleFilterChange(id, vals) {
    setFilterValues(prev => {
      const updated = { ...prev, [id]: vals };
      (dependencies[id] || []).forEach(depId => {
        updated[depId] = [];
      });
      return updated;
    });
  }

  function applyFilters() {
    setAppliedFilters(filterValues);
    setSelectedIds([]);
  }

  function handleClearAll() {
    setFilterValues(getInitialFilterState());
    setAppliedFilters(getInitialFilterState());
    setDeletedIds([]);
    setSelectedIds([]);
  }

  function handleToggleShowScripts(event) {
    const isChecked = event.target.checked;
    setShowScripts(isChecked);
    setDeletedIds([]);
    setSelectedIds([]);
  }

  function handleDeleteSelected() {
    setDeletedIds(prev => [...new Set([...prev, ...selectedIds])]);
    setSelectedIds([]);
  }

  function handleDownloadSelected() {
    const selectedRows = fullData.filter(row =>
      selectedIds.includes(row.ID) &&
      !deletedIds.includes(row.ID)
    );
    downloadCSV(selectedRows, `Scripts_${timestamp}.csv`);
  }

  function handleDownloadAll() {
    let filtered = fullData;
    for (const f of filterFields) {
      const activeFilterValues = appliedFilters[f.id];
      if (activeFilterValues && activeFilterValues.length > 0) {
        filtered = filtered.filter(item =>
          activeFilterValues.some(v => v.value === item[f.key])
        );
      }
    }
    if (deletedIds.length > 0) {
      filtered = filtered.filter(item => !deletedIds.includes(item.ID));
    }
    
    downloadCSV(filtered, `Scripts_${timestamp}.csv`);
  }

  function handleSelect(ids) {
    setSelectedIds(ids);
  }

  return (
    <div className="App" style={{ padding: 24, fontFamily: 'Arial, sans-serif', minWidth: '100%', fontSize: '13px'}}>
      <h2>LSoft Cooper - Filter Module</h2>
      <form
        onSubmit={e => {
          e.preventDefault();
          applyFilters();
        }}
        style={{
          marginBottom: 24,
          background: '#fff',
          border: '1px solid #e1e1e1',
          borderRadius: 12,
          padding: 28,
          boxShadow: '0 4px 16px rgba(0,0,0,0.07)',
          maxWidth: 400,
          marginLeft: 'auto',
          marginRight: 'auto',
          fontSize: '13px'
        }}
      >
        <div style={{ display: 'flex', flexDirection: 'column', gap: 18 }}>
          {filterFields.map(f => (
            <div key={f.id} style={{ display: 'flex', alignItems: 'center', width: '100%', minWidth: 0, marginBottom: 0 }}>
              <label style={{ minWidth: 140, fontWeight: 700, fontSize: 18, color: '#222', marginRight: 16, letterSpacing: 0.5 }}>{f.label}:</label>
              <div style={{ minWidth: 0, width: '320px', maxWidth: '100%' }}>
                <Filter
                  options={getDependentOptions(f.id)}
                  value={filterValues[f.id]}
                  onChange={vals => handleFilterChange(f.id, vals)}
                  placeholder={`Filter by ${f.label}`}
                  style={{ width: '100%', fontSize: 16 }}
                />
              </div>
            </div>
          ))}
        </div>
        <div style={{ display: 'flex', gap: 16, marginTop: 28, justifyContent: 'center' }}>
          <button type="submit" style={{
            padding: '10px 10px',
            fontWeight: 700,
            fontSize: 17,
            background: 'linear-gradient(90deg,#0073aa 60%,#0099cc 100%)',
            color: 'white',

            border: 0,
            borderRadius: 6,
            cursor: 'pointer',
            boxShadow: '0 2px 8px rgba(0,0,0,0.08)',
            transition: 'background 0.2s',
          }}
            onMouseOver={e => e.currentTarget.style.background = 'linear-gradient(90deg,#005a8c 60%,#0073aa 100%)'}
            onMouseOut={e => e.currentTarget.style.background = 'linear-gradient(90deg,#0073aa 60%,#0099cc 100%)'}
          >
            Apply Filter
          </button>
          <button type="button" onClick={handleClearAll} style={{
            padding: '10px 28px',
            fontWeight: 700,
            fontSize: 17,
            background: '#f2f2f2',
            color: '#222',
            border: '1px solid #ccc',
            borderRadius: 6,
            cursor: 'pointer',
            boxShadow: '0 2px 8px rgba(0,0,0,0.04)',
            transition: 'background 0.2s',
          }}
            onMouseOver={e => e.currentTarget.style.background = '#e1e1e1'}
            onMouseOut={e => e.currentTarget.style.background = '#f2f2f2'}
          >
            Clear All
          </button>
        </div>
        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', marginBottom: 18 }}>
        <input
          type="checkbox"
          checked={showScripts}
          onChange={handleToggleShowScripts}
          style={{ width: 22, height: 22, accentColor: '#0073aa', cursor: 'pointer' }}
        />
        <span style={{ marginLeft: 10, fontSize: 15, color: '#555' }}>{showScripts ? 'Without Scripts' : 'With Scripts'}</span>
      </div>
      </form>

      <EnhancedTable
        data={filteredData}
        selectedIds={selectedIds}
        onSelect={handleSelect}
        onDeleteSelected={handleDeleteSelected}
        onDownloadSelected={handleDownloadSelected}
        onDownloadCSV={handleDownloadAll}
        showScripts={showScripts}
      />
    </div>
  );
}

export default App;