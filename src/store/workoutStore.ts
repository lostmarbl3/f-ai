import { create } from "zustand";

type SetLog = {
  setId: string;
  reps: number;
  weight: number;
  rpe?: number;
};

type WorkoutState = {
  activeWorkout: string | null;
  setLogs: Record<string, SetLog[]>;
  updateSetLog: (setId: string, log: SetLog) => void;
  clearWorkout: () => void;
};

export const useWorkoutStore = create<WorkoutState>((set) => ({
  activeWorkout: null,
  setLogs: {},
  updateSetLog: (setId, log) =>
    set((state) => ({
      setLogs: {
        ...state.setLogs,
        [setId]: [...(state.setLogs[setId] || []), log],
      },
    })),
  clearWorkout: () =>
    set(() => ({
      activeWorkout: null,
      setLogs: {},
    })),
}));
