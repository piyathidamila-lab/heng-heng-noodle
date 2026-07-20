'use client';

import type { ReactElement } from 'react';
import type { LoyaltyConfig } from 'src/lib/shop-settings-service';
import type {
  RewardInput,
  MemberSummary,
  LoyaltyReward,
  LoyaltyRedemption,
} from 'src/lib/loyalty-service';

import { useMemo, useState } from 'react';

import Box from '@mui/material/Box';
import Tab from '@mui/material/Tab';
import Card from '@mui/material/Card';
import Tabs from '@mui/material/Tabs';
import Grid from '@mui/material/Grid';
import Chip from '@mui/material/Chip';
import Stack from '@mui/material/Stack';
import Switch from '@mui/material/Switch';
import Button from '@mui/material/Button';
import Divider from '@mui/material/Divider';
import Tooltip from '@mui/material/Tooltip';
import TextField from '@mui/material/TextField';
import IconButton from '@mui/material/IconButton';
import Typography from '@mui/material/Typography';
import InputAdornment from '@mui/material/InputAdornment';

import { fDate } from 'src/utils/format-time';

import { toast } from 'src/components/snackbar';
import { Iconify } from 'src/components/iconify';
import { useConfirmDialog } from 'src/components/custom-dialog';

import { RedemptionQueue } from './redemption-queue';
import { RewardFormDialog } from './reward-form-dialog';
import { MemberLedgerDialog } from './member-ledger-dialog';
import {
  createRewardAdmin,
  deleteRewardAdmin,
  updateRewardAdmin,
  updateLoyaltyConfigAdmin,
} from './loyalty-actions';

// ----------------------------------------------------------------------

type Props = {
  initialLoyaltyConfig: LoyaltyConfig;
  initialMembers: MemberSummary[];
  initialRewards: LoyaltyReward[];
  initialPendingRedemptions: LoyaltyRedemption[];
};

type TabValue = 'settings' | 'members' | 'rewards' | 'redemptions';

export function AdminLoyaltyView({
  initialLoyaltyConfig,
  initialMembers,
  initialRewards,
  initialPendingRedemptions,
}: Props) {
  const [tab, setTab] = useState<TabValue>('settings');
  const [config, setConfig] = useState(initialLoyaltyConfig);
  const [savingConfig, setSavingConfig] = useState(false);
  const [members] = useState(initialMembers);
  const [memberSearch, setMemberSearch] = useState('');
  const [ledgerMember, setLedgerMember] = useState<MemberSummary | null>(null);
  const [rewards, setRewards] = useState(initialRewards);
  const [rewardDialogOpen, setRewardDialogOpen] = useState(false);
  const [editingReward, setEditingReward] = useState<LoyaltyReward | null>(null);
  const [rewardSubmitting, setRewardSubmitting] = useState(false);
  const [rewardError, setRewardError] = useState<string | null>(null);
  const { confirm, dialog } = useConfirmDialog();

  const totalStars = members.reduce((sum, member) => sum + member.starsBalance, 0);
  const activeRewards = rewards.filter((reward) => reward.isActive).length;
  const normalizedSearch = memberSearch.trim().toLocaleLowerCase('th-TH');
  const filteredMembers = useMemo(
    () =>
      members.filter((member) => {
        if (!normalizedSearch) return true;
        return (
          member.phone.includes(normalizedSearch) ||
          (member.displayName ?? '').toLocaleLowerCase('th-TH').includes(normalizedSearch)
        );
      }),
    [members, normalizedSearch]
  );

  const handleSaveConfig = async () => {
    setSavingConfig(true);
    try {
      const saved = await updateLoyaltyConfigAdmin(config);
      setConfig(saved.loyalty);
      toast.success('บันทึกการตั้งค่าสะสมดาวแล้ว');
    } catch (error) {
      toast.error(error instanceof Error ? error.message : 'บันทึกไม่สำเร็จ');
    } finally {
      setSavingConfig(false);
    }
  };

  const openCreateReward = () => {
    setEditingReward(null);
    setRewardError(null);
    setRewardDialogOpen(true);
  };

  const openEditReward = (reward: LoyaltyReward) => {
    setEditingReward(reward);
    setRewardError(null);
    setRewardDialogOpen(true);
  };

  const handleSubmitReward = async (values: RewardInput) => {
    setRewardSubmitting(true);
    setRewardError(null);
    try {
      if (editingReward) {
        const updated = await updateRewardAdmin(editingReward.id, values, editingReward.imageUrl);
        setRewards((current) =>
          current.map((reward) => (reward.id === updated.id ? updated : reward))
        );
        toast.success('บันทึกของรางวัลแล้ว');
      } else {
        const created = await createRewardAdmin(values);
        setRewards((current) => [...current, created]);
        toast.success('เพิ่มของรางวัลแล้ว');
      }
      setRewardDialogOpen(false);
    } catch (error) {
      setRewardError(error instanceof Error ? error.message : 'บันทึกไม่สำเร็จ');
    } finally {
      setRewardSubmitting(false);
    }
  };

  const handleDeleteReward = async (reward: LoyaltyReward) => {
    const confirmed = await confirm({
      content: `ลบของรางวัล "${reward.name}" ใช่หรือไม่?`,
      confirmLabel: 'ลบ',
    });
    if (!confirmed) return;

    try {
      await deleteRewardAdmin(reward.id, reward.imageUrl);
      setRewards((current) => current.filter((item) => item.id !== reward.id));
      toast.success('ลบของรางวัลแล้ว');
    } catch (error) {
      toast.error(error instanceof Error ? error.message : 'ลบไม่สำเร็จ');
    }
  };

  const tabItems: { value: TabValue; label: string; icon: ReactElement; count?: number }[] = [
    {
      value: 'settings',
      label: 'ตั้งค่าดาว',
      icon: <Iconify icon="solar:settings-bold" width={20} />,
    },
    {
      value: 'members',
      label: 'สมาชิก',
      icon: <Iconify icon="solar:users-group-rounded-bold" width={20} />,
      count: members.length,
    },
    {
      value: 'rewards',
      label: 'ของรางวัล',
      icon: <Iconify icon="solar:cup-star-bold" width={20} />,
      count: rewards.length,
    },
    {
      value: 'redemptions',
      label: 'คำขอแลก',
      icon: <Iconify icon="solar:bill-list-bold-duotone" width={20} />,
      count: initialPendingRedemptions.length,
    },
  ];

  return (
    <Box sx={{ pb: 4 }}>
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
              ระบบสะสมดาว
            </Typography>
            <Typography sx={{ mt: 0.75, color: 'rgba(255,255,255,0.78)' }}>
              ดูแลสมาชิก ตั้งค่าเงื่อนไข และจัดการของรางวัลในที่เดียว
            </Typography>
          </Box>

          <Stack direction="row" spacing={1} useFlexGap flexWrap="wrap">
            <Chip
              icon={<Iconify icon="solar:cup-star-bold" width={18} />}
              label={config.enabled ? 'ระบบเปิดใช้งาน' : 'ระบบปิดอยู่'}
              sx={{ color: 'common.white', bgcolor: 'rgba(255,255,255,0.16)' }}
            />
            <Chip
              label={`${members.length} สมาชิก · ${activeRewards} ของรางวัล`}
              sx={{ color: 'common.white', bgcolor: 'rgba(255,255,255,0.16)' }}
            />
            {initialPendingRedemptions.length > 0 && (
              <Chip
                label={`รอดำเนินการ ${initialPendingRedemptions.length}`}
                sx={{ color: 'common.white', bgcolor: 'rgba(255,193,7,0.28)' }}
              />
            )}
          </Stack>
        </Stack>
      </Box>

      <Card
        sx={{
          mb: 3,
          px: { xs: 1, sm: 2 },
          borderRadius: 3,
          border: '1px solid',
          borderColor: 'divider',
          boxShadow: '0 8px 24px rgba(33,43,54,0.05)',
        }}
      >
        <Tabs
          value={tab}
          onChange={(_, nextTab: TabValue) => setTab(nextTab)}
          variant="scrollable"
          scrollButtons="auto"
          allowScrollButtonsMobile
        >
          {tabItems.map((item) => (
            <Tab
              key={item.value}
              value={item.value}
              icon={item.icon}
              iconPosition="start"
              label={
                <Stack direction="row" alignItems="center" spacing={0.75}>
                  <span>{item.label}</span>
                  {typeof item.count === 'number' && item.count > 0 && (
                    <Chip
                      size="small"
                      label={item.count}
                      color={item.value === 'redemptions' && item.count > 0 ? 'error' : 'default'}
                      sx={{ height: 21, '& .MuiChip-label': { px: 0.75 } }}
                    />
                  )}
                </Stack>
              }
              sx={{ minHeight: 68 }}
            />
          ))}
        </Tabs>
      </Card>

      {tab === 'settings' && (
        <Grid container spacing={3}>
          <Grid size={{ xs: 12, md: 8 }}>
            <Card
              sx={{
                p: { xs: 2.5, sm: 3 },
                borderRadius: 3,
                border: '1px solid',
                borderColor: 'divider',
                boxShadow: '0 10px 30px rgba(33,43,54,0.06)',
              }}
            >
              <Stack
                direction={{ xs: 'column', sm: 'row' }}
                alignItems={{ xs: 'stretch', sm: 'center' }}
                justifyContent="space-between"
                spacing={2}
                sx={{
                  p: 2,
                  borderRadius: 2.5,
                  border: '1px solid',
                  borderColor: config.enabled ? 'success.light' : 'divider',
                  bgcolor: config.enabled ? 'success.lighter' : 'grey.50',
                }}
              >
                <Stack direction="row" spacing={1.5} alignItems="center">
                  <Box
                    sx={{
                      width: 46,
                      height: 46,
                      display: 'grid',
                      placeItems: 'center',
                      flexShrink: 0,
                      borderRadius: 2,
                      color: config.enabled ? 'success.dark' : 'text.secondary',
                      bgcolor: 'common.white',
                    }}
                  >
                    <Iconify icon="solar:cup-star-bold" width={25} />
                  </Box>
                  <Box>
                    <Typography variant="h6">เปิดใช้งานระบบสะสมดาว</Typography>
                    <Typography variant="body2" sx={{ color: 'text.secondary' }}>
                      {config.enabled
                        ? 'ลูกค้ารับดาวและส่งคำขอแลกของรางวัลได้'
                        : 'ลูกค้าจะไม่ได้รับดาวและไม่สามารถแลกรางวัลได้'}
                    </Typography>
                  </Box>
                </Stack>
                <Switch
                  checked={config.enabled}
                  onChange={(event) =>
                    setConfig((current) => ({ ...current, enabled: event.target.checked }))
                  }
                  inputProps={{ 'aria-label': 'เปิดหรือปิดระบบสะสมดาว' }}
                />
              </Stack>

              <Divider sx={{ my: 3 }} />

              <Typography variant="h6">เงื่อนไขการได้รับดาว</Typography>
              <Typography variant="body2" sx={{ mt: 0.5, mb: 2.5, color: 'text.secondary' }}>
                กำหนดยอดใช้จ่ายที่ลูกค้าต้องชำระเพื่อรับดาว 1 ดวง
              </Typography>
              <TextField
                label="ยอดใช้จ่ายต่อ 1 ดาว"
                type="number"
                value={config.bahtPerStar}
                onChange={(event) =>
                  setConfig((current) => ({
                    ...current,
                    bahtPerStar: Number(event.target.value),
                  }))
                }
                slotProps={{
                  htmlInput: { min: 1 },
                  input: { endAdornment: <InputAdornment position="end">บาท</InputAdornment> },
                }}
                helperText={`ตัวอย่าง: ยอด 250 บาท จะได้รับ ${Math.floor(250 / Math.max(config.bahtPerStar, 1))} ดาว`}
                fullWidth
              />

              <Button
                variant="contained"
                size="large"
                loading={savingConfig}
                disabled={config.bahtPerStar < 1}
                onClick={handleSaveConfig}
                startIcon={<Iconify icon="solar:check-circle-bold" />}
                sx={{ mt: 3, px: 4, minWidth: 160 }}
              >
                บันทึกการตั้งค่า
              </Button>
            </Card>
          </Grid>

          <Grid size={{ xs: 12, md: 4 }}>
            <Card
              sx={{
                p: 3,
                borderRadius: 3,
                color: 'common.white',
                background: 'linear-gradient(145deg, #7A1712 0%, #B62B20 100%)',
                boxShadow: '0 14px 34px rgba(103,16,14,0.18)',
              }}
            >
              <Typography variant="overline" sx={{ color: 'rgba(255,255,255,0.7)' }}>
                ตัวอย่างการคำนวณ
              </Typography>
              <Typography variant="h2" sx={{ mt: 1, color: 'inherit' }}>
                ฿{Math.max(config.bahtPerStar, 1).toLocaleString('th-TH')}
              </Typography>
              <Typography sx={{ color: 'rgba(255,255,255,0.8)' }}>ได้รับ 1 ดาว</Typography>
              <Divider sx={{ my: 2.5, borderColor: 'rgba(255,255,255,0.16)' }} />
              <Stack spacing={1.25}>
                {[100, 250, 500].map((amount) => (
                  <Stack key={amount} direction="row" justifyContent="space-between">
                    <Typography variant="body2" sx={{ color: 'rgba(255,255,255,0.72)' }}>
                      ยอด {amount} บาท
                    </Typography>
                    <Typography variant="subtitle2" sx={{ color: 'inherit' }}>
                      {Math.floor(amount / Math.max(config.bahtPerStar, 1))} ดาว
                    </Typography>
                  </Stack>
                ))}
              </Stack>
            </Card>
          </Grid>
        </Grid>
      )}

      {tab === 'members' && (
        <Card
          sx={{
            p: { xs: 2, sm: 3 },
            borderRadius: 3,
            border: '1px solid',
            borderColor: 'divider',
            boxShadow: '0 10px 30px rgba(33,43,54,0.06)',
          }}
        >
          <Stack
            direction={{ xs: 'column', sm: 'row' }}
            alignItems={{ xs: 'stretch', sm: 'center' }}
            justifyContent="space-between"
            spacing={2}
            sx={{ mb: 2.5 }}
          >
            <Box>
              <Typography variant="h5">สมาชิกทั้งหมด</Typography>
              <Typography variant="body2" sx={{ mt: 0.5, color: 'text.secondary' }}>
                {members.length} คน · ดาวคงเหลือรวม {totalStars.toLocaleString('th-TH')} ดาว
              </Typography>
            </Box>
            <TextField
              size="small"
              value={memberSearch}
              onChange={(event) => setMemberSearch(event.target.value)}
              placeholder="ค้นหาชื่อหรือเบอร์โทร"
              sx={{ width: { xs: 1, sm: 300 } }}
              slotProps={{
                input: {
                  startAdornment: (
                    <InputAdornment position="start">
                      <Iconify icon="eva:search-fill" width={19} />
                    </InputAdornment>
                  ),
                },
              }}
            />
          </Stack>

          <Stack spacing={1.25}>
            {filteredMembers.length === 0 && (
              <Box sx={{ py: 6, textAlign: 'center', color: 'text.secondary' }}>
                <Iconify icon="solar:users-group-rounded-bold" width={48} color="text.disabled" />
                <Typography variant="h6" sx={{ mt: 1 }}>
                  {members.length === 0 ? 'ยังไม่มีสมาชิก' : 'ไม่พบสมาชิกที่ค้นหา'}
                </Typography>
              </Box>
            )}
            {filteredMembers.map((member) => (
              <Stack
                key={member.id}
                direction="row"
                alignItems="center"
                spacing={1.5}
                sx={{
                  p: 1.5,
                  borderRadius: 2.5,
                  border: '1px solid',
                  borderColor: 'divider',
                  cursor: 'pointer',
                  transition: 'border-color 150ms ease, box-shadow 150ms ease',
                  '&:hover': {
                    borderColor: 'primary.light',
                    boxShadow: '0 7px 20px rgba(33,43,54,0.07)',
                  },
                }}
                onClick={() => setLedgerMember(member)}
              >
                <Box
                  sx={{
                    width: 46,
                    height: 46,
                    display: 'grid',
                    placeItems: 'center',
                    flexShrink: 0,
                    borderRadius: '50%',
                    color: 'primary.main',
                    bgcolor: 'primary.lighter',
                    typography: 'subtitle1',
                  }}
                >
                  {(member.displayName || member.phone).slice(0, 1).toUpperCase()}
                </Box>
                <Box sx={{ flex: 1, minWidth: 0 }}>
                  <Typography variant="subtitle1" noWrap>
                    {member.displayName || member.phone}
                  </Typography>
                  <Typography variant="caption" sx={{ color: 'text.secondary' }}>
                    {member.phone} · สมัครเมื่อ {fDate(member.createdAt)}
                  </Typography>
                </Box>
                <Chip
                  label={`${member.starsBalance.toLocaleString('th-TH')} ดาว`}
                  color="warning"
                  variant="soft"
                  sx={{ flexShrink: 0 }}
                />
                <Iconify icon="eva:arrow-ios-forward-fill" width={20} color="text.disabled" />
              </Stack>
            ))}
          </Stack>
        </Card>
      )}

      {tab === 'rewards' && (
        <Card
          sx={{
            p: { xs: 2, sm: 3 },
            borderRadius: 3,
            border: '1px solid',
            borderColor: 'divider',
            boxShadow: '0 10px 30px rgba(33,43,54,0.06)',
          }}
        >
          <Stack
            direction={{ xs: 'column', sm: 'row' }}
            alignItems={{ xs: 'stretch', sm: 'center' }}
            justifyContent="space-between"
            spacing={2}
            sx={{ mb: 2.5 }}
          >
            <Box>
              <Typography variant="h5">ของรางวัล</Typography>
              <Typography variant="body2" sx={{ mt: 0.5, color: 'text.secondary' }}>
                เปิดให้แลก {activeRewards} จากทั้งหมด {rewards.length} รายการ
              </Typography>
            </Box>
            <Button
              variant="contained"
              startIcon={<Iconify icon="mingcute:add-line" width={22} />}
              onClick={openCreateReward}
            >
              เพิ่มของรางวัล
            </Button>
          </Stack>

          {rewards.length === 0 ? (
            <Box
              sx={{
                py: 7,
                textAlign: 'center',
                borderRadius: 2.5,
                border: '1px dashed',
                borderColor: 'divider',
                bgcolor: 'grey.50',
              }}
            >
              <Iconify icon="solar:cup-star-bold" width={52} color="text.disabled" />
              <Typography variant="h6" sx={{ mt: 1.5 }}>
                ยังไม่มีของรางวัล
              </Typography>
              <Typography variant="body2" sx={{ mt: 0.5, color: 'text.secondary' }}>
                เพิ่มของรางวัลพร้อมรูปภาพเพื่อเริ่มใช้งาน
              </Typography>
            </Box>
          ) : (
            <Grid container spacing={2}>
              {rewards.map((reward) => (
                <Grid key={reward.id} size={{ xs: 12, sm: 6, xl: 4 }}>
                  <Card
                    sx={{
                      height: 1,
                      overflow: 'hidden',
                      borderRadius: 2.5,
                      border: '1px solid',
                      borderColor: 'divider',
                      boxShadow: '0 5px 18px rgba(33,43,54,0.05)',
                      opacity: reward.isActive ? 1 : 0.72,
                    }}
                  >
                    <Box
                      sx={{
                        height: 180,
                        position: 'relative',
                        display: 'grid',
                        placeItems: 'center',
                        overflow: 'hidden',
                        bgcolor: 'grey.100',
                        backgroundImage: reward.imageUrl ? `url(${reward.imageUrl})` : undefined,
                        backgroundSize: 'cover',
                        backgroundPosition: 'center',
                      }}
                    >
                      {!reward.imageUrl && (
                        <Iconify icon="solar:cup-star-bold" width={54} color="text.disabled" />
                      )}
                      <Chip
                        size="small"
                        color={reward.isActive ? 'success' : 'default'}
                        label={reward.isActive ? 'เปิดให้แลก' : 'ปิดใช้งาน'}
                        sx={{ position: 'absolute', top: 12, left: 12 }}
                      />
                    </Box>

                    <Stack spacing={1.25} sx={{ p: 2 }}>
                      <Stack direction="row" alignItems="flex-start" justifyContent="space-between">
                        <Box sx={{ minWidth: 0 }}>
                          <Typography variant="h6" noWrap>
                            {reward.name}
                          </Typography>
                          <Typography
                            variant="body2"
                            sx={{
                              mt: 0.5,
                              color: 'text.secondary',
                              minHeight: 40,
                              display: '-webkit-box',
                              overflow: 'hidden',
                              WebkitBoxOrient: 'vertical',
                              WebkitLineClamp: 2,
                            }}
                          >
                            {reward.description || 'ยังไม่ได้ระบุรายละเอียดของรางวัล'}
                          </Typography>
                        </Box>
                        <Chip
                          size="small"
                          color="warning"
                          variant="soft"
                          label={`${reward.starsCost} ดาว`}
                          sx={{ ml: 1, flexShrink: 0 }}
                        />
                      </Stack>

                      <Divider />

                      <Stack direction="row" alignItems="center" justifyContent="space-between">
                        <Typography variant="caption" sx={{ color: 'text.secondary' }}>
                          ลำดับแสดงผล {reward.sortOrder}
                        </Typography>
                        <Stack direction="row" spacing={0.25}>
                          <Tooltip title="แก้ไขของรางวัล">
                            <IconButton
                              size="small"
                              onClick={() => openEditReward(reward)}
                              aria-label={`แก้ไข ${reward.name}`}
                            >
                              <Iconify icon="solar:notes-bold-duotone" width={20} />
                            </IconButton>
                          </Tooltip>
                          <Tooltip title="ลบของรางวัล">
                            <IconButton
                              size="small"
                              color="error"
                              onClick={() => handleDeleteReward(reward)}
                              aria-label={`ลบ ${reward.name}`}
                            >
                              <Iconify icon="solar:trash-bin-trash-bold" width={20} />
                            </IconButton>
                          </Tooltip>
                        </Stack>
                      </Stack>
                    </Stack>
                  </Card>
                </Grid>
              ))}
            </Grid>
          )}
        </Card>
      )}

      {tab === 'redemptions' && (
        <Card
          sx={{
            p: { xs: 2, sm: 3 },
            borderRadius: 3,
            border: '1px solid',
            borderColor: 'divider',
            boxShadow: '0 10px 30px rgba(33,43,54,0.06)',
          }}
        >
          <Stack direction="row" alignItems="center" justifyContent="space-between" sx={{ mb: 2 }}>
            <Box>
              <Typography variant="h5">คำขอแลกของรางวัล</Typography>
              <Typography variant="body2" sx={{ mt: 0.5, color: 'text.secondary' }}>
                ตรวจสอบและยืนยันเมื่อลูกค้ามารับของรางวัล
              </Typography>
            </Box>
            <Chip
              color={initialPendingRedemptions.length > 0 ? 'warning' : 'default'}
              label={`รอ ${initialPendingRedemptions.length} รายการ`}
            />
          </Stack>
          <Divider sx={{ mb: 2 }} />
          <RedemptionQueue initialRedemptions={initialPendingRedemptions} />
        </Card>
      )}

      <RewardFormDialog
        open={rewardDialogOpen}
        editing={editingReward}
        submitting={rewardSubmitting}
        error={rewardError}
        onClose={() => setRewardDialogOpen(false)}
        onSubmit={handleSubmitReward}
      />

      <MemberLedgerDialog member={ledgerMember} onClose={() => setLedgerMember(null)} />

      {dialog}
    </Box>
  );
}
