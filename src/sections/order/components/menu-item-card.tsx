import type { MenuItem } from '../menu-data';

import Box from '@mui/material/Box';
import Stack from '@mui/material/Stack';
import IconButton from '@mui/material/IconButton';
import Typography from '@mui/material/Typography';

import { Iconify } from 'src/components/iconify';

// ----------------------------------------------------------------------

type Props = {
  item: MenuItem;
  quantity: number;
  onAdd: (id: string) => void;
  onRemove: (id: string) => void;
};

export function MenuItemCard({ item, quantity, onAdd, onRemove }: Props) {
  return (
    <Stack
      direction="row"
      spacing={1.5}
      sx={{
        p: 1.5,
        borderRadius: 2,
        border: '1px solid',
        borderColor: 'grey.200',
        alignItems: 'center',
      }}
    >
      <Box
        sx={{
          width: 120,
          height: 120,
          flexShrink: 0,
          borderRadius: 1.5,
          display: 'grid',
          placeItems: 'center',
          fontSize: 28,
          bgcolor: 'grey.100',
          backgroundImage: item.imageUrl ? `url(${item.imageUrl})` : undefined,
          backgroundSize: 'cover',
          backgroundPosition: 'center',
        }}
      >
        {!item.imageUrl && item.emoji}
      </Box>

      <Box sx={{ flex: 1, minWidth: 0 }}>
        <Typography variant="subtitle2" noWrap>
          {item.name}
        </Typography>
        <Typography
          variant="caption"
          sx={{
            color: 'text.secondary',
            display: '-webkit-box',
            WebkitBoxOrient: 'vertical',
            WebkitLineClamp: 2,
            overflow: 'hidden',
          }}
        >
          {item.description}
        </Typography>
        <Typography variant="subtitle2" sx={{ mt: 0.5, color: 'primary.main' }}>
          {item.price} บาท
        </Typography>
      </Box>

      {quantity === 0 ? (
        <IconButton
          onClick={() => onAdd(item.id)}
          size="small"
          sx={{
            color: 'common.white',
            bgcolor: 'primary.main',
            '&:hover': { bgcolor: 'primary.dark' },
          }}
        >
          <Iconify icon="mingcute:add-line" width={18} />
        </IconButton>
      ) : (
        <Stack direction="row" spacing={0.5} alignItems="center" sx={{ flexShrink: 0 }}>
          <IconButton size="small" color="primary" onClick={() => onRemove(item.id)}>
            <Iconify icon="eva:minus-circle-fill" width={22} />
          </IconButton>
          <Typography variant="subtitle2" sx={{ minWidth: 18, textAlign: 'center' }}>
            {quantity}
          </Typography>
          <IconButton size="small" color="primary" onClick={() => onAdd(item.id)}>
            <Iconify icon="solar:add-circle-bold" width={22} />
          </IconButton>
        </Stack>
      )}
    </Stack>
  );
}
