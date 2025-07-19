import { 
  generateRoomCode, 
  validateUserName, 
  validateRoomCode, 
  createExpirationTime,
  MAX_PARTICIPANTS,
  ROOM_EXPIRY_MINUTES 
} from './utils';

describe('utils', () => {
  describe('generateRoomCode', () => {
    it('should generate a 20-character code', () => {
      const code = generateRoomCode();
      expect(code).toHaveLength(20);
    });

    it('should only contain uppercase letters and numbers', () => {
      const code = generateRoomCode();
      expect(code).toMatch(/^[A-Z0-9]+$/);
    });

    it('should generate different codes on subsequent calls', () => {
      const code1 = generateRoomCode();
      const code2 = generateRoomCode();
      expect(code1).not.toBe(code2);
    });
  });

  describe('validateUserName', () => {
    it('should accept valid Japanese names', () => {
      expect(validateUserName('田中太郎')).toBe(true);
      expect(validateUserName('さくら')).toBe(true);
      expect(validateUserName('タナカ')).toBe(true);
    });

    it('should accept valid English names', () => {
      expect(validateUserName('John')).toBe(true);
      expect(validateUserName('Alice')).toBe(true);
      expect(validateUserName('TestUser')).toBe(true);
    });

    it('should accept alphanumeric names', () => {
      expect(validateUserName('User123')).toBe(true);
      expect(validateUserName('Player1')).toBe(true);
      expect(validateUserName('Test123User')).toBe(true);
    });

    it('should accept full-width alphanumeric names', () => {
      expect(validateUserName('ｕｓｅｒ')).toBe(true);
      expect(validateUserName('ＵＳＥＲ')).toBe(true);
      expect(validateUserName('１２３')).toBe(true);
      expect(validateUserName('ｕｓｅｒ１２３')).toBe(true);
      expect(validateUserName('ＵｓｅＲ１２３')).toBe(true);
    });

    it('should reject names that are too short', () => {
      expect(validateUserName('a')).toBe(false);
      expect(validateUserName('1')).toBe(false);
      expect(validateUserName('')).toBe(false);
    });

    it('should reject names that are too long', () => {
      const longName = 'ThisNameIsWayTooLongForValidation';
      expect(validateUserName(longName)).toBe(false);
    });

    it('should reject names with invalid characters', () => {
      expect(validateUserName('user@test')).toBe(false);
      expect(validateUserName('user test')).toBe(false);
      expect(validateUserName('user-test')).toBe(false);
      expect(validateUserName('user#test')).toBe(false);
      expect(validateUserName('user.test')).toBe(false);
    });

    it('should accept names exactly at the boundaries', () => {
      expect(validateUserName('ab')).toBe(true); // 2 characters
      expect(validateUserName('a'.repeat(20))).toBe(true); // 20 characters
    });
  });

  describe('validateRoomCode', () => {
    it('should accept valid room codes', () => {
      expect(validateRoomCode('ABC123DEF456GHI789JK')).toBe(true);
      expect(validateRoomCode('AAAAAAAAAAAAAAAAAAAA')).toBe(true);
      expect(validateRoomCode('11111111111111111111')).toBe(true);
    });

    it('should reject codes with wrong length', () => {
      expect(validateRoomCode('SHORT')).toBe(false);
      expect(validateRoomCode('ABC123DEF456GHI789JKL')).toBe(false); // 21 characters
      expect(validateRoomCode('')).toBe(false);
    });

    it('should reject codes with lowercase letters', () => {
      expect(validateRoomCode('abc123DEF456GHI789JK')).toBe(false);
      expect(validateRoomCode('ABC123def456GHI789JK')).toBe(false);
    });

    it('should reject codes with invalid characters', () => {
      expect(validateRoomCode('ABC123DEF456GHI789J@')).toBe(false);
      expect(validateRoomCode('ABC123DEF456GHI789J-')).toBe(false);
      expect(validateRoomCode('ABC123DEF456GHI789J_')).toBe(false);
      expect(validateRoomCode('ABC123DEF456GHI789J ')).toBe(false);
    });
  });

  describe('createExpirationTime', () => {
    beforeAll(() => {
      // Mock Date to have consistent tests
      jest.useFakeTimers();
    });

    afterAll(() => {
      jest.useRealTimers();
    });

    it('should create expiration time 30 minutes from now', () => {
      const mockNow = new Date('2023-01-01T12:00:00Z');
      jest.setSystemTime(mockNow);

      const expirationTime = createExpirationTime();
      const expectedExpiration = new Date('2023-01-01T12:30:00Z');

      expect(expirationTime).toEqual(expectedExpiration);
    });

    it('should use the ROOM_EXPIRY_MINUTES constant', () => {
      expect(ROOM_EXPIRY_MINUTES).toBe(30);
    });
  });

  describe('constants', () => {
    it('should define MAX_PARTICIPANTS', () => {
      expect(MAX_PARTICIPANTS).toBe(20);
      expect(typeof MAX_PARTICIPANTS).toBe('number');
    });

    it('should define ROOM_EXPIRY_MINUTES', () => {
      expect(ROOM_EXPIRY_MINUTES).toBe(30);
      expect(typeof ROOM_EXPIRY_MINUTES).toBe('number');
    });
  });
});