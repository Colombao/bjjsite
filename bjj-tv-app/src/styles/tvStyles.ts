import { StyleSheet, Dimensions } from 'react-native';

const { width, height } = Dimensions.get('window');
const isLandscape = width > height;

export const tvStyles = StyleSheet.create({
  // ============ CONTAINER ============
  container: {
    flex: 1,
    backgroundColor: '#f5f5f5',
    paddingHorizontal: isLandscape ? 40 : 20,
    paddingVertical: isLandscape ? 30 : 20,
  },

  // ============ HEADER ============
  header: {
    marginBottom: 30,
    alignItems: 'center',
  },

  headerTitle: {
    fontSize: isLandscape ? 48 : 36,
    fontWeight: '800',
    color: '#1a1a1a',
    textTransform: 'uppercase',
    letterSpacing: 2,
    marginBottom: 8,
  },

  headerSubtitle: {
    fontSize: isLandscape ? 20 : 16,
    color: '#666',
    textTransform: 'uppercase',
    letterSpacing: 1,
  },

  // ============ DISPLAY ============
  displayContainer: {
    backgroundColor: 'white',
    borderRadius: 12,
    padding: 30,
    marginBottom: 30,
    shadowColor: '#000',
    shadowOpacity: 0.1,
    shadowOffset: { width: 0, height: 4 },
    shadowRadius: 16,
    elevation: 8,
  },

  displayRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginBottom: 30,
    gap: 20,
  },

  atletaDisplay: {
    flex: 1,
    alignItems: 'center',
  },

  atletaNome: {
    fontSize: isLandscape ? 28 : 24,
    fontWeight: '700',
    color: '#1a1a1a',
    textTransform: 'uppercase',
    letterSpacing: 1,
    marginBottom: 4,
  },

  atletaTeam: {
    fontSize: isLandscape ? 14 : 12,
    color: '#666',
    textTransform: 'uppercase',
    letterSpacing: 0.5,
  },

  // ============ PONTOS GRID ============
  pontosGrid: {
    flexDirection: 'row',
    gap: 15,
    justifyContent: 'center',
    marginTop: 20,
  },

  pontoBox: {
    width: isLandscape ? 100 : 80,
    height: isLandscape ? 100 : 80,
    borderRadius: 8,
    justifyContent: 'center',
    alignItems: 'center',
    shadowColor: '#000',
    shadowOpacity: 0.15,
    shadowOffset: { width: 0, height: 4 },
    shadowRadius: 12,
    elevation: 6,
  },

  pontoBoxP2: {
    backgroundColor: '#22c55e',
  },

  pontoBoxVantagem: {
    backgroundColor: '#eab308',
  },

  pontoBoxPenalidade: {
    backgroundColor: '#ef4444',
  },

  pontoValor: {
    fontSize: isLandscape ? 44 : 36,
    fontWeight: '800',
    color: 'white',
    textShadowColor: 'rgba(0, 0, 0, 0.2)',
    textShadowOffset: { width: 0, height: 2 },
    textShadowRadius: 4,
  },

  // ============ STATUS BAR ============
  statusBar: {
    flexDirection: 'row',
    gap: 20,
    marginTop: 20,
    paddingTop: 20,
    borderTopWidth: 2,
    borderTopColor: '#e5e5e5',
  },

  tempoDisplay: {
    flex: 2,
    backgroundColor: '#1a1a1a',
    borderRadius: 8,
    paddingVertical: 20,
    paddingHorizontal: 16,
    justifyContent: 'center',
    alignItems: 'center',
  },

  tempoText: {
    fontSize: isLandscape ? 48 : 40,
    fontWeight: '700',
    color: 'white',
    fontFamily: 'monospace',
  },

  statusDisplay: {
    flex: 1,
    backgroundColor: '#ef4444',
    borderRadius: 8,
    paddingVertical: 20,
    paddingHorizontal: 16,
    justifyContent: 'center',
    alignItems: 'center',
  },

  statusText: {
    fontSize: isLandscape ? 20 : 16,
    fontWeight: '700',
    color: 'white',
    textTransform: 'uppercase',
    letterSpacing: 1,
  },

  // ============ CONTROLES ============
  controlsContainer: {
    flexDirection: 'row',
    gap: 20,
    flex: 1,
  },

  controlSection: {
    flex: 1,
    backgroundColor: 'white',
    borderRadius: 12,
    padding: 20,
    shadowColor: '#000',
    shadowOpacity: 0.08,
    shadowOffset: { width: 0, height: 2 },
    shadowRadius: 8,
    elevation: 4,
  },

  controlSectionTitle: {
    fontSize: isLandscape ? 18 : 16,
    fontWeight: '700',
    color: '#1a1a1a',
    textTransform: 'uppercase',
    letterSpacing: 1,
    marginBottom: 15,
    paddingBottom: 10,
    borderBottomWidth: 2,
    borderBottomColor: '#e5e5e5',
  },

  // ============ BUTTONS ============
  buttonContainer: {
    marginBottom: 16,
  },

  buttonLabel: {
    fontSize: isLandscape ? 13 : 12,
    fontWeight: '600',
    color: '#666',
    textTransform: 'uppercase',
    letterSpacing: 0.5,
    marginBottom: 8,
  },

  buttonGroup: {
    flexDirection: 'row',
    gap: 10,
    alignItems: 'center',
    justifyContent: 'center',
  },

  buttonSmall: {
    width: isLandscape ? 60 : 50,
    height: isLandscape ? 60 : 50,
    borderRadius: 8,
    backgroundColor: '#e5e5e5',
    justifyContent: 'center',
    alignItems: 'center',
    borderWidth: 2,
    borderColor: 'transparent',
  },

  buttonSmallFocused: {
    borderColor: '#3b82f6',
    backgroundColor: '#f0f4ff',
  },

  buttonSmallActive: {
    backgroundColor: '#3b82f6',
  },

  buttonText: {
    fontSize: isLandscape ? 28 : 24,
    fontWeight: '700',
    color: '#1a1a1a',
  },

  buttonTextFocused: {
    color: '#3b82f6',
  },

  buttonTextActive: {
    color: 'white',
  },

  scoreDisplay: {
    fontSize: isLandscape ? 32 : 28,
    fontWeight: '800',
    color: '#1a1a1a',
    flex: 1,
    textAlign: 'center',
  },

  // ============ LARGE BUTTON ============
  buttonLarge: {
    height: isLandscape ? 64 : 56,
    borderRadius: 8,
    backgroundColor: '#ef4444',
    justifyContent: 'center',
    alignItems: 'center',
    marginTop: 10,
    borderWidth: 2,
    borderColor: 'transparent',
  },

  buttonLargeFocused: {
    borderColor: '#3b82f6',
    backgroundColor: '#ef5555',
  },

  buttonLargeText: {
    fontSize: isLandscape ? 16 : 14,
    fontWeight: '700',
    color: 'white',
    textTransform: 'uppercase',
    letterSpacing: 1,
  },

  // ============ STATUS BUTTONS ============
  statusButtonGroup: {
    flexDirection: 'row',
    gap: 8,
  },

  statusButton: {
    flex: 1,
    paddingVertical: 12,
    paddingHorizontal: 10,
    borderRadius: 8,
    borderWidth: 2,
    borderColor: '#d1d5db',
    backgroundColor: 'white',
    justifyContent: 'center',
    alignItems: 'center',
  },

  statusButtonFocused: {
    borderColor: '#3b82f6',
    backgroundColor: '#f0f4ff',
  },

  statusButtonActive: {
    backgroundColor: '#ef4444',
    borderColor: '#ef4444',
  },

  statusButtonText: {
    fontSize: isLandscape ? 13 : 11,
    fontWeight: '600',
    color: '#666',
    textTransform: 'uppercase',
    letterSpacing: 0.5,
  },

  statusButtonTextFocused: {
    color: '#3b82f6',
  },

  statusButtonTextActive: {
    color: 'white',
  },

  // ============ INPUT ============
  textInput: {
    borderWidth: 1,
    borderColor: '#d1d5db',
    borderRadius: 8,
    paddingVertical: 12,
    paddingHorizontal: 12,
    fontSize: isLandscape ? 14 : 12,
    fontWeight: '600',
    color: '#1a1a1a',
    textTransform: 'uppercase',
  },

  textInputFocused: {
    borderColor: '#3b82f6',
    backgroundColor: '#f0f4ff',
  },
});
