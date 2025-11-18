// src/styles/doctor/DoctorAppointmentsStyles.js

import { StyleSheet } from 'react-native';
import { theme } from '../../theme/theme';

const { COLORS, SPACING, SHADOWS } = theme;

// Nếu theme chưa có BORDER_RADIUS → mình dùng số cố định luôn, không lỗi nữa!
const BORDER_RADIUS = {
  lg: 16,
  xl: 20,
  xxl: 28,
};

export const DoctorAppointmentsStyles = StyleSheet.create({
  container: { flex: 1, backgroundColor: COLORS.background },

  headerGradient: {
    paddingTop: 50,
    paddingBottom: SPACING.xl,
    paddingHorizontal: SPACING.lg,
  },
  headerContent: { flexDirection: 'row', alignItems: 'center' },
  headerTitle: {
    flex: 1,
    marginLeft: SPACING.lg,
    fontSize: 22,
    fontWeight: '700',
    color: COLORS.textOnPrimary,
  },

  // TAB BAR SIÊU ĐẸP
  tabBarContainer: {
    flexDirection: 'row',
    backgroundColor: '#f8fafc',
    marginHorizontal: SPACING.lg,
    marginTop: SPACING.md,
    marginBottom: SPACING.lg,
    padding: 6,
    borderRadius: BORDER_RADIUS.xl,
    ...SHADOWS.small,
  },
  tabButton: isActive => ({
    flex: 1,
    height: 48,
    justifyContent: 'center',
    alignItems: 'center',
    borderRadius: 16,
    backgroundColor: isActive ? COLORS.primary : '#e2e8f0',
    marginHorizontal: 4,
    ...SHADOWS.small,
  }),
  tabText: isActive => ({
    fontSize: 13.5,
    fontWeight: '800',
    color: isActive ? '#ffffff' : '#475569',
    letterSpacing: 0.6,
    textAlign: 'center',
    includeFontPadding: false,
  }),

  itemWrapper: { marginHorizontal: SPACING.lg, marginBottom: SPACING.lg },
  itemCard: {
    borderRadius: BORDER_RADIUS.xl,
    overflow: 'hidden',
    backgroundColor: COLORS.surface,
    ...SHADOWS.card,
  },
  cardContent: { padding: SPACING.lg },

  itemHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: SPACING.md,
  },
  patientName: { fontSize: 15, fontWeight: '600', color: COLORS.textPrimary },
  statusBadge: { paddingHorizontal: 12, paddingVertical: 5, borderRadius: 20 },
  statusText: { fontSize: 9, fontWeight: '800', color: COLORS.textOnPrimary },

  infoRow: { flexDirection: 'row', alignItems: 'center', marginBottom: 10 },
  iconWrapper: {
    width: 32,
    height: 32,
    borderRadius: 16,
    backgroundColor: COLORS.primary + '15',
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: SPACING.md,
  },
  infoText: { flex: 1, fontSize: 13, color: COLORS.textPrimary, fontWeight: '500' },
  timeText: { fontWeight: '600', color: COLORS.primary },

  symptomsBox: {
    backgroundColor: COLORS.primary + '10',
    padding: SPACING.md,
    borderRadius: BORDER_RADIUS.lg,
    marginVertical: SPACING.md,
    borderLeftWidth: 4,
    borderLeftColor: COLORS.primary,
  },
  symptomsLabel: { fontSize: 12, fontWeight: '700', color: COLORS.primaryDark },
  symptomsText: { fontSize: 12.5, color: COLORS.textPrimary, lineHeight: 19 },

  actionContainer: { marginTop: SPACING.lg, gap: SPACING.sm },

  // NÚT CHÍNH (BẮT ĐẦU KHÁM NGAY) – FULL WIDTH
  mainActionButton: {
    borderRadius: BORDER_RADIUS.lg,
    overflow: 'hidden',
    ...SHADOWS.small,
  },

  // NÚT "XEM LẠI BỆNH ÁN" – ĐÃ FIX HOÀN HẢO: KHÔNG DÀI QUÁ, KHÔNG CAO QUÁ, KHÔNG LỖI!
secondaryActionButton: {
  alignSelf: 'center',
  height: 52,
  paddingHorizontal: 36,
  borderRadius: 26,
  overflow: 'hidden',
  marginTop: 20,
  // BỎ HẾT BÓNG ĐI – SẠCH SẼ 100%
  backgroundColor: 'transparent',
},

  mainActionButtonGradient: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 15,
    borderRadius: BORDER_RADIUS.lg,
  },
  mainActionButtonText: {
    marginLeft: 10,
    fontSize: 14,
    fontWeight: '700',
    color: COLORS.textOnPrimary,
  },

  confirmButton: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: COLORS.success,
    paddingVertical: 13,
    borderRadius: BORDER_RADIUS.lg,
    ...SHADOWS.small,
  },
  cancelButton: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: COLORS.danger,
    paddingVertical: 13,
    borderRadius: BORDER_RADIUS.lg,
    ...SHADOWS.small,
  },
  actionButtonText: {
    marginLeft: 8,
    fontSize: 13,
    fontWeight: '700',
    color: COLORS.textOnPrimary,
  },

  centeredView: { flex: 1, justifyContent: 'center', alignItems: 'center', paddingHorizontal: 32 },
  loadingText: { marginTop: 16, fontSize: 14, color: COLORS.textSecondary },
  errorText: { marginTop: 16, fontSize: 15, color: COLORS.danger, textAlign: 'center' },
  emptyText: { marginTop: 24, fontSize: 16, color: COLORS.textSecondary, textAlign: 'center', lineHeight: 24 },
  retryButton: {
    marginTop: 24,
    backgroundColor: COLORS.primary,
    paddingHorizontal: 32,
    paddingVertical: 13,
    borderRadius: BORDER_RADIUS.xl,
  },
});