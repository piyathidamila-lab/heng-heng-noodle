'use client';

import type { OrderRecord } from 'src/lib/order-service';

import { useState, useEffect } from 'react';

import Box from '@mui/material/Box';
import Chip from '@mui/material/Chip';
import Table from '@mui/material/Table';
import Paper from '@mui/material/Paper';
import TableRow from '@mui/material/TableRow';
import TableBody from '@mui/material/TableBody';
import TableCell from '@mui/material/TableCell';
import TableHead from '@mui/material/TableHead';
import Typography from '@mui/material/Typography';
import TableContainer from '@mui/material/TableContainer';
import LinearProgress from '@mui/material/LinearProgress';
import TablePagination from '@mui/material/TablePagination';

import { fDateTime } from 'src/utils/format-time';

import { STATUS_COLOR, STATUS_LABEL } from '../orders/order-status-config';

// ----------------------------------------------------------------------

type Props = {
  orders: OrderRecord[];
  loading?: boolean;
};

export function OrderHistoryTable({ orders, loading = false }: Props) {
  const [page, setPage] = useState(0);
  const [rowsPerPage, setRowsPerPage] = useState(10);

  useEffect(() => {
    setPage(0);
  }, [orders]);

  const visibleOrders = orders.slice(page * rowsPerPage, page * rowsPerPage + rowsPerPage);

  return (
    <Paper
      variant="outlined"
      sx={{ position: 'relative', overflow: 'hidden', borderRadius: 3, borderColor: 'grey.200' }}
    >
      {loading && <LinearProgress sx={{ position: 'absolute', zIndex: 2, top: 0, width: 1 }} />}

      <TableContainer sx={{ opacity: loading ? 0.65 : 1, transition: 'opacity 160ms ease' }}>
        <Table sx={{ minWidth: 1120 }}>
          <TableHead>
            <TableRow>
              <TableCell>ออเดอร์ / วันเวลา</TableCell>
              <TableCell>ลูกค้า</TableCell>
              <TableCell>ประเภท</TableCell>
              <TableCell>รายการอาหาร</TableCell>
              <TableCell align="center">ชำระเงิน</TableCell>
              <TableCell align="center">สถานะ</TableCell>
              <TableCell align="right">ยอดรวม</TableCell>
            </TableRow>
          </TableHead>

          <TableBody>
            {visibleOrders.map((order) => {
              const itemCount = order.items.reduce((sum, item) => sum + item.quantity, 0);

              return (
                <TableRow key={order.id} hover>
                  <TableCell sx={{ minWidth: 150 }}>
                    <Typography variant="subtitle2" sx={{ color: 'primary.main' }}>
                      {order.orderNumber}
                    </Typography>
                    <Typography variant="caption" sx={{ color: 'text.secondary' }}>
                      {fDateTime(order.createdAt)}
                    </Typography>
                  </TableCell>

                  <TableCell sx={{ minWidth: 150 }}>
                    <Typography variant="body2" sx={{ fontWeight: 700 }} noWrap>
                      {order.customerName || 'ไม่ระบุชื่อ'}
                    </Typography>
                    {order.customerPhone && (
                      <Typography variant="caption" sx={{ color: 'text.secondary' }} noWrap>
                        {order.customerPhone}
                      </Typography>
                    )}
                  </TableCell>

                  <TableCell sx={{ minWidth: 115 }}>
                    <Chip
                      size="small"
                      variant="outlined"
                      label={
                        order.orderType === 'dine-in' ? `โต๊ะ ${order.tableNumber}` : 'กลับบ้าน'
                      }
                    />
                  </TableCell>

                  <TableCell sx={{ minWidth: 300, maxWidth: 360 }}>
                    <Typography
                      variant="body2"
                      sx={{
                        overflow: 'hidden',
                        whiteSpace: 'nowrap',
                        textOverflow: 'ellipsis',
                      }}
                    >
                      {order.items.map((item) => `${item.quantity}× ${item.name}`).join(' · ')}
                    </Typography>
                    <Typography variant="caption" sx={{ color: 'text.secondary' }}>
                      รวม {itemCount.toLocaleString('th-TH')} รายการ
                    </Typography>
                  </TableCell>

                  <TableCell align="center">
                    <Chip
                      size="small"
                      label={order.paymentStatus === 'paid' ? 'ชำระแล้ว' : 'ยังไม่ชำระ'}
                      color={order.paymentStatus === 'paid' ? 'success' : 'warning'}
                      variant="soft"
                    />
                  </TableCell>

                  <TableCell align="center">
                    <Chip
                      size="small"
                      label={STATUS_LABEL[order.status]}
                      color={STATUS_COLOR[order.status]}
                    />
                  </TableCell>

                  <TableCell align="right" sx={{ minWidth: 120 }}>
                    <Typography variant="subtitle2" sx={{ whiteSpace: 'nowrap' }}>
                      ฿{order.total.toLocaleString('th-TH')}
                    </Typography>
                  </TableCell>
                </TableRow>
              );
            })}

            {visibleOrders.length === 0 && (
              <TableRow>
                <TableCell colSpan={7}>
                  <Box sx={{ py: 6, textAlign: 'center' }}>
                    <Typography variant="h6">ไม่พบออเดอร์</Typography>
                    <Typography variant="body2" sx={{ mt: 0.5, color: 'text.secondary' }}>
                      ลองเลือกช่วงเวลาอื่นเพื่อค้นหารายการ
                    </Typography>
                  </Box>
                </TableCell>
              </TableRow>
            )}
          </TableBody>
        </Table>
      </TableContainer>

      <TablePagination
        component="div"
        count={orders.length}
        page={page}
        rowsPerPage={rowsPerPage}
        rowsPerPageOptions={[10, 25, 50]}
        onPageChange={(_, nextPage) => setPage(nextPage)}
        onRowsPerPageChange={(event) => {
          setRowsPerPage(Number(event.target.value));
          setPage(0);
        }}
        labelRowsPerPage="แสดงต่อหน้า"
        labelDisplayedRows={({ from, to, count }) =>
          `${from.toLocaleString('th-TH')}–${to.toLocaleString('th-TH')} จาก ${count.toLocaleString('th-TH')}`
        }
      />
    </Paper>
  );
}
