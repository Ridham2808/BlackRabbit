import * as Crypto from 'expo-crypto';
import * as SecureStore from 'expo-secure-store';

const PIN_KEY = 'offline_pin_hash';

export const SecurityService = {
  /**
   * Hashes and stores a PIN securely for offline verification.
   * Called during successful online login.
   */
  async recordPinForOffline(pin) {
    try {
      const hash = await Crypto.digestStringAsync(
        Crypto.CryptoDigestAlgorithm.SHA256,
        pin
      );
      await SecureStore.setItemAsync(PIN_KEY, hash);
    } catch (e) {
      console.error('Failed to store offline PIN', e);
    }
  },

  /**
   * Verifies if the provided PIN matches the stored offline hash.
   */
  async verifyPinOffline(pin) {
    try {
      const storedHash = await SecureStore.getItemAsync(PIN_KEY);
      if (!storedHash) return false;

      const currentHash = await Crypto.digestStringAsync(
        Crypto.CryptoDigestAlgorithm.SHA256,
        pin
      );
      
      return currentHash === storedHash;
    } catch (e) {
      console.error('Offline verification error', e);
      return false;
    }
  },

  async clearOfflinePin() {
    await SecureStore.deleteItemAsync(PIN_KEY);
  }
};
