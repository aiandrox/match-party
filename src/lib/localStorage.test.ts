import {
  saveUserIdForRoom,
  getUserIdForRoom,
  removeUserIdForRoom,
} from './localStorage';

const USER_ID_PREFIX = 'userId_';

/**
 * 全てのユーザーIDをlocalStorageから削除（クリーンアップ用）
 * テスト専用ヘルパー関数
 */
function clearAllUserIds(): void {
  try {
    // localStorageの全キーを取得（削除中に変更されないようにコピーを作成）
    const keys: string[] = [];
    for (let i = 0; i < localStorage.length; i++) {
      const key = localStorage.key(i);
      if (key) {
        keys.push(key);
      }
    }
    
    // ユーザーIDのキーのみを削除
    keys
      .filter(key => key.startsWith(USER_ID_PREFIX))
      .forEach(key => {
        localStorage.removeItem(key);
      });
  } catch (error) {
    console.error('Failed to clear all userIds from localStorage:', error);
  }
}

/**
 * localStorageに保存されている全てのルームコードを取得
 * テスト専用ヘルパー関数
 * @returns ルームコードの配列
 */
function getAllStoredRoomCodes(): string[] {
  try {
    // localStorageの全キーを取得
    const keys: string[] = [];
    for (let i = 0; i < localStorage.length; i++) {
      const key = localStorage.key(i);
      if (key) {
        keys.push(key);
      }
    }
    
    return keys
      .filter(key => key.startsWith(USER_ID_PREFIX))
      .map(key => key.substring(USER_ID_PREFIX.length));
  } catch (error) {
    console.error('Failed to get stored room codes:', error);
    return [];
  }
}

describe('localStorage utilities', () => {
  // localStorageの実際の実装に近いモック
  let storage: { [key: string]: string } = {};

  const localStorageMock = {
    getItem: jest.fn((key: string) => storage[key] || null),
    setItem: jest.fn((key: string, value: string) => {
      storage[key] = value;
    }),
    removeItem: jest.fn((key: string) => {
      delete storage[key];
    }),
    clear: jest.fn(() => {
      storage = {};
    }),
    get length() {
      return Object.keys(storage).length;
    },
    key: jest.fn((index: number) => {
      const keys = Object.keys(storage);
      return keys[index] || null;
    }),
  };

  beforeEach(() => {
    // ストレージをクリア
    storage = {};
    jest.clearAllMocks();
    
    // モックを元の実装に戻す
    localStorageMock.getItem.mockImplementation((key: string) => storage[key] || null);
    localStorageMock.setItem.mockImplementation((key: string, value: string) => {
      storage[key] = value;
    });
    localStorageMock.removeItem.mockImplementation((key: string) => {
      delete storage[key];
    });
    localStorageMock.clear.mockImplementation(() => {
      storage = {};
    });
    
    // globalのlocalStorageを置き換え
    Object.defineProperty(global, 'localStorage', {
      value: localStorageMock,
      writable: true,
    });

    // コンソールエラーをモック
    jest.spyOn(console, 'error').mockImplementation(() => {});
  });

  afterEach(() => {
    jest.restoreAllMocks();
  });

  describe('saveUserIdForRoom', () => {
    it('正常にユーザーIDが保存される', () => {
      saveUserIdForRoom('TEST123', 'user456');

      expect(localStorageMock.setItem).toHaveBeenCalledWith('userId_TEST123', 'user456');
      expect(storage['userId_TEST123']).toBe('user456');
    });

    it('複数のルームに対してユーザーIDが保存される', () => {
      saveUserIdForRoom('ROOM1', 'user1');
      saveUserIdForRoom('ROOM2', 'user2');

      expect(storage['userId_ROOM1']).toBe('user1');
      expect(storage['userId_ROOM2']).toBe('user2');
    });

    it('localStorageでエラーが発生した場合はエラーログが出力される', () => {
      localStorageMock.setItem.mockImplementation(() => {
        throw new Error('LocalStorage error');
      });

      saveUserIdForRoom('TEST123', 'user456');

      expect(console.error).toHaveBeenCalledWith(
        'Failed to save userId to localStorage:',
        expect.any(Error)
      );
    });
  });

  describe('getUserIdForRoom', () => {
    it('保存されているユーザーIDが正常に取得される', () => {
      storage['userId_TEST123'] = 'user456';

      const result = getUserIdForRoom('TEST123');

      expect(localStorageMock.getItem).toHaveBeenCalledWith('userId_TEST123');
      expect(result).toBe('user456');
    });

    it('存在しないルームコードの場合はnullが返される', () => {
      const result = getUserIdForRoom('NONEXISTENT');

      expect(result).toBeNull();
    });

    it('localStorageでエラーが発生した場合はnullが返される', () => {
      localStorageMock.getItem.mockImplementation(() => {
        throw new Error('LocalStorage error');
      });

      const result = getUserIdForRoom('TEST123');

      expect(console.error).toHaveBeenCalledWith(
        'Failed to get userId from localStorage:',
        expect.any(Error)
      );
      expect(result).toBeNull();
    });
  });

  describe('removeUserIdForRoom', () => {
    it('保存されているユーザーIDが正常に削除される', () => {
      storage['userId_TEST123'] = 'user456';

      removeUserIdForRoom('TEST123');

      expect(localStorageMock.removeItem).toHaveBeenCalledWith('userId_TEST123');
      expect(storage['userId_TEST123']).toBeUndefined();
    });

    it('localStorageでエラーが発生した場合はエラーログが出力される', () => {
      localStorageMock.removeItem.mockImplementation(() => {
        throw new Error('LocalStorage error');
      });

      removeUserIdForRoom('TEST123');

      expect(console.error).toHaveBeenCalledWith(
        'Failed to remove userId from localStorage:',
        expect.any(Error)
      );
    });
  });

  describe('clearAllUserIds', () => {
    it('全てのユーザーIDが削除される', () => {
      localStorage.setItem('userId_ROOM1', 'user1');
      localStorage.setItem('userId_ROOM2', 'user2');
      localStorage.setItem('other_data', 'should_remain');

      clearAllUserIds();

      expect(localStorage.getItem('userId_ROOM1')).toBeNull();
      expect(localStorage.getItem('userId_ROOM2')).toBeNull();
      expect(localStorage.getItem('other_data')).toBe('should_remain');
    });

    it('ユーザーID以外のデータは削除されない', () => {
      localStorage.setItem('userId_TEST', 'user123');
      localStorage.setItem('theme', 'dark');
      localStorage.setItem('language', 'ja');

      clearAllUserIds();

      expect(localStorage.getItem('userId_TEST')).toBeNull();
      expect(localStorage.getItem('theme')).toBe('dark');
      expect(localStorage.getItem('language')).toBe('ja');
    });
  });

  describe('getAllStoredRoomCodes', () => {
    it('保存されている全てのルームコードが取得される', () => {
      localStorage.setItem('userId_ROOM1', 'user1');
      localStorage.setItem('userId_ROOM2', 'user2');
      localStorage.setItem('other_data', 'value');

      const result = getAllStoredRoomCodes();

      expect(result).toEqual(expect.arrayContaining(['ROOM1', 'ROOM2']));
      expect(result).toHaveLength(2);
    });

    it('ユーザーIDが保存されていない場合は空配列が返される', () => {
      localStorage.setItem('other_data', 'value');

      const result = getAllStoredRoomCodes();

      expect(result).toEqual([]);
    });
  });

  describe('統合テスト', () => {
    it('保存→取得→削除のフローが正常に動作する', () => {
      const roomCode = 'INTEGRATION_TEST';
      const userId = 'testUser123';

      // 保存
      saveUserIdForRoom(roomCode, userId);
      expect(getUserIdForRoom(roomCode)).toBe(userId);
      expect(getAllStoredRoomCodes()).toContain(roomCode);

      // 削除
      removeUserIdForRoom(roomCode);
      expect(getUserIdForRoom(roomCode)).toBeNull();
      expect(getAllStoredRoomCodes()).not.toContain(roomCode);
    });
  });
});