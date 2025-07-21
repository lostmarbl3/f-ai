import { useEffect, useState } from "react";
import { Program } from "../../types";
import { authService } from "../../services/authService";
import Spinner from "../ui/Spinner";

export default function SoloView() {
  const [programs, setPrograms] = useState<Program[] | null>(null);
  const [clientId, setClientId] = useState<string | null>(null);

  useEffect(() => {
    const auth = authService.getAuthState();
    if (auth?.role !== "solo") return;

    const id = auth.clientId;
    setClientId(id);

    const p = programService.getProgramsForClient(id);
    setPrograms(p);
  }, []);

  if (!programs || !clientId) return <Spinner />;

  return (
    <div className="p-4 text-white">
      <h1 className="text-2xl font-bold mb-2">Solo Training Mode</h1>
      <p className="mb-6">
        Use this space to track your own workouts. Select a program to get started.
      </p>
      <div className="space-y-4">
        {programs.map((p) => (
          <ProgramPreview key={p.id} program={p} />
        ))}
      </div>
    </div>
  );
}
