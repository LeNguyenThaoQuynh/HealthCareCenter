// src/styles/admin/CreateDoctorScheduleStyles.js
import { StyleSheet } from 'react-native';

export const styles = StyleSheet.create({
  // CONTAINER
  container: {
    flex: 1,
    backgroundColor: '#F9FAFB',
  },

  // HEADER
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingTop: 50,
    paddingHorizontal: 16,
    paddingBottom: 16,
    backgroundColor: '#fff',
    borderBottomWidth: 1,
    borderBottomColor: '#E5E7EB',
  },
  backButton: {
    padding: 4,
  },
  headerTitle: {
    fontSize: 18,
    fontWeight: '700',
    color: '#1F2937',
  },

  // SCROLL CONTENT
  scrollContent: {
    paddingBottom: 40,
  },

  // DOCTOR CARD
  doctorCard: {
    backgroundColor: '#F0FDF4',
    marginHorizontal: 16,
    marginTop: 16,
    padding: 16,
    borderRadius: 16,
    borderWidth: 1,
    borderColor: '#BBF7D0',
    elevation: 1,
  },
  doctorLabel: {
    fontSize: 13,
    color: '#059669',
    marginBottom: 4,
  },
  doctorName: {
    fontSize: 18,
    fontWeight: '700',
    color: '#1F2937',
  },

  // SCHEDULE SECTION
  scheduleSection: {
    backgroundColor: '#fff',
    marginHorizontal: 16,
    marginTop: 16,
    padding: 16,
    borderRadius: 16,
    borderWidth: 1,
    borderColor: '#E5E7EB',
    elevation: 1,
  },
  sectionTitle: {
    fontSize: 16,
    fontWeight: '600',
    color: '#1F2937',
    marginBottom: 16,
  },

  // DAY CONTAINER
  dayContainer: {
    marginBottom: 20,
    paddingBottom: 16,
    borderBottomWidth: 1,
    borderBottomColor: '#F3F4F6',
  },
  dayHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 12,
  },
  dayName: {
    fontSize: 16,
    fontWeight: '600',
    color: '#1F2937',
  },
  addButton: {
    flexDirection: 'row',
    backgroundColor: '#10B981',
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 20,
    alignItems: 'center',
    justifyContent: 'center',
  },
  addButtonText: {
    color: '#fff',
    fontSize: 13,
    fontWeight: '600',
    marginLeft: 4,
  },

  // SLOT ROW
  slotContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 8,
    gap: 8,
    flexWrap: 'wrap',
  },
  timeBox: {
    borderWidth: 1,
    borderColor: '#D1D5DB',
    borderRadius: 12,
    paddingHorizontal: 14,
    paddingVertical: 10,
    backgroundColor: '#F9FAFB',
    minWidth: 90,
    justifyContent: 'center',
  },
  timeInput: {
    fontSize: 15,
    color: '#1F2937',
    textAlign: 'center',
    width: '100%',
  },
  arrow: {
    fontSize: 16,
    color: '#6B7280',
    fontWeight: '600',
    marginTop: 8,
  },
  deleteIcon: {
    padding: 4,
  },

  // EMPTY TEXT
  emptyText: {
    fontSize: 14,
    color: '#9CA3AF',
    fontStyle: 'italic',
    marginTop: 8,
  },

  // CREATE BUTTON
  createButton: {
    flexDirection: 'row',
    backgroundColor: '#10B981',
    marginHorizontal: 16,
    marginTop: 24,
    marginBottom: 40,
    padding: 16,
    borderRadius: 16,
    alignItems: 'center',
    justifyContent: 'center',
    elevation: 2,
  },
  createButtonDisabled: {
    backgroundColor: '#9CA3AF',
  },
  createButtonText: {
    color: '#fff',
    fontWeight: '700',
    fontSize: 16,
    marginLeft: 8,
  },
});