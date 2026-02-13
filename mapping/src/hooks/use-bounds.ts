"use client";

import { useReducer, useCallback } from "react";
import type { Bound, BoundsAction, BoundsState } from "@/lib/types";

function boundsReducer(state: BoundsState, action: BoundsAction): BoundsState {
  switch (action.type) {
    case "SET_ALL":
      return {
        present: action.bounds,
        past: [...state.past, state.present],
        future: [],
      };
    case "ADD":
      return {
        present: [...state.present, action.bound],
        past: [...state.past, state.present],
        future: [],
      };
    case "UPDATE": {
      const updated = state.present.map((b) =>
        b.id === action.id ? { ...b, ...action.patch } : b
      );
      return {
        present: updated,
        past: [...state.past, state.present],
        future: [],
      };
    }
    case "DELETE":
      return {
        present: state.present.filter((b) => b.id !== action.id),
        past: [...state.past, state.present],
        future: [],
      };
    case "UNDO": {
      if (state.past.length === 0) return state;
      const prev = state.past[state.past.length - 1];
      return {
        present: prev,
        past: state.past.slice(0, -1),
        future: [state.present, ...state.future],
      };
    }
    case "REDO": {
      if (state.future.length === 0) return state;
      const next = state.future[0];
      return {
        present: next,
        past: [...state.past, state.present],
        future: state.future.slice(1),
      };
    }
    default:
      return state;
  }
}

const initialState: BoundsState = {
  present: [],
  past: [],
  future: [],
};

export function useBounds() {
  const [state, dispatch] = useReducer(boundsReducer, initialState);

  const setAll = useCallback(
    (bounds: Bound[]) => dispatch({ type: "SET_ALL", bounds }),
    []
  );
  const addBound = useCallback(
    (bound: Bound) => dispatch({ type: "ADD", bound }),
    []
  );
  const updateBound = useCallback(
    (id: string, patch: Partial<Omit<Bound, "id">>) =>
      dispatch({ type: "UPDATE", id, patch }),
    []
  );
  const deleteBound = useCallback(
    (id: string) => dispatch({ type: "DELETE", id }),
    []
  );
  const undo = useCallback(() => dispatch({ type: "UNDO" }), []);
  const redo = useCallback(() => dispatch({ type: "REDO" }), []);

  return {
    bounds: state.present,
    canUndo: state.past.length > 0,
    canRedo: state.future.length > 0,
    setAll,
    addBound,
    updateBound,
    deleteBound,
    undo,
    redo,
  };
}
