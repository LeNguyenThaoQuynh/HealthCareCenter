// src/styles/doctor/DoctorAppointmentsStyles.js
// ĐÃ HOÀN CHỈNH – ĐẸP NHƯ APP PHƯỚC EM THẬT 100%, DÙNG ĐÚNG THEME CHÍNH

import { StyleSheet, Platform } from 'react-native';
import {
  COLORS,
  GRADIENTS,
  SPACING,
  BORDER_RADIUS,
  FONT_SIZE,
  FONT_WEIGHT,
  SHADOWS,
} from '../../theme/theme';

export const DoctorAppointmentsStyles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: COLORS.background,
  },

  // ==================== HEADER ====================
  headerGradient: {
    paddingTop: Platform.OS === 'ios' ? 70 : 50,
    paddingHorizontal: SPACING.xl,
    paddingBottom: SPACING.xl,
    borderBottomLeftRadius: BORDER_RADIUS.xxl,
    borderBottomRightRadius: BORDER_RADIUS.xxl,
    overflow: 'hidden',
  },
  headerContent: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  headerTitle: {
    flex: 1,
    marginLeft: SPACING.lg,
    fontSize: 28,
    fontWeight: '800',
    color: COLORS.textOnPrimary,
  },

  // ==================== TAB BAR ====================
  tabBarContainer: {
    marginHorizontal: SPACING.xl,
    marginTop: SPACING.lg,
    marginBottom: SPACING.md,
    padding: 6,
    backgroundColor: COLORS.surface,
    borderRadius: BORDER_RADIUS.xl,
    ...SHADOWS.card,
    borderWidth: 1,
    borderColor: '#e5e7eb15',
  },
  tabButton: isActive => ({
    flex: 1,
    height: 48,
    justifyContent: 'center',
    alignItems: 'center',
    borderRadius: BORDER_RADIUS.lg,
    backgroundColor: isActive ? COLORS.primary : 'transparent',
  }),
  tabText: isActive => ({
    fontSize: FONT_SIZE.md,
    fontWeight: '700',
    color: isActive ? COLORS.textOnPrimary : COLORS.textSecondary,
  }),

  // ==================== CARD LỊCH KHÁM ====================
  itemWrapper: {
    marginHorizontal: SPACING.xl,
    marginBottom: SPACING.lg,
  },
  itemCard: {
    backgroundColor: COLORS.surface,
    borderRadius: BORDER_RADIUS.xl,
    overflow: 'hidden',
    ...SHADOWS.card,
    borderWidth: 1,
    borderColor: '#e5e7eb15',
  },
  cardContent: {
    padding: SPACING.lg,
  },

  // Header tên + trạng thái
  itemHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: SPACING.md,
  },
  patientName: {
    fontSize: 18,
    fontWeight: '700',
    color: COLORS.textPrimary,
  },
  statusBadge: {
    paddingHorizontal: SPACING.md,
    paddingVertical: 6,
    borderRadius: 20,
  },
  statusText: {
    fontSize: 11,
    fontWeight: '800',
    color: COLORS.textOnPrimary,
  },

  // Dòng thông tin (giờ, phòng, chuyên khoa)
  infoRow: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: SPACING.sm,
  },
  iconCircle: {
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: COLORS.primary + '15',
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: SPACING.md,
  },
  infoText: {
    flex: 1,
    fontSize: FONT_SIZE.base,
    color: COLORS.textSecondary,
  },
  timeText: {
    fontWeight: '600',
    color: COLORS.primary,
  },

  // Triệu chứng
  symptomsBox: {
    marginVertical: SPACING.md,
    padding: SPACING.lg,
    backgroundColor: COLORS.accentTeal + '10',
    borderRadius: BORDER_RADIUS.lg,
    borderLeftWidth: 4,
    borderLeftColor: COLORS.accentTeal,
  },
  symptomsText: {
    fontSize: FONT_SIZE.sm,
    color: COLORS.textPrimary,
    lineHeight: 20,
  },

  // ==================== NÚT HÀNH ĐỘNG ====================
  actionContainer: {
    marginTop: SPACING.lg,
    gap: SPACING.md,
  },

  mainActionButton: {
    borderRadius: BORDER_RADIUS.lg,
    overflow: 'hidden',
    ...SHADOWS.small,
  },
  mainActionGradient: {
    flexDirection: 'row',
    justifyContent: 'center',
    alignItems: 'center',
    paddingVertical: 16,
  },
  mainActionText: {
    marginLeft: SPACING.sm,
    fontSize: FONT_SIZE.lg,
    fontWeight: '600',
    color: COLORS.textOnPrimary,
  },

  secondaryButton: {
    alignSelf: 'center',
    paddingHorizontal: SPACING.xxl,
    paddingVertical: 14,
    borderRadius: 30,
    backgroundColor: COLORS.surface,
    borderWidth: 1.5,
    borderColor: COLORS.danger + '40',
  },
  secondaryText: {
    fontSize: FONT_SIZE.md,
    fontWeight: '600',
    color: COLORS.danger,
  },

  // ==================== TRẠNG THÁI TRỐNG / LOADING ====================
  centeredView: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    paddingHorizontal: SPACING.xxl,
  },
  loadingText: {
    marginTop: SPACING.lg,
    fontSize: FONT_SIZE.md,
    color: COLORS.textSecondary,
  },
  errorText: {
    marginTop: SPACING.lg,
    fontSize: FONT_SIZE.lg,
    color: COLORS.danger,
    textAlign: 'center',
  },
  emptyText: {
    marginTop: SPACING.xl,
    fontSize: FONT_SIZE.xl,
    color: COLORS.textSecondary,
    textAlign: 'center',
    lineHeight: 28,
  },
});