import { describe, it, expect } from 'vitest'
import {
  generateSalt,
  deriveKeyFromPassphrase,
  encryptToken,
  decryptToken,
} from './crypto'

describe('crypto', () => {
  it('generateSalt returns base64 string of correct length', () => {
    const salt = generateSalt()
    expect(typeof salt).toBe('string')
    expect(atob(salt).length).toBe(16)
  })

  it('deriveKeyFromPassphrase produces a key from passphrase and salt', async () => {
    const salt = generateSalt()
    const key = await deriveKeyFromPassphrase('test passphrase', salt, 1000)
    expect(key).toBeDefined()
    expect(key.type).toBe('secret')
    expect(key.algorithm).toBeDefined()
  })

  it('encryptToken and decryptToken round-trip', async () => {
    const salt = generateSalt()
    const key = await deriveKeyFromPassphrase('secret', salt, 1000)
    const plaintext = 'up:pat:secret-token-123'
    const encrypted = await encryptToken(plaintext, key)
    expect(encrypted).toBeDefined()
    expect(encrypted).not.toBe(plaintext)
    const decrypted = await decryptToken(encrypted, key)
    expect(decrypted).toBe(plaintext)
  })

  it('decryptToken fails on tampered payload', async () => {
    const salt = generateSalt()
    const key = await deriveKeyFromPassphrase('secret', salt, 1000)
    const encrypted = await encryptToken('original', key)
    const tampered = encrypted.slice(0, -2) + 'xx'
    await expect(decryptToken(tampered, key)).rejects.toThrow()
  })

  it('decryptToken fails on too-short payload', async () => {
    const salt = generateSalt()
    const key = await deriveKeyFromPassphrase('secret', salt, 1000)
    await expect(decryptToken(btoa('short'), key)).rejects.toThrow('too short')
  })
})
