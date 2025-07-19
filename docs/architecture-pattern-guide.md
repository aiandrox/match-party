# アーキテクチャパターンガイド

**作成日**: 2025-07-19  
**対象**: Match Party全アプリケーションの統一設計パターン

## 設計思想

### 責務分離の原則

**コンポーネント内で完結する処理**: Presenterで管理
**グローバルなもの**: Facadeからcontainerで呼び出してpropsリレーを行う

## アーキテクチャパターン

### 1. MVP（Model-View-Presenter）パターン

#### Container (page.tsx)
**役割**: エントリーポイント・グローバル状態管理
```typescript
// Container の責務
export default function CreateRoomPage() {
  // Facade呼び出し（グローバル状態・API・ナビゲーション）
  const { isLoading, error, createRoom, navigateToHome } = useCreateRoomFacade();

  // Viewにpropsリレー
  return (
    <CreateRoomView
      onSubmit={createRoom}
      onBack={navigateToHome}
      globalError={error}
      isGlobalLoading={isLoading}
    />
  );
}
```

#### View (component.tsx)
**役割**: UI表現・Presenterとの結合
```typescript
// View の責務
export function CreateRoomView({ onSubmit, onBack, globalError, isGlobalLoading }: Props) {
  // Presenter呼び出し（コンポーネント内完結処理）
  const { hostName, error, handleSubmit, handleHostNameChange } = useCreateRoomPresenter({
    onSubmit, onBack, globalError, isGlobalLoading
  });

  // 純粋なUI表現
  return <form onSubmit={handleSubmit}>...</form>;
}
```

#### Presenter (presenter.ts)
**役割**: コンポーネント内完結処理・フォーム管理・バリデーション
```typescript
// Presenter の責務
export function useCreateRoomPresenter({ onSubmit, onBack, globalError, isGlobalLoading }: Props) {
  // ローカル状態管理
  const [hostName, setHostName] = useState('');
  const [validationError, setValidationError] = useState<string | null>(null);

  // バリデーション・フォーム処理
  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!validateUserName(hostName)) {
      setValidationError('名前は2文字以上20文字以内で、日本語・英数字のみ使用できます');
      return;
    }
    setValidationError(null);
    await onSubmit(hostName); // グローバル処理に委譲
  };

  return { hostName, error: globalError || validationError, handleSubmit, handleHostNameChange };
}
```

#### Facade (facade.ts)
**役割**: グローバル処理・API呼び出し・ナビゲーション・外部状態管理
```typescript
// Facade の責務
export function useCreateRoomFacade() {
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const router = useRouter();

  // API呼び出し
  const createRoom = async (hostName: string) => {
    setIsLoading(true);
    try {
      const { createRoom } = await import('@/lib/roomService');
      const result = await createRoom(hostName);
      
      // localStorage管理
      const { saveUserIdForRoom } = await import('@/lib/localStorage');
      saveUserIdForRoom(result.roomCode, result.hostUserId);
      
      // ナビゲーション
      router.push(`/room?code=${result.roomCode}`);
    } catch (err) {
      setError(err.message);
    } finally {
      setIsLoading(false);
    }
  };

  return { isLoading, error, createRoom, navigateToHome: () => router.push('/') };
}
```

### 2. データフローパターン

```
Container → Facade (グローバル状態取得)
    ↓
View ← Props (グローバル状態注入)
    ↓
Presenter (ローカル状態管理 + グローバル状態活用)
```

### 3. ファイル命名規則

```
page.tsx              # Container
[Page].facade.ts      # Facade pattern
components/
├── index.ts          # Clean exports
├── [Page].component.tsx  # View
└── [Page].presenter.ts   # Presenter
```

## 責務分離の詳細

### Container の責務
- エントリーポイント
- Facadeからグローバル状態取得
- Viewへのpropsリレー
- **やってはいけないこと**: 直接のAPI呼び出し、複雑なビジネスロジック

### Facade の責務
- API呼び出し
- ルーティング・ナビゲーション
- localStorage・sessionStorage
- URL パラメータ管理
- グローバル状態管理

### View の責務
- UI表現
- Presenterとの結合
- **やってはいけないこと**: ビジネスロジック、API呼び出し

### Presenter の責務
- フォーム状態管理
- バリデーション
- UI イベントハンドリング
- **やってはいけないこと**: API呼び出し、ルーティング

## 実装例：状態管理の流れ

### Create Room ページの実装フロー

1. **Container**: Facadeから`{ createRoom, error, isLoading }`取得
2. **View**: Presenterに`{ onSubmit: createRoom, globalError: error }`渡し
3. **Presenter**: フォームバリデーション後、`onSubmit(hostName)`実行
4. **Facade**: API呼び出し・localStorage保存・ナビゲーション実行

### エラー処理の分離

- **Validation Error**: Presenterで管理（フォーム入力エラー）
- **Global Error**: Facadeで管理（API呼び出しエラー）
- **Error Display**: Presenterで統合表示（`globalError || validationError`）

## 品質保証

### ESLint設定
```json
{
  "rules": {
    "no-unused-vars": ["warn", { "argsIgnorePattern": "^_" }]
  }
}
```

### TypeScript設定
- 厳密な型定義
- Props interfaceの明確化
- 未使用パラメータは`_`プレフィックス

### テスタビリティ
- 各レイヤーの独立テスト可能
- Presenterの単体テスト
- Facadeのモック可能

## 利点

### 開発効率
- 明確な責務分離による迷いのない開発
- パターン統一による学習コスト削減
- コンポーネント独立による並行開発可能

### 保守性
- 影響範囲の限定
- 機能追加時の既存コード非破壊
- バグ修正の局所化

### スケーラビリティ
- 新ページ追加時の一貫パターン
- チーム開発での統一基準
- エンタープライズレベルの構造

## まとめ

このアーキテクチャパターンにより、Match Partyは：

1. **一貫性**: 全ページで統一された設計パターン
2. **保守性**: 明確な責務分離による長期保守容易性  
3. **拡張性**: 新機能追加時の確立された手順
4. **品質**: エンタープライズレベルのコード品質

を実現しています。