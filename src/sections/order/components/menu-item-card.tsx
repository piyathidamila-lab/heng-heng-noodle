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
        p: 1.25,
        minHeight: 118,
        borderRadius: 2.5,
        border: '1px solid',
        borderColor: 'grey.200',
        alignItems: 'center',
        bgcolor: 'common.white',
        boxShadow: '0 4px 16px rgba(69,37,20,0.05)',
      }}
    >
      <Box
        sx={{
          width: 96,
          height: 96,
          flexShrink: 0,
          borderRadius: 2,
          display: 'grid',
          placeItems: 'center',
          fontSize: 32,
          bgcolor: '#F7F2EC',
          backgroundImage: item.imageUrl ? `url(${item.imageUrl})` : undefined,
          backgroundSize: 'cover',
          backgroundPosition: 'center',
        }}
      >
        {!item.imageUrl && item.emoji}
      </Box>

      <Box sx={{ flex: 1, minWidth: 0 }}>
        <Typography
          variant="subtitle2"
          sx={{
            display: '-webkit-box',
            WebkitBoxOrient: 'vertical',
            WebkitLineClamp: 2,
            overflow: 'hidden',
          }}
        >
          {item.name}
        </Typography>
        {!!item.description && (
          <Typography
            variant="caption"
            sx={{
              mt: 0.25,
              color: 'text.secondary',
              display: '-webkit-box',
              WebkitBoxOrient: 'vertical',
              WebkitLineClamp: 2,
              overflow: 'hidden',
            }}
          >
            {item.description}
          </Typography>
        )}
        <Typography variant="subtitle2" sx={{ mt: 0.5, color: 'primary.main' }}>
          ฿{item.price}
        </Typography>
      </Box>

      {quantity === 0 ? (
        <IconButton
          onClick={() => onAdd(item.id)}
          aria-label={`เพิ่ม ${item.name} ลงตะกร้า`}
          sx={{
            width: 38,
            height: 38,
            color: 'common.white',
            bgcolor: 'primary.main',
            boxShadow: '0 5px 12px rgba(139,17,17,0.20)',
            '&:hover': { bgcolor: 'primary.dark' },
          }}
        >
          <Iconify icon="mingcute:add-line" width={21} />
        </IconButton>
      ) : (
        <Stack
          direction="column-reverse"
          spacing={0.25}
          alignItems="center"
          sx={{ flexShrink: 0 }}
        >
          <IconButton
            size="small"
            color="primary"
            onClick={() => onRemove(item.id)}
            aria-label={`ลดจำนวน ${item.name}`}
          >
            <Iconify icon="eva:minus-circle-fill" width={22} />
          </IconButton>
          <Typography variant="subtitle2" sx={{ minWidth: 18, textAlign: 'center' }}>
            {quantity}
          </Typography>
          <IconButton
            size="small"
            color="primary"
            onClick={() => onAdd(item.id)}
            aria-label={`เพิ่มจำนวน ${item.name}`}
          >
            <Iconify icon="solar:add-circle-bold" width={22} />
          </IconButton>
        </Stack>
      )}
    </Stack>
  );
}
