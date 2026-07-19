import type { MenuItem } from '../menu-data';
import type { IconifyName } from 'src/components/iconify';

import Box from '@mui/material/Box';
import Stack from '@mui/material/Stack';
import Badge from '@mui/material/Badge';
import ButtonBase from '@mui/material/ButtonBase';
import Typography from '@mui/material/Typography';

import { Iconify } from 'src/components/iconify';

// ----------------------------------------------------------------------

type Props = {
  items: MenuItem[];
  quantities: Record<string, number>;
  onAdd: (id: string) => void;
};

export function BestSellerStrip({ items, quantities, onAdd }: Props) {
  if (items.length === 0) return null;

  return (
    <Box sx={{ pt: 3, pb: 1.5, borderColor: 'grey.200' }}>
      <Stack
        direction="row"
        alignItems="flex-end"
        justifyContent="space-between"
        sx={{ px: 2.5, mb: 1.5 }}
      >
        <Box>
          <Stack direction="row" alignItems="center" spacing={0.75}>
            <Box
              sx={{
                width: 30,
                height: 30,
                display: 'grid',
                placeItems: 'center',
                borderRadius: '50%',
                bgcolor: 'error.lighter',
              }}
            >
              <Iconify
                icon={'solar:fire-bold' as IconifyName}
                width={18}
                sx={{ color: 'error.main' }}
              />
            </Box>
            <Typography variant="h6">เมนูขายดี</Typography>
          </Stack>
          <Typography variant="caption" sx={{ mt: 0.5, color: 'text.secondary' }}>
            เมนูยอดนิยมที่ลูกค้าสั่งบ่อย
          </Typography>
        </Box>
        <Typography variant="caption" sx={{ color: 'text.secondary' }}>
          เลื่อนดู →
        </Typography>
      </Stack>

      <Stack
        direction="row"
        spacing={1.5}
        sx={{
          px: 2.5,
          pb: 1,
          overflowX: 'auto',
          '&::-webkit-scrollbar': { display: 'none' },
        }}
      >
        {items.map((item) => (
          <ButtonBase
            key={item.id}
            onClick={() => onAdd(item.id)}
            aria-label={`เพิ่ม ${item.name} ลงตะกร้า`}
            sx={{
              flexShrink: 0,
              width: 132,
              p: 1,
              display: 'flex',
              flexDirection: 'column',
              alignItems: 'flex-start',
              scrollSnapAlign: 'start',
              borderRadius: 2.5,
              bgcolor: 'common.white',
              border: '1px solid',
              borderColor: 'grey.200',
              boxShadow: '0 4px 14px rgba(69,37,20,0.06)',
            }}
          >
            <Badge
              badgeContent={quantities[item.id] ?? 0}
              color="primary"
              sx={{ width: 1, '& .MuiBadge-badge': { right: 7, top: 7 } }}
            >
              <Box
                sx={{
                  width: 1,
                  height: 104,
                  borderRadius: 1.75,
                  display: 'grid',
                  placeItems: 'center',
                  fontSize: 38,
                  bgcolor: '#F7F2EC',
                  backgroundImage: item.imageUrl ? `url(${item.imageUrl})` : undefined,
                  backgroundSize: 'cover',
                  backgroundPosition: 'center',
                }}
              >
                {!item.imageUrl && item.emoji}
              </Box>
            </Badge>
            <Typography
              variant="subtitle2"
              sx={{
                mt: 1,
                width: 1,
                textAlign: 'left',
                display: '-webkit-box',
                WebkitBoxOrient: 'vertical',
                WebkitLineClamp: 1,
                overflow: 'hidden',
              }}
            >
              {item.name}
            </Typography>
            <Stack
              direction="row"
              alignItems="center"
              justifyContent="space-between"
              sx={{ mt: 0.25, width: 1 }}
            >
              <Typography variant="subtitle2" sx={{ color: 'primary.main' }}>
                ฿{item.price}
              </Typography>
              <Box
                sx={{
                  width: 26,
                  height: 26,
                  display: 'grid',
                  placeItems: 'center',
                  borderRadius: '50%',
                  color: 'common.white',
                  bgcolor: 'primary.main',
                }}
              >
                <Iconify icon="mingcute:add-line" width={17} />
              </Box>
            </Stack>
          </ButtonBase>
        ))}
      </Stack>
    </Box>
  );
}
