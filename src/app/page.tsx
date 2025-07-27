"use client";

import { HomeView } from "./components";
import { useHomeFacade } from "./Home.facade";

export default function HomePage() {
  const { onCreateRoom, onJoinRoom } = useHomeFacade();

  return <HomeView onCreateRoom={onCreateRoom} onJoinRoom={onJoinRoom} />;
}
