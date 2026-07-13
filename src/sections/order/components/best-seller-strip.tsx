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
    <Box sx={{ pt: 2, pb: 1, borderColor: 'grey.200' }}>
      <Stack direction="row" alignItems="center" spacing={0.5} sx={{ px: 2.5, mb: 1.5 }}>
        <Iconify icon={'solar:fire-bold' as IconifyName} width={18} sx={{ color: 'error.main' }} />
        <Typography variant="subtitle2">เมนูขายดี</Typography>
      </Stack>

      <Stack
        direction="row"
        spacing={1.5}
        sx={{
          px: 2.5,
          pb: 0.5,
          overflowX: 'auto',
          scrollSnapType: 'x proximity',
          '&::-webkit-scrollbar': { display: 'none' },
        }}
      >
        {items.map((item) => (
          <ButtonBase
            key={item.id}
            onClick={() => onAdd(item.id)}
            sx={{
              flexShrink: 0,
              width: 92,
              display: 'flex',
              flexDirection: 'column',
              alignItems: 'flex-start',
              scrollSnapAlign: 'start',
              borderRadius: 2,
            }}
          >
            <Badge
              badgeContent={quantities[item.id] ?? 0}
              color="primary"
              sx={{ '& .MuiBadge-badge': { right: 6, top: 6 } }}
            >
              <Box
                sx={{
                  width: 92,
                  height: 92,
                  borderRadius: 2,
                  display: 'grid',
                  placeItems: 'center',
                  fontSize: 36,
                  bgcolor: 'grey.100',
                  backgroundImage: item.imageUrl ? `url(${item.imageUrl})` : undefined,
                  backgroundSize: 'cover',
                  backgroundPosition: 'center',
                }}
              >
                {!item.imageUrl && item.emoji}
              </Box>
            </Badge>
            <Typography variant="caption" noWrap sx={{ mt: 0.75, width: 1, textAlign: 'left' }}>
              {item.name}
            </Typography>
            <Typography variant="caption" sx={{ color: 'primary.main', fontWeight: 600 }}>
              {item.price} บาท
            </Typography>
          </ButtonBase>
        ))}
      </Stack>
    </Box>
  );
}
