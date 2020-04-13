// eslint-disable-next-line
import React, { useState, useEffect, useRef } from 'react';
import { withStyles } from '@material-ui/core/styles';
import clsx from 'clsx';
import { v4 as uuidv4 } from 'uuid';
import Paper from '@material-ui/core/Paper';
import TableContainer from '@material-ui/core/TableContainer';
import DataTableHeader from './components/DataTableHeader';
import DataTableFooter from './components/DataTableFooter';
import DataTableRow from './components/DataTableRow';
import { getPreparedColumns } from './helpers/helpers';

const styles = () => ({
    tableHeadComponent: {
        width: '100%',
        display: 'table-header-group',
        borderSpacing: 0,
        borderCollapse: 'collapse'
    },
    tableComponent: {
        width: '100%',
        display: 'table',
        borderSpacing: 0
    },
    tableFooterComponent: {
        display: 'table-footer-group'
    },
    tableHead: {
        backgroundColor: '#fafafa',
        color: '#fcfcfc'
    },
    tableCell: {
        letterSpacing: '0',
        fontSize: '1rem',
        width: '6rem'
    },
    tableRow: {
        display: 'table-row'
    },
    tableRowOdd: {
        backgroundColor: '#EBEAF6'
    },
    tableRowEven: {
        backgroundColor: '#fcfcfc'
    }
});

let timer = null;
const FOCUS_TIMEOUT_MS = 10;

const DataTable = ({ classes, rows, columns, rowHeight, tableHeight, onAdd, onEdit, onDelete }) => {
    const focusedId = useRef(null);
    const tableId = useRef(
        uuidv4()
            .toString()
            .replace(/-/g, '')
    );

    const [state, setState] = useState({
        tableHeight: rowHeight * rows.length,
        scroll: {
            top: 0,
            index: 0,
            end: Math.ceil((tableHeight * 2) / rowHeight)
        },
        focusedId: null,
        visibilities: columns
            .filter(c => c.headerName)
            .map(({ headerName, field, hidden }) => ({
                headerName,
                field,
                visible: !hidden
            }))
    });

    const preparedColumns = getPreparedColumns(columns, state.visibilities);

    const focusPreviousCell = () => {
        if (focusedId.current) {
            const element = document.getElementById(focusedId.current);
            if (element) {
                element.focus();
            }
        }
    };

    const onScroll = ({ target }) => {
        const numberOfRows = rows.length;
        const calculatedTableHeight = numberOfRows * rowHeight;
        const tableBody = document.getElementById(`${tableId.current}-tbody`);
        const positionInTable = target.scrollTop;

        const tableHeadHeight = document.getElementById(`${tableId.current}-thead`).getBoundingClientRect().height;
        const tableFooterHeight = document.getElementById(`${tableId.current}-tfoot`).getBoundingClientRect().height;
        const tableContainerHeight = document.getElementById(`${tableId.current}-tcontainer`).getBoundingClientRect()
            .height;

        const visibleTableHeight = tableContainerHeight - tableHeadHeight - tableFooterHeight;

        const topRowIndex = Math.floor(positionInTable / rowHeight);
        const endRow = topRowIndex + visibleTableHeight / rowHeight;
        tableBody.style.height = `${calculatedTableHeight}px`;

        setState({
            ...state,
            scroll: {
                ...state.scroll,
                index: topRowIndex,
                end: Math.ceil(endRow),
                top: topRowIndex * rowHeight
            }
        });
        clearTimeout(timer);
        timer = setTimeout(() => focusPreviousCell(), FOCUS_TIMEOUT_MS);
    };

    useEffect(() => {
        onScroll({ target: { scrollTop: 0 } });
        // eslint-disable-next-line
    }, []);

    function handleWindowResize() {
        onScroll({ target: { scrollTop: 0 } });
    }

    window.onresize = handleWindowResize;

    const handleCellClick = event => {
        focusedId.current = event.target.id;
        const element = document.getElementById(focusedId.current);
        if (element) {
            element.focus();
        }
    };

    const renderBody = () => {
        let {
            scroll: { index }
        } = state;
        const items = [];
        const tableElement = document.getElementById(`${tableId.current}-table`);
        const tableWidth = tableElement ? tableElement.getBoundingClientRect().width : 0;
        do {
            if (index >= rows.length) {
                index = rows.length;
                break;
            }
            const style = {
                top: index * rowHeight,
                height: rowHeight,
                lineHeight: `${rowHeight}px`,
                width: tableWidth,
                position: 'absolute'
            };
            items.push(
                <div
                    style={style}
                    className={clsx(classes.tableRow, index % 2 === 0 ? classes.tableRowOdd : classes.tableRowEven)}
                    key={index}>
                    <DataTableRow
                        tableId={tableId.current}
                        columns={preparedColumns}
                        rows={rows}
                        rowIndex={index}
                        handleCellClick={handleCellClick}
                    />
                </div>
            );
            index += 1;
        } while (index < state.scroll.end);

        return items;
    };

    const style = { maxHeight: tableHeight, minHeight: '200px', borderRadius: 0 };
    return (
        <>
            <TableContainer id={`${tableId.current}-tcontainer`} onScroll={onScroll} component={Paper} style={style}>
                <div id={`${tableId.current}-table`} className={classes.tableComponent}>
                    <div
                        id={`${tableId.current}-thead`}
                        className={clsx(classes.tableHeadComponent, classes.tableHead)}>
                        <DataTableHeader columns={preparedColumns} rowHeight={rowHeight} />
                    </div>
                    <div
                        id={`${tableId.current}-tbody`}
                        className="tbody"
                        style={{
                            position: 'relative'
                        }}>
                        {renderBody()}
                    </div>
                    <div id={`${tableId.current}-tfoot`} className={classes.tableFooterComponent}>
                        <DataTableFooter columns={preparedColumns} rowHeight={rowHeight} rows={rows} />
                    </div>
                </div>
            </TableContainer>
        </>
    );
};

export default withStyles(styles)(DataTable);
