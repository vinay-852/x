<?php
/**
 * Plugin Name: Cooper Script Filter
 * Description: Adds a Cooper filter form via shortcode [cooper_form] with dependency-based dynamic selects, row selection, persistent deletion, CSV download, and clear all.
 * Version: 2.1.1
 * Author: Vinay Pepakayala
 * Text Domain: cooper-custom
 */

if (!defined('ABSPATH')) exit;

// Inline CSS
function cooper_register_inline_styles() {
    $css = "
    .application-container{max-width:1200px;margin:20px auto;font-family:Arial,Helvetica,sans-serif}
    .application-form-container{background:#f9f9f9;padding:18px;border:1px solid #e1e1e1;border-radius:6px;margin-bottom:20px}
    .application-form-container h2{margin-top:0}
    .form-section{margin-top:12px}
    .cooper-filter-form label{display:block;margin:8px 0 4px;font-weight:600}
    .cooper-filter-form select{width:100%;padding:8px;margin-bottom:6px;border:1px solid #ccc;border-radius:4px}
    .cooper-filter-form button{display:block;padding:8px 14px;background:#0073aa;color:#fff;border:0;border-radius:4px;cursor:pointer}
    .application-results table{width:100%;border-collapse:collapse;margin-top:10px}
    .application-results th, .application-results td{border:1px solid #ccc;padding:6px;text-align:left;font-size:14px}
    .application-results th{background:#f0f0f0}
    .table-actions button{padding:6px 12px;background:#0073aa;color:#fff;border:none;border-radius:4px;cursor:pointer}
    .table-actions button:disabled{background:#ccc;cursor:default}
    ";
    wp_register_style('cooper-inline-style', false);
    wp_add_inline_style('cooper-inline-style', $css);
}

// Choices.js enqueue
function cooper_enqueue_choicejs() {
    wp_register_script('cooper-choices', 'https://cdn.jsdelivr.net/npm/choices.js/public/assets/scripts/choices.min.js', [], null, true);
    wp_register_style('cooper-choices-css', 'https://cdn.jsdelivr.net/npm/choices.js/public/assets/styles/choices.min.css', [], null);
}

// Shortcode function
function cooper_custom_form_markup() {
    cooper_register_inline_styles();
    wp_enqueue_style('cooper-inline-style');
    cooper_enqueue_choicejs();
    wp_enqueue_style('cooper-choices-css');
    wp_enqueue_script('cooper-choices');

    ob_start();
    ?>

    <div class="application-container">
        <div class="application-form-container">
            <h2><?php echo esc_html__('LSoft Cooper', 'cooper-custom'); ?></h2>
            <div class="form-section">
                <h3><?php echo esc_html__('Filter Module', 'cooper-custom'); ?></h3>
                <form class="cooper-filter-form" method="get" action="">
                    <?php wp_nonce_field('cooper_filter_form_nonce', 'cooper_nonce_field'); ?>
                    <div id="cooper-filters"></div>
                    <button type="submit"><?php echo esc_html__('Apply Filters', 'cooper-custom'); ?></button>
                </form>
            </div>
        </div>
        <div class="application-results-container">
            <div class="application-results"></div>
        </div>
    </div>

    <script type="text/javascript">
    document.addEventListener('DOMContentLoaded', function() {

        // -------------------------
        // Paste your JSON data here
        // -------------------------
        const obj = [
{"ID":"1","Workstream":"Manufacturing","Country":"USA","Region":"North America","Plant_Name":"Plant A","Plant_Number":"123","Company_Code":"A01","Interface":"SAP","Script_Name":"Batch Update Script","Step_Number":"1","Description":"Update batch data for production line","App_or_Module":"SAP ERP","Job_Function_Security":"Operator","Tcode":"CO01"},
{"ID":"2","Workstream":"Finance","Country":"Germany","Region":"Europe","Plant_Name":"Plant B","Plant_Number":"456","Company_Code":"B02","Interface":"SAP","Script_Name":"Cost Allocation Script","Step_Number":"2","Description":"Allocate costs to production orders","App_or_Module":"SAP ERP","Job_Function_Security":"Accountant","Tcode":"FB50"},
{"ID":"3","Workstream":"Logistics","Country":"India","Region":"Asia","Plant_Name":"Plant C","Plant_Number":"789","Company_Code":"C03","Interface":"SAP","Script_Name":"Goods Receipt Script","Step_Number":"1","Description":"Process incoming goods receipts","App_or_Module":"SAP ERP","Job_Function_Security":"Warehouse Staff","Tcode":"MIGO"},
{"ID":"4","Workstream":"Sales","Country":"UK","Region":"Europe","Plant_Name":"Plant D","Plant_Number":"101","Company_Code":"D04","Interface":"SAP","Script_Name":"Sales Order Processing Script","Step_Number":"3","Description":"Create and process sales orders","App_or_Module":"SAP CRM","Job_Function_Security":"Sales Rep","Tcode":"VA01"},
{"ID":"5","Workstream":"Human Resources","Country":"Canada","Region":"North America","Plant_Name":"Plant E","Plant_Number":"112","Company_Code":"E05","Interface":"SAP","Script_Name":"Employee Data Update Script","Step_Number":"2","Description":"Update employee personal information","App_or_Module":"SAP HR","Job_Function_Security":"HR Specialist","Tcode":"PA30"},
{"ID":"6","Workstream":"Manufacturing","Country":"USA","Region":"North America","Plant_Name":"Plant F","Plant_Number":"234","Company_Code":"A01","Interface":"SAP","Script_Name":"Material Availability Check","Step_Number":"1","Description":"Check material availability for production","App_or_Module":"SAP ERP","Job_Function_Security":"Planner","Tcode":"MD04"},
{"ID":"7","Workstream":"Finance","Country":"France","Region":"Europe","Plant_Name":"Plant G","Plant_Number":"567","Company_Code":"F02","Interface":"SAP","Script_Name":"Bank Payment Reconciliation","Step_Number":"4","Description":"Reconcile bank payments with SAP system","App_or_Module":"SAP ERP","Job_Function_Security":"Finance Manager","Tcode":"F110"},
{"ID":"8","Workstream":"Logistics","Country":"Australia","Region":"Oceania","Plant_Name":"Plant H","Plant_Number":"890","Company_Code":"H03","Interface":"SAP","Script_Name":"Shipment Tracking Script","Step_Number":"2","Description":"Track shipment status for export orders","App_or_Module":"SAP SCM","Job_Function_Security":"Logistics Coordinator","Tcode":"VL10B"},
{"ID":"9","Workstream":"Sales","Country":"Japan","Region":"Asia","Plant_Name":"Plant I","Plant_Number":"112","Company_Code":"I04","Interface":"SAP","Script_Name":"Sales Forecasting Script","Step_Number":"5","Description":"Forecast sales for next quarter","App_or_Module":"SAP CRM","Job_Function_Security":"Sales Manager","Tcode":"MC88"},
{"ID":"10","Workstream":"Human Resources","Country":"Mexico","Region":"North America","Plant_Name":"Plant J","Plant_Number":"135","Company_Code":"J05","Interface":"SAP","Script_Name":"Employee Leave Approval","Step_Number":"3","Description":"Approve employee leave requests","App_or_Module":"SAP HR","Job_Function_Security":"HR Specialist","Tcode":"PTARQ"},
{"ID":"11","Workstream":"R&D","Country":"USA","Region":"North America","Plant_Name":"Plant K","Plant_Number":"246","Company_Code":"R06","Interface":"SAP","Script_Name":"R&D Project Progress Report","Step_Number":"1","Description":"Generate progress report for ongoing R&D projects","App_or_Module":"SAP R&D","Job_Function_Security":"Project Manager","Tcode":"CJ20N"},
{"ID":"12","Workstream":"Quality","Country":"Germany","Region":"Europe","Plant_Name":"Plant L","Plant_Number":"357","Company_Code":"Q07","Interface":"SAP","Script_Name":"Quality Inspection Script","Step_Number":"2","Description":"Inspect product quality after manufacturing","App_or_Module":"SAP QM","Job_Function_Security":"Quality Analyst","Tcode":"QA32"},
{"ID":"13","Workstream":"Procurement","Country":"China","Region":"Asia","Plant_Name":"Plant M","Plant_Number":"468","Company_Code":"P08","Interface":"SAP","Script_Name":"Vendor Invoice Verification","Step_Number":"1","Description":"Verify vendor invoices for procurement","App_or_Module":"SAP MM","Job_Function_Security":"Procurement Officer","Tcode":"MIRO"},
{"ID":"14","Workstream":"Production","Country":"South Africa","Region":"Africa","Plant_Name":"Plant N","Plant_Number":"579","Company_Code":"N09","Interface":"SAP","Script_Name":"Production Planning Script","Step_Number":"3","Description":"Plan production based on demand forecast","App_or_Module":"SAP PP","Job_Function_Security":"Production Planner","Tcode":"MD61"},
{"ID":"15","Workstream":"IT Support","Country":"India","Region":"Asia","Plant_Name":"Plant O","Plant_Number":"680","Company_Code":"I10","Interface":"SAP","Script_Name":"System Backup Script","Step_Number":"1","Description":"Perform daily system backups","App_or_Module":"SAP Basis","Job_Function_Security":"IT Admin","Tcode":"SCC4"},
{"ID":"16","Workstream":"Human Resources","Country":"Brazil","Region":"South America","Plant_Name":"Plant P","Plant_Number":"791","Company_Code":"H11","Interface":"SAP","Script_Name":"Employee Salary Update","Step_Number":"4","Description":"Update employee salary information for payroll","App_or_Module":"SAP HR","Job_Function_Security":"HR Administrator","Tcode":"PA40"},
{"ID":"17","Workstream":"Human Resources","Country":"Russia","Region":"Europe","Plant_Name":"Plant Q","Plant_Number":"902","Company_Code":"H12","Interface":"SAP","Script_Name":"Employee Onboarding Script","Step_Number":"5","Description":"Manage employee onboarding process in SAP","App_or_Module":"SAP HR","Job_Function_Security":"HR Specialist","Tcode":"S_PH0_48000528"},
{"ID":"18","Workstream":"Manufacturing","Country":"USA","Region":"North America","Plant_Name":"Plant A","Plant_Number":"123","Company_Code":"A01","Interface":"SAP","Script_Name":"Batch Update Script","Step_Number":"1","Description":"Initialize batch data for production line","App_or_Module":"SAP ERP","Job_Function_Security":"Operator","Tcode":"CO01"},
{"ID":"19","Workstream":"Manufacturing","Country":"USA","Region":"North America","Plant_Name":"Plant A","Plant_Number":"123","Company_Code":"A01","Interface":"SAP","Script_Name":"Batch Update Script","Step_Number":"2","Description":"Validate batch data for production line","App_or_Module":"SAP ERP","Job_Function_Security":"Operator","Tcode":"CO01"},
{"ID":"20","Workstream":"Manufacturing","Country":"USA","Region":"North America","Plant_Name":"Plant A","Plant_Number":"123","Company_Code":"A01","Interface":"SAP","Script_Name":"Batch Update Script","Step_Number":"3","Description":"Execute batch update for production line","App_or_Module":"SAP ERP","Job_Function_Security":"Operator","Tcode":"CO01"},
{"ID":"21","Workstream":"Finance","Country":"Germany","Region":"Europe","Plant_Name":"Plant B","Plant_Number":"456","Company_Code":"B02","Interface":"SAP","Script_Name":"Cost Allocation Script","Step_Number":"1","Description":"Allocate costs to production orders","App_or_Module":"SAP ERP","Job_Function_Security":"Accountant","Tcode":"FB50"},
{"ID":"22","Workstream":"Finance","Country":"Germany","Region":"Europe","Plant_Name":"Plant B","Plant_Number":"456","Company_Code":"B02","Interface":"SAP","Script_Name":"Cost Allocation Script","Step_Number":"2","Description":"Post cost allocations in SAP","App_or_Module":"SAP ERP","Job_Function_Security":"Accountant","Tcode":"FB50"},
{"ID":"23","Workstream":"Finance","Country":"Germany","Region":"Europe","Plant_Name":"Plant B","Plant_Number":"456","Company_Code":"B02","Interface":"SAP","Script_Name":"Cost Allocation Script","Step_Number":"3","Description":"Verify cost allocations for accuracy","App_or_Module":"SAP ERP","Job_Function_Security":"Accountant","Tcode":"FB50"},
{"ID":"24","Workstream":"Logistics","Country":"India","Region":"Asia","Plant_Name":"Plant C","Plant_Number":"789","Company_Code":"C03","Interface":"SAP","Script_Name":"Goods Receipt Script","Step_Number":"1","Description":"Record goods receipts in SAP","App_or_Module":"SAP ERP","Job_Function_Security":"Warehouse Staff","Tcode":"MIGO"},
{"ID":"25","Workstream":"Logistics","Country":"India","Region":"Asia","Plant_Name":"Plant C","Plant_Number":"789","Company_Code":"C03","Interface":"SAP","Script_Name":"Goods Receipt Script","Step_Number":"2","Description":"Verify goods receipt against purchase order","App_or_Module":"SAP ERP","Job_Function_Security":"Warehouse Staff","Tcode":"MIGO"},
{"ID":"26","Workstream":"Logistics","Country":"India","Region":"Asia","Plant_Name":"Plant C","Plant_Number":"789","Company_Code":"C03","Interface":"SAP","Script_Name":"Goods Receipt Script","Step_Number":"3","Description":"Update inventory levels after goods receipt","App_or_Module":"SAP ERP","Job_Function_Security":"Warehouse Staff","Tcode":"MIGO"},
{"ID":"27","Workstream":"Sales","Country":"UK","Region":"Europe","Plant_Name":"Plant D","Plant_Number":"101","Company_Code":"D04","Interface":"SAP","Script_Name":"Sales Order Processing Script","Step_Number":"1","Description":"Create new sales order in SAP","App_or_Module":"SAP CRM","Job_Function_Security":"Sales Rep","Tcode":"VA01"},
{"ID":"28","Workstream":"Sales","Country":"UK","Region":"Europe","Plant_Name":"Plant D","Plant_Number":"101","Company_Code":"D04","Interface":"SAP","Script_Name":"Sales Order Processing Script","Step_Number":"2","Description":"Verify customer details and product availability","App_or_Module":"SAP CRM","Job_Function_Security":"Sales Rep","Tcode":"VA01"},
{"ID":"29","Workstream":"Sales","Country":"UK","Region":"Europe","Plant_Name":"Plant D","Plant_Number":"101","Company_Code":"D04","Interface":"SAP","Script_Name":"Sales Order Processing Script","Step_Number":"3","Description":"Approve and confirm sales order","App_or_Module":"SAP CRM","Job_Function_Security":"Sales Rep","Tcode":"VA01"},
{"ID":"30","Workstream":"Sales","Country":"UK","Region":"Europe","Plant_Name":"Plant D","Plant_Number":"101","Company_Code":"D04","Interface":"SAP","Script_Name":"Sales Order Processing Script","Step_Number":"4","Description":"Generate order confirmation and invoice","App_or_Module":"SAP CRM","Job_Function_Security":"Sales Rep","Tcode":"VA01"},
{"ID":"31","Workstream":"Human Resources","Country":"Canada","Region":"North America","Plant_Name":"Plant E","Plant_Number":"112","Company_Code":"E05","Interface":"SAP","Script_Name":"Employee Data Update Script","Step_Number":"1","Description":"Collect employee data for updates","App_or_Module":"SAP HR","Job_Function_Security":"HR Specialist","Tcode":"PA30"},
{"ID":"32","Workstream":"Human Resources","Country":"Canada","Region":"North America","Plant_Name":"Plant E","Plant_Number":"112","Company_Code":"E05","Interface":"SAP","Script_Name":"Employee Data Update Script","Step_Number":"2","Description":"Review and approve employee data changes","App_or_Module":"SAP HR","Job_Function_Security":"HR Specialist","Tcode":"PA30"},
{"ID":"33","Workstream":"Human Resources","Country":"Canada","Region":"North America","Plant_Name":"Plant E","Plant_Number":"112","Company_Code":"E05","Interface":"SAP","Script_Name":"Employee Data Update Script","Step_Number":"3","Description":"Update employee data in SAP system","App_or_Module":"SAP HR","Job_Function_Security":"HR Specialist","Tcode":"PA30"},
{"ID":"34","Workstream":"Human Resources","Country":"Canada","Region":"North America","Plant_Name":"Plant E","Plant_Number":"112","Company_Code":"E05","Interface":"SAP","Script_Name":"Employee Data Update Script","Step_Number":"4","Description":"Notify employee about data update","App_or_Module":"SAP HR","Job_Function_Security":"HR Specialist","Tcode":"PA30"},
{"ID":"35","Workstream":"Manufacturing","Country":"USA","Region":"North America","Plant_Name":"Plant F","Plant_Number":"234","Company_Code":"A01","Interface":"SAP","Script_Name":"Material Availability Check","Step_Number":"1","Description":"Check availability of raw materials for production","App_or_Module":"SAP ERP","Job_Function_Security":"Planner","Tcode":"MD04"},
{"ID":"36","Workstream":"Manufacturing","Country":"USA","Region":"North America","Plant_Name":"Plant F","Plant_Number":"234","Company_Code":"A01","Interface":"SAP","Script_Name":"Material Availability Check","Step_Number":"2","Description":"Verify stock levels and delivery schedules","App_or_Module":"SAP ERP","Job_Function_Security":"Planner","Tcode":"MD04"},
{"ID":"37","Workstream":"Manufacturing","Country":"USA","Region":"North America","Plant_Name":"Plant F","Plant_Number":"234","Company_Code":"A01","Interface":"SAP","Script_Name":"Material Availability Check","Step_Number":"3","Description":"Generate order list for materials needed","App_or_Module":"SAP ERP","Job_Function_Security":"Planner","Tcode":"MD04"},
{"ID":"38","Workstream":"Manufacturing","Country":"USA","Region":"North America","Plant_Name":"Plant F","Plant_Number":"234","Company_Code":"A01","Interface":"SAP","Script_Name":"Material Availability Check","Step_Number":"4","Description":"Confirm material availability for production planning","App_or_Module":"SAP ERP","Job_Function_Security":"Planner","Tcode":"MD04"},
{"ID":"39","Workstream":"Finance","Country":"Germany","Region":"Europe","Plant_Name":"Plant G","Plant_Number":"567","Company_Code":"F02","Interface":"SAP","Script_Name":"Bank Payment Reconciliation","Step_Number":"1","Description":"Download bank statement for reconciliation","App_or_Module":"SAP ERP","Job_Function_Security":"Finance Manager","Tcode":"F110"},
{"ID":"40","Workstream":"Finance","Country":"Germany","Region":"Europe","Plant_Name":"Plant G","Plant_Number":"567","Company_Code":"F02","Interface":"SAP","Script_Name":"Bank Payment Reconciliation","Step_Number":"2","Description":"Match bank payments with SAP transactions","App_or_Module":"SAP ERP","Job_Function_Security":"Finance Manager","Tcode":"F110"},
{"ID":"41","Workstream":"Finance","Country":"Germany","Region":"Europe","Plant_Name":"Plant G","Plant_Number":"567","Company_Code":"F02","Interface":"SAP","Script_Name":"Bank Payment Reconciliation","Step_Number":"3","Description":"Adjust SAP records for any discrepancies","App_or_Module":"SAP ERP","Job_Function_Security":"Finance Manager","Tcode":"F110"},
{"ID":"42","Workstream":"Finance","Country":"Germany","Region":"Europe","Plant_Name":"Plant G","Plant_Number":"567","Company_Code":"F02","Interface":"SAP","Script_Name":"Bank Payment Reconciliation","Step_Number":"4","Description":"Generate reconciliation report and close the process","App_or_Module":"SAP ERP","Job_Function_Security":"Finance Manager","Tcode":"F110"}
];

        // -------------------------
        // Filter definitions
        // -------------------------
        const filters = [
            {id: 'workstream', label: 'Workstream', key: 'Workstream'},
            {id: 'country', label: 'Country', key: 'Country'},
            {id: 'region', label: 'Region', key: 'Region'},
            {id: 'plant-name', label: 'Plant Name', key: 'Plant_Name'},
            {id: 'plant-number', label: 'Plant Number', key: 'Plant_Number'},
            {id: 'company-code', label: 'Company Code', key: 'Company_Code'},
            {id: 'interface', label: 'Interface', key: 'Interface'}
        ];

        const dependencies = {
            "workstream": ["country","region","plant-name","plant-number","company-code","interface"],
            "country": ["region","plant-name","plant-number","company-code","interface"],
            "region": ["plant-name","plant-number","company-code","interface"],
            "plant-name": ["plant-number","company-code","interface"],
            "plant-number": ["company-code","interface"],
            "company-code": ["interface"]
        };

        // -------------------------
        // State
        // -------------------------
        let filterState = {};
        let tableState = {};
        let deletedIds = [];   // persistent deletions for the session
        let selectedIds = [];  // persistent selections for the session

        // -------------------------
        // Helpers
        // -------------------------
        function uniqueValues(key, data) {
            return [...new Set(data.map(item => item[key]).filter(Boolean))].sort();
        }

        function filterData(filters) {
            return obj.filter(item => {
                if (deletedIds.includes(item.ID)) return false;
                return Object.keys(filters).every(key => {
                    if (!filters[key] || filters[key].length === 0) return true;
                    const mapping = {
                        'workstream': 'Workstream',
                        'country': 'Country',
                        'region': 'Region',
                        'plant-name': 'Plant_Name',
                        'plant-number': 'Plant_Number',
                        'company-code': 'Company_Code',
                        'interface': 'Interface'
                    }[key];
                    return filters[key].includes(item[mapping]);
                });
            });
        }

        // -------------------------
        // Table rendering & actions
        // -------------------------
        function renderTable(data) {
            const container = document.querySelector('.application-results');
            if (!container) return;

            const filteredData = data.filter(row => !deletedIds.includes(row.ID));
            if (!filteredData.length) {
                container.innerHTML = '<p>No results found.</p>';
                return;
            }

            let html = `
                <div class="table-actions" style="margin-bottom:10px; display:flex; gap:10px; flex-wrap:wrap;">
                    <button id="delete-rows" disabled>Delete Selected</button>
                    <button id="download-selected" disabled>Download Selected</button>
                    <button id="download-all">Download All</button>
                    <button id="clear-all">Clear All</button>
                </div>
            `;

            html += '<table><thead><tr>';
            html += '<th><input type="checkbox" id="select-all" /></th>';
            Object.keys(filteredData[0]).forEach(k => html += `<th>${k}</th>`);
            html += '</tr></thead><tbody>';

            filteredData.forEach((row, rowIndex) => {
                const checked = selectedIds.includes(row.ID) ? 'checked' : '';
                html += `<tr>`;
                html += `<td><input type="checkbox" class="row-checkbox" data-row-index="${rowIndex}" data-row-id="${row.ID}" ${checked} /></td>`;
                Object.values(row).forEach(v => html += `<td>${v}</td>`);
                html += `</tr>`;
            });

            html += '</tbody></table>';
            container.innerHTML = html;

            const deleteBtn = container.querySelector('#delete-rows');
            const downloadSelectedBtn = container.querySelector('#download-selected');
            const downloadAllBtn = container.querySelector('#download-all');
            const clearAllBtn = container.querySelector('#clear-all');

            function updateButtons() {
                const hasSelection = selectedIds.length > 0;
                deleteBtn.disabled = !hasSelection;
                downloadSelectedBtn.disabled = !hasSelection;
            }

            // Row checkbox events (persist selection via selectedIds)
            container.querySelectorAll('.row-checkbox').forEach(checkbox => {
                checkbox.addEventListener('change', function() {
                    const rowId = this.dataset.rowId;
                    if (this.checked) {
                        if (!selectedIds.includes(rowId)) selectedIds.push(rowId);
                    } else {
                        selectedIds = selectedIds.filter(id => id !== rowId);
                    }
                    updateButtons();
                });
            });

            // Select All (applies only to visible rows)
            const selectAll = container.querySelector('#select-all');
            selectAll.addEventListener('change', function() {
                container.querySelectorAll('.row-checkbox').forEach(cb => {
                    const rowId = cb.dataset.rowId;
                    cb.checked = this.checked;
                    if (this.checked) {
                        if (!selectedIds.includes(rowId)) selectedIds.push(rowId);
                    } else {
                        selectedIds = selectedIds.filter(id => id !== rowId);
                    }
                });
                updateButtons();
            });

            // Delete selected rows (persist deletions)
            deleteBtn.addEventListener('click', function() {
                selectedIds.forEach(id => {
                    if (!deletedIds.includes(id)) deletedIds.push(id);
                });
                // remove deleted ids from selectedIds
                selectedIds = selectedIds.filter(id => !deletedIds.includes(id));
                renderTable(filterData(tableState));
            });

            // Download Selected (selectedIds may include hidden rows; filter them and exclude deleted)
            downloadSelectedBtn.addEventListener('click', function() {
                if (!selectedIds.length) return;
                const rowsToDownload = obj.filter(row => selectedIds.includes(String(row.ID)) && !deletedIds.includes(String(row.ID)));
                if (!rowsToDownload.length) return;
                downloadCSV(rowsToDownload, 'selected_rows.csv');
            });

            // Download All (all non-deleted rows)
            downloadAllBtn.addEventListener('click', function() {
                const rowsToDownload = obj.filter(row => !deletedIds.includes(String(row.ID)));
                if (!rowsToDownload.length) return;
                downloadCSV(rowsToDownload, 'all_rows.csv');
            });

            // Clear All: resets filters, selections, deletions
            clearAllBtn.addEventListener('click', function() {
                selectedIds = [];
                deletedIds = [];
                filterState = {};
                tableState = {};
                // clear Choice.js selects if present, else plain selects
                filters.forEach(f => {
                    const select = document.getElementById(f.id);
                    if (!select) return;
                    if (select._choicesInstance && typeof select._choicesInstance.removeActiveItems === 'function') {
                        try { select._choicesInstance.removeActiveItems(); } catch(e) { /* ignore */ }
                    } else {
                        Array.from(select.options).forEach(opt => opt.selected = false);
                    }
                });
                renderTable(obj);
            });

            // CSV helper
            function downloadCSV(rows, filename) {
                const headers = Object.keys(rows[0]);
                const csvRows = [
                    headers.join(','),
                    ...rows.map(r => headers.map(h => `"${(r[h] ?? '').toString().replace(/"/g,'""')}"`).join(','))
                ];
                const csvContent = csvRows.join('\n');
                const blob = new Blob([csvContent], {type: 'text/csv;charset=utf-8;'});
                const url = URL.createObjectURL(blob);
                const link = document.createElement('a');
                link.href = url;
                link.setAttribute('download', filename);
                document.body.appendChild(link);
                link.click();
                document.body.removeChild(link);
                URL.revokeObjectURL(url);
            }

            updateButtons();
        }

        // -------------------------
        // Build filter selects
        // -------------------------
        const filtersContainer = document.getElementById('cooper-filters');
        filters.forEach(f => {
            const wrapper = document.createElement('div');
            wrapper.style.minWidth = '160px';
            wrapper.style.display = 'inline-block';
            wrapper.style.marginRight = '10px';
            const label = document.createElement('label');
            label.setAttribute('for', f.id);
            label.textContent = f.label + ':';
            const select = document.createElement('select');
            select.id = f.id;
            select.name = f.id;
            select.multiple = true;
            wrapper.appendChild(label);
            wrapper.appendChild(select);
            filtersContainer.appendChild(wrapper);

            // Populate options from full dataset (deleted rows excluded in table only)
            uniqueValues(f.key, obj).forEach(val => {
                const opt = document.createElement('option');
                opt.value = val;
                opt.textContent = val;
                select.appendChild(opt);
            });

            if (typeof Choices !== 'undefined') {
                try {
                    const choice = new Choices(select, {removeItemButton:true, searchEnabled:true, shouldSort:true});
                    select._choicesInstance = choice;
                } catch(e) {
                    // fall back silently if Choices fails
                }
            }

            select.addEventListener('change', function() {
                filterState[f.id] = Array.from(select.selectedOptions).map(o => o.value);
                updateDependencies(f.id);
            });
        });

        // Update dependent selects based on current filterState
        function updateDependencies(changedId) {
            const dependents = dependencies[changedId] || [];
            dependents.forEach(depId => {
                const select = document.getElementById(depId);
                if (!select) return;
                const mappingKey = filters.find(ff => ff.id === depId).key;
                const filtered = filterData(filterState);
                const uniqueVals = uniqueValues(mappingKey, filtered);
                const choicesInstance = select._choicesInstance;
                const currentValues = Array.from(select.selectedOptions).map(o => o.value);
                if (choicesInstance && typeof choicesInstance.clearStore === 'function') {
                    try {
                        choicesInstance.clearStore();
                        choicesInstance.setChoices(uniqueVals.map(v => ({value:v,label:v,selected:currentValues.includes(v)})), 'value','label', false);
                    } catch(e) {
                        // fallback: rebuild options manually
                        select.innerHTML = '';
                        uniqueVals.forEach(val => {
                            const opt = document.createElement('option');
                            opt.value = val;
                            opt.textContent = val;
                            if (currentValues.includes(val)) opt.selected = true;
                            select.appendChild(opt);
                        });
                    }
                } else {
                    select.innerHTML = '';
                    uniqueVals.forEach(val => {
                        const opt = document.createElement('option');
                        opt.value = val;
                        opt.textContent = val;
                        if (currentValues.includes(val)) opt.selected = true;
                        select.appendChild(opt);
                    });
                }
            });
        }

        // Apply filters button
        document.querySelector('.cooper-filter-form').addEventListener('submit', function(e) {
            e.preventDefault();
            tableState = {};
            filters.forEach(f => {
                const select = document.getElementById(f.id);
                tableState[f.id] = select ? Array.from(select.selectedOptions).map(o => o.value) : [];
            });
            renderTable(filterData(tableState));
        });

        // Initial render (all data)
        renderTable(obj);

    });
    </script>

<?php
    return ob_get_clean();
}

add_shortcode('cooper_form', 'cooper_custom_form_markup');
