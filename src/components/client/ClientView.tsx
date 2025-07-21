import { useEffect, useState } from "react";
import { Client, Program, Workout } from "../../types";
import { authService } from "../../services/authService";
import { Spinner } from "../ui/Spinner";
import { ProgramPreview } from "../shared/ProgramPreview";

export default function ClientView() {
  const [programs, setPrograms] = useState<Program[] | null>(null);
  const [client, setClient] = useState<Client | null>(null);

  useEffect(() => {
    const auth = authService.getAuthState();
    if (auth?.role !== "client") return;

    const clientId = auth.clientId;
    const c = programService.getClientById(clientId);
    setClient(c);

    const assigned = programService.getProgramsForClient(clientId);
    setPrograms(assigned);
  }, []);

  if (!programs || !client) return <Spinner />;

  return (
    <div className="p-4 text-white">
      <h1 className="text-2xl font-bold mb-2">Welcome, {client.name}!</h1>
      <p className="mb-6">
        Below are your assigned programs. Select one to begin your workout.
      </p>
      <div className="space-y-4">
        {programs.map((p) => (
          <ProgramPreview key={p.id} program={p} />
        ))}
      </div>
    </div>
  );
}
