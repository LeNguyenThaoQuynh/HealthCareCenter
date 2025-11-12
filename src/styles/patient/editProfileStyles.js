import { StyleSheet, Dimensions } from "react-native";
import { Colors } from "../../shared/colors";

const { width } = Dimensions.get("window");

export const editProfileStyles = StyleSheet.create({
  container: {
    flex: 1,
  },
  safeArea: {
    flex: 1,
  },
  loadingContainer: {
    flex: 1,
    justifyContent: "center",
    alignItems: "center",
  },
  loadingText: {
    marginTop: 16,
    fontSize: 18,
    color: "#E5E7EB",
    fontWeight: "600",
  },

  // Header
  header: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    paddingHorizontal: 20,
    paddingVertical: 16,
  },
  backButton: {
    width: 44,
    height: 44,
    borderRadius: 22,
    backgroundColor: "rgba(255, 255, 255, 0.2)",
    justifyContent: "center",
    alignItems: "center",
    backdropFilter: "blur(10px)",
  },
  headerTitle: {
    fontSize: 20,
    fontWeight: "700",
    color: "#FFF",
    textShadowColor: "rgba(0,0,0,0.2)",
    textShadowOffset: { width: 0, height: 1 },
    textShadowRadius: 3,
  },

  // Avatar Section
  avatarSection: {
    alignItems: "center",
    paddingVertical: 24,
  },
  avatarContainer: {
    position: "relative",
    marginBottom: 16,
  },
  avatarGradient: {
    width: 120,
    height: 120,
    borderRadius: 60,
    justifyContent: "center",
    alignItems: "center",
    padding: 4,
  },
  avatar: {
    width: "100%",
    height: "100%",
    borderRadius: 56,
    backgroundColor: "#FFF",
    justifyContent: "center",
    alignItems: "center",
    elevation: 8,
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 6 },
    shadowOpacity: 0.2,
    shadowRadius: 12,
  },
  avatarText: {
    fontSize: 40,
    fontWeight: "900",
    color: "#1D4ED8",
  },
  editAvatarButton: {
    position: "absolute",
    bottom: 0,
    right: 0,
    width: 36,
    height: 36,
    borderRadius: 18,
    backgroundColor: "#1D4ED8",
    justifyContent: "center",
    alignItems: "center",
    borderWidth: 3,
    borderColor: "#FFF",
  },
  userName: {
    fontSize: 28,
    fontWeight: "800",
    color: "#FFFFFF",
    marginBottom: 4,
    textShadowColor: "rgba(0,0,0,0.2)",
    textShadowOffset: { width: 0, height: 2 },
    textShadowRadius: 4,
  },
  userRole: {
    fontSize: 17,
    color: "#E5E7EB",
    fontWeight: "600",
  },

  // Scroll View
  scrollView: {
    flex: 1,
  },

  // Form Card
  formCard: {
    flex: 1,
    backgroundColor: "#FFFFFF",
    borderTopLeftRadius: 24,
    borderTopRightRadius: 24,
    paddingTop: 24,
    paddingHorizontal: 20,
    paddingBottom: 0,
    minHeight: "100%",
  },

  // Input Group
  inputGroup: {
    flexDirection: "row",
    marginBottom: 20,
    backgroundColor: "#F1F5F9",
    borderRadius: 16,
    padding: 16,
    alignItems: "flex-start",
  },
  inputIconContainer: {
    width: 50,
    height: 50,
    borderRadius: 25,
    backgroundColor: "#E0F2FE",
    justifyContent: "center",
    alignItems: "center",
    marginRight: 16,
  },
  inputContent: {
    flex: 1,
  },
  inputLabel: {
    fontSize: 14,
    color: "#4B5563",
    marginBottom: 4,
    fontWeight: "600",
  },
  input: {
    fontSize: 17,
    color: "#1E293B",
    fontWeight: "700",
    padding: 0,
  },
  inputReadonly: {
    fontSize: 17,
    color: "#1E293B",
    fontWeight: "700",
  },

  // Gender
  genderContainer: {
    flexDirection: "row",
    gap: 8,
    marginTop: 8,
  },
  genderButton: {
    flex: 1,
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    paddingVertical: 12,
    paddingHorizontal: 12,
    borderRadius: 12,
    borderWidth: 2,
    borderColor: "#F1F5F9",
    backgroundColor: "#FFF",
    gap: 6,
  },
  genderButtonActive: {
    backgroundColor: "#1D4ED8",
    borderColor: "#1D4ED8",
  },
  genderText: {
    fontSize: 14,
    color: "#1E293B",
    fontWeight: "600",
  },
  genderTextActive: {
    color: "#FFF",
  },

  // Buttons
  buttonContainer: {
    marginTop: 24,
    gap: 12,
    marginBottom: 40,
  },
  saveButton: {
    borderRadius: 18,
    overflow: "hidden",
    elevation: 8,
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 6 },
    shadowOpacity: 0.15,
    shadowRadius: 12,
  },
  saveButtonDisabled: {
    elevation: 0,
    shadowOpacity: 0,
  },
  saveButtonGradient: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    paddingVertical: 18,
    paddingHorizontal: 32,
    gap: 10,
  },
  saveButtonText: {
    fontSize: 17,
    fontWeight: "700",
    color: "#FFF",
  },
  cancelButton: {
    paddingVertical: 16,
    alignItems: "center",
  },
  cancelButtonText: {
    fontSize: 16,
    color: "#4B5563",
    fontWeight: "600",
  },
  datePickerButton: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    paddingVertical: 4,
  },
  placeholderText: {
    color: "#4B5563",
    fontStyle: "italic",
  },
  dropdownIcon: {
    marginLeft: 8,
  },
});
