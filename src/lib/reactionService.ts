import {
  collection,
  addDoc,
  serverTimestamp,
  onSnapshot,
  query,
  orderBy,
  writeBatch,
  getDocs,
  Timestamp,
} from "firebase/firestore";
import { db } from "./firebase";
import { Reaction } from "@/types";

export async function sendReaction(
  gameRoundId: string,
  fromUserId: string,
  fromUserName: string,
  emoji: string
): Promise<void> {
  await addDoc(collection(db, "gameRounds", gameRoundId, "reactions"), {
    emoji,
    fromUserId,
    fromUserName,
    createdAt: serverTimestamp(),
  });
}

export function subscribeToReactions(
  gameRoundId: string,
  callback: (_reactions: Reaction[]) => void
): () => void {
  const reactionsRef = collection(db, "gameRounds", gameRoundId, "reactions");
  const q = query(reactionsRef, orderBy("createdAt", "asc"));

  return onSnapshot(q, (snapshot) => {
    const reactions: Reaction[] = snapshot.docs.map((doc) => {
      const data = doc.data();
      return {
        id: doc.id,
        emoji: data.emoji,
        fromUserId: data.fromUserId,
        fromUserName: data.fromUserName,
        createdAt: data.createdAt instanceof Timestamp ? data.createdAt.toDate() : new Date(),
      };
    });
    callback(reactions);
  });
}

export async function deleteReactionsForRound(gameRoundId: string): Promise<void> {
  try {
    const reactionsRef = collection(db, "gameRounds", gameRoundId, "reactions");
    const snapshot = await getDocs(reactionsRef);
    if (snapshot.empty) return;

    const batch = writeBatch(db);
    snapshot.docs.forEach((doc) => {
      batch.delete(doc.ref);
    });
    await batch.commit();
  } catch (error) {
    console.error("deleteReactionsForRound error:", error);
  }
}
