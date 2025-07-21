import React, { useEffect, useState } from "react";
import { Input } from "@/components/ui/Input";
import { Button } from "@/components/ui/Button";

type SetLog = {
  weight: number;
  reps: number;
  rpe: number;
  note: string;
  completed: boolean;
};

type SetProps = {
  setIndex: number;
  log: SetLog;
  onChange: (updated: Partial<SetLog>) => void;
};

const SetEntry: React.FC<SetProps> = ({ setIndex, log, onChange }) => {
  const [timerActive, setTimerActive] = useState(false);
  const [timeLeft, setTimeLeft] = useState(60); // default 60s rest

  useEffect(() => {
    if (!timerActive) return;
    const interval = setInterval(() => {
      setTimeLeft((prev) => {
        if (prev <= 1) {
          setTimerActive(false);
          return 0;
        }
        return prev - 1;
      });
    }, 1000);
    return () => clearInterval(interval);
  }, [timerActive]);

  const toggleTimer = () => {
    if (timerActive) {
      setTimerActive(false);
      setTimeLeft(60);
    } else {
      setTimerActive(true);
    }
  };

  return (
    <div className="bg-slate-800 p-4 rounded-md mb-4 text-white">
      <h3 className="text-lg font-semibold mb-2">Set {setIndex + 1}</h3>
      <div className="grid grid-cols-4 gap-4 mb-2">
        <Input
          type="number"
          step="0.1"
          placeholder="Weight"
          value={log.weight}
          onChange={(e) => onChange({ weight: parseFloat(e.target.value) })}
        />
        <Input
          type="number"
          placeholder="Reps"
          value={log.reps}
          onChange={(e) => onChange({ reps: parseInt(e.target.value) })}
        />
        <Input
          type="number"
          placeholder="RPE"
          value={log.rpe}
          onChange={(e) => onChange({ rpe: parseFloat(e.target.value) })}
        />
        <div className="flex items-center gap-2">
          <input
            type="checkbox"
            checked={log.completed}
            onChange={(e) => onChange({ completed: e.target.checked })}
            className="w-5 h-5 accent-blue-500"
          />
          <span>{timerActive ? `0:${timeLeft.toString().padStart(2, "0")}` : "Start"}</span>
        </div>
      </div>
      <textarea
        placeholder="Notes (how did it feel?)"
        value={log.note}
        onChange={(e) => onChange({ note: e.target.value })}
        className="w-full mt-2 p-2 rounded-md bg-slate-700 text-white border border-slate-600 focus:outline-none focus:ring-2 focus:ring-blue-400"
      />
      <Button onClick={toggleTimer} className="mt-2">
        {timerActive ? "Stop Timer" : "Start Timer"}
      </Button>
    </div>
  );
};

const AdminView: React.FC = () => {
  const { activeWorkout, updateSetLog } = useWorkoutStore();

  if (!activeWorkout) return <div className="text-white">No active workout</div>;

  return (
    <div className="p-6">
      <h2 className="text-2xl font-bold text-white mb-4">{activeWorkout.name}</h2>
      {activeWorkout.exercises.map((exercise, exIdx) => (
        <div key={exIdx} className="mb-8">
          <h3 className="text-xl font-semibold text-white mb-2">{exercise.name}</h3>
          {exercise.sets.map((set, setIdx) => (
            <SetEntry
              key={setIdx}
              setIndex={setIdx}
              log={set}
              onChange={(updated) => updateSetLog(exIdx, setIdx, updated)}
            />
          ))}
        </div>
      ))}
    </div>
  );
};

export default AdminView;
