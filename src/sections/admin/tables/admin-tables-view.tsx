'use client';

import type { IconifyName } from 'src/components/iconify';
import type { RestaurantTable } from 'src/lib/table-service';

import { QRCodeSVG } from 'qrcode.react';
import { useState, useEffect } from 'react';

import Box from '@mui/material/Box';
import Card from '@mui/material/Card';
import Chip from '@mui/material/Chip';
import Stack from '@mui/material/Stack';
import Button from '@mui/material/Button';
import Divider from '@mui/material/Divider';
import Tooltip from '@mui/material/Tooltip';
import IconButton from '@mui/material/IconButton';
import Typography from '@mui/material/Typography';
import GlobalStyles from '@mui/material/GlobalStyles';

import { Logo } from 'src/components/logo';
import { toast } from 'src/components/snackbar';
import { Iconify } from 'src/components/iconify';
import { useConfirmDialog } from 'src/components/custom-dialog';

import { TableFormDialog } from './table-form-dialog';
import { moveTable, createTable, deleteTable } from './table-actions';

// ----------------------------------------------------------------------

type Props = {
  initialTables: RestaurantTable[];
  shopName: string;
};

type PrintQrSheetProps = {
  table: RestaurantTable;
  tableUrl: string;
  shopName: string;
  isLast: boolean;
};

function PrintQrSheet({ table, tableUrl, shopName, isLast }: PrintQrSheetProps) {
  return (
    <Box
      className="table-qr-print-sheet"
      sx={{
        width: '148mm',
        height: '210mm',
        mx: 'auto',
        position: 'relative',
        overflow: 'hidden',
        color: '#3D1714',
        bgcolor: '#FFF8EE',
        breakAfter: isLast ? 'auto' : 'page',
        pageBreakAfter: isLast ? 'auto' : 'always',
        printColorAdjust: 'exact',
        WebkitPrintColorAdjust: 'exact',
      }}
    >
      <Box
        sx={{
          height: '50mm',
          position: 'relative',
          overflow: 'hidden',
          color: 'common.white',
          textAlign: 'center',
          background: 'linear-gradient(145deg, #67100E 0%, #A31F18 62%, #D65A2E 100%)',
          '&::before': {
            content: '""',
            position: 'absolute',
            width: '45mm',
            height: '45mm',
            top: '-24mm',
            right: '-8mm',
            borderRadius: '50%',
            bgcolor: 'rgba(255,255,255,0.10)',
          },
          '&::after': {
            content: '""',
            position: 'absolute',
            width: '26mm',
            height: '26mm',
            bottom: '-16mm',
            left: '-7mm',
            borderRadius: '50%',
            bgcolor: 'rgba(255,211,89,0.18)',
          },
        }}
      >
        <Stack alignItems="center" sx={{ pt: '7mm', position: 'relative', zIndex: 1 }}>
          <Box
            sx={{
              width: '22mm',
              height: '22mm',
              p: '2mm',
              display: 'grid',
              placeItems: 'center',
              borderRadius: '50%',
              bgcolor: 'common.white',
              boxShadow: '0 3mm 8mm rgba(45,0,0,0.25)',
            }}
          >
            <Logo disabled sx={{ width: 1, height: 1 }} />
          </Box>
          <Typography
            sx={{
              mt: '2.5mm',
              color: 'common.white',
              fontSize: '15pt',
              lineHeight: 1.2,
              fontWeight: 800,
            }}
          >
            {shopName}
          </Typography>
        </Stack>
      </Box>

      <Box
        sx={{
          position: 'absolute',
          top: '43mm',
          left: '50%',
          zIndex: 2,
          minWidth: '48mm',
          px: '6mm',
          py: '2.2mm',
          borderRadius: '10mm',
          color: '#67100E',
          bgcolor: '#FFD563',
          textAlign: 'center',
          transform: 'translateX(-50%)',
          boxShadow: '0 2mm 5mm rgba(103,16,14,0.16)',
        }}
      >
        <Typography sx={{ fontSize: '18pt', lineHeight: 1.1, fontWeight: 900 }}>
          โต๊ะ {table.label}
        </Typography>
      </Box>

      <Stack alignItems="center" sx={{ px: '10mm', pt: '11mm', position: 'relative', zIndex: 1 }}>
        <Typography
          sx={{
            mt: '2mm',
            fontSize: '22pt',
            lineHeight: 1.15,
            fontWeight: 900,
            textAlign: 'center',
          }}
        >
          สแกนเพื่อสั่งอาหาร
        </Typography>
        <Typography sx={{ mt: '1.5mm', color: '#82635F', fontSize: '11pt', textAlign: 'center' }}>
          เลือกเมนู ส่งออเดอร์ และติดตามสถานะได้จากมือถือของคุณ
        </Typography>

        <Box
          sx={{
            mt: '5mm',
            p: '4mm',
            lineHeight: 0,
            position: 'relative',
            borderRadius: '7mm',
            bgcolor: 'common.white',
            border: '1.2mm solid #67100E',
            boxShadow: '0 4mm 10mm rgba(103,16,14,0.15)',
            '& svg': { width: '78mm', height: '78mm' },
          }}
        >
          <QRCodeSVG value={tableUrl} size={380} level="H" marginSize={1} />
          <Box
            sx={{
              position: 'absolute',
              top: '10mm',
              right: '-13mm',
              px: '4mm',
              py: '1.5mm',
              borderRadius: '2mm',
              color: '#3D1714',
              bgcolor: '#FFD563',
              fontSize: '11pt',
              lineHeight: 1,
              fontWeight: 900,
              transform: 'rotate(8deg)',
              boxShadow: '0 1mm 3mm rgba(61,23,20,0.16)',
            }}
          >
            SCAN
          </Box>
        </Box>

        <Stack direction="row" spacing="3mm" sx={{ mt: '5mm', width: 1 }}>
          {[
            ['1', 'เปิดกล้อง'],
            ['2', 'สแกน QR'],
            ['3', 'เลือกเมนู'],
          ].map(([step, label]) => (
            <Stack key={step} direction="row" spacing="2mm" alignItems="center" sx={{ flex: 1 }}>
              <Box
                sx={{
                  width: '7mm',
                  height: '7mm',
                  display: 'grid',
                  placeItems: 'center',
                  flexShrink: 0,
                  borderRadius: '50%',
                  color: 'common.white',
                  bgcolor: '#8D1814',
                  fontSize: '9pt',
                  fontWeight: 800,
                }}
              >
                {step}
              </Box>
              <Typography sx={{ fontSize: '9.5pt', fontWeight: 700 }}>{label}</Typography>
            </Stack>
          ))}
        </Stack>
      </Stack>

      <Box
        sx={{
          position: 'absolute',
          left: 0,
          right: 0,
          bottom: 0,
          height: '17mm',
          display: 'grid',
          placeItems: 'center',
          color: 'common.white',
          bgcolor: '#67100E',
          textAlign: 'center',
        }}
      >
        <Typography sx={{ fontSize: '10pt', fontWeight: 700 }}>
          ขอบคุณที่มาอิ่มอร่อยกับเรา 🍜
        </Typography>
      </Box>
    </Box>
  );
}

export function AdminTablesView({ initialTables, shopName }: Props) {
  const [tables, setTables] = useState(initialTables);
  const [createDialogOpen, setCreateDialogOpen] = useState(false);
  const [busyId, setBusyId] = useState<string | null>(null);
  const [origin, setOrigin] = useState('');
  const { confirm, dialog } = useConfirmDialog();

  useEffect(() => {
    setOrigin(window.location.origin);
  }, []);

  const getTableUrl = (label: string) => `${origin}/?table=${encodeURIComponent(label)}`;

  const handleCreate = async (label: string) => {
    const table = await createTable(label);
    setTables((current) => [...current, table]);
    toast.success(`เพิ่มโต๊ะ “${table.label}” แล้ว`);
  };

  const handleDelete = async (table: RestaurantTable) => {
    const confirmed = await confirm({
      content: `ลบโต๊ะ "${table.label}" ใช่หรือไม่? QR Code ของโต๊ะนี้จะใช้งานไม่ได้`,
      confirmLabel: 'ลบ',
    });
    if (!confirmed) return;

    setBusyId(table.id);
    try {
      await deleteTable(table.id);
      setTables((current) => current.filter((item) => item.id !== table.id));
      toast.success(`ลบโต๊ะ “${table.label}” แล้ว`);
    } catch (error) {
      toast.error(error instanceof Error ? error.message : 'ลบไม่สำเร็จ');
    } finally {
      setBusyId(null);
    }
  };

  const handleMove = async (table: RestaurantTable, direction: 'up' | 'down') => {
    const index = tables.findIndex((item) => item.id === table.id);
    const swapIndex = direction === 'up' ? index - 1 : index + 1;
    if (swapIndex < 0 || swapIndex >= tables.length || busyId) return;

    const previousTables = tables;
    const reorderedTables = [...tables];
    [reorderedTables[index], reorderedTables[swapIndex]] = [
      reorderedTables[swapIndex],
      reorderedTables[index],
    ];
    setTables(reorderedTables);

    setBusyId(table.id);
    try {
      await moveTable(table.id, direction);
    } catch (error) {
      setTables(previousTables);
      toast.error(error instanceof Error ? error.message : 'ย้ายลำดับไม่สำเร็จ');
    } finally {
      setBusyId(null);
    }
  };

  const handleCopyLink = async (table: RestaurantTable) => {
    if (!origin) return;

    try {
      await navigator.clipboard.writeText(getTableUrl(table.label));
      toast.success(`คัดลอกลิงก์โต๊ะ ${table.label} แล้ว`);
    } catch {
      toast.error('คัดลอกลิงก์ไม่สำเร็จ');
    }
  };

  return (
    <Box sx={{ pb: 4, '@media print': { pb: 0 } }}>
      <GlobalStyles
        styles={{
          '@page': { size: 'A5 portrait', margin: 0 },
          '@media print': {
            'html, body': {
              width: '148mm',
              margin: 0,
              padding: 0,
              backgroundColor: '#FFFFFF',
            },
            body: {
              printColorAdjust: 'exact',
              WebkitPrintColorAdjust: 'exact',
            },
            '.minimal__layout__header, .minimal__layout__nav__root': { display: 'none !important' },
            '.minimal__layout__sidebar__container': { paddingLeft: '0 !important' },
            '.minimal__layout__main': { marginTop: '0 !important' },
            '.minimal__layout__main__content': {
              width: '148mm !important',
              maxWidth: '148mm !important',
              margin: '0 !important',
              padding: '0 !important',
            },
          },
        }}
      />
      <Box
        sx={{
          p: { xs: 2.5, sm: 3.5 },
          mb: 3,
          position: 'relative',
          overflow: 'hidden',
          borderRadius: 3,
          color: 'common.white',
          background: 'linear-gradient(135deg, #67100E 0%, #A31F18 58%, #DA6435 100%)',
          boxShadow: '0 16px 38px rgba(103,16,14,0.18)',
          '@media print': { display: 'none' },
          '&::before': {
            content: '""',
            position: 'absolute',
            width: 180,
            height: 180,
            right: 70,
            bottom: -135,
            borderRadius: '50%',
            bgcolor: 'rgba(255,255,255,0.07)',
          },
          '&::after': {
            content: '""',
            position: 'absolute',
            width: 230,
            height: 230,
            top: -130,
            right: -55,
            borderRadius: '50%',
            bgcolor: 'rgba(255,255,255,0.09)',
          },
        }}
      >
        <Stack
          direction={{ xs: 'column', sm: 'row' }}
          alignItems={{ xs: 'flex-start', sm: 'center' }}
          justifyContent="space-between"
          spacing={2.5}
          sx={{ position: 'relative', zIndex: 1 }}
        >
          <Box>
            <Typography variant="h3" sx={{ color: 'inherit' }}>
              โต๊ะและ QR Code
            </Typography>
            <Typography sx={{ mt: 0.75, color: 'rgba(255,255,255,0.78)' }}>
              สร้าง QR ประจำโต๊ะ เพื่อให้ลูกค้าสแกนแล้วเริ่มสั่งอาหารได้ทันที
            </Typography>
          </Box>

          <Stack direction="row" spacing={1} useFlexGap flexWrap="wrap">
            <Chip
              icon={<Iconify icon={'solar:qr-code-bold' as IconifyName} width={18} />}
              label={`${tables.length} โต๊ะ`}
              sx={{ color: 'common.white', bgcolor: 'rgba(255,255,255,0.16)' }}
            />
            <Button
              variant="contained"
              disabled={Boolean(busyId)}
              onClick={() => setCreateDialogOpen(true)}
              startIcon={<Iconify icon="mingcute:add-line" width={20} />}
              sx={{
                color: 'common.white',
                bgcolor: 'rgba(255,255,255,0.16)',
                '&:hover': { bgcolor: 'rgba(255,255,255,0.24)' },
              }}
            >
              เพิ่มโต๊ะใหม่
            </Button>
            <Button
              variant="contained"
              disabled={tables.length === 0 || !origin}
              onClick={() => window.print()}
              startIcon={<Iconify icon="solar:printer-minimalistic-bold" width={20} />}
              sx={{
                color: 'primary.darker',
                bgcolor: 'common.white',
                '&:hover': { bgcolor: 'grey.100' },
              }}
            >
              พิมพ์ QR ขนาด A5
            </Button>
          </Stack>
        </Stack>
      </Box>

      <Card
        sx={{
          width: 1,
          minWidth: 0,
          p: { xs: 2, sm: 3 },
          borderRadius: 3,
          border: '1px solid',
          borderColor: 'divider',
          boxShadow: '0 10px 30px rgba(33,43,54,0.06)',
          '@media print': { p: 0, border: 0, boxShadow: 'none' },
        }}
      >
        <Stack
          direction={{ xs: 'column', sm: 'row' }}
          alignItems={{ xs: 'flex-start', sm: 'center' }}
          justifyContent="space-between"
          spacing={1}
          sx={{ mb: 2.5, '@media print': { display: 'none' } }}
        >
          <Box>
            <Typography variant="h5">QR พร้อมใช้งาน</Typography>
            <Typography variant="body2" sx={{ mt: 0.5, color: 'text.secondary' }}>
              พิมพ์ QR แล้วนำไปติดที่โต๊ะ หรือลอกลิงก์เพื่อส่งให้ลูกค้า
            </Typography>
          </Box>
          <Chip
            size="small"
            variant="outlined"
            label={`${tables.length} รายการ`}
            sx={{ '@media print': { display: 'none' } }}
          />
        </Stack>

        {tables.length === 0 ? (
          <Box
            sx={{
              py: 7,
              px: 2,
              textAlign: 'center',
              borderRadius: 2.5,
              border: '1px dashed',
              borderColor: 'divider',
              bgcolor: 'grey.50',
              '@media print': { display: 'none' },
            }}
          >
            <Iconify icon={'solar:qr-code-bold' as IconifyName} width={54} color="text.disabled" />
            <Typography variant="h6" sx={{ mt: 1.5 }}>
              ยังไม่มีโต๊ะ
            </Typography>
            <Typography variant="body2" sx={{ mt: 0.5, color: 'text.secondary' }}>
              เพิ่มโต๊ะแรกจากแบบฟอร์มด้านบน ระบบจะสร้าง QR ให้ทันที
            </Typography>
          </Box>
        ) : (
          <Box
            sx={{
              display: 'grid',
              gap: 2,
              gridTemplateColumns: {
                xs: 'repeat(1, minmax(0, 1fr))',
                sm: 'repeat(3, minmax(0, 1fr))',
                xl: 'repeat(3, minmax(0, 1fr))',
              },
              '@media print': { display: 'none' },
            }}
          >
            {tables.map((table, index) => {
              const isBusy = busyId === table.id;
              const tableUrl = origin ? getTableUrl(table.label) : '';

              return (
                <Box
                  key={table.id}
                  sx={{
                    position: 'relative',
                    overflow: 'hidden',
                    borderRadius: 2.5,
                    border: '1px solid',
                    borderColor: 'divider',
                    bgcolor: 'background.paper',
                    boxShadow: '0 5px 18px rgba(33,43,54,0.05)',
                    breakInside: 'avoid',
                    '@media print': {
                      border: '1px solid #C4CDD5',
                      boxShadow: 'none',
                    },
                  }}
                >
                  <Stack
                    direction="row"
                    alignItems="center"
                    justifyContent="space-between"
                    sx={{ px: 2, py: 1.5, bgcolor: 'grey.50' }}
                  >
                    <Stack direction="row" spacing={1} alignItems="center">
                      <Box
                        sx={{
                          width: 30,
                          height: 30,
                          display: 'grid',
                          placeItems: 'center',
                          borderRadius: 1.25,
                          color: 'primary.main',
                          bgcolor: 'primary.lighter',
                          typography: 'caption',
                          fontWeight: 800,
                          '@media print': { display: 'none' },
                        }}
                      >
                        {index + 1}
                      </Box>
                      <Typography variant="h6">โต๊ะ {table.label}</Typography>
                    </Stack>
                    <Chip size="small" color="success" variant="soft" label="พร้อมใช้" />
                  </Stack>

                  <Stack alignItems="center" spacing={1.25} sx={{ p: 2 }}>
                    <Box
                      sx={{
                        p: 1.25,
                        lineHeight: 0,
                        borderRadius: 2,
                        border: '1px solid',
                        borderColor: 'divider',
                        bgcolor: 'common.white',
                      }}
                    >
                      {tableUrl ? (
                        <QRCodeSVG value={tableUrl} size={180} level="M" marginSize={1} />
                      ) : (
                        <Box sx={{ width: 180, height: 180 }} />
                      )}
                    </Box>
                    <Typography variant="subtitle2">สแกนเพื่อสั่งอาหาร</Typography>
                    <Typography
                      variant="caption"
                      noWrap
                      sx={{ width: 1, px: 1, color: 'text.secondary', textAlign: 'center' }}
                    >
                      {tableUrl || 'กำลังสร้างลิงก์...'}
                    </Typography>
                  </Stack>

                  <Divider sx={{ '@media print': { display: 'none' } }} />

                  <Stack
                    direction="row"
                    alignItems="center"
                    justifyContent="space-between"
                    sx={{ px: 1.25, py: 0.75, '@media print': { display: 'none' } }}
                  >
                    <Tooltip title="คัดลอกลิงก์">
                      <span>
                        <Button
                          size="small"
                          color="inherit"
                          disabled={!tableUrl || isBusy}
                          onClick={() => void handleCopyLink(table)}
                          startIcon={<Iconify icon="solar:copy-bold" width={17} />}
                        >
                          คัดลอกลิงก์
                        </Button>
                      </span>
                    </Tooltip>

                    <Stack direction="row" spacing={0.25}>
                      <Tooltip title="เลื่อนขึ้น">
                        <span>
                          <IconButton
                            size="small"
                            disabled={index === 0 || isBusy || Boolean(busyId)}
                            onClick={() => void handleMove(table, 'up')}
                          >
                            <Iconify icon="eva:arrow-upward-fill" width={17} />
                          </IconButton>
                        </span>
                      </Tooltip>
                      <Tooltip title="เลื่อนลง">
                        <span>
                          <IconButton
                            size="small"
                            disabled={index === tables.length - 1 || isBusy || Boolean(busyId)}
                            onClick={() => void handleMove(table, 'down')}
                          >
                            <Iconify icon="eva:arrow-downward-fill" width={17} />
                          </IconButton>
                        </span>
                      </Tooltip>
                      <Tooltip title="ลบโต๊ะ">
                        <span>
                          <IconButton
                            size="small"
                            color="error"
                            disabled={isBusy || Boolean(busyId)}
                            onClick={() => void handleDelete(table)}
                            aria-label={`ลบโต๊ะ ${table.label}`}
                          >
                            <Iconify
                              icon={
                                isBusy ? 'solar:clock-circle-bold' : 'solar:trash-bin-trash-bold'
                              }
                              width={18}
                            />
                          </IconButton>
                        </span>
                      </Tooltip>
                    </Stack>
                  </Stack>
                </Box>
              );
            })}
          </Box>
        )}

        {tables.length > 0 && origin && (
          <Box sx={{ display: 'none', '@media print': { display: 'block' } }}>
            {tables.map((table, index) => (
              <PrintQrSheet
                key={table.id}
                table={table}
                tableUrl={getTableUrl(table.label)}
                shopName={shopName}
                isLast={index === tables.length - 1}
              />
            ))}
          </Box>
        )}
      </Card>

      <TableFormDialog
        open={createDialogOpen}
        existingLabels={tables.map((table) => table.label)}
        onClose={() => setCreateDialogOpen(false)}
        onSubmit={handleCreate}
      />

      {dialog}
    </Box>
  );
}
