import  React from 'react';
import PropTypes from 'prop-types';
import { alpha } from '@mui/material/styles';
import Box from '@mui/material/Box';
import Table from '@mui/material/Table';
import TableBody from '@mui/material/TableBody';
import TableCell from '@mui/material/TableCell';
import TableContainer from '@mui/material/TableContainer';
import TableHead from '@mui/material/TableHead';
import TablePagination from '@mui/material/TablePagination';
import TableRow from '@mui/material/TableRow';
import TableSortLabel from '@mui/material/TableSortLabel';
import Toolbar from '@mui/material/Toolbar';
import Typography from '@mui/material/Typography';
import Paper from '@mui/material/Paper';
import Checkbox from '@mui/material/Checkbox';
import IconButton from '@mui/material/IconButton';
import Tooltip from '@mui/material/Tooltip';
import DeleteIcon from '@mui/icons-material/Delete';
import DownloadIcon from '@mui/icons-material/Download';

function descendingComparator(a, b, orderBy) {
  if (b[orderBy] < a[orderBy]) {
    return -1;
  }
  if (b[orderBy] > a[orderBy]) {
    return 1;
  }
  return 0;
}

function getComparator(order, orderBy) {
  return order === 'desc'
    ? (a, b) => descendingComparator(a, b, orderBy)
    : (a, b) => -descendingComparator(a, b, orderBy);
}

// --- Table Toolbar ---

function EnhancedTableToolbar(props) {
  const { numSelected, onDeleteSelected, onDownloadSelected, onDownloadCSV } = props;
  return (
    <Toolbar
      sx={{
        pl: { sm: 2 },
        pr: { xs: 1, sm: 1 },
        display: 'flex',
        alignItems: 'center',
        ...(numSelected > 0 && {
          bgcolor: (theme) =>
            alpha(theme.palette.primary.main, theme.palette.action.activatedOpacity),
        }),
      }}
    >
      {numSelected > 0 ? (
        <Typography
          sx={{ flex: '1 1 100%' }}
          color="inherit"
          variant="subtitle1"
          component="div"
        >
          {numSelected} selected
        </Typography>
      ) : (
        <Typography
          sx={{ flex: '1 1 100%' }}
          variant="h6"
          id="tableTitle"
          component="div"
        >
          Results
        </Typography>
      )}
      {numSelected > 0 ? (
        <React.Fragment>
          <Tooltip title="Delete Selected">
            <IconButton onClick={onDeleteSelected}>
              <DeleteIcon />
            </IconButton>
          </Tooltip>
          <Tooltip title="Download Selected">
            <Typography
              component="span"
              onClick={onDownloadSelected}
              sx={{
                color: 'green',
                cursor: 'pointer',
                ml: 1,
                userSelect: 'none',
                '&:hover': { textDecoration: 'underline' },
              }}
            >
              Download Selected
            </Typography>
          </Tooltip>
        </React.Fragment>
      ) : null}
      <Tooltip title="Download All Visible">
        <IconButton onClick={onDownloadCSV}>
          <DownloadIcon />
        </IconButton>
      </Tooltip>
    </Toolbar>
  );
}

EnhancedTableToolbar.propTypes = {
  numSelected: PropTypes.number.isRequired,
  onDeleteSelected: PropTypes.func.isRequired,
  onDownloadSelected: PropTypes.func.isRequired,
  onDownloadCSV: PropTypes.func.isRequired,
};
const allKeys = [
  "Workstream", "Country", "Region", "Plant_Name", "Plant_Number",
  "Company_Code", "Interface", "Script_Name", "Step_Number", "Description",
  "App_or_Module", "Job_Function_Security", "Tcode"
];

const scriptColumns = ["Step_Number", "Description",
  "App_or_Module", "Job_Function_Security", "Tcode"];


export default function EnhancedTable({ data, selectedIds, onSelect, onDeleteSelected, onDownloadSelected, onDownloadCSV, showScripts }) {
  const [order, setOrder] = React.useState('asc');
  const [orderBy, setOrderBy] = React.useState('ID');
  const [page, setPage] = React.useState(0);
  const [rowsPerPage, setRowsPerPage] = React.useState(25);
  const [expandedRow, setExpandedRow] = React.useState(null);
  React.useEffect(() => {
    setPage(0);
  }, [data]);

  const handleRequestSort = (event, property) => {
    const isAsc = orderBy === property && order === 'asc';
    setOrder(isAsc ? 'desc' : 'asc');
    setOrderBy(property);
  };

  const handleSelectAllClick = (event) => {
    if (event.target.checked) {
      const newSelected = data.map((n) => n.ID);
      onSelect(newSelected);
      return;
    }
    onSelect([]);
  };

  const handleClick = (event, id) => {
    setExpandedRow(expandedRow === id ? null : id);
  };

  const handleCheckboxClick = (event, id) => {
    event.stopPropagation();
    const selectedIndex = selectedIds.indexOf(id);
    let newSelected = [];
    if (selectedIndex === -1) {
      newSelected = newSelected.concat(selectedIds, id);
    } else if (selectedIndex === 0) {
      newSelected = newSelected.concat(selectedIds.slice(1));
    } else if (selectedIndex === selectedIds.length - 1) {
      newSelected = newSelected.concat(selectedIds.slice(0, -1));
    } else if (selectedIndex > 0) {
      newSelected = newSelected.concat(
        selectedIds.slice(0, selectedIndex),
        selectedIds.slice(selectedIndex + 1),
      );
    }
    onSelect(newSelected);
  };

  const handleChangePage = (event, newPage) => {
    setPage(newPage);
  };

  const handleChangeRowsPerPage = (event) => {
    setRowsPerPage(parseInt(event.target.value, 25));
    setPage(0);
  };

  const visibleRows = React.useMemo(
    () =>
      [...data]
        .sort(getComparator(order, orderBy))
        .slice(page * rowsPerPage, page * rowsPerPage + rowsPerPage),
    [order, orderBy, page, rowsPerPage, data],
  );
  const visibleKeys = React.useMemo(() => {
    return allKeys.filter(k => showScripts || !scriptColumns.includes(k));
  }, [showScripts]);

  const emptyRows =
    page > 0 ? Math.max(0, (1 + page) * rowsPerPage - data.length) : 0;

  return (
    <Box sx={{ minWidth:'100%',width: '100%', p: 0, m: 0 }}>
      <Paper sx={{ width: '100%', height: '100%', mb: 0, display: 'flex', flexDirection: 'column' }}>
        <EnhancedTableToolbar
          numSelected={selectedIds.length}
          onDeleteSelected={onDeleteSelected}
          onDownloadSelected={onDownloadSelected}
          onDownloadCSV={onDownloadCSV}
        />
        <TableContainer sx={{ flex: 1, overflow: 'auto' }}>
          <Table
            stickyHeader
            sx={{ minWidth: 750 }}
            aria-labelledby="tableTitle"
            size={'medium'}
          >
            <TableHead>
              <TableRow>
                <TableCell padding="checkbox">
                  <Checkbox
                    color="primary"
                    indeterminate={selectedIds.length > 0 && selectedIds.length < data.length}
                    checked={data.length > 0 && selectedIds.length === data.length}
                    onChange={handleSelectAllClick}
                    inputProps={{ 'aria-label': 'select all rows' }}
                  />
                </TableCell>
                {visibleKeys.map((key) => (
                  <TableCell key={key} align="left" sortDirection={orderBy === key ? order : false}>
                    <TableSortLabel
                      active={orderBy === key}
                      direction={orderBy === key ? order : 'asc'}
                      onClick={(e) => handleRequestSort(e, key)}
                    >
                      {key.replace(/_/g, ' ')}
                    </TableSortLabel>
                  </TableCell>
                ))}
              </TableRow>
            </TableHead>
            <TableBody>
              {visibleRows.map((row, index) => {
                const isItemSelected = selectedIds.includes(row.ID);
                const labelId = `enhanced-table-checkbox-${index}`;
                const isExpanded = expandedRow === row.ID;
                return (
                  <React.Fragment key={row.ID}>
                    <TableRow
                      hover
                      onClick={(event) => handleClick(event, row.ID)}
                      role="checkbox"
                      aria-checked={isItemSelected}
                      tabIndex={-1}
                      selected={isItemSelected}
                      sx={{ cursor: 'pointer' }}
                    >
                      <TableCell padding="checkbox">
                        <Checkbox
                          color="primary"
                          checked={isItemSelected}
                          inputProps={{ 'aria-labelledby': labelId }}
                          onClick={(event) => handleCheckboxClick(event, row.ID)}
                        />
                      </TableCell>
                      {visibleKeys.map((key) => (
                        <TableCell
                          key={`${key}-${row.ID}`}
                          align="left"
                          sx={isExpanded
                            ? { whiteSpace: 'normal', overflow: 'visible', textOverflow: 'clip', wordBreak: 'break-word' } // Allow wrapping when expanded
                            : { maxWidth: 120, whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' } // Truncate when collapsed
                          }
                        >
                          {row[key]}
                        </TableCell>
                      ))}
                    </TableRow>
                  </React.Fragment>
                );
              })}
              {emptyRows > 0 && (
                <TableRow style={{ height: 53 * emptyRows }}> {/* 53 is default 'medium' size height */}
                  <TableCell colSpan={visibleKeys.length + 1} /> {/* +1 for checkbox cell */}
                </TableRow>
              )}
            </TableBody>
          </Table>
        </TableContainer>
        <TablePagination
          rowsPerPageOptions={[25, 50, 100]}
          component="div"
          count={data.length}
          rowsPerPage={rowsPerPage}
          page={page}
          onPageChange={handleChangePage}
          onRowsPerPageChange={handleChangeRowsPerPage}
        />
      </Paper>
    </Box>
  );
}

EnhancedTable.propTypes = {
  data: PropTypes.array.isRequired,
  selectedIds: PropTypes.array.isRequired,
  onSelect: PropTypes.func.isRequired,
  onDeleteSelected: PropTypes.func.isRequired,
  onDownloadSelected: PropTypes.func.isRequired,
  onDownloadCSV: PropTypes.func.isRequired,
  showScripts: PropTypes.bool,
};